/**
 * LogTable Unit Tests
 * 日志表格单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogTable } from '../LogTable';
import type { OperationLog } from '@/types/log';

describe('LogTable', () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnSort = vi.fn();

  const mockLogs: OperationLog[] = [
    {
      id: '1',
      operUser: 'user-1',
      userName: '张三',
      projectId: 'proj-1',
      projectName: '测试项目',
      organizationId: null,
      organizationName: null,
      type: 'ADD',
      module: 'API_TEST',
      content: '创建接口测试',
      createTime: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      operUser: 'user-2',
      userName: '李四',
      projectId: 'proj-1',
      projectName: '测试项目',
      organizationId: null,
      organizationName: null,
      type: 'DELETE',
      module: 'CASE_MANAGEMENT',
      content: '删除测试用例',
      createTime: '2024-01-01T11:00:00Z',
    },
    {
      id: '3',
      operUser: 'user-1',
      userName: '张三',
      projectId: null,
      projectName: null,
      organizationId: 'org-1',
      organizationName: '测试组织',
      type: 'UPDATE',
      module: 'SYSTEM',
      content: '更新系统配置',
      createTime: '2024-01-01T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with log data', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={3}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    // 验证表头
    expect(screen.getByText('操作人')).toBeInTheDocument();
    expect(screen.getByText('操作范围')).toBeInTheDocument();
    expect(screen.getByText('操作对象')).toBeInTheDocument();
    expect(screen.getByText('操作类型')).toBeInTheDocument();
    expect(screen.getByText('操作名称')).toBeInTheDocument();
    expect(screen.getByText('操作时间')).toBeInTheDocument();

    // 验证数据行
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('测试项目')).toBeInTheDocument();
    expect(screen.getByText('测试组织')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <LogTable
        logs={[]}
        loading={true}
        total={0}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    // 验证加载状态（通过查找 spinner 或加载文本）
    const loadingElement = screen.getByRole('cell', { name: '' });
    expect(loadingElement).toBeInTheDocument();
  });

  it('should display empty state when no logs', () => {
    render(
      <LogTable
        logs={[]}
        loading={false}
        total={0}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('暂无日志数据')).toBeInTheDocument();
  });

  it('should call onSort when clicking time column header', async () => {
    const user = userEvent.setup();

    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={3}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    const timeHeader = screen.getByRole('button', { name: /操作时间/i });
    await user.click(timeHeader);

    expect(mockOnSort).toHaveBeenCalledWith('createTime', 'asc');
  });

  it('should render clickable link for non-delete operations', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={3}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    // ADD 操作应该是可点击的链接
    const addLink = screen.getByRole('button', { name: '创建接口测试' });
    expect(addLink).toBeInTheDocument();

    // UPDATE 操作应该是可点击的链接
    const updateLink = screen.getByRole('button', { name: '更新系统配置' });
    expect(updateLink).toBeInTheDocument();
  });

  it('should render plain text for delete operations', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={3}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    // DELETE 操作应该是纯文本，不是链接
    const deleteText = screen.getByText('删除测试用例');
    expect(deleteText).toBeInTheDocument();
    expect(deleteText.tagName).not.toBe('BUTTON');
  });

  it('should display correct operation type badges', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={3}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('添加')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('更新')).toBeInTheDocument();
  });

  it('should display correct operation scope labels', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={3}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    // 项目级别
    const projectScopes = screen.getAllByText('项目');
    expect(projectScopes.length).toBeGreaterThan(0);

    // 组织级别
    expect(screen.getByText('组织')).toBeInTheDocument();
  });

  it('should call onPageChange when clicking pagination buttons', async () => {
    const user = userEvent.setup();

    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={30}
        current={2}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    const prevButton = screen.getByRole('button', { name: '上一页' });
    await user.click(prevButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);

    const nextButton = screen.getByRole('button', { name: '下一页' });
    await user.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should disable prev button on first page', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={30}
        current={1}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    const prevButton = screen.getByRole('button', { name: '上一页' });
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={30}
        current={3}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    const nextButton = screen.getByRole('button', { name: '下一页' });
    expect(nextButton).toBeDisabled();
  });

  it('should display correct pagination info', () => {
    render(
      <LogTable
        logs={mockLogs}
        loading={false}
        total={45}
        current={2}
        pageSize={10}
        sortField="createTime"
        sortOrder="desc"
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('共 45 条记录')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });
});
