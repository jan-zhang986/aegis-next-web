/**
 * workflowCanvasHandler.ts
 * WorkflowCanvas onChange 回调处理逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import { getTopologicalOrder } from './workflowValidator';
import type { Dispatch, SetStateAction } from 'react';

/**
 * 处理 WorkflowCanvas 的 onChange 回调
 * 在步骤模式下，根据连接线重新排序节点
 */
export function handleWorkflowCanvasChange(
  updatedWorkflow: WorkflowData,
  currentWorkflow: WorkflowData,
  viewMode: 'canvas' | 'steps',
  setWorkflow: Dispatch<SetStateAction<WorkflowData>>
): void {
  // 只在步骤模式下，根据连接线重新排序节点
  // 画布模式下保持节点的原始坐标，不进行自动排序
  if (viewMode === 'steps') {
    const connectionsChanged = 
      updatedWorkflow.connections.length !== currentWorkflow.connections.length ||
      JSON.stringify(updatedWorkflow.connections.map(c => ({ from: c.from, to: c.to })).sort()) !== 
      JSON.stringify(currentWorkflow.connections.map(c => ({ from: c.from, to: c.to })).sort());

    if (connectionsChanged && updatedWorkflow.connections.length > 0) {
      // 根据连接线进行拓扑排序，更新节点顺序
      const sortedNodeIds = getTopologicalOrder(updatedWorkflow.nodes, updatedWorkflow.connections);
      
      // 创建节点ID到节点的映射
      const nodeMap = new Map(updatedWorkflow.nodes.map(n => [n.id, n]));
      
      // 按照拓扑排序的顺序重新排列节点
      const sortedNodes = sortedNodeIds
        .map(id => nodeMap.get(id))
        .filter((node): node is WorkflowNodeData => node !== undefined);
      
      // 将未在连接线中的节点追加到末尾（保持原有顺序）
      const connectedNodeIds = new Set(sortedNodeIds);
      const unconnectedNodes = updatedWorkflow.nodes.filter(n => !connectedNodeIds.has(n.id));
      
      // 更新节点的 y 坐标以反映新顺序
      const allSortedNodes = [...sortedNodes, ...unconnectedNodes].map((node, index) => ({
        ...node,
        y: 100 + index * 200,
      }));

      setWorkflow({
        ...updatedWorkflow,
        nodes: allSortedNodes,
      });
      return;
    }
  }
  
  // 画布模式或连接线没有变化，直接更新（保持节点坐标）
  setWorkflow(updatedWorkflow);
}
