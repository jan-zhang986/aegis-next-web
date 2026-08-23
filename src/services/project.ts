/**
 * 项目服务
 * 提供项目的基础管理功能
 */

import { http } from '@/utils/request';

/**
 * 项目简单信息（用于列表展示）
 */
export interface ProjectSimple {
  id: string;
  name: string;
}

export const projectService = {
  /**
   * 获取项目列表（公开接口，无需认证）
   * 调用 AegisOne 后端的 /project/list/public 接口
   * 注意：此接口返回所有项目，不进行权限过滤
   */
  getProjectList: async (): Promise<ProjectSimple[]> => {
    return http.get<ProjectSimple[]>('/project/list/public');
  },

  /**
   * 根据组织ID获取有权限的项目列表（需要权限过滤）
   * 调用 AegisOne 后端的 /project/list/options/{organizationId} 接口
   * 此接口会根据组织ID和用户权限返回该组织下有权限的项目
   */
  getProjectListByOrg: async (organizationId: string): Promise<ProjectSimple[]> => {
    return http.get<ProjectSimple[]>(`/project/list/options/${organizationId}`);
  },

  /**
   * 获取项目详情
   */
  getProjectDetail: async (id: string) => {
    return http.get(`/api/projects/${id}`);
  },

  /**
   * 创建项目
   */
  createProject: async (data: { name: string; description?: string }) => {
    return http.post('/api/projects', data);
  },

  /**
   * 更新项目
   */
  updateProject: async (id: string, data: { name?: string; description?: string }) => {
    return http.put(`/api/projects/${id}`, data);
  },

  /**
   * 删除项目
   */
  deleteProject: async (id: string) => {
    return http.delete(`/api/projects/${id}`);
  },
};
