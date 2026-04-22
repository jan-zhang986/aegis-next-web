
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Copy, Trash2, Play, FileText, CheckCircle2, ChevronRight, Star, MoreHorizontal, ExternalLink, List, LayoutGrid, Loader2 } from 'lucide-react';
import { testPlanManagementService, requirementQualityService } from '@/services';
import { getFeishuStoryDetailUrlForPlan } from '@/services/bug-management/constants/feishu-defect-url';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreateTestPlanSheet } from '@/components/features/test-plan/CreateTestPlanSheet';
import { PlanDetailFeatureCase } from '@/components/features/test-plan/PlanDetailFeatureCase';
import { PlanDetailApiCase } from '@/components/features/test-plan/PlanDetailApiCase';
import { PlanDetailScenarioCase } from '@/components/features/test-plan/PlanDetailScenarioCase';
import { PlanDetailDefect } from '@/components/features/test-plan/PlanDetailDefect';
import { PlanDetailExecuteHistory } from '@/components/features/test-plan/PlanDetailExecuteHistory';
import { PlanDetailMinder } from '@/components/features/test-plan/PlanDetailMinder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, X } from 'lucide-react';
import { StatusProgress, StatusProgressTooltipContent } from '@/components/features/test-plan/StatusProgress';
import { TestPlanStatusTag } from '@/components/features/test-plan/TestPlanStatusTag';
import { PassRateCountDetail } from '@/types/testPlan';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Reusing interfaces from TestPlanPage or Service (should be shared)
interface TestPlanDetail {
    id: string;
    num?: string;
    name: string;
    status: string;
    projectId: string;
    passRate: number;
    functionalCaseCount: number;
    apiCaseCount: number;
    apiScenarioCount: number;
    bugCount: number;
    description?: string;
    feishuStoryId?: string;
    // ... other fields
}

/** 从 pathname 稳健解析测试计划详情 ID（兼容尾部斜线、无 useParams 的布局） */
function getPlanIdFromPathname(pathname: string): string {
    const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (segments[0] !== 'test-plan' || segments.length < 2) return '';
    const last = segments[segments.length - 1];
    return last === 'config-report' ? '' : last;
}

export function TestPlanDetailPage() {
    const { planId: paramPlanId } = useParams<{ planId: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // 兼容多种路由方式获取 ID（path 可能带尾部斜线导致 split('/').pop() 为空）
    const planId = paramPlanId || getPlanIdFromPathname(location.pathname) || '';

    /** 从 URL 解析返回位置：用于从执行页返回时恢复「功能用例」下的测试点/模块 tab、选中项及列表筛选条件 */
    const urlFeatureCasePosition = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const treeTab = params.get('treeTab');
        const collectionId = params.get('collectionId');
        const moduleId = params.get('moduleId');
        if (tab !== 'featureCase') return null;
        const keyword = params.get('keyword') ?? undefined;
        const lastExecResult = params.get('lastExecResult');
        const lastExecResultFilter = lastExecResult ? lastExecResult.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
        const caseLevel = params.get('caseLevel');
        const caseLevelFilter = caseLevel ? caseLevel.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
        const executeUser = params.get('executeUser');
        const executeUserFilter = executeUser ? executeUser.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
        const currentPage = params.get('currentPage');
        const pageSize = params.get('pageSize');
        const sortField = params.get('sortField');
        const sortOrder = params.get('sortOrder');
        return {
            treeTab: treeTab === 'modules' ? 'modules' as const : 'points' as const,
            collectionId: collectionId ?? undefined,
            moduleId: moduleId ?? undefined,
            keyword: keyword ?? undefined,
            lastExecResultFilter: lastExecResultFilter?.length ? lastExecResultFilter : undefined,
            caseLevelFilter: caseLevelFilter?.length ? caseLevelFilter : undefined,
            executeUserFilter: executeUserFilter?.length ? executeUserFilter : undefined,
            currentPage: currentPage != null && currentPage !== '' ? parseInt(currentPage, 10) : undefined,
            pageSize: pageSize != null && pageSize !== '' ? parseInt(pageSize, 10) : undefined,
            sortField: (sortField === 'num' || sortField === 'name' || sortField === 'createTime') ? sortField : undefined,
            sortOrder: (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : undefined,
        };
    }, [location.search]);

    const [detail, setDetail] = useState<TestPlanDetail | null>(null);
    const [stats, setStats] = useState<PassRateCountDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [defectListTotal, setDefectListTotal] = useState<number | null>(null);
    const [copyLoading, setCopyLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'plan' | 'featureCase' | 'apiCase' | 'apiScenario' | 'defect' | 'history'>('plan');
    const [openAssociateOnFeatureCase, setOpenAssociateOnFeatureCase] = useState(false);
    const [defaultTabInitialized, setDefaultTabInitialized] = useState(false);
    /** 关联飞书需求名称（由需求 ID 拉取，用于展示而非 ID） */
    const [feishuStoryName, setFeishuStoryName] = useState<string>('');

    useEffect(() => {
        if (planId && planId !== 'test-plan') {
            fetchDetail(planId);
            setDefectListTotal(null);
        }
    }, [planId]);

    // 根据 URL 中的 tab 参数只在首次进入时设置默认 Tab
    useEffect(() => {
        if (defaultTabInitialized) return;
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'featureCase' || tab === 'apiCase' || tab === 'apiScenario' || tab === 'defect' || tab === 'history' || tab === 'plan') {
            setActiveTab(tab as typeof activeTab);
        }
        setDefaultTabInitialized(true);
    }, [location.search, defaultTabInitialized]);

    const fetchFeishuStoryName = useCallback(async (storyId: string) => {
        if (!storyId?.trim()) {
            setFeishuStoryName('');
            return;
        }
        try {
            const nameMap = await requirementQualityService.getStoryNamesByIds([storyId]);
            setFeishuStoryName(nameMap[storyId] ?? '');
        } catch {
            setFeishuStoryName('');
        }
    }, []);

    useEffect(() => {
        if (detail?.feishuStoryId) {
            fetchFeishuStoryName(detail.feishuStoryId);
        } else {
            setFeishuStoryName('');
        }
    }, [detail?.feishuStoryId, fetchFeishuStoryName]);

    const fetchDetail = async (id: string) => {
        setLoading(true);
        try {
            const [detailRes, statsRes] = await Promise.all([
                testPlanManagementService.getTestPlanDetail(id),
                testPlanManagementService.getPlanPassRate([id])
            ]);
            // 计划组无详情页，仅测试计划可进入详情
            if ((detailRes as any)?.type === 'GROUP') {
                toast.info('计划组无详情页，请展开后选择其下测试计划进入');
                navigate('/test-plan');
                return;
            }
            setDetail(detailRes as any);
            if (Array.isArray(statsRes) && statsRes.length > 0) {
                setStats(statsRes[0]);
            }
        } catch (error) {
            console.error(error);
            toast.error('获取详情失败');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!detail) return;
        const toastId = toast.loading('正在异步触发分发执行...');
        try {
            await testPlanManagementService.executeSinglePlan({
                executeId: detail.id,
                projectId: detail.projectId,
                runMode: 'SERIAL',
                executionSource: 'MANUAL'
            });
            toast.success('执行指令已下发', { id: toastId });
            // 刷新详情以更新状态
            fetchDetail(detail.id);
        } catch (error) {
            console.error(error);
            toast.error('执行失败', { id: toastId });
        }
    };

    const handleReport = async () => {
        if (!detail) return;
        const projectId = (detail as any)?.projectId || localStorage.getItem('currentProjectId') || '';
        if (!projectId) {
            toast.error('缺少项目信息，无法生成报告');
            return;
        }
        const toastId = toast.loading('正在生成报告...');
        try {
            const res: any = await testPlanManagementService.generateReport({
                projectId,
                testPlanId: detail.id,
                triggerMode: 'MANUAL',
            });
            toast.success('报告生成成功', { id: toastId });
            const reportId = res?.id ?? res?.data ?? res;
            if (reportId && typeof reportId === 'string') {
                navigate(`/test-plan?tab=test-report&reportId=${reportId}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('生成报告失败', { id: toastId });
        }
    };

    /** 复制测试计划（与列表页、spotter-metersphere 一致：优先 GET /test-plan/copy/{id}，失败时降级批量复制） */
    const handleCopy = async () => {
        if (!detail?.id) return;
        const toastId = toast.loading('正在复制测试计划...');
        setCopyLoading(true);
        try {
            try {
                await testPlanManagementService.testPlanAndGroupCopy(detail.id);
            } catch (getErr: unknown) {
                const projectId = (detail as any)?.projectId || localStorage.getItem('currentProjectId') || '';
                const moduleId = (detail as any)?.moduleId || 'root';
                await testPlanManagementService.batchCopyPlan({
                    selectIds: [detail.id],
                    projectId: projectId || '',
                    targetId: moduleId,
                    moduleId,
                    moduleIds: [moduleId],
                    moveType: 'MODULE',
                });
            }
            toast.success('复制成功', { id: toastId });
        } catch (err: unknown) {
            console.error('复制失败:', err);
            toast.error((err as { message?: string })?.message || '复制失败，请确认后端环境', { id: toastId });
        } finally {
            setCopyLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!detail) return <div className="p-8">Not Found</div>;

    return (
        <TooltipProvider>
            <div className="flex-1 flex flex-col h-full bg-gray-50 w-full">
                {/* Breadcrumb */}
                <div className="bg-white px-6 pt-4 pb-2 flex items-center gap-2 text-xs text-gray-400">
                    <span className="hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate('/test-plan')}>测试计划</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <span className="text-gray-600">测试计划详情</span>
                </div>

                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-6 pb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <TestPlanStatusTag status={detail.status} className="rounded-md px-2 py-0.5 text-xs font-medium" />
                                <h1 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-500 font-mono px-1.5 py-0.5 rounded text-xs font-normal">#{detail.num}</span>
                                    {detail.name}
                                </h1>
                            </div>

                            <div className="flex items-center gap-x-8 gap-y-4 text-sm text-gray-500 mb-5 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">已执行</span>
                                    <span className="font-medium text-gray-800">
                                        {(stats?.successCount || 0) + (stats?.errorCount || 0) + (stats?.blockCount || 0) + (stats?.fakeErrorCount || 0)} <span className="text-gray-300 mx-1">/</span> {stats?.caseTotal || 0}
                                    </span>
                                </div>
                                <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col gap-1 cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">通过率</span>
                                                    <span className="font-semibold text-green-600 tabular-nums">{stats?.passRate || 0}%</span>
                                                </div>
                                                {stats && (
                                                    <div className="flex-1 max-w-[520px] min-w-[200px]">
                                                        <StatusProgress statusDetail={stats} height="8px" className="rounded-full overflow-hidden" showTooltip={false} />
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="p-3 shadow-xl border border-gray-200 bg-white text-gray-900 min-w-[160px]" side="bottom" hideArrow>
                                            <StatusProgressTooltipContent statusDetail={stats} />
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {detail.feishuStoryId && (
                                    <div className="flex items-center gap-2 pl-6 border-l border-gray-100">
                                        <span className="text-gray-400">关联飞书需求</span>
                                        <a href={getFeishuStoryDetailUrlForPlan(detail.feishuStoryId)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 font-medium">
                                            {feishuStoryName || detail.feishuStoryId}
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                        </a>
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all gap-2" onClick={() => setEditSheetOpen(true)}>
                                <Edit className="w-4 h-4" /> 属性
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all gap-2" onClick={handleReport}>
                                <FileText className="w-4 h-4" /> 报告
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all gap-2"
                                onClick={handleCopy}
                                disabled={copyLoading}
                            >
                                {copyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                                复制
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all gap-2">
                                <Star className="w-4 h-4" /> 关注
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 border-gray-200">
                                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-[11px] min-w-[120px]">
                                    <DropdownMenuItem className="text-red-500 focus:text-red-600 focus:bg-red-50">
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> 删除计划
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 w-full animate-in fade-in duration-300">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            setActiveTab(value as 'plan' | 'featureCase' | 'apiCase' | 'apiScenario' | 'defect' | 'history')
                        }
                        className="w-full h-full flex flex-col"
                    >
                        <div className="border-b border-gray-200 mb-4">
                            <TabsList className="bg-transparent border-0 h-auto p-0 flex gap-6 justify-start rounded-none">
                                {[
                                    { id: 'plan', label: '测试规划' },
                                    { id: 'featureCase', label: '功能用例', count: detail.functionalCaseCount },
                                    { id: 'apiCase', label: '接口用例', count: detail.apiCaseCount || 0 },
                                    { id: 'apiScenario', label: '自动化用例', count: detail.apiScenarioCount || 0 },
                                    { id: 'defect', label: '缺陷列表', count: defectListTotal ?? detail.bugCount ?? 0 },
                                    { id: 'history', label: '执行历史' },
                                ].map((tab) => (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:!bg-transparent pb-3 px-0 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-primary transition-colors shadow-none data-[state=active]:shadow-none -mb-px outline-none focus-visible:ring-0 gap-2 group"
                                    >
                                        {tab.label}
                                        {tab.count !== undefined && (
                                            <Badge className="bg-gray-100 text-gray-500 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white group-hover:bg-gray-200 transition-colors border-0 rounded-full h-5 min-w-[24px] px-1.5 text-xs flex items-center justify-center font-normal">
                                                {tab.count}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <Card className="flex-1 border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[1.5rem] bg-white ring-1 ring-gray-100 overflow-hidden flex flex-col min-h-0">
                            <div className="flex-1 min-h-0 flex flex-col">
                                <TabsContent value="plan" className="m-0 h-full flex flex-col">
                                    {detail && (detail.functionalCaseCount ?? 0) === 0 && (
                                        <div className="p-4 shrink-0 border-b border-gray-100">
                                            <Alert className="border-amber-200 bg-amber-50/60 m-0">
                                                <Info className="h-4 w-4 text-amber-600" />
                                                <AlertDescription className="flex items-center justify-between gap-4">
                                                    <span>本计划暂无关联用例，请先在「功能用例」中关联用例后再进行测试规划。</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="shrink-0"
                                                        onClick={() => {
                                                            setActiveTab('featureCase');
                                                            setOpenAssociateOnFeatureCase(true);
                                                        }}
                                                    >
                                                        去关联用例
                                                    </Button>
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                    <PlanDetailMinder
                                        planId={detail.id}
                                        projectId={(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}
                                        status={detail.status}
                                        canEdit={detail.status !== 'ARCHIVED'}
                                        onRefresh={() => fetchDetail(detail.id)}
                                        totalCaseCount={(detail.functionalCaseCount ?? 0) + (detail.apiCaseCount ?? 0) + (detail.apiScenarioCount ?? 0)}
                                    />
                                </TabsContent>
                                <TabsContent value="featureCase" className="m-0 h-full flex flex-col">
                                    <PlanDetailFeatureCase
                                        planId={detail.id}
                                        projectId={(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}
                                        canEdit={detail.status !== 'ARCHIVED'}
                                        onRefresh={() => fetchDetail(detail.id)}
                                        openAssociateOnce={openAssociateOnFeatureCase}
                                        onOpenAssociateConsumed={() => setOpenAssociateOnFeatureCase(false)}
                                        initialTreeTab={urlFeatureCasePosition?.treeTab}
                                        initialCollectionId={urlFeatureCasePosition?.collectionId}
                                        initialModuleId={urlFeatureCasePosition?.moduleId}
                                        initialKeyword={urlFeatureCasePosition?.keyword}
                                        initialLastExecResultFilter={urlFeatureCasePosition?.lastExecResultFilter}
                                        initialCaseLevelFilter={urlFeatureCasePosition?.caseLevelFilter}
                                        initialExecuteUserFilter={urlFeatureCasePosition?.executeUserFilter}
                                        initialCurrentPage={urlFeatureCasePosition?.currentPage}
                                        initialPageSize={urlFeatureCasePosition?.pageSize}
                                        initialSortField={urlFeatureCasePosition?.sortField as 'num' | 'name' | 'createTime' | undefined}
                                        initialSortOrder={urlFeatureCasePosition?.sortOrder as 'asc' | 'desc' | undefined}
                                    />
                                </TabsContent>
                                <TabsContent value="apiCase" className="m-0 h-full flex flex-col">
                                    <PlanDetailApiCase
                                        planId={detail.id}
                                        projectId={(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}
                                        canEdit={detail.status !== 'ARCHIVED'}
                                    />
                                </TabsContent>
                                <TabsContent value="apiScenario" className="m-0 h-full flex flex-col">
                                    <PlanDetailScenarioCase
                                        planId={detail.id}
                                        projectId={(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}
                                        canEdit={detail.status !== 'ARCHIVED'}
                                        onRefresh={() => fetchDetail(detail.id)}
                                    />
                                </TabsContent>
                                <TabsContent value="defect" className="m-0 h-full flex flex-col">
                                    <PlanDetailDefect
                                        planId={detail.id}
                                        projectId={(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}
                                        canEdit={detail.status !== 'ARCHIVED'}
                                        onRefresh={() => fetchDetail(detail.id)}
                                        onDefectCountChange={setDefectListTotal}
                                    />
                                </TabsContent>
                                <TabsContent value="history" className="m-0 h-full flex flex-col">
                                    <PlanDetailExecuteHistory
                                        planId={detail.id}
                                        projectId={(detail as any)?.projectId || localStorage.getItem('currentProjectId') || ''}
                                    />
                                </TabsContent>
                            </div>
                        </Card>
                    </Tabs>
                </div>

                <CreateTestPlanSheet
                    open={editSheetOpen}
                    onOpenChange={setEditSheetOpen}
                    planId={detail.id}
                    projectId={'default-project'} // should come from context
                    onSuccess={() => fetchDetail(detail.id)}
                />
            </div>
        </TooltipProvider>
    );
}
