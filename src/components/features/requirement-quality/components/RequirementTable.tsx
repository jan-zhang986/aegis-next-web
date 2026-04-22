/**
 * 需求质量视图 - 近期需求列表表格（分页，每页 20 条；表头支持点击排序）
 */

import { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { generatePageNumbers } from '@/utils/pagination';
import { cn } from '@/utils/cn';
import type { RequirementItem } from '../constants/requirement-list';
import { formatRate } from '../utils/format-rate';

/** 可排序列：与后端 sortBy 一致（需求名称、负责人、执行周期不可排序） */
export const SORTABLE_COLUMNS = [
  { key: 'caseExecutedCount', label: '执行用例数' },
  { key: 'executionRate', label: '执行率' },
  { key: 'firstPassRate', label: '首次通过率' },
  { key: 'defectCount', label: '缺陷数' },
  { key: 'reopenRate', label: '重开率' },
  { key: 'codeCoverage', label: '代码覆盖率' },
] as const;

export interface RequirementTableProps {
  requirements: RequirementItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onViewDetail: (id: string) => void;
  /** 当前排序字段（与 SORTABLE_COLUMNS[].key 一致） */
  sortBy?: string | null;
  /** 当前排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 点击表头排序：传入列 key，方向在内部切换 */
  onSort?: (columnKey: string) => void;
}

function SortHeader({
  label,
  columnKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
  align = 'left',
}: {
  label: string;
  columnKey: string;
  currentSortBy: string | null;
  currentSortOrder: 'asc' | 'desc';
  onSort: ((key: string) => void) | undefined;
  className?: string;
  align?: 'left' | 'center';
}) {
  const isActive = currentSortBy === columnKey;
  const Icon = isActive ? (currentSortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSort?.(columnKey);
  };
  return (
    <th
      className={cn(
        'py-3 px-4 text-gray-300 font-semibold',
        onSort && 'cursor-pointer select-none hover:text-white hover:bg-white/5 transition-colors',
        align === 'center' && 'text-center',
        className
      )}
      onClick={onSort ? handleClick : undefined}
      role={onSort ? 'button' : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {onSort && (
          <span className={cn('opacity-60', isActive && 'opacity-100')}>
            <Icon className="size-3.5" />
          </span>
        )}
      </span>
    </th>
  );
}

export function RequirementTable({
  requirements,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  selectedId,
  onSelect,
  onViewDetail,
  sortBy = null,
  sortOrder = 'desc',
  onSort,
}: RequirementTableProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  const [jumpPage, setJumpPage] = useState(String(page));
  useEffect(() => {
    setJumpPage(String(page));
  }, [page]);

  const handleSort = (columnKey: string) => {
    onSort?.(columnKey);
  };

  const handleJumpToPage = () => {
    const n = parseInt(jumpPage, 10);
    if (Number.isNaN(n) || n < 1 || n > totalPages) {
      setJumpPage(String(page));
      return;
    }
    onPageChange(n);
  };

  return (
    <div className="w-full space-y-3">
      <div className="w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-white/5">
            <tr className="border-b border-white/10">
              <th className="w-[14%] text-left py-3 px-4 text-gray-300 font-semibold">需求名称</th>
              <SortHeader
                label="执行用例数"
                columnKey="caseExecutedCount"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="w-[10%]"
                align="center"
              />
              <SortHeader
                label="执行率"
                columnKey="executionRate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="w-[8%]"
                align="center"
              />
              <SortHeader
                label="首次通过率"
                columnKey="firstPassRate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="w-[8%]"
                align="center"
              />
              <SortHeader
                label="缺陷数"
                columnKey="defectCount"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="w-[7%]"
                align="center"
              />
              <SortHeader
                label="重开率"
                columnKey="reopenRate"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="w-[8%]"
                align="center"
              />
              <th className="w-[8%] text-center py-3 px-4 text-gray-300 font-semibold">状态</th>
              <th className="w-[15%] text-center py-3 px-4 text-gray-300 font-semibold">执行周期</th>
              <th className="w-[12%] text-center py-3 px-4 text-gray-300 font-semibold">负责人</th>
              <SortHeader
                label="代码覆盖率"
                columnKey="codeCoverage"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                onSort={onSort}
                className="w-[10%]"
                align="center"
              />
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr
                key={req.id}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                  selectedId === req.id ? 'bg-blue-500/10' : ''
                }`}
                onClick={() => onSelect(req.id)}
                onDoubleClick={() => onViewDetail(req.id)}
              >
                <td className="py-3 px-4 overflow-hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    {selectedId === req.id && (
                      <div className="shrink-0 w-1 h-8 bg-blue-500 rounded-full" />
                    )}
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <span className="block min-w-0 cursor-default truncate text-white font-medium">
                          {req.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <p className="break-words">{req.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="text-white font-semibold">{req.executedCases}</div>
                  <div className="text-xs text-gray-400">/ {req.totalCases}</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-semibold ${
                      req.executionRate >= 80
                        ? 'text-green-400'
                        : req.executionRate >= 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {formatRate(req.executionRate)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-semibold ${
                      (req.firstPassRate ?? req.passRate) >= 95
                        ? 'text-green-400'
                        : (req.firstPassRate ?? req.passRate) >= 85
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {(req.firstPassRate ?? req.passRate) > 0 ? `${formatRate(req.firstPassRate ?? req.passRate)}%` : '-'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      (req.defectCount ?? 0) === 0
                        ? 'bg-gray-500/20 text-gray-400'
                        : (req.defectCount ?? 0) < 10
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {req.defectCount ?? 0}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {req.reopenRate != null ? (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        Number(req.reopenRate) === 0
                          ? 'bg-green-500/20 text-green-300'
                          : Number(req.reopenRate) < 20
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {Number(req.reopenRate).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
                      -
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      req.status === '执行中' || req.status === '进行中'
                        ? 'bg-blue-500/20 text-blue-300'
                        : req.status === '已完成'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-gray-400 text-xs whitespace-nowrap" title={req.periodRange ?? req.period}>
                  {req.period}
                </td>
                <td className="py-3 px-4 text-center text-gray-300 whitespace-nowrap" title={req.owner}>
                  {req.owner}
                </td>
                <td className="py-3 px-4 text-center">
                  <div
                    className={`font-semibold text-sm ${
                      (req.codeCoverageRate ?? 0) >= 85
                        ? 'text-green-400'
                        : (req.codeCoverageRate ?? 0) >= 70
                          ? 'text-yellow-400'
                          : (req.codeCoverageRate ?? 0) > 0
                            ? 'text-orange-400'
                            : 'text-gray-400'
                    }`}
                  >
                    {(req.codeCoverageRate ?? 0) > 0 ? `${Number(req.codeCoverageRate)}%` : '-'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between w-full px-2 py-2 text-sm text-gray-400">
        <span>
          共 {totalCount} 条
          {totalCount > 0 && (
            <>，第 {start}-{end} 条</>
          )}
        </span>
        {totalPages > 1 && (
          <div className="ml-auto flex items-center gap-3">
            <Pagination className="w-auto max-w-none justify-end">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) onPageChange(page - 1);
                    }}
                    href="#"
                    className={cn(
                      'h-9 w-9 p-0 bg-transparent border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 [&>span]:hidden',
                      page <= 1 && 'pointer-events-none opacity-50',
                    )}
                    aria-label="上一页"
                  />
                </PaginationItem>
                {generatePageNumbers(page, totalPages, 1).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="h-9 w-9 text-gray-400" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onPageChange(item);
                        }}
                        isActive={page === item}
                        className={cn(
                          'h-9 w-9 p-0 flex items-center justify-center bg-transparent border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 min-w-9',
                          page === item &&
                            'bg-white/10 text-white border-white/20 pointer-events-none',
                        )}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) onPageChange(page + 1);
                    }}
                    href="#"
                    className={cn(
                      'h-9 w-9 p-0 bg-transparent border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 [&>span]:hidden',
                      page >= totalPages && 'pointer-events-none opacity-50',
                    )}
                    aria-label="下一页"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="text-sm whitespace-nowrap">跳至</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onBlur={handleJumpToPage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJumpToPage();
                }}
                className="h-9 w-14 bg-white/5 border-white/10 text-white text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="跳至页码"
              />
              <span className="text-sm whitespace-nowrap">/ {totalPages} 页</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
