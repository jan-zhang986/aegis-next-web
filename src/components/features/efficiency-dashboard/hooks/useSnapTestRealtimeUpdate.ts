/**
 * SnapTest Realtime Update Hook
 * 管理snapTest实时数据更新逻辑
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useEffect } from 'react';
import type { SnapTestMetrics } from '@/types/efficiency';

interface UseSnapTestRealtimeUpdateParams {
  setSnapTestMetrics: React.Dispatch<React.SetStateAction<SnapTestMetrics>>;
}

/**
 * SnapTest Realtime Update Hook
 */
export function useSnapTestRealtimeUpdate({
  setSnapTestMetrics,
}: UseSnapTestRealtimeUpdateParams): void {
  // 实时数据更新（仅更新 snapTest 模拟数据，webTest 从接口获取）
  useEffect(() => {
    const timer = setInterval(() => {
      setSnapTestMetrics(prev => ({
        ...prev,
        mqUsageCount: prev.mqUsageCount + Math.floor(Math.random() * 10),
        userActivity: prev.userActivity + Math.floor(Math.random() * 5 - 2),
        automationBugDiscoveryRate: 44 + Math.random() * 2,
      }));
    }, 5000);

    return () => clearInterval(timer);
  }, [setSnapTestMetrics]);
}
