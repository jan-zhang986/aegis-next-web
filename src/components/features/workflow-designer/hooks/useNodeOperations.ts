/**
 * useNodeOperations Hook
 * 管理节点操作相关逻辑（更新配置、名称、保存等）
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { WorkflowData, WorkflowNodeData, NodeConfig } from '@/components/workflow';
import { convertDefinitionToNode as convertDefinitionToNodeUtil } from '../utils/nodeConverter';
import type { MetadataDefinition } from '@/services/metadata';

interface UseNodeOperationsParams {
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  handleSave: () => Promise<boolean>;
}

interface UseNodeOperationsReturn {
  // 函数
  convertDefinitionToNode: (definition: MetadataDefinition) => void;
  handleUpdateNodeConfig: (nodeId: string, config: NodeConfig) => void;
  handleUpdateNodeName: (nodeId: string, name: string) => void;
  handleNodeSave: (nodeId: string) => Promise<void>;
}

/**
 * useNodeOperations Hook
 * 管理节点操作相关逻辑
 */
export function useNodeOperations({
  workflow,
  setWorkflow,
  handleSave,
}: UseNodeOperationsParams): UseNodeOperationsReturn {
  // 将definition转换为工作流节点
  const convertDefinitionToNode = useCallback((definition: MetadataDefinition) => {
    try {
      const newNode = convertDefinitionToNodeUtil(definition, workflow.nodes);
      if (newNode) {
        setWorkflow(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
        }));
        toast.success(`已添加节点"${newNode.name}"`);
      }
    } catch (error: any) {
      console.error('[convertDefinitionToNode] 转换节点失败:', error, definition);
      toast.error(`转换节点失败: ${error.message || '未知错误'}`);
    }
  }, [workflow.nodes, setWorkflow]);

  // 更新节点配置
  const handleUpdateNodeConfig = useCallback((nodeId: string, config: NodeConfig) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === nodeId ? { ...n, config } : n
      ),
    }));
  }, [setWorkflow]);

  // 更新节点名称
  const handleUpdateNodeName = useCallback((nodeId: string, name: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === nodeId ? { ...n, name } : n
      ),
    }));
  }, [setWorkflow]);

  // 保存节点配置
  const handleNodeSave = useCallback(async (nodeId: string) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      toast.error('节点不存在');
      return;
    }
    
    // 调用工作流保存方法，保存整个工作流（包括节点配置）
    await handleSave();
  }, [workflow.nodes, handleSave]);

  return {
    convertDefinitionToNode,
    handleUpdateNodeConfig,
    handleUpdateNodeName,
    handleNodeSave,
  };
}
