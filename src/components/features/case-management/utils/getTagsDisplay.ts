/**
 * 将标签数据转为展示字符串
 */
export function getTagsDisplay(tags: any): string {
  if (!tags) return '-';
  if (Array.isArray(tags)) return tags.join(', ');
  if (typeof tags === 'string') return tags;
  return '-';
}

/**
 * 将标签数据转为数组（用于 tag 展示）
 */
export function getTagsArray(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '');
  if (typeof tags === 'string') return tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return [];
}
