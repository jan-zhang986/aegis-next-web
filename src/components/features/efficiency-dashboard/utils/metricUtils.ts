/**
 * Metric Utils
 * 指标相关的工具函数
 * 从 EfficiencyDashboard.tsx 提取
 */

/**
 * 判断指标是否为测试计划维度
 */
export function isPlanMetric(metricKey: string): boolean {
  const planMetrics = ['firstPassRate'];
  return planMetrics.includes(metricKey);
}
