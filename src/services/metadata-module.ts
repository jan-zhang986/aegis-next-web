/**
 * 元数据模块服务
 * 提供模块的CRUD功能，支持E2E工作空间的模块管理
 */

import { http } from '@/utils/request';

export interface MetadataModuleTreeNode {
  id: string;
  name: string;
  parentId?: string;
  children?: MetadataModuleTreeNode[];
}

/**
 * 创建模块请求
 */
export interface CreateModuleRequest {
  projectId: string;
  name: string;
  parentId?: string;
  moduleType?: string;
  typeId?: string; // 当 moduleType='WORKFLOW' 时，存储 workspaceId
}

/**
 * 更新模块请求
 */
export interface UpdateModuleRequest {
  id: string;
  name: string;
}

export const metadataModuleService = {
  /**
   * 获取模块树
   * @param projectId 项目ID
   * @param typeId 类型ID（可选，当 moduleType='WORKFLOW' 时传入 workspaceId）
   * @param moduleType 模块类型（可选，如 'WORKFLOW'）
   */
  getModuleTree: async (
    projectId: string,
    typeId?: string,
    moduleType?: string
  ): Promise<MetadataModuleTreeNode[]> => {
    const params = new URLSearchParams();
    if (typeId) {
      params.append('typeId', typeId);
    }
    if (moduleType) {
      params.append('moduleType', moduleType);
    }
    const query = params.toString();
    const url = `/metadata/module/tree/${projectId}${query ? '?' + query : ''}`;
    return http.get<MetadataModuleTreeNode[]>(url);
  },

  /**
   * 创建模块
   */
  createModule: async (data: CreateModuleRequest): Promise<string> => {
    return http.post<string>('/metadata/module/add', data);
  },

  /**
   * 更新模块
   */
  updateModule: async (data: UpdateModuleRequest): Promise<void> => {
    return http.post<void>('/metadata/module/update', data);
  },

  /**
   * 删除模块
   */
  deleteModule: async (id: string): Promise<void> => {
    return http.get<void>(`/metadata/module/delete/${id}`);
  },
};

