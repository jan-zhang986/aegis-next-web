/**
 * 图片预览弹窗
 * 支持缩放（滚轮、按钮）、拖拽平移、ESC/点击遮罩关闭
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImagePreviewProps {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

export function ImagePreview({ src, open, onOpenChange, className }: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = useCallback((delta: number) => {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, src, reset]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    zoom(e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: dragStart.current.posX + e.clientX - dragStart.current.x,
        y: dragStart.current.posY + e.clientY - dragStart.current.y,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === '+' || e.key === '=') zoom(SCALE_STEP);
      if (e.key === '-') zoom(-SCALE_STEP);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange, zoom]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85',
        isDragging && 'cursor-grabbing',
        className
      )}
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
      onWheel={handleWheel}
      style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* 工具栏 */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 text-white mb-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoom(-SCALE_STEP)}
          className="p-1.5 rounded hover:bg-white/20"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          onClick={() => zoom(SCALE_STEP)}
          className="p-1.5 rounded hover:bg-white/20"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="p-1.5 rounded hover:bg-white/20"
          title="重置"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span className="w-px h-4 bg-white/30 mx-1" />
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="p-1.5 rounded hover:bg-white/20"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 图片容器：缩放 + 平移，点击不关闭 */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-auto"
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="预览"
          draggable={false}
          className="max-w-[90vw] max-h-[70vh] object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* 关闭提示 */}
      <div className="text-white/50 text-xs py-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        滚轮缩放 · 拖拽平移 · +/− 放大缩小 · ESC 关闭
      </div>
    </div>
  );
}
