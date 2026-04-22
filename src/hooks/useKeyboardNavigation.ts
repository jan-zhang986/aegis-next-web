/**
 * useKeyboardNavigation Hook
 * 提供键盘导航支持
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(event.shiftKey);
          }
          break;
      }
    },
    [enabled, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
}

/**
 * useFocusManagement Hook
 * 管理焦点状态
 */
export function useFocusManagement<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);

  const focus = useCallback(() => {
    elementRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    elementRef.current?.blur();
  }, []);

  const hasFocus = useCallback(() => {
    return document.activeElement === elementRef.current;
  }, []);

  return {
    elementRef,
    focus,
    blur,
    hasFocus,
  };
}

/**
 * useTrapFocus Hook
 * 在对话框或模态框中捕获焦点
 */
export function useTrapFocus(enabled: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // 自动聚焦第一个元素
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey as EventListener);

    return () => {
      container.removeEventListener('keydown', handleTabKey as EventListener);
    };
  }, [enabled]);

  return containerRef;
}

/**
 * useListNavigation Hook
 * 为列表提供键盘导航
 */
export function useListNavigation<T>(
  items: T[],
  onSelect?: (item: T, index: number) => void
) {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (items.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev < items.length - 1 ? prev + 1 : 0;
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : items.length - 1;
            return next;
          });
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < items.length && onSelect) {
            event.preventDefault();
            onSelect(items[selectedIndex], selectedIndex);
          }
          break;
        case 'Home':
          event.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setSelectedIndex(items.length - 1);
          break;
      }
    },
    [items, selectedIndex, onSelect]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
