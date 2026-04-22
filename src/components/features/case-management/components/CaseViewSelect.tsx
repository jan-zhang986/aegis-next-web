/**
 * 测试用例 - 视图选择
 * 参考 spotter-metersphere ms-advance-filter 视图下拉
 * 系统视图：全部数据、我关注的、我创建的
 * 我的视图：用户保存的自定义视图
 */

import { ChevronUp, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type SystemViewId = 'all_data' | 'my_follow' | 'my_create';

export interface ViewItem {
  id: string;
  name: string;
  internal?: boolean;
}

const SYSTEM_VIEWS: ViewItem[] = [
  { id: 'all_data', name: '全部数据', internal: true },
  { id: 'my_follow', name: '我关注的', internal: true },
  { id: 'my_create', name: '我创建的', internal: true },
];

interface CaseViewSelectProps {
  value: string;
  customViews?: ViewItem[];
  onValueChange: (id: string) => void;
  onNewView?: () => void;
  disabled?: boolean;
}

export function CaseViewSelect({
  value,
  customViews = [],
  onValueChange,
  onNewView,
  disabled,
}: CaseViewSelectProps) {
  const currentName = SYSTEM_VIEWS.find((v) => v.id === value)?.name
    ?? customViews.find((v) => v.id === value)?.name
    ?? '全部数据';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 text-xs w-[145px] justify-between bg-white border-gray-200"
        >
          <span className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-gray-400 flex-shrink-0">视图</span>
            <span className="truncate">{currentName}</span>
          </span>
          <ChevronUp className="w-3.5 h-3.5 shrink-0 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[180px] p-0">
        <div className="py-1">
          <div className="px-3 py-1.5 text-xs font-medium text-blue-600 border-b border-gray-100">
            系统视图
          </div>
          {SYSTEM_VIEWS.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50/80 transition-colors',
                value === item.id && 'bg-blue-50/80 text-blue-600'
              )}
              onClick={() => onValueChange(item.id)}
            >
              <span className="truncate text-sm">{item.name}</span>
            </div>
          ))}

          <div className="px-3 py-1.5 text-xs font-medium text-blue-600 border-t border-b border-gray-100 mt-1">
            我的视图
          </div>
          {customViews.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">暂无自定义视图</div>
          ) : (
            customViews.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50/80 transition-colors',
                  value === item.id && 'bg-blue-50/80 text-blue-600'
                )}
                onClick={() => onValueChange(item.id)}
              >
                <span className="truncate text-sm">{item.name}</span>
              </div>
            ))
          )}

          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50/80 transition-colors text-sm text-gray-600"
            onClick={onNewView}
          >
            <Plus className="w-4 h-4 text-blue-500" />
            <span>新建视图</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
