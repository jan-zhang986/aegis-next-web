/**
 * 系统设置-系统参数 相关类型（与 MeterSphere 对齐）
 */

/** 基础信息配置 */
export interface BaseConfig {
  url?: string;
  prometheusHost?: string;
  fileMaxSize?: string;
}

/** 邮件配置 */
export interface EmailConfig {
  host?: string;
  port?: string;
  account?: string;
  from?: string;
  password?: string;
  ssl?: string;
  tsl?: string;
  recipient?: string;
}

/** 保存参数项（基础信息、邮件、文件大小、内存清理等） */
export interface SaveParamItem {
  paramKey: string;
  paramValue: string;
  type: string;
}

export type SaveInfoParams = SaveParamItem[];

/** 测试邮件请求参数 */
export interface TestEmailParams {
  'smtp.host': string;
  'smtp.port': string;
  'smtp.account': string;
  'smtp.password': string;
  'smtp.from': string;
  'smtp.ssl': string;
  'smtp.tsl': string;
  'smtp.recipient': string;
}

/** 内存清理配置 */
export interface CleanupConfig {
  operationLog?: string;
  operationHistory?: string;
}

/** 页面配置 */
export interface PageConfig {
  theme?: string;
  customTheme?: string;
  style?: string;
  customStyle?: string;
  title?: string;
  icon?: Array<{ url?: string; file?: File }>;
  loginImage?: Array<{ url?: string; file?: File }>;
  loginLogo?: Array<{ url?: string; file?: File }>;
  slogan?: string;
  platformName?: string;
  helpDoc?: string;
}

/** 认证配置项 */
export interface AuthItem {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  enable?: boolean;
  configuration?: Record<string, any> | string;
}

/** 认证配置列表参数 */
export interface AuthListParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
}

/** 认证配置列表结果 */
export interface AuthListResult {
  total: number;
  list: AuthItem[];
}

/** 认证配置参数 */
export interface AuthParams {
  id?: string;
  name: string;
  type: string;
  description?: string;
  enable?: boolean;
  configuration?: Record<string, any> | string;
}

/** 二维码配置项 */
export interface QrCodeItem {
  key: string;
  title: string;
  description?: string;
  logo?: string;
  enable?: boolean;
  hasConfig?: boolean;
  valid?: boolean;
  edit?: boolean;
}

/** 平台来源（接口返回，与 spotter-metersphere 一致） */
export interface PlatformSource {
  platform: string;
  enable: boolean;
  valid: boolean;
  hasConfig: boolean;
}

/** 飞书扫码登录配置（与 spotter-metersphere LarkInfo 一致） */
export interface LarkInfo {
  agentId: string;
  appSecret: string;
  callBack?: string;
  enable: boolean;
  valid?: boolean;
}

/** 模型配置项 */
export interface ModelConfigItem {
  id?: string;
  name?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  enable?: boolean;
  description?: string;
}

/** 模型配置列表参数 */
export interface ModelConfigListParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
}

/** 模型配置列表结果 */
export interface ModelConfigListResult {
  total: number;
  list: ModelConfigItem[];
}
