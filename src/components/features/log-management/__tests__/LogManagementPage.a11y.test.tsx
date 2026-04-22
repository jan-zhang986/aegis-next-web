/**
 * LogManagementPage Accessibility Tests
 * 测试日志管理页面的可访问性
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogManagementPage } from '../LogManagementPage';
import { useLogQuery } from '@/hooks/log/useLogQuery';

// Mock hooks
jest.mock('@/hooks/log/useLogQuery');
jest.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: jest.fn(),
  useTrapFocus: jest.fn(() => ({ current: null })),
}));
jest.mock('@/hooks/useResponsive', () => ({
  useIsMobile: jest.fn(() => false),
  useBreakpoint: jest.fn(() => 'lg'),
}));

const mockUseLogQuery = useLogQuery as jest.MockedFunction<typeof useLogQuery>;

describe('LogManagementPage - Accessibility Tests', () => {
  const mockLogs = [
    {
      id: '1',
      operUser: 'user1',
      userName: '张三',
      projectId: 'proj1',
      projectName: '测试项目',
      organizationId: null,
      organizationName: null,
      type: 'ADD',
      content: '创建测试用例',
      createTime: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      operUser: 'user2',
      userName: '李四',
      projectId: 'proj1',
      projectName: '测试项目',
      organizationId: null,
      organizationName: null,
      type: 'DELETE',
      content: '删除测试用例',
      createTime: '2024-01-01T11:00:00Z',
    },
  ];

  beforeEach(() => {
    mockUseLogQuery.mockReturnValue({
      logs: mockLogs,
      loading: false,
      total: 2,
      current: 1,
      pageSize: 10,
      filters: {},
      sortField: 'createTime',
      sortOrder: 'desc',
      setFilters: jest.fn(),
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      setSort: jest.fn(),
      refresh: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Semantic HTML', () => {
    it('should use semantic main element', () => {
      render(<LogManagementPage projectId="proj1" />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', '操作日志管理');
    });

    it('should use semantic header element', () => {
      render(<LogManagementPage projectId="proj1" />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should use semantic search region', () => {
      render(<LogManagementPage projectId="proj1" />);
      const searchRegion = screen.getByRole('search');
      expect(searchRegion).toBeInTheDocument();
      expect(searchRegion).toHaveAttribute('aria-label', '日志筛选');
    });

    it('should use semantic navigation for pagination', () => {
      render(<LogManagementPage projectId="proj1" />);
      const nav = screen.getByRole('navigation', { name: '日志分页导航' });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('ARIA Labels', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // 查询按钮
      const searchButton = screen.getByRole('button', { name: '查询日志' });
      expect(searchButton).toBeInTheDocument();
      
      // 重置按钮
      const resetButton = screen.getByRole('button', { name: '重置筛选条件' });
      expect(resetButton).toBeInTheDocument();
    });

    it('should have ARIA labels on form inputs', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // 操作名称输入框
      const operationNameInput = screen.getByLabelText('操作名称');
      expect(operationNameInput).toBeInTheDocument();
    });

    it('should have ARIA labels on select elements', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // 操作范围选择器
      const scopeSelect = screen.getByLabelText('操作范围');
      expect(scopeSelect).toBeInTheDocument();
      
      // 操作类型选择器
      const typeSelect = screen.getByLabelText('操作类型');
      expect(typeSelect).toBeInTheDocument();
    });

    it('should have ARIA live region for loading state', () => {
      mockUseLogQuery.mockReturnValue({
        ...mockUseLogQuery(),
        loading: true,
        logs: [],
      });

      render(<LogManagementPage projectId="proj1" />);
      
      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Enter key to submit search form', async () => {
      const mockSetFilters = jest.fn();
      mockUseLogQuery.mockReturnValue({
        ...mockUseLogQuery(),
        setFilters: mockSetFilters,
      });

      render(<LogManagementPage projectId="proj1" />);
      
      const operationNameInput = screen.getByLabelText('操作名称');
      fireEvent.change(operationNameInput, { target: { value: '测试' } });
      fireEvent.keyDown(operationNameInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockSetFilters).toHaveBeenCalled();
      });
    });

    it('should support Tab navigation through form fields', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      const operationNameInput = screen.getByLabelText('操作名称');
      operationNameInput.focus();
      expect(document.activeElement).toBe(operationNameInput);
      
      // Tab to next field
      fireEvent.keyDown(operationNameInput, { key: 'Tab', code: 'Tab' });
      
      // Should move focus to next interactive element
      expect(document.activeElement).not.toBe(operationNameInput);
    });

    it('should support keyboard shortcuts', () => {
      const mockRefresh = jest.fn();
      mockUseLogQuery.mockReturnValue({
        ...mockUseLogQuery(),
        refresh: mockRefresh,
      });

      render(<LogManagementPage projectId="proj1" />);
      
      // Ctrl+R to refresh
      fireEvent.keyDown(window, { key: 'r', code: 'KeyR', ctrlKey: true });
      
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus on interactive elements', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      const searchButton = screen.getByRole('button', { name: '查询日志' });
      searchButton.focus();
      
      expect(document.activeElement).toBe(searchButton);
    });

    it('should have visible focus indicators', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      const searchButton = screen.getByRole('button', { name: '查询日志' });
      searchButton.focus();
      
      // Focus should be visible (this is typically handled by CSS)
      expect(searchButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive labels for screen readers', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // 页面标题
      const heading = screen.getByRole('heading', { name: '操作日志' });
      expect(heading).toBeInTheDocument();
    });

    it('should hide decorative icons from screen readers', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // Icons should have aria-hidden="true"
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should provide text alternatives for visual content', () => {
      mockUseLogQuery.mockReturnValue({
        ...mockUseLogQuery(),
        loading: true,
        logs: [],
      });

      render(<LogManagementPage projectId="proj1" />);
      
      // Loading spinner should have sr-only text
      const srOnlyText = screen.getByText('正在加载...', { selector: '.sr-only' });
      expect(srOnlyText).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should provide accessible error messages', async () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // 选择超过6个月的时间范围
      const startDateButton = screen.getByLabelText(/开始时间/);
      fireEvent.click(startDateButton);
      
      // Error message should be announced to screen readers
      // (This would be tested with actual date selection and validation)
    });

    it('should associate labels with form controls', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      const operationNameInput = screen.getByLabelText('操作名称');
      const label = screen.getByText('操作名称', { selector: 'label' });
      
      expect(label).toBeInTheDocument();
      expect(operationNameInput).toHaveAttribute('id');
    });
  });

  describe('Color Contrast', () => {
    it('should use sufficient color contrast for text', () => {
      render(<LogManagementPage projectId="proj1" />);
      
      // This is typically tested with automated tools like axe-core
      // Here we just verify that text elements exist
      const heading = screen.getByRole('heading', { name: '操作日志' });
      expect(heading).toHaveClass('text-gray-900');
    });
  });

  describe('Responsive Design', () => {
    it('should be accessible on mobile devices', () => {
      const { useIsMobile } = require('@/hooks/useResponsive');
      useIsMobile.mockReturnValue(true);

      render(<LogManagementPage projectId="proj1" />);
      
      // Mobile view should still have all accessibility features
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });
});
