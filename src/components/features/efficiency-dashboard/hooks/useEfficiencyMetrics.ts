/**
 * Efficiency Metrics Hook
 * 管理效能指标的数据加载和状态
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useCallback, useMemo } from 'react';
import {
  getProjectOverview,
  getChangeReasonDistribution,
  getBlockedReasonDistribution,
} from '@/services/case-management/service-case-metrics';
import { calculateTimeRange } from '../utils/timeRange';
import { changeReasonNameMap, blockedReasonNameMap } from '../constants';
import type {
  DimensionType,
  TimeRangeType,
  CustomDateRange,
  GlobalMetrics,
  CaseManagementMetrics,
  EfficiencyMetrics,
} from '@/types/efficiency';

interface UseEfficiencyMetricsParams {
  dimension: DimensionType;
  selectedProject: string;
  selectedUser: string;
  timeRange: TimeRangeType;
  customDateRange: CustomDateRange;
}

interface UseEfficiencyMetricsReturn {
  // 状态
  globalMetrics: GlobalMetrics;
  metrics: EfficiencyMetrics;
  loading: boolean;
  error: string | null;
  changeReasonData: Array<{ name: string; value: number; percentage: number }>;
  blockedReasonData: Array<{ name: string; value: number; percentage: number }>;
  
  // 方法
  loadGlobalMetrics: () => Promise<void>;
  loadCaseManagementMetrics: () => Promise<void>;
}

/**
 * 计算时间范围的缓存值
 */
function useCachedTimeRange(
  timeRange: TimeRangeType,
  customDateRange: CustomDateRange
) {
  return useMemo(() => {
    return calculateTimeRange(timeRange, customDateRange);
  }, [timeRange, customDateRange]);
}

/**
 * Efficiency Metrics Hook
 */
export function useEfficiencyMetrics({
  dimension,
  selectedProject,
  selectedUser,
  timeRange,
  customDateRange,
}: UseEfficiencyMetricsParams): UseEfficiencyMetricsReturn {
  // 全局指标状态（不受需求筛选影响）
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>({
    totalCaseCount: 0,
    effectiveCaseCount: 0,
    avgUQS: 0,
    absoluteTimeSavings: 0,
    caseChangeHeat: 0,
  });

  // 详细指标状态（受需求筛选影响）
  const [metrics, setMetrics] = useState<EfficiencyMetrics>({
    caseManagement: {
      projectId: '',
      avgUQS: 0,
      firstPassRate: 0,
      totalWriteComplexity: 0,
      totalExecComplexity: 0,
      avgComplexity: 0,
      complexityVariance: 0,
      avgWriteTimeDeviation: 0,
      avgExecTimeDeviation: 0,
      expectedWriteTime: { l1: 0, l2: 0, l3: 0, l4: 0 },
      actualWriteTime: { l1: 0, l2: 0, l3: 0, l4: 0 },
      expectedExecTime: { l1: 0, l2: 0, l3: 0, l4: 0 },
      actualExecTime: { l1: 0, l2: 0, l3: 0, l4: 0 },
      writeTimeDeviationByLevel: { l1: 0, l2: 0, l3: 0, l4: 0 },
      execTimeDeviationByLevel: { l1: 0, l2: 0, l3: 0, l4: 0 },
      reuseRateByCount: 0,
      reuseRateByWorkload: 0,
      absoluteTimeSavings: 0,
      caseGrowthRate: 0,
      caseChangeHeat: 0,
      avgCaseExecDuration: 0,
      manualCaseExecHeat: 0,
      topFrequentCases: [],
    },
    snapTest: {
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
    },
    webTest: {
      monitoringTaskCount: 0,
      monitoringTaskExecutionCount: 0,
      avgMonitoringExecutionTime: 0,
      anomalyDiscoveryCount: 0,
      userExperience: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 变更原因和阻塞原因分布数据
  const [changeReasonData, setChangeReasonData] = useState<
    Array<{ name: string; value: number; percentage: number }>
  >([]);
  const [blockedReasonData, setBlockedReasonData] = useState<
    Array<{ name: string; value: number; percentage: number }>
  >([]);

  // 缓存时间范围
  const cachedTimeRange = useCachedTimeRange(timeRange, customDateRange);

  /**
   * 加载顶部全局指标（不受需求筛选影响）
   */
  const loadGlobalMetrics = useCallback(async () => {
    try {
      const { startTime, endTime } = cachedTimeRange;
      const projectId = selectedProject === 'all' ? 'ALL' : selectedProject;
      const userId =
        dimension === 'personal'
          ? selectedUser === 'all'
            ? 'all'
            : selectedUser
          : undefined;

      const data = await getProjectOverview(
        dimension,
        projectId,
        userId,
        startTime,
        endTime
      );

      setGlobalMetrics({
        totalCaseCount: Number(data?.totalCaseCount) || 0,
        effectiveCaseCount: Number(data?.effectiveCaseCount) ?? 0,
        avgUQS: Number(data?.avgUQS) || 0,
        absoluteTimeSavings: Number(data?.absoluteTimeSavings) || 0,
        caseChangeHeat: Number(data?.caseChangeHeat) || 0,
      });
    } catch (err) {
      console.error('加载全局指标失败:', err);
    }
  }, [dimension, selectedProject, selectedUser, cachedTimeRange]);

  /**
   * 加载详细指标
   */
  const loadCaseManagementMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startTime, endTime } = cachedTimeRange;

      const projectId = selectedProject === 'all' ? 'ALL' : selectedProject;
      const userId =
        dimension === 'personal'
          ? selectedUser === 'all'
            ? 'all'
            : selectedUser
          : undefined;

      const [data, changeReasonDist, blockedReasonDist] = await Promise.all([
        getProjectOverview(
          dimension,
          projectId,
          userId,
          startTime,
          endTime
        ),
        getChangeReasonDistribution(
          projectId,
          userId,
          startTime,
          endTime
        ),
        getBlockedReasonDistribution(
          projectId,
          userId,
          startTime,
          endTime
        ),
      ]);

      // 处理变更原因分布数据
      if (changeReasonDist) {
        const total = Object.values(changeReasonDist).reduce(
          (sum, count) => sum + count,
          0
        );
        const changeData = Object.entries(changeReasonDist).map(
          ([reason, count]) => ({
            name: changeReasonNameMap[reason] || reason,
            value: count,
            percentage: total > 0 ? (count / total) * 100 : 0,
          })
        );
        setChangeReasonData(changeData);
      }

      // 处理阻塞原因分布数据
      if (blockedReasonDist) {
        const total = Object.values(blockedReasonDist).reduce(
          (sum, count) => sum + count,
          0
        );
        const blockedData = Object.entries(blockedReasonDist).map(
          ([reason, count]) => ({
            name: blockedReasonNameMap[reason] || reason,
            value: count,
            percentage: total > 0 ? (count / total) * 100 : 0,
          })
        );
        setBlockedReasonData(blockedData);
      }

      // 映射后端数据到前端格式（处理 BigDecimal 等 Java 类型）
      const mappedData: CaseManagementMetrics = {
        projectId: data?.projectId || '',

        // UQS质量指标
        avgUQS: Number(data?.avgUQS) || 0,
        firstPassRate: Number(data?.firstPassRate) || 0,
        // UQS子指标
        defectDiscoveryRate:
          data?.defectDiscoveryRate !== undefined
            ? Number(data.defectDiscoveryRate)
            : undefined,
        executableRate:
          data?.executableRate !== undefined
            ? Number(data.executableRate)
            : undefined,
        reuseExecutionRate:
          data?.reuseExecutionRate !== undefined
            ? Number(data.reuseExecutionRate)
            : undefined,

        // 复杂度指标
        totalWriteComplexity: Number(data?.totalWriteComplexity) || 0,
        totalExecComplexity: Number(data?.totalExecComplexity) || 0,
        avgComplexity: Number(data?.avgComplexity) || 0,
        complexityVariance: Number(data?.complexityVariance) || 0,

        // 工时偏差
        avgWriteTimeDeviation: Number(data?.avgWriteTimeDeviation) || 0,
        avgExecTimeDeviation: Number(data?.avgExecTimeDeviation) || 0,

        // 工时分级
        expectedWriteTime: {
          l1: Number(data?.expectedWriteTime?.l1) || 0,
          l2: Number(data?.expectedWriteTime?.l2) || 0,
          l3: Number(data?.expectedWriteTime?.l3) || 0,
          l4: Number(data?.expectedWriteTime?.l4) || 0,
        },
        actualWriteTime: {
          l1: Number(data?.actualWriteTime?.l1) || 0,
          l2: Number(data?.actualWriteTime?.l2) || 0,
          l3: Number(data?.actualWriteTime?.l3) || 0,
          l4: Number(data?.actualWriteTime?.l4) || 0,
        },
        expectedExecTime: {
          l1: Number(data?.expectedExecTime?.l1) || 0,
          l2: Number(data?.expectedExecTime?.l2) || 0,
          l3: Number(data?.expectedExecTime?.l3) || 0,
          l4: Number(data?.expectedExecTime?.l4) || 0,
        },
        actualExecTime: {
          l1: Number(data?.actualExecTime?.l1) || 0,
          l2: Number(data?.actualExecTime?.l2) || 0,
          l3: Number(data?.actualExecTime?.l3) || 0,
          l4: Number(data?.actualExecTime?.l4) || 0,
        },
        writeTimeDeviationByLevel: {
          l1: Number(data?.writeTimeDeviationByLevel?.l1) || 0,
          l2: Number(data?.writeTimeDeviationByLevel?.l2) || 0,
          l3: Number(data?.writeTimeDeviationByLevel?.l3) || 0,
          l4: Number(data?.writeTimeDeviationByLevel?.l4) || 0,
        },
        execTimeDeviationByLevel: {
          l1: Number(data?.execTimeDeviationByLevel?.l1) || 0,
          l2: Number(data?.execTimeDeviationByLevel?.l2) || 0,
          l3: Number(data?.execTimeDeviationByLevel?.l3) || 0,
          l4: Number(data?.execTimeDeviationByLevel?.l4) || 0,
        },

        // 复用指标
        reuseRateByCount: Number(data?.reuseRateByCount) || 0,
        reuseRateByWorkload: Number(data?.reuseRateByWorkload) || 0,
        absoluteTimeSavings: Number(data?.absoluteTimeSavings) || 0,

        // 变更热度
        caseGrowthRate: Number(data?.caseGrowthRate) || 0,
        caseChangeHeat: Number(data?.caseChangeHeat) || 0,

        // 执行效率
        avgCaseExecDuration: Number(data?.avgCaseExecDuration) || 0,
        manualCaseExecHeat: Number(data?.manualCaseExecHeat) || 0,
        topFrequentCases: data?.topFrequentCases || [],

        // 额外统计
        totalCaseCount: Number(data?.totalCaseCount) || 0,
        effectiveCaseCount: Number(data?.effectiveCaseCount) ?? 0,
        // 复用细项（用于复用指标卡片右侧展示）
        reusedCaseCount:
          data?.reusedCaseCount !== undefined ? Number(data.reusedCaseCount) : undefined,
        directReuseCount:
          data?.directReuseCount !== undefined ? Number(data.directReuseCount) : undefined,
        adaptReuseCount:
          data?.adaptReuseCount !== undefined ? Number(data.adaptReuseCount) : undefined,
        totalCaseCountForReuse:
          data?.totalCaseCountForReuse !== undefined ? Number(data.totalCaseCountForReuse) : undefined,

        // ========== 分子分母数据 ==========
        // 用例新增率的分子分母
        newCaseCount:
          data?.newCaseCount !== undefined ? Number(data.newCaseCount) : undefined,
        periodStartCaseCount:
          data?.periodStartCaseCount !== undefined
            ? Number(data.periodStartCaseCount)
            : undefined,

        // 平均用例执行时长的分子分母
        totalExecDurationMs:
          data?.totalExecDurationMs !== undefined
            ? Number(data.totalExecDurationMs)
            : undefined,
        totalExecCount:
          data?.totalExecCount !== undefined
            ? Number(data.totalExecCount)
            : undefined,

        // 手动用例执行热度的分子分母
        highFreqCsTotal:
          data?.highFreqCsTotal !== undefined
            ? Number(data.highFreqCsTotal)
            : undefined,
        allExecCsTotal:
          data?.allExecCsTotal !== undefined
            ? Number(data.allExecCsTotal)
            : undefined,

        // 首次通过率的分子分母
        firstPassCount:
          data?.firstPassCount !== undefined
            ? Number(data.firstPassCount)
            : undefined,
        firstExecCount:
          data?.firstExecCount !== undefined
            ? Number(data.firstExecCount)
            : undefined,

        // 编写工时偏差率的分子分母
        actualWriteDurationHours:
          data?.actualWriteDurationHours !== undefined
            ? Number(data.actualWriteDurationHours)
            : undefined,
        expectedWriteDurationHours:
          data?.expectedWriteDurationHours !== undefined
            ? Number(data.expectedWriteDurationHours)
            : undefined,

        // 执行工时偏差率的分子分母
        actualExecDurationMinutes:
          data?.actualExecDurationMinutes !== undefined
            ? Number(data.actualExecDurationMinutes)
            : undefined,
        expectedExecDurationMinutes:
          data?.expectedExecDurationMinutes !== undefined
            ? Number(data.expectedExecDurationMinutes)
            : undefined,

        // 用例工作量复用率的分子分母
        reusedCsTotal:
          data?.reusedCsTotal !== undefined
            ? Number(data.reusedCsTotal)
            : undefined,
        totalCsScore:
          data?.totalCsScore !== undefined ? Number(data.totalCsScore) : undefined,

        // 用例变更热度的分子分母
        modifiedCaseCount:
          data?.modifiedCaseCount !== undefined
            ? Number(data.modifiedCaseCount)
            : undefined,
        totalCaseCountInPeriod:
          data?.totalCaseCountInPeriod !== undefined
            ? Number(data.totalCaseCountInPeriod)
            : undefined,
      };

      setMetrics((prev) => ({
        ...prev,
        caseManagement: mappedData,
      }));
    } catch (err) {
      console.error('加载项目概览指标失败:', err);
      setError('加载指标数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dimension, selectedProject, selectedUser, cachedTimeRange]);

  return {
    globalMetrics,
    metrics,
    loading,
    error,
    changeReasonData,
    blockedReasonData,
    loadGlobalMetrics,
    loadCaseManagementMetrics,
  };
}
