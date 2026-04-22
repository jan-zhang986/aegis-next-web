/**
 * useWorkflowIntegration Hook
 * 工作流集成逻辑
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WorkflowDesignPageV2Ref } from '@/components/features/WorkflowDesignPageV2';
import type { TestCase } from '@/types/e2e-space';

interface UseWorkflowIntegrationParams {
  workflowDesignRef: React.RefObject<WorkflowDesignPageV2Ref>;
}

interface UseWorkflowIntegrationReturn {
  // 状态
  viewMode: 'canvas' | 'steps';
  setViewMode: (mode: 'canvas' | 'steps') => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  fullscreenContainerRef: React.RefObject<HTMLDivElement>;
  selectedTestCase: TestCase | null;
  setSelectedTestCase: (testCase: TestCase | null) => void;
  prevSelectedTestCaseRef: React.MutableRefObject<TestCase | null>;
  // 操作函数
  handleToggleFullscreen: () => Promise<void>;
}

/**
 * useWorkflowIntegration Hook
 * 管理工作流集成相关逻辑
 */
export function useWorkflowIntegration({
  workflowDesignRef,
}: UseWorkflowIntegrationParams): UseWorkflowIntegrationReturn {
  const [viewMode, setViewMode] = useState<'canvas' | 'steps'>('canvas');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const prevSelectedTestCaseRef = useRef<TestCase | null>(null);

  // 全屏功能
  const handleToggleFullscreen = useCallback(async () => {
    const container = fullscreenContainerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
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
  }, [isFullscreen]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
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
  }, []);

  // 当从工作流返回到用例列表时，刷新列表
  useEffect(() => {
    if (prevSelectedTestCaseRef.current !== null && selectedTestCase === null) {
      // 从工作流返回了，需要刷新用例列表
      // 这个逻辑会在主组件中处理
    }
    prevSelectedTestCaseRef.current = selectedTestCase;
  }, [selectedTestCase]);

  return {
    viewMode,
    setViewMode,
    isFullscreen,
    setIsFullscreen,
    fullscreenContainerRef,
    selectedTestCase,
    setSelectedTestCase,
    prevSelectedTestCaseRef,
    handleToggleFullscreen,
  };
}
