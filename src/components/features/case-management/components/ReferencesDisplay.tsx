/**
 * 参考资料展示（参考 aegis-rag-frontend docInfo.vue）
 * 展示「参考了N个相关内容」的可折叠列表
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface KnowledgeReference {
  id?: string;
  knowledge_title?: string;
  chunk_type?: string;
  content?: string;
  metadata?: { url?: string; title?: string };
}

interface ReferencesDisplayProps {
  references: KnowledgeReference[];
  className?: string;
}

function getWebSearchUrl(item: KnowledgeReference): string {
  if (item.metadata?.url) return item.metadata.url;
  if (item.id && (String(item.id).startsWith('http://') || String(item.id).startsWith('https://'))) {
    return String(item.id);
  }
  return '#';
}

function getDisplayText(item: KnowledgeReference, index: number, total: number): string {
  const base = item.knowledge_title || item.metadata?.title || 'Web Search Result';
  if (item.chunk_type === 'web_search') {
    const url = getWebSearchUrl(item);
    if (url && url !== '#') {
      try {
        const u = new URL(url);
        return item.knowledge_title || item.metadata?.title || u.hostname;
      } catch {
        return base;
      }
    }
  }
  return total < 2 ? base : `${index + 1}.${base}`;
}

export function ReferencesDisplay({ references, className }: ReferencesDisplayProps) {
  const [expanded, setExpanded] = useState(true);

  if (!references?.length) return null;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg bg-muted/30 dark:bg-muted/20 py-2 px-3',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full py-1.5 text-left transition-colors rounded hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">
            参考了 {references.length} 个相关内容
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="pt-1 pb-1 flex flex-col gap-1.5 pl-6">
          {references.map((item, index) => (
            <ReferenceItem
              key={item.id ?? index}
              item={item}
              index={index}
              total={references.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReferenceItem({
  item,
  index,
  total,
}: {
  item: KnowledgeReference;
  index: number;
  total: number;
}) {
  const isWebSearch = item.chunk_type === 'web_search';
  const url = getWebSearchUrl(item);
  const text = getDisplayText(item, index, total);

  if (isWebSearch && url && url !== '#') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline truncate max-w-full block transition-colors"
      >
        {text}
      </a>
    );
  }

  return (
    <span className="text-xs text-muted-foreground truncate max-w-full block cursor-default">{text}</span>
  );
}
