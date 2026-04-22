/**
 * useWorkflowHistory Hook
 * 管理工作流执行历史记录相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect } from 'react';
import { workflowService } from '@/services/workflow';

interface UseWorkflowHistoryParams {
  workflowId?: string;
  projectId: string;
  userId?: string;
  leftPanelTab: string;
}

interface UseWorkflowHistoryReturn {
  // 状态
  workflowHistory: any[];
  setWorkflowHistory: React.Dispatch<React.SetStateAction<any[]>>;
  loadingHistory: boolean;
  setLoadingHistory: React.Dispatch<React.SetStateAction<boolean>>;
  historySearchKeyword: string;
  setHistorySearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  // 函数
  loadWorkflowHistory: () => Promise<void>;
}

/**
 * useWorkflowHistory Hook
 * 管理工作流执行历史记录相关逻辑
 */
export function useWorkflowHistory({
  workflowId,
  projectId,
  userId,
  leftPanelTab,
}: UseWorkflowHistoryParams): UseWorkflowHistoryReturn {
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearchKeyword, setHistorySearchKeyword] = useState('');

  // 加载工作流执行历史记录的函数
  const loadWorkflowHistory = useCallback(async () => {
    // 获取用户ID：优先使用传入的 userId，如果没有则尝试从 localStorage 获取
    const finalUserId = userId || (typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null) || null;

    if (!workflowId || !finalUserId || !projectId) {
      setWorkflowHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      // 调用历史记录API，后端已经过滤了DEBUG类型的记录，并且根据 projectId 和 triggerUser 过滤
      const response = await workflowService.getWorkflowHistory(workflowId, { 
        current: 1, 
        pageSize: 50,
        projectId: projectId, // 项目维度隔离
        triggerUser: finalUserId, // 个人维度隔离
      });
      
      // 后端返回的是 Pager<List<WorkflowRunDTO>>，经过响应拦截器处理后，应该是 { list: [...], total: ..., ... }
      const list = response?.list || (Array.isArray(response) ? response : []);
      
      // 后端已经根据 projectId 和 triggerUser 过滤了记录，并排除了 DEBUG 类型（执行历史）
      // 这里只做额外的安全检查，确保数据一致性
      const filteredList = Array.isArray(list) 
        ? list.filter((item: any) => {
            // 确保项目ID和用户ID匹配（虽然后端应该已经过滤了）
            return (!item.projectId || item.projectId === projectId) && 
                   (!item.triggerUser || item.triggerUser === finalUserId);
          })
        : [];
      
      setWorkflowHistory(filteredList);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      setWorkflowHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [workflowId, userId, projectId]);

  // 当切换到历史记录标签页时加载历史记录
  useEffect(() => {
    // 只有当切换到历史记录标签页时才加载
    if (leftPanelTab === 'history') {
      loadWorkflowHistory();
    }
  }, [leftPanelTab, loadWorkflowHistory]);

  return {
    workflowHistory,
    setWorkflowHistory,
    loadingHistory,
    setLoadingHistory,
    historySearchKeyword,
    setHistorySearchKeyword,
    loadWorkflowHistory,
  };
}
