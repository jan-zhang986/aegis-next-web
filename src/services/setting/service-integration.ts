/**
 * 系统设置-服务集成 API（与 AegisOne 路径一致）
 */
import { http } from '@/utils/request';
import type { ServiceItem, AddOrUpdateServiceParams } from '@/types/setting/service-integration';

const BASE = '/service/integration';

export const serviceIntegrationService = {
  /** 获取服务集成列表 */
  getServiceList: (organizationId: string): Promise<ServiceItem[]> => {
    return http.get(`${BASE}/list/${organizationId}`).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 创建服务集成 */
  addService: (data: AddOrUpdateServiceParams): Promise<void> => {
    return http.post(`${BASE}/add`, data);
  },

  /** 更新服务集成 */
  updateService: (data: AddOrUpdateServiceParams): Promise<void> => {
    return http.post(`${BASE}/update`, data);
  },

  /** 重置服务集成（删除配置） */
  resetService: (id: string): Promise<void> => {
    return http.get(`${BASE}/delete/${id}`);
  },

  /** 测试连接（GET） */
  getValidate: (id: string): Promise<any> => {
    return http.get(`${BASE}/validate/${id}`);
  },

  /** 测试连接（POST，不同平台对应不同字段） */
  postValidate: (pluginId: string, data: any): Promise<any> => {
    return http.post(`${BASE}/validate/${pluginId}`, data);
  },

  /** 获取配置脚本 */
  getConfigScript: (pluginId: string): Promise<any> => {
    return http.get(`${BASE}/script/${pluginId}`);
  },
};
