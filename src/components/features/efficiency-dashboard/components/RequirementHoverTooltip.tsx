/**
 * RequirementHoverTooltip 组件
 * 需求名称Hover提示框组件
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';

/**
 * RequirementHoverTooltip 组件 Props
 */
export interface RequirementHoverTooltipProps {
  hoveredRequirement: {
    reqId: string;
    reqName: string;
    x: number;
    y: number;
    chartType: 'reuse' | 'workload';
  } | null;
}

/**
 * RequirementHoverTooltip 组件
 */
export const RequirementHoverTooltip = React.memo<RequirementHoverTooltipProps>(function RequirementHoverTooltip({
  hoveredRequirement,
}: RequirementHoverTooltipProps) {
  if (!hoveredRequirement) {
    return null;
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${hoveredRequirement.x}px`,
        top: `${hoveredRequirement.y - 40}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-xl max-w-xs">
        <div className="text-white text-sm font-medium break-words">
          {hoveredRequirement.reqName}
        </div>
      </div>
    </div>
  );
});
