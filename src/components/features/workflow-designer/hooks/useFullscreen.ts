/**
 * useFullscreen Hook
 * 管理全屏功能相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseFullscreenParams {
  externalFullscreen?: boolean;
  externalToggleFullscreen?: () => void | Promise<void>;
}

interface UseFullscreenReturn {
  isFullscreen: boolean;
  internalFullscreenContainerRef: React.RefObject<HTMLDivElement>;
  internalHandleToggleFullscreen: () => Promise<void>;
}

/**
 * useFullscreen Hook
 * 管理全屏功能相关逻辑
 */
export function useFullscreen({
  externalFullscreen,
  externalToggleFullscreen,
}: UseFullscreenParams): UseFullscreenReturn {
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const internalFullscreenContainerRef = useRef<HTMLDivElement>(null);
  const isFullscreen = externalFullscreen !== undefined ? externalFullscreen : internalFullscreen;

  // 全屏功能（仅当使用内部状态时）
  const internalHandleToggleFullscreen = useCallback(async () => {
    const container = internalFullscreenContainerRef.current;
    if (!container) return;

    try {
      if (!internalFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
    }
  }, [internalFullscreen]);

  // 监听全屏状态变化（仅当使用内部状态时）
  useEffect(() => {
    if (externalFullscreen !== undefined) return; // 如果使用外部状态，不需要监听

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setInternalFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [externalFullscreen]);

  return {
    isFullscreen,
    internalFullscreenContainerRef,
    internalHandleToggleFullscreen,
  };
}
