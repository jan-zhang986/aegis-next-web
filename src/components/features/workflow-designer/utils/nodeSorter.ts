/**
 * nodeSorter.ts
 * 节点排序相关工具函数
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import { getTopologicalOrder } from './workflowValidator';

/**
 * 获取排序后的节点列表
 * 在步骤模式下，直接返回原始节点顺序（保持用户拖拽后的顺序）
 * 在画布模式下，使用拓扑排序
 */
export function getSortedNodes(
  workflow: WorkflowData,
  viewMode: 'canvas' | 'steps'
): WorkflowNodeData[] {
  // 在步骤模式下，直接返回原始节点顺序，不进行拓扑排序
  // 这样可以保持用户拖拽调整后的顺序
  if (viewMode === 'steps') {
    return [...workflow.nodes];
  }
  
  // 画布模式下，使用拓扑排序
  const sortedIds = getTopologicalOrder(workflow.nodes, workflow.connections);
  const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
  return sortedIds.map(id => nodeMap.get(id)).filter((n): n is WorkflowNodeData => n !== undefined);
}
