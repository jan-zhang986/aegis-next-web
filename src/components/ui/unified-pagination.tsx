/**
 * 统一分页组件
 * 与测试计划/测试报告分页样式一致：共 X 条 | 每页显示 [Select] 条 | 页码 + 跳至 X 页
 *
 * 分页接口差异（由调用方适配）：
 * - 常见：current（或 page）+ pageSize，返回 total / totalCount
 * - Bug 管理：getBugList({ current, pageSize }) -> result.total
 * - 测试报告：loadRecords(current, pageSize) -> totalCount
 * - 测试计划详情：current + pageSize -> res.total
 * - 用例评审：current + pageSize，部分接口需 pageSize 必传避免 400
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export interface UnifiedPaginationProps {
  /** 总条数 */
  total: number;
  /** 当前页码（1-based） */
  currentPage: number;
  /** 每页条数 */
  pageSize: number;
  /** 页码变化回调 */
  onPageChange: (page: number) => void;
  /** 每页条数变化回调；不传则不显示「每页显示」选择器 */
  onPageSizeChange?: (size: number) => void;
  /** 每页条数选项，默认 [10, 20, 30, 40, 50] */
  pageSizeOptions?: number[];
  /** 单位文案，如 "条"、"条计划"、"条报告"、"条用例"，默认 "条" */
  unitLabel?: string;
  /** 展示的总数（用于筛选场景，与 total 不同时传入） */
  totalDisplay?: number;
  /** 容器类名 */
  className?: string;
  /** 无数据时是否隐藏整个分页栏，默认 true */
  hideWhenEmpty?: boolean;
}

export function UnifiedPagination({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  unitLabel = '条',
  totalDisplay,
  className,
  hideWhenEmpty = true,
}: UnifiedPaginationProps) {
  const [jumpToPage, setJumpToPage] = useState<string | number>('');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayTotal = totalDisplay ?? total;
  const canGoToPrev = currentPage > 1;
  const canGoToNext = currentPage < totalPages;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  const handleJumpToPage = () => {
    if (jumpToPage === '' || jumpToPage === 0) return;
    const pageNum = typeof jumpToPage === 'string' ? parseInt(jumpToPage, 10) : jumpToPage;
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPage('');
    } else {
      toast.error(`请输入有效的页码（1-${totalPages}）`);
      setJumpToPage('');
    }
  };

  const handleJumpToPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpToPage();
    }
  };

  if (hideWhenEmpty && total <= 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-[#f9fafb]/50 flex-shrink-0',
        className
      )}
    >
      <div className="flex items-center text-sm text-gray-500 flex-nowrap">
        <span className="whitespace-nowrap">共 <span className="font-medium text-gray-900 mx-1">{displayTotal}</span> {unitLabel}</span>
        {onPageSizeChange && (
          <>
            <div className="w-px h-4 bg-gray-200 mx-4 flex-shrink-0" />
            <span className="whitespace-nowrap flex-shrink-0">每页显示</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="inline-flex h-9 w-20 mx-2 border-gray-200 bg-white flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="whitespace-nowrap flex-shrink-0">条</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-6 min-w-0 flex-shrink">
        <Pagination className="w-auto m-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  'h-9 px-3 cursor-pointer hover:bg-white border-gray-200 transition-all',
                  !canGoToPrev && 'pointer-events-none opacity-40'
                )}
              />
            </PaginationItem>
            {(() => {
              const items: React.ReactNode[] = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              if (startPage > 1) {
                items.push(
                  <PaginationItem key={1}>
                    <PaginationLink
                      onClick={() => handlePageChange(1)}
                      isActive={currentPage === 1}
                      className={cn(
                        'h-9 w-9 cursor-pointer transition-all',
                        currentPage === 1
                          ? 'bg-[#165DFF] text-white hover:bg-[#165DFF]/90 border-[#165DFF]'
                          : 'hover:bg-white border-gray-200'
                      )}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                );
                if (startPage > 2)
                  items.push(
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis key="ellipsis-start-icon" />
                    </PaginationItem>
                  );
              }
              for (let i = startPage; i <= endPage; i++) {
                items.push(
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => handlePageChange(i)}
                      isActive={currentPage === i}
                      className={cn(
                        'h-9 w-9 cursor-pointer transition-all',
                        currentPage === i
                          ? 'bg-[#165DFF] text-white hover:bg-[#165DFF]/90 border-[#165DFF]'
                          : 'hover:bg-white border-gray-200'
                      )}
                    >
                      {i}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              if (endPage < totalPages) {
                if (endPage < totalPages - 1)
                  items.push(
                    <PaginationItem key="ellipsis-end">
                      <PaginationEllipsis key="ellipsis-end-icon" />
                    </PaginationItem>
                  );
                items.push(
                  <PaginationItem key={totalPages}>
                    <PaginationLink
                      onClick={() => handlePageChange(totalPages)}
                      isActive={currentPage === totalPages}
                      className={cn(
                        'h-9 w-9 cursor-pointer transition-all',
                        currentPage === totalPages
                          ? 'bg-[#165DFF] text-white hover:bg-[#165DFF]/90 border-[#165DFF]'
                          : 'hover:bg-white border-gray-200'
                      )}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return items;
            })()}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  'h-9 px-3 cursor-pointer hover:bg-white border-gray-200 transition-all',
                  !canGoToNext && 'pointer-events-none opacity-40'
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="flex items-center gap-2 pl-6 border-l border-gray-200">
          <span className="text-sm text-gray-500 whitespace-nowrap">跳至</span>
          <Input
            className="w-14 h-9 px-1 text-center border-gray-200 bg-white"
            value={jumpToPage}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') setJumpToPage('');
              else {
                const num = parseInt(val, 10);
                if (!isNaN(num)) setJumpToPage(num);
              }
            }}
            onKeyDown={handleJumpToPageKeyDown}
          />
          <span className="text-sm text-gray-500 whitespace-nowrap">页</span>
        </div>
      </div>
    </div>
  );
}
