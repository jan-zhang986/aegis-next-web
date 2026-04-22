/**
 * 将执行率/通过率格式化为保留两位小数（四舍五入）
 */
export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2);
}
