/**
 * TestPage 请求/响应区域拖拽调整高度、ResizeObserver 滚动容器
 */

import { useState, useEffect, useRef } from 'react';

export interface UseTestPageResizeOptions {
  activeTab: string;
}

export function useTestPageResize({ activeTab }: UseTestPageResizeOptions) {
  const [requestHeight, setRequestHeight] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const requestScrollRef = useRef<HTMLDivElement>(null);
  const requestSectionRef = useRef<HTMLDivElement>(null);

  // 组件卸载时确保清理拖拽状态
  useEffect(() => {
    return () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [isDragging]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !resizeRef.current) return;
      const container = resizeRef.current.closest('.flex-1.flex.flex-col.min-h-0');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newRequestHeight = e.clientY - containerRect.top;
      if (newRequestHeight > 0) setRequestHeight(newRequestHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // 确保在鼠标抬起时立即恢复 userSelect
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      // 保存原始的 userSelect 值
      const originalUserSelect = document.body.style.userSelect;
      const originalCursor = document.body.style.cursor;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // 恢复原始值
        document.body.style.cursor = originalCursor;
        document.body.style.userSelect = originalUserSelect;
      };
    }

    return () => {
      // 如果 isDragging 为 false，确保清理事件监听器（防止内存泄漏）
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!requestSectionRef.current || !requestScrollRef.current) return;
    const section = requestSectionRef.current;
    const scrollContainer = requestScrollRef.current;

    const update = () => {
      if (!section || !scrollContainer) return;
      const h = section.clientHeight;
      if (h > 0) {
        const available = h - 32;
        const minH = window.innerHeight / 2;
        scrollContainer.style.maxHeight = `${available}px`;
        scrollContainer.style.minHeight = `${minH}px`;
        scrollContainer.style.overflowY = 'auto';
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(section);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (requestSectionRef.current && requestScrollRef.current) {
            const section = requestSectionRef.current!;
            const scrollContainer = requestScrollRef.current!;
            const h = section.clientHeight;
            if (h > 0) {
              scrollContainer.style.maxHeight = `${h - 32}px`;
              scrollContainer.style.minHeight = `${window.innerHeight / 2}px`;
              scrollContainer.style.overflowY = 'auto';
            }
          }
        });
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  return {
    requestHeight,
    setRequestHeight,
    isDragging,
    setIsDragging,
    resizeRef,
    requestScrollRef,
    requestSectionRef,
  };
}
