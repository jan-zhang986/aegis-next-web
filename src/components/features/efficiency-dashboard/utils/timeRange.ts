/**
 * 时间范围计算工具
 * 从 EfficiencyDashboard.tsx 提取
 */

import type { TimeRangeType, CustomDateRange } from '@/types/efficiency';

/**
 * 计算时间范围
 * @param timeRange - 时间范围类型
 * @param customDateRange - 自定义日期范围
 * @returns 包含 startTime 和 endTime 的对象
 */
export function calculateTimeRange(
  timeRange: TimeRangeType,
  customDateRange: CustomDateRange
): { startTime: number | undefined; endTime: number | undefined } {
  let startTime: number | undefined;
  let endTime: number | undefined = Date.now();

  if (timeRange === 'custom' && customDateRange.start && customDateRange.end) {
    startTime = customDateRange.start.getTime();
    endTime = customDateRange.end.getTime();
  } else {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        startTime = new Date(now.setHours(0, 0, 0, 0)).getTime();
        break;
      case 'week':
        // 最近7天（从今天往前推7天）
        startTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        // 最近30天（从今天往前推30天）
        startTime = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'quarter':
        // 本季度第一天 00:00:00
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startTime = new Date(now.getFullYear(), quarterMonth, 1).getTime();
        break;
      case 'year':
        // 本年1月1号 00:00:00
        startTime = new Date(now.getFullYear(), 0, 1).getTime();
        break;
      default:
        // 默认最近30天
        startTime = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
    }
  }

  return { startTime, endTime };
}
