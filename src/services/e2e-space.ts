/**
 * 自动化用例空间服务（E2E 工作空间 API）
 * 提供空间管理的 CRUD 操作
 */

import { http } from '@/utils/request';

/**
 * 后端工作空间DTO接口（用于API响应）
 */
interface WorkflowWorkspaceDTO {
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  owner: string;
  ownerName?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  testCaseCount?: number;
  moduleCount?: number;
  memberCount?: number;
  passRate?: number;
  status?: string;
  lastRun?: string;
}

/**
 * E2E 空间接口
 */
export interface E2ESpace {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  description?: string;
  responsiblePerson?: string;
  testCaseCount?: number;
  moduleCount?: number;
  memberCount?: number;
  passRate?: number;
  status?: 'running' | 'failed' | 'not-run';
  lastRun?: string;
  projectId?: string;
}

/**
 * 创建空间请求参数
 */
export interface CreateE2ESpaceRequest {
  name: string;
  description?: string;
  responsiblePerson?: string;
  icon?: string;
  iconColor?: string;
  projectId?: string;
}

/**
 * 更新空间请求参数
 */
export interface UpdateE2ESpaceRequest {
  id: string;
  name?: string;
  description?: string;
  responsiblePerson?: string;
  icon?: string;
  iconColor?: string;
}

export const e2eSpaceService = {
  /**
   * 获取空间列表
   */
  getSpaceList: async (params?: { projectId?: string; keyword?: string }): Promise<E2ESpace[]> => {
    if (!params?.projectId) {
      return Promise.resolve([]);
    }
    const response = await http.get<WorkflowWorkspaceDTO[]>(`/workflow/workspace/list`, { 
      params: { projectId: params.projectId, keyword: params.keyword } 
    });
    // 转换后端DTO到前端E2ESpace格式
    return response.map(ws => ({
      id: ws.workspaceId,
      name: ws.workspaceName,
      description: ws.description || '',
      responsiblePerson: ws.ownerName || ws.owner || '',
      icon: ws.icon || '📁',
      iconColor: ws.iconColor || 'bg-gray-100',
      testCaseCount: ws.testCaseCount || 0,
      moduleCount: ws.moduleCount || 0,
      memberCount: ws.memberCount || 0,
      passRate: ws.passRate || 0,
      status: (ws.status as 'running' | 'failed' | 'not-run') || 'not-run',
      lastRun: ws.lastRun || '从未运行',
      projectId: ws.projectId,
    }));
  },

  /**
   * 获取空间详情
   */
  getSpaceDetail: async (id: string): Promise<E2ESpace> => {
    const ws = await http.get<WorkflowWorkspaceDTO>(`/workflow/workspace/get/${id}`);
    return {
      id: ws.workspaceId,
      name: ws.workspaceName,
      description: ws.description || '',
      responsiblePerson: ws.ownerName || ws.owner || '',
      icon: ws.icon || '📁',
      iconColor: ws.iconColor || 'bg-gray-100',
      testCaseCount: ws.testCaseCount || 0,
      moduleCount: ws.moduleCount || 0,
      memberCount: ws.memberCount || 0,
      passRate: ws.passRate || 0,
      status: (ws.status as 'running' | 'failed' | 'not-run') || 'not-run',
      lastRun: ws.lastRun || '从未运行',
      projectId: ws.projectId,
    };
  },

  /**
   * 创建空间
   */
  createSpace: async (data: CreateE2ESpaceRequest): Promise<E2ESpace> => {
    if (!data.projectId) {
      throw new Error('项目ID不能为空');
    }
    const ws = await http.post<WorkflowWorkspaceDTO>('/workflow/workspace/create', {
      name: data.name,
      projectId: data.projectId,
      responsiblePerson: data.responsiblePerson,
      description: data.description,
      icon: data.icon,
      iconColor: data.iconColor,
    });
    return {
      id: ws.workspaceId,
      name: ws.workspaceName,
      description: ws.description || '',
      responsiblePerson: ws.ownerName || ws.owner || '',
      icon: ws.icon || '📁',
      iconColor: ws.iconColor || 'bg-gray-100',
      testCaseCount: ws.testCaseCount || 0,
      moduleCount: ws.moduleCount || 0,
      memberCount: ws.memberCount || 0,
      passRate: ws.passRate || 0,
      status: (ws.status as 'running' | 'failed' | 'not-run') || 'not-run',
      lastRun: ws.lastRun || '从未运行',
      projectId: ws.projectId,
    };
  },

  /**
   * 更新空间
   */
  updateSpace: async (data: UpdateE2ESpaceRequest): Promise<E2ESpace> => {
    const ws = await http.post<WorkflowWorkspaceDTO>('/workflow/workspace/update', {
      id: data.id,
      name: data.name,
      responsiblePerson: data.responsiblePerson,
      description: data.description,
      icon: data.icon,
      iconColor: data.iconColor,
    });
    return {
      id: ws.workspaceId,
      name: ws.workspaceName,
      description: ws.description || '',
      responsiblePerson: ws.ownerName || ws.owner || '',
      icon: ws.icon || '📁',
      iconColor: ws.iconColor || 'bg-gray-100',
      testCaseCount: ws.testCaseCount || 0,
      moduleCount: ws.moduleCount || 0,
      memberCount: ws.memberCount || 0,
      passRate: ws.passRate || 0,
      status: (ws.status as 'running' | 'failed' | 'not-run') || 'not-run',
      lastRun: ws.lastRun || '从未运行',
      projectId: ws.projectId,
    };
  },

  /**
   * 复制空间
   */
  copySpace: async (id: string): Promise<E2ESpace> => {
    const ws = await http.post<WorkflowWorkspaceDTO>(`/workflow/workspace/copy/${id}`);
    return {
      id: ws.workspaceId,
      name: ws.workspaceName,
      description: ws.description || '',
      responsiblePerson: ws.ownerName || ws.owner || '',
      icon: ws.icon || '📁',
      iconColor: ws.iconColor || 'bg-gray-100',
      testCaseCount: ws.testCaseCount || 0,
      moduleCount: ws.moduleCount || 0,
      memberCount: ws.memberCount || 0,
      passRate: ws.passRate || 0,
      status: (ws.status as 'running' | 'failed' | 'not-run') || 'not-run',
      lastRun: ws.lastRun || '从未运行',
      projectId: ws.projectId,
    };
  },

  /**
   * 删除空间
   */
  deleteSpace: async (id: string): Promise<void> => {
    await http.get(`/workflow/workspace/delete/${id}`);
  },
};

