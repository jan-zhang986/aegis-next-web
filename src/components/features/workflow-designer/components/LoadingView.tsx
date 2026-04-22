/**
 * LoadingView Component
 * 加载状态视图组件
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';

export const LoadingView: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
};
