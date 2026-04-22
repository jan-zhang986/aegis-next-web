/**
 * 请求相关工具：入参示例等
 */

import type { MetadataDefinition } from '@/services/metadata';

export function generateInputExample(
  requestConfig: Record<string, unknown> | null,
  protocol: string,
  definition: MetadataDefinition
): string {
  if (!requestConfig) return '{}';

  if (protocol === 'HTTP') {
    return requestConfig.body
      ? JSON.stringify(requestConfig.body, null, 2)
      : '{}';
  }

  if (protocol === 'SQL') {
    return (requestConfig.sql as string) || definition.scriptContent || 'SELECT * FROM table';
  }

  if (protocol === 'DUBBO') {
    const params = requestConfig.params as unknown[] | undefined;
    if (params && Array.isArray(params) && params.length > 0) {
      return JSON.stringify(params[0], null, 2);
    }
    return '{}';
  }

  if (protocol === 'ROCKETMQ' && requestConfig.body) {
    return typeof requestConfig.body === 'string'
      ? requestConfig.body
      : JSON.stringify(requestConfig.body, null, 2);
  }

  return '{}';
}
