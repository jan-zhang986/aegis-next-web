import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { workflowTestReportService, type WorkflowExecutionVO, type TestReportDetailVO } from '@/services/workflow-test-report';
import { http } from '@/utils/request';
import type { TestRecord, UserInfo } from '../types';

export function useTestReportPage(reportId: string | undefined) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [reportDetail, setReportDetail] = useState<TestReportDetailVO | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [userMap, setUserMap] = useState<Map<string, UserInfo>>(new Map());
  const [records, setRecords] = useState<TestRecord[]>([]);

  useEffect(() => {
    const loadUserList = async () => {
      try {
        const response = await http.get('/system/user/list/public');
        let userList: UserInfo[] = [];
        if (Array.isArray(response) && response.length > 0) {
          userList = response.map((u: any) => ({
            id: u.id,
            name: u.name || u.email || u.id,
            email: u.email || '',
          }));
        } else if (response && typeof response === 'object' && 'code' in response) {
          if (response.code === 100200 && Array.isArray(response.data)) {
            userList = response.data.map((u: any) => ({
              id: u.id,
              name: u.name || u.email || u.id,
              email: u.email || '',
            }));
          }
        }
        if (userList.length > 0) {
          const map = new Map<string, UserInfo>();
          userList.forEach(user => {
            map.set(user.id, user);
          });
          setUserMap(map);
        }
      } catch (error) {
        console.error('加载用户列表失败:', error);
      }
    };
    loadUserList();
  }, []);

  const loadReportDetail = useCallback(async () => {
    if (!reportId) return;
    
    setIsLoadingDetail(true);
    try {
      const detail = await workflowTestReportService.getTestReportDetail(reportId);
      setReportDetail(detail);
    } catch (error: any) {
      console.error('加载报告详情失败:', error);
      const msg = error?.message || '';
      const isPermissionError = msg.includes('没有权限') || msg.includes('无权限') || msg.includes('403');
      toast.error(isPermissionError
        ? '您没有权限查看该测试报告，请联系项目管理员开通「工作流测试报告」查看权限。'
        : `加载报告详情失败: ${msg || '未知错误'}`);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [reportId]);

  const loadRecords = useCallback(async () => {
    if (!reportId) return;
    
    setIsLoading(true);
    try {
      const response = await workflowTestReportService.getWorkflowExecutionPage({
        reportId,
        current: currentPage,
        pageSize,
        keyword: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      setTotalCount(response.total || 0);

      const rawList = response.list || [];
      const convertedRecords: TestRecord[] = rawList.map((execution: WorkflowExecutionVO) => {
        const executorId = execution.executor;
        const executorName = userMap.get(executorId)?.name || executorId || '未知';

        return {
          id: execution.id,
          workflowName: execution.workflowName,
          status: execution.status?.toLowerCase() as TestRecord['status'] || 'cancelled',
          duration: execution.duration || 0,
          startTime: formatTimestamp(execution.startTime),
          endTime: formatTimestamp(execution.endTime),
          totalNodes: execution.totalNodes || 0,
          successNodes: execution.successNodes || 0,
          failedNodes: execution.failedNodes || 0,
          skippedNodes: execution.skippedNodes || 0,
          executor: executorName,
          runId: execution.runId,
          workflowId: execution.workflowId,
        };
      });

      setRecords(convertedRecords);
    } catch (error: any) {
      console.error('加载测试记录失败:', error);
      const msg = error?.message || '';
      const isPermissionError = msg.includes('没有权限') || msg.includes('无权限') || msg.includes('403');
      toast.error(isPermissionError
        ? '您没有权限查看测试报告，请联系项目管理员开通「工作流测试报告」查看权限。'
        : `加载测试记录失败: ${msg || '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  }, [reportId, currentPage, pageSize, searchTerm, statusFilter, userMap]);

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (reportId) {
      loadReportDetail();
      loadRecords();
    }
  }, [reportId, loadReportDetail, loadRecords]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCount,
    isLoading,
    jumpToPage,
    setJumpToPage,
    reportDetail,
    isLoadingDetail,
    userMap,
    records,
    setRecords,
    loadReportDetail,
    loadRecords,
    formatTimestamp,
  };
}
