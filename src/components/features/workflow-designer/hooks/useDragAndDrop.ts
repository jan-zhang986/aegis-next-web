/**
 * useDragAndDrop Hook
 * 管理拖拽排序相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useCallback, useEffect } from 'react';
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { WorkflowData, WorkflowNodeData, NodeType } from '@/components/workflow';

interface UseDragAndDropParams {
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  viewMode: 'canvas' | 'steps';
  getSortedNodes: () => WorkflowNodeData[];
  originalNodesOrderRef: React.MutableRefObject<Map<string, number>>;
  activeDragId: string | null;
  setActiveDragId: React.Dispatch<React.SetStateAction<string | null>>;
  handleAddNodeToCanvas?: (nodeType: NodeType, x: number, y: number) => void;
}

interface UseDragAndDropReturn {
  sensors: ReturnType<typeof useSensors>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragOver?: (event: DragOverEvent) => void;
}

// 全局变量用于跟踪拖拽状态
let isDraggingGlobal = false;
// 全局变量用于跟踪鼠标位置
let lastMouseX = 0;
let lastMouseY = 0;

// 监听全局鼠标移动事件来跟踪鼠标位置
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
}

/**
 * useDragAndDrop Hook
 * 管理拖拽排序相关逻辑
 */
export function useDragAndDrop({
  workflow,
  setWorkflow,
  viewMode,
  getSortedNodes,
  originalNodesOrderRef,
  activeDragId,
  setActiveDragId,
  handleAddNodeToCanvas,
}: UseDragAndDropParams): UseDragAndDropReturn {
  // 拖拽传感器配置 - 设置激活延迟，避免与点击事件冲突
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动8像素后才激活拖拽，避免与点击冲突
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingGlobal = true;
    setActiveDragId(event.active.id as string);
  }, [setActiveDragId]);

  // 当节点顺序改变时，更新原始顺序引用
  useEffect(() => {
    if (viewMode === 'steps') {
      originalNodesOrderRef.current = new Map(
        workflow.nodes.map((node, index) => [node.id, index])
      );
    }
  }, [viewMode, workflow.nodes.length, originalNodesOrderRef]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      // 重置拖拽状态
      isDraggingGlobal = false;
      setActiveDragId(null);
      return;
    }

    // 检查是否是从左侧拖拽节点类型到画布
    const activeData = active.data.current;
    if (activeData?.type === 'node-type' && over.id === 'canvas-drop-zone') {
      // 从左侧拖拽节点类型到画布
      const nodeType = activeData.nodeType as NodeType;
      const canvasElement = document.getElementById('canvas-drop-zone');
      if (canvasElement && handleAddNodeToCanvas) {
        // 使用全局跟踪的鼠标位置（拖拽结束时的位置）
        handleAddNodeToCanvas(nodeType, lastMouseX, lastMouseY);
      }
      
      // 重置拖拽状态
      isDraggingGlobal = false;
      setActiveDragId(null);
      return;
    }

    if (active.id === over.id) {
      // 重置拖拽状态
      isDraggingGlobal = false;
      setActiveDragId(null);
      return;
    }

    // 在步骤模式下，直接使用当前显示的节点顺序（getSortedNodes）来更新
    // 这样可以保持与显示的顺序一致
    const sortedNodes = getSortedNodes();
    const oldIndex = sortedNodes.findIndex((node) => node.id === active.id);
    const newIndex = sortedNodes.findIndex((node) => node.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      // 重置拖拽状态
      isDraggingGlobal = false;
      setActiveDragId(null);
      return;
    }

    // 使用 arrayMove 重新排序
    const reorderedNodes = arrayMove(sortedNodes, oldIndex, newIndex);

    // 在步骤模式下，需要交换节点的坐标
    // 使用originalNodesOrderRef来记录拖拽前的顺序
    const originalOrder = originalNodesOrderRef.current;
    const nodesWithSwappedCoords = reorderedNodes.map((node, currentIndex) => {
      const originalIndex = originalOrder.get(node.id);
      
      // 如果节点位置发生了变化
      if (originalIndex !== undefined && originalIndex !== currentIndex) {
        // 找到现在在节点原来位置的节点（即与它交换位置的节点）
        const swappedNode = reorderedNodes.find((n) => {
          const nOriginalIndex = originalOrder.get(n.id);
          return nOriginalIndex === currentIndex && n.id !== node.id;
        });
        
        if (swappedNode) {
          // 交换坐标
          return {
            ...node,
            x: swappedNode.x,
            y: swappedNode.y,
          };
        }
      }
      
      // 位置没有变化，保持原有坐标
      return node;
    });

    // 更新工作流，使用新的节点顺序和坐标
    setWorkflow(prev => ({
      ...prev,
      nodes: nodesWithSwappedCoords,
    }));

    // 重置拖拽状态
    isDraggingGlobal = false;
    setActiveDragId(null);
  }, [getSortedNodes, originalNodesOrderRef, setWorkflow, setActiveDragId, handleAddNodeToCanvas]);

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
  };
}
