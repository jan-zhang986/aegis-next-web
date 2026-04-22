/**
 * 从用例项解析用例等级
 */

import type { CaseItem } from '../types';

export function getCaseLevel(item?: CaseItem | null): string {
  if (!item) return '-';

  // 1. 优先检查 caseLevel 字段（字符串格式：P0/P1/P2/P3）
  if (item.caseLevel) return item.caseLevel;

  // 2. 检查 priority 字段（数字格式：1-4，对应 P0-P3）
  // 这是思维导图中节点数据的主要存储方式，API 返回的数据中优先级通常存储在这里
  const priority = (item as any).priority;
  if (priority !== undefined && priority !== null) {
    const priorityNum = typeof priority === 'string' ? parseInt(priority, 10) : priority;
    if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 4) {
      return `P${priorityNum - 1}`; // 1 -> P0, 2 -> P1, 3 -> P2, 4 -> P3
    }
  }

  // 3. 检查 functionalPriority 字段（字符串格式：P0/P1/P2/P3）
  if ((item as any).functionalPriority) {
    return (item as any).functionalPriority;
  }

  // 4. 检查 customFields 中的 functional_priority
  const rawCustomFields = item.customFields;
  if (rawCustomFields != null && !Array.isArray(rawCustomFields) && typeof rawCustomFields === 'object') {
    const obj = rawCustomFields as Record<string, any>;
    if (obj.functional_priority) return String(obj.functional_priority).trim();
    if (obj.functionalPriority) return String(obj.functionalPriority).trim();
  }
  const customFields = Array.isArray(rawCustomFields) ? rawCustomFields : [];

  // 同时查找 fieldId 或 internalFieldKey 匹配的项
  const priorityItem = customFields.find((it: any) =>
    it?.fieldId === 'functional_priority' ||
    it?.internalFieldKey === 'functional_priority' ||
    it?.fieldName === '用例等级' ||
    it?.fieldName === '优先级'
  );

  if (priorityItem != null) {
    // 基础值获取
    const rawVal = priorityItem.value ?? priorityItem.defaultValue;
    // 如果是复杂对象（选项模式）
    if (priorityItem.options?.length && rawVal != null) {
      const opt = priorityItem.options.find((it: any) => it.value === rawVal || it.text === rawVal);
      if (opt?.text) return opt.text;
      if (opt?.value) return opt.value;
    }
    if (rawVal != null && String(rawVal).trim()) return String(rawVal).trim();
  }

  // 兜底：如果 customFields 包含名为 'priority' 的字段
  const fallbackPriority = customFields.find((it: any) => it?.fieldId === 'priority' || it?.internalFieldKey === 'priority');
  if (fallbackPriority) {
    const v = fallbackPriority.value ?? fallbackPriority.defaultValue;
    if (v != null) return String(v).trim();
  }

  return '-';
}

/** 从默认模板接口返回中解析用例等级字段的 fieldId，供创建/更新时 customFields 使用（后端可能用 UUID 或 internalFieldKey） */
export function resolvePriorityFieldId(defaultFields: any): string | null {
  const list = defaultFields?.customFields ?? defaultFields?.data ?? [];
  if (!Array.isArray(list)) return null;
  const found = list.find((f: any) =>
    f?.internalFieldKey === 'functional_priority' || f?.fieldId === 'functional_priority'
  );
  return found?.fieldId ?? null;
}
