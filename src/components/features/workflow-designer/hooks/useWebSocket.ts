/**
 * useWebSocket Hook
 * 管理 WebSocket 连接相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useRef, useCallback } from 'react';
import type { ExecutionLog } from '../../workflow/types';

interface UseWebSocketParams {
  onExecutionLogsUpdate?: (updater: (prev: ExecutionLog[]) => ExecutionLog[]) => void;
  onExecutionComplete?: () => void;
  onLoadWorkflowHistory?: () => void;
  isExecuting?: boolean;
}

interface UseWebSocketReturn {
  connectWebSocketForRun: (runId: string) => void;
  disconnectWebSocket: () => void;
}

/** 将后端步骤时间戳（Unix 毫秒）格式化为本地时间，与历史记录展示一致 */
function formatStepTimestamp(ms: number | undefined | null): string {
  if (ms == null) return new Date().toLocaleString('zh-CN', { hour12: false });
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? new Date().toLocaleString('zh-CN', { hour12: false }) : d.toLocaleString('zh-CN', { hour12: false });
}

/**
 * useWebSocket Hook
 * 管理 WebSocket 连接相关逻辑
 */
export function useWebSocket({
  onExecutionLogsUpdate,
  onExecutionComplete,
  onLoadWorkflowHistory,
  isExecuting,
}: UseWebSocketParams): UseWebSocketReturn {
  const wsConnectionRef = useRef<WebSocket | null>(null);
  const wsReconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsReconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const currentRunIdRef = useRef<string | null>(null);

  // 构建 WebSocket URL
  const getWebSocketUrl = useCallback((runId: string) => {
    const isDevelopment = import.meta.env.DEV;
    
    // 优先使用环境变量配置的后端地址
    let backendUrl: string;
    
    if (isDevelopment) {
      // 开发环境：从环境变量获取后端地址，或使用默认值
      backendUrl = import.meta.env.VITE_METERSPHERE_BACKEND_URL_DEVELOPMENT || 
                   import.meta.env.VITE_METERSPHERE_BACKEND_URL || 
                   'http://localhost:8081';
    } else {
      // 生产环境：优先使用环境变量配置的后端地址
      backendUrl = import.meta.env.VITE_METERSPHERE_BACKEND_URL_PRODUCTION || 
                   import.meta.env.VITE_METERSPHERE_BACKEND_URL || 
                   window.location.origin; // 如果没有配置，则使用当前域名
      
      // 如果环境变量中的地址是 http:// 开头，但当前页面是 https://，则使用 https://
      // 如果环境变量中的地址是 https:// 开头，则使用 https://
      if (backendUrl.startsWith('https://') || window.location.protocol === 'https:') {
        backendUrl = backendUrl.replace(/^http/, 'https');
      }
    }
    
    // 将 http:// 转换为 ws://，https:// 转换为 wss://
    const wsUrl = backendUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/workflow/${runId}`;
  }, []);

  // WebSocket 连接管理：根据 runId 建立连接并处理执行结果推送
  const connectWebSocketForRun = useCallback((runId: string) => {
    if (wsConnectionRef.current && wsConnectionRef.current.readyState === WebSocket.OPEN && currentRunIdRef.current === runId) {
      return;
    }
    if (wsConnectionRef.current) {
      wsConnectionRef.current.close();
      wsConnectionRef.current = null;
    }
    currentRunIdRef.current = runId;

    try {
      const wsUrl = getWebSocketUrl(runId);
      const ws = new WebSocket(wsUrl);
      wsConnectionRef.current = ws;

      ws.onopen = () => {
        wsReconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // 后端使用 SocketMsgDTO：reportId, runMode, msgType, taskResult
          const msgType = data.msgType ?? data.type;
          const messageRunId = data.reportId ?? data.runId ?? data.taskResult?.runId;
          const currentRunId = currentRunIdRef.current;

          if (messageRunId !== currentRunId) return;

          // 工作流执行结果（SocketMsgDTO：msgType=EXEC_RESULT, runMode=workflow_result, taskResult={ runId, status, steps }）
          let detailResponse: any = null;
          if (data.msgType === 'EXEC_RESULT' && data.runMode === 'workflow_result' && data.taskResult) {
            detailResponse = data.taskResult;
          } else if (data.type === 'workflow_result' && data.runId) {
            detailResponse = data;
          }

          if (detailResponse && detailResponse.steps) {
            const statusMap: Record<string, ExecutionLog['status']> = {
              PENDING: 'pending',
              RUNNING: 'running',
              SUCCESS: 'success',
              SUCCEED: 'success',
              FAILED: 'failed',
              FAIL: 'failed',
              SKIPPED: 'skipped',
            };
            const logs: ExecutionLog[] = detailResponse.steps.map((step: any, index: number) => ({
              id: step.runStepId || step.stepId || `step-${index}`,
              nodeId: step.stepId,
              name: step.stepName || `步骤 ${index + 1}`,
              status: statusMap[step.status] ?? 'pending',
              timestamp: formatStepTimestamp(step.endTime ?? step.startTime),
              description: step.errorMsg || step.description || `步骤执行${step.status || 'PENDING'}`,
              duration: step.durationMs,
              runId: detailResponse.runId,
              runStepId: step.runStepId,
              stepDetail: {
                requestData: step.requestData,
                responseData: step.responseData,
                assertion: step.assertion,
                extractVars: step.extractVars,
                errorMsg: step.errorMsg,
                errorStack: step.errorStack,
              },
            }));
            if (onExecutionLogsUpdate) {
              onExecutionLogsUpdate(() => logs);
            }
            const isCompleted = detailResponse.status === 'SUCCESS' || detailResponse.status === 'SUCCEED' ||
              detailResponse.status === 'FAILED' || detailResponse.status === 'FAIL';
            if (isCompleted) {
              if (onExecutionComplete) onExecutionComplete();
              if (onLoadWorkflowHistory) onLoadWorkflowHistory();
            }
            return;
          }

          // 兼容：执行日志推送
          if (msgType === 'EXECUTION_LOG' && data.logs && onExecutionLogsUpdate) {
            onExecutionLogsUpdate(prev => {
              const existingIds = new Set(prev.map(log => log.id));
              const newLogs = data.logs.filter((log: ExecutionLog) => !existingIds.has(log.id));
              return [...prev, ...newLogs];
            });
            return;
          }
          // 兼容：执行完成（简易格式）
          if (msgType === 'EXECUTION_COMPLETE') {
            if (onExecutionComplete) onExecutionComplete();
            if (onLoadWorkflowHistory) onLoadWorkflowHistory();
          }
        } catch {
          // 忽略解析异常
        }
      };

      ws.onerror = () => {};

      ws.onclose = (event) => {
        wsConnectionRef.current = null;
        // 仅当被关闭的是当前会话时才重连（避免“换 runId 时关旧连接”触发用旧 runId 重连）
        const closedRunId = runId;
        const activeRunId = currentRunIdRef.current;
        if (closedRunId !== activeRunId) {
          return;
        }
        if (isExecuting && wsReconnectAttemptsRef.current < maxReconnectAttempts) {
          wsReconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, wsReconnectAttemptsRef.current), 30000);
          wsReconnectTimerRef.current = setTimeout(() => {
            connectWebSocketForRun(activeRunId);
          }, delay);
        }
      };
    } catch {
      // WebSocket 创建失败，静默处理
    }
  }, [getWebSocketUrl, isExecuting, onExecutionLogsUpdate, onExecutionComplete, onLoadWorkflowHistory]);

  // 断开 WebSocket 连接
  const disconnectWebSocket = useCallback(() => {
    if (wsConnectionRef.current) {
      wsConnectionRef.current.close();
      wsConnectionRef.current = null;
    }
    if (wsReconnectTimerRef.current) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }
    currentRunIdRef.current = null;
    wsReconnectAttemptsRef.current = 0;
  }, []);

  return {
    connectWebSocketForRun,
    disconnectWebSocket,
  };
}
