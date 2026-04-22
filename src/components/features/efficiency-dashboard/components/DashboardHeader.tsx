/**
 * DashboardHeader 组件
 * 顶部标题栏组件
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';

/**
 * DashboardHeader 组件 Props
 */
export interface DashboardHeaderProps {
  // 无额外props，仅显示标题和时间
}

/**
 * DashboardHeader 组件
 */
export const DashboardHeader = React.memo<DashboardHeaderProps>(function DashboardHeader({}: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 px-8 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">效能数据大屏</h1>
          <p className="text-gray-400 text-sm mt-1">实时监控系统测试效能指标</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-gray-400 text-xs">当前时间</div>
            <div className="text-lg font-mono text-white">
              {new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">实时更新</span>
          </div>
        </div>
      </div>
    </div>
  );
});
