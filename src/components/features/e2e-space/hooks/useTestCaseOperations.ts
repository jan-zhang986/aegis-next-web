/**
 * useTestCaseOperations Hook
 * 测试用例操作逻辑（增删改查、批量操作等）
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { E2ESpace } from '@/services/e2e-space';
import type { WorkflowDesignPageV2Ref } from '@/components/features/WorkflowDesignPageV2';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount: number;
  duration?: number;
  status: 'success' | 'failed' | 'not-run';
  lastRun?: string;
  creator: string;
}

interface UseTestCaseOperationsParams {
  space: E2ESpace;
  selectedModule: string | null;
  filteredTestCases: TestCase[];
  loadTestCases: (moduleId?: string) => Promise<void>;
  loadModules: (preserveSelection?: boolean) => Promise<void>;
  workflowDesignRef: React.RefObject<WorkflowDesignPageV2Ref>;
  setSelectedTestCase: (testCase: TestCase | null) => void;
  selectedTestCase: TestCase | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseTestCaseOperationsReturn {
  // 对话框状态
  isCreateTestCaseDialogOpen: boolean;
  setIsCreateTestCaseDialogOpen: (open: boolean) => void;
  newTestCaseName: string;
  setNewTestCaseName: (name: string) => void;
  newTestCaseDescription: string;
  setNewTestCaseDescription: (description: string) => void;
  newTestCaseCategory: string;
  setNewTestCaseCategory: (category: string) => void;
  isDeleteTestCaseDialogOpen: boolean;
  setIsDeleteTestCaseDialogOpen: (open: boolean) => void;
  testCaseToDelete: TestCase | null;
  setTestCaseToDelete: (testCase: TestCase | null) => void;
  isEditTestCaseDialogOpen: boolean;
  setIsEditTestCaseDialogOpen: (open: boolean) => void;
  editingTestCase: TestCase | null;
  setEditingTestCase: (testCase: TestCase | null) => void;
  editTestCaseName: string;
  setEditTestCaseName: (name: string) => void;
  editTestCaseDescription: string;
  setEditTestCaseDescription: (description: string) => void;
  editTestCaseCategory: string;
  setEditTestCaseCategory: (category: string) => void;
  editingTestCaseId: string | null;
  setEditingTestCaseId: (id: string | null) => void;
  editingTestCaseName: string;
  setEditingTestCaseName: (name: string) => void;
  editTestCaseNameInputRef: React.RefObject<HTMLInputElement>;
  // 批量操作状态
  selectedTestCaseIds: Set<string>;
  setSelectedTestCaseIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  isBatchDeleteDialogOpen: boolean;
  setIsBatchDeleteDialogOpen: (open: boolean) => void;
  isCopyToDialogOpen: boolean;
  setIsCopyToDialogOpen: (open: boolean) => void;
  isMoveToDialogOpen: boolean;
  setIsMoveToDialogOpen: (open: boolean) => void;
  targetModuleId: string;
  setTargetModuleId: (id: string) => void;
  // 操作函数
  handleCreateTestCase: () => Promise<void>;
  handleDeleteTestCase: () => Promise<void>;
  handleCopyTestCase: (testCase: TestCase) => Promise<void>;
  handleEditTestCase: (testCase: TestCase) => void;
  handleSaveEditTestCase: () => Promise<void>;
  handleStartEditTestCaseName: (testCase: TestCase) => void;
  handleCancelEditTestCaseName: () => void;
  handleSaveTestCaseName: (testCase: TestCase, skipIfUnchanged?: boolean) => Promise<void>;
  handleToggleSelectAll: (checked: boolean) => void;
  handleToggleTestCaseSelection: (testCaseId: string) => void;
  handleRunTestCase: (testCase: TestCase) => Promise<void>;
  handleBatchDelete: () => void;
  handleConfirmBatchDelete: () => Promise<void>;
  handleBatchCopyTo: () => void;
  handleBatchMoveTo: () => void;
  handleConfirmCopyTo: (moduleId: string) => Promise<void>;
  handleConfirmMoveTo: (moduleId: string) => Promise<void>;
}

/**
 * useTestCaseOperations Hook
 * 管理测试用例的所有操作
 */
export function useTestCaseOperations({
  space,
  selectedModule,
  filteredTestCases,
  loadTestCases,
  loadModules,
  workflowDesignRef,
  setSelectedTestCase,
  selectedTestCase,
  setLoading,
}: UseTestCaseOperationsParams): UseTestCaseOperationsReturn {
  // 创建用例对话框状态
  const [isCreateTestCaseDialogOpen, setIsCreateTestCaseDialogOpen] = useState(false);
  const [newTestCaseName, setNewTestCaseName] = useState('');
  const [newTestCaseDescription, setNewTestCaseDescription] = useState('');
  const [newTestCaseCategory, setNewTestCaseCategory] = useState('API');
  
  // 删除用例对话框状态
  const [isDeleteTestCaseDialogOpen, setIsDeleteTestCaseDialogOpen] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(null);
  
  // 编辑用例对话框状态
  const [isEditTestCaseDialogOpen, setIsEditTestCaseDialogOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [editTestCaseName, setEditTestCaseName] = useState('');
  const [editTestCaseDescription, setEditTestCaseDescription] = useState('');
  const [editTestCaseCategory, setEditTestCaseCategory] = useState('API');
  
  // 内联编辑用例名称状态
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null);
  const [editingTestCaseName, setEditingTestCaseName] = useState<string>('');
  const editTestCaseNameInputRef = useRef<HTMLInputElement>(null);
  
  // 批量操作状态
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<Set<string>>(new Set());
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isCopyToDialogOpen, setIsCopyToDialogOpen] = useState(false);
  const [isMoveToDialogOpen, setIsMoveToDialogOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');

  // 创建用例处理函数
  const handleCreateTestCase = useCallback(async () => {
    if (!newTestCaseName.trim()) {
      toast.error('请输入测试名称');
      return;
    }

    if (!selectedModule) {
      toast.error('请先选择模块');
      return;
    }

    try {
      setLoading(true);
      const projectId = space.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        toast.error('项目ID不存在');
        return;
      }

      await workflowService.saveWorkflow({
        projectId,
        moduleId: selectedModule,
        name: newTestCaseName.trim(),
        description: newTestCaseDescription.trim() || undefined,
        category: newTestCaseCategory || 'API',
        type: 'TEST_CASE',
        nodes: [],
        connections: [],
      });

      toast.success('测试用例创建成功');
      
      setIsCreateTestCaseDialogOpen(false);
      setNewTestCaseName('');
      setNewTestCaseDescription('');
      setNewTestCaseCategory('API');
      
      await loadTestCases(selectedModule);
    } catch (error: any) {
      console.error('创建测试用例失败:', error);
      toast.error(error.message || '创建测试用例失败');
    } finally {
      setLoading(false);
    }
  }, [newTestCaseName, newTestCaseDescription, newTestCaseCategory, selectedModule, space.projectId, loadTestCases, setLoading]);

  // 删除用例处理函数
  const handleDeleteTestCase = useCallback(async () => {
    if (!testCaseToDelete) {
      return;
    }

    try {
      setLoading(true);
      await workflowService.deleteWorkflow(testCaseToDelete.id);
      toast.success('用例删除成功');
      
      setIsDeleteTestCaseDialogOpen(false);
      setTestCaseToDelete(null);
      
      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
      
      if (selectedTestCase?.id === testCaseToDelete.id) {
        setSelectedTestCase(null);
      }
    } catch (error: any) {
      console.error('删除用例失败:', error);
      toast.error(error.message || '删除用例失败');
    } finally {
      setLoading(false);
    }
  }, [testCaseToDelete, selectedModule, selectedTestCase, loadTestCases, setSelectedTestCase, setLoading]);

  // 复制用例处理函数
  const handleCopyTestCase = useCallback(async (testCase: TestCase) => {
    try {
      setLoading(true);
      await workflowService.copyWorkflow(testCase.id);
      toast.success('用例复制成功');
      
      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
    } catch (error: any) {
      console.error('复制用例失败:', error);
      toast.error(error.message || '复制用例失败');
    } finally {
      setLoading(false);
    }
  }, [selectedModule, loadTestCases, setLoading]);

  // 打开编辑测试用例对话框
  const handleEditTestCase = useCallback((testCase: TestCase) => {
    setEditingTestCase(testCase);
    setEditTestCaseName(testCase.name);
    setEditTestCaseDescription(testCase.description || '');
    setEditTestCaseCategory(testCase.category || 'API');
    setIsEditTestCaseDialogOpen(true);
  }, []);

  // 当编辑对话框打开时，延迟设置光标位置
  useEffect(() => {
    if (isEditTestCaseDialogOpen && editTestCaseNameInputRef.current) {
      const timer = setTimeout(() => {
        if (editTestCaseNameInputRef.current) {
          const input = editTestCaseNameInputRef.current;
          input.setSelectionRange(input.value.length, input.value.length);
          if (document.activeElement !== input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditTestCaseDialogOpen, editTestCaseName]);

  // 保存编辑的测试用例
  const handleSaveEditTestCase = useCallback(async () => {
    if (!editingTestCase) {
      return;
    }

    if (!editTestCaseName.trim()) {
      toast.error('请输入测试名称');
      return;
    }

    try {
      setLoading(true);
      const detail = await workflowService.getWorkflowDetail(editingTestCase.id);
      
      await workflowService.saveWorkflow({
        workflowId: editingTestCase.id,
        projectId: detail.projectId,
        moduleId: detail.moduleId,
        name: editTestCaseName.trim(),
        description: editTestCaseDescription.trim() || undefined,
        category: editTestCaseCategory || 'API',
        type: detail.type,
        globalVars: detail.globalVars,
        nodes: detail.nodes || [],
        connections: detail.connections || [],
      });

      toast.success('测试用例更新成功');
      
      setIsEditTestCaseDialogOpen(false);
      setEditingTestCase(null);
      setEditTestCaseName('');
      setEditTestCaseDescription('');
      setEditTestCaseCategory('API');
      
      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
    } catch (error: any) {
      console.error('更新测试用例失败:', error);
      toast.error(error.message || '更新测试用例失败');
    } finally {
      setLoading(false);
    }
  }, [editingTestCase, editTestCaseName, editTestCaseDescription, editTestCaseCategory, selectedModule, loadTestCases, setLoading]);

  // 开始编辑用例名称
  const handleStartEditTestCaseName = useCallback((testCase: TestCase) => {
    setEditingTestCaseId(testCase.id);
    setEditingTestCaseName(testCase.name);
  }, []);

  // 取消编辑用例名称
  const handleCancelEditTestCaseName = useCallback(() => {
    setEditingTestCaseId(null);
    setEditingTestCaseName('');
  }, []);

  // 保存用例名称
  const handleSaveTestCaseName = useCallback(async (testCase: TestCase, skipIfUnchanged = true) => {
    if (!editingTestCaseName.trim()) {
      toast.error('用例名称不能为空');
      return;
    }

    if (skipIfUnchanged && editingTestCaseName.trim() === testCase.name) {
      handleCancelEditTestCaseName();
      return;
    }

    try {
      setLoading(true);
      const detail = await workflowService.getWorkflowDetail(testCase.id);
      
      await workflowService.saveWorkflow({
        workflowId: testCase.id,
        projectId: detail.projectId,
        moduleId: detail.moduleId,
        name: editingTestCaseName.trim(),
        description: detail.description,
        category: detail.category,
        type: detail.type,
        globalVars: detail.globalVars,
        nodes: detail.nodes || [],
        connections: detail.connections || [],
      });

      toast.success('用例名称更新成功');
      handleCancelEditTestCaseName();

      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
    } catch (error: any) {
      console.error('更新用例名称失败:', error);
      toast.error(error.message || '更新用例名称失败');
    } finally {
      setLoading(false);
    }
  }, [editingTestCaseName, selectedModule, loadTestCases, handleCancelEditTestCaseName, setLoading]);

  // 全选/取消全选
  const handleToggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedTestCaseIds(new Set(filteredTestCases.map(tc => tc.id)));
    } else {
      setSelectedTestCaseIds(new Set());
    }
  }, [filteredTestCases]);

  // 切换单个用例的选择状态
  const handleToggleTestCaseSelection = useCallback((testCaseId: string) => {
    setSelectedTestCaseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  }, []);

  // 执行单个用例
  const handleRunTestCase = useCallback(async (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    
    const waitAndRun = async () => {
      let attempts = 0;
      const maxAttempts = 30;
      
      const checkDataLoaded = async (): Promise<boolean> => {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            attempts++;
            
            if (workflowDesignRef.current?.isDataLoaded && workflowDesignRef.current.isDataLoaded()) {
              clearInterval(checkInterval);
              resolve(true);
              return;
            }
            
            if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              resolve(false);
            }
          }, 100);
        });
      };
      
      const dataLoaded = await checkDataLoaded();
      
      if (!dataLoaded) {
        toast.error('工作流数据加载超时，请稍后重试');
        return;
      }
      
      if (workflowDesignRef.current) {
        try {
          await workflowDesignRef.current.handleRunWorkflow();
        } catch (error: any) {
          console.error('执行测试用例失败:', error);
          toast.error(error.message || '执行测试用例失败');
        }
      }
    };
    
    setTimeout(waitAndRun, 200);
  }, [workflowDesignRef, setSelectedTestCase]);

  // 批量删除用例
  const handleBatchDelete = useCallback(() => {
    if (selectedTestCaseIds.size === 0) {
      toast.error('请至少选择一个测试用例');
      return;
    }
    setIsBatchDeleteDialogOpen(true);
  }, [selectedTestCaseIds.size]);

  // 确认批量删除
  const handleConfirmBatchDelete = useCallback(async () => {
    try {
      setLoading(true);
      const selectedCases = filteredTestCases.filter(tc => selectedTestCaseIds.has(tc.id));
      const workflowIds = selectedCases.map(tc => tc.id);

      if (workflowIds.length === 0) {
        toast.error('请至少选择一个测试用例');
        return;
      }

      await Promise.all(workflowIds.map(id => workflowService.deleteWorkflow(id)));
      
      toast.success(`已成功删除 ${workflowIds.length} 个测试用例`);

      setIsBatchDeleteDialogOpen(false);
      setSelectedTestCaseIds(new Set());

      if (selectedTestCase && workflowIds.includes(selectedTestCase.id)) {
        setSelectedTestCase(null);
      }

      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
    } catch (error: any) {
      console.error('批量删除失败:', error);
      toast.error(error.message || '批量删除失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTestCaseIds, filteredTestCases, selectedTestCase, selectedModule, loadTestCases, setSelectedTestCase, setLoading]);

  // 批量复制到（打开模块选择对话框）
  const handleBatchCopyTo = useCallback(() => {
    if (selectedTestCaseIds.size === 0) {
      toast.error('请至少选择一个测试用例');
      return;
    }
    setTargetModuleId('');
    setIsCopyToDialogOpen(true);
  }, [selectedTestCaseIds.size]);

  // 批量移动到（打开模块选择对话框）
  const handleBatchMoveTo = useCallback(() => {
    if (selectedTestCaseIds.size === 0) {
      toast.error('请至少选择一个测试用例');
      return;
    }
    setTargetModuleId('');
    setIsMoveToDialogOpen(true);
  }, [selectedTestCaseIds.size]);

  // 确认批量复制到
  const handleConfirmCopyTo = useCallback(async (moduleId: string) => {
    if (!moduleId) {
      toast.error('请选择目标模块');
      return;
    }

    try {
      setLoading(true);
      const selectedCases = filteredTestCases.filter(tc => selectedTestCaseIds.has(tc.id));
      const workflowIds = selectedCases.map(tc => tc.id);

      if (workflowIds.length === 0) {
        toast.error('请至少选择一个测试用例');
        return;
      }

      await workflowService.batchCopyWorkflows(workflowIds, moduleId);
      
      toast.success(`已成功复制 ${workflowIds.length} 个测试用例到目标模块`);

      setSelectedTestCaseIds(new Set());
      await loadModules(true);
      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
    } catch (error: any) {
      console.error('批量复制失败:', error);
      toast.error(error.message || '批量复制失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedTestCaseIds, filteredTestCases, selectedModule, loadModules, loadTestCases, setLoading]);

  // 确认批量移动到
  const handleConfirmMoveTo = useCallback(async (moduleId: string) => {
    if (!moduleId) {
      toast.error('请选择目标模块');
      return;
    }

    try {
      setLoading(true);
      const selectedCases = filteredTestCases.filter(tc => selectedTestCaseIds.has(tc.id));
      const workflowIds = selectedCases.map(tc => tc.id);

      if (workflowIds.length === 0) {
        toast.error('请至少选择一个测试用例');
        return;
      }

      await workflowService.batchMoveWorkflows(workflowIds, moduleId);
      
      toast.success(`已成功移动 ${workflowIds.length} 个测试用例到目标模块`);

      setSelectedTestCaseIds(new Set());
      await loadModules(true);
      if (selectedModule) {
        await loadTestCases(selectedModule);
      } else {
        await loadTestCases();
      }
    } catch (error: any) {
      console.error('批量移动失败:', error);
      toast.error(error.message || '批量移动失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedTestCaseIds, filteredTestCases, selectedModule, loadModules, loadTestCases, setLoading]);

  return {
    isCreateTestCaseDialogOpen,
    setIsCreateTestCaseDialogOpen,
    newTestCaseName,
    setNewTestCaseName,
    newTestCaseDescription,
    setNewTestCaseDescription,
    newTestCaseCategory,
    setNewTestCaseCategory,
    isDeleteTestCaseDialogOpen,
    setIsDeleteTestCaseDialogOpen,
    testCaseToDelete,
    setTestCaseToDelete,
    isEditTestCaseDialogOpen,
    setIsEditTestCaseDialogOpen,
    editingTestCase,
    setEditingTestCase,
    editTestCaseName,
    setEditTestCaseName,
    editTestCaseDescription,
    setEditTestCaseDescription,
    editTestCaseCategory,
    setEditTestCaseCategory,
    editingTestCaseId,
    setEditingTestCaseId,
    editingTestCaseName,
    setEditingTestCaseName,
    editTestCaseNameInputRef,
    selectedTestCaseIds,
    setSelectedTestCaseIds,
    isBatchDeleteDialogOpen,
    setIsBatchDeleteDialogOpen,
    isCopyToDialogOpen,
    setIsCopyToDialogOpen,
    isMoveToDialogOpen,
    setIsMoveToDialogOpen,
    targetModuleId,
    setTargetModuleId,
    handleCreateTestCase,
    handleDeleteTestCase,
    handleCopyTestCase,
    handleEditTestCase,
    handleSaveEditTestCase,
    handleStartEditTestCaseName,
    handleCancelEditTestCaseName,
    handleSaveTestCaseName,
    handleToggleSelectAll,
    handleToggleTestCaseSelection,
    handleRunTestCase,
    handleBatchDelete,
    handleConfirmBatchDelete,
    handleBatchCopyTo,
    handleBatchMoveTo,
    handleConfirmCopyTo,
    handleConfirmMoveTo,
  };
}
