/**
 * 测试用例管理服务（基于 MeterSphere）
 * 提供测试用例的完整管理功能
 */

import { http } from '@/utils/request';

export const testCaseService = {
  /**
   * 获取测试用例列表
   */
  getTestCaseList: async (params: {
    page?: number;
    pageSize?: number;
    projectId?: string;
    moduleId?: string;
    keyword?: string;
    [key: string]: any;
  }) => {
    return http.post('/api/functional/case/list', params);
  },

  /**
   * 获取测试用例详情
   */
  getTestCaseDetail: async (id: string) => {
    return http.get(`/api/functional/case/get/${id}`);
  },

  /**
   * 创建测试用例
   */
  createTestCase: async (data: any) => {
    return http.post('/api/functional/case/add', data);
  },

  /**
   * 更新测试用例
   */
  updateTestCase: async (data: any) => {
    return http.post('/api/functional/case/update', data);
  },

  /**
   * 删除测试用例
   */
  deleteTestCase: async (data: { ids: string[]; projectId?: string }) => {
    return http.post('/api/functional/case/delete', data);
  },

  /**
   * 批量编辑测试用例
   */
  batchEditTestCase: async (data: any) => {
    return http.post('/api/functional/case/batch/edit', data);
  },

  /**
   * 批量移动测试用例
   */
  batchMoveTestCase: async (data: any) => {
    return http.post('/api/functional/case/batch/move', data);
  },

  /**
   * 批量复制测试用例
   */
  batchCopyTestCase: async (data: any) => {
    return http.post('/api/functional/case/batch/copy', data);
  },

  /**
   * 导出测试用例（Excel）
   */
  exportTestCase: async (params: any) => {
    return http.post('/api/functional/case/export', params);
  },

  /**
   * 导入测试用例（Excel）
   */
  importTestCase: async (data: FormData) => {
    return http.post('/api/functional/case/import', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 关注/取消关注测试用例
   */
  followTestCase: async (data: { userId: string; functionalCaseId: string }) => {
    return http.post('/api/functional/case/follow', data);
  },

  /**
   * 获取模块树
   */
  getModuleTree: async (projectId: string) => {
    return http.get(`/api/functional/case/module/tree/${projectId}`);
  },

  /**
   * 创建模块
   */
  createModule: async (data: { projectId: string; name: string; parentId: string }) => {
    return http.post('/api/functional/case/module/add', data);
  },

  /**
   * 更新模块
   */
  updateModule: async (data: { id: string; name: string }) => {
    return http.post('/api/functional/case/module/update', data);
  },

  /**
   * 删除模块
   */
  deleteModule: async (id: string) => {
    return http.get(`/api/functional/case/module/delete/${id}`);
  },
};
