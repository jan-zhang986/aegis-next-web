/**
 * 门禁管理 - 发布时间格式化
 */

export function formatDeployTime(ts: number): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
