/**
 * Efficiency Dashboard 常量定义
 * 从 EfficiencyDashboard.tsx 提取
 */

/**
 * 变更原因中文名称映射
 */
/** 变更原因中文名称映射（含系分变更、copy变更；copy变更不参与分布统计） */
export const changeReasonNameMap: Record<string, string> = {
  'REQUIREMENT_TEMP': '需求临时变更',
  'REQUIREMENT_ITERATION': '需求迭代变更',
  'CASE_DESIGN': '用例设计变更',
  'CASE_MAINTENANCE': '历史用例维护',
  'TECH_SOLUTION': '技术方案适配',
  'RESOURCE_ADJUSTMENT': '资源配置调整',
  'EXTERNAL_DEPENDENCY': '外部依赖变更',
  'COMPLIANCE_POLICY': '合规政策要求',
  'SYS_DESIGN_CHANGE': '系分变更',
  'CASE_COPY': 'copy变更',
};

/**
 * 阻塞原因中文名称映射
 */
export const blockedReasonNameMap: Record<string, string> = {
  'ENVIRONMENT': '环境因素',
  'RESOURCE_SHORTAGE': '资源不足',
  'PREREQUISITE_DEPENDENCY': '前置依赖',
  'REQUIREMENT_UNCLEAR': '需求不明确',
  'TECHNICAL_DIFFICULTY': '技术难点',
  'PROCESS_COMMUNICATION': '流程沟通',
};

/**
 * 变更原因反向映射（中文名称 → 代码）
 */
export const changeReasonCodeMap: Record<string, string> = Object.fromEntries(
  Object.entries(changeReasonNameMap).map(([code, name]) => [name, code])
);

/**
 * 阻塞原因反向映射（中文名称 → 代码）
 */
export const blockedReasonCodeMap: Record<string, string> = Object.fromEntries(
  Object.entries(blockedReasonNameMap).map(([code, name]) => [name, code])
);

export const CHANGE_REASON_NAME_MAP = changeReasonNameMap;
export const BLOCKED_REASON_NAME_MAP = blockedReasonNameMap;
export const CHANGE_REASON_CODE_MAP = changeReasonCodeMap;
export const BLOCKED_REASON_CODE_MAP = blockedReasonCodeMap;
export const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export type { TimeRangeType, DimensionType, WebTestTimeRangeType } from '@/types/efficiency';
