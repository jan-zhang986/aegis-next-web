/**
 * 系统设置-用户 API（与 MeterSphere 路径一致）
 */
import { http } from '@/utils/request';
import type {
  UserListQueryParams,
  UserListResult,
  UserListItem,
  CreateUserParams,
  CreateUserResult,
  UpdateUserInfoParams,
  UpdateUserStatusParams,
  DeleteUserParams,
  ResetUserPasswordParams,
  SystemRole,
  BatchAddParams,
  ImportUserResult,
  OrgsItem,
} from '@/types/setting/user';

const BASE = '/system/user';

export const systemUserService = {
  /** 分页获取用户列表 */
  getUserList: (data: UserListQueryParams): Promise<UserListResult> => {
    return http.post(`${BASE}/page`, data).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? data?.current ?? 1,
      pageSize: res?.pageSize ?? data?.pageSize ?? 10,
    }));
  },

  /** 批量创建用户 */
  batchCreateUser: (data: CreateUserParams): Promise<CreateUserResult> => {
    return http.post(`${BASE}/add`, data).then((res: any) => ({
      errorEmails: res?.errorEmails ?? null,
      successList: res?.successList ?? [],
    }));
  },

  /** 更新用户信息 */
  updateUserInfo: (data: UpdateUserInfoParams): Promise<void> => {
    return http.post(`${BASE}/update`, data);
  },

  /** 启用/禁用用户 */
  toggleUserStatus: (data: UpdateUserStatusParams): Promise<void> => {
    return http.post(`${BASE}/update/enable`, data);
  },

  /** 获取用户详情（keyword 可为邮箱或用户 ID） */
  getUserInfo: (keyword: string): Promise<UserListItem> => {
    return http.get(`${BASE}/get`, { params: { keyword } });
  },

  /** 删除用户 */
  deleteUserInfo: (data: DeleteUserParams): Promise<void> => {
    return http.post(`${BASE}/delete`, data);
  },

  /** 获取系统用户组（全局） */
  getSystemRoles: (): Promise<SystemRole[]> => {
    return http.get(`${BASE}/get/global/system/role`).then((res: any) => res ?? []);
  },

  /** 重置用户密码 */
  resetUserPassword: (data: ResetUserPasswordParams): Promise<void> => {
    return http.post(`${BASE}/reset/password`, data);
  },

  /** 导入用户（上传 Excel） */
  importUserInfo: (data: { fileList: File[] }): Promise<{ data: ImportUserResult }> => {
    const formData = new FormData();
    (data.fileList || []).forEach((file) => formData.append('file', file));
    return http.post(`${BASE}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res: any) => {
      const raw = res?.data ?? res;
      return {
        data: {
          successCount: raw?.successCount ?? 0,
          importCount: raw?.importCount ?? 0,
          errorMessages: raw?.errorMessages ?? undefined,
        },
      };
    });
  },

  /** 批量添加用户到多个用户组 */
  batchAddUserGroup: (data: BatchAddParams): Promise<void> => {
    return http.post(`${BASE}/add/batch/user-role`, { ...data, roleIds: data.roleIds });
  },

  /** 批量添加用户到多个项目 */
  batchAddProject: (data: BatchAddParams): Promise<void> => {
    return http.post(`${BASE}/add-project-member`, data);
  },

  /** 批量添加用户到多个组织 */
  batchAddOrg: (data: BatchAddParams): Promise<void> => {
    return http.post(`${BASE}/add-org-member`, data);
  },

  /** 获取系统组织列表（树/列表，用于批量加入组织） */
  getSystemOrgs: (): Promise<OrgsItem[]> => {
    return http.get(`${BASE}/get/organization`).then((res: any) => res ?? []);
  },

  /** 获取系统项目列表（树/列表，用于批量加入项目） */
  getSystemProjects: (): Promise<OrgsItem[]> => {
    return http.get(`${BASE}/get/project`).then((res: any) => res ?? []);
  },

  /** 邮箱邀请（发送邀请邮件，与 MeterSphere 系统用户邀请一致） */
  sendInvite: (data: { inviteEmails: string[]; userRoleIdList: string[] }): Promise<void> => {
    return http.post(`${BASE}/send/invite`, data);
  },
};
