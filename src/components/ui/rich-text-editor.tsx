/**
 * 富文本编辑器
 * 基于 TipTap，支持加粗、斜体、标题、列表、图片等
 * 参考 aegis-next-web：支持粘贴/拖拽图片，uploadImage 上传后插入
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Heading2, Minus, Redo, Undo, ImageIcon, Maximize2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { http } from '@/utils/request';
import { ImagePreview } from '@/components/ui/image-preview';

const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

/** 支持 width 的 Image 扩展，便于控制图片大小（style max-width 支持百分比） */
const ImageWithSize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('width') || (el as HTMLElement).style?.maxWidth || null,
        renderHTML: (attrs) => (attrs.width ? { style: `max-width: ${attrs.width}` } : {}),
      },
    };
  },
});

function toAuthRequestPath(src: string): string {
  if (!src?.trim()) return '';
  try {
    if (src.startsWith('http')) {
      const u = new URL(src);
      if (u.pathname.includes('/attachment/')) return `${API_PREFIX}${u.pathname}`;
    } else if (src.startsWith('/attachment/')) {
      return `${API_PREFIX}${src}`;
    }
  } catch {
    /* ignore */
  }
  return '';
}

function isEmptyHtml(html: string): boolean {
  if (!html?.trim()) return true;
  // 仅包含图片等标签时也视为「有内容」（不能当成空）
  if (/<img[\s\S]*?>/i.test(html)) return false;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return !stripped;
}

function toTiptapContent(value: string): string | undefined {
  if (!value?.trim()) return undefined;
  // 纯文本转为段落
  if (!value.includes('<')) return `<p>${value.replace(/\n/g, '</p><p>')}</p>`;
  return value;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
  /** 编辑器高度类名 */
  editorClassName?: string;
  /** 上传图片：接收 File，返回图片 URL（用于插入 img src）。不传则粘贴/拖拽图片不处理 */
  uploadImage?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = '请输入内容…',
  minHeight = '120px',
  disabled = false,
  className,
  editorClassName,
  uploadImage,
}: RichTextEditorProps) {
  const uploadImageRef = useRef(uploadImage);
  const editorRef = useRef<{ chain: () => any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  uploadImageRef.current = uploadImage;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      ImageWithSize.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { loading: 'lazy', class: 'max-w-full h-auto rounded cursor-pointer' },
      }),
    ],
    content: toTiptapContent(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          'tiptap-editor focus:outline-none min-h-[80px] px-3 py-2 text-sm',
          editorClassName
        ),
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const files = items.map((i) => i.getAsFile()).filter((f): f is File => !!f && f.type.startsWith('image/'));
        if (files.length === 0 || !uploadImageRef.current) return false;
        event.preventDefault();
        const pos = view.state.selection.from;
        files.forEach((file, i) => {
          const insertPos = i === 0 ? pos : pos + i; // 多图时粗略估算位置
          uploadImageRef.current!(file)
            .then((url) => {
              if (url && editorRef.current) {
                editorRef.current.chain().focus().insertContentAt(insertPos, { type: 'image', attrs: { src: url } }).run();
              }
            })
            .catch((err) => {
              toast.error(err?.message || '图片上传失败');
            });
        });
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0 || !uploadImageRef.current) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!coords) return true;
        files.forEach((file, i) => {
          uploadImageRef.current!(file)
            .then((url) => {
              if (url && editorRef.current) {
                editorRef.current.chain().focus().insertContentAt(coords.pos + i, { type: 'image', attrs: { src: url } }).run();
              }
            })
            .catch((err) => {
              toast.error(err?.message || '图片上传失败');
            });
        });
        return true;
      },
    },
  });

  const handleUpdate = useCallback(() => {
    if (!editor || !onChange) return;
    const html = editor.getHTML();
    const out = isEmptyHtml(html) ? '' : html;
    onChange(out);
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, handleUpdate]);

  // 受控：外部 value 变化时同步到编辑器（如表单重置）
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const target = toTiptapContent(value) ?? '<p></p>';
    if (current !== target) {
      editor.commands.setContent(target, false);
    }
  }, [editor, value]);

  useEffect(() => {
    editorRef.current = editor ? ({ chain: () => editor.chain() } as { chain: () => any }) : null;
  }, [editor]);

  // 编辑时 /attachment/ 图片需鉴权：通过 http 拉取后转 blob URL 显示，与 HtmlContent 一致
  const blobUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    if (!editor?.view?.dom) return;
    const container = editor.view.dom;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const imgs = container.querySelectorAll<HTMLImageElement>('img[src]');
      imgs.forEach((img) => {
        const src = img.getAttribute('src');
        const requestPath = toAuthRequestPath(src || '');
        if (!requestPath || src?.startsWith('blob:')) return;
        http.get<Blob>(requestPath, { responseType: 'blob' })
          .then((blob) => {
            if (cancelled) return;
            const blobUrl = URL.createObjectURL(blob as unknown as Blob);
            blobUrlsRef.current.push(blobUrl);
            img.src = blobUrl;
          })
          .catch(() => {});
      });
    };
    run();
    editor.on('update', run);
    return () => {
      cancelled = true;
      editor.off('update', run);
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, [editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-md border border-gray-200 bg-gray-50 animate-pulse',
          className
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={cn('rounded-md border border-gray-200 bg-white overflow-hidden', className)}>
      {/* 工具栏 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="加粗"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="标题"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-4 bg-gray-200 mx-0.5" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分割线"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        {uploadImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file || !uploadImageRef.current) return;
                uploadImageRef.current(file)
                  .then((url) => {
                    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
                  })
                  .catch((err) => {
                    toast.error(err?.message || '图片上传失败');
                  });
              }}
            />
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title="插入图片"
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
        <span className="w-px h-4 bg-gray-200 mx-0.5" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="撤销"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="重做"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
      {/* 编辑区域：双击图片打开预览 */}
      <div
        className="overflow-auto"
        style={{ minHeight }}
        onDoubleClick={(e) => {
          const target = (e.target as HTMLElement).closest('img');
          if (target?.src) setPreviewSrc(target.src);
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {editor && previewSrc && (
        <ImagePreview
          src={previewSrc}
          open={!!previewSrc}
          onOpenChange={(open) => !open && setPreviewSrc(null)}
        />
      )}
      {editor && (
        <>
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="flex items-center gap-0.5 p-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
          </BubbleMenu>
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            shouldShow={({ state }) => {
              const sel = state.selection as { node?: { type?: { name?: string } } };
              return !!sel?.node?.type?.name && sel.node.type.name === 'image';
            }}
            className="flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <span className="text-xs text-gray-500 pr-1">尺寸</span>
            {(['25%', '50%', '75%', '100%'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => editor.chain().focus().updateAttributes('image', { width: w }).run()}
                className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700"
              >
                {w}
              </button>
            ))}
            <button
              type="button"
              onClick={() => editor.chain().focus().updateAttributes('image', { width: null }).run()}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-600 flex items-center gap-1"
              title="原始大小"
            >
              <Maximize2 className="w-3 h-3" />
              原始
            </button>
            <button
              type="button"
              onClick={() => {
                const attrs = editor.getAttributes('image');
                const src = attrs?.src;
                if (src) setPreviewSrc(src);
              }}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-600 flex items-center gap-1"
              title="预览"
            >
              <Search className="w-3 h-3" />
              预览
            </button>
          </BubbleMenu>
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        active && 'bg-gray-200 text-gray-900'
      )}
    >
      {children}
    </button>
  );
}
