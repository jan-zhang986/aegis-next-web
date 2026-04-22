/**
 * WebTest Data Hook
 * 管理 WebTest 数据加载和状态
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useCallback } from 'react';
import { http } from '@/utils/request';
import { calculateWebTestTimeRange } from '../utils/webTest';
import type { WebTestMetrics, WebTestTimeRangeType } from '@/types/efficiency';

interface UseWebTestDataParams {
  webTestTimeRange: WebTestTimeRangeType;
  webTestAppCode: string;
}

interface UseWebTestDataReturn {
  // 状态
  webTestMetrics: WebTestMetrics;
  loading: boolean;
  error: string | null;

  // 方法
  loadWebTestData: () => Promise<void>;
  setWebTestMetrics: (metrics: WebTestMetrics | ((prev: WebTestMetrics) => WebTestMetrics)) => void;
}

/**
 * WebTest Data Hook
 */
export function useWebTestData({
  webTestTimeRange,
  webTestAppCode,
}: UseWebTestDataParams): UseWebTestDataReturn {
  const [webTestMetrics, setWebTestMetrics] = useState<WebTestMetrics>({
    monitoringTaskCount: 0,
    monitoringTaskExecutionCount: 0,
    avgMonitoringExecutionTime: 0,
    anomalyDiscoveryCount: 0,
    userExperience: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载 webTest 数据
   */
  const loadWebTestData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = calculateWebTestTimeRange(webTestTimeRange);
      console.log('🌐 [webTest] 开始加载数据:', {
        startDate,
        endDate,
        appCode: webTestAppCode,
      });

      // 调用两个接口（POST 请求）
      // 如果选择"全部"，appCode 传空字符串
      const appCode = webTestAppCode === '全部' ? '' : webTestAppCode;
      const requestBody = {
        startDate,
        endDate,
        appCode,
      };

      console.log('🌐 [webTest] 请求参数:', requestBody);

      // 分别处理两个接口，避免一个失败影响另一个
      let taskNumberResponse: any = null;
      let runningMetricsResponse: any = null;

      // 接口1: 任务数接口（GET 请求，参数通过 query 传递）
      try {
        taskNumberResponse = await http.get('/dashboard/dialing/task/number', { params: requestBody });
      } catch (err: any) {
        // 静默处理网络错误，避免在控制台产生过多错误日志
        // 仅在非网络错误时记录详细日志
        if (err?.response) {
          // 有响应但状态码错误（如 404, 500 等）
          console.warn('🌐 [webTest] 任务数接口请求失败:', err?.response?.status, err?.response?.statusText);
        } else if (err?.code !== 'ECONNREFUSED' && err?.code !== 'ERR_NETWORK') {
          // 非网络连接错误，记录详细信息
          console.error('🌐 [webTest] 任务数接口请求失败:', err);
        }
        // 网络连接错误（ECONNREFUSED, ERR_NETWORK）静默处理，不记录日志
      }

      // 接口2: 执行指标接口（GET 请求，参数通过 query 传递）
      try {
        runningMetricsResponse = await http.get(
          '/dashboard/dialing/task/running/metrics',
          { params: requestBody }
        );
      } catch (err: any) {
        // 静默处理网络错误，避免在控制台产生过多错误日志
        // 仅在非网络错误时记录详细日志
        if (err?.response) {
          // 有响应但状态码错误（如 404, 500 等）
          console.warn('🌐 [webTest] 执行指标接口请求失败:', err?.response?.status, err?.response?.statusText);
        } else if (err?.code !== 'ECONNREFUSED' && err?.code !== 'ERR_NETWORK') {
          // 非网络连接错误，记录详细信息
          console.error('🌐 [webTest] 执行指标接口请求失败:', err);
        }
        // 网络连接错误（ECONNREFUSED, ERR_NETWORK）静默处理，不记录日志
      }

      // 更新数据，对齐前后端字段
      // 后端返回字段为驼峰命名：taskNumber, runningTimes, avgRunningTime
      setWebTestMetrics((prev) => {
        const updatedWebTest: WebTestMetrics = {
          ...prev,
          // 接口1: /dashboard/dialing/task/number
          // 后端字段 taskNumber -> 前端字段 monitoringTaskCount
          monitoringTaskCount: taskNumberResponse
            ? Number(taskNumberResponse?.taskNumber) || 0
            : prev.monitoringTaskCount,
          // 后端字段 trend -> 前端字段 taskNumberTrend (数值类型)
          taskNumberTrend:
            taskNumberResponse?.trend !== undefined
              ? Number(taskNumberResponse.trend)
              : prev.taskNumberTrend,
          // 接口2: /dashboard/dialing/task/running/metrics
          // 后端字段 runningTimes -> 前端字段 monitoringTaskExecutionCount
          monitoringTaskExecutionCount: runningMetricsResponse
            ? Number(runningMetricsResponse?.runningTimes) || 0
            : prev.monitoringTaskExecutionCount,
          // 后端字段 runningTimesTrend -> 前端字段 runningTimesTrend (数值类型)
          runningTimesTrend:
            runningMetricsResponse?.runningTimesTrend !== undefined
              ? Number(runningMetricsResponse.runningTimesTrend)
              : prev.runningTimesTrend,
          // 后端字段 avgRunningTime -> 前端字段 avgMonitoringExecutionTime
          avgMonitoringExecutionTime: runningMetricsResponse
            ? Number(runningMetricsResponse?.avgRunningTime) || 0
            : prev.avgMonitoringExecutionTime,
          // 后端字段 avgRunningTimeTrend -> 前端字段 avgRunningTimeTrend (数值类型)
          avgRunningTimeTrend:
            runningMetricsResponse?.avgRunningTimeTrend !== undefined
              ? Number(runningMetricsResponse.avgRunningTimeTrend)
              : prev.avgRunningTimeTrend,
        };

        return updatedWebTest;
      });
    } catch (err: any) {
      // 静默处理网络错误，避免在控制台产生过多错误日志
      if (err?.response) {
        // 有响应但状态码错误
        setError(`加载 WebTest 数据失败: ${err?.response?.status} ${err?.response?.statusText}`);
      } else if (err?.code !== 'ECONNREFUSED' && err?.code !== 'ERR_NETWORK') {
        // 非网络连接错误，记录错误信息
        setError(err?.message || '加载 WebTest 数据失败');
      } else {
        // 网络连接错误，静默处理，不设置错误信息（保持数据为默认值）
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [webTestTimeRange, webTestAppCode]);

  return {
    webTestMetrics,
    loading,
    error,
    loadWebTestData,
    setWebTestMetrics,
  };
}
