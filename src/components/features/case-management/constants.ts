/**
 * 用例管理 - 常量定义
 * 从 spotter-metersphere 迁移，与源项目保持一致
 */

// 评审结果：未评审/评审中/通过/不通过/重新提审（通过绿色、不通过红色）
export const REVIEW_STATUS_MAP: Record<string, { label: string; color: string }> = {
  UN_REVIEWED: { label: '未评审', color: 'bg-gray-100 text-gray-800' },
  UNDER_REVIEWED: { label: '评审中', color: 'bg-blue-100 text-blue-800' },
  PASS: { label: '通过', color: 'bg-green-100 text-green-700' },
  UN_PASS: { label: '不通过', color: 'bg-red-100 text-red-700' },
  RE_REVIEWED: { label: '重新提审', color: 'bg-orange-100 text-orange-800' },
};

// 执行结果：未执行/通过/失败/阻塞/跳过
export const EXECUTE_RESULT_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '未执行', color: 'bg-gray-100 text-gray-800' },
  SUCCESS: { label: '通过', color: 'bg-green-100 text-green-800' },
  ERROR: { label: '失败', color: 'bg-red-100 text-red-800' },
  BLOCKED: { label: '阻塞', color: 'bg-orange-100 text-orange-800' },
  SKIPPED: { label: '跳过', color: 'bg-yellow-100 text-yellow-800' },
};

// 评审状态：待开始/进行中/已完成
export const REVIEW_STATUS_LABEL_MAP: Record<string, string> = {
  PREPARED: '待开始',
  UNDERWAY: '进行中',
  COMPLETED: '已完成',
};

// 评审模式：与老端 caseReview locale 一致（单人评审/多人评审）
export const REVIEW_PASS_RULE_MAP: Record<string, string> = {
  SINGLE: '单人评审',
  MULTIPLE: '多人评审',
};

// 思维导图用例内容节点类型（与 spotter ms.minders 一致）
export const MINDER_CONTENT_TAGS = {
  precondition: '前置条件',
  stepDesc: '步骤描述',
  stepExpect: '预期结果',
  textDesc: '文本描述',
  remark: '备注',
} as const;

// 思维导图分页限制（与 metersphere-frontend 一致）
export const MINDER_MODULE_LIMIT = 50; // 每层最多展示 50 个模块，超出显示「更多模块」
export const MINDER_CASE_PAGE_SIZE = 100; // 用例分页每页 100 条
export const MINDER_MORE_MODULE_TEXT = '更多模块...';
export const MINDER_MORE_CASE_TEXT = '更多用例...';

// 用例等级：P0-P3
// - 列表/详情等：CaseLevelBadge 使用 circleClass + className（小空心圆 + 彩色字）
// - 思维导图节点：minderSolidClass（实心圆 + 白字）
export const CASE_LEVEL_MAP: Record<
  string,
  { label: string; className: string; circleClass: string; minderSolidClass: string }
> = {
  P0: {
    label: 'P0',
    className: 'text-red-600',
    circleClass: 'border-red-500',
    minderSolidClass: 'bg-red-500 text-white',
  },
  P1: {
    label: 'P1',
    className: 'text-orange-600',
    circleClass: 'border-orange-500',
    minderSolidClass: 'bg-orange-500 text-white',
  },
  P2: {
    label: 'P2',
    className: 'text-teal-700',
    circleClass: 'border-teal-600',
    minderSolidClass: 'bg-teal-600 text-white',
  },
  P3: {
    label: 'P3',
    className: 'text-gray-600',
    circleClass: 'border-gray-500',
    minderSolidClass: 'bg-slate-500 text-white',
  },
};
