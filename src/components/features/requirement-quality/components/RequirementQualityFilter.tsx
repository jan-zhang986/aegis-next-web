/**
 * 需求质量看板 - 筛选区（项目、需求列表、状态、执行周期，接入后端 filter-options）
 * 需求列表：Popover + 搜索框模糊查询 + 可滚动列表；执行周期：日期范围选择
 */

import { useMemo, useState } from 'react';
import { CheckIcon, ChevronDownIcon, Filter, Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import type { DateRange } from 'react-day-picker';
import { zhCN } from 'date-fns/locale';

export interface FilterOptionItem {
  id: string;
  name: string;
}

export interface RequirementQualityFilterProps {
  /** 已选项目ID列表，空=全部项目 */
  projectIds: string[];
  requirementListValue: string;
  statusValue: string;
  /** 执行周期：开始/结束时间戳(毫秒)，用于与后端重叠区间筛选 */
  executionPeriodStart?: number | null;
  executionPeriodEnd?: number | null;
  projectOptions: FilterOptionItem[];
  requirementOptions: FilterOptionItem[];
  statusOptions: FilterOptionItem[];
  onProjectIdsChange: (ids: string[]) => void;
  onRequirementListChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  /** 执行周期变更：传 [startMs, endMs] 或 null 表示清空 */
  onExecutionPeriodChange: (range: { start: number; end: number } | null) => void;
}

const ALL_PROJECT = { id: 'all', name: '全部项目' };
const ALL_REQUIREMENT = { id: 'all', name: '全部需求' };
const ALL_STATUS = { id: 'all', name: '全部' };

function toDateRange(startMs?: number | null, endMs?: number | null): DateRange | undefined {
  if (startMs == null && endMs == null) return undefined;
  const from = startMs != null ? new Date(startMs) : undefined;
  const to = endMs != null ? new Date(endMs) : undefined;
  if (!from && !to) return undefined;
  return { from: from ?? to, to: to ?? from };
}

function startOfDay(d: Date): number {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t.getTime();
}

function endOfDay(d: Date): number {
  const t = new Date(d);
  t.setHours(23, 59, 59, 999);
  return t.getTime();
}

export function RequirementQualityFilter({
  projectIds,
  requirementListValue,
  statusValue,
  executionPeriodStart,
  executionPeriodEnd,
  projectOptions,
  requirementOptions,
  statusOptions,
  onProjectIdsChange,
  onRequirementListChange,
  onStatusChange,
  onExecutionPeriodChange,
}: RequirementQualityFilterProps) {
  const requirements = [ALL_REQUIREMENT, ...requirementOptions];
  const statuses = [ALL_STATUS, ...statusOptions];

  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [requirementPopoverOpen, setRequirementPopoverOpen] = useState(false);
  const [requirementSearch, setRequirementSearch] = useState('');
  const [executionPeriodPopoverOpen, setExecutionPeriodPopoverOpen] = useState(false);
  const periodRange = toDateRange(executionPeriodStart, executionPeriodEnd);
  const periodLabel =
    periodRange?.from && periodRange?.to
      ? `${periodRange.from.toLocaleDateString('zh-CN')} — ${periodRange.to.toLocaleDateString('zh-CN')}`
      : '执行周期';

  const filteredRequirements = useMemo(() => {
    const kw = requirementSearch.trim().toLowerCase();
    if (!kw) return requirements;
    return requirements.filter((r) => r.name.toLowerCase().includes(kw));
  }, [requirements, requirementSearch]);

  const currentRequirementName =
    requirementListValue === 'all'
      ? '全部需求'
      : requirements.find((r) => r.id === requirementListValue)?.name ?? requirementListValue;

  const handleRequirementSelect = (id: string) => {
    onRequirementListChange(id);
    setRequirementPopoverOpen(false);
    setRequirementSearch('');
  };

  const projectLabel =
    projectIds.length === 0
      ? '全部项目'
      : projectIds.length <= 2
        ? projectOptions
            .filter((p) => projectIds.includes(p.id))
            .map((p) => p.name)
            .join('、')
        : `已选 ${projectIds.length} 项`;

  const toggleProject = (id: string) => {
    if (id === 'all') {
      onProjectIdsChange([]);
      return;
    }
    if (projectIds.includes(id)) {
      onProjectIdsChange(projectIds.filter((x) => x !== id));
    } else {
      onProjectIdsChange([...projectIds, id]);
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <label className="text-sm text-gray-400 whitespace-nowrap">项目</label>
        <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-9 min-w-[160px] max-w-[280px] items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10',
                'overflow-hidden [&>span]:min-w-0 [&>span]:truncate',
              )}
              aria-label="选择项目"
              title={projectLabel}
            >
              <span className="truncate">{projectLabel}</span>
              <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] min-w-[200px] max-w-[min(20rem,100vw)] p-0 bg-[#1a2744] border-white/10 text-white"
            align="start"
          >
            <div className="max-h-[280px] overflow-y-auto overflow-x-hidden p-1 scrollbar-theme-dark-blue">
              <button
                type="button"
                className={cn(
                  'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-sm outline-none hover:bg-white/10 focus:bg-white/10',
                  projectIds.length === 0 && 'bg-white/10',
                )}
                onClick={() => {
                  onProjectIdsChange([]);
                  setProjectPopoverOpen(false);
                }}
              >
                <span className="block min-w-0 flex-1 truncate">{ALL_PROJECT.name}</span>
                {projectIds.length === 0 && (
                  <span className="absolute right-2 flex size-3.5 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </button>
              {projectOptions.map((opt) => {
                const checked = projectIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-sm outline-none hover:bg-white/10 focus:bg-white/10',
                      checked && 'bg-white/10',
                    )}
                    onClick={() => toggleProject(opt.id)}
                  >
                    <span className="block min-w-0 flex-1 truncate" title={opt.name}>
                      {opt.name}
                    </span>
                    {checked && (
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        <CheckIcon className="size-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[400px]">
        <label className="text-sm text-gray-400 whitespace-nowrap shrink-0">需求列表</label>
        <Popover open={requirementPopoverOpen} onOpenChange={setRequirementPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-9 min-w-[280px] max-w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10',
                'overflow-hidden [&>span]:min-w-0 [&>span]:truncate',
              )}
              aria-label="选择需求列表"
              title={currentRequirementName}
            >
              <span className="truncate">{currentRequirementName}</span>
              <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(24rem,100vw)] p-0 bg-[#1a2744] border-white/10 text-white"
            align="start"
          >
            <div className="p-2 border-b border-white/10">
              <Input
                placeholder="输入关键词筛选"
                value={requirementSearch}
                onChange={(e) => setRequirementSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-9 bg-white/5 border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto overflow-x-hidden p-1 scrollbar-theme-dark-blue">
              {filteredRequirements.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">无匹配需求</div>
              ) : (
                filteredRequirements.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-sm outline-none hover:bg-white/10 focus:bg-white/10',
                      opt.id === requirementListValue && 'bg-white/10',
                    )}
                    onClick={() => handleRequirementSelect(opt.id)}
                  >
                    <span className="block min-w-0 flex-1 truncate" title={opt.name}>
                      {opt.name}
                    </span>
                    {opt.id === requirementListValue && (
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        <CheckIcon className="size-4" />
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400 whitespace-nowrap">状态</label>
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger
            className="w-[160px] h-9 bg-white/5 border-white/10 text-white hover:bg-white/10"
            aria-label="选择状态"
          >
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent
            className="bg-[#1a2744] border-white/10 text-white max-h-[280px] overflow-y-auto scrollbar-theme-dark-blue"
            position="popper"
          >
            {statuses.map((opt) => (
              <SelectItem
                key={opt.id}
                value={opt.id}
                className="text-white focus:bg-white/10 focus:text-white"
              >
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400 whitespace-nowrap">执行周期</label>
        <Popover open={executionPeriodPopoverOpen} onOpenChange={setExecutionPeriodPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10',
              )}
              aria-label="选择执行周期"
            >
              <CalendarIcon className="size-4 shrink-0 text-gray-400" />
              <span className="truncate">{periodLabel}</span>
              <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-[#1a2744] border-white/10 text-white"
            align="start"
          >
            <Calendar
              mode="range"
              locale={zhCN}
              selected={periodRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onExecutionPeriodChange({
                    start: startOfDay(range.from),
                    end: endOfDay(range.to),
                  });
                  setExecutionPeriodPopoverOpen(false);
                } else if (range?.from) {
                  onExecutionPeriodChange({
                    start: startOfDay(range.from),
                    end: endOfDay(range.from),
                  });
                }
              }}
              numberOfMonths={2}
              className="rounded-md border-0 bg-transparent text-white"
            />
            <div className="border-t border-white/10 p-2 flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white"
                onClick={() => {
                  onExecutionPeriodChange(null);
                  setExecutionPeriodPopoverOpen(false);
                }}
              >
                清空
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
