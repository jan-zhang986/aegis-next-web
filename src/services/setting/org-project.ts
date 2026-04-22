/**
 * 系统设置-组织-项目 API（与 MeterSphere 路径一致）
 */
import { http } from '@/utils/request';
import type {
  OrgProjectListParams,
  OrgProjectListResult,
  CreateOrUpdateSystemProjectParams,
  OrgProjectTableItem,
} from '@/types/setting/organization-project';

const BASE = '/organization/project';

function normalizeListResult(res: any, params: OrgProjectListParams): OrgProjectListResult {
  const data = res?.data ?? res?.list ?? res;
  const list = Array.isArray(data) ? data : [];
  return {
    total: res?.total ?? list.length,
    list,
    current: res?.current ?? params?.current ?? 1,
    pageSize: res?.pageSize ?? params?.pageSize ?? 10,
  };
}

export const orgProjectService = {
  /** 获取组织下的项目列表（分页） */
  getProjectList: (params: OrgProjectListParams & { organizationId: string }): Promise<OrgProjectListResult> => {
    return http.post(`${BASE}/page`, params).then((res) => normalizeListResult(res, params));
  },

  /** 创建项目 */
  addProject: (data: Omit<CreateOrUpdateSystemProjectParams, 'id'> & { organizationId: string }): Promise<void> => {
    return http.post(`${BASE}/add`, data);
  },

  /** 更新项目 */
  updateProject: (data: CreateOrUpdateSystemProjectParams & { id: string; organizationId: string }): Promise<void> => {
    return http.post(`${BASE}/update`, data);
  },

  /** 修改项目名称 */
  renameProject: (data: { id: string; name: string; organizationId: string }): Promise<void> => {
    return http.post(`${BASE}/rename`, data);
  },

  /** 删除项目 */
  deleteProject: (id: string): Promise<void> => {
    return http.get(`${BASE}/delete/${id}`);
  },

  /** 启用项目 */
  enableProject: (id: string): Promise<void> => {
    return http.get(`${BASE}/enable/${id}`);
  },

  /** 禁用项目 */
  disableProject: (id: string): Promise<void> => {
    return http.get(`${BASE}/disable/${id}`);
  },

  /** 恢复项目（撤销删除） */
  revokeProject: (id: string): Promise<void> => {
    return http.get(`${BASE}/revoke/${id}`);
  },

  /** 获取管理员下拉选项 */
  getAdminOptions: (organizationId: string, keyword?: string): Promise<{ id: string; name: string; email?: string }[]> => {
    return http.get(`${BASE}/user-admin-list/${organizationId}`, { params: keyword ? { keyword } : {} }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 获取成员下拉选项 */
  getUserOptions: (organizationId: string, projectId: string, keyword?: string): Promise<{ id: string; name: string; email?: string }[]> => {
    return http.get(`${BASE}/user-member-list/${organizationId}/${projectId}`, { params: keyword ? { keyword } : {} }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },
};
