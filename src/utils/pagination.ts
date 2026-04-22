/**
 * 分页工具函数
 * 生成页码数组，支持省略号显示
 */

export type PageNumber = number | 'ellipsis';

/**
 * 生成分页页码数组
 * @param currentPage 当前页码
 * @param totalPages 总页数
 * @param delta 当前页前后显示的页数，默认为 1（显示当前页 ±1 页）
 * @returns 页码数组，包含数字和 'ellipsis'（省略号）
 * 
 * @example
 * generatePageNumbers(5, 11, 1) // [1, 'ellipsis', 4, 5, 6, 'ellipsis', 11]
 * generatePageNumbers(1, 11, 1) // [1, 2, 'ellipsis', 11]
 * generatePageNumbers(11, 11, 1) // [1, 'ellipsis', 10, 11]
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  delta: number = 1
): PageNumber[] {
  if (totalPages <= 0) {
    return [];
  }

  // 总页数少于等于 (delta * 2 + 3) 时，显示所有页码
  // delta=1 时，最多显示 5 页：首页、当前-1、当前、当前+1、尾页
  const maxDisplayPages = delta * 2 + 3;
  if (totalPages <= maxDisplayPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageNumber[] = [];
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  // 总是显示第一页
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis');
    }
  }

  // 显示当前页 ±delta 页
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // 总是显示最后一页
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }
    pages.push(totalPages);
  }

  return pages;
}

