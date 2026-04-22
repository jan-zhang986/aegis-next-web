/**
 * WorkflowCanvas 画布状态：zoom/pan、历史记录（撤销/重做）、工具模式、全屏
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowData } from '../../types';

export interface UseWorkflowCanvasOptions {
  workflow: WorkflowData;
  onChange: (workflow: WorkflowData) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  panOffset?: { x: number; y: number };
  onPanOffsetChange?: (offset: { x: number; y: number }) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

export function useWorkflowCanvas({
  workflow,
  onChange,
  zoom: externalZoom,
  onZoomChange,
  panOffset: externalPanOffset,
  onPanOffsetChange,
  isFullscreen: externalFullscreen,
  onToggleFullscreen: externalToggleFullscreen,
}: UseWorkflowCanvasOptions) {
  const [internalZoom, setInternalZoom] = useState(1);
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const setZoom = onZoomChange || setInternalZoom;
  const [internalPanOffset, setInternalPanOffset] = useState({ x: 0, y: 0 });
  const panOffset = externalPanOffset !== undefined ? externalPanOffset : internalPanOffset;
  const setPanOffset = onPanOffsetChange || setInternalPanOffset;
  const panOffsetRef = useRef(panOffset);
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [toolMode, setToolMode] = useState<'select' | 'pan'>('select');
  const [undoStack, setUndoStack] = useState<WorkflowData[]>([]);
  const [redoStack, setRedoStack] = useState<WorkflowData[]>([]);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const internalFullscreenContainerRef = useRef<HTMLDivElement>(null);
  const isFullscreen = externalFullscreen !== undefined ? externalFullscreen : internalFullscreen;

  const pushHistory = useCallback(() => {
    setUndoStack((prev) => [...prev, workflow]);
    setRedoStack([]);
  }, [workflow]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setRedoStack((r) => [...r, workflow]);
      onChange(previous);
      return prev.slice(0, -1);
    });
  }, [workflow, onChange]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      setUndoStack((u) => [...u, workflow]);
      onChange(next);
      return prev.slice(0, -1);
    });
  }, [workflow, onChange]);

  const handleZoom = useCallback(
    (delta: number) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
      setZoom(newZoom);
    },
    [zoom, setZoom]
  );

  const internalHandleToggleFullscreen = useCallback(async () => {
    const container = internalFullscreenContainerRef.current;
    if (!container) return;
    try {
      if (!internalFullscreen) {
        if (container.requestFullscreen) await container.requestFullscreen();
        else if ((container as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) await (container as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        else if ((container as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) await (container as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
        else if ((container as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) await (container as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) await (document as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        else if ((document as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) await (document as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
        else if ((document as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) await (document as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
      }
    } catch (error) {
      console.error('全屏操作失败:', error);
    }
  }, [internalFullscreen]);

  const handleToggleFullscreen = externalToggleFullscreen || internalHandleToggleFullscreen;

  return {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    panOffsetRef,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    toolMode,
    setToolMode,
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    handleUndo,
    handleRedo,
    pushHistory,
    handleZoom,
    isFullscreen,
    handleToggleFullscreen,
    internalFullscreenContainerRef,
    MIN_ZOOM,
    MAX_ZOOM,
  };
}
