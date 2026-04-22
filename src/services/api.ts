/**
 * API 接口管理服务
 * 提供API接口的CRUD和测试功能
 */

import { http } from '@/utils/request';

export const apiService = {
  /**
   * 获取 API 列表
   */
  getApiList: async (params?: { projectId?: string; groupId?: string; type?: string }) => {
    return http.get('/api/apis', { params });
  },

  /**
   * 获取 API 详情
   */
  getApiDetail: async (id: string) => {
    return http.get(`/api/apis/${id}`);
  },

  /**
   * 创建 API
   */
  createApi: async (data: any) => {
    return http.post('/api/apis', data);
  },

  /**
   * 更新 API
   */
  updateApi: async (id: string, data: any) => {
    return http.put(`/api/apis/${id}`, data);
  },

  /**
   * 删除 API
   */
  deleteApi: async (id: string) => {
    return http.delete(`/api/apis/${id}`);
  },

  /**
   * 执行 API 测试
   */
  executeApi: async (id: string, params?: any) => {
    return http.post(`/api/apis/${id}/execute`, params);
  },

  /**
   * 获取 API 接口树（包含模块和接口）
   */
  getApiTree: async (params: {
    projectId: string;
    protocols?: string[];
    keyword?: string;
  }) => {
    return http.post('/api/definition/module/tree', params);
  },
};
