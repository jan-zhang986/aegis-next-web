/**
 * 所属应用枚举：单选必填，支持在输入框内搜索
 */

export const BUG_APP_OPTIONS = [
    'Gmesh',
    'SEVC',
    '中台',
    'PDA',
    'Dataverse',
    'DTC',
    'SSO',
    'DEVELOPER',
    'CRM',
    'CSM',
    'Plut',
    'Admios',
    'Corin',
    'Janus',
    'AegisGO',
    'AegisOnes',
    'ASPIS',
] as const;

export type BugAppValue = (typeof BUG_APP_OPTIONS)[number];

export const BUG_APP_OPTIONS_LIST = BUG_APP_OPTIONS.map((v) => ({ value: v, label: v }));
