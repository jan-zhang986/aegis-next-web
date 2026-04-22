/**
 * useSnapTestCharts - 图表相关状态
 */
import { useState } from 'react';
import { PIE_COLORS } from '../constants';

export function useSnapTestCharts() {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activityViewMode, setActivityViewMode] = useState<'app' | 'detail'>('app');
  return { activePieIndex, setActivePieIndex, activityViewMode, setActivityViewMode, PIE_COLORS };
}
