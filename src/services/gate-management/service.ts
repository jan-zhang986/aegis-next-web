/**
 * 门禁管理 - API 服务（流水线记录列表与运维补全）
 */

import { http } from '@/utils/request';
import { GATE_MANAGEMENT_URLS } from './urls';
import type {
  PipelineRecordListRequest,
  PipelineRecordListItem,
  Pager,
  PipelineRecordUpdateRequest,
  PipelineRecordCreateRequest,
} from './types';

export const gateManagementService = {
  /** 流水线记录列表（分页，支持待补全/项目/服务/时间筛选） */
  list: async (
    request: PipelineRecordListRequest
  ): Promise<Pager<PipelineRecordListItem[]>> => {
    const res = await http.post<Pager<PipelineRecordListItem[]>>(
      GATE_MANAGEMENT_URLS.PIPELINE_LIST,
      request
    );
    return res as Pager<PipelineRecordListItem[]>;
  },

  /** 运维补全：更新流水线记录（需求ID、项目、环境、发布结果等） */
  update: async (request: PipelineRecordUpdateRequest): Promise<void> => {
    await http.post<void>(GATE_MANAGEMENT_URLS.PIPELINE_UPDATE, request);
  },

  /** 手动创建流水线记录（云效流水线信息手动填写落库） */
  create: async (request: PipelineRecordCreateRequest): Promise<void> => {
    await http.post<void>(GATE_MANAGEMENT_URLS.PIPELINE_CREATE, request);
  },
};
