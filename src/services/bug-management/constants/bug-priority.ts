/**
 * 缺陷优先级：P0 P1 P2 P3 P4，单选必填
 * 对应原「严重程度」字段，后端仍使用 customFields.severity 存储
 */

export const BUG_PRIORITY_OPTIONS = [
    { value: 'P0', label: 'P0' },
    { value: 'P1', label: 'P1' },
    { value: 'P2', label: 'P2' },
    { value: 'P3', label: 'P3' },
    { value: 'P4', label: 'P4' },
] as const;

export type BugPriorityValue = (typeof BUG_PRIORITY_OPTIONS)[number]['value'];

/** 优先级 Badge/选项样式（P0 最高） */
export const BUG_PRIORITY_COLOR_MAP: Record<string, string> = {
    P0: 'text-white bg-red-600',
    P1: 'text-red-800 bg-red-100',
    P2: 'text-orange-800 bg-orange-100',
    P3: 'text-slate-700 bg-slate-200',
    P4: 'text-white bg-green-600',
};

/** 优先级说明（用于信息图标 tooltip） */
export const BUG_PRIORITY_TOOLTIP = `P0 致命缺陷：阻塞测试流程，需要立即解决。18点之前提交需当天解决；18点后提交需第二天11点之前修复。

P1 严重缺陷：影响产品功能使用，需要及时解决。18点之前提交需当天解决；18点后提交需第二天12点之前修复。

P2 一般缺陷：功能性问题不阻塞主要功能测试。第二天下班前修复。

P3 轻微缺陷：对系统的功能和稳定性影响较小。可以暂不修复等到后续版本进行修复，需要和产品确认修复时间并备注原因。

P4 优化建议：可以暂不修复或拒绝。开发同学需要备注原因，暂不修复需要告知修复时间。`;

/** 旧严重程度到优先级的展示映射（兼容历史数据） */
export const LEGACY_SEVERITY_TO_LABEL: Record<string, string> = {
    CRITICAL: 'P0', MAJOR: 'P1', MINOR: 'P2', TRIVIAL: 'P3',
    '致命': 'P0', '严重': 'P1', '一般': 'P2', '轻微': 'P3',
    P0: 'P0', P1: 'P1', P2: 'P2', P3: 'P3', P4: 'P4',
};

export function getPriorityLabel(value?: string): string {
    if (!value) return '-';
    return LEGACY_SEVERITY_TO_LABEL[value] || value;
}

export function getPriorityColor(value?: string): string {
    const label = getPriorityLabel(value);
    return BUG_PRIORITY_COLOR_MAP[label] || 'text-gray-600 bg-gray-100';
}
