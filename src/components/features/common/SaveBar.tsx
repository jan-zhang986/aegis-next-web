/**
 * 保存操作栏组件
 * 统一的底部"执行 / 保存"操作栏
 */

import { Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveBarProps {
  onRun?: () => void;
  onSave: () => void;
  saving?: boolean;
  runLabel?: string;
  saveLabel?: string;
  showRun?: boolean;
  showBottomBorder?: boolean; // 是否显示底部边框
  runDisabled?: boolean; // 是否禁用运行按钮
}

export function SaveBar({
  onRun,
  onSave,
  saving = false,
  runLabel = '执行',
  saveLabel = '保存',
  showRun = true,
  showBottomBorder = false, // 默认不显示底部边框
  runDisabled = false, // 默认不禁用
}: SaveBarProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${showBottomBorder ? 'border-b-2 border-gray-300' : ''}`}>
      {showRun && onRun && (
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onRun}
          disabled={runDisabled}
        >
          <Play className="w-4 h-4 mr-1" />
          {runDisabled ? '发送中...' : runLabel}
        </Button>
      )}
      <Button 
        variant="outline"
        disabled={saving}
        onClick={onSave}
      >
        <Save className="w-4 h-4 mr-1" />
        {saving ? '保存中...' : saveLabel}
      </Button>
    </div>
  );
}

