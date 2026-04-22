/**
 * 测试报告服务
 * 提供测试报告的查看和删除功能
 */

import { http } from '@/utils/request';

export const testReportService = {
  /**
   * 获取测试报告列表
   */
  getReportList: async (params?: { page?: number; pageSize?: number; projectId?: string }) => {
    return http.get('/api/reports', { params });
  },

  /**
   * 获取测试报告详情
   */
  getReportDetail: async (id: string) => {
    return http.get(`/api/reports/${id}`);
  },

  /**
   * 删除测试报告
   */
  deleteReport: async (id: string) => {
    return http.delete(`/api/reports/${id}`);
  },
};
