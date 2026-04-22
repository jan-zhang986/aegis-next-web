/**
 * Drawer Resize Hook
 * 管理抽屉宽度调整逻辑
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useEffect } from 'react';

interface UseDrawerResizeReturn {
  isResizing: boolean;
  handleResizeStart: (e: React.MouseEvent) => void;
  setDrawerWidth: (width: number) => void;
}

interface UseDrawerResizeParams {
  caseListModalHook: {
    setDrawerWidth: (width: number) => void;
  };
  planListModalHook: {
    setDrawerWidth: (width: number) => void;
  };
}

/**
 * Drawer Resize Hook
 */
export function useDrawerResize({
  caseListModalHook,
  planListModalHook,
}: UseDrawerResizeParams): UseDrawerResizeReturn {
  const [isResizing, setIsResizing] = useState(false);

  // 处理抽屉宽度调整（两个modal共享）
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      // 限制宽度在 30% 到 95% 之间
      const clampedWidth = Math.max(30, Math.min(95, newWidth));
      // 同时更新两个modal的宽度
      caseListModalHook.setDrawerWidth(clampedWidth);
      planListModalHook.setDrawerWidth(clampedWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, caseListModalHook, planListModalHook]);

  return {
    isResizing,
    handleResizeStart,
    setDrawerWidth: (width: number) => {
      caseListModalHook.setDrawerWidth(width);
      planListModalHook.setDrawerWidth(width);
    },
  };
}
