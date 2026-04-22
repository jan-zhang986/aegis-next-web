import type { MessageRecord } from '@/services/notification';

interface MessageBoxListProps {
  renderList: MessageRecord[];
  unreadCount: number;
  onItemClick: (items: MessageRecord[]) => void;
  onViewMore?: () => void;
}

const MESSAGE_TYPE_LABELS: Record<number, string> = {
  0: '未开始',
  1: '已开通',
  2: '进行中',
  3: '即将到期',
};

export function MessageBoxList({ renderList, unreadCount, onItemClick, onViewMore }: MessageBoxListProps) {
  const handleItemClick = (item: MessageRecord) => {
    if (!item.status) {
      onItemClick([item]);
    }
  };

  const handleAllRead = () => {
    if (renderList.length) {
      onItemClick([...renderList]);
    }
  };

  return (
    <div className="flex flex-col">
      <ul className="border-t border-gray-200">
        {renderList.map((item) => (
          <li
            key={item.id}
            className="flex min-h-[86px] cursor-pointer items-start gap-2 border-b border-gray-100 px-3 py-2 transition-colors hover:bg-gray-50"
            style={{ opacity: item.status ? 0.5 : 1 }}
            onClick={() => handleItemClick(item)}
          >
            {item.avatar ? (
              <img src={item.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                <span className="text-xs">?</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-gray-900">{item.title}</span>
                {item.messageType !== undefined && (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${
                      item.messageType === 0
                        ? 'bg-gray-100 text-gray-600'
                        : item.messageType === 1
                          ? 'bg-green-100 text-green-700'
                          : item.messageType === 2
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {MESSAGE_TYPE_LABELS[item.messageType] ?? ''}
                  </span>
                )}
              </div>
              {item.subTitle && (
                <p className="mt-0.5 text-xs text-gray-500">{item.subTitle}</p>
              )}
              <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">{item.content}</p>
              {item.type === 'message' && item.time && (
                <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex border-t border-gray-200">
        <button
          type="button"
          className="flex-1 py-3 text-center text-sm text-blue-600 hover:bg-gray-50"
          onClick={handleAllRead}
        >
          全部已读
        </button>
        <button
          type="button"
          className="flex-1 border-l border-gray-200 py-3 text-center text-sm text-blue-600 hover:bg-gray-50"
          onClick={onViewMore}
        >
          查看更多
        </button>
      </div>
    </div>
  );
}
