import { useState, useCallback } from 'react';
import type { ExecutionLog, DebugMode } from './types';

/**
 * 执行日志管理 Hook
 * 用于管理工作流执行日志的状态和操作
 */
export function useExecutionLog() {
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [debugMode, setDebugMode] = useState<DebugMode>('all'); // 'single' 表示单个节点调试，'all' 表示运行所有节点
  const [debugNodeId, setDebugNodeId] = useState<string | null>(null); // 当前调试的节点ID

  /**
   * 打开执行日志抽屉
   */
  const openExecutionDrawer = useCallback(() => {
    setIsExecutionDrawerOpen(true);
  }, []);

  /**
   * 关闭执行日志抽屉
   */
  const closeExecutionDrawer = useCallback(() => {
    setIsExecutionDrawerOpen(false);
  }, []);

  /**
   * 切换执行日志抽屉的打开/关闭状态
   */
  const toggleExecutionDrawer = useCallback(() => {
    setIsExecutionDrawerOpen(prev => !prev);
  }, []);

  /**
   * 清空执行日志
   */
  const clearLogs = useCallback(() => {
    setExecutionLogs([]);
  }, []);

  /**
   * 更新执行日志
   */
  const updateLogs = useCallback((updater: (prev: ExecutionLog[]) => ExecutionLog[]) => {
    setExecutionLogs(updater);
  }, []);

  /**
   * 设置调试模式
   */
  const setMode = useCallback((mode: DebugMode) => {
    setDebugMode(mode);
  }, []);

  /**
   * 设置调试节点ID
   */
  const setNodeId = useCallback((nodeId: string | null) => {
    setDebugNodeId(nodeId);
  }, []);

  /**
   * 设置执行状态
   */
  const setExecuting = useCallback((executing: boolean) => {
    setIsExecuting(executing);
  }, []);

  /**
   * 开始执行（设置调试模式和节点ID，打开抽屉，清空日志）
   */
  const startExecution = useCallback((mode: DebugMode, nodeId: string | null = null) => {
    setDebugMode(mode);
    setDebugNodeId(nodeId);
    setIsExecuting(true);
    setIsExecutionDrawerOpen(true);
    setExecutionLogs([]);
  }, []);

  /**
   * 结束执行
   */
  const stopExecution = useCallback(() => {
    setIsExecuting(false);
  }, []);

  return {
    // 状态
    isExecutionDrawerOpen,
    executionLogs,
    isExecuting,
    debugMode,
    debugNodeId,
    
    // 操作方法
    setIsExecutionDrawerOpen,
    setExecutionLogs,
    setIsExecuting,
    setDebugMode,
    setDebugNodeId,
    
    // 便捷方法
    openExecutionDrawer,
    closeExecutionDrawer,
    toggleExecutionDrawer,
    clearLogs,
    updateLogs,
    setMode,
    setNodeId,
    setExecuting,
    startExecution,
    stopExecution,
  };
}

