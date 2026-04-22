/**
 * 门禁管理 - 统一表单项框（带边框、背景，标签 + 控件，展示更明显）
 */

import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';

export interface FormFieldBoxProps {
  /** 表单项标签 */
  label: React.ReactNode;
  /** 表单项控件 */
  children: React.ReactNode;
  className?: string;
  /** 是否紧凑（筛选栏用） */
  compact?: boolean;
  /** 是否必填（显示红色 *） */
  required?: boolean;
  /** 校验错误信息，显示在标签下方 */
  error?: string;
}

export function FormFieldBox({ label, children, className, compact, required, error }: FormFieldBoxProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-gray-50/50 space-y-1.5',
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
        error && 'border-red-200 bg-red-50/30',
        className
      )}
    >
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {compact ? <div className="min-h-9 flex items-center">{children}</div> : children}
    </div>
  );
}
