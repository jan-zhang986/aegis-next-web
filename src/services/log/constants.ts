/**
 * Log Service Constants
 * 项目日志与 MeterSphere 对齐：/project/log/list
 */

export const LOG_API = {
  /** 项目级操作日志列表（POST，与 MeterSphere GetProjectLogListUrl 一致） */
  LOG_LIST: '/project/log/list',
  LOG_DETAIL: '/project/log/get',
} as const;
