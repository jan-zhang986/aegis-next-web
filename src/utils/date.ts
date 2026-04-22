/**
 * 日期格式化工具函数
 * 从 EfficiencyDashboard.tsx 提取
 */

/**
 * 格式化日期为 "YYYY-MM-DD HH:mm:ss" 格式
 * @param date - 要格式化的日期对象
 * @returns 格式化后的日期字符串
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将时间戳（毫秒或可解析字符串）格式化为北京时间 YYYY-MM-DD HH:mm:ss
 * @param value - 时间戳（毫秒）或日期字符串
 * @returns 北京时间字符串，无效时返回 '-'
 */
export function formatTimestampBeijing(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-';
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/\//g, '-');
}
