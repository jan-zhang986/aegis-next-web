/**
 * 缺陷类型：必填单选枚举。value 为飞书选项 ID（落库），label 为展示中文。
 */
export const BUG_DEFECT_TYPE_OPTIONS = [
    { value: '1063335', label: '功能性缺陷' },
    { value: '1063338', label: '性能缺陷' },
    { value: '1063339', label: '界面缺陷' },
    { value: '1063340', label: '兼容性缺陷' },
    { value: '1063341', label: '安全性缺陷' },
    { value: '1063342', label: '可靠性缺陷' },
    { value: '1063343', label: '易用性缺陷' },
] as const;

export type BugDefectTypeValue = (typeof BUG_DEFECT_TYPE_OPTIONS)[number]['value'];

/** 根据 value（飞书选项 ID）取展示文案 */
export function getDefectTypeLabelByValue(value: string): string {
    const opt = BUG_DEFECT_TYPE_OPTIONS.find((o) => o.value === value);
    return opt ? opt.label : value;
}
