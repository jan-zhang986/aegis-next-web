/**
 * 缺陷状态枚举（与产品定义的 9 种状态 + 待处理 一致）
 * 首次创建/列表默认筛选为「待确认」
 */

export const BUG_STATUS_PENDING = '待处理';
export const BUG_STATUS_PENDING_CONFIRM = '待确认';
export const BUG_STATUS_IN_PROGRESS = '处理中';
export const BUG_STATUS_RESOLVED = '已解决';
export const BUG_STATUS_REOPENED = '再次打开';
export const BUG_STATUS_CLOSED = '已关闭';
export const BUG_STATUS_WONT_FIX = '暂不修复';
export const BUG_STATUS_REJECTED = '拒绝(驳回)';
export const BUG_STATUS_VERIFIED = '已验证';
export const BUG_STATUS_TERMINATED = '已终止';

/** 创建缺陷/列表默认筛选的默认状态 */
export const BUG_STATUS_DEFAULT = BUG_STATUS_PENDING_CONFIRM;

export const BUG_STATUS_OPTIONS = [
    { value: BUG_STATUS_PENDING, label: BUG_STATUS_PENDING },
    { value: BUG_STATUS_PENDING_CONFIRM, label: BUG_STATUS_PENDING_CONFIRM },
    { value: BUG_STATUS_IN_PROGRESS, label: BUG_STATUS_IN_PROGRESS },
    { value: BUG_STATUS_RESOLVED, label: BUG_STATUS_RESOLVED },
    { value: BUG_STATUS_REOPENED, label: BUG_STATUS_REOPENED },
    { value: BUG_STATUS_CLOSED, label: BUG_STATUS_CLOSED },
    { value: BUG_STATUS_WONT_FIX, label: BUG_STATUS_WONT_FIX },
    { value: BUG_STATUS_REJECTED, label: BUG_STATUS_REJECTED },
    { value: BUG_STATUS_VERIFIED, label: BUG_STATUS_VERIFIED },
    { value: BUG_STATUS_TERMINATED, label: BUG_STATUS_TERMINATED },
] as const;

export type BugStatusValue = (typeof BUG_STATUS_OPTIONS)[number]['value'];
