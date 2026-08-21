/**
 * useE2ESpaceDetailPage Hook
 * 整合 E2E 空间详情页面的所有状态和逻辑
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { http } from '@/utils/request';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { CaseRealizationSpace } from '@/services/e2e-space';
import type { WorkflowDesignPageV2Ref } from '@/components/features/WorkflowDesignPageV2';
import {
  useE2EModuleTree,
  useTestCaseList,
  useTestCaseOperations,
  useEnvironmentManagement,
  useWorkflowIntegration,
} from './';

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

interface UseE2ESpaceDetailPageParams {
  space: CaseRealizationSpace;
}

export function useE2ESpaceDetailPage({ space }: UseE2ESpaceDetailPageParams) {
  const workflowDesignRef = useRef<WorkflowDesignPageV2Ref>(null);
  const [userMap, setUserMap] = useState<Map<string, UserInfo>>(new Map());
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 50,
    name: 250,
    description: 200,
    category: 100,
    nodeCount: 80,
    duration: 100,
    status: 80,
    lastRun: 140,
    creator: 120,
    actions: 140,
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStateRef = useRef<{
    column: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // 模块树管理
  const moduleTree = useE2EModuleTree({ space });

  // 测试用例列表管理
  const testCaseList = useTestCaseList({
    space,
    selectedModule: moduleTree.selectedModule,
    modules: moduleTree.modules,
    userMap,
    getAllModuleIds: moduleTree.getAllModuleIds,
  });

  // 工作流集成
  const workflowIntegration = useWorkflowIntegration({
    workflowDesignRef,
  });

  // 环境管理
  const environmentManagement = useEnvironmentManagement({ space });

  // 测试用例操作
  const testCaseOperations = useTestCaseOperations({
    space,
    selectedModule: moduleTree.selectedModule,
    filteredTestCases: testCaseList.filteredTestCases,
    loadTestCases: testCaseList.loadTestCases,
    loadModules: moduleTree.loadModules,
    workflowDesignRef,
    setSelectedTestCase: workflowIntegration.setSelectedTestCase,
    selectedTestCase: workflowIntegration.selectedTestCase,
    setLoading: moduleTree.setLoading,
  });

  // 加载用户列表
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

  // 从 localStorage 加载列宽
  useEffect(() => {
    const savedWidths = localStorage.getItem('e2e-table-column-widths');
    if (savedWidths) {
      try {
        const parsed = JSON.parse(savedWidths);
        setColumnWidths(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load column widths:', e);
      }
    }
  }, []);

  // 列宽拖拽处理
  const handleResizeStart = useCallback((column: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = columnWidths[column as keyof typeof columnWidths];
    resizeStateRef.current = {
      column,
      startX: e.clientX,
      startWidth,
    };
    setResizingColumn(column);
    
    // 保存原始的 userSelect 和 cursor 值
    const originalUserSelect = document.body.style.userSelect;
    const originalCursor = document.body.style.cursor;
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const handleResize = (e: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const diff = e.clientX - resizeStateRef.current.startX;
      const newWidth = Math.max(50, resizeStateRef.current.startWidth + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizeStateRef.current!.column]: newWidth,
      }));
    };
    
    const handleResizeEnd = () => {
      setResizingColumn(null);
      resizeStateRef.current = null;
      // 恢复原始值
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
      setColumnWidths(prev => {
        localStorage.setItem('e2e-table-column-widths', JSON.stringify(prev));
        return prev;
      });
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [columnWidths]);

  // 组件卸载时确保清理拖拽状态
  useEffect(() => {
    return () => {
      if (resizingColumn) {
        setResizingColumn(null);
        resizeStateRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [resizingColumn]);

  // 当从工作流返回到用例列表时，刷新列表
  useEffect(() => {
    if (workflowIntegration.prevSelectedTestCaseRef.current !== null && workflowIntegration.selectedTestCase === null) {
      if (moduleTree.selectedModule) {
        testCaseList.loadTestCases(moduleTree.selectedModule);
      } else {
        testCaseList.loadTestCases();
      }
    }
  }, [workflowIntegration.selectedTestCase, moduleTree.selectedModule, testCaseList.loadTestCases]);

  // 批量执行确认
  const handleConfirmBatchExecute = useCallback(async () => {
    if (!environmentManagement.selectedEnvironmentId) {
      toast.error('请选择执行环境');
      return;
    }

    environmentManagement.setIsEnvironmentDialogOpen(false);

    try {
      moduleTree.setLoading(true);
      const selectedCases = testCaseList.filteredTestCases.filter(tc => 
        testCaseOperations.selectedTestCaseIds.has(tc.id)
      );
      const workflowIds = selectedCases.map(tc => tc.id);
      
      if (workflowIds.length === 0) {
        toast.error('请至少选择一个测试用例');
        return;
      }

      const userVariables: Record<string, string> = {};
      if (environmentManagement.userVariableXTagHeader.trim()) {
        userVariables['x-tag-header'] = environmentManagement.userVariableXTagHeader.trim();
      }
      if (environmentManagement.userVariableXSiteTenant.trim()) {
        userVariables['x-site-tenant'] = environmentManagement.userVariableXSiteTenant.trim();
      }
      if (environmentManagement.userVariableXTenantId.trim()) {
        userVariables['x-tenant-id'] = environmentManagement.userVariableXTenantId.trim();
      }
      if (environmentManagement.userVariableXApp.trim()) {
        userVariables['x-app'] = environmentManagement.userVariableXApp.trim();
      }

      await workflowService.runWorkflow(workflowIds[0], {
        workflowIds: workflowIds,
        environmentId: environmentManagement.selectedEnvironmentId,
        userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
      });
      
      toast.success(`已提交 ${workflowIds.length} 个测试用例执行`);
      testCaseOperations.setSelectedTestCaseIds(new Set());
    } catch (error: any) {
      console.error('批量执行失败:', error);
      toast.error(error.message || '批量执行失败');
    } finally {
      moduleTree.setLoading(false);
    }
  }, [
    environmentManagement.selectedEnvironmentId,
    environmentManagement.setIsEnvironmentDialogOpen,
    environmentManagement.userVariableXTagHeader,
    environmentManagement.userVariableXSiteTenant,
    environmentManagement.userVariableXTenantId,
    environmentManagement.userVariableXApp,
    testCaseList.filteredTestCases,
    testCaseOperations.selectedTestCaseIds,
    testCaseOperations.setSelectedTestCaseIds,
    moduleTree.setLoading,
  ]);

  // 批量执行（打开环境选择弹窗）
  const handleBatchExecute = useCallback(() => {
    if (testCaseOperations.selectedTestCaseIds.size === 0) {
      toast.error('请至少选择一个测试用例');
      return;
    }
    environmentManagement.handleOpenEnvironmentDialog();
  }, [testCaseOperations.selectedTestCaseIds, environmentManagement.handleOpenEnvironmentDialog]);

  return {
    // 模块树
    ...moduleTree,
    // 测试用例列表
    ...testCaseList,
    // 测试用例操作
    ...testCaseOperations,
    // 环境管理
    ...environmentManagement,
    // 工作流集成
    ...workflowIntegration,
    // 其他状态
    userMap,
    columnWidths,
    setColumnWidths,
    resizingColumn,
    handleResizeStart,
    workflowDesignRef,
    // 批量执行
    handleBatchExecute,
    handleConfirmBatchExecute,
  };
}
