/**
 * Message Configuration Service
 * 消息配置服务
 */

import { http } from '@/utils/request';
import { MESSAGE_API } from './constants';
import {
  createNetworkError,
  createDataError,
  toAppError,
} from '@/utils/errorHandler';
import type {
  MessageItem,
  SaveMessageConfigParams,
  Receiver,
} from '@/types/message';

/**
 * 获取消息配置列表
 * @param projectId 项目ID
 * @returns 消息配置列表
 */
export const getMessageList = async (projectId: string): Promise<MessageItem[]> => {
  try {
    return await http.get(`${MESSAGE_API.MESSAGE_LIST}/${projectId}`);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '获取消息配置列表失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 保存消息配置
 * @param data 消息配置数据
 */
export const saveMessageConfig = async (data: SaveMessageConfigParams): Promise<void> => {
  try {
    return await http.post(MESSAGE_API.MESSAGE_SAVE, data);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '保存消息配置失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 获取消息接收人列表
 * @param params 查询参数
 * @returns 接收人列表
 */
export const getMessageUserList = async (params: {
  projectId: string;
  keyword?: string;
}): Promise<Receiver[]> => {
  try {
    return await http.get(`${MESSAGE_API.MESSAGE_USER_LIST}/${params.projectId}`, {
      params: { keyword: params.keyword },
    });
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '获取接收人列表失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 更新消息配置启用状态
 * @param data 配置数据
 */
export const updateMessageConfigStatus = async (
  data: SaveMessageConfigParams & { enable: boolean }
): Promise<void> => {
  return saveMessageConfig(data);
};
