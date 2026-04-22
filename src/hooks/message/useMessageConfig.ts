/**
 * useMessageConfig Hook
 * 消息配置管理自定义 Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMessageList,
  saveMessageConfig,
  getMessageUserList,
} from '@/services/message';
import { errorHandler, toAppError } from '@/utils/errorHandler';
import type {
  MessageItem,
  MessageTaskDetail,
  Receiver,
  SaveMessageConfigParams,
} from '@/types/message';

export interface UseMessageConfigResult {
  messageList: MessageItem[];
  filteredMessageList: MessageItem[];
  receivers: Receiver[];
  loading: boolean;
  saving: boolean;
  selectedRobotId: string | null;
  setSelectedRobotId: (robotId: string | null) => void;
  loadMessageList: () => Promise<void>;
  loadReceivers: (keyword?: string) => Promise<void>;
  updateMessageConfig: (params: SaveMessageConfigParams) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMessageConfig(projectId: string): UseMessageConfigResult {
  const [messageList, setMessageList] = useState<MessageItem[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);

  // 加载消息配置列表
  const loadMessageList = useCallback(async () => {
    if (!projectId) {
      setMessageList([]);
      return;
    }
    try {
      setLoading(true);
      const data = await getMessageList(projectId);
      setMessageList(data || []);
    } catch {
      setMessageList([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 加载接收人列表
  const loadReceivers = useCallback(async (keyword?: string) => {
    if (!projectId) {
      setReceivers([]);
      return;
    }
    try {
      const data = await getMessageUserList({ projectId, keyword });
      setReceivers(data || []);
    } catch {
      setReceivers([]);
    }
  }, [projectId]);

  // 更新消息配置
  const updateMessageConfig = useCallback(async (params: SaveMessageConfigParams) => {
    try {
      setSaving(true);
      await saveMessageConfig(params);
      await loadMessageList();
    } catch (error) {
      console.error('更新消息配置失败:', error);
      errorHandler.handleError(toAppError(error));
      throw error;
    } finally {
      setSaving(false);
    }
  }, [loadMessageList]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await Promise.all([
      loadMessageList(),
      loadReceivers(),
    ]);
  }, [loadMessageList, loadReceivers]);

  // 根据选中的机器人ID筛选消息列表
  const filteredMessageList = useMemo(() => {
    if (!selectedRobotId) {
      return messageList;
    }

    return messageList.map(item => ({
      ...item,
      messageTaskTypeDTOList: item.messageTaskTypeDTOList.map(taskType => ({
        ...taskType,
        messageTaskDetailDTOList: taskType.messageTaskDetailDTOList.filter(detail => {
          // 检查该事件是否配置了选中的机器人
          return Object.keys(detail.projectRobotConfigMap).some(
            robotId => robotId === selectedRobotId
          );
        }),
      })).filter(taskType => taskType.messageTaskDetailDTOList.length > 0),
    })).filter(item => item.messageTaskTypeDTOList.length > 0);
  }, [messageList, selectedRobotId]);

  // 初始加载
  useEffect(() => {
    if (projectId) {
      loadMessageList();
      loadReceivers();
    }
  }, [projectId, loadMessageList, loadReceivers]);

  return {
    messageList,
    filteredMessageList,
    receivers,
    loading,
    saving,
    selectedRobotId,
    setSelectedRobotId,
    loadMessageList,
    loadReceivers,
    updateMessageConfig,
    refresh,
  };
}
