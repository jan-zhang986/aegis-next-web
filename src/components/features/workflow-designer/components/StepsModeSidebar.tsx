/**
 * StepsModeSidebar Component
 * 步骤模式下的节点编辑面板（浮层抽屉，覆盖在步骤列表之上，不占用水平空间）
 */

import React, { useRef, useEffect } from 'react';
import { NodeFormPanel } from '@/components/workflow/panels/NodeFormPanel';
import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';

interface StepsModeSidebarProps {
  viewMode: 'canvas' | 'steps';
  workflow: WorkflowData;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  handleUpdateNodeConfig: (nodeId: string, config: any) => void;
  handleUpdateNodeName: (nodeId: string, name: string) => void;
  handleNodeSave: (nodeId: string) => void | Promise<void>;
  projectId: string;
  onDebugNode: (nodeId: string) => Promise<void>;
}

export const StepsModeSidebar: React.FC<StepsModeSidebarProps> = ({
  viewMode,
  workflow,
  selectedNodeId,
  setSelectedNodeId,
  handleUpdateNodeConfig,
  handleUpdateNodeName,
  handleNodeSave,
  projectId,
  onDebugNode,
}) => {
  // 重载期间可能短暂拿不到当前节点，用 ref 缓存上一次的节点避免抽屉显示空白（保存后已改为静默重载，不再先清空）
  const lastNodeRef = useRef<WorkflowNodeData | null>(null);

  // 选中节点变更时清空缓存（Hooks 必须在任何 return 之前调用）
  useEffect(() => {
    if (!selectedNodeId) {
      lastNodeRef.current = null;
    }
  }, [selectedNodeId]);

  if (viewMode !== 'steps' || !selectedNodeId) {
    return null;
  }

  const node = workflow.nodes.find((n) => n.id === selectedNodeId) || null;

  if (node) {
    lastNodeRef.current = node;
  }

  const displayNode =
    node ??
    (selectedNodeId && lastNodeRef.current?.id === selectedNodeId
      ? lastNodeRef.current
      : null);
  if (!displayNode) {
    return null;
  }

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-50 flex flex-col bg-white border-l border-gray-200 shadow-xl"
      style={{ width: 800 }}
    >
      <NodeFormPanel
        node={displayNode}
        onClose={() => setSelectedNodeId(null)}
        onChange={handleUpdateNodeConfig}
        onNameChange={handleUpdateNodeName}
        onSave={() => handleNodeSave(selectedNodeId)}
        projectId={projectId}
        onDebugNode={onDebugNode}
      />
    </div>
  );
};
