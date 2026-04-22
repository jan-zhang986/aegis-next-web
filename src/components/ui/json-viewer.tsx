import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copyToClipboard } from '@/utils/clipboard';

interface JsonViewerProps {
  data: any;
  language?: string;
  showCopyButton?: boolean;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  language = 'json',
  showCopyButton = true 
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString =
    typeof data === 'string'
      ? data
      : (() => {
          try {
            return JSON.stringify(data, null, 2) ?? '';
          } catch {
            return String(data ?? '');
          }
        })();

  const handleCopy = async () => {
    const success = await copyToClipboard(jsonString);
    if (success) {
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  return (
    <div className="relative group">
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '12px',
          borderRadius: '0',
          fontSize: '12px',
          lineHeight: '1.5',
          background: '#ffffff',
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            userSelect: 'text',
            WebkitUserSelect: 'text',
          }
        }}
      >
        {jsonString}
      </SyntaxHighlighter>
    </div>
  );
};

