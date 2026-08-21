/**
 * Space 服务
 * Space 是 Case 资产的业务边界；前端进入 Space 后才展示和维护 Case。
 */

import { http } from '@/utils/request';

/**
 * 后端 Space DTO 接口（用于 API 响应）
 */
interface SpaceDTO {
  spaceId: string;
  projectId: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
  defaultSpace?: boolean;
  metadata?: Record<string, any>;
  createUser?: string;
  updateUser?: string;
  createTime?: number;
  updateTime?: number;
  testCaseCount?: number;
  interfaceAssetCount?: number;
  httpAssetCount?: number;
  dubboAssetCount?: number;
  rocketMqAssetCount?: number;
  fileAssetCount?: number;
  moduleCount?: number;
  memberCount?: number;
  passRate?: number;
  lastRun?: string;
}

/**
 * 用例实现空间接口
 */
export interface CaseRealizationSpace {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  description?: string;
  responsiblePerson?: string;
  testCaseCount?: number;
  interfaceAssetCount?: number;
  httpAssetCount?: number;
  dubboAssetCount?: number;
  rocketMqAssetCount?: number;
  fileAssetCount?: number;
  moduleCount?: number;
  memberCount?: number;
  passRate?: number;
  status?: 'running' | 'failed' | 'not-run';
  lastRun?: string;
  projectId?: string;
  type?: string;
  defaultSpace?: boolean;
}

/**
 * 创建空间请求参数
 */
export interface CreateCaseRealizationSpaceRequest {
  name: string;
  description?: string;
  responsiblePerson?: string;
  icon?: string;
  iconColor?: string;
  projectId?: string;
  type?: string;
}

/**
 * 更新空间请求参数
 */
export interface UpdateCaseRealizationSpaceRequest {
  id: string;
  name?: string;
  description?: string;
  responsiblePerson?: string;
  icon?: string;
  iconColor?: string;
  type?: string;
}

function toCaseRealizationSpace(space: SpaceDTO): CaseRealizationSpace {
  const metadata = space.metadata || {};
  const statusText = String(space.status || '').toUpperCase();
  const status: CaseRealizationSpace['status'] =
    statusText === 'FAILED' ? 'failed' : statusText === 'RUNNING' ? 'running' : 'not-run';
  return {
    id: space.spaceId,
    name: space.name,
    description: space.description || '',
    responsiblePerson: metadata.responsiblePerson || space.updateUser || space.createUser || '',
    icon: metadata.icon || '📁',
    iconColor: metadata.iconColor || 'bg-gray-100',
    testCaseCount: space.testCaseCount || 0,
    interfaceAssetCount: space.interfaceAssetCount || 0,
    httpAssetCount: space.httpAssetCount || 0,
    dubboAssetCount: space.dubboAssetCount || 0,
    rocketMqAssetCount: space.rocketMqAssetCount || 0,
    fileAssetCount: space.fileAssetCount || 0,
    moduleCount: space.moduleCount || 0,
    memberCount: space.memberCount || 0,
    passRate: space.passRate || 0,
    status,
    lastRun: space.lastRun || '从未运行',
    projectId: space.projectId,
    type: space.type,
    defaultSpace: space.defaultSpace,
  };
}

function resolveSavedSpaceId(response: SpaceDTO | string, fallbackId?: string): string {
  if (typeof response === 'string') {
    return response;
  }
  return response?.spaceId || fallbackId || '';
}

export const e2eSpaceService = {
  /**
   * 获取空间列表
   */
  getSpaceList: async (params?: { projectId?: string; keyword?: string }): Promise<CaseRealizationSpace[]> => {
    if (!params?.projectId) {
      return Promise.resolve([]);
    }
    const response = await http.post<SpaceDTO[]>(`/space/list`, {
      projectId: params.projectId,
      keyword: params.keyword,
    });
    return (response || []).map(toCaseRealizationSpace);
  },

  /**
   * 获取空间详情
   */
  getSpaceDetail: async (id: string): Promise<CaseRealizationSpace> => {
    const space = await http.get<SpaceDTO>(`/space/${id}`);
    return toCaseRealizationSpace(space);
  },

  /**
   * 创建空间
   */
  createSpace: async (data: CreateCaseRealizationSpaceRequest): Promise<CaseRealizationSpace> => {
    if (!data.projectId) {
      throw new Error('项目ID不能为空');
    }
    const response = await http.post<SpaceDTO | string>('/space/save', {
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      type: data.type || 'BUSINESS',
      status: 'ACTIVE',
      metadata: {
        responsiblePerson: data.responsiblePerson,
        icon: data.icon,
        iconColor: data.iconColor,
      },
    });
    const spaceId = resolveSavedSpaceId(response);
    if (!spaceId) {
      throw new Error('Space保存后未返回ID');
    }
    return e2eSpaceService.getSpaceDetail(spaceId);
  },

  /**
   * 获取项目默认空间
   */
  getDefaultSpace: async (projectId: string): Promise<CaseRealizationSpace> => {
    const space = await http.get<SpaceDTO>('/space/default', { params: { projectId } });
    return toCaseRealizationSpace(space);
  },

  /**
   * 设置默认空间
   */
  setDefaultSpace: async (id: string): Promise<void> => {
    await http.post(`/space/${id}/set-default`);
  },

  /**
   * 更新空间
   */
  updateSpace: async (data: UpdateCaseRealizationSpaceRequest): Promise<CaseRealizationSpace> => {
    const current = await e2eSpaceService.getSpaceDetail(data.id);
    const response = await http.post<SpaceDTO | string>('/space/save', {
      spaceId: data.id,
      projectId: current.projectId,
      name: data.name ?? current.name,
      description: data.description ?? current.description,
      type: data.type || current.type || 'BUSINESS',
      status: 'ACTIVE',
      defaultSpace: current.defaultSpace,
      metadata: {
        responsiblePerson: data.responsiblePerson ?? current.responsiblePerson,
        icon: data.icon ?? current.icon,
        iconColor: data.iconColor ?? current.iconColor,
      },
    });
    const spaceId = resolveSavedSpaceId(response, data.id);
    if (!spaceId) {
      throw new Error('Space保存后未返回ID');
    }
    return e2eSpaceService.getSpaceDetail(spaceId);
  },

  /**
   * 复制空间
   */
  copySpace: async (id: string): Promise<CaseRealizationSpace> => {
    const source = await e2eSpaceService.getSpaceDetail(id);
    if (!source.projectId) {
      throw new Error('项目ID不能为空');
    }
    return e2eSpaceService.createSpace({
      name: `${source.name}_copy`,
      description: source.description,
      responsiblePerson: source.responsiblePerson,
      icon: source.icon,
      iconColor: source.iconColor,
      projectId: source.projectId,
      type: source.type,
    });
  },

  /**
   * 删除空间
   */
  deleteSpace: async (id: string): Promise<void> => {
    throw new Error(`Space 删除接口尚未开放：${id}`);
  },
};

/** @deprecated compatibility alias; prefer CaseRealizationSpace */
export type E2ESpace = CaseRealizationSpace;

/** @deprecated compatibility alias; prefer CreateCaseRealizationSpaceRequest */
export type CreateE2ESpaceRequest = CreateCaseRealizationSpaceRequest;

/** @deprecated compatibility alias; prefer UpdateCaseRealizationSpaceRequest */
export type UpdateE2ESpaceRequest = UpdateCaseRealizationSpaceRequest;
