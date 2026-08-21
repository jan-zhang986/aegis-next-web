/**
 * 用例生成 - 布局（侧边栏 + 主区域）
 * 参考 aegis-rag-frontend platform 布局
 */

import { useCallback, useEffect, useState } from 'react';
import { CaseGenerationSidebar } from './CaseGenerationSidebar';
import { CaseGenerationCreatChat } from './CaseGenerationCreatChat';
import { CaseGenerationChatView } from './CaseGenerationChatView';

interface Props {
  projectId?: string;
  spaceId?: string;
  chatId: string | null;
  firstQuery?: string | null;
  firstMentionedItems?: Array<{ id: string; name: string; type: string; kb_type?: string }> | null;
  firstModelId?: string | null;
  onChatIdChange: (id: string | null) => void;
  onParamsClear: () => void;
}

export function CaseGenerationLayout({
  projectId,
  spaceId,
  chatId,
  firstQuery,
  firstMentionedItems,
  firstModelId,
  onChatIdChange,
  onParamsClear,
}: Props) {
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [sessionTitleOverrides, setSessionTitleOverrides] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  /** 用户明确点击「发起新对话」，阻止 Sidebar 自动选中历史会话（即使用 key 导致 Sidebar 重挂载也能生效） */
  const [userWantsNewChat, setUserWantsNewChat] = useState(false);

  const handleNewChat = useCallback(() => {
    setUserWantsNewChat(true);
    onChatIdChange(null);
  }, [onChatIdChange]);

  const handleSelectChat = useCallback(
    (id: string) => {
      setUserWantsNewChat(false); // 用户主动选择会话，清除「新建对话」意图
      onChatIdChange(id);
    },
    [onChatIdChange]
  );

  const handleSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessionTitleOverrides((prev) => ({ ...prev, [sessionId]: title }));
  }, []);

  // 当 chatId 从 URL/外部变为非空时，清除「新建对话」意图
  useEffect(() => {
    if (chatId) setUserWantsNewChat(false);
  }, [chatId]);

  return (
    <div className="flex-1 flex min-h-0 bg-background">
      <CaseGenerationSidebar
        key={sidebarRefreshKey}
        currentChatId={chatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        sessionTitleOverrides={sessionTitleOverrides}
        skipAutoSelect={userWantsNewChat}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-muted/10 dark:bg-muted/5">
        {chatId ? (
          <CaseGenerationChatView
            projectId={projectId ?? localStorage.getItem('currentProjectId') ?? 'default-project'}
            spaceId={spaceId}
            chatId={chatId}
            firstQuery={firstQuery ?? undefined}
            firstMentionedItems={firstMentionedItems ?? undefined}
            firstModelId={firstModelId ?? undefined}
            onSessionTitle={handleSessionTitle}
          />
        ) : (
          <CaseGenerationCreatChat
            onSessionCreated={(id) => {
              setUserWantsNewChat(false);
              onChatIdChange(id);
              // 延迟 2 秒刷新侧边栏，避免与 ChatView 挂载/首条消息发送同时发生，减少“页面刷新/跳会话”的感知
              setTimeout(() => setSidebarRefreshKey((k) => k + 1), 2000);
            }}
          />
        )}
      </div>
    </div>
  );
}
