/**
 * useRobotManagement Hook
 * 机器人管理自定义 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getRobotList,
  addRobot,
  updateRobot,
  deleteRobot,
  toggleRobot,
} from '@/services/message';
import { errorHandler, toAppError } from '@/utils/errorHandler';
import type {
  Robot,
  RobotAddParams,
  RobotEditParams,
} from '@/types/message';

export interface UseRobotManagementResult {
  robots: Robot[];
  loading: boolean;
  submitting: boolean;
  loadRobots: () => Promise<void>;
  createRobot: (data: RobotAddParams) => Promise<Robot>;
  editRobot: (data: RobotEditParams) => Promise<Robot>;
  removeRobot: (id: string) => Promise<void>;
  toggleRobotStatus: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRobotManagement(projectId: string): UseRobotManagementResult {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 加载机器人列表
  const loadRobots = useCallback(async () => {
    if (!projectId) {
      setRobots([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getRobotList(projectId);
      setRobots(data || []);
    } catch (error) {
      console.error('加载机器人列表失败:', error);
      errorHandler.handleError(toAppError(error));
      setRobots([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 创建机器人
  const createRobot = useCallback(async (data: RobotAddParams): Promise<Robot> => {
    try {
      setSubmitting(true);
      const robot = await addRobot(data);
      await loadRobots();
      return robot;
    } catch (error) {
      console.error('创建机器人失败:', error);
      errorHandler.handleError(toAppError(error));
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [loadRobots]);

  // 编辑机器人
  const editRobot = useCallback(async (data: RobotEditParams): Promise<Robot> => {
    try {
      setSubmitting(true);
      const robot = await updateRobot(data);
      await loadRobots();
      return robot;
    } catch (error) {
      console.error('更新机器人失败:', error);
      errorHandler.handleError(toAppError(error));
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [loadRobots]);

  // 删除机器人
  const removeRobot = useCallback(async (id: string): Promise<void> => {
    try {
      setSubmitting(true);
      await deleteRobot(id);
      await loadRobots();
    } catch (error) {
      console.error('删除机器人失败:', error);
      errorHandler.handleError(toAppError(error));
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [loadRobots]);

  // 切换机器人状态
  const toggleRobotStatus = useCallback(async (id: string): Promise<void> => {
    try {
      setSubmitting(true);
      await toggleRobot(id);
      await loadRobots();
    } catch (error) {
      console.error('切换机器人状态失败:', error);
      errorHandler.handleError(toAppError(error));
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [loadRobots]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await loadRobots();
  }, [loadRobots]);

  // 初始加载
  useEffect(() => {
    if (projectId) {
      loadRobots();
    }
  }, [projectId, loadRobots]);

  return {
    robots,
    loading,
    submitting,
    loadRobots,
    createRobot,
    editRobot,
    removeRobot,
    toggleRobotStatus,
    refresh,
  };
}
