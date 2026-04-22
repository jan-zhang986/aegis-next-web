/**
 * 用例编辑类型切换：步骤描述 / 文本描述
 * 从 spotter-metersphere stepDescription.vue 迁移
 */

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { CaseEditType } from '../types';

interface CaseEditTypeToggleProps {
  value: CaseEditType;
  onChange: (value: CaseEditType) => void;
  disabled?: boolean;
}

export function CaseEditTypeToggle({ value, onChange, disabled }: CaseEditTypeToggleProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="font-semibold text-gray-900">
        {value === 'STEP' ? '步骤描述' : '文本描述'}
        {value === 'STEP' && <span className="ml-1 text-red-500">*</span>}
      </div>
      {!disabled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              切换类型 <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => onChange('STEP')}
              className={value === 'STEP' ? 'bg-blue-50 text-blue-600' : ''}
            >
              步骤描述
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onChange('TEXT')}
              className={value === 'TEXT' ? 'bg-blue-50 text-blue-600' : ''}
            >
              文本描述
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
