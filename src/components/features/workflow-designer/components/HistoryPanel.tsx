/**
 * HistoryPanel 组件
 * 历史记录列表面板
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { Search, History, Activity, Clock, FileText, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import type { ExecutionLog, DebugMode } from '../../workflow/types';

interface HistoryPanelProps {
  // 搜索
  historySearchKeyword: string;
  setHistorySearchKeyword: (keyword: string) => void;
  // 加载状态
  loadingHistory: boolean;
  setLoadingHistory: (loading: boolean) => void;
  // 历史记录
  workflowHistory: any[];
  // 工作流节点（用于查找节点名称）
  workflow: WorkflowData;
  // 执行日志相关状态设置函数
  setExecutionLogs: React.Dispatch<React.SetStateAction<ExecutionLog[]>>;
  setDebugMode: React.Dispatch<React.SetStateAction<DebugMode>>;
  setDebugNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsExecuting: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExecutionDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * HistoryPanel 组件
 */
export const HistoryPanel = React.memo<HistoryPanelProps>(function HistoryPanel({
  historySearchKeyword,
  setHistorySearchKeyword,
  loadingHistory,
  setLoadingHistory,
  workflowHistory,
  workflow,
  setExecutionLogs,
  setDebugMode,
  setDebugNodeId,
  setIsExecuting,
  setIsExecutionDrawerOpen,
}: HistoryPanelProps) {
  // 处理查看详情
  const handleViewDetail = React.useCallback(async (item: any) => {
    try {
      setLoadingHistory(true);
      const runId = item.runId || item.id;
      if (!runId) {
        toast.error('运行ID不存在');
        return;
      }

      // 获取执行详情
      const detailResponse = await workflowService.getRunDetail(runId);
      if (!detailResponse) {
        toast.error('获取执行详情失败');
        return;
      }

      // 构建 ExecutionLog 数组
      const statusMap: Record<string, ExecutionLog['status']> = {
        'PENDING': 'pending',
        'RUNNING': 'running',
        'SUCCESS': 'success',
        'SUCCEED': 'success',
        'FAILED': 'failed',
        'FAIL': 'failed',
        'SKIPPED': 'skipped',
      };

      // 检查所有步骤是否都已完成（成功或失败都算完成）
      const allStepsCompleted = detailResponse.steps && detailResponse.steps.length > 0
        ? detailResponse.steps.every((step: any) => {
            const stepStatus = statusMap[step.status] || 'pending';
            return stepStatus === 'success' || stepStatus === 'failed';
          })
        : false;

      // 只要所有步骤都完成了，工作流执行就显示为成功
      const workflowStatus = allStepsCompleted
        ? 'success'
        : (detailResponse.status === 'SUCCESS' || detailResponse.status === 'SUCCEED'
          ? 'success'
          : detailResponse.status === 'FAILED' || detailResponse.status === 'FAIL'
            ? 'failed'
            : 'running');
      const workflowDescription = allStepsCompleted
        ? '工作流执行成功'
        : (detailResponse.errorMsg || (detailResponse.status === 'SUCCESS' || detailResponse.status === 'SUCCEED'
          ? '工作流执行成功'
          : detailResponse.status === 'FAILED' || detailResponse.status === 'FAIL'
            ? '工作流执行失败'
            : '工作流执行中'));

      const workflowLog: ExecutionLog = {
        id: `workflow-${runId}`,
        nodeId: 'workflow',
        name: '工作流执行',
        status: workflowStatus,
        timestamp: detailResponse.startTime ? new Date(detailResponse.startTime).toLocaleTimeString('zh-CN') : new Date().toLocaleTimeString('zh-CN'),
        description: workflowDescription,
        duration: detailResponse.durationMs,
        runId: runId,
      };

      const executionLogs: ExecutionLog[] = [workflowLog];

      // 添加步骤日志
      if (detailResponse.steps && detailResponse.steps.length > 0) {
        detailResponse.steps.forEach((step: any, index: number) => {
          const node = workflow.nodes.find(n => n.id === step.stepId);

          const stepDetail = {
            requestData: step.requestData,
            responseData: step.responseData,
            assertion: step.assertion,
            extractVars: step.extractVars,
            errorMsg: step.errorMsg,
            errorStack: step.errorStack,
          };

          executionLogs.push({
            id: `step-${step.runStepId || step.stepId}-${index}`,
            nodeId: step.stepId,
            name: step.stepName || node?.name || step.stepId,
            status: statusMap[step.status] || 'pending',
            timestamp: step.startTime ? new Date(step.startTime).toLocaleTimeString('zh-CN') : new Date().toLocaleTimeString('zh-CN'),
            description: step.errorMsg || step.description || `${node?.type?.toUpperCase() || 'NODE'} 节点${step.status === 'SUCCESS' || step.status === 'SUCCEED' ? '执行成功' : step.status === 'FAILED' || step.status === 'FAIL' ? '执行失败' : '执行完成'}`,
            duration: step.durationMs,
            runId: runId,
            runStepId: step.runStepId,
            parentId: workflowLog.id, // 设置父节点ID
            stepDetail: stepDetail,
          });
        });
      }

      // 设置日志并打开执行日志弹窗
      setExecutionLogs(executionLogs);
      setDebugMode('all');
      setDebugNodeId(null);
      setIsExecuting(false);
      setIsExecutionDrawerOpen(true);
    } catch (error: any) {
      console.error('打开执行日志失败:', error);
      toast.error(`打开执行日志失败: ${error?.message || '未知错误'}`);
    } finally {
      setLoadingHistory(false);
    }
  }, [workflow.nodes, setLoadingHistory, setExecutionLogs, setDebugMode, setDebugNodeId, setIsExecuting, setIsExecutionDrawerOpen]);

  // 过滤历史记录
  const filteredHistory = React.useMemo(() => {
    return workflowHistory.filter((item: any) => {
      // 只显示运行测试的记录，不显示调试的记录
      if (item.triggerType === 'DEBUG') return false;
      // 搜索过滤
      if (!historySearchKeyword) return true;
      const keyword = historySearchKeyword.toLowerCase();
      return (
        (item.runId || '').toLowerCase().includes(keyword) ||
        (item.workflowName || '').toLowerCase().includes(keyword) ||
        (item.status || '').toLowerCase().includes(keyword)
      );
    });
  }, [workflowHistory, historySearchKeyword]);

  return (
    <>
      {/* 搜索框 */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索历史记录..."
            value={historySearchKeyword}
            onChange={(e) => setHistorySearchKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div className="text-xs">暂无历史记录</div>
            </div>
          ) : (
            <div className="space-y-2.5 p-3">
              {filteredHistory.map((item: any) => {
                const isSuccess = item.status === 'SUCCESS' || item.status === 'SUCCEED';
                const isFailed = item.status === 'FAILED' || item.status === 'FAIL';
                const nodeCount = item.totalSteps || item.steps?.length || (item.passedCount ?? 0) + (item.failedCount ?? 0) || 0;

                return (
                  <div
                    key={item.runId || item.id}
                    className="border border-gray-200 rounded-lg bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="p-3">
                      {/* 上面：运行ID */}
                      <div className="mb-2.5">
                        <div className="text-xs text-gray-600">
                          <span className="text-gray-500">运行ID：</span>
                          <span className="font-medium text-gray-900 font-mono ml-1">
                            {item.runId || item.id || '未知'}
                          </span>
                        </div>
                      </div>

                      {/* 中间：节点数和执行时间 */}
                      <div className="flex items-center gap-4 mb-2.5 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-gray-400" />
                          <span>节点: <span className="font-medium text-gray-900">{nodeCount}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {item.startTime
                              ? new Date(item.startTime).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                }).replace(/\//g, '/')
                              : '未知'}
                          </span>
                        </div>
                      </div>

                      {/* 最下面：查看详情和运行情况 */}
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleViewDetail(item)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          查看详情
                        </Button>

                        {/* 运行情况状态标签 */}
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                          isSuccess
                            ? 'bg-green-500 text-white'
                            : isFailed
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {isSuccess ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isFailed ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                          {isSuccess ? 'Passed' : isFailed ? 'Failed' : '执行中'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
});
