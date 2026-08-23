/**
 * 系统设置-组织与项目 API（与 AegisOne 路径一致）
 */
import { http } from '@/utils/request';
import type {
  OrgProjectListParams,
  OrgProjectListResult,
  OrgProjectCountResult,
  CreateOrUpdateSystemOrgParams,
  CreateOrUpdateSystemProjectParams,
  OrgProjectTableItem,
  MemberListParams,
  MemberListResult,
  AddOrgOrProjectMemberParams,
  CurrentMemberListResult,
} from '@/types/setting/organization-project';

const ORG = '/system/organization';
const PROJECT = '/system/project';

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

export const organizationProjectService = {
  /** 组织与项目总数 */
  getCount: (): Promise<OrgProjectCountResult> => {
    return http.get(`${ORG}/total`).then((res: any) => ({
      organizationTotal: res?.organizationTotal ?? res?.data?.organizationTotal ?? 0,
      projectTotal: res?.projectTotal ?? res?.data?.projectTotal ?? 0,
    }));
  },

  /** 组织列表（分页） */
  getOrgList: (params: OrgProjectListParams): Promise<OrgProjectListResult> => {
    return http.post(`${ORG}/list`, params).then((res) => normalizeListResult(res, params));
  },

  /** 创建组织 */
  addOrg: (data: Omit<CreateOrUpdateSystemOrgParams, 'id'>): Promise<void> => {
    return http.post(`${ORG}/add`, data);
  },

  /** 更新组织 */
  updateOrg: (data: CreateOrUpdateSystemOrgParams): Promise<void> => {
    return http.post(`${ORG}/update`, data);
  },

  /** 修改组织名称 */
  renameOrg: (data: { id: string; name: string }): Promise<void> => {
    return http.post(`${ORG}/rename`, data);
  },

  /** 删除组织 */
  deleteOrg: (id: string): Promise<void> => {
    return http.get(`${ORG}/delete/${id}`);
  },

  /** 启用组织 */
  enableOrg: (id: string): Promise<void> => {
    return http.get(`${ORG}/enable/${id}`);
  },

  /** 禁用组织 */
  disableOrg: (id: string): Promise<void> => {
    return http.get(`${ORG}/disable/${id}`);
  },

  /** 恢复组织（撤销删除） */
  revokeOrg: (id: string): Promise<void> => {
    return http.get(`${ORG}/recover/${id}`);
  },

  /** 项目列表（分页） */
  getProjectList: (params: OrgProjectListParams): Promise<OrgProjectListResult> => {
    return http.post(`${PROJECT}/page`, params).then((res) => normalizeListResult(res, params));
  },

  /** 按组织 ID 获取项目列表（组织下项目侧滑用，只读） */
  getProjectListByOrgId: (organizationId: string, params: { current: number; pageSize: number; keyword?: string }): Promise<OrgProjectListResult> => {
    return http
      .post(`${PROJECT}/page`, { organizationId, ...params })
      .then((res) => normalizeListResult(res, params as OrgProjectListParams));
  },

  /** 创建项目 */
  addProject: (data: Omit<CreateOrUpdateSystemProjectParams, 'id'> & { organizationId: string }): Promise<void> => {
    return http.post(`${PROJECT}/add`, data);
  },

  /** 更新项目 */
  updateProject: (data: CreateOrUpdateSystemProjectParams & { id: string }): Promise<void> => {
    return http.post(`${PROJECT}/update`, data);
  },

  /** 修改项目名称 */
  renameProject: (data: { id: string; name: string; organizationId: string }): Promise<void> => {
    return http.post(`${PROJECT}/rename`, data);
  },

  /** 删除项目 */
  deleteProject: (id: string): Promise<void> => {
    return http.get(`${PROJECT}/delete/${id}`);
  },

  /** 启用项目 */
  enableProject: (id: string): Promise<void> => {
    return http.get(`${PROJECT}/enable/${id}`);
  },

  /** 禁用项目 */
  disableProject: (id: string): Promise<void> => {
    return http.get(`${PROJECT}/disable/${id}`);
  },

  /** 恢复项目（撤销删除） */
  revokeProject: (id: string): Promise<void> => {
    return http.get(`${PROJECT}/revoke/${id}`);
  },

  /** 获取组织下拉选项（创建项目时选所属组织） */
  getOrgOptions: (): Promise<{ id: string; name: string }[]> => {
    return http.post(`${ORG}/option/all`, {}).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 获取管理员下拉选项（组织/项目管理员，创建时选择） */
  getAdminOptions: (keyword?: string): Promise<{ id: string; name: string; email?: string }[]> => {
    return http.get(`${PROJECT}/user-list`, { params: keyword ? { keyword } : {} }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 获取可添加的成员列表（添加成员弹窗用，支持组织或项目） */
  getMemberListPage: (params: MemberListParams): Promise<MemberListResult> => {
    return http.post(`${ORG}/member-list`, {
      ...params,
      sourceId: params.projectId ?? params.organizationId,
    }).then((res: any) => {
      const data = res?.data ?? res?.list ?? res;
      const list = Array.isArray(data) ? data : [];
      return {
        total: res?.total ?? list.length,
        list,
        current: res?.current ?? params?.current ?? 1,
        pageSize: res?.pageSize ?? params?.pageSize ?? 10,
      };
    });
  },

  /** 添加组织成员 */
  addOrgMember: (data: AddOrgOrProjectMemberParams): Promise<void> => {
    return http.post(`${ORG}/add-member`, {
      userIds: data.userIds,
      userRoleIds: data.userRoleIds ?? ['org_member'],
      organizationId: data.organizationId,
    });
  },

  /** 添加项目成员 */
  addProjectMember: (data: AddOrgOrProjectMemberParams): Promise<void> => {
    return http.post(`${PROJECT}/add-member`, {
      userIds: data.userIds,
      userRoleIds: data.userRoleIds ?? ['project_member'],
      projectId: data.projectId,
    });
  },

  /** 获取组织/项目当前成员列表（侧滑成员列表用） */
  getCurrentMemberList: (params: {
    type: 'org' | 'project';
    targetId: string;
    current: number;
    pageSize: number;
    keyword?: string;
  }): Promise<CurrentMemberListResult> => {
    const body =
      params.type === 'org'
        ? {
          organizationId: params.targetId,
          current: params.current,
          pageSize: params.pageSize,
          keyword: params.keyword,
        }
        : {
          projectId: params.targetId,
          current: params.current,
          pageSize: params.pageSize,
          keyword: params.keyword,
        };
    // 原项目接口：组织 → /system/organization/list-member，项目 → /system/project/member-list
    const url = params.type === 'org' ? `${ORG}/list-member` : `${PROJECT}/member-list`;
    return http.post(url, body).then((res: any) => {
      const raw = res?.data ?? res;
      const list = Array.isArray(raw?.records)
        ? raw.records
        : Array.isArray(raw?.list)
          ? raw.list
          : Array.isArray(raw)
            ? raw
            : [];
      const total = res?.total ?? raw?.total ?? list.length;
      const normalizedList = list.map((item: any) => ({
        id: item.id ?? item.userId ?? '',
        name: item.name ?? item.userName ?? '-',
        email: item.email ?? item.emailAddress,
        userRoleIds: item.userRoleIds ?? item.roleIds,
        userRoleIdNameMap: Array.isArray(item.userRoleIdNameMap)
          ? item.userRoleIdNameMap
          : Array.isArray(item.userRoleList)
            ? item.userRoleList.map((r: any) => ({ id: r.id ?? '', name: r.name ?? r.roleName ?? '' }))
            : Array.isArray(item.roles)
              ? item.roles.map((r: any) => ({ id: r.id ?? '', name: r.name ?? r.roleName ?? '' }))
              : item.roleNames ? [{ id: '', name: item.roleNames }] : undefined,
      }));
      return {
        total,
        list: normalizedList,
        current: res?.current ?? raw?.current ?? params.current,
        pageSize: res?.pageSize ?? raw?.pageSize ?? params.pageSize,
      };
    });
  },

  /** 移除组织成员 */
  removeOrgMember: (organizationId: string, userId: string): Promise<void> => {
    return http.get(`${ORG}/remove-member/${organizationId}/${userId}`);
  },

  /** 移除项目成员 */
  removeProjectMember: (projectId: string, userId: string): Promise<void> => {
    return http.get(`${PROJECT}/remove-member/${projectId}/${userId}`);
  },
};
