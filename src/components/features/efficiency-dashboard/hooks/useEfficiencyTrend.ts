/**
 * Efficiency Trend Hook
 * 管理效能趋势数据加载
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useCallback } from 'react';
import {
  getProjectOverview,
  getRequirementsList,
  type Requirement,
} from '@/services/case-management/service-case-metrics';
import type { DimensionType, TimeRangeType } from '@/types/efficiency';

interface UseEfficiencyTrendParams {
  dimension: DimensionType;
  selectedProject: string;
  selectedUser: string;
  timeRange: TimeRangeType;
}

interface CaseManagementTrendDataItem {
  date: string;
  expectedWritingDuration: number;
  actualWritingDuration: number;
  expectedExecutionTime: number;
  actualExecutionTime: number;
  passRate: number;
  requirementCount: number;
  requirements: Requirement[];
}

interface CaseReuseTrendDataItem {
  month: string;
  rate: number;
  savedTime: number;
  requirements: Requirement[];
}

interface UseEfficiencyTrendReturn {
  // 状态
  caseManagementTrendData: CaseManagementTrendDataItem[];
  caseReuseTrendData: CaseReuseTrendDataItem[];
  loading: boolean;

  // 方法
  loadCaseManagementTrendData: () => Promise<void>;
  loadCaseReuseTrendData: () => Promise<void>;
}

/**
 * 根据时间范围生成数据点数量
 */
function getDataPoints(timeRange: TimeRangeType): number {
  switch (timeRange) {
    case 'today':
      return 24; // 24小时
    case 'week':
      return 7; // 7天
    case 'month':
      return 30; // 30天
    case 'quarter':
      return 12; // 12周
    case 'year':
      return 12; // 12个月
    default:
      return 7;
  }
}

/**
 * Efficiency Trend Hook
 */
export function useEfficiencyTrend({
  dimension,
  selectedProject,
  selectedUser,
  timeRange,
}: UseEfficiencyTrendParams): UseEfficiencyTrendReturn {
  const [caseManagementTrendData, setCaseManagementTrendData] = useState<
    CaseManagementTrendDataItem[]
  >([]);
  const [caseReuseTrendData, setCaseReuseTrendData] = useState<
    CaseReuseTrendDataItem[]
  >([]);
  const [loading, setLoading] = useState(false);

  /**
   * 加载用例管理趋势数据
   */
  const loadCaseManagementTrendData = useCallback(async () => {
    try {
      setLoading(true);
      const points = getDataPoints(timeRange);
      const projectId = selectedProject === 'all' ? 'ALL' : selectedProject;
      const userId =
        dimension === 'personal'
          ? selectedUser === 'all'
            ? 'all'
            : selectedUser
          : undefined;

      const trendData: CaseManagementTrendDataItem[] = [];

      // 为每个时间点获取数据
      for (let i = 0; i < points; i++) {
        const date = new Date();
        let periodStart: number;
        let periodEnd: number;
        let dateLabel: string;

        if (timeRange === 'today') {
          // 按小时获取数据
          const hour = date.getHours() - (points - 1 - i);
          const startDate = new Date(date);
          startDate.setHours(hour, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(hour + 1, 0, 0, 0);
          periodStart = startDate.getTime();
          periodEnd = endDate.getTime();
          dateLabel = `${String(hour).padStart(2, '0')}:00`;
        } else if (timeRange === 'week' || timeRange === 'month') {
          // 按天获取数据
          const dayOffset = points - 1 - i;
          const targetDate = new Date(date);
          targetDate.setDate(targetDate.getDate() - dayOffset);
          const startDate = new Date(targetDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          periodStart = startDate.getTime();
          periodEnd = endDate.getTime();
          const month = targetDate.getMonth() + 1;
          const day = targetDate.getDate();
          dateLabel = `${month}-${day}`;
        } else {
          // 按月获取数据
          const monthOffset = points - 1 - i;
          const targetDate = new Date(date);
          targetDate.setMonth(targetDate.getMonth() - monthOffset);
          const startDate = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            1
          );
          const endDate = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          periodStart = startDate.getTime();
          periodEnd = endDate.getTime();
          dateLabel = `${targetDate.getMonth() + 1}月`;
        }

        try {
          const [data, requirements] = await Promise.all([
            getProjectOverview(
              dimension,
              projectId,
              userId,
              periodStart,
              periodEnd
            ),
            getRequirementsList(undefined, projectId, periodStart, periodEnd),
          ]);

          // 计算预期编写时长（小时）：所有复杂度级别的预期编写时长总和
          const totalExpectedWriteTime =
            (Number(data?.expectedWriteTime?.l1) || 0) +
            (Number(data?.expectedWriteTime?.l2) || 0) +
            (Number(data?.expectedWriteTime?.l3) || 0) +
            (Number(data?.expectedWriteTime?.l4) || 0);

          // 计算实际编写时长（小时）：直接使用后端返回的总时长
          const totalActualWriteTime =
            Number(data?.actualWriteDurationHours) || 0;

          // 计算预期执行时间（小时）：所有复杂度级别的预期执行时长总和（分钟转小时）
          const totalExpectedExecTime =
            ((Number(data?.expectedExecTime?.l1) || 0) +
              (Number(data?.expectedExecTime?.l2) || 0) +
              (Number(data?.expectedExecTime?.l3) || 0) +
              (Number(data?.expectedExecTime?.l4) || 0)) /
            60;

          // 计算实际执行时间（小时）：直接使用后端返回的总时长（分钟转小时）
          const totalActualExecTime =
            (Number(data?.actualExecDurationMinutes) || 0) / 60;

          // 通过率
          const passRate = Number(data?.firstPassRate) || 0;

          // 需求数量
          const requirementCount = requirements?.length || 0;

          trendData.push({
            date: dateLabel,
            expectedWritingDuration: Math.round(totalExpectedWriteTime * 10) / 10,
            actualWritingDuration: Math.round(totalActualWriteTime * 10) / 10,
            expectedExecutionTime: Math.round(totalExpectedExecTime * 10) / 10,
            actualExecutionTime: Math.round(totalActualExecTime * 10) / 10,
            passRate: Math.round(passRate * 10) / 10,
            requirementCount: requirementCount,
            requirements: requirements || [],
          });
        } catch (error) {
          console.error(`获取趋势数据点 ${i} 失败:`, error);
          // 如果某个时间点获取失败，使用0值
          trendData.push({
            date: dateLabel,
            expectedWritingDuration: 0,
            actualWritingDuration: 0,
            expectedExecutionTime: 0,
            actualExecutionTime: 0,
            passRate: 0,
            requirementCount: 0,
            requirements: [],
          });
        }
      }

      setCaseManagementTrendData(trendData);
    } catch (error) {
      console.error('加载用例管理趋势数据失败:', error);
      setCaseManagementTrendData([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, dimension, selectedProject, selectedUser]);

  /**
   * 加载复用指标趋势数据
   */
  const loadCaseReuseTrendData = useCallback(async () => {
    try {
      setLoading(true);
      const points = getDataPoints(timeRange);
      const projectId = selectedProject === 'all' ? 'ALL' : selectedProject;
      const userId =
        dimension === 'personal'
          ? selectedUser === 'all'
            ? 'all'
            : selectedUser
          : undefined;

      const trendData: CaseReuseTrendDataItem[] = [];

      // 为每个时间点获取数据（根据 timeRange 动态计算）
      for (let i = 0; i < points; i++) {
        const date = new Date();
        let periodStart: number;
        let periodEnd: number;
        let dateLabel: string;

        if (timeRange === 'today') {
          // 按小时获取数据
          const hour = date.getHours() - (points - 1 - i);
          const startDate = new Date(date);
          startDate.setHours(hour, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(hour + 1, 0, 0, 0);
          periodStart = startDate.getTime();
          periodEnd = endDate.getTime();
          dateLabel = `${String(hour).padStart(2, '0')}:00`;
        } else if (timeRange === 'week' || timeRange === 'month') {
          // 按天获取数据
          const dayOffset = points - 1 - i;
          const targetDate = new Date(date);
          targetDate.setDate(targetDate.getDate() - dayOffset);
          const startDate = new Date(targetDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          periodStart = startDate.getTime();
          periodEnd = endDate.getTime();
          const month = targetDate.getMonth() + 1;
          const day = targetDate.getDate();
          dateLabel = `${month}-${day}`;
        } else {
          // 按月获取数据
          const monthOffset = points - 1 - i;
          const targetDate = new Date(date);
          targetDate.setMonth(targetDate.getMonth() - monthOffset);
          const startDate = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            1
          );
          const endDate = new Date(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          periodStart = startDate.getTime();
          periodEnd = endDate.getTime();
          dateLabel = `${targetDate.getMonth() + 1}月`;
        }

        try {
          const [data, requirements] = await Promise.all([
            getProjectOverview(
              dimension,
              projectId,
              userId,
              periodStart,
              periodEnd
            ),
            getRequirementsList(undefined, projectId, periodStart, periodEnd),
          ]);

          const rate = Number(data?.reuseRateByCount) || 0;
          const savedTime = Number(data?.absoluteTimeSavings) || 0;

          trendData.push({
            month: dateLabel,
            rate: Math.round(rate * 10) / 10,
            savedTime: Math.round(savedTime * 10) / 10,
            requirements: requirements || [],
          });
        } catch (error) {
          console.error(`获取复用趋势数据点 ${i} 失败:`, error);
          trendData.push({
            month: dateLabel,
            rate: 0,
            savedTime: 0,
            requirements: [],
          });
        }
      }

      setCaseReuseTrendData(trendData);
    } catch (error) {
      console.error('加载复用趋势数据失败:', error);
      setCaseReuseTrendData([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, dimension, selectedProject, selectedUser]);

  return {
    caseManagementTrendData,
    caseReuseTrendData,
    loading,
    loadCaseManagementTrendData,
    loadCaseReuseTrendData,
  };
}
