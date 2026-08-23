/**
 * 项目管理服务（基于 AegisOne）
 * 提供项目管理的完整功能
 */

import { http } from '@/utils/request';
import { runProjectScriptTestAsync } from '@/services/data-forge-run';
export const projectManagementService = {
  // ==================== 基础信息 ====================
  
  /**
   * 获取项目详情
   */
  getProjectInfo: async (id: string) => {
    return http.get(`/project/get/${id}`);
  },

  /**
   * 更新项目
   */
  updateProject: async (data: any) => {
    return http.post('/project/update', data);
  },

  /**
   * 获取项目列表
   */
  getProjectList: async (organizationId: string) => {
    return http.get('/project/list', { params: { organizationId } });
  },

  /**
   * 切换项目
   */
  switchProject: async (data: { projectId: string; userId: string }) => {
    return http.post('/project/switch', data);
  },

  // ==================== 项目成员 ====================

  /**
   * 获取项目成员列表
   */
  getProjectMemberList: async (params: { projectId: string; current?: number; pageSize?: number }) => {
    return http.post('/project/member/list', {
      projectId: params.projectId,
      current: params.current || 1,
      pageSize: params.pageSize || 10,
    });
  },

  /**
   * 添加项目成员
   */
  addProjectMember: async (data: { projectId: string; userIds: string[]; roleIds: string[] }) => {
    return http.post('/project/member/add', data);
  },

  /**
   * 更新项目成员用户组
   */
  updateProjectMember: async (data: { projectId: string; userId: string; roleIds: string[] }) => {
    return http.post('/project/member/update', data);
  },

  /**
   * 批量添加成员到用户组
   */
  addMemberRole: async (data: { projectId: string; userIds: string[]; roleIds: string[] }) => {
    return http.post('/project/member/add-role', data);
  },

  /**
   * 批量移除成员
   */
  batchRemoveMember: async (data: { projectId: string; userIds: string[] }) => {
    return http.post('/project/member/batch/remove', data);
  },

  /**
   * 移除项目成员
   */
  removeProjectMember: async (projectId: string, userId: string) => {
    return http.get(`/project/member/remove/${projectId}/${userId}`);
  },

  /**
   * 获取用户组下拉选项
   */
  getProjectUserGroupOptions: async (projectId: string) => {
    return http.get(`/project/member/get-role/option/${projectId}`);
  },

  /**
   * 获取成员下拉选项
   */
  getProjectMemberOptions: async (projectId: string, keyword?: string) => {
    return http.get(`/project/member/get-member/option/${projectId}`, { params: { keyword } });
  },

  /**
   * 获取用例关联配置（需求平台等）
   */
  getCaseRelatedInfo: async (projectId: string) => {
    return http.get(`/project/application/case/related/info/${projectId}`);
  },

  /**
   * 邀请成员
   */
  inviteMember: async (data: any) => {
    return http.post('/project/member/invite', data);
  },

  // ==================== 用户组管理 ====================

  /**
   * 获取用户组列表
   */
  getUserRoleList: async (params: { projectId: string; current?: number; pageSize?: number }) => {
    return http.post('/user/role/project/list', {
      projectId: params.projectId,
      current: params.current || 1,
      pageSize: params.pageSize || 10,
    });
  },

  /**
   * 添加用户组
   */
  addUserRole: async (data: { name: string; scopeId: string }) => {
    return http.post('/user/role/project/add', data);
  },

  /**
   * 更新用户组
   */
  updateUserRole: async (data: { id: string; name: string; scopeId: string }) => {
    return http.post('/user/role/project/update', data);
  },

  /**
   * 删除用户组
   */
  deleteUserRole: async (id: string) => {
    return http.get(`/user/role/project/delete/${id}`);
  },

  /**
   * 获取用户组权限配置
   */
  getUserRolePermissionSetting: async (id: string) => {
    return http.get(`/user/role/project/permission/setting/${id}`);
  },

  /**
   * 更新用户组权限配置
   */
  updateUserRolePermissionSetting: async (data: any) => {
    return http.post('/user/role/project/permission/update', data);
  },

  /**
   * 获取用户组成员列表
   */
  getUserRoleMemberList: async (params: { projectId: string; userRoleId: string; current?: number; pageSize?: number }) => {
    return http.post('/user/role/project/list-member', {
      projectId: params.projectId,
      userRoleId: params.userRoleId,
      current: params.current || 1,
      pageSize: params.pageSize || 10,
    });
  },

  /**
   * 添加用户组成员
   */
  addUserRoleMember: async (data: { projectId: string; userRoleId: string; userIds: string[] }) => {
    return http.post('/user/role/project/add-member', data);
  },

  /**
   * 移除用户组成员
   */
  removeUserRoleMember: async (data: { projectId: string; userRoleId: string; userIds: string[] }) => {
    return http.post('/user/role/project/remove-member', data);
  },

  /**
   * 获取用户组成员下拉选项
   */
  getUserRoleMemberOptions: async (projectId: string, roleId: string, keyword?: string) => {
    return http.get(`/user/role/project/get-member/option/${projectId}/${roleId}`, { params: { keyword } });
  },

  // ==================== 项目版本 ====================

  /**
   * 获取版本列表
   */
  getVersionList: async (params: any) => {
    return http.post('/project/version/page', params);
  },

  /**
   * 添加版本
   */
  addVersion: async (data: any) => {
    return http.post('/project/version/add', data);
  },

  /**
   * 更新版本
   */
  updateVersion: async (data: any) => {
    return http.post('/project/version/update', data);
  },

  /**
   * 删除版本
   */
  deleteVersion: async (id: string) => {
    return http.get(`/project/version/delete/${id}`);
  },

  /**
   * 切换版本状态
   */
  toggleVersionStatus: async (id: string) => {
    return http.get(`/project/version/enable/${id}`);
  },

  /**
   * 使用最新版本
   */
  useLatestVersion: async (id: string) => {
    return http.get(`/project/version/latest/${id}`);
  },

  /**
   * 获取版本选项
   */
  getVersionOptions: async (projectId: string) => {
    return http.get(`/project/version/options/${projectId}`);
  },

  /**
   * 获取版本状态
   */
  getVersionStatus: async (projectId: string) => {
    return http.get(`/project/version/status/${projectId}`);
  },

  // ==================== 环境管理 ====================

  /**
   * 获取环境列表
   */
  getEnvironmentList: async (params: { projectId: string; keyword?: string }) => {
    return http.post('/project/environment/list', params);
  },

  /**
   * 获取环境详情
   */
  getEnvironmentDetail: async (id: string) => {
    return http.get(`/project/environment/${id}`);
  },

  /**
   * 添加环境
   */
  addEnvironment: async (data: any) => {
    return http.post('/project/environment/add', data);
  },

  /**
   * 更新环境
   */
  updateEnvironment: async (data: any) => {
    return http.post('/project/environment/update', data);
  },

  /**
   * 删除环境
   */
  deleteEnvironment: async (id: string) => {
    return http.get(`/project/environment/delete/${id}`);
  },

  /**
   * 导入环境
   */
  importEnvironment: async (data: FormData) => {
    return http.post('/project/environment/import', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 导出环境
   */
  exportEnvironment: async (selectIds: string[]) => {
    return http.post('/project/environment/export', { selectIds }, {
      responseType: 'blob',
    });
  },

  /**
   * 复制环境
   */
  copyEnvironment: async (data: any) => {
    return http.post('/project/environment/copy', data);
  },

  /**
   * 获取环境组列表
   */
  getEnvironmentGroupList: async (params: { projectId: string; keyword?: string }) => {
    return http.post('/project/environment/group/list', params);
  },

  /**
   * 添加环境组
   */
  addEnvironmentGroup: async (data: any) => {
    return http.post('/project/environment/group/add', data);
  },

  /**
   * 获取环境组详情
   */
  getEnvironmentGroupDetail: async (id: string) => {
    return http.get(`/project/environment/group/${id}`);
  },

  /**
   * 删除环境组
   */
  deleteEnvironmentGroup: async (id: string) => {
    return http.get(`/project/environment/group/delete/${id}`);
  },

  /**
   * 获取全局参数
   */
  getGlobalParams: async (projectId: string) => {
    return http.get(`/project/global-params/${projectId}`);
  },

  /**
   * 保存全局参数
   */
  saveGlobalParams: async (data: any) => {
    return http.post('/project/global-params/save', data);
  },

  // ==================== 文件管理 ====================

  /**
   * 获取文件列表
   */
  getFileList: async (params: any) => {
    return http.post('/project/file/page', params);
  },

  /**
   * 获取模块文件数量
   */
  getModuleFileCount: async (params: any) => {
    return http.post('/project/file/module/count', params);
  },

  /**
   * 上传文件
   */
  uploadFile: async (data: FormData) => {
    return http.post('/project/file/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 更新文件信息
   */
  updateFileInfo: async (data: any) => {
    return http.post('/project/file/update', data);
  },

  /**
   * 重新上传文件
   */
  reuploadFile: async (data: FormData) => {
    return http.post('/project/file/reupload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 删除文件
   */
  deleteFile: async (data: any) => {
    return http.post('/project/file/delete', data);
  },

  /**
   * 下载文件
   */
  downloadFile: async (id: string) => {
    return http.get(`/project/file/download/${id}`, {
      responseType: 'blob',
    });
  },

  /**
   * 批量下载文件
   */
  batchDownloadFile: async (data: any) => {
    return http.post('/project/file/batch-download', data, {
      responseType: 'blob',
    });
  },

  /**
   * 批量移动文件
   */
  batchMoveFile: async (data: any) => {
    return http.post('/project/file/batch-move', data);
  },

  /**
   * 获取文件详情
   */
  getFileDetail: async (id: string) => {
    return http.get(`/project/file/${id}`);
  },

  /**
   * 获取文件历史
   */
  getFileHistory: async (id: string) => {
    return http.get(`/project/file/history/${id}`);
  },

  // ==================== 公共脚本 ====================

  /**
   * 获取脚本列表
   */
  getScriptList: async (params: any) => {
    return http.post('/project/script/page', params);
  },

  /**
   * 获取脚本详情
   */
  getScriptDetail: async (id: string) => {
    return http.get(`/project/script/${id}`);
  },

  /**
   * 添加或更新脚本
   */
  saveScript: async (data: any) => {
    return http.post(data.id ? '/project/script/update' : '/project/script/add', data);
  },

  /**
   * 删除脚本
   */
  deleteScript: async (id: string) => {
    return http.get(`/project/script/delete/${id}`);
  },

  /**
   * 更新脚本状态
   */
  updateScriptStatus: async (data: any) => {
    return http.post('/project/script/update-status', data);
  },

  /**
   * 测试脚本（异步：先提交 test-async 拿 jobId，再轮询 run-result 获取结果）
   */
  testScript: async (data: any) => {
    return runProjectScriptTestAsync(data);
  },

  /**
   * 获取脚本变更历史
   */
  getScriptChangeHistory: async (params: any) => {
    return http.post('/project/script/change-history', params);
  },

  /**
   * 获取可插入脚本列表
   */
  getInsertableScriptList: async (params: any) => {
    return http.post('/project/script/insert-list', params);
  },

  // ==================== 消息管理 ====================

  /**
   * 获取机器人列表
   */
  getRobotList: async (projectId: string) => {
    return http.get(`/project/robot/list/${projectId}`);
  },

  /**
   * 获取机器人详情
   */
  getRobotDetail: async (id: string) => {
    return http.get(`/project/robot/${id}`);
  },

  /**
   * 添加机器人
   */
  addRobot: async (data: any) => {
    return http.post('/project/robot/add', data);
  },

  /**
   * 更新机器人
   */
  updateRobot: async (data: any) => {
    return http.post('/project/robot/update', data);
  },

  /**
   * 启用/禁用机器人
   */
  toggleRobot: async (id: string) => {
    return http.get(`/project/robot/enable/${id}`);
  },

  /**
   * 删除机器人
   */
  deleteRobot: async (id: string) => {
    return http.get(`/project/robot/delete/${id}`);
  },

  /**
   * 获取消息配置列表（与原项目一致：GET /notice/message/task/get/{projectId}）
   */
  getMessageList: async (projectId: string) => {
    return http.get(`/notice/message/task/get/${projectId}`);
  },

  /**
   * 获取消息配置详情（与原项目一致：GET /notice/message/template/detail/{projectId}?taskType,event,robotId）
   */
  getMessageDetail: async (params: { projectId: string; taskType: string; event: string; robotId: string }) => {
    const { projectId, ...rest } = params;
    return http.get(`/notice/message/template/detail/${projectId}`, { params: rest });
  },

  /**
   * 保存消息配置（与原项目一致：POST /notice/message/task/save）
   */
  saveMessageConfig: async (data: any) => {
    return http.post('/notice/message/task/save', data);
  },

  /**
   * 获取消息字段（与原项目一致：GET /notice/template/get/fields/{projectId}?taskType）
   */
  getMessageFields: async (projectId: string, taskType: string) => {
    return http.get(`/notice/template/get/fields/${projectId}`, { params: { taskType } });
  },

  /**
   * 获取消息用户列表（与原项目一致：GET /notice/message/task/get/user/{projectId}?keyword）
   */
  getMessageUserList: async (projectId: string, keyword?: string) => {
    return http.get(`/notice/message/task/get/user/${projectId}`, { params: { keyword } });
  },

  // ==================== 菜单管理 ====================

  /**
   * 获取菜单列表
   */
  getMenuList: async (projectId: string) => {
    return http.get(`/project/menu/list/${projectId}`);
  },

  /**
   * 更新菜单配置
   */
  updateMenuConfig: async (data: any, menuType: string) => {
    return http.post(`/project/menu/update/${menuType}`, data);
  },

  /**
   * 获取菜单配置
   */
  getMenuConfig: async (params: { projectId: string; type: string }) => {
    return http.post('/project/menu/config', params);
  },

  /**
   * 获取资源池选项
   */
  getResourcePoolOptions: async (projectId: string, type: string) => {
    const suffix = type === 'api-test' ? 'api' : type === 'ui-test' ? 'ui' : 'performance-test';
    return http.get(`/project/application/${suffix}/resource-pool/${projectId}`);
  },

  /**
   * 获取审核人选项
   */
  getAuditorOptions: async (projectId: string, type: string) => {
    const suffix = type === 'load-test' ? 'performance-test' : type === 'api-test' ? 'api' : 'ui';
    return http.get(`/project/application/${suffix}/user/${projectId}`);
  },

  /**
   * 获取模块设置列表
   */
  getModuleSetting: async (projectId: string) => {
    return http.get(`/project/application/module-setting/${projectId}`);
  },
};

