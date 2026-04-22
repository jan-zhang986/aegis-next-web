/**
 * Log Service
 * 日志查询服务
 */

import { http } from '@/utils/request';
import { LOG_API } from './constants';
import {
  createNetworkError,
  toAppError,
} from '@/utils/errorHandler';
import type { LogQueryParams, LogQueryResult } from '@/types/log';

/**
 * 查询操作日志列表
 * @param params 查询参数
 * @returns 日志查询结果
 */
export const getLogList = async (params: LogQueryParams): Promise<LogQueryResult> => {
  try {
    // 格式化查询参数
    const formattedParams = formatQueryParams(params);
    
    const response = await http.post(LOG_API.LOG_LIST, formattedParams) as any;
    const list = response?.data?.list ?? response?.list ?? [];
    const total = response?.data?.total ?? response?.total ?? 0;

    return {
      list: Array.isArray(list) ? list : [],
      total: Number(total) || 0,
      pageSize: params.pageSize,
      current: params.current,
    };
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '查询操作日志失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 格式化查询参数
 * @param params 原始查询参数
 * @returns 格式化后的参数
 */
const DEFAULT_LOG_DAYS = 30;

function formatQueryParams(params: LogQueryParams): Record<string, any> {
  const now = Date.now();
  const defaultEnd = now;
  const defaultStart = now - DEFAULT_LOG_DAYS * 24 * 60 * 60 * 1000;
  // 后端要求 java.lang.Long（毫秒时间戳），不能为空
  const startTime = params.startTime != null ? params.startTime : defaultStart;
  const endTime = params.endTime != null ? params.endTime : defaultEnd;

  const formatted: Record<string, any> = {
    current: params.current,
    pageSize: params.pageSize,
    level: 'PROJECT',
    startTime,
    endTime,
  };
  if (params.projectId) {
    formatted.projectId = params.projectId;
    formatted.projectIds = [params.projectId];
  } else if (params.projectIds?.length) {
    formatted.projectIds = params.projectIds;
  }
  if (params.operUser) formatted.operUser = params.operUser;
  if (params.type) formatted.type = params.type;
  if (params.module) formatted.module = params.module;
  if (params.content) formatted.content = params.content;
  if (params.organizationIds?.length) formatted.organizationIds = params.organizationIds;
  if (params.sort && Object.keys(params.sort).length > 0) formatted.sort = params.sort;
  return formatted;
}

/**
 * 获取日志详情
 * @param logId 日志ID
 * @returns 日志详情
 */
export const getLogDetail = async (logId: string): Promise<any> => {
  try {
    return await http.get(`${LOG_API.LOG_DETAIL}/${logId}`);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '获取日志详情失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};
