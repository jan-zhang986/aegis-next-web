/**
 * Agent 流式展示 - 思维过程与工具调用
 * 参考 aegis-rag-frontend AgentStreamDisplay.vue
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Search, Globe, Wrench, FileText } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import type { ParsedCaseItem } from './CasePreviewAndSavePanel';

const TOOL_NAME_MAP: Record<string, string> = {
  search_knowledge: '知识库检索',
  knowledge_search: '知识库检索',
  grep_chunks: '文本模式搜索',
  web_search: '网络搜索',
  web_fetch: '网页抓取',
  get_document_info: '获取文档信息',
  list_knowledge_chunks: '查看知识分块',
  get_related_documents: '查找相关文档',
  get_document_content: '获取文档内容',
  todo_write: '计划管理',
  thinking: '深度思考',
};

function getToolLabel(name?: string): string {
  return (name && TOOL_NAME_MAP[name]) || name || '工具调用';
}

function getToolIcon(name?: string) {
  if (!name) return <Wrench className="w-3.5 h-3.5 text-primary/80" />;
  if (name === 'thinking') return <Brain className="w-3.5 h-3.5 text-primary/80" />;
  if (name === 'search_knowledge' || name === 'knowledge_search' || name === 'grep_chunks') return <Search className="w-3.5 h-3.5 text-primary/80" />;
  if (name === 'web_search' || name === 'web_fetch') return <Globe className="w-3.5 h-3.5 text-primary/80" />;
  return <FileText className="w-3.5 h-3.5 text-primary/80" />;
}

export interface AgentStreamEvent {
  type: 'thinking' | 'tool_call' | 'answer';
  event_id?: string;
  content?: string;
  done?: boolean;
  thinking?: boolean;
  tool_call_id?: string;
  tool_name?: string;
  tool_data?: Record<string, unknown>;
  display_type?: string;
  arguments?: unknown;
  output?: string;
  pending?: boolean;
  success?: boolean;
}

interface AgentStreamDisplayProps {
  events: AgentStreamEvent[];
  isStreaming?: boolean;
  /** JSON 用例预览回调（同步到预览 = 覆盖） */
  onJsonCasePreview?: (cases: ParsedCaseItem[]) => void;
  /** JSON 用例预览回调（追加到预览） */
  onJsonCaseAppend?: (cases: ParsedCaseItem[]) => void;
}

export function AgentStreamDisplay({ events, isStreaming, onJsonCasePreview, onJsonCaseAppend }: AgentStreamDisplayProps) {
  /** 用户手动收起的工具 id（默认全部展开，便于用户看到实时过程） */
  const [collapsedTools, setCollapsedTools] = useState<Set<string>>(new Set());
  const toggleTool = (id: string) => {
    setCollapsedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!events || events.length === 0) {
    if (isStreaming) {
      return (
        <div className="flex items-center gap-2.5 py-3 text-sm text-muted-foreground">
          <Brain className="w-4 h-4 text-primary/60 animate-pulse" />
          <span className="animate-pulse">思考中...</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((ev, idx) => {
        if (ev.type === 'thinking') {
          const content = (ev.content || '').trim();
          if (!content) return null;
          // thinking 事件在流式更新时也可能不完整
          return (
            <div
              key={ev.event_id || `thinking-${idx}`}
              className="rounded-lg bg-muted/20 dark:bg-muted/10 py-2 px-3 text-[14px] leading-[1.6] text-foreground/90"
            >
              <div className="markdown-content">
                <MarkdownContent
                  content={content}
                  isStreaming={isStreaming}
                  onJsonCasePreview={onJsonCasePreview}
                  onJsonCaseAppend={onJsonCaseAppend}
                />
              </div>
            </div>
          );
        }

        if (ev.type === 'tool_call') {
          const id = ev.tool_call_id || `tool-${idx}`;
          const label = ev.pending ? `正在调用 ${getToolLabel(ev.tool_name)}...` : getToolLabel(ev.tool_name);
          const expanded = !collapsedTools.has(id);
          const hasResults = !ev.pending && (ev.tool_data || ev.output);

          return (
            <div
              key={id}
              className="rounded-lg bg-muted/20 dark:bg-muted/10 overflow-hidden py-2 px-3"
            >
              <div
                className={`flex items-center justify-between gap-2 py-1 text-[13px] font-medium ${hasResults ? 'cursor-pointer hover:opacity-80' : ''
                  }`}
                onClick={() => hasResults && toggleTool(id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getToolIcon(ev.tool_name)}
                  <span className="truncate">{label}</span>
                </div>
                {hasResults && (expanded ? <ChevronUp className="w-4 h-4 shrink-0 text-primary/70" /> : <ChevronDown className="w-4 h-4 shrink-0 text-primary/70" />)}
              </div>
              {expanded && hasResults && (
                <div className="pt-3 mt-1 border-t border-border/50 text-[12px]">
                  {ev.tool_name === 'thinking' && Boolean(ev.tool_data?.thought) && (
                    <div className="markdown-content">
                      <MarkdownContent
                        content={String(ev.tool_data?.thought)}
                        isStreaming={isStreaming && ev.pending}
                        onJsonCasePreview={onJsonCasePreview}
                        onJsonCaseAppend={onJsonCaseAppend}
                      />
                    </div>
                  )}
                  {(ev.tool_name === 'search_knowledge' || ev.tool_name === 'knowledge_search') && Boolean((ev.tool_data as any)?.results) && (
                    <div className="text-muted-foreground">
                      找到 <strong className="text-foreground">{((ev.tool_data as any).results as any[]).length}</strong> 个结果
                    </div>
                  )}
                  {ev.tool_name === 'web_search' && ev.tool_data && (
                    <div className="text-muted-foreground">
                      找到 <strong className="text-foreground">{(ev.tool_data as any).results?.length ?? (ev.tool_data as any).count ?? 0}</strong> 个网络搜索结果
                    </div>
                  )}
                  {ev.output && (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-3 text-[11px] whitespace-pre-wrap break-words max-h-60 overflow-y-auto border border-border/30">
                      {typeof ev.output === 'string' ? ev.output : JSON.stringify(ev.output, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        }

        if (ev.type === 'answer' && (ev.content?.trim() || ev.done)) {
          const content = (ev.content || '').trim();
          if (!content) return null;
          // answer 事件还在流式更新中（isStreaming 且 ev.done 为 false）
          const isAnswerStreaming = isStreaming && !ev.done;
          return (
            <div key={`answer-${idx}`} className="text-[15px] leading-[1.7]">
              <div className="markdown-content">
                <MarkdownContent content={content} isStreaming={isAnswerStreaming} onJsonCasePreview={onJsonCasePreview} onJsonCaseAppend={onJsonCaseAppend} />
                {isAnswerStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm align-middle" />}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
