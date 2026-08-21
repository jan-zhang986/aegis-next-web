import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import { caseManagementService } from '@/services';
import type { CaseRealization, CaseRealizationSummary } from '../types';

interface CaseRealizationSectionProps {
  caseId?: string;
  canEdit?: boolean;
}

function formatRealizationType(type?: string) {
  switch (type) {
    case 'MANUAL':
      return '手工';
    case 'API':
      return 'API';
    case 'UI_AUTOMATION':
      return 'UI 自动化';
    case 'FLOW':
      return '流程';
    case 'PERF':
      return '性能';
    default:
      return type || '-';
  }
}

function formatCoverageStatus(status?: string) {
  switch (status) {
    case 'AUTOMATED_ONLY':
      return '全自动化';
    case 'PARTIAL':
      return '部分自动化';
    case 'NONE':
      return '未自动化';
    default:
      return status || '未自动化';
  }
}

function formatRunStatus(status?: string) {
  switch (status) {
    case 'SUCCESS':
    case 'PASSED':
      return '成功';
    case 'ERROR':
    case 'FAILED':
      return '失败';
    case 'BLOCKED':
      return '阻塞';
    case 'PENDING':
    case 'TODO':
    case 'READY':
      return '待执行';
    default:
      return status || '未执行';
  }
}

function formatDateTime(value?: number | string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function getStatusClassName(realization: CaseRealization) {
  if (!realization.realized) return 'bg-gray-100 text-gray-600 border-gray-200';
  if (realization.enabled === false) return 'bg-slate-100 text-slate-600 border-slate-200';
  const status = realization.lastRunStatus || realization.workflowStatus || realization.status;
  if (status === 'SUCCESS' || status === 'PASSED' || status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'ERROR' || status === 'FAILED') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (status === 'BLOCKED') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

export function CaseRealizationSection({ caseId, canEdit = true }: CaseRealizationSectionProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [realizations, setRealizations] = useState<CaseRealization[]>([]);
  const [summary, setSummary] = useState<CaseRealizationSummary | null>(null);

  const loadRealizations = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        caseManagementService.getCaseRealizations(caseId),
        caseManagementService.getCaseRealizationSummary(caseId),
      ]);
      setRealizations(Array.isArray(listRes) ? listRes : []);
      setSummary(summaryRes ?? null);
    } catch (error) {
      console.error(error);
      setRealizations([]);
      setSummary(null);
      toast.error('加载实现信息失败');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadRealizations();
  }, [loadRealizations]);

  const sortedRealizations = useMemo(
    () => [...realizations].sort((a, b) => String(a.realizationType).localeCompare(String(b.realizationType))),
    [realizations]
  );

  const handleAction = useCallback(
    async (action: 'publish' | 'enable' | 'disable' | 'delete', realization: CaseRealization) => {
      if (!caseId || realization.realizationType === 'MANUAL') return;
      const key = `${action}:${realization.realizationType}`;
      setActionLoading(key);
      try {
        if (action === 'publish') {
          await caseManagementService.publishCaseRealization(caseId, realization.realizationType);
        } else if (action === 'enable') {
          await caseManagementService.enableCaseRealization(caseId, realization.realizationType);
        } else if (action === 'disable') {
          await caseManagementService.disableCaseRealization(caseId, realization.realizationType);
        } else {
          await caseManagementService.deleteCaseRealization(caseId, realization.realizationType);
        }
        await loadRealizations();
        toast.success(action === 'publish' ? '实现已发布' : action === 'enable' ? '实现已启用' : action === 'disable' ? '实现已停用' : '实现已删除');
      } catch (error) {
        console.error(error);
        toast.error('实现操作失败，请稍后重试');
      } finally {
        setActionLoading(null);
      }
    },
    [caseId, loadRealizations]
  );

  const handleRun = useCallback(
    async (realization: CaseRealization) => {
      if (!caseId || realization.realizationType === 'MANUAL') return;
      const key = `run:${realization.realizationType}`;
      setActionLoading(key);
      try {
        const res: any = await caseManagementService.executeCaseWorkflow(caseId);
        if (res?.success !== false) {
          toast.success('自动化已触发执行');
        } else {
          toast.error(res?.message || '执行触发失败');
        }
        await loadRealizations();
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || '执行触发失败，请重试');
      } finally {
        setActionLoading(null);
      }
    },
    [caseId, loadRealizations]
  );

  if (!caseId) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4">
        <Label className="text-sm font-medium text-gray-700">实现管理</Label>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-medium text-gray-700">实现管理</Label>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadRealizations} disabled={loading}>
          {loading ? '刷新中...' : '刷新'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-400">自动化覆盖</div>
          <div className="mt-1 text-sm font-medium text-gray-900">{formatCoverageStatus(summary?.automationCoverageStatus)}</div>
        </div>
        <div className="rounded-md bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-400">已实现数量</div>
          <div className="mt-1 text-sm font-medium text-gray-900">{summary?.realizedCount ?? sortedRealizations.filter((item) => item.realized).length}</div>
        </div>
      </div>

      {sortedRealizations.length ? (
        <div className="space-y-3">
          {sortedRealizations.map((realization) => (
            <div key={realization.realizationType} className="rounded-md border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{formatRealizationType(realization.realizationType)}</span>
                    <Badge variant="outline" className={getStatusClassName(realization)}>
                      {realization.realized ? (realization.enabled === false ? '已停用' : '已实现') : '未实现'}
                    </Badge>
                    {realization.workflowStatus && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">{realization.workflowStatus}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 break-all">{realization.workflowName || (realization.realized ? '已绑定实现流程' : '尚未绑定实现流程')}</div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                    <span>运行状态：{formatRunStatus(realization.lastRunStatus)}</span>
                    <span>最近运行：{formatDateTime(realization.lastRunTime)}</span>
                    <span>Workflow ID：{realization.workflowDefinitionId || '-'}</span>
                  </div>
                </div>
                {canEdit && realization.realizationType !== 'MANUAL' && (
                  <div className="flex flex-wrap justify-end gap-2 shrink-0">
                    {realization.realized && realization.enabled !== false && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        disabled={actionLoading === `run:${realization.realizationType}`}
                        onClick={() => handleRun(realization)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        执行
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={actionLoading === `publish:${realization.realizationType}`}
                      onClick={() => handleAction('publish', realization)}
                    >
                      发布
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={actionLoading === `${realization.enabled === false ? 'enable' : 'disable'}:${realization.realizationType}`}
                      onClick={() => handleAction(realization.enabled === false ? 'enable' : 'disable', realization)}
                    >
                      {realization.enabled === false ? '启用' : '停用'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-red-600 border-red-200 hover:text-red-700"
                      disabled={actionLoading === `delete:${realization.realizationType}`}
                      onClick={() => handleAction('delete', realization)}
                    >
                      删除
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50/60 px-3 py-6 text-center text-sm text-gray-500">
          暂无自动化实现
        </div>
      )}
    </div>
  );
}
