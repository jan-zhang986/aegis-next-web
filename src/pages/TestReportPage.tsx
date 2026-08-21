import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Download,
  Search,
  PlayCircle,
  ArrowLeft,
  Edit2,
  SkipForward
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { ExecutionLogDrawer } from '@/components/features/workflow/ExecutionLogDrawer';
import { workflowService } from '@/services/workflow';
import type { ExecutionLog } from '@/components/features/workflow/types';
import { cn } from '@/utils/cn';
import { useTestReportPage } from './test-report-page';
import type { TestRecord } from './test-report-page/types';
import { workflowTestReportService } from '@/services/workflow-test-report';

interface TestReportPageProps {
  reportId?: string;
  onBack?: () => void;
}

export function TestReportPage({ reportId: propReportId, onBack: propOnBack }: TestReportPageProps = {}) {
  // 优先使用路由参数，如果不存在则使用 props（向后兼容）
  const { reportId: routeReportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  const reportId = routeReportId || propReportId;
  const onBack = propOnBack || (() => navigate('/test-factory/test-report'));

  // 使用 hooks 管理状态
  const reportPage = useTestReportPage(reportId);
  const {
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
    records,
    formatTimestamp,
    loadReportDetail,
    loadRecords,
  } = reportPage;

  // 执行日志抽屉相关状态
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // 报告名称编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');


  // 状态映射：后端状态 -> 前端状态
  // 注意：后端已经将状态映射为小写（success/failed/running/cancelled），但为了兼容性，也处理大写状态
  const mapStatusToFrontend = (status: string): 'success' | 'failed' | 'running' | 'cancelled' => {
    if (!status) return 'running';

    const normalizedStatus = status.toLowerCase();

    // 如果已经是小写格式，直接返回（后端已经映射过了）
    if (normalizedStatus === 'success' || normalizedStatus === 'failed' ||
      normalizedStatus === 'running' || normalizedStatus === 'cancelled') {
      return normalizedStatus as 'success' | 'failed' | 'running' | 'cancelled';
    }

    // 处理大写格式（兼容性处理）
    const statusMap: Record<string, 'success' | 'failed' | 'running' | 'cancelled'> = {
      'SUCCESS': 'success',
      'SUCCEED': 'success',
      'COMPLETED': 'success',
      'FAILED': 'failed',
      'FAIL': 'failed',
      'RUNNING': 'running',
      'CANCELLED': 'cancelled',
    };
    return statusMap[status.toUpperCase()] || 'running';
  };

  // 加载执行日志的函数
  const loadExecutionLogs = useCallback(async (runId: string, workflowId?: string) => {
    if (!runId) {
      toast.error('缺少运行ID');
      return;
    }

    setIsLoadingLogs(true);
    setCurrentRunId(runId);

    try {
      const detailResponse = await workflowService.getRunDetail(runId);

      if (!detailResponse) {
        toast.error('获取执行详情失败');
        return;
      }

      // 状态映射
      const statusMap: Record<string, ExecutionLog['status']> = {
        'PENDING': 'pending',
        'RUNNING': 'running',
        'SUCCESS': 'success',
        'SUCCEED': 'success',
        'FAILED': 'failed',
        'FAIL': 'failed',
        'SKIPPED': 'pending',
      };

      // 检查所有步骤是否都已完成（成功或失败都算完成）
      const allStepsCompleted = detailResponse.steps && detailResponse.steps.every((step: any) => {
        const stepStatus = statusMap[step.status] || 'pending';
        return stepStatus === 'success' || stepStatus === 'failed';
      });

      // 只要所有步骤都完成了，工作流执行就显示为成功
      const anyStepFailed = detailResponse.steps && detailResponse.steps.some((step: any) => {
        const stepStatus = statusMap[step.status] || 'pending';
        return stepStatus === 'failed';
      });

      const workflowFinalStatus: ExecutionLog['status'] = allStepsCompleted
        ? (anyStepFailed ? 'failed' : 'success')
        : (detailResponse.status === 'SUCCESS' || detailResponse.status === 'SUCCEED' ? 'success' : detailResponse.status === 'FAILED' || detailResponse.status === 'FAIL' ? 'failed' : 'running');

      const workflowFinalDescription = allStepsCompleted
        ? (anyStepFailed ? '工作流执行完成，部分步骤失败' : '工作流执行成功')
        : (detailResponse.errorMsg || (detailResponse.status === 'SUCCESS' || detailResponse.status === 'SUCCEED' ? '工作流执行成功' : detailResponse.status === 'FAILED' || detailResponse.status === 'FAIL' ? '工作流执行失败' : '工作流执行中'));

      // 创建工作流日志
      const workflowLog: ExecutionLog = {
        id: `workflow-${runId}`,
        nodeId: 'workflow',
        name: '工作流执行',
        status: workflowFinalStatus,
        timestamp: detailResponse.startTime ? new Date(detailResponse.startTime).toLocaleTimeString('zh-CN') : new Date().toLocaleTimeString('zh-CN'),
        description: workflowFinalDescription,
        duration: detailResponse.durationMs,
        runId: runId,
      };

      const logs: ExecutionLog[] = [workflowLog];

      // 添加步骤日志
      if (detailResponse.steps && detailResponse.steps.length > 0) {
        detailResponse.steps.forEach((step: any, index: number) => {
          const stepDetail = {
            requestData: step.requestData,
            responseData: step.responseData,
            assertion: step.assertion,
            extractVars: step.extractVars,
            errorMsg: step.errorMsg,
            errorStack: step.errorStack,
          };

          logs.push({
            id: `step-${step.runStepId || step.stepId}-${index}`,
            nodeId: step.stepId,
            name: step.stepName || step.stepId,
            status: statusMap[step.status] || 'pending',
            timestamp: step.startTime ? new Date(step.startTime).toLocaleTimeString('zh-CN') : new Date().toLocaleTimeString('zh-CN'),
            description: step.errorMsg || step.description || `${step.stepName || step.stepId} 节点${step.status === 'SUCCESS' || step.status === 'SUCCEED' ? '执行成功' : step.status === 'FAILED' || step.status === 'FAIL' ? '执行失败' : '执行完成'}`,
            duration: step.durationMs,
            runId: runId,
            runStepId: step.runStepId,
            parentId: workflowLog.id, // 设置父节点ID为工作流日志的ID
            stepDetail: stepDetail,
          });
        });
      }

      setExecutionLogs(logs);
      setIsExecutionDrawerOpen(true);
    } catch (error: any) {
      console.error('加载执行日志失败:', error);
      toast.error(`加载执行日志失败: ${error?.message || '未知错误'}`);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  /**
   * 加载报告详情（在组件挂载和 reportId 变化时）- 使用 hook 的 loadReportDetail
   */
  useEffect(() => {
    loadReportDetail();
  }, [loadReportDetail]);

  /**
   * 当报告详情加载完成时，初始化编辑名称
   */
  useEffect(() => {
    if (reportDetail?.reportName) {
      setEditingName(reportDetail.reportName);
    }
  }, [reportDetail?.reportName]);

  /**
   * 开始编辑报告名称
   */
  const handleStartEditName = useCallback(() => {
    if (reportDetail?.reportName) {
      setEditingName(reportDetail.reportName);
      setIsEditingName(true);
    }
  }, [reportDetail?.reportName]);

  /**
   * 取消编辑报告名称
   */
  const handleCancelEditName = useCallback(() => {
    if (reportDetail?.reportName) {
      setEditingName(reportDetail.reportName);
    }
    setIsEditingName(false);
  }, [reportDetail?.reportName]);

  /**
   * 保存报告名称（失焦时自动调用）
   */
  const handleSaveName = useCallback(async () => {
    // 先退出编辑模式，避免重复触发
    setIsEditingName(false);

    if (!reportId || !editingName.trim()) {
      // 如果名称为空，恢复原始名称
      if (reportDetail?.reportName) {
        setEditingName(reportDetail.reportName);
      }
      toast.error('报告名称不能为空');
      return;
    }

    if (editingName.trim() === reportDetail?.reportName) {
      // 名称未变化，不需要保存
      return;
    }

    try {
      await workflowTestReportService.updateTestReportName(reportId, editingName.trim());
      toast.success('报告名称更新成功');
      // 重新加载报告详情
      await loadReportDetail();
    } catch (error: any) {
      console.error('更新报告名称失败:', error);
      toast.error(`更新报告名称失败: ${error.message || '未知错误'}`);
      // 保存失败时，恢复原始名称
      if (reportDetail?.reportName) {
        setEditingName(reportDetail.reportName);
      }
    }
  }, [reportId, editingName, reportDetail?.reportName, loadReportDetail]);

  /**
   * 加载执行记录（在组件挂载和依赖变化时）- 使用 hook 的 loadRecords
   */
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 处理查看详情按钮点击
  const handleViewDetail = useCallback((record: TestRecord) => {
    if (!record.runId) {
      // 如果没有 runId，尝试使用 id 作为 runId（向后兼容）
      const runId = record.id.startsWith('TEST-') ? record.id.replace('TEST-', '') : record.id;
      loadExecutionLogs(runId, record.workflowId);
    } else {
      loadExecutionLogs(record.runId, record.workflowId);
    }
  }, [loadExecutionLogs]);

  // 计算工作流成功率 TOP 5 - 基于实际数据；跳过节点不参与成功率、不算失败
  const workflowSuccessRate = useMemo(() => {
    if (records.length === 0) {
      return [];
    }

    const workflowMap = new Map<string, {
      name: string;
      totalNodes: number;
      successNodes: number;
      failedNodes: number;
      skippedNodes: number;
    }>();

    records.forEach(record => {
      const name = record.workflowName;
      const existing = workflowMap.get(name) || {
        name,
        totalNodes: 0,
        successNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
      };

      existing.totalNodes += record.totalNodes || 0;
      existing.successNodes += record.successNodes || 0;
      existing.failedNodes += record.failedNodes || 0;
      existing.skippedNodes += record.skippedNodes || 0;

      workflowMap.set(name, existing);
    });

    const workflows = Array.from(workflowMap.values())
      .map(w => {
        const executedNodes = w.totalNodes - w.skippedNodes;
        const rate = executedNodes > 0 ? Math.round((w.successNodes / executedNodes) * 100 * 10) / 10 : 0;
        return {
          name: w.name,
          rate,
          successNodes: w.successNodes,
          failedNodes: w.failedNodes,
          skippedNodes: w.skippedNodes,
          totalNodes: w.totalNodes,
          executedNodes,
        };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    return workflows;
  }, [records]);

  // 核心指标数据 - 基于实际数据计算
  const metrics = useMemo(() => {
    if (!reportDetail && records.length === 0) {
      return {
        totalNodes: 0,
        executedNodes: 0,
        skippedNodes: 0,
        successRate: 0,
        failedNodes: 0,
        avgDuration: 0,
      };
    }

    if (reportDetail) {
      // 直接使用 reportDetail 中后端汇总好的全量数据，不从分页的 records 累加（records 只是当前页）
      const totalNodes = reportDetail.totalTests || 0;
      const totalSuccessNodes = reportDetail.successTests || 0;
      const skippedNodes = reportDetail.skippedTests || 0;
      // 实际执行的节点数 = 总数 - 跳过数
      const executedNodes = totalNodes - skippedNodes;
      // 失败节点数 = 实际执行的 - 成功的（确保一致性）
      const totalFailedNodes = executedNodes - totalSuccessNodes;
      // 成功率 = 成功节点数 / 实际执行的节点数
      const successRate = executedNodes > 0 ? (totalSuccessNodes / executedNodes * 100) : (reportDetail.successRate || 0);

      // 平均耗时：优先从 records 计算（秒），fallback 到 reportDetail
      const totalDuration = records.reduce((sum, e) => sum + (e.duration || 0), 0);
      const workflowCount = records.length;
      const avgDuration = workflowCount > 0
        ? Math.round((totalDuration / workflowCount) * 100) / 100
        : (reportDetail.avgDurationSeconds || 0);

      return {
        totalNodes,
        executedNodes,
        skippedNodes,
        successRate: Math.round(successRate * 10) / 10,
        failedNodes: Math.max(0, totalFailedNodes),
        avgDuration,
      };
    }

    const totalNodes = records.reduce((sum, e) => sum + (e.totalNodes || 0), 0);
    const totalSuccessNodes = records.reduce((sum, e) => sum + (e.successNodes || 0), 0);
    const totalSkippedNodes = records.reduce((sum, e) => sum + (e.skippedNodes || 0), 0);
    const executedNodes = totalNodes - totalSkippedNodes;
    const totalFailedNodes = executedNodes - totalSuccessNodes;
    const successRate = executedNodes > 0 ? (totalSuccessNodes / executedNodes * 100) : 0;

    const totalDuration = records.reduce((sum, e) => sum + (e.duration || 0), 0);
    const workflowCount = records.length;
    const avgDuration = workflowCount > 0
      ? Math.round((totalDuration / workflowCount) * 100) / 100
      : 0;

    return {
      totalNodes,
      executedNodes,
      skippedNodes: totalSkippedNodes,
      successRate: Math.round(successRate * 10) / 10,
      failedNodes: Math.max(0, totalFailedNodes),
      avgDuration,
    };
  }, [reportDetail, records]);

  // 筛选测试记录
  const filteredRecords = records.filter(record => {
    const matchSearch = record.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Passed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">未知</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <PlayCircle className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // 如果没有 reportId，显示错误
  if (!reportId) {
    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-8">
          <Card className="bg-white border-gray-200 shadow-sm p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg text-gray-900 mb-2">报告ID不存在</h3>
              <p className="text-gray-500 mb-4">请从报告列表中选择一个报告查看详情</p>
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回报告列表
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              className="gap-2 mb-4 text-gray-600 hover:text-gray-900"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
              返回报告列表
            </Button>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              {isLoadingDetail ? (
                <>
                  <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    {isEditingName ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur(); // 触发 onBlur，自动保存
                          } else if (e.key === 'Escape') {
                            handleCancelEditName();
                          }
                        }}
                        className="text-3xl font-semibold h-auto py-1 px-2"
                        autoFocus
                      />
                    ) : (
                      <>
                        <h1 className="text-3xl text-gray-900">
                          {reportDetail?.reportName || (reportId ? `测试报告 - ${reportId}` : '用例实现测试报告')}
                        </h1>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={handleStartEditName}
                          title="编辑报告名称"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {reportDetail?.summary || '全面的测试执行数据分析与报告'}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  toast.info('测试报告导出功能正在开发中，敬请期待');
                }}
              >
                <Download className="w-4 h-4" />
                导出报告
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-6 mb-8">
          <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-600 text-sm mb-2">总节点数</div>
                <div className="text-3xl text-gray-900">{metrics.totalNodes}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-600 text-sm mb-2">成功率</div>
                <div className="text-3xl text-gray-900">{metrics.successRate}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {reportDetail ? (reportDetail.successTests || 0) : records.reduce((sum, e) => sum + (e.successNodes || 0), 0)}/{metrics.executedNodes}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-600 text-sm mb-2">失败节点数</div>
                <div className="text-3xl text-gray-900">{metrics.failedNodes}</div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-600 text-sm mb-2">跳过节点数</div>
                <div className="text-3xl text-gray-900">{metrics.skippedNodes}</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <SkipForward className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-600 text-sm mb-2">平均耗时</div>
                <div className="text-3xl text-gray-900">
                  {typeof metrics.avgDuration === 'number'
                    ? (metrics.avgDuration < 1
                      ? metrics.avgDuration.toFixed(2)
                      : metrics.avgDuration < 10
                        ? metrics.avgDuration.toFixed(1)
                        : Math.round(metrics.avgDuration))
                    : metrics.avgDuration}s
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>


        {/* Workflow Success Rate */}
        {!isLoading && workflowSuccessRate.length > 0 && (
          <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow shadow-sm p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-lg text-gray-900">工作流成功率 TOP 5</h3>
            </div>
            <div className="space-y-4">
              {workflowSuccessRate.map((workflow, index) => {
                const { executedNodes, successNodes, failedNodes, skippedNodes, totalNodes } = workflow;
                const successPct = totalNodes > 0 ? (successNodes / totalNodes) * 100 : 0;
                const failPct = totalNodes > 0 ? (failedNodes / totalNodes) * 100 : 0;
                const skipPct = totalNodes > 0 ? (skippedNodes / totalNodes) * 100 : 0;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 text-center text-gray-500 text-sm">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-900">{workflow.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            <span className="text-green-600">{successNodes}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-red-600">{failedNodes}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-amber-600">{skippedNodes}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{totalNodes}</span>
                          </span>
                          <span className="text-sm text-gray-900">{workflow.rate}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden flex">
                        {totalNodes === 0 ? (
                          <div className="h-2 rounded-full bg-gray-300 flex-1" />
                        ) : (
                          <>
                            {successPct > 0 && (
                              <div
                                className="h-2 bg-green-500 transition-all duration-500 shrink-0"
                                style={{
                                  width: `${successPct}%`,
                                  borderTopLeftRadius: '9999px',
                                  borderBottomLeftRadius: '9999px',
                                  borderTopRightRadius: failPct === 0 && skipPct === 0 ? '9999px' : 0,
                                  borderBottomRightRadius: failPct === 0 && skipPct === 0 ? '9999px' : 0,
                                }}
                              />
                            )}
                            {failPct > 0 && (
                              <div
                                className="h-2 bg-red-500 transition-all duration-500 shrink-0"
                                style={{
                                  width: `${failPct}%`,
                                  borderTopLeftRadius: successPct === 0 ? '9999px' : 0,
                                  borderBottomLeftRadius: successPct === 0 ? '9999px' : 0,
                                  borderTopRightRadius: skipPct === 0 ? '9999px' : 0,
                                  borderBottomRightRadius: skipPct === 0 ? '9999px' : 0,
                                }}
                              />
                            )}
                            {skipPct > 0 && (
                              <div
                                className="h-2 bg-amber-400 transition-all duration-500 shrink-0"
                                style={{
                                  width: `${skipPct}%`,
                                  borderTopRightRadius: '9999px',
                                  borderBottomRightRadius: '9999px',
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Test Records Table */}
        <Card className="bg-white border-gray-100 hover:shadow-md transition-all shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">测试执行记录</h3>
              <div className="text-sm text-gray-500">
                共 {totalCount} 条记录
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  placeholder="搜索工作流名称或执行ID"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // 搜索时重置到第一页
                  }}
                  className="pl-10 h-10 border border-gray-200 bg-white hover:border-blue-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors rounded-lg"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1); // 筛选时重置到第一页
              }}>
                <SelectTrigger className="w-40 h-10 border border-gray-200 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500/20 transition-colors rounded-lg">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">
                    <span className="text-green-700">Passed</span>
                  </SelectItem>
                  <SelectItem value="failed">
                    <span className="text-red-700">Failed</span>
                  </SelectItem>
                  <SelectItem value="running">
                    <span className="text-blue-700">Pending</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                    <TableRow className="hover:bg-transparent border-none h-9">
                      <TableHead className="w-32 px-4 text-gray-500 font-semibold uppercase">测试ID</TableHead>
                      <TableHead className="px-4 text-gray-500 font-semibold uppercase">工作流名称</TableHead>
                      <TableHead className="w-24 px-4 text-center text-gray-500 font-semibold uppercase">状态</TableHead>
                      <TableHead className="w-32 px-4 text-gray-500 font-semibold uppercase">执行时长</TableHead>
                      <TableHead className="w-44 px-4 text-gray-500 font-semibold uppercase">开始时间</TableHead>
                      <TableHead className="w-44 px-4 text-gray-500 font-semibold uppercase">结束时间</TableHead>
                      <TableHead className="w-32 px-4 text-center text-gray-500 font-semibold uppercase">节点统计</TableHead>
                      <TableHead className="w-24 px-4 text-gray-500 font-semibold uppercase">执行人</TableHead>
                      <TableHead className="w-24 px-4 text-center text-gray-500 font-semibold uppercase">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="group border-b border-gray-100 transition-colors hover:bg-[#f2f3f5] h-10">
                        <TableCell className="text-gray-900">{record.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <span className="text-gray-900">{record.workflowName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="text-gray-900">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{typeof record.duration === 'number' ? (record.duration < 1 ? record.duration.toFixed(2) : Math.round(record.duration)) : record.duration}s</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 truncate max-w-[140px]">{record.startTime}</TableCell>
                        <TableCell className="text-gray-600 truncate max-w-[140px]">{record.endTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-green-600">{record.successNodes ?? 0}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-red-600">{record.failedNodes ?? 0}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-amber-600">{record.skippedNodes ?? 0}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{record.totalNodes ?? 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900">{record.executor}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleViewDetail(record)}
                            disabled={isLoadingLogs}
                          >
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  </div>
                  <p className="text-gray-500">没有找到匹配的测试记录</p>
                </div>
              )}

              <UnifiedPagination
                total={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                unitLabel="条报告"
                className="p-4 border-t border-gray-200"
              />
            </>
          )}
        </Card>
      </div>

      {/* 执行日志抽屉 */}
      <ExecutionLogDrawer
        open={isExecutionDrawerOpen}
        onOpenChange={setIsExecutionDrawerOpen}
        logs={executionLogs}
        isExecuting={false}
        debugMode="all"
        debugNodeId={null}
        onClearLogs={() => setExecutionLogs([])}
        onUpdateLogs={(updater) => setExecutionLogs(updater)}
      />
    </div>
  );
}
