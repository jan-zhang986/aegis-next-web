/**
 * 格式化工具函数
 * 从 EfficiencyDashboard.tsx 提取
 */

/**
 * 安全地格式化数字，处理 null/undefined
 * @param value - 要格式化的数字
 * @returns 格式化后的字符串，如果值为 null/undefined 则返回 '0'
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString();
}

/**
 * 过滤HTML标签，只保留纯文本
 * @param html - 包含HTML标签的字符串
 * @returns 去除HTML标签后的纯文本
 */
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return '';
  // 使用正则表达式移除HTML标签
  return html
    .replace(/<[^>]*>/g, '') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ') // 替换&nbsp;为空格
    .replace(/&amp;/g, '&') // 替换&amp;为&
    .replace(/&lt;/g, '<') // 替换&lt;为<
    .replace(/&gt;/g, '>') // 替换&gt;为>
    .replace(/&quot;/g, '"') // 替换&quot;为"
    .replace(/&#39;/g, "'") // 替换&#39;为'
    .trim();
}
