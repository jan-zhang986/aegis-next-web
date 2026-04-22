/**
 * WebTest 时间范围计算工具
 * 从 EfficiencyDashboard.tsx 提取
 */

import { formatDateTime } from '@/utils/date';
import type { WebTestTimeRangeType } from '@/types/efficiency';

/**
 * 计算 webTest 时间范围
 * @param webTestTimeRange - WebTest 时间范围类型
 * @returns 包含 startDate 和 endDate 的对象
 */
export function calculateWebTestTimeRange(
  webTestTimeRange: WebTestTimeRangeType
): { startDate: string; endDate: string } {
  // 如果选择"全部"，返回空字符串
  if (webTestTimeRange === '全部') {
    return {
      startDate: '',
      endDate: '',
    };
  }

  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);

  switch (webTestTimeRange) {
    case '本周': {
      // 本周一 00:00:00 到 当前时间
      const dayOfWeek = now.getDay(); // 0 = 周日, 1 = 周一, ...
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 如果是周日，往前推6天；否则往前推 dayOfWeek - 1 天
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case '上周': {
      // 上周一 00:00:00 到 上周日 23:59:59
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - diff - 1); // 上周日
      lastWeekEnd.setHours(23, 59, 59, 999);
      endDate = lastWeekEnd;
      
      startDate = new Date(lastWeekEnd);
      startDate.setDate(lastWeekEnd.getDate() - 6); // 上周一
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case '本月': {
      // 本月1号 00:00:00 到 当前时间
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case '上月': {
      // 上月1号 00:00:00 到 上月最后一天 23:59:59
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // 上月最后一天
      break;
    }
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
  }

  return {
    startDate: formatDateTime(startDate),
    endDate: formatDateTime(endDate),
  };
}
