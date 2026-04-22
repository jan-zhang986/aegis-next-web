import { useState, useEffect, useCallback } from 'react';
import { http } from '@/utils/request';
import type { RecentUpdateRecord } from '../types';

export function useMainContentRecentUpdates(projectId: string, selectedTopMenu: string) {
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdateRecord[]>([]);
  const [loadingRecentUpdates, setLoadingRecentUpdates] = useState(false);

  const loadRecentUpdates = useCallback(async () => {
    if (!projectId) {
      setRecentUpdates([]);
      return;
    }

    try {
      setLoadingRecentUpdates(true);
      const data = await http.get('/analytics/recent', {
        params: {
          projectId,
          pageSize: 5,
          current: 1,
        },
      });
      
      const records = Array.isArray(data) ? data : (data?.records || data?.data || []);
      setRecentUpdates(records || []);
    } catch (error) {
      console.error('加载最近执行记录失败:', error);
      setRecentUpdates([]);
    } finally {
      setLoadingRecentUpdates(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedTopMenu === 'api') {
      loadRecentUpdates();
    }
  }, [projectId, selectedTopMenu, loadRecentUpdates]);

  return {
    recentUpdates,
    loadingRecentUpdates,
    loadRecentUpdates,
  };
}
