/**
 * DubboTestPage 常量与工具
 */

export const COMMON_PARAM_TYPES = [
  'java.lang.String',
  'java.lang.Integer',
  'java.lang.Long',
  'java.lang.Boolean',
  'java.lang.Double',
  'java.util.List',
  'java.util.Map',
  'java.util.Set',
];

export function cleanParamName(name: string): string {
  if (!name) return '';
  if (/^参数\d+$/.test(name.trim())) return '';
  return name.trim();
}

export const DEBOUNCE_DELAY = 500;
