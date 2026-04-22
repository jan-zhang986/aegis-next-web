/**
 * 格式化与样式工具
 */

export function formatTime(timestamp?: number | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-600',
    POST: 'bg-yellow-100 text-yellow-600',
    PUT: 'bg-blue-100 text-blue-600',
    DELETE: 'bg-red-100 text-red-600',
    PATCH: 'bg-purple-100 text-purple-600',
    SQL: 'bg-cyan-100 text-cyan-600',
    DUBBO: 'bg-blue-100 text-blue-600',
    ROCKETMQ: 'bg-green-100 text-green-600',
    RocketMQ: 'bg-green-100 text-green-600',
    FILE: 'bg-purple-100 text-purple-600',
  };
  return colors[type.toUpperCase()] || 'bg-gray-100 text-gray-600';
}
