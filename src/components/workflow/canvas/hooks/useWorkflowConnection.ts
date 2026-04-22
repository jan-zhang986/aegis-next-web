/**
 * WorkflowCanvas 连线：连线状态、addConnection、deleteConnection、连线计算
 */

import { useState, useCallback } from 'react';
import type { WorkflowData, ConnectionData, NodeType } from '../../types';
import { NodeType as NodeTypeEnum } from '../../types';

export interface UseWorkflowConnectionOptions {
  workflow: WorkflowData;
  onChange: (workflow: WorkflowData) => void;
  pushHistory: () => void;
  readOnly?: boolean;
  selectedConnectionId: string | null;
  setSelectedConnectionId: (id: string | null) => void;
}

const GRID_SIZE = 20;

export function calculateBezierPath(startX: number, startY: number, endX: number, endY: number): string {
  const deltaY = endY - startY;
  const controlPointOffset = Math.max(Math.abs(deltaY) * 0.5, 50);
  const cp1X = startX;
  const cp1Y = startY + controlPointOffset;
  const cp2X = endX;
  const cp2Y = endY - controlPointOffset;
  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
}

export function useWorkflowConnection({
  workflow,
  onChange,
  pushHistory,
  readOnly = false,
  selectedConnectionId,
  setSelectedConnectionId,
}: UseWorkflowConnectionOptions) {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  /** 条件节点：从 true 还是 false 输出点开始拖拽，完成连接时用此分支，避免删除 true 后重连被误判为 false */
  const [connectingFromConditionBranch, setConnectingFromConditionBranch] = useState<'true' | 'false' | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);

  const addConnection = useCallback(
    (from: string, to: string, color?: string, label?: string) => {
      if (workflow.connections.some((c) => c.from === from && c.to === to)) return;
      pushHistory();
      const newConnection: ConnectionData = { id: `conn-${Date.now()}`, from, to, color, label };
      onChange({ ...workflow, connections: [...workflow.connections, newConnection] });
    },
    [workflow, onChange, pushHistory]
  );

  const deleteConnection = useCallback(
    (connectionId: string) => {
      pushHistory();
      const newConnections = workflow.connections.filter((c) => c.id !== connectionId);
      onChange({ ...workflow, connections: newConnections });
      if (selectedConnectionId === connectionId) setSelectedConnectionId(null);
    },
    [workflow, onChange, selectedConnectionId, setSelectedConnectionId, pushHistory]
  );

  const handleConnectionStart = useCallback(
    (nodeId: string, _portType?: string, options?: { conditionBranch?: 'true' | 'false' }) => {
      if (readOnly) return;
      setConnectingFrom(nodeId);
      setConnectingFromConditionBranch(options?.conditionBranch ?? null);
    },
    [readOnly]
  );

  const handleConnectionEnd = useCallback(
    (nodeId: string) => {
      if (connectingFrom && connectingFrom !== nodeId) {
        const fromNode = workflow.nodes.find((n) => n.id === connectingFrom);
        let color: string | undefined;
        let label: string | undefined;
        if (fromNode?.type === NodeTypeEnum.CONDITION) {
          // 优先用拖拽起点的分支（从绿点/红点开始），否则按已有连线数推断
          if (connectingFromConditionBranch === 'true') {
            color = '#10B981';
            label = 'true';
          } else if (connectingFromConditionBranch === 'false') {
            color = '#EF4444';
            label = 'false';
          } else {
            const existing = workflow.connections.filter((c) => c.from === connectingFrom);
            if (existing.length === 0) {
              color = '#10B981';
              label = 'true';
            } else if (existing.length === 1) {
              color = '#EF4444';
              label = 'false';
            }
          }
        }
        addConnection(connectingFrom, nodeId, color, label);
      }
      setConnectingFrom(null);
      setConnectingFromConditionBranch(null);
      setTempConnectionEnd(null);
    },
    [connectingFrom, connectingFromConditionBranch, workflow, addConnection]
  );

  return {
    connectingFrom,
    setConnectingFrom,
    tempConnectionEnd,
    setTempConnectionEnd,
    addConnection,
    deleteConnection,
    handleConnectionStart,
    handleConnectionEnd,
  };
}
