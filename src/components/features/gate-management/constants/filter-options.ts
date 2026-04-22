/**
 * 门禁管理 - 筛选与表单枚举
 */

export const PAGE_SIZE = 20;

/** 列表筛选：发布结果 */
export const DEPLOY_RESULT_OPTIONS = [
  { id: '', name: '全部' },
  { id: 'PENDING', name: '待补全' },
  { id: 'SUCCESS', name: '成功' },
  { id: 'FAILED', name: '失败' },
  { id: 'ROLLED_BACK', name: '回滚' },
  { id: 'HOTFIX', name: '热修' },
] as const;

/** 补全弹窗：发布结果（仅成功/失败） */
export const DEPLOY_RESULT_EDIT_OPTIONS = [
  { id: 'SUCCESS', name: '成功' },
  { id: 'FAILED', name: '失败' },
] as const;

/** 是否回滚 / 是否热修 */
export const YES_NO_OPTIONS = [
  { id: 0, name: '否' },
  { id: 1, name: '是' },
] as const;

/** 流水线类型（手动创建仅前端/后端） */
export const ENDPOINT_TYPE_OPTIONS = [
  { id: 'FRONTEND', name: '前端' },
  { id: 'BACKEND', name: '后端' },
] as const;
