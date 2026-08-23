/**
 * 测试计划枚举定义
 * 从 AegisOne 迁移
 */

/**
 * 测试计划状态枚举
 */
export enum TestPlanStatusEnum {
    /** 未开始 */
    PREPARED = 'PREPARED',
    /** 进行中 */
    UNDERWAY = 'UNDERWAY',
    /** 已完成 */
    COMPLETED = 'COMPLETED',
    /** 已归档 */
    ARCHIVED = 'ARCHIVED',
}

/**
 * 测试计划类型枚举
 */
export const testPlanTypeEnum = {
    ALL: 'ALL',
    TEST_PLAN: 'TEST_PLAN',
    GROUP: 'GROUP',
} as const;

export type TestPlanType = typeof testPlanTypeEnum[keyof typeof testPlanTypeEnum];

/**
 * 计划状态类型
 */
export type PlanStatusType = 'PREPARED' | 'UNDERWAY' | 'COMPLETED' | 'ARCHIVED';

/**
 * 计划状态映射配置
 */
export interface PlanStatusConfig {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
}

export const planStatusMap: Record<PlanStatusType, PlanStatusConfig> = {
    PREPARED: {
        label: '未开始',
        color: '#6B7280', // gray-500
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
    },
    UNDERWAY: {
        label: '进行中',
        color: '#3B82F6', // blue-500
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
    },
    COMPLETED: {
        label: '已完成',
        color: '#22C55E', // green-500
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
    },
    ARCHIVED: {
        label: '已归档',
        color: '#9CA3AF', // gray-400
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-400',
    },
};

/**
 * 计划状态选项（用于筛选）
 */
export const planStatusOptions: { value: PlanStatusType; label: string }[] = [
    { value: 'PREPARED', label: '未开始' },
    { value: 'UNDERWAY', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
];

/**
 * 计划类型选项（用于筛选）
 */
export const planTypeOptions: { value: TestPlanType; label: string }[] = [
    { value: 'ALL', label: '全部' },
    { value: 'TEST_PLAN', label: '计划' },
    { value: 'GROUP', label: '计划组' },
];

/**
 * 执行模式类型
 */
export enum RunMode {
    SERIAL = 'SERIAL',
    PARALLEL = 'PARALLEL',
}

/**
 * 执行结果枚举
 */
export const ExecuteResultEnum = {
    PASSED: 'PASSED',
    NOT_PASSED: 'NOT_PASSED',
} as const;

export type ExecuteResultType = typeof ExecuteResultEnum[keyof typeof ExecuteResultEnum];

/**
 * 测试计划报告卡片类型枚举
 */
export enum ReportCardTypeEnum {
    SUMMARY = 'SUMMARY',
    BUG_DETAIL = 'BUG_DETAIL',
    FUNCTIONAL_DETAIL = 'FUNCTIONAL_DETAIL',
    API_CASE_DETAIL = 'API_CASE_DETAIL',
    SCENARIO_CASE_DETAIL = 'SCENARIO_CASE_DETAIL',
    SUB_PLAN_DETAIL = 'SUB_PLAN_DETAIL',
    CUSTOM_CARD = 'CUSTOM_CARD',
}

/**
 * 执行结果映射
 */
export const executeResultMap: Record<string, { label: string; color: string; bgColor: string }> = {
    PASSED: {
        label: '通过',
        color: '#22C55E',
        bgColor: 'bg-green-100',
    },
    NOT_PASSED: {
        label: '不通过',
        color: '#EF4444',
        bgColor: 'bg-red-100',
    },
    true: {
        label: '通过',
        color: '#22C55E',
        bgColor: 'bg-green-100',
    },
    false: {
        label: '不通过',
        color: '#EF4444',
        bgColor: 'bg-red-100',
    },
};

/** 测试报告执行结果展示：后端返回值 -> 中文文案 + Badge 样式（与用例管理口径一致） */
export const reportExecuteResultMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary'; className?: string }> = {
    PASSED: { label: '通过', variant: 'default' },
    SUCCESS: { label: '通过', variant: 'default' },
    FAILED: { label: '失败', variant: 'destructive' },
    ERROR: { label: '失败', variant: 'destructive' },
    NOT_PASSED: { label: '不通过', variant: 'destructive' },
    FAIL: { label: '失败', variant: 'destructive' },
    BLOCKED: { label: '阻塞', variant: 'secondary', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    SKIPPED: { label: '跳过', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PENDING: { label: '未执行', variant: 'secondary', className: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function getReportExecuteResultDisplay(
    value: string | null | undefined
): { label: string; variant: 'default' | 'destructive' | 'secondary'; className?: string } {
    if (value == null || value === '') {
        return { label: '-', variant: 'secondary', className: 'bg-gray-50 text-gray-500' };
    }
    const key = String(value).toUpperCase();
    return reportExecuteResultMap[key] ?? { label: value, variant: 'secondary', className: 'bg-gray-100 text-gray-700' };
}
