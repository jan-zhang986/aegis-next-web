/**
 * useMinderShortcuts - 思维导图键盘快捷键 hook
 * 参考 aegis-next-web/components/pure/ms-minder-editor/hooks/useShortCut.ts
 * 
 * 快捷键：
 * - M: 添加同级模块
 * - C: 添加同级用例
 * - Shift+M: 添加子模块
 * - Shift+C: 添加子用例
 * - Tab/Enter: 添加同级节点
 * - Delete/Backspace: 删除节点
 * - Ctrl/Cmd+C: 复制
 * - Ctrl/Cmd+X: 剪切
 * - Ctrl/Cmd+V: 粘贴
 * - Ctrl/Cmd+Z: 撤销
 * - Ctrl/Cmd+S: 保存
 * - Space/E: 展开/收起
 * - F2: 编辑节点文本
 */

import { useEffect, useCallback, useRef } from 'react';
import { MINDER_TAGS, type MinderTreeNode } from './useMinderOperations';

interface ShortcutHandlers {
  onAddSiblingModule?: () => void;
  onAddSiblingCase?: () => void;
  onAddChildModule?: () => void;
  onAddChildCase?: () => void;
  onAddSiblingNode?: () => void;
  onAddChildNode?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onToggleExpand?: () => void;
  onEditText?: () => void;
  onEscape?: () => void;
  onViewDetail?: () => void;
  onPriorityChange?: (priority: number) => void;
}

interface UseMinderShortcutsOptions {
  enabled?: boolean;
  isEditing?: boolean;
  selectedNode?: MinderTreeNode | null;
  handlers: ShortcutHandlers;
}

/**
 * 思维导图键盘快捷键 hook
 */
export function useMinderShortcuts(options: UseMinderShortcutsOptions) {
  const { enabled = true, isEditing = false, selectedNode, handlers } = options;
  const handlersRef = useRef(handlers);
  
  // 更新 handlers ref
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  /**
   * 检查是否是 Mac 系统
   */
  const isMac = useCallback(() => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }, []);

  /**
   * 检查是否按下了修饰键（Ctrl/Cmd）
   */
  const isModKey = useCallback((e: KeyboardEvent) => {
    return isMac() ? e.metaKey : e.ctrlKey;
  }, [isMac]);

  /**
   * 检查选中节点是否是模块节点
   */
  const isModuleNode = useCallback((node?: MinderTreeNode | null) => {
    if (!node) return false;
    return node.isModule || node.data?.resource?.includes(MINDER_TAGS.module);
  }, []);

  /**
   * 检查选中节点是否是用例节点
   */
  const isCaseNode = useCallback((node?: MinderTreeNode | null) => {
    if (!node) return false;
    return node.isCase || node.data?.resource?.includes(MINDER_TAGS.case);
  }, []);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 如果未启用或正在编辑，跳过大部分快捷键
    if (!enabled) return;
    
    // 在输入框内时，只处理特定快捷键
    const target = e.target as HTMLElement;
    const isInInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

    // 编辑模式下只响应 Escape 和 Enter
    if (isEditing || isInInput) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.onEscape?.();
      }
      return;
    }

    const modKey = isModKey(e);
    const key = e.key.toLowerCase();

    // Ctrl/Cmd 组合键
    if (modKey) {
      switch (key) {
        case 'c':
          e.preventDefault();
          handlersRef.current.onCopy?.();
          return;
        case 'x':
          e.preventDefault();
          handlersRef.current.onCut?.();
          return;
        case 'v':
          e.preventDefault();
          handlersRef.current.onPaste?.();
          return;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handlersRef.current.onRedo?.();
          } else {
            handlersRef.current.onUndo?.();
          }
          return;
        case 's':
          e.preventDefault();
          handlersRef.current.onSave?.();
          return;
      }
    }

    // 没有选中节点时，不响应节点操作快捷键
    if (!selectedNode) return;

    // Shift 组合键
    if (e.shiftKey && !modKey) {
      switch (key) {
        case 'm':
          e.preventDefault();
          handlersRef.current.onAddChildModule?.();
          return;
        case 'c':
          e.preventDefault();
          handlersRef.current.onAddChildCase?.();
          return;
      }
    }

    // 单键快捷键
    switch (key) {
      case 'm':
        if (!modKey && !e.shiftKey) {
          e.preventDefault();
          handlersRef.current.onAddSiblingModule?.();
        }
        return;
      case 'c':
        if (!modKey && !e.shiftKey) {
          e.preventDefault();
          handlersRef.current.onAddSiblingCase?.();
        }
        return;
      case 'tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: 添加子节点
          handlersRef.current.onAddChildNode?.();
        } else {
          // Tab: 添加同级节点
          handlersRef.current.onAddSiblingNode?.();
        }
        return;
      case 'enter':
        e.preventDefault();
        handlersRef.current.onAddSiblingNode?.();
        return;
      case 'delete':
      case 'backspace':
        e.preventDefault();
        handlersRef.current.onDelete?.();
        return;
      case ' ':
      case 'e':
        e.preventDefault();
        handlersRef.current.onToggleExpand?.();
        return;
      case 'f2':
        e.preventDefault();
        handlersRef.current.onEditText?.();
        return;
      case 'escape':
        e.preventDefault();
        handlersRef.current.onEscape?.();
        return;
      // 数字键设置优先级
      case '1':
      case '2':
      case '3':
      case '4':
        if (!modKey && isCaseNode(selectedNode)) {
          e.preventDefault();
          handlersRef.current.onPriorityChange?.(parseInt(key));
        }
        return;
    }
  }, [enabled, isEditing, selectedNode, isModKey, isCaseNode]);

  // 绑定键盘事件
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    isModuleNode,
    isCaseNode,
  };
}

export default useMinderShortcuts;
