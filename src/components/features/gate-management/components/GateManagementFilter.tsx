/**
 * 发布管理 - 筛选区（与任务管理/拨测管理统一：单行紧凑、占位符、竖线分隔）
 */

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { DEPLOY_RESULT_OPTIONS } from '../constants/filter-options';

export interface GateManagementFilterProps {
  deployResult: string;
  setDeployResult: (v: string) => void;
  projectId: string;
  setProjectId: (v: string) => void;
  repoName: string;
  setRepoName: (v: string) => void;
  projectOptions: { id: string; name: string }[];
  onSearch: () => void;
  onRefresh: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  loading: boolean;
}

export function GateManagementFilter({
  deployResult,
  setDeployResult,
  projectId,
  setProjectId,
  repoName,
  setRepoName,
  projectOptions,
  onSearch,
  onRefresh,
  onReset,
  hasActiveFilters,
  loading,
}: GateManagementFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <Select value={deployResult || 'all'} onValueChange={(v) => setDeployResult(v === 'all' ? '' : v)}>
        <SelectTrigger className="h-9 w-[120px] rounded-lg border-gray-200">
          <SelectValue placeholder="状态" />
        </SelectTrigger>
        <SelectContent>
          {DEPLOY_RESULT_OPTIONS.map((opt) => (
            <SelectItem key={opt.id || 'all'} value={opt.id || 'all'}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={projectId || 'all'} onValueChange={(v) => setProjectId(v === 'all' ? '' : v)}>
        <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200">
          <SelectValue placeholder="项目" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto overflow-x-hidden" position="popper">
          <SelectItem value="all">全部项目</SelectItem>
          {projectOptions.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-9 w-[200px] rounded-lg border-gray-200"
        placeholder="代码仓库名称"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <div className="h-8 w-px bg-gray-200 shrink-0" aria-hidden />
      <Button size="sm" className="rounded-lg h-9" onClick={onSearch}>
        查询
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg h-9 gap-1"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        刷新
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg h-9"
        onClick={onReset}
        disabled={!hasActiveFilters}
      >
        重置
      </Button>
    </div>
  );
}
