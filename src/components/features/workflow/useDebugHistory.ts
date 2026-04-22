import { useState, useCallback } from 'react';
import { workflowService } from '@/services/workflow';
import { toast } from 'sonner';
import type { DebugHistoryItem } from './types';

/**
 * 调试历史管理 Hook
 * 用于管理工作流调试历史的状态和操作
 */
export function useDebugHistory() {
  const [isDebugHistoryDrawerOpen, setIsDebugHistoryDrawerOpen] = useState(false);
  const [debugHistoryList, setDebugHistoryList] = useState<DebugHistoryItem[]>([]);
  const [debugHistoryLoading, setDebugHistoryLoading] = useState(false);
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = useState<any>(null);

  /**
   * 打开调试历史抽屉
   */
  const openDebugHistoryDrawer = useCallback(() => {
    setIsDebugHistoryDrawerOpen(true);
  }, []);

  /**
   * 关闭调试历史抽屉
   */
  const closeDebugHistoryDrawer = useCallback(() => {
    setIsDebugHistoryDrawerOpen(false);
  }, []);

  /**
   * 切换调试历史抽屉的打开/关闭状态
   */
  const toggleDebugHistoryDrawer = useCallback(() => {
    setIsDebugHistoryDrawerOpen(prev => !prev);
  }, []);

  /**
   * 加载调试历史列表
   */
  const loadHistory = useCallback(async (workflowId: string, userId?: string) => {
    if (!workflowId) {
      toast.error('请先保存工作流');
      return;
    }

    setSelectedHistoryRunId(null);
    setHistoryDetail(null);

    try {
      setDebugHistoryLoading(true);
      const response = await workflowService.getWorkflowHistory(workflowId, {
        current: 1,
        pageSize: 100,
        triggerUser: userId, // 只显示当前用户的调试记录
      });
      setDebugHistoryList(response?.list || []);
    } catch (error: any) {
      console.error('获取调试历史失败:', error);
      toast.error(`获取调试历史失败: ${error?.message || '未知错误'}`);
      setDebugHistoryList([]);
    } finally {
      setDebugHistoryLoading(false);
    }
  }, []);

  /**
   * 查看调试历史详情
   */
  const viewHistoryDetail = useCallback(async (runId: string) => {
    setSelectedHistoryRunId(runId);
    try {
      const detail = await workflowService.getRunDetail(runId);
      setHistoryDetail(detail);
    } catch (error: any) {
      console.error('获取调试详情失败:', error);
      toast.error(`获取调试详情失败: ${error?.message || '未知错误'}`);
    }
  }, []);

  /**
   * 删除调试历史记录
   */
  const deleteHistory = useCallback(async (runId: string) => {
    try {
      await workflowService.deleteRun(runId);
      setDebugHistoryList(prev => prev.filter(item => item.runId !== runId));
      if (selectedHistoryRunId === runId) {
        setSelectedHistoryRunId(null);
        setHistoryDetail(null);
      }
    } catch (error: any) {
      throw error; // 重新抛出错误，让组件处理
    }
  }, [selectedHistoryRunId]);

  /**
   * 打开调试历史抽屉并加载历史记录
   */
  const showDebugHistory = useCallback(async (workflowId: string, userId?: string) => {
    setIsDebugHistoryDrawerOpen(true);
    await loadHistory(workflowId, userId);
  }, [loadHistory]);

  /**
   * 清空选中的历史记录
   */
  const clearSelection = useCallback(() => {
    setSelectedHistoryRunId(null);
    setHistoryDetail(null);
  }, []);

  return {
    // 状态
    isDebugHistoryDrawerOpen,
    debugHistoryList,
    debugHistoryLoading,
    selectedHistoryRunId,
    historyDetail,
    
    // 状态设置方法
    setIsDebugHistoryDrawerOpen,
    setDebugHistoryList,
    setDebugHistoryLoading,
    setSelectedHistoryRunId,
    setHistoryDetail,
    
    // 操作方法
    openDebugHistoryDrawer,
    closeDebugHistoryDrawer,
    toggleDebugHistoryDrawer,
    loadHistory,
    viewHistoryDetail,
    deleteHistory,
    showDebugHistory,
    clearSelection,
  };
}

