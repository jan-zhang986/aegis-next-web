/**
 * 测试计划报告详情页（完整版）
 * 参考设计：面包屑、执行时间、报告/执行/功能用例分析（图标、环形图、进度条）、报告总结、缺陷明细搜索
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Share2,
  Check,
  FileDown,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  Pencil,
  Search,
  Timer,
  Ban,
  Zap,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/features/case-management/components/RichTextContent';
import { formatTimestampBeijing } from '@/utils/date';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import type { PlanReportDetail, ReportCountDetail, ReportMetricsItemModel, ReportLayoutCardItem, ReportBugItem, ReportCaseItem } from '@/types/testPlan';
import { ReportCardTypeEnum, getReportExecuteResultDisplay } from '@/constants/testPlanEnums';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const defaultCount: ReportCountDetail = {
  success: 0,
  error: 0,
  fakeError: 0,
  block: 0,
  pending: 0,
};

/** 从 countDetail 计算通过率与总数 */
function getSummaryFromCount(detailCount: ReportCountDetail | undefined) {
  const c = detailCount || defaultCount;
  const { success, error, fakeError, pending, block } = c;
  const caseTotal = success + error + fakeError + pending + block;
  const successRate = caseTotal > 0 ? ((success / caseTotal) * 100).toFixed(2) + '%' : '0%';
  return { caseTotal, successRate };
}

interface TestPlanReportDetailPageProps {
  reportId: string;
  shareId?: string;
  onBack?: () => void;
}

export function TestPlanReportDetailPage({ reportId, shareId, onBack }: TestPlanReportDetailPageProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PlanReportDetail | null>(null);
  const [cardList, setCardList] = useState<ReportLayoutCardItem[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [exportPdfLoading, setExportPdfLoading] = useState(false);
  const [summaryEditing, setSummaryEditing] = useState(false);
  const [summaryEditContent, setSummaryEditContent] = useState('');
  const [summarySaving, setSummarySaving] = useState(false);

  const isGroup = useMemo(() => (detail?.planCount != null && detail.planCount > 0) || (detail?.children?.length ?? 0) > 0, [detail]);

  const handleReportUploadImage = useCallback(async (file: File): Promise<string> => {
    const res: any = await testPlanManagementService.editorUploadFile({ fileList: [file] });
    const url = res?.data ?? res?.url ?? (typeof res === 'string' ? res : null);
    if (url && typeof url === 'string') return url;
    const fileId = res?.id ?? res?.fileId;
    if (fileId) return `/api/test-plan/report/preview/md/${(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}/${fileId}`;
    throw new Error('上传失败：无法获取文件地址');
  }, [detail]);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    testPlanManagementService
      .getReportDetail(reportId, shareId)
      .then((res: any) => {
        setDetail(res ?? null);
      })
      .catch((e) => {
        console.error(e);
        toast.error('加载报告详情失败');
      })
      .finally(() => setLoading(false));
  }, [reportId, shareId]);

  useEffect(() => {
    if (!detail?.id) return;
    const defaultLayout = detail.defaultLayout !== false;
    if (defaultLayout) {
      setCardList(
        isGroup
          ? [
            { id: ReportCardTypeEnum.SUB_PLAN_DETAIL, value: ReportCardTypeEnum.SUB_PLAN_DETAIL, label: '子计划明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.SUMMARY, value: ReportCardTypeEnum.SUMMARY, label: '报告总结', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.BUG_DETAIL, value: ReportCardTypeEnum.BUG_DETAIL, label: '缺陷明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.FUNCTIONAL_DETAIL, value: ReportCardTypeEnum.FUNCTIONAL_DETAIL, label: '功能用例明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.API_CASE_DETAIL, value: ReportCardTypeEnum.API_CASE_DETAIL, label: '接口用例明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.SCENARIO_CASE_DETAIL, value: ReportCardTypeEnum.SCENARIO_CASE_DETAIL, label: '用例实现明细', type: 'SYSTEM' },
          ]
          : [
            { id: ReportCardTypeEnum.SUMMARY, value: ReportCardTypeEnum.SUMMARY, label: '报告总结', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.BUG_DETAIL, value: ReportCardTypeEnum.BUG_DETAIL, label: '缺陷明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.FUNCTIONAL_DETAIL, value: ReportCardTypeEnum.FUNCTIONAL_DETAIL, label: '功能用例明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.API_CASE_DETAIL, value: ReportCardTypeEnum.API_CASE_DETAIL, label: '接口用例明细', type: 'SYSTEM' },
            { id: ReportCardTypeEnum.SCENARIO_CASE_DETAIL, value: ReportCardTypeEnum.SCENARIO_CASE_DETAIL, label: '用例实现明细', type: 'SYSTEM' },
          ]
      );
      return;
    }
    testPlanManagementService
      .getReportLayout(detail.id, shareId)
      .then((res: any[]) => {
        const list: ReportLayoutCardItem[] = (res || []).map((item: any) => ({
          id: item.id,
          value: item.name ?? item.value,
          label: item.label ?? '',
          content: item.value ?? item.content,
          type: item.type,
          enableEdit: false,
          richTextTmpFileIds: item.richTextTmpFileIds,
        }));
        setCardList(list);
      })
      .catch(() => setCardList([]));
  }, [detail?.id, detail?.defaultLayout, isGroup, shareId]);

  const handleCopyShare = useCallback(async () => {
    if (!detail?.id) return;
    const projectId = (detail as any)?.projectId || localStorage.getItem('currentProjectId') || '';
    if (!projectId) {
      toast.error('缺少项目信息，无法生成分享链接');
      return;
    }
    try {
      const res: any = await testPlanManagementService.planReportShare({
        reportId: detail.id,
        projectId,
      });
      let href: string | null = res?.shareUrl ?? res?.shareHref ?? (typeof res === 'string' ? res : null);
      if (!href && res?.shareId) {
        href = `${window.location.origin}/share/test-plan-report?shareId=${encodeURIComponent(res.shareId)}&reportId=${encodeURIComponent(detail.id)}`;
      }
      if (href && typeof href === 'string') {
        if (!href.startsWith('http')) {
          href = `${window.location.origin}${href.startsWith('/') ? '' : '/'}${href}`;
        }
        await navigator.clipboard.writeText(href);
        setShareCopied(true);
        toast.success('分享链接已复制');
        setTimeout(() => setShareCopied(false), 2000);
      } else {
        toast.error('获取分享链接失败');
      }
    } catch (e) {
      console.error(e);
      toast.error('获取分享链接失败');
    }
  }, [detail?.id]);

  const handleSaveSummary = useCallback(
    async (cardId: string) => {
      if (!detail?.id) return;
      setSummarySaving(true);
      try {
        // 与原项目一致：总结卡片固定使用 componentId: "SUMMARY"
        await testPlanManagementService.updateReportDetail({
          id: detail.id,
          componentId: ReportCardTypeEnum.SUMMARY,
          componentValue: summaryEditContent,
          richTextTmpFileIds: [],
        });
        setDetail((prev) => (prev ? { ...prev, summary: summaryEditContent } : null));
        setSummaryEditing(false);
        toast.success('报告总结已保存');
      } catch (e) {
        console.error(e);
        toast.error('保存失败');
      } finally {
        setSummarySaving(false);
      }
    },
    [detail?.id, summaryEditContent]
  );

  const handleOneClickSummary = useCallback(() => {
    if (!detail) return;
    const funcCount = detail.functionalCount || defaultCount;
    const apiCount = detail.apiCaseCount || defaultCount;
    const scenarioCount = detail.apiScenarioCount || defaultCount;
    const total =
      funcCount.success +
      funcCount.error +
      funcCount.fakeError +
      funcCount.block +
      funcCount.pending +
      (apiCount.success + apiCount.error + apiCount.fakeError + apiCount.block + apiCount.pending) +
      (scenarioCount.success + scenarioCount.error + scenarioCount.fakeError + scenarioCount.block + scenarioCount.pending);
    const executed =
      funcCount.success + funcCount.error + funcCount.block +
      (apiCount.success + apiCount.error + apiCount.block) +
      (scenarioCount.success + scenarioCount.error + scenarioCount.block);
    const success =
      (funcCount.success || 0) + (apiCount.success || 0) + (scenarioCount.success || 0);
    const rate = total > 0 ? ((success / total) * 100).toFixed(2) : '0';
    const name = detail.name || detail.testPlanName || '测试计划';
    const html = `<p><strong>${name}</strong> 包含功能用例、接口用例、用例实现，共 ${total} 条用例，已执行 ${executed} 条，通过 ${success} 条，通过率 ${rate}%；共关联缺陷 ${detail.bugCount ?? 0} 个。</p>`;
    setSummaryEditContent(html);
    toast.success('已一键填写报告总结');
  }, [detail]);

  const handleExportPdf = useCallback(async () => {
    if (!reportId) return;
    setExportPdfLoading(true);
    try {
      const blob = await testPlanManagementService.testPlanReportExportPdf(reportId);
      if (!(blob instanceof Blob)) {
        toast.error('导出失败：返回格式异常');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detail?.name ?? '测试计划报告'}-${reportId}.pdf`.replace(/[/\\?%*:|"<>]/g, '-');
      a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch (e) {
      console.error(e);
      toast.error('导出 PDF 失败');
    } finally {
      setExportPdfLoading(false);
    }
  }, [reportId, detail?.name]);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full min-w-0 bg-gray-50 items-center justify-center text-gray-500">
        <div className="animate-pulse text-sm">加载中...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col h-full w-full min-w-0 bg-gray-50 items-center justify-center text-gray-500 px-6">
        <p className="text-sm">未找到报告</p>
        {onBack && (
          <Button variant="outline" className="mt-4" onClick={onBack}>
            返回列表
          </Button>
        )}
      </div>
    );
  }

  const functionalTotal = isGroup ? (detail.functionalTotal ?? 0) : getSummaryFromCount(detail.functionalCount).caseTotal;
  const apiCaseTotal = isGroup ? (detail.apiCaseTotal ?? 0) : getSummaryFromCount(detail.apiCaseCount).caseTotal;
  const scenarioCaseTotal = isGroup ? (detail.apiScenarioTotal ?? 0) : getSummaryFromCount(detail.apiScenarioCount).caseTotal;

  const reportAnalysisList: ReportMetricsItemModel[] = isGroup
    ? [
      { name: '计划总数', value: detail.planCount ?? 0, unit: '个', icon: 'plan_total' },
      { name: '用例总数', value: detail.caseTotal ?? 0, unit: '个', icon: 'case_total' },
      { name: '通过率', value: detail.passRate ?? 0, unit: '%', icon: 'passRate' },
      { name: '缺陷总数', value: detail.bugCount ?? 0, unit: '个', icon: 'bugTotal' },
    ]
    : [
      { name: '通过阈值', value: detail.passThreshold ?? 0, unit: '%', icon: 'threshold' },
      { name: '通过率', value: detail.passRate ?? 0, unit: '%', icon: 'passRate' },
      { name: '执行完成率', value: detail.executeRate ?? 0, unit: '%', icon: 'passRate' },
      { name: '缺陷总数', value: detail.bugCount ?? 0, unit: '个', icon: 'bugTotal' },
    ];

  const executeCount = detail.executeCount || defaultCount;
  const execTotal = executeCount.success + executeCount.error + executeCount.fakeError + executeCount.pending + executeCount.block;

  const execPercent = (key: keyof ReportCountDetail) =>
    execTotal > 0 ? ((executeCount[key] / execTotal) * 100).toFixed(2) : '0.00';
  const funcCount = detail.functionalCount || defaultCount;
  const funcTotal = funcCount.success + funcCount.error + funcCount.fakeError + funcCount.block + funcCount.pending;
  const funcPercent = (key: keyof ReportCountDetail) =>
    funcTotal > 0 ? ((funcCount[key] / funcTotal) * 100).toFixed(2) : '0.00';
  const funcPassRate = funcTotal > 0 ? ((funcCount.success / funcTotal) * 100).toFixed(2) : '0.00';

  const execRingColor =
    execTotal === 0
      ? 'text-gray-200'
      : executeCount.error + executeCount.fakeError + executeCount.block > 0
        ? 'text-amber-500'
        : 'text-green-500';

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-gray-50">
      {/* 面包屑 + 头部：全宽白底，内容居中并带左右留白 */}
      <div className="bg-white border-b border-gray-100 shrink-0 w-full">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 pt-5 pb-2 flex items-center gap-2 text-xs text-gray-400">
          {onBack && (
            <button type="button" className="hover:text-blue-600 transition-colors flex items-center gap-1 group" onClick={onBack}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              返回测试计划
            </button>
          )}
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-gray-500">报告</span>
          <ChevronRight className="w-3 h-3 opacity-50" />
          <span className="text-gray-700">报告详情</span>
        </div>
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 pb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-xl font-semibold text-gray-900 truncate max-w-3xl cursor-default">
                  {detail.name ?? '报告详情'}
                </h1>
              </TooltipTrigger>
              <TooltipContent>{detail.name ?? '报告详情'}</TooltipContent>
            </Tooltip>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-4">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
                #{detail.id?.slice(0, 8)}
              </span>
              <span>执行时间：{formatTimestampBeijing(detail.startTime)} 至 {formatTimestampBeijing(detail.endTime)}</span>
            </div>
          </div>
          {!shareId && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyShare}>
                {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shareCopied ? '已复制' : '分享'}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={exportPdfLoading} onClick={handleExportPdf}>
                <FileDown className="w-4 h-4" />
                {exportPdfLoading ? '导出中...' : '导出 PDF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 主内容区：全宽灰底铺满，内容居中 + 留白，减少挤压感 */}
      <div className="flex-1 overflow-auto w-full">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10 py-6">
          {/* 三个分析面板：报告分析、执行分析、功能用例分析 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8">
            {/* 报告分析 */}
            {/* 报告分析 - 2x2 网格化 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-h-[200px]">
              <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                报告分析
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: '通过阈值',
                    value: detail.passThreshold,
                    unit: '%',
                    icon: ShieldCheck,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: '通过率',
                    value: detail.passRate,
                    unit: '%',
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                  },
                  {
                    label: '执行完成率',
                    value: detail.executeRate,
                    unit: '%',
                    icon: Zap,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                  {
                    label: '缺陷总数',
                    value: detail.bugCount,
                    unit: '个',
                    icon: AlertCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-gray-50 bg-gray-50/30 flex flex-col gap-1.5 transition-all hover:border-gray-100 hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      {item.label}
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-bold text-gray-800 tabular-nums">
                        {item.value != null ? (typeof item.value === 'number' ? item.value.toFixed(2).replace(/\.00$/, '') : item.value) : '-'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 执行分析：环形图 + 状态明细集成进度条 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-h-[200px]">
              <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full" />
                执行分析
              </div>
              <div className="flex gap-6 items-center">
                <div className="shrink-0 pt-1">
                  <div className="w-24 h-24 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50/50 shadow-inner relative overflow-hidden">
                    <div className="text-center z-10">
                      <div className="text-[10px] text-gray-400 font-medium">总数</div>
                      <div className="text-lg font-bold text-gray-800 leading-tight">{execTotal}</div>
                    </div>
                    {/* 装饰性的外环 */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="44" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                      {(() => {
                        let offset = 0;
                        const radius = 44;
                        const circumference = 2 * Math.PI * radius;
                        return [
                          { key: 'success', color: '#22c55e', val: executeCount.success },
                          { key: 'fakeError', color: '#f59e0b', val: executeCount.fakeError },
                          { key: 'block', color: '#a855f7', val: executeCount.block },
                          { key: 'error', color: '#ef4444', val: executeCount.error },
                        ].map((item) => {
                          if (execTotal === 0 || item.val === 0) return null;
                          const dash = (item.val / execTotal) * circumference;
                          const currentOffset = offset;
                          offset += dash;
                          return (
                            <circle
                              key={item.key}
                              cx="48" cy="48" r={radius}
                              fill="none"
                              stroke={item.color}
                              strokeWidth="6"
                              strokeDasharray={`${dash} ${circumference}`}
                              strokeDashoffset={-currentOffset}
                              className="transition-all duration-1000 ease-out"
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {[
                    { key: 'pending' as const, label: '待执行', color: 'text-gray-500', barBg: 'bg-gray-200', count: executeCount.pending },
                    { key: 'success' as const, label: '成功', color: 'text-green-600', barBg: 'bg-green-500', count: executeCount.success },
                    { key: 'block' as const, label: '阻塞', color: 'text-purple-600', barBg: 'bg-purple-500', count: executeCount.block },
                    { key: 'error' as const, label: '失败', color: 'text-red-700', barBg: 'bg-red-500', count: executeCount.error },
                  ].map(({ key, label, color, barBg, count }) => {
                    const percent = execTotal > 0 ? (count / execTotal) * 100 : 0;
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${barBg}`} />
                            {label}
                          </div>
                          <span className={`text-[11px] font-medium tabular-nums ${color}`}>
                            {count} <span className="text-gray-400 font-normal">({percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barBg} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 功能用例分析：进度条 + 通过率环形 */}
            {(functionalTotal > 0 || apiCaseTotal > 0 || scenarioCaseTotal > 0) && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-h-[200px]">
                <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-500 rounded-full" />
                  用例分析
                </div>
                {functionalTotal > 0 ? (
                  <div className="flex items-center gap-5">
                    <div className="flex-1 space-y-3.5">
                      {[
                        { key: 'pending' as const, label: '待执行', icon: Timer, barBg: 'bg-gray-200' },
                        { key: 'success' as const, label: '成功', icon: CheckCircle2, barBg: 'bg-green-500' },
                        { key: 'block' as const, label: '阻塞', icon: Ban, barBg: 'bg-purple-500' },
                        { key: 'error' as const, label: '失败', icon: XCircle, barBg: 'bg-red-500' },
                      ].map(({ key, label, icon: Icon, barBg }) => {
                        const percent = funcPercent(key);
                        return (
                          <div key={key} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <Icon className="w-3 h-3" />
                                {label}
                              </div>
                              <span className="text-[11px] font-medium text-gray-700 tabular-nums">
                                {funcCount[key]} <span className="text-gray-400 font-normal">({percent}%)</span>
                              </span>
                            </div>
                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${barBg} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="shrink-0 pt-2">
                      <div className="w-20 h-20 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50/50 shadow-inner relative group cursor-default overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-center z-10">
                          <div className="text-[10px] text-gray-400 font-medium">通过率</div>
                          <div className="text-lg font-bold text-green-600 leading-tight">{funcPassRate}%</div>
                        </div>
                        {/* 装饰性的外环 */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="40" cy="40" r="38"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="2"
                          />
                          <circle
                            cx="40" cy="40" r="38"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * (1 - (Number(funcPassRate) || 0) / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-gray-500">
                    {apiCaseTotal > 0 && (
                      <div className="flex justify-between">
                        <span>接口用例</span>
                        <span className="font-medium text-gray-700">{getSummaryFromCount(detail.apiCaseCount).successRate} · 共 {apiCaseTotal} 个</span>
                      </div>
                    )}
                    {scenarioCaseTotal > 0 && (
                      <div className="flex justify-between">
                        <span>用例实现</span>
                        <span className="font-medium text-gray-700">{getSummaryFromCount(detail.apiScenarioCount).successRate} · 共 {scenarioCaseTotal} 个</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 卡片区：子计划明细、报告总结、缺陷明细、功能/接口/用例实现明细、自定义卡片 */}
          <div className="space-y-6">
            {cardList.map((card) => {
              const showCard =
                card.value === ReportCardTypeEnum.FUNCTIONAL_DETAIL
                  ? functionalTotal > 0
                  : card.value === ReportCardTypeEnum.API_CASE_DETAIL
                    ? apiCaseTotal > 0
                    : card.value === ReportCardTypeEnum.SCENARIO_CASE_DETAIL
                      ? scenarioCaseTotal > 0
                      : true;
              if (!showCard) return null;

              return (
                <div key={card.id} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                  {card.value === ReportCardTypeEnum.SUB_PLAN_DETAIL && (
                    <ReportSubPlanTable reportId={detail.id} shareId={shareId} label={card.label} />
                  )}
                  {card.value === ReportCardTypeEnum.SUMMARY && (
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-800">{card.label}</span>
                        {!shareId && (
                          <div className="flex items-center gap-2">
                            {!summaryEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-gray-600"
                                  onClick={() => {
                                    setSummaryEditContent(detail.summary || '');
                                    setSummaryEditing(true);
                                  }}
                                >
                                  <Pencil className="w-3 h-3 mr-1" /> 编辑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-gray-600"
                                  onClick={handleOneClickSummary}
                                >
                                  一键填写
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={summarySaving}
                                  onClick={() => setSummaryEditing(false)}
                                >
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={summarySaving}
                                  onClick={() => handleSaveSummary(card.id)}
                                >
                                  {summarySaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                  保存
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-h-[120px] p-5 text-sm text-gray-600 prose prose-sm max-w-none bg-gray-50/50">
                        {!shareId && summaryEditing ? (
                          <RichTextEditor
                            value={summaryEditContent}
                            onChange={setSummaryEditContent}
                            placeholder="请输入报告总结，支持富文本、粘贴/拖拽图片"
                            minHeight="140px"
                            uploadImage={handleReportUploadImage}
                            className="rounded-md border border-gray-200"
                            editorClassName="text-sm"
                          />
                        ) : detail.summary?.trim() ? (
                          <RichTextContent content={detail.summary} className="[&_img]:max-w-full [&_img]:h-auto" />
                        ) : (
                          <span className="text-gray-400">暂无总结</span>
                        )}
                      </div>
                    </div>
                  )}
                  {card.value === ReportCardTypeEnum.BUG_DETAIL && (
                    <ReportBugTable reportId={detail.id} shareId={shareId} label={card.label} />
                  )}
                  {card.value === ReportCardTypeEnum.FUNCTIONAL_DETAIL && (
                    <ReportFeatureCaseTable reportId={detail.id} shareId={shareId} label={card.label} />
                  )}
                  {card.value === ReportCardTypeEnum.API_CASE_DETAIL && (
                    <ReportApiCaseTable reportId={detail.id} shareId={shareId} label={card.label} />
                  )}
                  {card.value === ReportCardTypeEnum.SCENARIO_CASE_DETAIL && (
                    <ReportScenarioCaseTable reportId={detail.id} shareId={shareId} label={card.label} />
                  )}
                  {card.value === ReportCardTypeEnum.CUSTOM_CARD && card.content && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">{card.label}</div>
                      <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: card.content }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- 子计划明细表格 ----------
function ReportSubPlanTable({ reportId, shareId, label }: { reportId: string; shareId?: string; label: string }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    testPlanManagementService
      .getReportDetailPlanPage({ reportId, shareId, current: 1, pageSize: 100 })
      .then((res: any) => setList(res?.list ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [reportId, shareId]);
  return (
    <div className="w-full min-w-0">
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      {loading ? (
        <div className="text-sm text-gray-400 py-4">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">暂无子计划</div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <Table className="w-full text-sm">
            <TableHeader className="bg-[#f7f8fa] border-b border-gray-100">
              <TableRow className="hover:bg-transparent border-none h-9">
                <TableHead className="font-medium text-gray-500 text-xs">计划名称</TableHead>
                <TableHead className="font-medium text-gray-500 text-xs text-center">通过率</TableHead>
                <TableHead className="font-medium text-gray-500 text-xs text-center">执行完成率</TableHead>
                <TableHead className="font-medium text-gray-500 text-xs text-center">缺陷数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row: any) => (
                <TableRow key={row.id} className="hover:bg-[#f2f3f5]/50 group transition-colors border-b border-gray-50 h-11">
                  <TableCell className="font-medium text-gray-700">{row.planName ?? row.name ?? '-'}</TableCell>
                  <TableCell className="text-gray-600 text-center font-mono text-xs">{row.passRate != null ? `${row.passRate}%` : '-'}</TableCell>
                  <TableCell className="text-gray-600 text-center font-mono text-xs">{row.executeRate != null ? `${row.executeRate}%` : '-'}</TableCell>
                  <TableCell className="text-gray-600 text-center font-mono text-xs">{row.bugCount ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ---------- 缺陷明细表格 ----------
function ReportBugTable({ reportId, shareId, label }: { reportId: string; shareId?: string; label: string }) {
  const [list, setList] = useState<ReportBugItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const pageSize = 10;

  const fetch = useCallback(() => {
    setLoading(true);
    const params = shareId
      ? { reportId, shareId, current: page, pageSize, keyword: keyword || undefined }
      : { reportId, current: page, pageSize, keyword: keyword || undefined };
    const api = shareId ? testPlanManagementService.getReportShareBugList : testPlanManagementService.getReportBugList;
    api(params)
      .then((res: any) => {
        setList(res?.list ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [reportId, shareId, page, pageSize, keyword]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="ID/名称搜索"
            className="pl-8 h-8 text-xs border-gray-200 bg-gray-50/50 focus:bg-white transition-all rounded-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetch()}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-sm text-gray-400 py-4">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">暂无缺陷</div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
            <Table className="w-full text-sm">
              <TableHeader className="bg-[#f7f8fa] border-b border-gray-100">
                <TableRow className="hover:bg-transparent border-none h-9">
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">ID</TableHead>
                  <TableHead className="min-w-[200px] font-medium text-gray-500 text-xs">缺陷名称</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs">状态</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs">处理人</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">用例数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id} className="hover:bg-[#f2f3f5]/50 group transition-colors border-b border-gray-50 h-11">
                    <TableCell className="text-blue-600 font-medium text-xs text-center">#{row.num ?? '-'}</TableCell>
                    <TableCell className="text-gray-700">{row.title ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs bg-gray-50/50 text-gray-600 border-gray-200">
                        {row.statusName ?? row.status ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{row.handleUserName ?? '-'}</TableCell>
                    <TableCell className="text-gray-600 text-center font-mono text-xs">{row.relationCaseCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <UnifiedPagination
            total={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            unitLabel="个缺陷"
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}

// 功能用例明细-执行结果筛选项（与后端 filter.executeResult 一致）
const REPORT_FUNCTIONAL_EXECUTE_RESULT_OPTIONS = [
  { value: 'PENDING', label: '未执行' },
  { value: 'SUCCESS', label: '通过' },
  { value: 'ERROR', label: '失败' },
  { value: 'BLOCKED', label: '阻塞' },
  { value: 'SKIPPED', label: '跳过' },
];

// ---------- 功能用例明细表格（支持关键词搜索 + 执行结果筛选，参考 spotter featureCaseTable.vue） ----------
function ReportFeatureCaseTable({ reportId, shareId, label }: { reportId: string; shareId?: string; label: string }) {
  const [list, setList] = useState<ReportCaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [executeResultFilter, setExecuteResultFilter] = useState<string[]>([]);
  const pageSize = 10;

  const fetch = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = shareId
      ? { reportId, shareId, current: page, pageSize }
      : { reportId, current: page, pageSize };
    if (keyword.trim()) params.keyword = keyword.trim();
    if (executeResultFilter.length > 0) params.filter = { executeResult: executeResultFilter };
    const api = shareId ? testPlanManagementService.getReportShareFeatureCaseList : testPlanManagementService.getReportFeatureCaseList;
    api(params)
      .then((res: any) => {
        setList(res?.list ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [reportId, shareId, page, pageSize, keyword, executeResultFilter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSearch = () => {
    setPage(1);
    // 若当前已在第 1 页，仅 setPage(1) 不会触发 useEffect，故显式拉取
    if (page === 1) fetch();
  };

  const setExecuteResultFilterAndSearch = (values: string[]) => {
    setExecuteResultFilter(values);
    setPage(1);
  };

  const hasFilter = keyword.trim() !== '' || executeResultFilter.length > 0;

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索用例名称/编号/模块"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-8 h-8 text-sm border-gray-200"
            />
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8 text-sm" onClick={handleSearch}>
            搜索
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                执行结果
                {executeResultFilter.length > 0 ? (
                  <span className="text-[#165DFF] text-xs">({executeResultFilter.length})</span>
                ) : null}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="p-2 border-b border-gray-100">
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100"
                  onClick={() => setExecuteResultFilterAndSearch([])}
                >
                  全部
                </button>
              </div>
              <div className="max-h-[220px] overflow-auto py-1">
                {REPORT_FUNCTIONAL_EXECUTE_RESULT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${executeResultFilter.includes(opt.value) ? 'text-[#165DFF] font-medium' : ''}`}
                    onClick={() => {
                      const next = executeResultFilter.includes(opt.value)
                        ? executeResultFilter.filter((v) => v !== opt.value)
                        : [...executeResultFilter, opt.value];
                      setExecuteResultFilterAndSearch(next);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {loading ? (
        <div className="text-sm text-gray-400 py-4">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">
          {hasFilter ? '未找到匹配的功能用例' : '暂无功能用例'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
            <Table className="w-full text-sm">
              <TableHeader className="bg-[#f7f8fa] border-b border-gray-100">
                <TableRow className="hover:bg-transparent border-none h-9">
                  <TableHead className="w-[80px] font-medium text-gray-500 text-xs text-center">序号</TableHead>
                  <TableHead className="min-w-[200px] font-medium text-gray-500 text-xs">用例名称</TableHead>
                  <TableHead className="w-[150px] font-medium text-gray-500 text-xs">所属模块</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">优先级</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs text-center">执行结果</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs">执行人</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">缺陷数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id} className="hover:bg-[#f2f3f5]/50 group transition-colors border-b border-gray-50 h-11">
                    <TableCell className="text-gray-500 text-xs font-mono text-center">{row.num ?? '-'}</TableCell>
                    <TableCell className="text-gray-700 font-medium">{row.name ?? '-'}</TableCell>
                    <TableCell className="text-gray-600">{row.moduleName ?? '-'}</TableCell>
                    <TableCell className="text-center text-xs">
                      <Badge variant="outline" className="font-normal bg-gray-50/50 text-gray-600 border-gray-200">
                        {row.priority ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const { label: resultLabel, variant, className } = getReportExecuteResultDisplay(row.executeResult);
                        return (
                          <Badge variant={variant} className={`${className} font-normal`}>
                            {resultLabel}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-gray-600">{row.executeUser ?? '-'}</TableCell>
                    <TableCell className="text-gray-600 text-center font-mono text-xs">{row.bugCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <UnifiedPagination
            total={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            unitLabel="个用例"
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}

// ---------- 接口用例明细表格 ----------
function ReportApiCaseTable({ reportId, shareId, label }: { reportId: string; shareId?: string; label: string }) {
  const [list, setList] = useState<ReportCaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetch = useCallback(() => {
    setLoading(true);
    testPlanManagementService
      .getApiPage({ reportId, shareId, current: page, pageSize })
      .then((res: any) => {
        setList(res?.list ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [reportId, shareId, page, pageSize]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="w-full min-w-0">
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      {loading ? (
        <div className="text-sm text-gray-400 py-4">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">暂无接口用例</div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
            <Table className="w-full text-sm">
              <TableHeader className="bg-[#f7f8fa] border-b border-gray-100">
                <TableRow className="hover:bg-transparent border-none h-9">
                  <TableHead className="w-[80px] font-medium text-gray-500 text-xs text-center">序号</TableHead>
                  <TableHead className="min-w-[200px] font-medium text-gray-500 text-xs">用例名称</TableHead>
                  <TableHead className="w-[150px] font-medium text-gray-500 text-xs">所属模块</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">优先级</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs text-center">执行结果</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs">执行人</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">缺陷数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id} className="hover:bg-[#f2f3f5]/50 group transition-colors border-b border-gray-50 h-11">
                    <TableCell className="text-gray-500 text-xs font-mono text-center">{row.num ?? '-'}</TableCell>
                    <TableCell className="text-gray-700 font-medium">{row.name ?? '-'}</TableCell>
                    <TableCell className="text-gray-600">{row.moduleName ?? '-'}</TableCell>
                    <TableCell className="text-center text-xs">
                      <Badge variant="outline" className="font-normal bg-gray-50/50 text-gray-600 border-gray-200">
                        {row.priority ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const { label, variant, className } = getReportExecuteResultDisplay(row.executeResult);
                        return (
                          <Badge variant={variant} className={`${className} font-normal`}>
                            {label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-gray-600">{row.executeUser ?? '-'}</TableCell>
                    <TableCell className="text-gray-600 text-center font-mono text-xs">{row.bugCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <UnifiedPagination
            total={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            unitLabel="个用例"
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}

// ---------- 用例实现明细表格 ----------
function ReportScenarioCaseTable({ reportId, shareId, label }: { reportId: string; shareId?: string; label: string }) {
  const [list, setList] = useState<ReportCaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetch = useCallback(() => {
    setLoading(true);
    testPlanManagementService
      .getScenarioPage({ reportId, shareId, current: page, pageSize })
      .then((res: any) => {
        setList(res?.list ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [reportId, shareId, page, pageSize]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="w-full min-w-0">
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      {loading ? (
        <div className="text-sm text-gray-400 py-4">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-400 py-4">暂无用例实现</div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
            <Table className="w-full text-sm">
              <TableHeader className="bg-[#f7f8fa] border-b border-gray-100">
                <TableRow className="hover:bg-transparent border-none h-9">
                  <TableHead className="w-[80px] font-medium text-gray-500 text-xs text-center">序号</TableHead>
                  <TableHead className="min-w-[200px] font-medium text-gray-500 text-xs">用例名称</TableHead>
                  <TableHead className="w-[150px] font-medium text-gray-500 text-xs">所属模块</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">优先级</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs text-center">执行结果</TableHead>
                  <TableHead className="w-[120px] font-medium text-gray-500 text-xs">执行人</TableHead>
                  <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">缺陷数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id} className="hover:bg-[#f2f3f5]/50 group transition-colors border-b border-gray-50 h-11">
                    <TableCell className="text-gray-500 text-xs font-mono text-center">{row.num ?? '-'}</TableCell>
                    <TableCell className="text-gray-700 font-medium">{row.name ?? '-'}</TableCell>
                    <TableCell className="text-gray-600">{row.moduleName ?? '-'}</TableCell>
                    <TableCell className="text-center text-xs">
                      <Badge variant="outline" className="font-normal bg-gray-50/50 text-gray-600 border-gray-200">
                        {row.priority ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const { label, variant, className } = getReportExecuteResultDisplay(row.executeResult);
                        return (
                          <Badge variant={variant} className={`${className} font-normal`}>
                            {label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-gray-600">{row.executeUser ?? '-'}</TableCell>
                    <TableCell className="text-gray-600 text-center font-mono text-xs">{row.bugCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <UnifiedPagination
            total={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            unitLabel="个用例"
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}
