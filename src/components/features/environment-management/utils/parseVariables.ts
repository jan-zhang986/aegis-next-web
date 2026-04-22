import { FIXED_VARIABLE_KEYS } from '../constants';

/** 将 variablesList 转为保存用的 JSON 对象，排除固定字段 */
export function parseVariablesForSave(
  variablesList: Array<{ key: string; value: string }>
): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  variablesList.forEach((item) => {
    if (!item.key.trim()) return;
    if (FIXED_VARIABLE_KEYS.includes(item.key.trim())) return;
    const v = item.value.trim();
    if (v === '') {
      parsed[item.key.trim()] = '';
    } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      parsed[item.key.trim()] = v.slice(1, -1);
    } else if (/^-?\d+$/.test(v)) {
      // 超出 Number.MAX_SAFE_INTEGER 的整数以字符串存储，避免精度丢失（如雪花 ID）
      try {
        const big = BigInt(v);
        if (big > BigInt(Number.MAX_SAFE_INTEGER) || big < BigInt(Number.MIN_SAFE_INTEGER)) {
          parsed[item.key.trim()] = v;
        } else {
          parsed[item.key.trim()] = Number(big);
        }
      } catch {
        parsed[item.key.trim()] = v;
      }
    } else if (/^-?\d+\.\d+$/.test(v)) {
      parsed[item.key.trim()] = parseFloat(v);
    } else if (v === 'true' || v === 'false') {
      parsed[item.key.trim()] = v === 'true';
    } else if (v === 'null') {
      parsed[item.key.trim()] = null;
    } else {
      try {
        parsed[item.key.trim()] = JSON.parse(v);
      } catch {
        parsed[item.key.trim()] = item.value;
      }
    }
  });
  return parsed;
}

/** 从 env.variables 提取用户自定义变量为 key-value 数组，排除固定字段 */
export function envVariablesToKeyValueList(variables: Record<string, unknown> | undefined): Array<{ key: string; value: string }> {
  if (!variables || typeof variables !== 'object') return [{ key: '', value: '' }];
  const list: Array<{ key: string; value: string }> = [];
  Object.entries(variables).forEach(([key, value]) => {
    if (FIXED_VARIABLE_KEYS.includes(key)) return; // 固定字段从嵌套结构读取，不放入 variables 列表
    let s: string;
    if (value === null) s = 'null';
    else if (typeof value === 'boolean') s = String(value);
    else if (typeof value === 'number') s = String(value);
    else if (typeof value === 'string') s = value;
    else s = JSON.stringify(value);
    list.push({ key, value: s });
  });
  return list.length > 0 ? list : [{ key: '', value: '' }];
}
