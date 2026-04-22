/**
 * LogManagementPage Integration Tests
 * 日志管理主页面集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogManagementPage } from '../LogManagementPage';
import * as logService from '@/services/log';
import { systemUserService } from '@/services/setting/user';
import type { OperationLog } from '@/types/log';

// Mock services
vi.mock('@/services/log');
vi.mock('@/services/setting/user');

const mockLogService = logService as any;
const mockSystemUserService = systemUserService as any;

describe('LogManagementPage - Integration Tests', () => {
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
      type: 'UPDATE',
      module: 'CASE_MANAGEMENT',
      content: '更新测试用例',
      createTime: '2024-01-01T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock log service
    mockLogService.getLogList = vi.fn().mockResolvedValue({
      list: mockLogs,
      total: 2,
      pageSize: 10,
      current: 1,
    });

    // Mock user service
    mockSystemUserService.getUserList = vi.fn().mockResolvedValue({
      list: [
        { id: 'user-1', name: '张三', email: 'zhang@test.com' },
        { id: 'user-2', name: '李四', email: 'li@test.com' },
      ],
      total: 2,
    });
  });

  it('should render page title and description', () => {
    render(<LogManagementPage projectId="proj-1" />);

    expect(screen.getByText('操作日志')).toBeInTheDocument();
    expect(screen.getByText('查看和管理系统操作日志')).toBeInTheDocument();
  });

  it('should render filter panel and log table', async () => {
    render(<LogManagementPage projectId="proj-1" />);

    // Wait for data to load
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Verify filter panel elements
    expect(screen.getByText('操作人')).toBeInTheDocument();
    expect(screen.getByText('开始时间')).toBeInTheDocument();
    expect(screen.getByText('结束时间')).toBeInTheDocument();
    expect(screen.getByText('操作范围')).toBeInTheDocument();
    expect(screen.getByText('操作类型')).toBeInTheDocument();

    // Verify search button
    expect(screen.getByRole('button', { name: '查询' })).toBeInTheDocument();

    // Verify table headers
    expect(screen.getByText('操作名称')).toBeInTheDocument();
    expect(screen.getByText('操作时间')).toBeInTheDocument();
  });

  it('should load and display logs on mount', async () => {
    render(<LogManagementPage projectId="proj-1" />);

    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          current: 1,
          pageSize: 10,
        })
      );
    });

    // Verify logs are displayed
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('创建接口测试')).toBeInTheDocument();
    expect(screen.getByText('更新测试用例')).toBeInTheDocument();
  });

  it('should filter logs when search button is clicked', async () => {
    const user = userEvent.setup();

    render(<LogManagementPage projectId="proj-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Clear previous calls
    mockLogService.getLogList.mockClear();

    // Enter filter criteria
    const contentInput = screen.getByPlaceholderText('请输入操作名称');
    await user.type(contentInput, '创建');

    // Click search button
    const searchButton = screen.getByRole('button', { name: '查询' });
    await user.click(searchButton);

    // Verify API was called with filter
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          content: '创建',
          current: 1, // Should reset to page 1
        })
      );
    });
  });

  it('should reset filters when reset button is clicked', async () => {
    const user = userEvent.setup();

    render(<LogManagementPage projectId="proj-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Enter filter criteria
    const contentInput = screen.getByPlaceholderText('请输入操作名称');
    await user.type(contentInput, '创建');

    // Click reset button
    const resetButton = screen.getByRole('button', { name: '重置' });
    await user.click(resetButton);

    // Verify input is cleared
    expect(contentInput).toHaveValue('');
  });

  it('should change page when pagination is used', async () => {
    const user = userEvent.setup();

    // Mock multiple pages of data
    mockLogService.getLogList.mockResolvedValue({
      list: mockLogs,
      total: 25,
      pageSize: 10,
      current: 1,
    });

    render(<LogManagementPage projectId="proj-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Clear previous calls
    mockLogService.getLogList.mockClear();

    // Click next page
    const nextButton = screen.getByRole('button', { name: '下一页' });
    await user.click(nextButton);

    // Verify API was called with new page
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalledWith(
        expect.objectContaining({
          current: 2,
        })
      );
    });
  });

  it('should sort logs when clicking sort button', async () => {
    const user = userEvent.setup();

    render(<LogManagementPage projectId="proj-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Clear previous calls
    mockLogService.getLogList.mockClear();

    // Click time column to sort
    const timeHeader = screen.getByRole('button', { name: /操作时间/i });
    await user.click(timeHeader);

    // Verify API was called with sort parameter
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: {
            createTime: 'asc', // Should toggle from desc to asc
          },
        })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockLogService.getLogList.mockRejectedValue(new Error('API Error'));

    render(<LogManagementPage projectId="proj-1" />);

    // Wait for error handling
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Verify empty state is shown
    expect(screen.getByText('暂无日志数据')).toBeInTheDocument();
  });

  it('should show loading state while fetching data', async () => {
    // Mock delayed response
    mockLogService.getLogList.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        list: mockLogs,
        total: 2,
        pageSize: 10,
        current: 1,
      }), 100))
    );

    render(<LogManagementPage projectId="proj-1" />);

    // Verify loading state (spinner should be visible)
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should maintain filter state when changing pages', async () => {
    const user = userEvent.setup();

    mockLogService.getLogList.mockResolvedValue({
      list: mockLogs,
      total: 25,
      pageSize: 10,
      current: 1,
    });

    render(<LogManagementPage projectId="proj-1" />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalled();
    });

    // Apply filter
    const contentInput = screen.getByPlaceholderText('请输入操作名称');
    await user.type(contentInput, '创建');

    const searchButton = screen.getByRole('button', { name: '查询' });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '创建',
        })
      );
    });

    // Clear previous calls
    mockLogService.getLogList.mockClear();

    // Change page
    const nextButton = screen.getByRole('button', { name: '下一页' });
    await user.click(nextButton);

    // Verify filter is maintained
    await waitFor(() => {
      expect(mockLogService.getLogList).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '创建',
          current: 2,
        })
      );
    });
  });
});
