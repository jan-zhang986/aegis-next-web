/**
 * 手工知识编辑器
 * 从 aegis-rag-frontend manual-knowledge-editor.vue 迁移
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { knowledgeFileService } from '@/services/knowledge-base';
import { toast } from 'sonner';
import {
  Loader2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  FileText,
  Eye,
  Edit3,
  X,
  Save,
  Send
} from 'lucide-react';
import { cn } from '@/utils/cn';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Status = 'draft' | 'publish';

interface ManualKnowledgeEditorProps {
  open: boolean;
  mode: 'create' | 'edit';
  kbId: string;
  knowledgeId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialStatus?: Status;
  onClose: () => void;
  onSuccess: (payload: { kbId: string; knowledgeId: string; status: Status }) => void;
}

export function ManualKnowledgeEditor({
  open,
  mode,
  kbId,
  knowledgeId,
  initialTitle = '',
  initialContent = '',
  initialStatus = 'draft',
  onClose,
  onSuccess,
}: ManualKnowledgeEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadKnowledge = useCallback(async () => {
    if (mode !== 'edit' || !knowledgeId) return;
    setLoading(true);
    try {
      const res = await knowledgeFileService.getKnowledgeDetails(knowledgeId);
      const data = (res as any)?.data ?? res;
      if (data) {
        setTitle(data.title || data.file_name || '');
        setContent(data.content || data.raw_content || '');
        setStatus((data.status as Status) || 'draft');
      }
    } catch {
      setTitle(initialTitle);
      setContent(initialContent);
      setStatus(initialStatus);
    } finally {
      setLoading(false);
    }
  }, [mode, knowledgeId, initialTitle, initialContent, initialStatus]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && knowledgeId) {
        loadKnowledge();
      } else {
        setTitle(initialTitle);
        setContent(initialContent);
        setStatus(initialStatus);
      }
      setActiveTab('edit');
    }
  }, [open, mode, knowledgeId, initialTitle, initialContent, initialStatus, loadKnowledge]);

  const handleSubmit = async (targetStatus: Status) => {
    if (!title.trim()) {
      toast.warning('请输入标题');
      return;
    }
    if (!content.trim()) {
      toast.warning('请输入内容');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content, // Keep spaces for markdown
        status: targetStatus,
      };

      if (mode === 'create') {
        const res = await knowledgeFileService.createManualKnowledge(kbId, payload);
        const id = (res as any)?.data?.id ?? (res as any)?.id;
        if (id) {
          toast.success(targetStatus === 'publish' ? '已发布' : '草稿已保存');
          onSuccess({ kbId, knowledgeId: id, status: targetStatus });
          onClose();
        } else {
          throw new Error('创建失败');
        }
      } else if (knowledgeId) {
        await knowledgeFileService.updateManualKnowledge(knowledgeId, payload);
        toast.success(targetStatus === 'publish' ? '已发布' : '草稿已保存');
        onSuccess({ kbId, knowledgeId, status: targetStatus });
        onClose();
      }
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  // --- Toolbar Logic ---

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    setContent(newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertBlock = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Find start of line
    let lineStart = text.lastIndexOf('\n', start - 1) + 1;
    if (lineStart === -1) lineStart = 0;

    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const toolbarGroups = [
    {
      group: 'format',
      items: [
        { icon: Bold, label: '加粗', action: () => insertText('**', '**') },
        { icon: Italic, label: '斜体', action: () => insertText('*', '*') },
        { icon: Strikethrough, label: '删除线', action: () => insertText('~~', '~~') },
        { icon: Code, label: '行内代码', action: () => insertText('`', '`') },
      ]
    },
    {
      group: 'heading',
      items: [
        { icon: Heading1, label: '标题 1', action: () => insertBlock('# ') },
        { icon: Heading2, label: '标题 2', action: () => insertBlock('## ') },
        { icon: Heading3, label: '标题 3', action: () => insertBlock('### ') },
      ]
    },
    {
      group: 'list',
      items: [
        { icon: List, label: '无序列表', action: () => insertBlock('- ') },
        { icon: ListOrdered, label: '有序列表', action: () => insertBlock('1. ') },
        { icon: CheckSquare, label: '任务列表', action: () => insertBlock('- [ ] ') },
        { icon: Quote, label: '引用', action: () => insertBlock('> ') },
      ]
    },
    {
      group: 'insert',
      items: [
        { icon: Code, label: '代码块', action: () => insertText('\n```\n', '\n```\n') },
        { icon: LinkIcon, label: '链接', action: () => insertText('[链接文字](', ')') },
        { icon: ImageIcon, label: '图片', action: () => insertText('![图片描述](', ')') },
        { icon: TableIcon, label: '表格', action: () => insertText('\n| 表头1 | 表头2 |\n| --- | --- |\n| 内容1 | 内容2 |\n') },
        { icon: Minus, label: '分割线', action: () => insertText('\n---\n') },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'create' ? '新建手工知识' : '编辑手工知识'}
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm">正在加载...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-6 gap-4 h-full overflow-hidden">

              {/* Title & KB Info */}
              <div className="space-y-4 shrink-0">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">标题</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="请输入知识标题..."
                    className="h-10 text-base font-medium px-3 bg-white"
                    autoFocus={mode === 'create'}
                  />
                </div>
              </div>

              {/* Editor Container */}
              <div className="flex-1 flex flex-col bg-white rounded-lg border border-border shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="flex items-center p-2 border-b border-border gap-1 overflow-x-auto bg-gray-50/30">
                  <TooltipProvider delayDuration={0}>
                    {toolbarGroups.map((group, groupIndex) => (
                      <div key={group.group} className="flex items-center gap-0.5">
                        {groupIndex > 0 && <div className="w-px h-5 bg-gray-200 mx-1.5" />}
                        {group.items.map((item) => (
                          <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                onClick={item.action}
                                disabled={activeTab === 'preview'}
                              >
                                <item.icon className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{item.label}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ))}
                  </TooltipProvider>

                  <div className="flex-1" />

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 rounded-md p-0.5 border border-gray-200">
                    <button
                      onClick={() => setActiveTab('edit')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all",
                        activeTab === 'edit' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm transition-all",
                        activeTab === 'preview' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      预览
                    </button>
                  </div>
                </div>

                {/* Editor / Preview Area */}
                <div className="flex-1 overflow-hidden relative">
                  {activeTab === 'edit' ? (
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="在此输入内容，支持 Markdown 格式..."
                      className="w-full h-full p-4 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
                      style={{ fontFamily: 'Menlo, Monaco, "Courier New", monospace' }}
                    />
                  ) : (
                    <div className="w-full h-full p-6 overflow-y-auto prose prose-sm max-w-none prose-neutral">
                      {content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      ) : (
                        <div className="text-gray-400 text-center mt-10">暂无内容</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-white flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            {status === 'publish' && (
              <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                已发布
              </span>
            )}
            {status === 'draft' && (
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                草稿
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              保存草稿
            </Button>
            <Button
              onClick={() => handleSubmit('publish')}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              发布知识
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

