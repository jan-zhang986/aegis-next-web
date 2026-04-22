/**
 * 系统设置-服务集成 相关类型（与 MeterSphere 对齐）
 */

export interface ServiceItem {
  id?: string;
  pluginId: string;
  title: string;
  description?: string;
  enable?: boolean;
  config?: boolean;
  logo?: string;
  organizationId?: string;
  configuration?: Record<string, any>;
}

export interface AddOrUpdateServiceParams {
  id?: string;
  pluginId: string;
  enable?: boolean;
  organizationId: string;
  configuration?: Record<string, any>;
}
