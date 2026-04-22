/**
 * 需求质量看板 - 筛选维度 Mock 选项
 */

/** 项目选项（Mock） */
export const PROJECT_OPTIONS = [
  { value: 'all', label: '全部项目' },
  { value: 'sample', label: '示例项目' },
  { value: 'project-a', label: '项目 A' },
  { value: 'project-b', label: '项目 B' },
  { value: 'project-c', label: '项目 C' },
] as const;

/** 需求列表选项（Mock，可后续接需求列表接口） */
export const REQUIREMENT_LIST_OPTIONS = [
  { value: 'all', label: '全部需求' },
] as const;

/** 状态筛选项（不含未开始、已归档） */
export const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '执行中', label: '执行中' },
  { value: '已完成', label: '已完成' },
] as const;
