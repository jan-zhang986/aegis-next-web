import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  qualityWorkspaceService,
  type QualityAnalysis,
  type QualityAnalysisInput,
  type QualityAnalysisItem,
  type QualityAnalysisSection,
  RELEASE_CONCLUSION_LABEL,
} from '@/services/quality-workspace';
import { cn } from '@/utils/cn';

interface PlanDetailAnalysisProps {
  workspaceId: string;
  /** @deprecated use workspaceId */
  planId?: string;
  projectId: string;
  spaceId?: string;
  canEdit?: boolean;
  mode?: 'document' | 'review' | 'release';
  releaseConclusion?: string;
  onGenerated?: () => void;
  onNavigateCases?: () => void;
  onNavigateExecution?: () => void;
}

const unwrap = <T,>(res: any): T => (res?.data ?? res) as T;

const SECTION_HINTS: Record<string, string> = {
  OVERVIEW: '记录需求背景、相关 PRD/设计/接口文档、产品/开发/测试负责人。这里只放来源，不搬完整需求。',
  REQUIREMENT_ANALYSIS: '分析功能逻辑、主链路、上下游系统、数据状态、权限和影响到的老功能。',
  FUNCTIONAL_TEST: '拆本次需要验证的测试点和测试方向，将作为后续测试用例生成的来源。',
  NON_FUNCTIONAL: '只在涉及时启用，并登记并发、幂等、分布式事务、兼容性、LDC 等专项 CASE。',
  REGRESSION: '明确哪些历史主流程、接口、权限、数据展示或配置能力需要回归。',
  JOINT_CASE: '登记跨系统联调 CASE、依赖方、联调前置条件和预期结果。',
};

const SECTION_ITEM_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  OVERVIEW: [
    { value: 'RISK', label: '风险' },
    { value: 'QUESTION', label: '疑问' },
  ],
  REQUIREMENT_ANALYSIS: [
    { value: 'RISK', label: '风险点' },
    { value: 'QUESTION', label: '疑问点' },
  ],
  FUNCTIONAL_TEST: [
    { value: 'FUNCTIONAL_POINT', label: '功能测试点' },
    { value: 'RISK', label: '风险点' },
  ],
  NON_FUNCTIONAL: [
    { value: 'CONCURRENCY', label: '并发' },
    { value: 'IDEMPOTENCE', label: '幂等' },
    { value: 'DISTRIBUTED_TRANSACTION', label: '分布式事务' },
    { value: 'COMPATIBILITY', label: '兼容性' },
    { value: 'LDC', label: 'LDC' },
  ],
  REGRESSION: [
    { value: 'REGRESSION', label: '回归范围' },
    { value: 'RISK', label: '回归风险' },
  ],
  JOINT_CASE: [
    { value: 'JOINT_CASE', label: '联调 CASE' },
    { value: 'QUESTION', label: '联调疑问' },
  ],
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '分析中',
  REVIEWING: '待评审',
  REVIEWED: '已通过',
  NEED_SUPPLEMENT: '需补充',
  GENERATED: '已生成用例',
};

const INPUT_TYPE_OPTIONS = [
  { value: 'REQUIREMENT', label: '需求文档' },
  { value: 'PRD', label: 'PRD' },
  { value: 'TECH_DESIGN', label: '技术设计' },
  { value: 'API_DOC', label: '接口文档' },
  { value: 'OTHER', label: '其他资料' },
];

const REVIEW_LABEL: Record<string, string> = {
  NOT_SUBMITTED: '未提交',
  REVIEWING: '待评审',
  REVIEWED: '已通过',
  NEED_SUPPLEMENT: '需补充',
};

const RISK_OPTIONS = [
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' },
];

const NON_FUNCTIONAL_TRIGGERS = [
  { key: 'CONCURRENCY', label: '并发' },
  { key: 'IDEMPOTENCE', label: '幂等' },
  { key: 'DISTRIBUTED_TRANSACTION', label: '分布式事务' },
  { key: 'COMPATIBILITY', label: '兼容性' },
  { key: 'LDC', label: 'LDC' },
];

function itemTypeLabel(sectionKey?: string, itemType?: string) {
  const options = SECTION_ITEM_OPTIONS[sectionKey || ''] || [];
  return options.find((option) => option.value === itemType)?.label || itemType || '条目';
}


function isRiskItem(item: QualityAnalysisItem) {
  return item.riskLevel === 'HIGH' || item.itemType === 'RISK' || item.itemType === 'QUESTION' || item.status === 'BLOCKED';
}

export function PlanDetailAnalysis({
  workspaceId,
  planId,
  projectId,
  spaceId,
  canEdit = true,
  mode = 'document',
  releaseConclusion,
  onGenerated,
  onNavigateCases,
  onNavigateExecution,
}: PlanDetailAnalysisProps) {
  const resolvedWorkspaceId = workspaceId || planId || '';
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [savingItemSection, setSavingItemSection] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [inputForm, setInputForm] = useState({ inputType: 'PRD', title: '', refUrl: '' });
  const [savingInput, setSavingInput] = useState(false);
  const [pointForm, setPointForm] = useState({
    sectionKey: 'FUNCTIONAL_TEST',
    itemType: 'FUNCTIONAL_POINT',
    title: '',
    description: '',
    riskLevel: 'MEDIUM',
  });

  const sections = analysis?.sections || [];
  const items = analysis?.items || [];
  const inputs = analysis?.inputs || [];
  const generatedItems = items.filter((item) => item.workItemId);
  const riskItems = items.filter(isRiskItem);
  const questions = items.filter((item) => item.itemType === 'QUESTION' && item.status !== 'CLOSED');
  const regressionItems = items.filter((item) => item.sectionKey === 'REGRESSION');
  const jointCases = items.filter((item) => item.sectionKey === 'JOINT_CASE');
  const nonFunctionalSection = sections.find((section) => section.sectionKey === 'NON_FUNCTIONAL');
  const nonFunctionalTriggers = nonFunctionalSection?.metadata?.triggers || {};

  const loadAnalysis = useCallback(async () => {
    if (!resolvedWorkspaceId) return;
    setLoading(true);
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.getAnalysis(resolvedWorkspaceId));
      setAnalysis(next);
      const drafts: Record<string, string> = {};
      (next.sections || []).forEach((section) => {
        drafts[section.sectionKey] = section.content || '';
      });
      setSectionDrafts(drafts);
    } catch (error) {
      console.error(error);
      toast.error('加载测试分析失败');
    } finally {
      setLoading(false);
    }
  }, [resolvedWorkspaceId]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const saveDocument = async () => {
    if (!analysis?.analysisId) return;
    setSavingDocument(true);
    try {
      let next = analysis;
      for (const section of sections) {
        next = unwrap<QualityAnalysis>(await qualityWorkspaceService.saveAnalysisSection(resolvedWorkspaceId, analysis.analysisId, {
          sectionId: section.sectionId,
          sectionKey: section.sectionKey,
          title: section.title,
          enabled: section.enabled,
          content: sectionDrafts[section.sectionKey] ?? section.content ?? '',
          sort: section.sort,
          metadata: section.metadata,
        }));
      }
      setAnalysis(next);
      toast.success('测试分析文档已保存');
    } catch (error) {
      console.error(error);
      toast.error('保存文档失败');
    } finally {
      setSavingDocument(false);
    }
  };

  const addInputReference = async () => {
    if (!analysis?.analysisId || !inputForm.title.trim()) {
      toast.warning('请填写资料标题');
      return;
    }
    setSavingInput(true);
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.saveAnalysisInput(resolvedWorkspaceId, analysis.analysisId, {
        inputType: inputForm.inputType,
        title: inputForm.title,
        refUrl: inputForm.refUrl,
      } as QualityAnalysisInput));
      setAnalysis(next);
      setInputForm({ inputType: 'PRD', title: '', refUrl: '' });
      toast.success('已添加引用资料');
    } catch (error) {
      console.error(error);
      toast.error('添加引用失败');
    } finally {
      setSavingInput(false);
    }
  };

  const toggleNonFunctionalTrigger = async (key: string, checked: boolean) => {
    if (!analysis?.analysisId || !nonFunctionalSection) return;
    const metadata = {
      ...(nonFunctionalSection.metadata || {}),
      triggers: {
        ...(nonFunctionalSection.metadata?.triggers || {}),
        [key]: checked,
      },
    };
    const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.saveAnalysisSection(resolvedWorkspaceId, analysis.analysisId, {
      sectionId: nonFunctionalSection.sectionId,
      sectionKey: nonFunctionalSection.sectionKey,
      title: nonFunctionalSection.title,
      enabled: Object.values(metadata.triggers).some(Boolean),
      content: sectionDrafts[nonFunctionalSection.sectionKey] ?? nonFunctionalSection.content,
      sort: nonFunctionalSection.sort,
      metadata,
    }));
    setAnalysis(next);
  };

  const addItem = async () => {
    const sectionKey = pointForm.sectionKey;
    if (!analysis?.analysisId || !pointForm.title.trim()) {
      toast.warning('请先填写测试点标题');
      return;
    }
    setSavingItemSection(sectionKey);
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.saveAnalysisItem(resolvedWorkspaceId, analysis.analysisId, {
        sectionKey,
        itemType: pointForm.itemType,
        title: pointForm.title,
        description: pointForm.description,
        riskLevel: pointForm.riskLevel,
        selected: true,
        status: 'OPEN',
        metadata: { projectId, spaceId },
      }));
      setAnalysis(next);
      const options = SECTION_ITEM_OPTIONS[sectionKey] || SECTION_ITEM_OPTIONS.FUNCTIONAL_TEST;
      setPointForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        itemType: options[0]?.value || 'FUNCTIONAL_POINT',
      }));
      toast.success('测试点已加入清单');
    } catch (error) {
      console.error(error);
      toast.error('添加测试点失败');
    } finally {
      setSavingItemSection(null);
    }
  };

  const deleteItem = async (itemId?: string) => {
    if (!analysis?.analysisId || !itemId) return;
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.deleteAnalysisItem(resolvedWorkspaceId, analysis.analysisId, itemId));
      setAnalysis(next);
      toast.success('测试点已删除');
    } catch (error: any) {
      toast.error(error?.message || '删除测试点失败');
    }
  };

  const submitReview = async () => {
    if (!analysis?.analysisId) return;
    setReviewing(true);
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.submitAnalysisReview(resolvedWorkspaceId, analysis.analysisId));
      setAnalysis(next);
      toast.success('已提交测试评审');
    } catch (error: any) {
      toast.error(error?.message || '提交评审失败');
    } finally {
      setReviewing(false);
    }
  };

  const saveReview = async (reviewStatus: 'REVIEWED' | 'NEED_SUPPLEMENT') => {
    if (!analysis?.analysisId) return;
    setReviewing(true);
    try {
      const next = unwrap<QualityAnalysis>(await qualityWorkspaceService.reviewAnalysis(resolvedWorkspaceId, analysis.analysisId, {
        reviewStatus,
        content: reviewContent,
      }));
      setAnalysis(next);
      setReviewContent('');
      toast.success(reviewStatus === 'REVIEWED' ? '测试评审已通过' : '已标记需补充');
    } catch (error) {
      console.error(error);
      toast.error('保存评审结论失败');
    } finally {
      setReviewing(false);
    }
  };

  const statusText = STATUS_LABEL[analysis?.status || 'DRAFT'] || analysis?.status || '分析中';

  if (loading && !analysis) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        暂无测试分析
      </div>
    );
  }

  if (mode === 'review') {
    return (
      <ReviewPanel
        analysis={analysis}
        statusText={statusText}
        riskItems={riskItems}
        questions={questions}
        regressionItems={regressionItems}
        jointCases={jointCases}
        nonFunctionalTriggers={nonFunctionalTriggers}
        reviewContent={reviewContent}
        setReviewContent={setReviewContent}
        reviewing={reviewing}
        canEdit={canEdit}
        onSubmit={submitReview}
        onReview={saveReview}
      />
    );
  }

  if (mode === 'release') {
    return (
      <ReleasePanel
        items={items}
        generatedItems={generatedItems}
        riskItems={riskItems}
        questions={questions}
        reviewStatus={analysis.reviewStatus || analysis.status}
        releaseConclusion={releaseConclusion}
        onNavigateCases={onNavigateCases}
        onNavigateExecution={onNavigateExecution}
        canEdit={canEdit}
      />
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#F7F8FB]">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-blue-600" />
              <Badge variant="outline" className="rounded-md text-[10px] font-bold">测试分析文档</Badge>
              <Badge className="rounded-md border-none bg-blue-50 text-[10px] font-bold text-blue-700">{statusText}</Badge>
            </div>
            <h1 className="text-lg font-black text-slate-900">{analysis.title}</h1>
            <p className="mt-1 text-xs text-slate-500">测试同学内部完善；与研发的联合评审在生成用例后进行，对照需求文档一起确认。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={loadAnalysis}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              刷新
            </Button>
            <Button size="sm" className="rounded-xl bg-slate-900 font-black" disabled={!canEdit || savingDocument} onClick={saveDocument}>
              {savingDocument && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              保存文档
            </Button>
            {onNavigateCases && (
              <Button size="sm" className="rounded-xl bg-violet-600 font-black hover:bg-violet-700" onClick={onNavigateCases}>
                下一步：生成用例
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card className="mb-8 rounded-[24px] border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-black text-slate-900">输入资料引用</h2>
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-500">
            像 PRD、技术设计一样，测试分析建立在需求与设计资料之上。此处登记引用，正文只写测试判断。
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {inputs.length ? inputs.map((input) => (
              <a
                key={input.inputId || `${input.inputType}-${input.title}`}
                href={input.refUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition',
                  input.refUrl ? 'border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-slate-100 bg-slate-50 text-slate-600'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {INPUT_TYPE_OPTIONS.find((o) => o.value === input.inputType)?.label || input.inputType} · {input.title}
                {input.refUrl && <ExternalLink className="h-3 w-3 opacity-60" />}
              </a>
            )) : (
              <span className="text-xs text-slate-400">尚未添加引用，需求关联时会自动带入需求摘要。</span>
            )}
          </div>
          {canEdit && (
            <div className="grid gap-2 border-t border-slate-100 pt-4 md:grid-cols-[140px_1fr_1fr_auto]">
              <Select value={inputForm.inputType} onValueChange={(value) => setInputForm((prev) => ({ ...prev, inputType: value }))}>
                <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INPUT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={inputForm.title}
                onChange={(e) => setInputForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="资料名称"
                className="rounded-xl text-sm"
              />
              <Input
                value={inputForm.refUrl}
                onChange={(e) => setInputForm((prev) => ({ ...prev, refUrl: e.target.value }))}
                placeholder="链接（可选）"
                className="rounded-xl text-sm"
              />
              <Button onClick={addInputReference} disabled={savingInput} className="rounded-xl bg-slate-900 text-xs font-black">
                {savingInput ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
                添加
              </Button>
            </div>
          )}
        </Card>

        <nav className="mb-6 flex flex-wrap gap-2">
          {sections.map((section, index) => (
            <a
              key={section.sectionKey}
              href={`#section-${section.sectionKey}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600"
            >
              {index + 1}. {section.title}
            </a>
          ))}
          <a
            href="#test-points"
            className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 hover:bg-violet-100"
          >
            测试点清单 · {items.length}
          </a>
        </nav>

        <article className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {sections.map((section, index) => (
              <section
                key={section.sectionKey}
                id={`section-${section.sectionKey}`}
                className={cn('border-b border-slate-100 p-8', index === 0 && 'rounded-t-[28px]')}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">第 {index + 1} 章</div>
                    <h2 className="mt-1 text-xl font-black text-slate-900">{section.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{SECTION_HINTS[section.sectionKey]}</p>
                  </div>
                  {section.sectionKey === 'NON_FUNCTIONAL' && (
                    <div className="flex flex-wrap gap-2">
                      {NON_FUNCTIONAL_TRIGGERS.map((trigger) => (
                        <label key={trigger.key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                          <Checkbox
                            checked={!!nonFunctionalTriggers[trigger.key]}
                            disabled={!canEdit}
                            onCheckedChange={(checked) => toggleNonFunctionalTrigger(trigger.key, checked === true)}
                          />
                          {trigger.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <Textarea
                  value={sectionDrafts[section.sectionKey] ?? ''}
                  onChange={(event) => setSectionDrafts((prev) => ({ ...prev, [section.sectionKey]: event.target.value }))}
                  disabled={!canEdit}
                  placeholder="撰写本章分析正文：范围、策略、影响、风险与结论。"
                  className="min-h-[160px] resize-none rounded-2xl border-slate-200 bg-slate-50/40 text-sm leading-7"
                />
              </section>
          ))}

          <section id="test-points" className="rounded-b-[28px] bg-slate-50/80 p-8">
            <div className="mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-violet-600">附录</div>
              <h2 className="mt-1 text-xl font-black text-slate-900">测试点清单</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                整份文档的结构化测试点汇总于此。下一步将从这里生成可执行测试用例。
              </p>
            </div>

            <div className="space-y-2">
              {items.length ? items.map((item) => (
                <DocumentItemRow key={item.itemId} item={item} canEdit={canEdit} onDelete={() => deleteItem(item.itemId)} />
              )) : (
                <EmptyState text="还没有测试点，可在下方添加。" compact />
              )}
            </div>

            {canEdit && (
              <div className="mt-6 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                <div className="mb-3 text-xs font-black text-slate-700">添加测试点</div>
                <div className="grid gap-2 md:grid-cols-[140px_130px_1fr_100px_auto]">
                  <Select
                    value={pointForm.sectionKey}
                    onValueChange={(value) => {
                      const options = SECTION_ITEM_OPTIONS[value] || SECTION_ITEM_OPTIONS.FUNCTIONAL_TEST;
                      setPointForm((prev) => ({
                        ...prev,
                        sectionKey: value,
                        itemType: options[0]?.value || 'FUNCTIONAL_POINT',
                      }));
                    }}
                  >
                    <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sections.filter((s) => SECTION_ITEM_OPTIONS[s.sectionKey]).map((section) => (
                        <SelectItem key={section.sectionKey} value={section.sectionKey}>{section.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={pointForm.itemType}
                    onValueChange={(value) => setPointForm((prev) => ({ ...prev, itemType: value }))}
                  >
                    <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(SECTION_ITEM_OPTIONS[pointForm.sectionKey] || SECTION_ITEM_OPTIONS.FUNCTIONAL_TEST).map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={pointForm.title}
                    onChange={(e) => setPointForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="测试点标题"
                    className="rounded-xl text-sm"
                  />
                  <Select
                    value={pointForm.riskLevel}
                    onValueChange={(value) => setPointForm((prev) => ({ ...prev, riskLevel: value }))}
                  >
                    <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RISK_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addItem}
                    disabled={!!savingItemSection}
                    className="rounded-xl bg-violet-600 text-xs font-black hover:bg-violet-700"
                  >
                    {savingItemSection ? <Loader2 className="h-4 w-4 animate-spin" /> : '添加'}
                  </Button>
                  <Textarea
                    value={pointForm.description}
                    onChange={(e) => setPointForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="验证方向、前置条件、预期（可选）"
                    className="min-h-[60px] resize-none rounded-xl text-sm md:col-span-5"
                  />
                </div>
              </div>
            )}
          </section>
        </article>

        <div className="mt-8 flex flex-wrap justify-end gap-2 pb-8">
          <Button variant="outline" className="rounded-xl font-black" disabled={!canEdit || savingDocument} onClick={saveDocument}>
            {savingDocument && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存整份文档
          </Button>
          {onNavigateCases && (
            <Button className="rounded-xl bg-violet-600 font-black hover:bg-violet-700" onClick={onNavigateCases}>
              下一步：生成测试用例
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({
  analysis,
  statusText,
  riskItems,
  questions,
  regressionItems,
  jointCases,
  nonFunctionalTriggers,
  reviewContent,
  setReviewContent,
  reviewing,
  canEdit,
  onSubmit,
  onReview,
}: any) {
  const enabledNonFunctional = Object.entries(nonFunctionalTriggers || {}).filter(([, value]) => value).map(([key]) => key);
  return (
    <div className="h-full overflow-auto bg-[#F7F8FB] p-6">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="rounded-[24px] border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Badge className="rounded-md bg-blue-50 text-blue-700">{statusText}</Badge>
              <Badge variant="outline" className="rounded-md">{REVIEW_LABEL[analysis.reviewStatus || 'NOT_SUBMITTED'] || analysis.reviewStatus || '未提交'}</Badge>
            </div>
            <h2 className="text-2xl font-black text-slate-900">测试评审</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              评审整份测试分析文档：范围是否清楚、风险是否识别、回归与联调策略是否可执行。
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewBucket title="风险/疑问" icon={AlertTriangle} items={[...riskItems, ...questions]} empty="暂无高风险或未关闭疑问" />
            <ReviewBucket title="回归范围" icon={ClipboardCheck} items={regressionItems} empty="暂无回归范围" />
            <ReviewBucket title="非功能触发" icon={ShieldCheck} items={enabledNonFunctional.map((key) => ({ itemId: key, title: key, itemType: key }))} empty="未触发非功能专项" />
            <ReviewBucket title="联调 CASE" icon={MessageSquareText} items={jointCases} empty="暂无联调 CASE" />
          </div>
        </div>

        <Card className="h-fit rounded-[24px] border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">评审结论</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">提交评审后，评审人给出通过或需补充结论。</p>
          <Textarea
            value={reviewContent}
            onChange={(event) => setReviewContent(event.target.value)}
            disabled={!canEdit}
            placeholder="记录评审意见、需补充范围或通过说明。"
            className="mt-4 min-h-[140px] resize-none rounded-2xl"
          />
          <div className="mt-4 grid gap-2">
            <Button variant="outline" disabled={!canEdit || reviewing} onClick={onSubmit} className="rounded-xl font-black">
              {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              提交评审
            </Button>
            <Button disabled={!canEdit || reviewing} onClick={() => onReview('REVIEWED')} className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              评审通过
            </Button>
            <Button variant="outline" disabled={!canEdit || reviewing} onClick={() => onReview('NEED_SUPPLEMENT')} className="rounded-xl font-black text-amber-700">
              <AlertTriangle className="mr-2 h-4 w-4" />
              需补充
            </Button>
          </div>
          {analysis.latestReview && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              <div className="font-black text-slate-700">最近评审：{REVIEW_LABEL[analysis.latestReview.reviewStatus || ''] || analysis.latestReview.reviewStatus}</div>
              <p className="mt-2 leading-5">{analysis.latestReview.content || '无评审意见'}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ReleasePanel({
  items,
  generatedItems,
  riskItems,
  questions,
  reviewStatus,
  releaseConclusion,
  onNavigateCases,
  onNavigateExecution,
  canEdit,
}: any) {
  const pending = items.length - generatedItems.length;
  const conclusion = releaseConclusion || (reviewStatus === 'REVIEWED' && riskItems.length === 0 && pending === 0 ? 'READY' : 'CONDITIONAL');
  const conclusionLabel = RELEASE_CONCLUSION_LABEL[conclusion] || conclusion;
  const conclusionTone = conclusion === 'READY'
    ? 'text-emerald-600'
    : conclusion === 'BLOCKED' || conclusion === 'NOT_RECOMMENDED'
      ? 'text-rose-600'
      : conclusion === 'CONDITIONAL'
        ? 'text-amber-600'
        : 'text-slate-600';
  return (
    <div className="h-full overflow-auto bg-[#F7F8FB] p-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-4">
        <MetricCard title="准出结论" value={conclusionLabel} tone={conclusionTone} />
        <MetricCard title="分析测试点" value={items.length} />
        <MetricCard title="已生成用例" value={generatedItems.length} />
        <MetricCard title="风险/疑问" value={riskItems.length + questions.length} tone="text-rose-600" />
        <Card className="rounded-[24px] border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
          <h3 className="text-lg font-black text-slate-900">上线前确认</h3>
          <p className="mt-1 text-sm text-slate-500">准出基于测试分析文档、测试用例执行结果与风险关闭情况综合判断。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <CheckLine ok={generatedItems.length > 0} text="已从分析生成测试用例" />
            <CheckLine ok={reviewStatus === 'REVIEWED'} text="测试分析已评审通过" />
            <CheckLine ok={riskItems.length === 0} text="无高风险或阻塞项" />
            <CheckLine ok={questions.length === 0} text="疑问点已关闭" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {onNavigateCases && pending > 0 && (
              <Button onClick={onNavigateCases} className="rounded-xl bg-violet-600 font-black hover:bg-violet-700">
                前往生成用例（剩余 {pending}）
              </Button>
            )}
            {onNavigateExecution && (
              <Button variant="outline" onClick={onNavigateExecution} className="rounded-xl font-black">
                查看执行进度
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DocumentItemRow({ item, canEdit, onDelete }: { item: QualityAnalysisItem; canEdit: boolean; onDelete: () => void }) {
  const generated = !!item.workItemId;
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3', generated ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-white')}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {generated && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          <span className="text-sm font-black text-slate-900">{item.title}</span>
          <Badge variant="outline" className="rounded-md text-[9px] font-bold">{itemTypeLabel(item.sectionKey, item.itemType)}</Badge>
          {generated && <Badge className="rounded-md bg-emerald-100 text-[9px] font-black text-emerald-700">已生成用例</Badge>}
        </div>
        {item.description && <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>}
      </div>
      {canEdit && !generated && (
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-rose-500" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function ReviewBucket({ title, icon: Icon, items, empty }: any) {
  return (
    <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.length ? items.map((item: any) => (
          <div key={item.itemId || item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs font-black text-slate-900">{item.title}</div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{item.description || itemTypeLabel(item.sectionKey, item.itemType)}</p>
          </div>
        )) : <EmptyState text={empty} compact />}
      </div>
    </Card>
  );
}


function MetricCard({ title, value, tone = 'text-slate-900' }: any) {
  return (
    <Card className="rounded-[24px] border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-black uppercase tracking-wider text-slate-400">{title}</div>
      <div className={cn('mt-3 text-3xl font-black', tone)}>{value}</div>
    </Card>
  );
}

function CheckLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold', ok ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700')}>
      {ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
      {text}
    </div>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center', compact ? 'py-5' : 'py-10')}>
      <FileText className="mb-3 h-8 w-8 text-slate-300" />
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}
