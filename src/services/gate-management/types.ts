/**
 * 门禁管理 - 流水线记录类型
 */

/** 列表请求（分页 + 筛选） */
export interface PipelineRecordListRequest {
  current: number;
  pageSize: number;
  /** 需求ID，筛选该需求下关联的流水线 */
  storyId?: string;
  projectId?: string;
  repoName?: string;
  /** PENDING=待补全，SUCCESS/FAILED/ROLLED_BACK/HOTFIX，不传查全部 */
  deployResult?: string;
  deployTimeStart?: number;
  deployTimeEnd?: number;
}

/** 列表行（与后端 RequirementChangeStats 对齐；storyName/projectName 由后端填充供展示） */
export interface PipelineRecordListItem {
  id: string;
  storyId?: string | null;
  storyName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  repoName: string;
  endpointType: string;
  pipelineId: string;
  pipelineName?: string | null;
  /** 流水线详情链接（后端解析或用户填写） */
  pipelineUrl?: string | null;
  /** 其它信息（JSON 字符串，含 BUILD_NUMBER 等） */
  otherInfo?: string | null;
  env?: string | null;
  deployTime: number;
  locAdd?: number | null;
  locDelete?: number | null;
  locModify?: number | null;
  locValid?: number | null;
  deployResult: string;
  isRollback?: number | null;
  isHotfix?: number | null;
  deployer?: string | null;
  frontend?: string | null;
  backend?: string | null;
  remark?: string | null;
  createdAt?: number | null;
}

/** 分页响应 */
export interface Pager<T> {
  list: T;
  total: number;
  pageSize: number;
  current: number;
}

/** 运维补全请求（含可选 storyName/projectName 仅用于编辑弹窗回显） */
export interface PipelineRecordUpdateRequest {
  id: string;
  storyId?: string;
  storyName?: string;
  projectId?: string;
  projectName?: string;
  env?: string;
  deployResult?: string;
  isRollback?: number;
  isHotfix?: number;
  remark?: string;
  frontend?: string;
  backend?: string;
  /** 流水线详情链接（运维可补全或修正） */
  pipelineUrl?: string;
}

/** 手动创建云效流水线记录（用户填写后落库） */
export interface PipelineRecordCreateRequest {
  pipelineId: string;
  pipelineName?: string;
  repoName: string;
  endpointType: string;
  deployTime: number;
  deployer?: string;
  deployResult: string;
  /** 代码新增行数 */
  locAdd?: number;
  /** 代码删除行数 */
  locDelete?: number;
  storyId?: string;
  storyName?: string;
  projectId?: string;
  projectName?: string;
  env?: string;
  isRollback?: number;
  isHotfix?: number;
  remark?: string;
  frontend?: string;
  backend?: string;
  /** 流水线详情链接（选填，填写则落库） */
  pipelineUrl?: string;
}
