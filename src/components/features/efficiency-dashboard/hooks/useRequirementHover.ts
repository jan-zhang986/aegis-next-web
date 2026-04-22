/**
 * Requirement Hover Hook
 * 管理需求名称hover状态
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState } from 'react';

export interface HoveredRequirement {
  reqId: string;
  reqName: string;
  x: number;
  y: number;
  chartType: 'reuse' | 'workload';
}

interface UseRequirementHoverReturn {
  hoveredRequirement: HoveredRequirement | null;
  setHoveredRequirement: React.Dispatch<React.SetStateAction<HoveredRequirement | null>>;
}

/**
 * Requirement Hover Hook
 */
export function useRequirementHover(): UseRequirementHoverReturn {
  const [hoveredRequirement, setHoveredRequirement] = useState<HoveredRequirement | null>(null);

  return {
    hoveredRequirement,
    setHoveredRequirement,
  };
}
