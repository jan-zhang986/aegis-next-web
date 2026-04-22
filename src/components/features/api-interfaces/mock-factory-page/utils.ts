/**
 * 截断文本，中间显示省略号
 */
export function truncateMiddle(text: string, maxLength: number = 45): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  const half = Math.floor(maxLength / 2);
  return `${text.slice(0, half)}...${text.slice(-half)}`;
}
