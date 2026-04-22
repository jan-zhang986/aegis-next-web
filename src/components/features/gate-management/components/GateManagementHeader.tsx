/**
 * 发布管理 - 页头（标题、说明与手动创建流水线按钮）
 */

import { Key, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GateManagementHeaderProps {
  onOpenCreate?: () => void;
}

export function GateManagementHeader({ onOpenCreate }: GateManagementHeaderProps) {
  return (
    <header className="px-6 pt-5 pb-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">发布管理</h1>
              <p className="text-sm text-gray-500">
                云效流水线记录在此展示，缺失的运维侧数据（需求ID、项目、环境、发布结果等）可在此补全。
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenCreate && (
            <Button type="button" size="sm" className="gap-1.5" onClick={onOpenCreate}>
              <Plus className="w-4 h-4" />
              手动创建流水线
            </Button>
          )}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
            <span className="rounded-full bg-gray-100 px-2 py-1">支持按项目/服务/状态筛选</span>
            <span className="rounded-full bg-gray-100 px-2 py-1">可在表格内快速补全</span>
          </div>
        </div>
      </div>
    </header>
  );
}
