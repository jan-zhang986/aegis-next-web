/**
 * Robot Management Service
 * 机器人管理服务
 */

import { http } from '@/utils/request';
import { MESSAGE_API } from './constants';
import {
  createNetworkError,
  toAppError,
} from '@/utils/errorHandler';
import type {
  Robot,
  RobotAddParams,
  RobotEditParams,
} from '@/types/message';

/**
 * 获取机器人列表
 * @param projectId 项目ID
 * @returns 机器人列表
 */
export const getRobotList = async (projectId: string): Promise<Robot[]> => {
  try {
    return await http.get(`${MESSAGE_API.ROBOT_LIST}/${projectId}`);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '获取机器人列表失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 创建机器人
 * @param data 机器人数据
 * @returns 创建的机器人
 */
export const addRobot = async (data: RobotAddParams): Promise<Robot> => {
  try {
    return await http.post(MESSAGE_API.ROBOT_ADD, data);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '创建机器人失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 更新机器人
 * @param data 机器人数据
 * @returns 更新后的机器人
 */
export const updateRobot = async (data: RobotEditParams): Promise<Robot> => {
  try {
    return await http.post(MESSAGE_API.ROBOT_UPDATE, data);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '更新机器人失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 删除机器人
 * @param id 机器人ID
 */
export const deleteRobot = async (id: string): Promise<void> => {
  try {
    return await http.get(`${MESSAGE_API.ROBOT_DELETE}/${id}`);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '删除机器人失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 切换机器人启用状态
 * @param id 机器人ID
 */
export const toggleRobot = async (id: string): Promise<void> => {
  try {
    return await http.get(`${MESSAGE_API.ROBOT_TOGGLE}/${id}`);
  } catch (error: any) {
    if (error.response) {
      throw createNetworkError(
        error.response.data?.message || '切换机器人状态失败',
        error.response.status,
        error.response.status >= 500
      );
    }
    throw toAppError(error);
  }
};

/**
 * 启用机器人
 * @param id 机器人ID
 */
export const enableRobot = async (id: string): Promise<void> => {
  return toggleRobot(id);
};

/**
 * 禁用机器人
 * @param id 机器人ID
 */
export const disableRobot = async (id: string): Promise<void> => {
  return toggleRobot(id);
};
