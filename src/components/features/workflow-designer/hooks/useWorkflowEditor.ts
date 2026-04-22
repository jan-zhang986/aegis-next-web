/**
 * useWorkflowEditor Hook
 * 管理工作流编辑的核心状态和逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import { metadataService } from '@/services/metadata';
import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import { NodeType } from '@/components/workflow';

interface UseWorkflowEditorParams {
  workflowId?: string;
  moduleId?: string;
  setModuleId?: (moduleId: string | undefined) => void;
  viewMode?: 'canvas' | 'steps';
  onWorkflowLoaded?: (workflow: WorkflowData) => void;
}

/** 静默重载：不先清空界面（避免名称变「加载中」、节点被清空）；失败时保留当前数据并提示用户再次保存 */
export interface LoadWorkflowDataOptions {
  silent?: boolean;
}

interface UseWorkflowEditorReturn {
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  workflowMetadata: any;
  setWorkflowMetadata: React.Dispatch<React.SetStateAction<any>>;
  loadWorkflowData: (options?: LoadWorkflowDataOptions) => Promise<void>;
  originalNodesOrderRef: React.MutableRefObject<Map<string, number>>;
}

/**
 * useWorkflowEditor Hook
 * 管理工作流编辑的核心状态和逻辑
 */
export function useWorkflowEditor({
  workflowId,
  moduleId,
  setModuleId,
  viewMode = 'canvas',
  onWorkflowLoaded,
}: UseWorkflowEditorParams): UseWorkflowEditorReturn {
  // 工作流数据
  const [workflow, setWorkflow] = useState<WorkflowData>({
    name: '新建工作流',
    description: '',
    nodes: [],
    connections: [],
  });

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowMetadata, setWorkflowMetadata] = useState<any>(null);

  // 保存原始节点顺序的引用（用于在保存时交换坐标）
  const originalNodesOrderRef = useRef<Map<string, number>>(new Map());

  // 加载工作流数据
  // silent: 保存后的静默重载，不先清空界面；失败时保留当前数据并提示「请再次点击保存」
  const loadWorkflowData = useCallback(async (options?: LoadWorkflowDataOptions) => {
    const isSilentReload = options?.silent === true;

    if (!workflowId) {
      setWorkflowMetadata(null);
      setWorkflow({
        name: '新建工作流',
        description: '',
        nodes: [],
        connections: [],
      });
      return;
    }

    // 静默重载（如保存后刷新）：不先清空，避免名称变「加载中」、节点被清空
    if (!isSilentReload) {
      setWorkflow({
        name: '加载中...',
        description: '',
        nodes: [],
        connections: [],
      });
    }

    setLoading(true);
    try {
      const data = await workflowService.getWorkflowDetail(workflowId);
      if (data) {
        // 如果外部没有传入 moduleId，从工作流详情中获取
        if (!moduleId && data.moduleId && setModuleId) {
          setModuleId(data.moduleId);
        }

        // 转换后端数据格式，并验证元数据引用
        const nodes = (data.nodes || []).map((n: any) => {
          let refMode = n.refMode || 'NONE';
          // 如果节点有 refMetadataId 但 refMode 是 'REF_METADATA'，且工作流名称包含 "_copy"，
          // 说明这是复制的工作流，应该改为 'COPY'（但后端应该已经处理了，这里作为兜底）
          if (refMode === 'REF_METADATA' && n.refMetadataId && data.name?.includes('_copy')) {
            refMode = 'COPY';
          }

          // 处理节点配置：对于HTTP节点，将paramType转换为bodyType（前端使用bodyType）
          let nodeConfig = n.config || {};
          if (n.type === NodeType.HTTP_REQUEST && nodeConfig) {
            // 如果后端保存的是paramType，转换为bodyType（前端使用bodyType）
            if (nodeConfig.paramType && !nodeConfig.bodyType) {
              nodeConfig = {
                ...nodeConfig,
                bodyType: nodeConfig.paramType,
              };
            }
          }
          // 引用子节点：从后端 refWorkflowId 回填到 config.workflow_id 供表单展示
          if (n.type === NodeType.SUB_WORKFLOW && n.refWorkflowId && !nodeConfig.workflow_id) {
            nodeConfig = { ...nodeConfig, workflow_id: n.refWorkflowId };
          }

          return {
            id: n.id,
            type: n.type as NodeType,
            name: n.name,
            description: n.description,
            config: nodeConfig,
            x: n.x || 100,
            y: n.y || 100,
            // 引用模式相关字段
            refMode,
            refMetadataId: n.refMetadataId,
            refWorkflowId: n.refWorkflowId,
          };
        });

        // 验证元数据引用：检查 refMetadataId 是否有效
        const nodesToValidate = nodes.filter(
          (n) =>
            n.refMetadataId &&
            (n.refMode === 'REF_METADATA' || n.refMode === 'COPY')
        );

        let finalNodes = nodes;
        if (nodesToValidate.length > 0) {
          // 批量验证元数据ID是否存在
          const validationPromises = nodesToValidate.map(async (node) => {
            try {
              const definition = await metadataService.getDefinition(
                node.refMetadataId!
              );
              // 如果元数据不存在，清除 refMetadataId（设置为 null）
              if (!definition) {
                return {
                  ...node,
                  refMetadataId: null,
                };
              }
              return node;
            } catch (error) {
              // 验证失败，清除 refMetadataId
              return {
                ...node,
                refMetadataId: null,
              };
            }
          });

          const validatedNodes = await Promise.all(validationPromises);

          // 更新节点列表：用验证后的节点替换原节点
          const nodeMap = new Map(validatedNodes.map((n) => [n.id, n]));
          finalNodes = nodes.map((n) => nodeMap.get(n.id) || n);
        }

        const loadedWorkflow: WorkflowData = {
          id: data.workflowId,
          name: data.name || '未命名工作流',
          description: data.description || '',
          nodes: finalNodes,
          connections: (data.connections || []).map((c: any) => ({
            id: c.id || `conn-${Date.now()}-${Math.random()}`,
            from: c.from,
            to: c.to,
            label: c.label,
            color: c.color,
          })),
          globalVars: data.globalVars,
        };

        setWorkflow(loadedWorkflow);

        // 保存完整的元数据（从后端API获取的完整数据）
        setWorkflowMetadata(data);

        // 回调通知工作流已加载
        if (onWorkflowLoaded) {
          onWorkflowLoaded(loadedWorkflow);
        }

        // 更新原始节点顺序引用（用于步骤模式下的坐标交换）
        if (viewMode === 'steps') {
          originalNodesOrderRef.current = new Map(
            (data.nodes || []).map((n: any, index: number) => [n.id, index])
          );
        }
      } else {
        // 如果没有数据，保持清空状态
        setWorkflow({
          name: '新建工作流',
          description: '',
          nodes: [],
          connections: [],
        });
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
      if (isSilentReload) {
        // 保存后重载失败：保留当前数据，提示用户再次保存，不清空
        toast.error('加载失败，请再次点击保存');
      } else {
        toast.error('加载工作流失败，请刷新页面重试');
        setWorkflow({
          name: '新建工作流',
          description: '',
          nodes: [],
          connections: [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [workflowId, moduleId, viewMode, setModuleId, onWorkflowLoaded]);

  // 初始加载工作流数据
  useEffect(() => {
    loadWorkflowData();
  }, [workflowId]);

  return {
    workflow,
    setWorkflow,
    loading,
    setLoading,
    saving,
    setSaving,
    workflowMetadata,
    setWorkflowMetadata,
    loadWorkflowData,
    originalNodesOrderRef,
  };
}
