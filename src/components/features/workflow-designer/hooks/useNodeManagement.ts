/**
 * useNodeManagement Hook
 * 管理节点操作（添加、删除、复制、选择等）
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import { NodeType, NODE_META_REGISTRY } from '@/components/workflow';

// 生成唯一ID的工具函数
const generateId = () =>
  `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface UseNodeManagementParams {
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  viewMode?: 'canvas' | 'steps';
  getSortedNodes?: () => WorkflowNodeData[];
}

interface UseNodeManagementReturn {
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  clipboardNode: WorkflowNodeData | null;
  setClipboardNode: React.Dispatch<React.SetStateAction<WorkflowNodeData | null>>;
  activeDragId: string | null;
  setActiveDragId: React.Dispatch<React.SetStateAction<string | null>>;
  handleAddNode: (type: NodeType) => void;
  handleDeleteNode: (nodeId: string) => void;
  handleCopyNode: (nodeId: string) => void;
  handlePasteNode: () => void;
  handleSelectNode: (nodeId: string | null) => void;
}

/**
 * useNodeManagement Hook
 * 管理节点操作（添加、删除、复制、选择等）
 */
export function useNodeManagement({
  workflow,
  setWorkflow,
  viewMode = 'canvas',
  getSortedNodes,
}: UseNodeManagementParams): UseNodeManagementReturn {
  // 步骤模式下的节点选择状态
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // 剪贴板状态（用于复制粘贴）
  const [clipboardNode, setClipboardNode] = useState<WorkflowNodeData | null>(
    null
  );
  // 当前拖拽的节点ID（用于 DragOverlay）
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // 选择节点
  const handleSelectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
    },
    []
  );

  // 添加节点
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const meta = NODE_META_REGISTRY[type];

      // 计算新节点的位置：放在最底部
      const existingNodes = workflow.nodes;
      const maxY =
        existingNodes.length > 0
          ? Math.max(...existingNodes.map((n) => n.y)) + 200
          : 100;

      const newNode: WorkflowNodeData = {
        id: generateId(),
        type,
        name: meta.name,
        description: meta.description,
        config: meta.defaultConfig || {},
        x: 100 + Math.random() * 200,
        y: maxY,
      };

      setWorkflow((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));

      // 选中新创建的节点
      setSelectedNodeId(newNode.id);
    },
    [workflow.nodes, setWorkflow]
  );

  // 删除节点
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setWorkflow((prev) => {
        const newNodes = prev.nodes.filter((n) => n.id !== nodeId);
        const newConnections = prev.connections.filter(
          (c) => c.from !== nodeId && c.to !== nodeId
        );

        // 如果删除的是选中的节点，取消选中
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }

        return {
          ...prev,
          nodes: newNodes,
          connections: newConnections,
        };
      });
    },
    [selectedNodeId, setWorkflow]
  );

  // 复制节点到剪贴板
  const handleCopyNode = useCallback(
    (nodeId: string) => {
      const nodeToCopy = workflow.nodes.find((n) => n.id === nodeId);
      if (!nodeToCopy) return;

      // 保存到剪贴板（用于键盘快捷键粘贴）
      setClipboardNode(nodeToCopy);

      // 在步骤模式下，立即创建副本节点
      if (viewMode === 'steps' && getSortedNodes) {
        const sortedNodes = getSortedNodes();
        const sourceIndex = sortedNodes.findIndex((n) => n.id === nodeId);

        // 创建副本节点
        const newNode: WorkflowNodeData = {
          ...nodeToCopy,
          id: generateId(),
          name: `${nodeToCopy.name} (副本)`,
          x: nodeToCopy.x + 50,
          y: nodeToCopy.y + 50,
        };

        // 在源节点后面插入副本
        const newNodes = [...sortedNodes];
        newNodes.splice(sourceIndex + 1, 0, newNode);

        // 更新节点的 y 坐标以反映新顺序
        const updatedNodes = newNodes.map((node, index) => ({
          ...node,
          y: 100 + index * 200,
        }));

        setWorkflow((prev) => ({
          ...prev,
          nodes: updatedNodes,
        }));

        // 选中新创建的副本节点
        setSelectedNodeId(newNode.id);

        toast.success(`已复制节点"${nodeToCopy.name}"`, { duration: 2000 });
      }
    },
    [workflow.nodes, viewMode, getSortedNodes, setWorkflow]
  );

  // 粘贴节点
  const handlePasteNode = useCallback(() => {
    if (!clipboardNode) {
      return;
    }

    const newNode: WorkflowNodeData = {
      ...clipboardNode,
      id: generateId(),
      name: `${clipboardNode.name} (副本)`,
      x: clipboardNode.x + 50,
      y: clipboardNode.y + 50,
    };

    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNodeId(newNode.id);
  }, [clipboardNode, setWorkflow]);

  return {
    selectedNodeId,
    setSelectedNodeId,
    clipboardNode,
    setClipboardNode,
    activeDragId,
    setActiveDragId,
    handleAddNode,
    handleDeleteNode,
    handleCopyNode,
    handlePasteNode,
    handleSelectNode,
  };
}
