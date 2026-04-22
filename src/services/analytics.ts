/**
 * 数据分析服务
 * 提供埋点和数据分析相关的 API
 */

import { http } from '@/utils/request';

/**
 * 最近更新记录
 */
export interface RecentUpdateRecord {
  id: number;
  logId: string;
  bizType: number;
  moduleType: 'HTTP' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'TCP' | 'WEBSOCKET' | 'SCRIPT' | 'FILE';
  relatedId: string;
  action: string;
  userEmail: string;
  executionTimeMs: number;
  extraData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const analyticsService = {
  /**
   * 获取最近更新记录
   */
  getRecentUpdates: async (): Promise<RecentUpdateRecord[]> => {
    return http.get<RecentUpdateRecord[]>('/analytics/recent');
  },
};

