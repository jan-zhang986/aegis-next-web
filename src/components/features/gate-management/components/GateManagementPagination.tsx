/**
 * 门禁管理 - 分页（与需求质量视图需求列表分页一致）
 */

import { useState, useEffect } from 'react';
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
import { generatePageNumbers } from '@/utils/pagination';
import { PAGE_SIZE } from '../constants/filter-options';
import { cn } from '@/utils/cn';

export interface GateManagementPaginationProps {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function GateManagementPagination({
  total,
  page,
  totalPages,
  onPageChange,
  className,
}: GateManagementPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const [jumpPage, setJumpPage] = useState(String(page));
  useEffect(() => {
    setJumpPage(String(page));
  }, [page]);

  const handleJumpToPage = () => {
    const n = parseInt(jumpPage, 10);
    if (Number.isNaN(n) || n < 1 || n > totalPages) {
      setJumpPage(String(page));
      return;
    }
    onPageChange(n);
  };

  if (total <= 0) return null;

  return (
    <div className={cn('flex items-center justify-between w-full px-2 py-2 text-sm text-gray-500', className)}>
      <span>
        共 {total} 条
        {total > 0 && (
          <>，第 {start}-{end} 条</>
        )}
      </span>
      {totalPages > 1 && (
        <div className="ml-auto flex items-center gap-3">
          <Pagination className="w-auto max-w-none justify-end">
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) onPageChange(page - 1);
                  }}
                  className={cn(
                    'h-9 w-9 p-0 [&>span]:hidden',
                    page <= 1 && 'pointer-events-none opacity-50',
                  )}
                  aria-label="上一页"
                />
              </PaginationItem>
              {generatePageNumbers(page, totalPages, 1).map((item, idx) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis className="h-9 w-9 text-gray-500" />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(item as number);
                      }}
                      isActive={page === item}
                      className={cn(
                        'h-9 w-9 p-0 flex items-center justify-center min-w-9',
                        page === item && 'pointer-events-none',
                      )}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) onPageChange(page + 1);
                  }}
                  className={cn(
                    'h-9 w-9 p-0 [&>span]:hidden',
                    page >= totalPages && 'pointer-events-none opacity-50',
                  )}
                  aria-label="下一页"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="flex items-center gap-1.5 text-gray-500">
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
              className="h-9 w-14 text-center text-sm border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="跳至页码"
            />
            <span className="text-sm whitespace-nowrap">/ {totalPages} 页</span>
          </div>
        </div>
      )}
    </div>
  );
}
