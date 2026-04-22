/**
 * LoadingOverlay 组件
 * 加载状态遮罩组件
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';

/**
 * LoadingOverlay 组件 Props
 */
export interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
}

/**
 * LoadingOverlay 组件
 */
export const LoadingOverlay = React.memo<LoadingOverlayProps>(function LoadingOverlay({
  loading,
  message = '指标数据加载中...',
}: LoadingOverlayProps) {
  if (!loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
      <div className="w-14 h-14 border-4 border-white border-t-blue-400 rounded-full animate-spin"></div>
      <span className="text-sm text-white tracking-wide">
        {message}
      </span>
    </div>
  );
});
