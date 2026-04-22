/**
 * TestPage 常量与工具
 */

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

export const DEBOUNCE_DELAY = 500;
