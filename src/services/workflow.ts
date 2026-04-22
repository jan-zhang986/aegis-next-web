/**
 * 工作流服务
 * 提供工作流的CRUD和执行功能
 */

import { http } from '@/utils/request';

export const workflowService = {
  /**
   * 获取工作流列表
   */
  getWorkflowList: async (params?: { 
    projectId: string;
    moduleId?: string;
    workspaceId?: string;
    keyword?: string;
    status?: string;
    current?: number;
    pageSize?: number;
  }) => {
    return http.post('/workflow/definition/page', params);
  },

  /**
   * 获取工作流详情
   */
  getWorkflowDetail: async (id: string) => {
    return http.get(`/workflow/definition/get/${id}`);
  },

  /**
   * 创建或更新工作流
   */
  saveWorkflow: async (data: {
    workflowId?: string;
    projectId: string;
    moduleId: string;
    name: string;
    description?: string;
    category?: string;
    type?: string;
    environmentId?: string;
    globalVars?: any;
    nodes: Array<{
      id: string;
      type: string;
      name: string;
      description?: string;
      config?: any;
      x: number;
      y: number;
      refMode?: 'NONE' | 'COPY' | 'REF_METADATA' | 'REF_WORKFLOW';
      refMetadataId?: string | null;
      refWorkflowId?: string | null;
    }>;
    connections: Array<{
      from: string;
      to: string;
      label?: string;
      color?: string;
    }>;
  }) => {
    return http.post('/workflow/definition/save', data);
  },

  /**
   * 执行工作流
   */
  executeWorkflow: async (id: string, params?: any) => {
    return http.post(`/workflow/run/execute`, { workflowId: id, ...params });
  },

  /**
   * 删除工作流
   */
  deleteWorkflow: async (id: string) => {
    return http.get(`/workflow/definition/delete/${id}`);
  },

  /**
   * 复制工作流
   * @returns 新工作流的ID
   */
  copyWorkflow: async (id: string): Promise<string> => {
    return http.post<string>(`/workflow/definition/copy/${id}`);
  },

  /**
   * 批量复制工作流到指定模块
   * @param workflowIds 工作流ID数组
   * @param targetModuleId 目标模块ID
   * @returns 新工作流的ID数组
   */
  batchCopyWorkflows: async (workflowIds: string[], targetModuleId: string): Promise<string[]> => {
    return http.post<string[]>('/workflow/definition/batch/copy', {
      workflowIds,
      targetModuleId,
    });
  },

  /**
   * 批量移动工作流到指定模块
   * @param workflowIds 工作流ID数组
   * @param targetModuleId 目标模块ID
   */
  batchMoveWorkflows: async (workflowIds: string[], targetModuleId: string): Promise<void> => {
    return http.post<void>('/workflow/definition/batch/move', {
      workflowIds,
      targetModuleId,
    });
  },

  /**
   * 获取工作流执行历史
   * 支持项目+个人维度隔离
   */
  getWorkflowHistory: async (workflowId: string, params?: {
    current?: number;
    pageSize?: number;
    projectId?: string; // 项目维度隔离
    triggerUser?: string; // 个人维度隔离
  }) => {
    return http.post('/workflow/run/page', {
      workflowId,
      ...params,
    });
  },

  /**
   * 获取环境配置列表（根据项目ID）
   */
  getEngineProfileList: async (projectId: string) => {
    const response = await http.post('/user/profile/page', {
      projectId,
      current: 1,
      pageSize: 100,
    });
    // 返回分页数据中的 records
    return response?.records || response || [];
  },

  /**
   * 获取环境配置详情（根据环境ID）
   */
  getEngineProfileDetail: async (environmentId: string) => {
    return http.get(`/user/profile/get/${environmentId}`);
  },

  /**
   * 调试工作流内单个节点（后端按 workflowId 查工作流后执行）
   */
  debugNode: async (workflowId: string, nodeId: string, nodeConfig: any, params?: any) => {
    return http.post('/workflow/run/debug/node', {
      workflowId,
      nodeId,
      nodeConfig,
      ...params,
    });
  },

  /**
   * 调试公共节点（无工作流上下文，后端按 projectId + nodeId + nodeConfig 直接执行，返回 runId 格式与 debugNode 一致）
   */
  debugPublicNode: async (
    projectId: string,
    nodeId: string,
    nodeConfig: any,
    params?: { userVariables?: Record<string, string>; nodeType?: string; nodeName?: string }
  ) => {
    return http.post('/workflow/run/debug/public-node', {
      projectId,
      nodeId,
      nodeConfig,
      ...params,
    });
  },

  /**
   * 执行工作流（运行测试，后端会组装数据并调用执行机）
   * @param workflowId 工作流ID
   * @param params 执行参数（后端会根据workflowId获取完整数据并组装）
   */
  runWorkflow: async (workflowId: string, params?: any) => {
    // 调用后端接口，后端会组装数据并调用执行机 http://192.168.29.107:8100/workflow/execute
    return http.post('/workflow/run/execute', {
      workflowId,
      ...params,
    });
  },

  /**
   * 获取工作流执行详情（包含步骤执行明细）
   * @param runId 运行ID
   */
  getRunDetail: async (runId: string) => {
    return http.get(`/workflow/run/get/${runId}`);
  },

  /**
   * 删除运行记录
   * @param runId 运行ID
   */
  deleteRun: async (runId: string) => {
    return http.post(`/workflow/run/delete/${runId}`);
  },

  /**
   * 根据运行ID和运行步骤ID获取执行日志
   * @param runId 运行ID
   * @param runStepId 运行步骤ID
   */
  getRunLogsByRunIdAndRunStepId: async (runId: string, runStepId: string) => {
    return http.get(`/workflow/run/log/run/${runId}/step/${runStepId}`);
  },

  /**
   * 保存公共节点（创建或更新）
   * @param data 节点数据
   */
  savePublicNode: async (data: {
    id?: string;
    projectId: string;
    name: string;
    description?: string;
    type: string;
    category: string;
    config: any;
  }) => {
    return http.post('/workflow/public-node/save', data);
  },

  /**
   * 获取公共节点列表（不分页）
   * @param projectId 项目ID
   * @param category 分类（可选）
   */
  getPublicNodeList: async (projectId: string, category?: string) => {
    return http.get('/workflow/public-node/list', {
      params: { projectId, category },
    });
  },

  /**
   * 分页查询公共节点列表
   * 支持单项目 projectId 或多项目 projectIds（多选时传 projectIds）
   */
  getPublicNodePage: async (params: {
    projectId?: string;
    projectIds?: string[];
    category?: string;
    keyword?: string;
    current?: number;
    pageSize?: number;
  }) => {
    const body =
      (params.projectIds?.length ?? 0) > 0
        ? {
            projectIds: params.projectIds,
            category: params.category,
            keyword: params.keyword,
            current: params.current,
            pageSize: params.pageSize,
          }
        : {
            projectId: params.projectId,
            category: params.category,
            keyword: params.keyword,
            current: params.current,
            pageSize: params.pageSize,
          };
    return http.post('/workflow/public-node/page', body);
  },

  /**
   * 删除公共节点
   * @param id 节点ID
   * @param projectId 项目ID
   */
  deletePublicNode: async (id: string, projectId: string) => {
    return http.get(`/workflow/public-node/delete/${id}`, {
      params: { projectId },
    });
  },
};
