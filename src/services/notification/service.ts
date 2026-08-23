/**
 * 顶部消息通知 API（逻辑与 AegisOne 对齐）
 */
import { http } from '@/utils/request';
import { NOTIFICATION_URLS } from './constants';
import type { MessageRecord, MessageHistoryItem } from './types';

export const notificationService = {
  /** 获取未读消息数量（用于顶部角标）；与 AegisOne 一致用 path 传 projectId；接口失败时返回 0，不抛错 */
  getUnReadCount: (projectId: string): Promise<number> => {
    return http
      .get(NOTIFICATION_URLS.unRead(projectId))
      .then((res: any) => {
        if (typeof res === 'number') return res;
        return res?.data ?? res ?? 0;
      })
      .catch(() => 0);
  },

  /** 获取消息列表（弹层 Tab 用） */
  queryMessageList: (): Promise<MessageRecord[]> => {
    return http.post(NOTIFICATION_URLS.messageList).then((res: any) => {
      if (Array.isArray(res)) return res;
      return res?.data ?? res ?? [];
    });
  },

  /** 标为已读 */
  setMessageStatus: (data: { ids: number[] }): Promise<MessageRecord[]> => {
    return http.post(NOTIFICATION_URLS.messageRead, data).then((res: any) => {
      if (Array.isArray(res)) return res;
      return res?.data ?? res ?? [];
    });
  },

  /** 消息中心分页列表 */
  queryMessageHistoryList: (data: {
    current?: number;
    pageSize?: number;
    type?: string;
    status?: string;
    resourceType?: string;
    receiver?: string;
  }): Promise<{ total: number; data: MessageHistoryItem[] }> => {
    return http.post(NOTIFICATION_URLS.listPage, data).then((res: any) => {
      const list = res?.data ?? res?.list ?? [];
      const total = res?.total ?? res?.totalCount ?? (Array.isArray(list) ? list.length : 0);
      return { data: Array.isArray(list) ? list : [], total };
    });
  },

  /** 全部已读 */
  readAll: (resourceType?: string): Promise<number> => {
    return http.get(NOTIFICATION_URLS.readAll, { params: resourceType ? { resourceType } : undefined }).then((res: any) => res ?? 0);
  },

  /** 单条已读 */
  readOne: (id: number): Promise<number> => {
    return http.get(NOTIFICATION_URLS.readOne(id)).then((res: any) => res ?? 0);
  },

  /** 消息中心各模块未读数量（左侧分类角标） */
  queryMessageHistoryCount: (data: {
    resourceType?: string;
    status?: string;
    receiver?: string;
    type?: string;
    current?: number;
    pageSize?: number;
  }): Promise<{ id: string; name: string }[]> => {
    return http.post(NOTIFICATION_URLS.count, data).then((res: any) => {
      if (Array.isArray(res)) return res;
      return res?.data ?? res ?? [];
    });
  },
};
