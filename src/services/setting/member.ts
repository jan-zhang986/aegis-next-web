/**
 * 系统设置-组织成员 API（与 AegisOne 路径一致）
 */
import { http } from '@/utils/request';
import type {
  MemberListParams,
  MemberListResult,
  AddOrUpdateMemberParams,
  LinkItem,
  InviteMemberParams,
} from '@/types/setting/member';

const BASE = '/organization';

function normalizeListResult(res: any, params: MemberListParams): MemberListResult {
  const data = res?.data ?? res?.list ?? res;
  const list = Array.isArray(data) ? data : [];
  return {
    total: res?.total ?? list.length,
    list,
    current: res?.current ?? params?.current ?? 1,
    pageSize: res?.pageSize ?? params?.pageSize ?? 10,
  };
}

export const orgMemberService = {
  /** 获取组织成员列表 */
  getMemberList: (params: MemberListParams & { organizationId: string }): Promise<MemberListResult> => {
    return http.post(`${BASE}/member/list`, params).then((res) => normalizeListResult(res, params));
  },

  /** 添加成员 */
  addMember: (data: AddOrUpdateMemberParams): Promise<void> => {
    return http.post(`${BASE}/add-member`, data);
  },

  /** 更新成员（用户组/项目） */
  updateMember: (data: AddOrUpdateMemberParams & { memberId: string }): Promise<void> => {
    return http.post(`${BASE}/update-member`, data);
  },

  /** 删除成员 */
  deleteMember: (organizationId: string, userId: string): Promise<void> => {
    return http.get(`${BASE}/remove-member/${organizationId}/${userId}`);
  },

  /** 获取组织用户组列表（下拉选项） */
  getUserGroupList: (organizationId: string): Promise<LinkItem[]> => {
    return http.get(`${BASE}/user/role/list/${organizationId}`).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 获取组织项目列表（下拉选项） */
  getProjectList: (organizationId: string, keyword?: string): Promise<LinkItem[]> => {
    return http.get(`${BASE}/project/list/${organizationId}`, { params: keyword ? { keyword } : {} }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 获取可选用户列表（添加成员时，组织内不存在的用户） */
  getAvailableUserList: (organizationId: string, keyword?: string): Promise<LinkItem[]> => {
    return http.get(`${BASE}/not-exist/user/list/${organizationId}`, { params: keyword ? { keyword } : {} }).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 邀请组织成员（邮箱邀请） */
  inviteMember: (data: InviteMemberParams): Promise<void> => {
    return http.post(`${BASE}/user/invite`, data);
  },

  /** 组织成员批量加入项目 */
  batchAddProject: (data: { organizationId: string; userIds: string[]; projectIds: string[] }): Promise<void> => {
    return http.post(`${BASE}/batch-add-project`, data);
  },

  /** 组织成员批量加入用户组 */
  batchAddUserGroup: (data: { organizationId: string; userIds: string[]; roleIds: string[] }): Promise<void> => {
    return http.post(`${BASE}/batch-add-user-role`, data);
  },
};
