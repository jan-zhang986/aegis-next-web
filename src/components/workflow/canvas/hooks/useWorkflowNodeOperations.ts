/**
 * WorkflowCanvas 节点操作：updateNode、deleteNode、copyNode、pasteNode、addNode、节点选择/编辑
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import type { WorkflowNodeData, WorkflowData, NodeConfig } from '../../types';
import { NodeType, NODE_META_REGISTRY } from '../../types';

export interface UseWorkflowNodeOperationsOptions {
  workflow: WorkflowData;
  onChange: (workflow: WorkflowData) => void;
  pushHistory: () => void;
  readOnly?: boolean;
  onNodeSave?: (nodeId: string) => void;
}

export function useWorkflowNodeOperations({
  workflow,
  onChange,
  pushHistory,
  readOnly = false,
  onNodeSave,
}: UseWorkflowNodeOperationsOptions) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const [clipboardNode, setClipboardNode] = useState<WorkflowNodeData | null>(null);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [expandedLoopNodes, setExpandedLoopNodes] = useState<Set<string>>(new Set());
  const [nodeSizes, setNodeSizes] = useState<Map<string, { width: number; height: number }>>(new Map());
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const selectedNode = useMemo(() => workflow.nodes.find((n) => n.id === selectedNodeId) || null, [workflow.nodes, selectedNodeId]);
  const editingNode = useMemo(() => workflow.nodes.find((n) => n.id === editingNodeId) || null, [workflow.nodes, editingNodeId]);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<WorkflowNodeData>) => {
      pushHistory();
      const newNodes = workflow.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node));
      onChange({ ...workflow, nodes: newNodes });
    },
    [workflow, onChange, pushHistory]
  );

  const updateNodeConfig = useCallback((nodeId: string, config: NodeConfig) => updateNode(nodeId, { config }), [updateNode]);
  const updateNodeName = useCallback((nodeId: string, name: string) => updateNode(nodeId, { name }), [updateNode]);

  const handleNodeSave = useCallback(
    (nodeId: string) => {
      if (onNodeSave) {
        onNodeSave(nodeId);
      } else {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (node) toast.success(`节点"${node.name}"配置已保存`, { duration: 2000 });
      }
    },
    [workflow, onNodeSave]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      pushHistory();
      const newNodes = workflow.nodes.filter((n) => n.id !== nodeId);
      const newConnections = workflow.connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
      onChange({ ...workflow, nodes: newNodes, connections: newConnections });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (editingNodeId === nodeId) setEditingNodeId(null);
    },
    [workflow, onChange, selectedNodeId, editingNodeId, pushHistory]
  );

  const copyNode = useCallback(
    (nodeId: string) => {
      const nodeToCopy = workflow.nodes.find((n) => n.id === nodeId);
      if (!nodeToCopy) return;
      setClipboardNode(nodeToCopy);
      pushHistory();
      const newNode: WorkflowNodeData = {
        ...nodeToCopy,
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${nodeToCopy.name} (副本)`,
        x: nodeToCopy.x + 50,
        y: nodeToCopy.y + 50,
      };
      onChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
      setSelectedNodeId(newNode.id);
    },
    [workflow, onChange, pushHistory]
  );

  const pasteNode = useCallback(() => {
    if (!clipboardNode) return;
    pushHistory();
    const newNode: WorkflowNodeData = {
      ...clipboardNode,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${clipboardNode.name} (副本)`,
      x: clipboardNode.x + 50,
      y: clipboardNode.y + 50,
    };
    onChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
    setSelectedNodeId(newNode.id);
  }, [clipboardNode, workflow, onChange, pushHistory]);

  const generateNodeId = useCallback(() => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  const handleAddNode = useCallback(
    (nodeType: NodeType, x?: number, y?: number, canvasRef?: React.RefObject<HTMLDivElement>, zoom?: number, panOffset?: { x: number; y: number }) => {
      const meta = NODE_META_REGISTRY[nodeType];
      if (!meta) return;
      const NODE_WIDTH = 280;
      const NODE_HEIGHT = 180;
      let nodeX = x;
      let nodeY = y;
      if (nodeX === undefined || nodeY === undefined) {
        const canvas = canvasRef?.current;
        if (canvas && zoom && panOffset) {
          const rect = canvas.getBoundingClientRect();
          nodeX = (rect.width / 2 - panOffset.x) / zoom - NODE_WIDTH / 2;
          nodeY = (rect.height / 2 - panOffset.y) / zoom - NODE_HEIGHT / 2;
        } else {
          nodeX = 100;
          nodeY = 100;
        }
      }
      pushHistory();
      const newNode: WorkflowNodeData = {
        id: generateNodeId(),
        type: nodeType,
        name: meta.name,
        description: meta.description,
        config: meta.defaultConfig || {},
        x: nodeX,
        y: nodeY,
      };
      onChange({ ...workflow, nodes: [...workflow.nodes, newNode] });
      setSelectedNodeId(newNode.id);
    },
    [workflow, onChange, generateNodeId, pushHistory]
  );

  const updateNodeSize = useCallback((nodeId: string, width: number, height: number) => {
    setNodeSizes((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(nodeId);
      if (!current || current.width !== width || current.height !== height) {
        newMap.set(nodeId, { width, height });
        return newMap;
      }
      return prev;
    });
  }, []);

  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 180;
  const CONDITION_NODE_HEIGHT = 220;

  const getNodeSize = useCallback(
    (nodeId: string, nodeType: NodeType): { width: number; height: number } => {
      const stored = nodeSizes.get(nodeId);
      if (stored) return stored;
      return { width: NODE_WIDTH, height: nodeType === NodeType.CONDITION ? CONDITION_NODE_HEIGHT : NODE_HEIGHT };
    },
    [nodeSizes]
  );

  return {
    selectedNodeId,
    setSelectedNodeId,
    editingNodeId,
    setEditingNodeId,
    draggingNodeId,
    setDraggingNodeId,
    dragStart,
    setDragStart,
    selectedNode,
    editingNode,
    updateNode,
    updateNodeConfig,
    updateNodeName,
    handleNodeSave,
    deleteNode,
    copyNode,
    pasteNode,
    handleAddNode,
    isAddNodeDialogOpen,
    setIsAddNodeDialogOpen,
    expandedLoopNodes,
    setExpandedLoopNodes,
    nodeSizes,
    updateNodeSize,
    getNodeSize,
    nodeRefs,
    NODE_WIDTH,
    NODE_HEIGHT,
    CONDITION_NODE_HEIGHT,
  };
}
