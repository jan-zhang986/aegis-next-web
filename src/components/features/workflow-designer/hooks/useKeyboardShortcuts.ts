/**
 * useKeyboardShortcuts Hook
 * 管理键盘快捷键处理逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useEffect } from 'react';

interface UseKeyboardShortcutsParams {
  selectedNodeId: string | null;
  handleDeleteNode: (nodeId: string) => void;
  handleCopyNode: (nodeId: string) => void;
  handlePasteNode: () => void;
}

/**
 * useKeyboardShortcuts Hook
 * 管理键盘快捷键处理逻辑
 */
export function useKeyboardShortcuts({
  selectedNodeId,
  handleDeleteNode,
  handleCopyNode,
  handlePasteNode,
}: UseKeyboardShortcutsParams): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框、文本域等可编辑元素上，不处理快捷键
      const target = e.target as HTMLElement;
      
      // 检查是否在 Monaco Editor 中（Monaco Editor 使用特定的类名和属性）
      const isInMonacoEditor = target.closest('.monaco-editor') !== null ||
                               target.closest('.monaco-mouse-cursor-text') !== null;
      
      // 检查是否在外部组件中（Drawer、Dialog 等）- 这些组件需要原生复制粘贴功能
      const isInDrawer = target.closest('[data-slot="drawer-content"]') !== null ||
                         target.closest('[data-slot="drawer"]') !== null;
      const isInDialog = target.closest('[data-slot="dialog-content"]') !== null ||
                        target.closest('[data-slot="dialog"]') !== null;
      
      // 如果在外部组件中，不处理快捷键（允许原生复制粘贴）
      if (isInDrawer || isInDialog) {
        return;
      }
      
      // 如果焦点在输入框、文本域、Monaco Editor 中，不处理快捷键
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        isInMonacoEditor
      ) {
        return;
      }

      // 删除节点：Delete 或 Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
        return;
      }

      // 复制节点：Ctrl+C 或 Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodeId) {
        e.preventDefault();
        handleCopyNode(selectedNodeId);
        return;
      }

      // 粘贴节点：Ctrl+V 或 Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteNode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, handleDeleteNode, handleCopyNode, handlePasteNode]);
}
