/**
 * Message Template Service
 * 消息模板服务
 */

import { http } from '@/utils/request';
import { MESSAGE_API } from './constants';
import {
  createNetworkError,
  toAppError,
} from '@/utils/errorHandler';
import type {
  MessageTemplateDetail,
  MessageFieldsResponse,
  SaveMessageConfigParams,
} from '@/types/message';

/**
 * 获取消息模板详情
 * @param params 查询参数
 * @returns 消息模板详情
 */
export const getMessageDetail = async (params: {
  projectId: string;
  taskType: string;
  event: string;
  robotId: string;
}): Promise<MessageTemplateDetail> => {
  try {
    return await http.get(MESSAGE_API.MESSAGE_DETAIL, { params });
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '获取消息模板详情失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 获取消息字段列表
 * @param projectId 项目ID
 * @param taskType 任务类型
 * @returns 消息字段列表
 */
export const getMessageFields = async (
  projectId: string,
  taskType: string
): Promise<MessageFieldsResponse> => {
  try {
    return await http.get(`${MESSAGE_API.MESSAGE_FIELDS}/${projectId}`, {
      params: { taskType },
    });
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '获取消息字段列表失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 更新消息模板
 * @param data 模板数据
 */
export const updateMessageTemplate = async (
  data: SaveMessageConfigParams
): Promise<void> => {
  try {
    return await http.post(MESSAGE_API.MESSAGE_SAVE, data);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '更新消息模板失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 重置消息模板为默认
 * @param data 模板数据（使用默认模板）
 */
export const resetMessageTemplate = async (
  data: Omit<SaveMessageConfigParams, 'subject' | 'template'> & {
    useDefaultSubject: true;
    useDefaultTemplate: true;
  }
): Promise<void> => {
  try {
    return await http.post(MESSAGE_API.MESSAGE_SAVE, data);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '重置消息模板失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};
