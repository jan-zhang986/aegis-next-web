import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  qualityWorkspaceService,
  type QualityAnalysis,
  type QualityTask,
  type QualityWorkItem,
} from '@/services/quality-workspace';
import { WorkspaceLinkedDocumentsPanel } from './WorkspaceLinkedDocumentsPanel';
import type { WorkspaceReferenceBundle } from './workspace-trace-utils';

interface WorkspaceJointReviewPanelProps {
  workspaceId: string;
  projectId: string;
  canEdit?: boolean;
  demoMode?: boolean;
  referenceBundle?: WorkspaceReferenceBundle;
  onChanged?: () => void;
}

const unwrap = <T,>(res: any): T => (res?.data ?? res) as T;

const REVIEW_LABEL: Record<string, string> = {
  NOT_SUBMITTED: '未提交',
  REVIEWING: '评审中',
  REVIEWED: '已通过',
  NEED_SUPPLEMENT: '需补充',
};

const JOINT_CHECKLIST = [
  { id: 'req_understanding', label: '对需求的理解是否正确，有无偏差或遗漏' },
  { id: 'analysis_coverage', label: '测试分析各板块是否齐全（影响、功能、回归、联调等）' },
  { id: 'case_mapping', label: '测试用例是否覆盖了分析中的测试点与风险' },
  { id: 'case_quality', label: '用例步骤/预期是否有明显错误或不可执行描述' },
  { id: 'cross_check', label: '与需求文档、技术设计对照后，对应模块无漏测' },
];

function extractRecords(res: any): any[] {
  const data = unwrap<any>(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

interface CaseRow extends QualityWorkItem {
  taskType?: string;
}

export function WorkspaceJointReviewPanel({
  workspaceId,
  projectId,
  canEdit = true,
  demoMode = false,
  referenceBundle,
  onChanged,
}: WorkspaceJointReviewPanelProps) {
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const analysisRes = unwrap<QualityAnalysis>(await qualityWorkspaceService.getAnalysis(workspaceId));
      setAnalysis(analysisRes);

      const tasks = unwrap<QualityTask[]>(await qualityWorkspaceService.getTaskList(workspaceId)) || [];
      const executableTasks = tasks.filter((t) => !['ANALYSIS', 'REVIEW'].includes(t.taskType));
      const rows: CaseRow[] = [];
      for (const task of executableTasks) {
        const res = await qualityWorkspaceService.getWorkItemPage({
          workspaceId,
          taskId: task.taskId,
          projectId,
          current: 1,
          pageSize: 100,
        });
        extractRecords(res).forEach((item) => {
          rows.push({ ...item, taskId: item.taskId || task.taskId, taskType: task.taskType });
        });
      }
      setCases(rows);
    } catch (error) {
      console.error(error);
      toast.error('加载评审材料失败');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const items = analysis?.items || [];
  const reviewStatus = analysis?.reviewStatus || 'NOT_SUBMITTED';

  const readinessHint = useMemo(() => {
    if (!items.length) return '建议先在测试分析中补充测试点，并生成用例后再发起联合评审。';
    if (!cases.length) return '尚未生成测试用例，请回到「测试用例」步骤生成后再评审。';
    return '点击左侧板块导航，对照 PRD 链接与测分章节，确认测试点、用例覆盖完整。';
  }, [items.length, cases.length]);

  const submitReview = async () => {
    if (!analysis?.analysisId) return;
    if (!cases.length) {
      toast.warning('请先生成测试用例，再发起联合评审');
      return;
    }
    setReviewing(true);
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.submitAnalysisReview(workspaceId, analysis.analysisId));
      setAnalysis(next);
      toast.success('已发起联合评审，可邀请研发一同确认');
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || '提交评审失败');
    } finally {
      setReviewing(false);
    }
  };

  const saveReview = async (status: 'REVIEWED' | 'NEED_SUPPLEMENT') => {
    if (!analysis?.analysisId) return;
    setReviewing(true);
    try {
      const next = unwrap<QualityAnalysis>(
        await qualityWorkspaceService.reviewAnalysis(workspaceId, analysis.analysisId, {
          reviewStatus: status,
          content: reviewContent,
        })
      );
      setAnalysis(next);
      setReviewContent('');
      toast.success(status === 'REVIEWED' ? '联合评审已通过，可开始执行' : '已标记需补充');
      onChanged?.();
    } catch (error: any) {
      toast.error(error?.message || '保存评审结论失败');
    } finally {
      setReviewing(false);
    }
  };

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading && !analysis) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F7F8FB]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#F7F8FB]">
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="rounded-md bg-cyan-50 text-cyan-800">
                <Users className="mr-1 h-3 w-3" />
                联合评审
              </Badge>
              <Badge variant="outline" className="rounded-md">
                {REVIEW_LABEL[reviewStatus] || reviewStatus}
              </Badge>
            </div>
            <h2 className="text-sm font-black text-slate-900">需求资料 · 测试分析 · 用例 板块联动评审</h2>
            <p className="mt-1 text-xs text-slate-500">{readinessHint}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <WorkspaceLinkedDocumentsPanel
          workspaceId={workspaceId}
          projectId={projectId}
          canEdit={false}
          mode="readonly"
          hideHeader
          demoMode={demoMode}
          referenceBundle={referenceBundle}
        />
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-2xl border-slate-200 p-4 shadow-none">
            <h3 className="text-sm font-black text-slate-900">评审核对项</h3>
            <p className="mt-1 text-xs text-slate-500">与研发一起过一遍，勾选表示已确认。</p>
            <div className="mt-3 space-y-2">
              {JOINT_CHECKLIST.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <Checkbox checked={!!checklist[item.id]} onCheckedChange={() => toggleCheck(item.id)} className="mt-0.5" />
                  <span className="text-sm leading-6 text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-4 shadow-none">
            <h3 className="text-sm font-black text-slate-900">评审结论</h3>
            <Textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              disabled={!canEdit}
              placeholder="记录理解偏差、需补充项、阻塞项…"
              className="mt-3 min-h-[96px] resize-none rounded-xl"
            />
            <div className="mt-3 grid gap-2">
              <Button variant="outline" disabled={!canEdit || reviewing} onClick={submitReview} className="rounded-xl font-black">
                {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                发起联合评审
              </Button>
              <Button disabled={!canEdit || reviewing} onClick={() => saveReview('REVIEWED')} className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                评审通过
              </Button>
              <Button variant="outline" disabled={!canEdit || reviewing} onClick={() => saveReview('NEED_SUPPLEMENT')} className="rounded-xl font-black text-amber-700">
                <AlertTriangle className="mr-2 h-4 w-4" />
                需补充
              </Button>
            </div>
            {analysis?.latestReview && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <div className="font-black text-slate-700">
                  最近：{REVIEW_LABEL[analysis.latestReview.reviewStatus || ''] || analysis.latestReview.reviewStatus}
                </div>
                <p className="mt-1 leading-5">{analysis.latestReview.content || '无评审意见'}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
