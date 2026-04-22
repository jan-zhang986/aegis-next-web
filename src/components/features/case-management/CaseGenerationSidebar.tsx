/**
 * 用例生成 - 左侧会话列表
 * 参考 Google Gemini 侧边栏风格
 */

import { useEffect, useState, useRef } from 'react';
import { Search, PenSquare, Trash2, Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { getSessionsList, deleteSession, type SessionItem } from '@/services/rag-chat';
import { toast } from 'sonner';

interface Props {
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  /** 会话标题覆盖（收到 session_title 事件时由父组件更新） */
  sessionTitleOverrides?: Record<string, string>;
  /** 为 true 时跳过自动选中首条会话（用户明确点击了「发起新对话」） */
  skipAutoSelect?: boolean;
  /** 是否收起侧边栏 */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function formatSessionTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return '今天';
  if (diff < 172800000) return '昨天';
  if (diff < 604800000) return '本周';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

export function CaseGenerationSidebar({ currentChatId, onSelectChat, onNewChat, sessionTitleOverrides, skipAutoSelect, collapsed, onCollapsedChange }: Props) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 30;
  const hasAutoSelectedRef = useRef(false);

  const loadSessions = async (p = 1, append = false) => {
    try {
      if (p === 1) setLoading(true);
      const { data, total } = await getSessionsList(p, pageSize);
      setSessions((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length >= pageSize);
    } catch (e: any) {
      toast.error(e?.message || '加载会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions(1);
  }, []);

  // 不再在首次进入时自动选中第一条会话，避免用户点击「用例生成」后直接进入某个历史会话而非新建对话界面。
  // 用户进入用例生成时始终先看到「发起新对话」，需要时再在侧边栏点击历史会话进入。
  // （若需恢复「有历史则自动打开最近会话」，可取消下方注释并删除本说明）
  // useEffect(() => {
  //   if (skipAutoSelect || loading || sessions.length === 0 || currentChatId !== null || hasAutoSelectedRef.current) return;
  //   hasAutoSelectedRef.current = true;
  //   onSelectChat(sessions[0].id);
  // }, [skipAutoSelect, loading, sessions, currentChatId, onSelectChat]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentChatId === id) onNewChat();
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    }
  };

  // 分组逻辑
  const groupedSessions = sessions.reduce((acc, session) => {
    const d = new Date(session.create_time || session.update_time || Date.now());
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let group = '更早';
    if (diffDays === 0) group = '今天';
    else if (diffDays === 1) group = '昨天';
    else if (diffDays <= 7) group = '近7天';

    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, SessionItem[]>);

  const groupOrder = ['今天', '昨天', '近7天', '更早'];

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 border-r border-border/60 bg-muted/20 dark:bg-muted/10 flex flex-col items-center py-3 gap-2">
        <button
          type="button"
          onClick={() => onCollapsedChange?.(false)}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          title="展开历史记录"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            hasAutoSelectedRef.current = true;
            onNewChat();
          }}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          title="发起新对话"
        >
          <PenSquare className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 border-r border-border/60 bg-muted/20 dark:bg-muted/10 flex flex-col">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            aria-label="搜索"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="text-sm">搜索</span>
          </button>
          <button
            type="button"
            onClick={() => onCollapsedChange?.(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            title="收起历史记录"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            hasAutoSelectedRef.current = true; // 阻止 auto-select 把用户拉回已有会话
            onNewChat();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted/80 text-foreground transition-colors text-sm font-medium border border-transparent hover:border-border/50 shadow-sm"
        >
          <PenSquare className="w-4 h-4 shrink-0" />
          发起新对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 border-t border-border/40 pt-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">暂无对话</p>
          </div>
        ) : (
          <div className="px-2 space-y-4 pb-4">
            {groupOrder.map(group => {
              const groupSessions = groupedSessions[group];
              if (!groupSessions || groupSessions.length === 0) return null;

              return (
                <div key={group} className="space-y-0.5">
                  <div className="px-3 pb-1.5 text-xs font-medium text-muted-foreground/70">{group}</div>
                  {groupSessions.map((s) => {
                    const isActive = currentChatId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectChat(s.id)}
                        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative ${isActive ? 'bg-muted/80 text-foreground shadow-sm' : 'hover:bg-muted/50 text-foreground/80 hover:text-foreground'
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${isActive ? 'font-medium' : ''}`}>
                            {(sessionTitleOverrides?.[s.id] ?? s.title) || '新对话'}
                          </div>
                        </div>
                        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(e, s.id);
                            }}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            aria-label="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
