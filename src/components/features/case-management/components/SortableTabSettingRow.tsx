/**
 * 显示设置 - 可拖拽的 Tab 设置行
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/cn';

interface SortableTabSettingRowProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SortableTabSettingRow({ id, label, checked, onCheckedChange }: SortableTabSettingRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors',
        isDragging ? 'bg-gray-50/80 border-gray-200 border-dashed shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
      )}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 p-0.5 -ml-0.5 rounded"
          {...attributes}
          {...listeners}
          aria-label="拖拽排序"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-[13px] text-gray-700 truncate">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
