/**
 * WorkflowCanvas 右侧面板宽度调整
 */

import { useState, useCallback } from 'react';

export function useWorkflowCanvasResize(initialWidth = 800) {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartWidth, setResizeStartWidth] = useState(initialWidth);
  const [resizeStartX, setResizeStartX] = useState(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStartWidth(panelWidth);
      setResizeStartX(e.clientX);
    },
    [panelWidth]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = resizeStartX - e.clientX;
      const newWidth = Math.max(300, Math.min(1200, resizeStartWidth + deltaX));
      setPanelWidth(newWidth);
    },
    [isResizing, resizeStartWidth, resizeStartX]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  return {
    panelWidth,
    setPanelWidth,
    isResizing,
    setIsResizing,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
}
