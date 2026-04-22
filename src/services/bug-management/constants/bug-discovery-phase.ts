/**
 * 发现阶段枚举：单选必填
 */

export const BUG_DISCOVERY_PHASE_OPTIONS = [
    '联调阶段',
    '测试阶段',
    '冒烟测试',
    '第一轮测试',
    '第二轮测试',
    '回归阶段',
    'UI/UE/PM验收',
    '线上阶段',
] as const;

export type BugDiscoveryPhaseValue = (typeof BUG_DISCOVERY_PHASE_OPTIONS)[number];

export const BUG_DISCOVERY_PHASE_OPTIONS_LIST = BUG_DISCOVERY_PHASE_OPTIONS.map((v) => ({ value: v, label: v }));
