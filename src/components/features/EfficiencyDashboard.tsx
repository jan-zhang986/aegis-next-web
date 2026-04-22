/**
 * 效能数据大屏组件
 * 全屏显示，深色背景，实时数据更新
 */

import { useState, useEffect, useMemo } from 'react';
import {
  type CaseWithRequirement,
  type Requirement
} from '@/services/case-management/service-case-metrics';
import { CaseListModal } from './CaseListModal';
import { calculateTimeRange as calcTimeRange } from './efficiency-dashboard/utils/timeRange';
import { generateReuseRequirementChartData, generateRequirementChartData } from './efficiency-dashboard/utils/requirementChartData';
import { isPlanMetric } from './efficiency-dashboard/utils/metricUtils';
import { FilterBar } from './efficiency-dashboard/components/FilterBar';
import { GlobalMetrics as GlobalMetricsComponent } from './efficiency-dashboard/components/GlobalMetrics';
import { CaseMetricsSection } from './efficiency-dashboard/components/CaseMetricsSection';
import { CaseListDrawer } from './efficiency-dashboard/components/CaseListDrawer';
import { PlanListDrawer } from './efficiency-dashboard/components/PlanListDrawer';
import { ReasonDistributionCharts } from './efficiency-dashboard/components/ReasonDistributionCharts';
import { TrendSection } from './efficiency-dashboard/components/TrendSection';
import { RequirementListDialog } from './efficiency-dashboard/components/RequirementListDialog';
import { RequirementHoverTooltip } from './efficiency-dashboard/components/RequirementHoverTooltip';
import { DashboardHeader } from './efficiency-dashboard/components/DashboardHeader';
import { PermissionGate } from './efficiency-dashboard/components/PermissionGate';
import { LoadingOverlay } from './efficiency-dashboard/components/LoadingOverlay';
import { useEfficiencyMetrics, useCaseListModal, usePlanListModal, useEfficiencyTrend, usePermissionCheck, useProjectAndUserList, useDrawerResize, useRequirementListModal, useRequirementHover } from './efficiency-dashboard/hooks';
import { getMqUsageTrendData } from './efficiency-dashboard/constants/trendData';
import type {
  EfficiencyMetrics,
  DimensionType,
  TimeRangeType,
} from '@/types/efficiency';

// 测试工厂有单独页面，大屏中仅保留占位以满足 metrics 类型
const DEFAULT_SNAP_TEST_METRICS: EfficiencyMetrics['snapTest'] = {
  dataGenerationEfficiencyTime: 0,
  dataGenerationEfficiencyRatio: 0,
  mqUsageCount: 0,
  automationEfficiency: 0,
  leftShiftAutomationRate: 0,
  dataCostReductionRate: 0,
  userActivity: 0,
  automationBugDiscoveryRate: 0,
  automationCriticalBugRate: 0,
  automationCaseWritingDuration: 0,
};

export function EfficiencyDashboard() {
  // 使用 usePermissionCheck hook 管理权限检查
  const { hasPermission, isCheckingPermission } = usePermissionCheck();

  // 权限筛选状态；项目默认选当前平台在用的项目（右上角 currentProjectId）
  const [dimension, setDimension] = useState<DimensionType>('project');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['all'];
    const id = localStorage.getItem('currentProjectId');
    return id && id !== 'no_such_project' ? [id] : ['all'];
  });

  // 当前生效的 projectId：供接口与子组件使用（'ALL' | 单 id | 逗号分隔多 id）
  const effectiveProjectId = useMemo(() => {
    if (selectedProjects.length === 0 || selectedProjects.includes('all')) return 'ALL';
    if (selectedProjects.length === 1) return selectedProjects[0];
    return selectedProjects.join(',');
  }, [selectedProjects]);

  // 使用 useProjectAndUserList hook 管理项目和用户列表
  const { projects, users } = useProjectAndUserList({
    selectedProjects,
    setSelectedProjects,
  });
  const [userSearchQuery, setUserSearchQuery] = useState<string>(''); // 用户搜索关键词
  const [isUserSelectOpen, setIsUserSelectOpen] = useState<boolean>(false); // 用户选择器打开状态
  const [timeRange, setTimeRange] = useState<TimeRangeType>('week');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // 使用 useCaseListModal hook 管理用例列表弹窗
  const caseListModalHook = useCaseListModal({
    dimension,
    selectedProject: effectiveProjectId,
    selectedUser,
    timeRange,
    customDateRange,
  });

  // 使用 usePlanListModal hook 管理测试计划列表弹窗
  const planListModalHook = usePlanListModal({
    selectedProject: effectiveProjectId,
  });

  // 使用 useDrawerResize hook 管理抽屉调整
  const { isResizing, handleResizeStart } = useDrawerResize({
    caseListModalHook,
    planListModalHook,
  });

  // 使用 useRequirementListModal hook 管理需求列表弹窗
  const { requirementListModal, openRequirementListModal, closeRequirementListModal } = useRequirementListModal();

  // 使用 useRequirementHover hook 管理需求名称hover状态
  const { hoveredRequirement, setHoveredRequirement } = useRequirementHover();

  // 用例列表弹窗状态（用于显示变更/阻塞原因的用例列表）
  const [changeReasonCaseListModal, setChangeReasonCaseListModal] = useState<{
    isOpen: boolean;
    title: string;
    cases: CaseWithRequirement[];
    type: 'change' | 'block';
  }>({
    isOpen: false,
    title: '',
    cases: [],
    type: 'change'
  });

  // 使用 useEfficiencyMetrics hook 管理指标数据
  const {
    globalMetrics,
    metrics: caseManagementMetrics,
    loading,
    error,
    changeReasonData,
    blockedReasonData,
    loadGlobalMetrics,
    loadCaseManagementMetrics,
  } = useEfficiencyMetrics({
    dimension,
    selectedProject: effectiveProjectId,
    selectedUser,
    timeRange,
    customDateRange,
  });

  // 合并后的 metrics
  const metrics: EfficiencyMetrics = useMemo(() => ({
    caseManagement: caseManagementMetrics.caseManagement,
    snapTest: DEFAULT_SNAP_TEST_METRICS,
    // webTest 模块暂时下线，占位为默认值
    webTest: {
      monitoringTaskCount: 0,
      monitoringTaskExecutionCount: 0,
      avgMonitoringExecutionTime: 0,
      anomalyDiscoveryCount: 0,
      userExperience: 0,
    },
  }), [caseManagementMetrics]);

  // 缓存时间范围
  const cachedTimeRange = useMemo(() => {
    return calcTimeRange(timeRange, customDateRange);
  }, [timeRange, customDateRange]);

  // 统一的指标点击处理函数
  const handleMetricClick = (metricKey: string) => {
    if (isPlanMetric(metricKey)) {
      // 测试计划维度：使用 usePlanListModal 的 handlePlanMetricClick
      planListModalHook.handlePlanMetricClick(metricKey);
    } else {
      // 用例维度：使用 useCaseListModal 的 handleMetricClick
      caseListModalHook.handleMetricClick(metricKey);
    }
  };

  // 权限检查和项目/用户列表加载逻辑已移到 hooks

  // 使用 useEfficiencyTrend hook 管理趋势数据
  const {
    caseManagementTrendData,
    caseReuseTrendData,
    loading: trendDataLoading,
    loadCaseManagementTrendData,
    loadCaseReuseTrendData,
  } = useEfficiencyTrend({
    dimension,
    selectedProject: effectiveProjectId,
    selectedUser,
    timeRange,
  });


  // 当全局筛选条件变化时重新加载数据
  useEffect(() => {
    // 同时加载全局指标、详细指标和趋势数据
    loadGlobalMetrics();
    loadCaseManagementMetrics();
    loadCaseManagementTrendData();
    loadCaseReuseTrendData();
  }, [dimension, timeRange, selectedUser, effectiveProjectId, customDateRange, loadGlobalMetrics, loadCaseManagementMetrics, loadCaseManagementTrendData, loadCaseReuseTrendData]);

  // 生成复用指标趋势图的需求堆叠柱状图数据
  const reuseRequirementChartData = useMemo(() => {
    return generateReuseRequirementChartData(caseReuseTrendData);
  }, [caseReuseTrendData]);

  // 生成需求堆叠柱状图数据
  const requirementChartData = useMemo(() => {
    return generateRequirementChartData(caseManagementTrendData);
  }, [caseManagementTrendData]);

  // 趋势数据加载逻辑已移到 useEfficiencyTrend hook
  // 模拟数据已移到 constants/trendData.ts

  // MQ 使用趋势数据（每次渲染生成新的随机数据）
  const mqUsageTrendData = useMemo(() => getMqUsageTrendData(), []);

  return (
    <PermissionGate isCheckingPermission={isCheckingPermission} hasPermission={hasPermission}>
      <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-auto">
        {/* 顶部标题栏 */}
        <DashboardHeader />

        {/* 主要内容区域 */}
        <div className="p-8 space-y-8 relative">
          {/* ========== 用例管理模块（基于CS评分的11个指标）========== */}
          <LoadingOverlay loading={loading} />
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-blue-500 rounded"></div>
            <h2 className="text-xl font-bold text-white">用例管理模块 - 基于CS复杂分评分体系</h2>
            <span className="text-sm text-gray-400 ml-2">21个核心指标</span>
          </div>

          {/* 筛选器区域 */}
          <FilterBar
            dimension={dimension}
            setDimension={setDimension}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            showCustomDatePicker={showCustomDatePicker}
            setShowCustomDatePicker={setShowCustomDatePicker}
            selectedProjects={selectedProjects}
            setSelectedProjects={setSelectedProjects}
            projects={projects}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            users={users}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            isUserSelectOpen={isUserSelectOpen}
            setIsUserSelectOpen={setIsUserSelectOpen}
          />

          {/* 概览卡片 - 全局指标（不受需求筛选影响）*/}
          <GlobalMetricsComponent globalMetrics={globalMetrics} />

          {/* 用例管理指标分组组件 */}
          <CaseMetricsSection
            metrics={metrics}
            selectedProject={effectiveProjectId}
            cachedTimeRange={cachedTimeRange}
            handleMetricClick={handleMetricClick}
            reuseRequirementChartData={reuseRequirementChartData}
            caseReuseTrendData={caseReuseTrendData}
            requirementChartData={requirementChartData}
            caseManagementTrendData={caseManagementTrendData}
            hoveredRequirement={hoveredRequirement}
            setHoveredRequirement={setHoveredRequirement}
            openRequirementListModal={openRequirementListModal}
          />

          {/* 用例变更原因分布和测试用例执行阻塞原因分布 */}
          <ReasonDistributionCharts
            changeReasonData={changeReasonData}
            blockedReasonData={blockedReasonData}
            timeRange={cachedTimeRange}
            selectedProject={effectiveProjectId}
            dimension={dimension}
            selectedUser={selectedUser}
            setCaseListModal={setChangeReasonCaseListModal}
          />
        </div>

        {/* ========== 趋势模块（仅保留用例复用率趋势） ========== */}
        <TrendSection
          caseReuseTrendData={caseReuseTrendData}
        />
      </div>

      {/* 用例列表抽屉 */}
      <CaseListDrawer
        isOpen={caseListModalHook.showModal}
        onClose={() => caseListModalHook.setShowModal(false)}
        drawerWidth={caseListModalHook.drawerWidth}
        onResizeStart={handleResizeStart}
        selectedMetricKey={caseListModalHook.selectedMetricKey}
        metrics={metrics}
        caseList={caseListModalHook.caseList}
        caseListLoading={caseListModalHook.loading}
        caseListPage={caseListModalHook.page}
        caseListTotal={caseListModalHook.total}
        pageInput={caseListModalHook.pageInput}
        setPageInput={caseListModalHook.setPageInput}
        handlePageChange={caseListModalHook.handlePageChange}
        handlePageJump={caseListModalHook.handlePageJump}
      />

      {/* 测试计划列表抽屉 */}
      <PlanListDrawer
        isOpen={planListModalHook.showModal}
        onClose={() => planListModalHook.setShowModal(false)}
        drawerWidth={planListModalHook.drawerWidth}
        onResizeStart={handleResizeStart}
        selectedPlanMetricKey={planListModalHook.selectedPlanMetricKey}
        metrics={metrics}
        planList={planListModalHook.planList}
        planListLoading={planListModalHook.loading}
        planListPage={planListModalHook.page}
        planListTotal={planListModalHook.total}
        expandedPlans={planListModalHook.expandedPlans}
        planCaseMap={planListModalHook.planCaseMap}
        loadingCases={planListModalHook.loadingCases}
        togglePlanExpand={planListModalHook.togglePlanExpand}
        handlePlanPageChange={planListModalHook.handlePlanPageChange}
      />

      {/* 用例列表弹窗 */}
      <CaseListModal
        isOpen={changeReasonCaseListModal.isOpen}
        onClose={() => setChangeReasonCaseListModal(prev => ({ ...prev, isOpen: false }))}
        title={changeReasonCaseListModal.title}
        cases={changeReasonCaseListModal.cases}
        type={changeReasonCaseListModal.type}
      />
      
      {/* 需求列表弹窗 */}
      <RequirementListDialog
        isOpen={requirementListModal.isOpen}
        onClose={closeRequirementListModal}
        date={requirementListModal.date}
        requirements={requirementListModal.requirements}
      />
      
      {/* 需求名称Hover提示框 */}
      <RequirementHoverTooltip hoveredRequirement={hoveredRequirement} />
      </div>
    </PermissionGate>
  );
}
