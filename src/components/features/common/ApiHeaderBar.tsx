/**
 * API 头部栏组件
 * 统一的头部栏，支持协议标签、名称编辑、操作按钮
 */

import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ApiHeaderBarProps {
  protocolLabel: string;
  protocolColor?: string;
  name: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  namePlaceholder?: string;
}

export function ApiHeaderBar({
  protocolLabel,
  protocolColor = 'text-cyan-500',
  name,
  onNameChange,
  onClose,
  namePlaceholder = '请输入名称',
}: ApiHeaderBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${protocolColor}`}>{protocolLabel}</span>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-7 w-48 text-sm"
            placeholder={namePlaceholder}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-2 h-2 rounded-full bg-green-500"></button>
          <button className="text-sm text-gray-600 hover:text-gray-900">
            <Plus className="w-4 h-4" />
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

