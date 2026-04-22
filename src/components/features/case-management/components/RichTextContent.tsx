/**
 * 富文本内容渲染
 * 兼容 HTML（TipTap）与 Markdown/纯文本
 */

import { MarkdownContent } from './MarkdownContent';
import { HtmlContent } from './HtmlContent';

interface RichTextContentProps {
  content?: string | null;
  className?: string;
}

/** 判断是否为 HTML 内容（TipTap 或带样式的富文本） */
function isHtml(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith('<')) return false;
  const htmlLike =
    /<\/?(p|span|div|a|strong|em|ul|ol|li|h[1-6]|br|hr|b|i|u|img)\b/i.test(trimmed) ||
    trimmed.includes('</') ||
    trimmed.includes('/>') ||
    trimmed.includes('<img');
  return htmlLike;
}

export function RichTextContent({ content, className }: RichTextContentProps) {
  if (!content?.trim()) {
    return <span className="text-gray-400">-</span>;
  }
  if (isHtml(content)) {
    return <HtmlContent content={content} className={className} />;
  }
  return <MarkdownContent content={content} className={className} />;
}
