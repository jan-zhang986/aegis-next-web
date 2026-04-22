/**
 * DubboTestPage 请求/响应区域拖拽与初始高度
 */

import { useState, useEffect, useRef } from 'react';

export function useDubboResize() {
  const [requestHeight, setRequestHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (requestHeight !== null) return;
    const t = setTimeout(() => {
      const el = resizeRef.current;
      const container = el?.closest('.flex-1.flex.flex-col.min-h-0');
      if (container) {
        const h = (container as HTMLElement).getBoundingClientRect().height;
        if (h > 0) {
          const minRes = 200;
          const initial = Math.max(h * 0.85, h - minRes);
          if (initial > 0 && initial < h) setRequestHeight(initial);
        }
      } else {
        const wh = window.innerHeight - 60;
        if (wh > 0) setRequestHeight(Math.max(wh * 0.85, wh - 200));
      }
    }, 100);
    return () => clearTimeout(t);
  }, [requestHeight]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging || !resizeRef.current) return;
      const container = resizeRef.current.closest('.flex-1.flex.flex-col.min-h-0');
      if (!container) return;
      const y = e.clientY - (container as HTMLElement).getBoundingClientRect().top;
      if (y > 0) setRequestHeight(y);
    };
    const onUp = () => {
      setIsDragging(false);
      // 确保在鼠标抬起时立即恢复 userSelect
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    if (isDragging) {
      // 保存原始的 userSelect 值
      const originalUserSelect = document.body.style.userSelect;
      const originalCursor = document.body.style.cursor;
      
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        // 恢复原始值
        document.body.style.cursor = originalCursor;
        document.body.style.userSelect = originalUserSelect;
      };
    }

    return () => {
      // 如果 isDragging 为 false，确保清理事件监听器（防止内存泄漏）
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  return { requestHeight, setRequestHeight, isDragging, setIsDragging, resizeRef };
}
