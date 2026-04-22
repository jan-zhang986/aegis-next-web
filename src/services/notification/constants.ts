/**
 * 通知相关 API 路径（与 MeterSphere 对齐，便于后端对接）
 * MeterSphere: GET /notification/un-read/{projectId}（path 传参，见 api/modules/message getMessageUnReadCount）
 */
export const NOTIFICATION_URLS = {
  /** 未读数：GET /notification/un-read/{projectId} */
  unRead: (projectId: string) => `/notification/un-read/${projectId}`,
  /** 消息列表（弹层） */
  messageList: '/api/message/list',
  /** 标为已读 */
  messageRead: '/api/message/read',
  /** 消息中心分页列表 */
  listPage: '/notification/list/all/page',
  /** 消息中心未读数量统计 */
  count: '/notification/count',
  /** 全部已读 */
  readAll: '/notification/read/all',
  /** 单条已读 */
  readOne: (id: number) => `/notification/read/${id}`,
} as const;
