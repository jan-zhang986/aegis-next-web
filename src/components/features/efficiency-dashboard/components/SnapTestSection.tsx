/**
 * SnapTestSection 组件
 * SnapTest 区域包装组件
 * 从 EfficiencyDashboard.tsx 提取（行1827-1828）
 */

import React from 'react';
import { SnapTestModule } from '../../SnapTestModule';
import type { TimeRangeType, CustomDateRange } from '@/types/efficiency';

/**
 * SnapTestSection 组件 Props
 */
export interface SnapTestSectionProps {
  // 时间范围
  timeRange: TimeRangeType;
  // 自定义日期范围
  customDateRange: CustomDateRange;
}

/**
 * SnapTestSection 组件
 */
export const SnapTestSection = React.memo<SnapTestSectionProps>(function SnapTestSection({
  timeRange,
  customDateRange,
}: SnapTestSectionProps) {
  return (
    <>
      {/* ========== snaptest 模块 ========== */}
      <SnapTestModule timeRange={timeRange} customDateRange={customDateRange} />
    </>
  );
});
