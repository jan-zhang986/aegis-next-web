/**
 * useCanvasOperations Hook
 * 管理画布操作（缩放、平移、视图模式等）
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCanvasOperationsParams {
  viewMode?: 'canvas' | 'steps';
  onViewModeChange?: (viewMode: 'canvas' | 'steps') => void;
}

interface UseCanvasOperationsReturn {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  canvasStateRef: React.MutableRefObject<{ zoom: number; panOffset: { x: number; y: number } }>;
  leftPanelTab: 'public-nodes' | 'nodes' | 'metadata' | 'history';
  setLeftPanelTab: React.Dispatch<React.SetStateAction<'public-nodes' | 'nodes' | 'metadata' | 'history'>>;
  internalViewMode: 'grid' | 'list';
  setInternalViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  handleResetPan: () => void;
  saveCanvasState: () => void;
  restoreCanvasState: () => void;
}

/**
 * useCanvasOperations Hook
 * 管理画布操作（缩放、平移、视图模式等）
 */
export function useCanvasOperations({
  viewMode = 'canvas',
  onViewModeChange,
}: UseCanvasOperationsParams = {}): UseCanvasOperationsReturn {
  // 使用 useRef 保存画布的缩放和位置状态，切换视图模式时保持不变
  const canvasStateRef = useRef<{ zoom: number; panOffset: { x: number; y: number } }>({
    zoom: 1,
    panOffset: { x: 0, y: 0 },
  });

  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [leftPanelTab, setLeftPanelTab] = useState<
    'public-nodes' | 'nodes' | 'metadata' | 'history'
  >('nodes');
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('list');

  // 同步 zoom 和 panOffset 到 ref，以便在切换视图模式时保持
  useEffect(() => {
    canvasStateRef.current.zoom = zoom;
  }, [zoom]);

  useEffect(() => {
    canvasStateRef.current.panOffset = panOffset;
  }, [panOffset]);

  // 保存画布状态
  const saveCanvasState = useCallback(() => {
    canvasStateRef.current = {
      zoom,
      panOffset,
    };
  }, [zoom, panOffset]);

  // 恢复画布状态
  const restoreCanvasState = useCallback(() => {
    const savedZoom = canvasStateRef.current.zoom;
    const savedPanOffset = canvasStateRef.current.panOffset;

    if (savedZoom !== 1) {
      setZoom(savedZoom);
    }
    if (savedPanOffset.x !== 0 || savedPanOffset.y !== 0) {
      setPanOffset(savedPanOffset);
    }
  }, []);

  // 缩放操作
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 2)); // 最大缩放 2x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5)); // 最小缩放 0.5x
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // 平移操作
  const handleResetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    canvasStateRef,
    leftPanelTab,
    setLeftPanelTab,
    internalViewMode,
    setInternalViewMode,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleResetPan,
    saveCanvasState,
    restoreCanvasState,
  };
}
