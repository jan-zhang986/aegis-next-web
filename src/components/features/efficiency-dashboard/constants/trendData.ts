/**
 * Trend Data Constants
 * 趋势模块的模拟数据常量
 * 从 EfficiencyDashboard.tsx 提取
 */

/**
 * snaptest 自动化效率趋势数据
 */
export const automationEfficiencyTrendData = [
  { date: '11-27', efficiency: 1800, automationRate: 80.5 },
  { date: '11-28', efficiency: 1850, automationRate: 81.2 },
  { date: '11-29', efficiency: 1820, automationRate: 81.8 },
  { date: '11-30', efficiency: 1880, automationRate: 82.1 },
  { date: '12-01', efficiency: 1856, automationRate: 82.3 },
];

/**
 * MQ 使用趋势数据（24小时）
 */
export function getMqUsageTrendData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: 400 + Math.floor(Math.random() * 200),
  }));
}

/**
 * 拨测任务执行趋势数据
 */
export const monitoringTrendData = [
  { date: '11-27', taskCount: 820, executionCount: 12000, anomalyCount: 220 },
  { date: '11-28', taskCount: 835, executionCount: 12150, anomalyCount: 228 },
  { date: '11-29', taskCount: 845, executionCount: 12280, anomalyCount: 230 },
  { date: '11-30', taskCount: 850, executionCount: 12350, anomalyCount: 232 },
  { date: '12-01', taskCount: 856, executionCount: 12456, anomalyCount: 234 },
];

/**
 * 用户体验趋势数据
 */
export const userExperienceTrendData = [
  { date: '11-27', score: 91.2 },
  { date: '11-28', score: 91.8 },
  { date: '11-29', score: 92.1 },
  { date: '11-30', score: 92.3 },
  { date: '12-01', score: 92.5 },
];
