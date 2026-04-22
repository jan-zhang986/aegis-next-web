/**
 * 拨测管理 - 共享常量
 * 应用与菜单共用同一套应用选项（与 spotter-aegislm menu/appEnum 一致）
 */
export const APP_OPTIONS = [
  'Gmesh',
  'Aegis',
  'SEVC',
  'Developer',
  'CRM',
  'WMS',
  'DataVerse',
  'Risk',
  'CSM',
  'GDS',
  'PLUT',
  'OPENAPI',
  'Corin',
  'Aspis'
] as const;

export type AppCode = (typeof APP_OPTIONS)[number];

/** Tab id 与后端 dialingType 对应（与 spotter dialWeb/dialApi/dialScript/dialLlm/dialDubbo 一致） */
export const DIAL_SUB_TO_DIALING_TYPE: Record<string, string> = {
  dialWeb: 'WEB',
  dialApi: 'API',
  dialScript: 'PLAYWRIGHT',
  dialLlm: 'LLM-WEB',
  dialDubbo: 'DUBBO',
};
