/**
 * DubboTestPage 相关类型
 */

export interface DubboParam {
  name: string;
  type: string;
  schema?: string;
  value: string;
  enabled?: boolean;
}

export interface DubboRequestConfig {
  interfaceName: string;
  methodName: string;
  parameterTypes?: string[];
  params?: unknown[];
  siteTenant?: string;
  applicationName: string;
  dubboTag: string | null;
}
