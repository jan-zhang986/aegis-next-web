/**
 * useTestCaseList Hook
 * 测试用例列表管理逻辑
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { E2ESpace } from '@/services/e2e-space';

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
  /** 创建时间（毫秒时间戳），用于排序 */
  createTime?: number;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

interface TestModule {
  id: string;
  name: string;
  testCaseCount: number;
  parentId?: string;
  children?: TestModule[];
}

interface UseTestCaseListParams {
  space: E2ESpace;
  selectedModule: string | null;
  modules: TestModule[];
  userMap: Map<string, UserInfo>;
  getAllModuleIds: (moduleId: string, moduleList: TestModule[]) => string[];
}

interface UseTestCaseListReturn {
  // 状态
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  moduleTestCaseCounts: Map<string, number>;
  setModuleTestCaseCounts: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  // 计算属性
  filteredTestCases: TestCase[];
  getModuleTestCaseCount: (moduleId: string) => number;
  // 操作函数
  loadTestCases: (moduleId?: string) => Promise<void>;
}

/**
 * useTestCaseList Hook
 * 管理测试用例列表
 */
export function useTestCaseList({
  space,
  selectedModule,
  modules,
  userMap,
  getAllModuleIds,
}: UseTestCaseListParams): UseTestCaseListReturn {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleTestCaseCounts, setModuleTestCaseCounts] = useState<Map<string, number>>(new Map());

  // 加载测试用例列表
  const loadTestCases = useCallback(async (moduleId?: string) => {
    try {
      const projectId = space.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        return;
      }

      let allTestCases: TestCase[] = [];

      if (moduleId) {
        const moduleIds = modules.length > 0 ? getAllModuleIds(moduleId, modules) : [moduleId];
        
        const promises = moduleIds.map(async (id) => {
          const list = await workflowService.getWorkflowList({
            projectId,
            moduleId: id,
            current: 1,
            pageSize: 500,
          });
          return list || [];
        });
        
        const results = await Promise.all(promises);
        const mergedList = results.flat();
        
        allTestCases = mergedList.map((item: any) => {
          let duration: number | undefined = undefined;
          let status: 'success' | 'failed' | 'not-run' = 'not-run';
          let lastRun: string | undefined = undefined;

          if (item.lastDurationMs != null) {
            duration = item.lastDurationMs;
          }
          
          if (item.lastRunStatus) {
            if (item.lastRunStatus === 'SUCCESS' || item.lastRunStatus === 'SUCCEED') {
              status = 'success';
            } else if (item.lastRunStatus === 'FAILED' || item.lastRunStatus === 'FAIL') {
              status = 'failed';
            } else {
              status = 'not-run';
            }
          }
          
          if (item.lastRunTime) {
            lastRun = new Date(item.lastRunTime).toLocaleString('zh-CN');
          }

          let creatorName = '未知';
          if (item.createUser) {
            const userInfo = userMap.get(item.createUser);
            if (userInfo) {
              creatorName = userInfo.name;
            } else {
              creatorName = item.createUser;
            }
          }

          return {
            id: item.workflowId,
            name: item.name,
            description: item.description || '',
            category: item.category || 'API',
            nodeCount: item.stepCount || 0,
            duration,
            status,
            lastRun,
            creator: creatorName,
            createTime: item.createTime != null ? Number(item.createTime) : undefined,
          };
        });
        // 按创建时间倒序排序（新的在前）
        allTestCases.sort((a, b) => (b.createTime ?? 0) - (a.createTime ?? 0));
      } else {
        const list = await workflowService.getWorkflowList({
          projectId,
          workspaceId: space.id,
          current: 1,
          pageSize: 500,
        });

        allTestCases = list.map((item: any) => {
          let duration: number | undefined = undefined;
          let status: 'success' | 'failed' | 'not-run' = 'not-run';
          let lastRun: string | undefined = undefined;

          if (item.lastDurationMs != null) {
            duration = item.lastDurationMs;
          }
          
          if (item.lastRunStatus) {
            if (item.lastRunStatus === 'SUCCESS' || item.lastRunStatus === 'SUCCEED') {
              status = 'success';
            } else if (item.lastRunStatus === 'FAILED' || item.lastRunStatus === 'FAIL') {
              status = 'failed';
            } else {
              status = 'not-run';
            }
          }
          
          if (item.lastRunTime) {
            lastRun = new Date(item.lastRunTime).toLocaleString('zh-CN');
          }

          let creatorName = '未知';
          if (item.createUser) {
            const userInfo = userMap.get(item.createUser);
            if (userInfo) {
              creatorName = userInfo.name;
            } else {
              creatorName = item.createUser;
            }
          }

          return {
            id: item.workflowId,
            name: item.name,
            description: item.description || '',
            category: item.category || 'API',
            nodeCount: item.stepCount || 0,
            duration,
            status,
            lastRun,
            creator: creatorName,
            createTime: item.createTime != null ? Number(item.createTime) : undefined,
          };
        });
        // 按创建时间倒序排序（新的在前）
        allTestCases.sort((a, b) => (b.createTime ?? 0) - (a.createTime ?? 0));
      }

      setTestCases(allTestCases);
      
      if (moduleId) {
        const moduleIds = modules.length > 0 ? getAllModuleIds(moduleId, modules) : [moduleId];
        const uniqueTestCases = new Set(allTestCases.map(tc => tc.id));
        const count = uniqueTestCases.size;
        
        setModuleTestCaseCounts(prev => {
          const next = new Map(prev);
          next.set(moduleId, count);
          return next;
        });
      }
    } catch (error: any) {
      console.error('加载测试用例列表失败:', error);
      toast.error(error.message || '加载测试用例列表失败');
    }
  }, [space.projectId, space.id, selectedModule, modules, getAllModuleIds, userMap]);

  // 根据搜索关键词过滤测试用例
  const filteredTestCases = useMemo(() => {
    return testCases.filter((testCase: TestCase) => {
      if (!searchTerm.trim()) {
        return true;
      }
      const keyword = searchTerm.toLowerCase();
      return (
        testCase.name.toLowerCase().includes(keyword) ||
        testCase.description.toLowerCase().includes(keyword)
      );
    });
  }, [testCases, searchTerm]);

  // 计算模块下的用例数量
  const getModuleTestCaseCount = useCallback((moduleId: string): number => {
    if (moduleTestCaseCounts.has(moduleId)) {
      return moduleTestCaseCounts.get(moduleId) || 0;
    }
    if (selectedModule === moduleId) {
      return filteredTestCases.length;
    }
    return 0;
  }, [moduleTestCaseCounts, selectedModule, filteredTestCases.length]);

  // 当 userMap 更新时，重新映射已加载的测试用例的创建者字段
  useEffect(() => {
    if (userMap.size > 0 && testCases.length > 0) {
      const updatedTestCases = testCases.map(tc => {
        if (tc.creator && /^\d+$/.test(tc.creator)) {
          const userInfo = userMap.get(tc.creator);
          if (userInfo) {
            return { ...tc, creator: userInfo.name };
          }
        }
        return tc;
      });
      setTestCases(updatedTestCases);
    }
  }, [userMap]);

  // 当选中模块变化时，加载该模块下的测试用例
  useEffect(() => {
    if (modules.length > 0 || selectedModule === null) {
      if (selectedModule) {
        loadTestCases(selectedModule);
      } else {
        loadTestCases();
      }
    }
  }, [selectedModule, space.projectId, modules, loadTestCases]);

  return {
    testCases,
    setTestCases,
    searchTerm,
    setSearchTerm,
    moduleTestCaseCounts,
    setModuleTestCaseCounts,
    filteredTestCases,
    getModuleTestCaseCount,
    loadTestCases,
  };
}
