/**
 * 需求质量视图 - 日期时间格式化
 */

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * 格式化为：yyyy-MM-dd HH:mm:ss 星期x
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const weekday = WEEKDAYS[date.getDay()];
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${weekday}`;
}
