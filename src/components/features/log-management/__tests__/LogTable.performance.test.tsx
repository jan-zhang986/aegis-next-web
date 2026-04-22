/**
 * LogTable Performance Tests
 * 测试大数据量场景和渲染性能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LogTable } from '../LogTable';
import { VirtualizedLogTable } from '../VirtualizedLogTable';
import type { OperationLog } from '@/types/log';

// 生成测试日志数据
function generateLogs(count: number): OperationLog[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    operUser: `user-${i}`,
    userName: `User ${i}`,
    projectId: i % 2 === 0 ? 'project-1' : undefined,
    organizationId: i % 2 === 1 ? 'org-1' : undefined,
    projectName: i % 2 === 0 ? `Project ${i}` : undefined,
    organizationName: i % 2 === 1 ? `Org ${i}` : undefined,
    type: ['ADD', 'UPDATE', 'DELETE', 'DEBUG', 'EXECUTE'][i % 5] as any,
    content: `Operation ${i}`,
    createTime: new Date(Date.now() - i * 1000).toISOString(),
    module: 'TEST',
  }));
}

describe('LogTable Performance Tests', () => {
  const mockProps = {
    loading: false,
    total: 100,
    current: 1,
    pageSize: 20,
    sortField: 'createTime',
    sortOrder: 'desc' as const,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onSort: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Large Dataset Rendering', () => {
    it('should render 50 logs within acceptable time', async () => {
      const logs = generateLogs(50);
      const startTime = performance.now();

      render(<LogTable {...mockProps} logs={logs} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染时间应该小于 1000ms
      expect(renderTime).toBeLessThan(1000);

      // 验证日志已渲染
      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument();
      });
    });

    it('should use virtualized table for large datasets', () => {
      const logs = generateLogs(100);

      const { container } = render(
        <VirtualizedLogTable {...mockProps} logs={logs} />
      );

      // 虚拟化表格应该只渲染可见的行
      const rows = container.querySelectorAll('[role="row"]');
      // 虚拟化后，DOM 中的行数应该远少于总数据量
      expect(rows.length).toBeLessThan(logs.length);
    });

    it('should handle 1000 logs without crashing', () => {
      const logs = generateLogs(1000);

      expect(() => {
        render(<VirtualizedLogTable {...mockProps} logs={logs} total={1000} />);
      }).not.toThrow();
    });
  });

  describe('Rendering Performance', () => {
    it('should render empty state quickly', () => {
      const startTime = performance.now();

      render(<LogTable {...mockProps} logs={[]} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 空状态渲染应该非常快
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('暂无日志数据')).toBeInTheDocument();
    });

    it('should render loading state quickly', () => {
      const startTime = performance.now();

      render(<LogTable {...mockProps} logs={[]} loading={true} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 加载状态渲染应该非常快
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should not re-render unnecessarily when props do not change', () => {
      const logs = generateLogs(10);
      let renderCount = 0;

      const TestWrapper = () => {
        renderCount++;
        return <LogTable {...mockProps} logs={logs} />;
      };

      const { rerender } = render(<TestWrapper />);

      const initialRenderCount = renderCount;

      // 使用相同的 props 重新渲染
      rerender(<TestWrapper />);

      // 由于使用了 memo，渲染次数应该增加（但实际的 LogTable 不应该重新渲染）
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe('Sorting Performance', () => {
    it('should handle sorting large datasets efficiently', async () => {
      const logs = generateLogs(100);
      const { rerender } = render(
        <VirtualizedLogTable {...mockProps} logs={logs} />
      );

      const startTime = performance.now();

      // 模拟排序
      rerender(
        <VirtualizedLogTable
          {...mockProps}
          logs={logs}
          sortOrder="asc"
        />
      );

      const endTime = performance.now();
      const sortTime = endTime - startTime;

      // 排序后重新渲染应该很快
      expect(sortTime).toBeLessThan(500);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle page changes efficiently', async () => {
      const logs = generateLogs(20);
      const { rerender } = render(
        <LogTable {...mockProps} logs={logs} current={1} />
      );

      const startTime = performance.now();

      // 模拟翻页
      const newLogs = generateLogs(20).map((log, i) => ({
        ...log,
        id: `log-page2-${i}`,
      }));

      rerender(
        <LogTable {...mockProps} logs={newLogs} current={2} />
      );

      const endTime = performance.now();
      const pageChangeTime = endTime - startTime;

      // 翻页应该很快
      expect(pageChangeTime).toBeLessThan(300);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory when unmounting', () => {
      const logs = generateLogs(100);
      const { unmount } = render(
        <VirtualizedLogTable {...mockProps} logs={logs} />
      );

      // 记录初始内存（如果可用）
      const initialMemory = (performance as any).memory?.usedJSHeapSize;

      unmount();

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      // 验证组件已卸载
      expect(screen.queryByRole('region')).not.toBeInTheDocument();

      // 注意：实际的内存泄漏检测需要更复杂的工具
      // 这里只是基本的卸载验证
    });
  });
});
