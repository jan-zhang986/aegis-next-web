/**
 * 系统设置-用户组 API（与 AegisOne 路径一致）
 * 系统级：/user/role/global/*  组织级：/user/role/organization/*
 */
import { http } from '@/utils/request';
import type {
  UserGroupItem,
  SystemUserGroupParams,
  OrgUserGroupParams,
  UserGroupMemberListParams,
  UserGroupMemberListResult,
  AddSystemUserToGroupParams,
  AddOrgUserToGroupParams,
  UserGroupOptionItem,
  UserGroupAuthSetting,
  SavePermissionPayload,
} from '@/types/setting/usergroup';

const GLOBAL = '/user/role/global';
const ORG = '/user/role/organization';

/**
 * 从权限配置接口响应中解析出树数组（兼容多种后端返回格式）
 * - 直接数组、res.data、res.list、res.data?.list 等
 */
function normalizePermissionSettingResponse(res: any): UserGroupAuthSetting[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const list = data.list ?? data.moduleList ?? data.data ?? data.children;
    if (Array.isArray(list)) return list;
  }
  return [];
}

export const systemUserGroupService = {
  /** 系统-获取用户组列表 */
  getList: (): Promise<UserGroupItem[]> => {
    return http.get(`${GLOBAL}/list`).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 系统-创建用户组 */
  add: (data: Omit<SystemUserGroupParams, 'id'>): Promise<UserGroupItem> => {
    return http.post(`${GLOBAL}/add`, data);
  },

  /** 系统-修改用户组 */
  update: (data: SystemUserGroupParams): Promise<UserGroupItem> => {
    return http.post(`${GLOBAL}/update`, data);
  },

  /** 系统-删除用户组 */
  delete: (id: string): Promise<void> => {
    return http.get(`${GLOBAL}/delete/${id}`);
  },

  /** 系统-根据用户组获取成员列表 */
  getMemberList: (data: UserGroupMemberListParams): Promise<UserGroupMemberListResult> => {
    return http.post('/user/role/relation/global/list', data).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? data?.current ?? 1,
      pageSize: res?.pageSize ?? data?.pageSize ?? 10,
    }));
  },

  /** 系统-获取可添加的用户选项（添加成员下拉） */
  getMemberOption: (roleId: string, keyword: string): Promise<UserGroupOptionItem[]> => {
    return http.get(`/user/role/relation/global/user/option/${roleId}`, {
      params: { keyword },
    }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 系统-添加用户到用户组 */
  addMember: (data: AddSystemUserToGroupParams): Promise<void> => {
    return http.post('/user/role/relation/global/add', data);
  },

  /** 系统-从用户组移除用户（传关联 id） */
  removeMember: (relationId: string): Promise<void> => {
    return http.get(`/user/role/relation/global/delete/${relationId}`);
  },

  /** 系统-获取用户组权限配置 */
  getPermissionSetting: (roleId: string): Promise<UserGroupAuthSetting[]> => {
    return http.get(`${GLOBAL}/permission/setting/${roleId}`).then((res: any) => normalizePermissionSettingResponse(res));
  },

  /** 系统-保存用户组权限配置 */
  savePermissionSetting: (data: SavePermissionPayload): Promise<void> => {
    return http.post(`${GLOBAL}/permission/update`, data);
  },
};

const orgListUrl = (organizationId: string) => `${ORG}/list/${organizationId}`;
const orgMemberOptionUrl = (organizationId: string, roleId: string) =>
  `${ORG}/get-member/option/${organizationId}/${roleId}`;

export const orgUserGroupService = {
  /** 组织-获取用户组列表 */
  getList: (organizationId: string): Promise<UserGroupItem[]> => {
    return http.get(orgListUrl(organizationId)).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 组织-创建用户组 */
  add: (data: OrgUserGroupParams): Promise<UserGroupItem> => {
    return http.post(`${ORG}/add`, data);
  },

  /** 组织-修改用户组 */
  update: (data: OrgUserGroupParams): Promise<UserGroupItem> => {
    return http.post(`${ORG}/update`, data);
  },

  /** 组织-删除用户组 */
  delete: (id: string): Promise<void> => {
    return http.get(`${ORG}/delete/${id}`);
  },

  /** 组织-根据用户组获取成员列表 */
  getMemberList: (params: {
    userRoleId: string;
    organizationId: string;
    current?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<UserGroupMemberListResult> => {
    return http.post(`${ORG}/list-member`, params).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? params?.current ?? 1,
      pageSize: res?.pageSize ?? params?.pageSize ?? 10,
    }));
  },

  /** 组织-获取可添加的用户选项 */
  getMemberOption: (
    organizationId: string,
    roleId: string,
    keyword: string
  ): Promise<UserGroupOptionItem[]> => {
    return http.get(orgMemberOptionUrl(organizationId, roleId), { params: { keyword } }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 组织-添加用户到用户组 */
  addMember: (data: AddOrgUserToGroupParams): Promise<void> => {
    return http.post(`${ORG}/add-member`, data);
  },

  /** 组织-从用户组移除用户 */
  removeMember: (params: { userRoleId: string; userIds: string[]; organizationId: string }): Promise<void> => {
    return http.post(`${ORG}/remove-member`, params);
  },

  /** 组织-获取用户组权限配置 */
  getPermissionSetting: (roleId: string): Promise<UserGroupAuthSetting[]> => {
    return http.get(`${ORG}/permission/setting/${roleId}`).then((res: any) => normalizePermissionSettingResponse(res));
  },

  /** 组织-保存用户组权限配置 */
  savePermissionSetting: (data: SavePermissionPayload): Promise<void> => {
    return http.post(`${ORG}/permission/update`, data);
  },
};

const projectMemberOptionUrl = (projectId: string, roleId: string) =>
  `/user/role/project/get-member/option/${projectId}/${roleId}`;

export const projectUserGroupService = {
  /** 项目-获取用户组列表 */
  getList: (projectId: string): Promise<UserGroupItem[]> => {
    return http.post('/user/role/project/list', {
      projectId,
      current: 1,
      pageSize: 100
    }).then((res: any) => {
      const data = res?.data ?? res?.list ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 项目-创建用户组 */
  add: (data: { name: string; scopeId: string; type: 'PROJECT' }): Promise<UserGroupItem> => {
    return http.post('/user/role/project/add', data);
  },

  /** 项目-修改用户组 */
  update: (data: { id: string; name: string; scopeId: string }): Promise<UserGroupItem> => {
    return http.post('/user/role/project/update', data);
  },

  /** 项目-删除用户组 */
  delete: (id: string): Promise<void> => {
    return http.get(`/user/role/project/delete/${id}`);
  },

  /** 项目-根据用户组获取成员列表 */
  getMemberList: (params: {
    userRoleId: string;
    projectId: string;
    current?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<UserGroupMemberListResult> => {
    return http.post('/user/role/project/list-member', params).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? params?.current ?? 1,
      pageSize: res?.pageSize ?? params?.pageSize ?? 10,
    }));
  },

  /** 项目-获取可添加的用户选项 */
  getMemberOption: (
    projectId: string,
    roleId: string,
    keyword: string
  ): Promise<UserGroupOptionItem[]> => {
    return http.get(projectMemberOptionUrl(projectId, roleId), { params: { keyword } }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 项目-添加用户到用户组 */
  addMember: (data: { userRoleId: string; userIds: string[]; projectId: string }): Promise<void> => {
    return http.post('/user/role/project/add-member', data);
  },

  /** 项目-从用户组移除用户 */
  removeMember: (params: { userRoleId: string; userIds: string[]; projectId: string }): Promise<void> => {
    return http.post('/user/role/project/remove-member', params);
  },

  /** 项目-获取用户组权限配置 */
  getPermissionSetting: (roleId: string): Promise<UserGroupAuthSetting[]> => {
    return http.get(`/user/role/project/permission/setting/${roleId}`).then((res: any) => normalizePermissionSettingResponse(res));
  },

  /** 项目-保存用户组权限配置 */
  savePermissionSetting: (data: SavePermissionPayload): Promise<void> => {
    return http.post('/user/role/project/permission/update', data);
  },
};
