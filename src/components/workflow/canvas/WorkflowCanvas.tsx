/**
 * 工作流画布组件
 * 基于 FlowGram 实现节点拖拽、连线等功能
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/utils/cn';
import {
  type WorkflowNodeData,
  type WorkflowData,
  type NodeConfig,
  NodeType,
  NODE_META_REGISTRY,
  type LoopConfig,
} from '../types';
import { NodeRenderer } from '../nodes/NodeRenderer';
import { NodeFormPanel } from '../panels/NodeFormPanel';
import { AddNodeDialog } from '../components/AddNodeDialog';
import { useWorkflowCanvas, useWorkflowNodeOperations, useWorkflowConnection, useWorkflowCanvasResize, calculateBezierPath } from './hooks';
import { CanvasToolbar } from './components';
import { toast } from 'sonner';

interface WorkflowCanvasProps {
  workflow: WorkflowData;
  onChange: (workflow: WorkflowData) => void;
  onSave?: () => void;
  onNodeSave?: (nodeId: string) => void;
  readOnly?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  panOffset?: { x: number; y: number };
  onPanOffsetChange?: (offset: { x: number; y: number }) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onDebugNode?: (nodeId: string) => void;
  onRunWorkflow?: () => void;
  onSaveToPublic?: (nodeId: string) => void;
}

const GRID_SIZE = 20;
/** 拖拽连线时，鼠标靠近目标节点输入点在此距离内自动连上（画布坐标） */
const CONNECT_SNAP_RADIUS = 56;

/**
 * CanvasDropZone 组件
 * 画布的可拖放区域
 */
const CanvasDropZone: React.FC<{
  canvasRef: React.RefObject<HTMLDivElement>;
  className?: string;
  children: React.ReactNode;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ canvasRef, className, children, ...props }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        if (canvasRef) {
          (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }
      }}
      id="canvas-drop-zone"
      className={cn(className, isOver && 'bg-blue-50/30')}
      {...props}
    >
      {children}
    </div>
  );
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onChange,
  onSave,
  onNodeSave,
  readOnly = false,
  zoom: externalZoom,
  onZoomChange,
  panOffset: externalPanOffset,
  onPanOffsetChange,
  isFullscreen: externalFullscreen,
  onToggleFullscreen: externalToggleFullscreen,
  onDebugNode,
  onRunWorkflow,
  onSaveToPublic,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const canvas = useWorkflowCanvas({
    workflow,
    onChange,
    zoom: externalZoom,
    onZoomChange,
    panOffset: externalPanOffset,
    onPanOffsetChange,
    isFullscreen: externalFullscreen,
    onToggleFullscreen: externalToggleFullscreen,
  });

  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  const nodeOps = useWorkflowNodeOperations({
    workflow,
    onChange,
    pushHistory: canvas.pushHistory,
    readOnly,
    onNodeSave,
  });

  const connection = useWorkflowConnection({
    workflow,
    onChange,
    pushHistory: canvas.pushHistory,
    readOnly,
    selectedConnectionId,
    setSelectedConnectionId,
  });

  const resize = useWorkflowCanvasResize();

  // 同步历史记录操作时的选中状态清除
  const handleUndo = useCallback(() => {
    canvas.handleUndo();
    nodeOps.setSelectedNodeId(null);
    nodeOps.setEditingNodeId(null);
    setSelectedConnectionId(null);
  }, [canvas, nodeOps]);

  const handleRedo = useCallback(() => {
    canvas.handleRedo();
    nodeOps.setSelectedNodeId(null);
    nodeOps.setEditingNodeId(null);
    setSelectedConnectionId(null);
  }, [canvas, nodeOps]);

  // 同步删除节点时的选中状态清除
  const deleteNode = useCallback(
    (nodeId: string) => {
      nodeOps.deleteNode(nodeId);
      if (selectedConnectionId) {
        const conn = workflow.connections.find((c) => c.from === nodeId || c.to === nodeId);
        if (conn) setSelectedConnectionId(null);
      }
    },
    [nodeOps, selectedConnectionId, workflow.connections]
  );

  // 处理节点拖拽开始
  const handleNodeDragStart = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (readOnly || canvas.toolMode !== 'select') return;
      e.stopPropagation();
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      nodeOps.setDraggingNodeId(nodeId);
      nodeOps.setDragStart({ x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y });
    },
    [workflow.nodes, readOnly, canvas.toolMode, nodeOps]
  );

  // 处理鼠标移动
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (canvas.isPanning) {
        const dx = e.clientX - canvas.panStart.x;
        const dy = e.clientY - canvas.panStart.y;
        canvas.setPanOffset({ x: canvas.panOffset.x + dx, y: canvas.panOffset.y + dy });
        canvas.setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }
      if (nodeOps.draggingNodeId) {
        const dx = (e.clientX - nodeOps.dragStart.x) / canvas.zoom;
        const dy = (e.clientY - nodeOps.dragStart.y) / canvas.zoom;
        const newX = Math.round((nodeOps.dragStart.nodeX + dx) / GRID_SIZE) * GRID_SIZE;
        const newY = Math.round((nodeOps.dragStart.nodeY + dy) / GRID_SIZE) * GRID_SIZE;
        nodeOps.updateNode(nodeOps.draggingNodeId, { x: newX, y: newY });
      }
      if (connection.connectingFrom && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - canvas.panOffset.x) / canvas.zoom;
        const y = (e.clientY - rect.top - canvas.panOffset.y) / canvas.zoom;
        // 靠近某目标节点的输入点则自动连上
        for (const node of workflow.nodes) {
          if (node.type === NodeType.START || node.id === connection.connectingFrom) continue;
          const size = nodeOps.getNodeSize(node.id, node.type);
          const inputX = node.x + size.width / 2;
          const inputY = node.y;
          const dist = Math.hypot(x - inputX, y - inputY);
          if (dist <= CONNECT_SNAP_RADIUS) {
            connection.handleConnectionEnd(node.id);
            return;
          }
        }
        connection.setTempConnectionEnd({ x, y });
      }
    },
    [canvas, nodeOps, connection]
  );

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    canvas.setIsPanning(false);
    nodeOps.setDraggingNodeId(null);
    connection.setConnectingFrom(null);
    connection.setTempConnectionEnd(null);
    resize.setIsResizing(false);
  }, [canvas, nodeOps, connection, resize]);

  // 处理画布点击
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-content')) {
        nodeOps.setSelectedNodeId(null);
        nodeOps.setEditingNodeId(null);
        setSelectedConnectionId(null);
      }
    },
    [nodeOps]
  );

  // 处理画布拖拽开始
  const handleCanvasDragStart = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.workflow-node')) return;
      if (canvas.toolMode === 'pan' || canvas.toolMode === 'select' || e.button === 1) {
        canvas.setIsPanning(true);
        canvas.setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [canvas]
  );

  // 滚轮缩放和滚动
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        canvas.handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
      } else {
        e.preventDefault();
        const currentOffset = canvas.panOffsetRef.current;
        canvas.setPanOffset({
          x: currentOffset.x - e.deltaX,
          y: currentOffset.y - e.deltaY,
        });
      }
    };
    canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasEl.removeEventListener('wheel', handleWheel);
  }, [canvas]);

  // ResizeObserver 监听节点尺寸
  useEffect(() => {
    const observers = new Map<string, ResizeObserver>();
    const timeoutId = setTimeout(() => {
      const currentNodeIds = new Set(workflow.nodes.map((n) => n.id));
      nodeOps.nodeRefs.current.forEach((element, nodeId) => {
        if (!element || !currentNodeIds.has(nodeId)) return;
        if (!nodeOps.nodeSizes.has(nodeId)) {
          const rect = element.getBoundingClientRect();
          nodeOps.updateNodeSize(nodeId, rect.width, rect.height);
        }
        const observer = new ResizeObserver((entries) => {
          for (const entry of entries) {
            nodeOps.updateNodeSize(nodeId, entry.contentRect.width, entry.contentRect.height);
          }
        });
        observer.observe(element);
        observers.set(nodeId, observer);
      });
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      observers.forEach((o) => o.disconnect());
    };
  }, [workflow.nodes, nodeOps]);

  // 添加节点
  const handleAddNode = useCallback(
    (nodeType: NodeType, x?: number, y?: number) => {
      nodeOps.handleAddNode(nodeType, x, y, canvasRef, canvas.zoom, canvas.panOffset);
    },
    [nodeOps, canvas]
  );

  // 适应画布
  const handleFitView = useCallback(() => {
    if (workflow.nodes.length === 0) return;
    
    const xs = workflow.nodes.map(n => n.x);
    const ys = workflow.nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX + 400;
    const height = maxY - minY + 300;
    
    const canvasEl = canvasRef.current as any;
    if (!canvasEl) return;
    
    const canvasWidth = canvasEl.clientWidth;
    const canvasHeight = canvasEl.clientHeight;
    
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;
    const newZoom = Math.min(scaleX, scaleY, 1) * 0.8;
    
    canvasEl.setZoom(newZoom);
    canvasEl.setPanOffset({
      x: (canvasWidth - width * newZoom) / 2 - minX * newZoom + 100,
      y: (canvasHeight - height * newZoom) / 2 - minY * newZoom + 50,
    });
  }, [workflow.nodes, canvas]);

  // 刷新画布 - 强制重新渲染
  const [, forceUpdate] = useState(0);
  const handleRefresh = useCallback(() => {
    forceUpdate(n => n + 1);
  }, []);

  // 自动布局 - 优化节点布局
  const handleAutoLayout = useCallback(() => {
    if (workflow.nodes.length === 0) return;

    const nodes = [...workflow.nodes];
    const connections = workflow.connections || [];
    // 与默认节点尺寸保持一致
    const nodeWidth = 280;
    const nodeHeight = 180;
    // 放大节点间距，避免节点挤在一起
    const horizontalSpacing = 160; // 水平间距
    const verticalSpacing = 120; // 垂直间距
    const startX = 100;
    const startY = 100;

    // 构建节点的连接关系图
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const incomingEdges = new Map<string, string[]>(); // 节点ID -> 来源节点ID列表
    const outgoingEdges = new Map<string, string[]>(); // 节点ID -> 目标节点ID列表

    connections.forEach(conn => {
      if (!incomingEdges.has(conn.to)) {
        incomingEdges.set(conn.to, []);
      }
      incomingEdges.get(conn.to)!.push(conn.from);
      
      if (!outgoingEdges.has(conn.from)) {
        outgoingEdges.set(conn.from, []);
      }
      outgoingEdges.get(conn.from)!.push(conn.to);
    });

    // 找到起始节点（没有入边的节点）
    const startNodes = nodes.filter(node => !incomingEdges.has(node.id) || incomingEdges.get(node.id)!.length === 0);
    
    // 使用拓扑排序进行层次布局
    const layers: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();
    
    // 初始化入度
    nodes.forEach(node => {
      inDegree.set(node.id, incomingEdges.get(node.id)?.length || 0);
    });

    // BFS 分层
    let currentLayer = startNodes.map(n => n.id);
    while (currentLayer.length > 0) {
      layers.push([...currentLayer]);
      currentLayer.forEach(id => visited.add(id));
      
      const nextLayer: string[] = [];
      currentLayer.forEach(id => {
        const targets = outgoingEdges.get(id) || [];
        targets.forEach(targetId => {
          if (!visited.has(targetId)) {
            const currentDegree = inDegree.get(targetId) || 0;
            inDegree.set(targetId, currentDegree - 1);
            if (inDegree.get(targetId) === 0) {
              nextLayer.push(targetId);
            }
          }
        });
      });
      currentLayer = nextLayer;
    }

    // 处理没有连接的节点
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        if (layers.length === 0) {
          layers.push([]);
        }
        layers[0].push(node.id);
      }
    });

    // 计算每层的节点位置
    const positionedNodes = new Map<string, { x: number; y: number }>();
    
    layers.forEach((layer, layerIndex) => {
      const layerY = startY + layerIndex * (nodeHeight + verticalSpacing);
      const layerWidth = layer.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
      const layerStartX = startX + (layer.length > 1 ? 0 : 0);
      
      layer.forEach((nodeId, indexInLayer) => {
        const x = layerStartX + indexInLayer * (nodeWidth + horizontalSpacing);
        positionedNodes.set(nodeId, { x, y: layerY });
      });
    });

    // 更新节点位置
    const newNodes = nodes.map(node => {
      const position = positionedNodes.get(node.id);
      if (position) {
        return {
          ...node,
          x: position.x,
          y: position.y,
        };
      }
      return node;
    });

    onChange({
      ...workflow,
      nodes: newNodes,
    });

    // 布局完成后，自动适应视图
    setTimeout(() => {
      // 直接调用 handleFitView 的逻辑，避免依赖问题
      if (newNodes.length === 0) return;
      
      const xs = newNodes.map(n => n.x);
      const ys = newNodes.map(n => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const width = maxX - minX + 400;
      const height = maxY - minY + 300;
      
      const canvasEl = canvasRef.current as any;
      if (!canvasEl) return;
      
      const canvasWidth = canvasEl.clientWidth;
      const canvasHeight = canvasEl.clientHeight;
      
      const scaleX = canvasWidth / width;
      const scaleY = canvasHeight / height;
      const newZoom = Math.min(scaleX, scaleY, 1) * 0.8;
      
      canvasEl.setZoom(newZoom);
      canvasEl.setPanOffset({
        x: (canvasWidth - width * newZoom) / 2 - minX * newZoom + 100,
        y: (canvasHeight - height * newZoom) / 2 - minY * newZoom + 50,
      });
      // 给用户一个明显反馈
      toast.success('已自动优化画布布局');
    }, 100);
  }, [workflow, onChange, canvas]);

  // 键盘快捷键处理
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

      // 撤销 / 重做
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
        e.preventDefault();
        connection.deleteConnection(selectedConnectionId);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && nodeOps.selectedNodeId) {
        e.preventDefault();
        deleteNode(nodeOps.selectedNodeId);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && nodeOps.selectedNodeId) {
        e.preventDefault();
        nodeOps.copyNode(nodeOps.selectedNodeId);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        nodeOps.pasteNode();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodeOps, connection, selectedConnectionId, deleteNode, handleUndo, handleRedo]);

  // 全局鼠标事件监听（用于拖拽调整面板宽度）
  useEffect(() => {
    if (!resize.isResizing) return;
    const handleGlobalMouseMove = (e: MouseEvent) => resize.handleResizeMove(e);
    const handleGlobalMouseUp = () => resize.handleResizeEnd();
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [resize]);

  useEffect(() => {
    if (workflow.connections.length === 0) setSelectedConnectionId(null);
    if (workflow.nodes.length === 0) nodeOps.setSelectedNodeId(null);
  }, [workflow.connections.length, workflow.nodes.length, nodeOps]);

  return (
    <div
      ref={externalFullscreen === undefined ? canvas.internalFullscreenContainerRef : undefined}
      className={cn(
        'flex h-full w-full relative',
        externalFullscreen === undefined && canvas.isFullscreen && 'fixed inset-0 z-[9999] bg-gray-50 h-screen w-screen'
      )}
    >
      {/* 画布区域 */}
      <div className="bg-gray-50 relative w-full h-full">
        {/* 画布内容区域 - 包含工具栏、节点和底部操作栏 */}
        <div className="absolute inset-0 w-full h-full">
          <CanvasToolbar
            toolMode={canvas.toolMode}
            onToolModeChange={canvas.setToolMode}
            zoom={canvas.zoom}
            onZoomIn={() => canvas.handleZoom(0.1)}
            onZoomOut={() => canvas.handleZoom(-0.1)}
            canUndo={canvas.canUndo}
            canRedo={canvas.canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAutoLayout={handleAutoLayout}
            onRefresh={handleRefresh}
            isFullscreen={canvas.isFullscreen}
            onToggleFullscreen={canvas.handleToggleFullscreen}
          />

          {/* 画布 */}
          <CanvasDropZone
            canvasRef={canvasRef}
            className={cn(
              "absolute inset-0 w-full h-full overflow-hidden",
              connection.connectingFrom && "cursor-crosshair",
              !connection.connectingFrom && (canvas.toolMode === 'pan' || canvas.toolMode === 'select') && "cursor-grab",
              !connection.connectingFrom && canvas.isPanning && "cursor-grabbing"
            )}
            onMouseDown={handleCanvasDragStart}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
          >
          {/* 网格背景 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern 
                id="grid" 
                width={GRID_SIZE * canvas.zoom} 
                height={GRID_SIZE * canvas.zoom} 
                patternUnits="userSpaceOnUse"
                x={canvas.panOffset.x % (GRID_SIZE * canvas.zoom)}
                y={canvas.panOffset.y % (GRID_SIZE * canvas.zoom)}
              >
                <rect 
                  width={GRID_SIZE * canvas.zoom} 
                  height={GRID_SIZE * canvas.zoom} 
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* 可缩放和平移的内容 */}
          <div
            className="canvas-content absolute inset-0"
            style={{
              transform: `translate(${canvas.panOffset.x}px, ${canvas.panOffset.y}px) scale(${canvas.zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* 连接线 SVG */}
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
              <defs>
                {/* 渐变和箭头定义 */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6B7280" />
                </marker>
                <marker
                  id="arrow-green"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                </marker>
                <marker
                  id="arrow-red"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                </marker>
                <marker
                  id="arrowhead"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={NODE_META_REGISTRY[NodeType.LOOP]?.color || '#EC4899'} />
                </marker>
              </defs>

              {/* 渲染连接线 */}
              {workflow.connections.map(conn => {
                const fromNode = workflow.nodes.find(n => n.id === conn.from);
                const toNode = workflow.nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                const fromSize = nodeOps.getNodeSize(fromNode.id, fromNode.type);
                const toSize = nodeOps.getNodeSize(toNode.id, toNode.type);
                
                // 使用实际尺寸计算连接点位置
                let startX = fromNode.x + fromSize.width / 2;
                const startY = fromNode.y + fromSize.height;
                
                // 条件节点的不同输出位置
                if (fromNode.type === NodeType.CONDITION) {
                  if (conn.color === '#10B981') {
                    startX = fromNode.x + fromSize.width / 3;
                  } else if (conn.color === '#EF4444') {
                    startX = fromNode.x + (fromSize.width * 2) / 3;
                  }
                }

                const endX = toNode.x + toSize.width / 2;
                const endY = toNode.y;

                const path = calculateBezierPath(startX, startY, endX, endY);
                const isSelected = selectedConnectionId === conn.id;
                
                // 根据源节点类型确定连接线颜色
                // 条件节点保持原有的颜色逻辑（绿色/红色），其他节点使用节点元数据中的颜色
                let defaultColor = '#6B7280'; // 默认灰色
                if (fromNode.type === NodeType.CONDITION) {
                  // 条件节点保持原有逻辑，使用 conn.color
                  defaultColor = conn.color || '#6B7280';
                } else {
                  // 其他节点使用节点元数据中的颜色
                  const nodeMeta = NODE_META_REGISTRY[fromNode.type];
                  defaultColor = nodeMeta?.color || '#6B7280';
                }
                
                const strokeColor = isSelected ? '#2563EB' : (conn.color || defaultColor);
                const markerId = strokeColor === '#10B981' ? 'arrow-green' : strokeColor === '#EF4444' ? 'arrow-red' : 'arrow';

                return (
                  <g
                    key={conn.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      // 阻止冒泡到画布，避免清除选中
                      e.stopPropagation();
                      setSelectedConnectionId(conn.id);
                      nodeOps.setSelectedNodeId(null);
                      nodeOps.setEditingNodeId(null);
                    }}
                  >
                    {/* 透明加粗热区，便于鼠标选中连接线后删除/重连 */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={16}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      markerEnd={`url(#${markerId})`}
                      className={cn(
                        "transition-all pointer-events-none",
                        isSelected && "drop-shadow-[0_0_4px_rgba(37,99,235,0.7)]"
                      )}
                    />
                    {/* 连接线标签 */}
                    {conn.label && (
                      <g>
                        <rect
                          x={startX - 24}
                          y={startY + 20}
                          width="48"
                          height="24"
                          rx="4"
                          fill="white"
                          stroke={strokeColor}
                          strokeWidth="1.5"
                        />
                        <text
                          x={startX}
                          y={startY + 36}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="500"
                          fill={strokeColor}
                        >
                          {conn.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 临时连线（拖拽中） */}
              {connection.connectingFrom && connection.tempConnectionEnd && (
                <path
                  d={(() => {
                    const fromNode = workflow.nodes.find(n => n.id === connection.connectingFrom);
                    if (!fromNode) return '';
                    const fromSize = nodeOps.getNodeSize(fromNode.id, fromNode.type);
                    const startX = fromNode.x + fromSize.width / 2;
                    const startY = fromNode.y + fromSize.height;
                    return calculateBezierPath(startX, startY, connection.tempConnectionEnd.x, connection.tempConnectionEnd.y);
                  })()}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}

              {/* 循环节点的子节点连接线 */}
              {workflow.nodes.map(node => {
                const isLoopNode = node.type === NodeType.LOOP;
                const loopConfig = isLoopNode ? (node.config as LoopConfig) : null;
                const subNodes = (loopConfig?.sub_nodes || []) as WorkflowNodeData[];
                const hasSubNodes = Array.isArray(subNodes) && subNodes.length > 0;
                const isExpanded = nodeOps.expandedLoopNodes.has(node.id);
                
                if (!isLoopNode || !hasSubNodes || !isExpanded) return null;
                
                // 子节点布局配置
                const SUB_NODE_WIDTH = 280;
                const SUB_NODE_HEIGHT = 180;
                const SUB_NODE_SPACING = 40;
                const LOOP_TO_SUB_OFFSET_X = 350;
                const LOOP_TO_SUB_OFFSET_Y = 20;
                
                const nodeSize = nodeOps.getNodeSize(node.id, node.type);
                const subNodesAreaX = node.x + LOOP_TO_SUB_OFFSET_X;
                const subNodesAreaY = node.y + LOOP_TO_SUB_OFFSET_Y;
                const subNodesAreaHeight = subNodes.length * (SUB_NODE_HEIGHT + SUB_NODE_SPACING) - SUB_NODE_SPACING;
                
                // 循环节点的连接点（底部中心）
                const loopNodeCenterX = node.x + nodeSize.width / 2;
                const loopNodeBottomY = node.y + nodeSize.height;
                const loopNodeConnectionPointY = loopNodeBottomY + 6;
                
                // 第一个子节点的连接点（顶部中心）
                const firstSubNodeCenterX = subNodesAreaX + SUB_NODE_WIDTH / 2;
                const firstSubNodeTopY = subNodesAreaY;
                const firstSubNodeConnectionPointY = firstSubNodeTopY - 6;
                
                // 最后一个子节点的连接点（底部中心）
                const lastSubNodeCenterX = subNodesAreaX + SUB_NODE_WIDTH / 2;
                const lastSubNodeBottomY = subNodesAreaY + subNodesAreaHeight;
                const lastSubNodeConnectionPointY = lastSubNodeBottomY + 6;
                
                const loopColor = NODE_META_REGISTRY[NodeType.LOOP]?.color || '#EC4899';
                
                return (
                  <g key={`loop-connections-${node.id}`}>
                    {/* 从循环节点到第一个子节点的连接线 */}
                    <path
                      d={calculateBezierPath(
                        loopNodeCenterX,
                        loopNodeConnectionPointY,
                        firstSubNodeCenterX,
                        firstSubNodeConnectionPointY
                      )}
                      fill="none"
                      stroke={loopColor}
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* 子节点之间的连接线 */}
                    {subNodes.map((_, index) => {
                      if (index === subNodes.length - 1) return null;
                      
                      const currentSubNodeBottomY = subNodesAreaY + index * (SUB_NODE_HEIGHT + SUB_NODE_SPACING) + SUB_NODE_HEIGHT;
                      const nextSubNodeTopY = subNodesAreaY + (index + 1) * (SUB_NODE_HEIGHT + SUB_NODE_SPACING);
                      
                      return (
                        <path
                          key={`sub-connection-${node.id}-${index}`}
                          d={calculateBezierPath(
                            firstSubNodeCenterX,
                            currentSubNodeBottomY + 6,
                            firstSubNodeCenterX,
                            nextSubNodeTopY - 6
                          )}
                          fill="none"
                          stroke={loopColor}
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })}
                    
                    {/* 从最后一个子节点回到循环节点的连接线（形成环形） */}
                    <path
                      d={calculateBezierPath(
                        lastSubNodeCenterX,
                        lastSubNodeConnectionPointY,
                        loopNodeCenterX,
                        loopNodeConnectionPointY
                      )}
                      fill="none"
                      stroke={loopColor}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* 渲染节点 */}
            {workflow.nodes.map(node => {
              const isLoopNode = node.type === NodeType.LOOP;
              const loopConfig = isLoopNode ? (node.config as LoopConfig) : null;
              const subNodes = (loopConfig?.sub_nodes || []) as WorkflowNodeData[];
              const hasSubNodes = Array.isArray(subNodes) && subNodes.length > 0;
              const isExpanded = nodeOps.expandedLoopNodes.has(node.id);
              
              const nodeSize = nodeOps.getNodeSize(node.id, node.type);
              
              return (
                <React.Fragment key={node.id}>
                  <div
                    ref={(el) => {
                      if (el) {
                        nodeOps.nodeRefs.current.set(node.id, el);
                      } else {
                        nodeOps.nodeRefs.current.delete(node.id);
                      }
                    }}
                    className="absolute"
                    style={{
                      left: node.x,
                      top: node.y,
                      cursor: canvas.toolMode === 'select' ? (nodeOps.draggingNodeId === node.id ? 'grabbing' : 'grab') : 'default',
                    }}
                    onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                  >
                    <NodeRenderer
                      node={node}
                      selected={nodeOps.selectedNodeId === node.id}
                      onSelect={() => {
                        nodeOps.setSelectedNodeId(node.id);
                        nodeOps.setEditingNodeId(null);
                      }}
                      onDoubleClick={() => {
                        nodeOps.setSelectedNodeId(node.id);
                        nodeOps.setEditingNodeId(node.id);
                      }}
                      onDelete={() => deleteNode(node.id)}
                      onCopy={() => nodeOps.copyNode(node.id)}
                      onSaveToPublic={() => onSaveToPublic?.(node.id)}
                      onConnectionStart={connection.handleConnectionStart}
                      onConnectionEnd={connection.handleConnectionEnd}
                      isConnecting={!!connection.connectingFrom}
                      onDebugNode={onDebugNode}
                    />
                  </div>
                  
                  {/* 循环节点的子节点嵌套渲染 - DAG 环形结构 */}
                  {isLoopNode && hasSubNodes && isExpanded && (() => {
                    // 子节点布局配置
                    const SUB_NODE_WIDTH = 280;
                    const SUB_NODE_HEIGHT = 180;
                    const SUB_NODE_SPACING = 40;
                    const LOOP_TO_SUB_OFFSET_X = 350;
                    const LOOP_TO_SUB_OFFSET_Y = 20;
                    
                    // 计算子节点区域的位置和尺寸
                    const subNodesAreaX = node.x + LOOP_TO_SUB_OFFSET_X;
                    const subNodesAreaY = node.y + LOOP_TO_SUB_OFFSET_Y;
                    const subNodesAreaWidth = SUB_NODE_WIDTH + 40;
                    const subNodesAreaHeight = subNodes.length * (SUB_NODE_HEIGHT + SUB_NODE_SPACING) - SUB_NODE_SPACING;
                    
                    return (
                      <div
                        key={`sub-nodes-${node.id}`}
                        className="absolute z-10"
                        style={{
                          left: subNodesAreaX,
                          top: subNodesAreaY,
                          width: subNodesAreaWidth,
                          minHeight: subNodesAreaHeight,
                        }}
                      >
                          {Array.isArray(subNodes) && subNodes.map((subNode, index) => {
                            if (!subNode || !subNode.id) {
                              return null;
                            }
                            
                            // 计算子节点位置（垂直排列）
                            const subNodeY = index * (SUB_NODE_HEIGHT + SUB_NODE_SPACING);
                            
                            return (
                              <div
                                key={subNode.id}
                                className="absolute"
                                style={{
                                  left: 0,
                                  top: subNodeY,
                                }}
                              >
                                <NodeRenderer
                                  node={subNode}
                                  selected={nodeOps.selectedNodeId === subNode.id}
                                  onSelect={() => setSelectedNodeId(subNode.id)}
                                  onDelete={() => {
                                    // 从循环配置中删除子节点
                                    if (loopConfig) {
                                      const newLoopConfig = {
                                        ...loopConfig,
                                        sub_nodes: subNodes.filter((_, i) => i !== index),
                                      };
                                      nodeOps.updateNodeConfig(node.id, newLoopConfig);
                                    }
                                  }}
                                  onCopy={() => {
                                    // 复制子节点
                                    if (loopConfig) {
                                      const newSubNode: WorkflowNodeData = {
                                        ...subNode,
                                        id: `sub-node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        name: `${subNode.name} (副本)`,
                                      };
                                      const newLoopConfig = {
                                        ...loopConfig,
                                        sub_nodes: [...subNodes, newSubNode],
                                      };
                                      nodeOps.updateNodeConfig(node.id, newLoopConfig);
                                    }
                                  }}
                                  onSaveToPublic={undefined}
                                  onConnectionStart={undefined}
                                  onConnectionEnd={undefined}
                                  isConnecting={false}
                                  onDebugNode={undefined}
                                />
                              </div>
                            );
                          })}
                      </div>
                    );
                  })()}
                  
                  {/* 循环节点展开/收起按钮 */}
                  {isLoopNode && hasSubNodes && (
                    <div
                      className="absolute flex items-center justify-center cursor-pointer z-20"
                      style={{
                        left: node.x + nodeSize.width - 30,
                        top: node.y + nodeSize.height - 30,
                        width: 24,
                        height: 24,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        nodeOps.setExpandedLoopNodes(prev => {
                          const next = new Set(prev);
                          if (next.has(node.id)) {
                            next.delete(node.id);
                          } else {
                            next.add(node.id);
                          }
                          return next;
                        });
                      }}
                      title={isExpanded ? '收起子节点' : '展开子节点'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600 rotate-[-90deg]" />
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            </div>
          </CanvasDropZone>
        </div>
      </div>

      {nodeOps.editingNode && (
        <div className="relative flex border-l border-gray-200 bg-white" style={{ width: `${resize.panelWidth}px` }}>
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-gray-300 transition-colors z-10 group"
            onMouseDown={resize.handleResizeStart}
            style={{ 
              cursor: resize.isResizing ? 'col-resize' : 'col-resize',
              backgroundColor: resize.isResizing ? '#3B82F6' : undefined
            }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-400 group-hover:bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 overflow-hidden">
            <NodeFormPanel
              node={nodeOps.editingNode}
              onClose={() => nodeOps.setEditingNodeId(null)}
              onChange={nodeOps.updateNodeConfig}
              onNameChange={nodeOps.updateNodeName}
              onSave={nodeOps.handleNodeSave}
              projectId={localStorage.getItem('currentProjectId') || undefined}
              onDebugNode={onDebugNode}
            />
          </div>
        </div>
      )}

      <AddNodeDialog
        open={nodeOps.isAddNodeDialogOpen}
        onOpenChange={nodeOps.setIsAddNodeDialogOpen}
        onSelectNode={(nodeType, x, y) => nodeOps.handleAddNode(nodeType, x, y, canvasRef, canvas.zoom, canvas.panOffset)}
      />
    </div>
  );
};

export default WorkflowCanvas;

