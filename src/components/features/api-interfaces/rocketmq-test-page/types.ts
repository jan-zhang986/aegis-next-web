/**
 * RocketMQTestPage 相关类型
 */

export interface RocketMQRequestConfig {
  topic: string;
  tag: string;
  key: string;
  body: unknown;
  siteTenant?: string;
  envTag?: string;
}

export interface RocketMQSendResult {
  success: boolean;
  msgId?: string;
  info?: string;
  error?: string;
  data?: unknown;
}
