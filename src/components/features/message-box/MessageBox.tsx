import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageBoxList } from './MessageBoxList';
import { notificationService } from '@/services/notification';
import type { MessageRecord } from '@/services/notification';

const TAB_LIST = [
  { key: 'message', title: '消息' },
  { key: 'notice', title: '通知' },
  { key: 'todo', title: '待办' },
] as const;

interface MessageBoxProps {
  onViewMore?: () => void;
  onReadChange?: () => void;
}

export function MessageBox({ onViewMore, onReadChange }: MessageBoxProps) {
  const [messageType, setMessageType] = useState<string>('message');
  const [messageList, setMessageList] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.queryMessageList();
      setMessageList(Array.isArray(data) ? data : []);
    } catch {
      setMessageList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const renderList = messageList.filter((item) => messageType === item.type);
  const unreadCount = renderList.filter((item) => !item.status).length;

  const handleItemClick = async (items: MessageRecord[]) => {
    if (!items.length) return;
    try {
      await notificationService.setMessageStatus({ ids: items.map((i) => i.id) });
      await fetchList();
      onReadChange?.();
    } catch {
      // 静默失败，可后续加 toast
    }
  };

  const emptyList = () => {
    setMessageList([]);
  };

  const formatUnread = (key: string) => {
    const count = messageList.filter((item) => item.type === key && !item.status).length;
    return count ? ` (${count})` : '';
  };

  return (
    <div className="min-w-[400px]">
      <Tabs value={messageType} onValueChange={setMessageType} className="w-full">
        <div className="flex items-center justify-between border-b border-gray-200 px-3 pt-3">
          <TabsList className="h-8">
            {TAB_LIST.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="px-3 text-xs">
                {tab.title}
                {formatUnread(tab.key)}
              </TabsTrigger>
            ))}
          </TabsList>
          <button
            type="button"
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={emptyList}
          >
            清空
          </button>
        </div>
        <TabsContent value={messageType} className="mt-0 max-h-[360px] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              加载中...
            </div>
          ) : !renderList.length ? (
            <div className="py-12 text-center text-sm text-gray-500">暂无内容</div>
          ) : (
            <MessageBoxList
              renderList={renderList}
              unreadCount={unreadCount}
              onItemClick={handleItemClick}
              onViewMore={onViewMore}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
