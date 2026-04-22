/**
 * 数据工厂服务
 * 提供数据生成和执行功能
 */

import { http } from '@/utils/request';

export const dataFactoryService = {
  /**
   * 获取数据工厂列表
   */
  getDataFactoryList: async (params?: { page?: number; pageSize?: number }) => {
    return http.get('/api/data-factory', { params });
  },

  /**
   * 创建数据工厂配置
   */
  createDataFactory: async (data: any) => {
    return http.post('/api/data-factory', data);
  },

  /**
   * 执行数据工厂
   */
  executeDataFactory: async (id: string, params?: any) => {
    return http.post(`/api/data-factory/${id}/execute`, params);
  },
};
