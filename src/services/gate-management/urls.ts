/**
 * 门禁管理 API 路径（后端 /metrics/requirement-quality/pipeline）
 */

const BASE = '/metrics/requirement-quality';

export const GATE_MANAGEMENT_URLS = {
  /** 流水线记录列表（分页 + 筛选） */
  PIPELINE_LIST: `${BASE}/pipeline/list`,
  /** 运维补全流水线记录 */
  PIPELINE_UPDATE: `${BASE}/pipeline/update`,
  /** 手动创建流水线记录 */
  PIPELINE_CREATE: `${BASE}/pipeline/create`,
};
