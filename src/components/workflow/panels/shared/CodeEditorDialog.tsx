import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { cn } from '@/utils/cn';

interface CodeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  language?: string;
  title?: string;
  placeholder?: string;
  onSave?: () => void;
}

export const CodeEditorDialog: React.FC<CodeEditorDialogProps> = ({
  open,
  onOpenChange,
  value,
  onChange,
  language = 'python',
  title = '编辑代码',
  placeholder = '',
  onSave,
}) => {
  const [editorValue, setEditorValue] = useState<string>('');

  // 当 Dialog 打开时，初始化编辑器内容
  useEffect(() => {
    if (open) {
      // 如果 value 有内容，使用 value；否则使用空字符串（不显示 placeholder）
      // 这样用户删除所有内容后，保存的是空字符串，下次打开时也是空字符串
      setEditorValue(value || '');
      
      // 移除背景中可能存在的焦点
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement !== document.body) {
        // 检查焦点元素是否在 Dialog 外部
        const dialogElement = document.querySelector('[data-slot="dialog-content"]');
        if (dialogElement && !dialogElement.contains(activeElement)) {
          activeElement.blur();
        }
      }
    }
  }, [open, value]);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col p-0 h-[55vh] max-h-[480px] min-h-[320px]'
        )}
        style={{
          width: 'min(720px, 90vw)',
          maxWidth: '720px',
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            代码编辑器，支持语法高亮和自动补全
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden bg-[#1e1e1e] px-1 py-1">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={editorValue}
            onChange={(newValue) => {
              const newVal = newValue || '';
              setEditorValue(newVal);
              onChange(newVal);
            }}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              folding: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 4,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
              parameterHints: {
                enabled: true,
              },
              bracketPairColorization: {
                enabled: true,
              },
              renderWhitespace: 'selection',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                <div className="text-sm text-gray-400">加载编辑器中...</div>
              </div>
            }
          />
        </div>

        <DialogFooter className="px-5 py-3 border-t shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

