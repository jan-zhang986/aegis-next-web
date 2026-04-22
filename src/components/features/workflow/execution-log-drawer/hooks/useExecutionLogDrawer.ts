import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { ExecutionLog } from '@/components/features/workflow/types';

/**
 * 执行日志抽屉的状态管理 hook
 * 管理展开/收起状态、加载控制台日志、加载步骤详情等功能
 */
export function useExecutionLogDrawer(
  logs: ExecutionLog[],
  onUpdateLogs: (updater: (prev: ExecutionLog[]) => ExecutionLog[]) => void
) {
  // 展开的日志ID集合
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  
  // 展开的控制台日志ID集合
  const [expandedConsoleLogIds, setExpandedConsoleLogIds] = useState<Set<string>>(new Set());
  
  // 展开的父节点ID集合
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());
  
  // 正在加载控制台日志的ID集合
  const [loadingConsoleLogs, setLoadingConsoleLogs] = useState<Set<string>>(new Set());
  
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 日志卡片引用映射
  const logCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /**
   * 切换日志详情展开/收起状态
   * 展开时始终从服务端拉取最新步骤详情，避免断言/提取被修改后仍显示上一次执行结果
   */
  const handleToggleDetail = useCallback(async (log: ExecutionLog, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    const isExpanded = expandedLogIds.has(log.id);
    
    // 展开时：始终根据当前 runId 从 API 拉取最新步骤详情，避免展示过期的 assertion/extractVars
    if (!isExpanded && log.runId && log.nodeId && log.nodeId !== 'workflow') {
      try {
        const runDetail = await workflowService.getRunDetail(log.runId);
        const steps = runDetail?.steps || [];
        const stepDetail = steps.find((step: any) => (step.stepId ?? step.nodeId) === log.nodeId);
        
        if (stepDetail) {
          onUpdateLogs(prevLogs =>
            prevLogs.map(l =>
              l.id === log.id
                ? {
                    ...l,
                    stepDetail: {
                      requestData: stepDetail.requestData,
                      responseData: stepDetail.responseData,
                      assertion: stepDetail.assertion,
                      extractVars: stepDetail.extractVars,
                      errorMsg: stepDetail.errorMsg,
                      errorStack: stepDetail.errorStack,
                    },
                  }
                : l
            )
          );
        }
      } catch (error: any) {
        toast.error(`加载详情失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
      }
    }
    
    // 切换展开状态
    setExpandedLogIds(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.delete(log.id);
      } else {
        newSet.add(log.id);
      }
      return newSet;
    });
  }, [expandedLogIds, onUpdateLogs]);

  /**
   * 加载控制台日志
   */
  const handleLoadConsoleLogs = useCallback(async (log: ExecutionLog) => {
    if (!log.runId || !log.nodeId) {
      toast.error('无法获取执行日志：缺少运行ID或节点ID');
      return;
    }

    setLoadingConsoleLogs(prev => new Set([...prev, log.id]));
    try {
      // 注意：日志入库时 run_step_id 存储的是 nodeId，所以这里使用 nodeId 作为 runStepId
      const consoleLogs = await workflowService.getRunLogsByRunIdAndRunStepId(log.runId, log.nodeId);
      
      // 更新日志，添加控制台日志
      onUpdateLogs(prevLogs => 
        prevLogs.map(l => 
          l.id === log.id 
            ? { ...l, consoleLogs }
            : l
        )
      );
    } catch (error: any) {
      toast.error(`获取执行日志失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
    } finally {
      setLoadingConsoleLogs(prev => {
        const newSet = new Set(prev);
        newSet.delete(log.id);
        return newSet;
      });
    }
  }, [onUpdateLogs]);

  /**
   * 切换控制台日志展开状态
   * 如果未展开且没有加载过日志，则加载日志
   */
  const handleToggleConsoleLogs = useCallback((log: ExecutionLog) => {
    const isConsoleExpanded = expandedConsoleLogIds.has(log.id);

    // 如果未展开且没有加载过日志，则加载日志
    if (!isConsoleExpanded && !log.consoleLogs && log.runId && log.nodeId && log.nodeId !== 'workflow') {
      handleLoadConsoleLogs(log);
    }

    // 切换展开状态
    setExpandedConsoleLogIds(prev => {
      const newSet = new Set(prev);
      if (isConsoleExpanded) {
        newSet.delete(log.id);
      } else {
        newSet.add(log.id);
      }
      return newSet;
    });
  }, [expandedConsoleLogIds, handleLoadConsoleLogs]);

  return {
    expandedLogIds,
    expandedConsoleLogIds,
    expandedParentIds,
    setExpandedParentIds,
    loadingConsoleLogs,
    scrollContainerRef,
    logCardRefs,
    handleToggleDetail,
    handleToggleConsoleLogs,
  };
}
