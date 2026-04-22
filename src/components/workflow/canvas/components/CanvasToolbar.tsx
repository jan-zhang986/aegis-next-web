/**
 * WorkflowCanvas 工具栏：工具模式、缩放、撤销/重做、布局、全屏
 */

import { ZoomIn, ZoomOut, Maximize2, Minimize2, Grid3X3, MousePointer, Hand, Undo2, Redo2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CanvasToolbarProps {
  toolMode: 'select' | 'pan';
  onToolModeChange: (mode: 'select' | 'pan') => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onRefresh: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function CanvasToolbar({
  toolMode,
  onToolModeChange,
  zoom,
  onZoomIn,
  onZoomOut,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAutoLayout,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
}: CanvasToolbarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
      <Button variant={toolMode === 'select' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => onToolModeChange('select')} title="拖拽节点">
        <Hand className="w-4 h-4" />
      </Button>
      <Button variant={toolMode === 'pan' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => onToolModeChange('pan')} title="拖动画布">
        <MousePointer className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200" />
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onZoomOut} title="缩小">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-xs text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onZoomIn} title="放大">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200" />
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
        <Redo2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200" />
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAutoLayout} title="优化布局">
        <Grid3X3 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRefresh} title="刷新画布">
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏'}>
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>
    </div>
  );
}
