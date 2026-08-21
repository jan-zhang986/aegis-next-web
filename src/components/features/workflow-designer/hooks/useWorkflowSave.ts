/**
 * useWorkflowSave Hook
 * 管理工作流保存逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { WorkflowData, WorkflowNodeData, ConnectionData } from '@/components/workflow';
import { NodeType, type HttpConfig, NODE_META_REGISTRY } from '@/components/workflow';

interface UseWorkflowSaveParams {
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  projectId: string;
  moduleId?: string;
  workflowId?: string;
  viewMode?: 'canvas' | 'steps';
  selectedGlobalEnvironmentId?: string | null;
  originalNodesOrderRef: React.MutableRefObject<Map<string, number>>;
  loadWorkflowData?: (options?: { silent?: boolean; workflowId?: string }) => Promise<void>;
  onSaveCallback?: () => void | Promise<void>;
  caseId?: string;
  realizationType?: string;
}

interface UseWorkflowSaveReturn {
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  handleSave: () => Promise<boolean>;
  handleSaveToPublic: (nodeId: string) => Promise<void>;
}

/**
 * useWorkflowSave Hook
 * 管理工作流保存逻辑
 */
export function useWorkflowSave({
  workflow,
  setWorkflow,
  projectId,
  moduleId,
  workflowId,
  viewMode = 'canvas',
  selectedGlobalEnvironmentId,
  originalNodesOrderRef,
  loadWorkflowData,
  onSaveCallback,
  caseId,
  realizationType,
}: UseWorkflowSaveParams): UseWorkflowSaveReturn {
  const [saving, setSaving] = useState(false);

  // 保存工作流
  const handleSave = useCallback(async () => {
    if (!projectId || !moduleId) {
      toast.error('缺少项目或模块信息');
      return false;
    }

    setSaving(true);
    try {
      // 如果在步骤模式下，需要根据节点顺序更新坐标和连接线
      let nodesToSave = workflow.nodes;
      let connectionsToSave = workflow.connections;

      if (viewMode === 'steps') {
        // 根据当前节点顺序更新坐标和连接线
        const sortedNodes = [...workflow.nodes];
        const originalOrder = originalNodesOrderRef.current;
        const currentOrder = new Map(
          sortedNodes.map((node, index) => [node.id, index])
        );

        // 交换节点的坐标：找到位置发生变化的节点，交换它们的坐标
        const nodesWithSwappedCoords = sortedNodes.map((node, currentIndex) => {
          const originalIndex = originalOrder.get(node.id);

          // 如果节点位置发生了变化
          if (originalIndex !== undefined && originalIndex !== currentIndex) {
            // 找到现在在节点原来位置的节点（即与它交换位置的节点）
            const swappedNode = sortedNodes.find((n) => {
              const nOriginalIndex = originalOrder.get(n.id);
              return nOriginalIndex === currentIndex && n.id !== node.id;
            });

            if (swappedNode) {
              // 交换坐标：当前节点使用交换节点的坐标
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

        // 创建条件节点ID集合
        const conditionNodeIds = new Set(
          sortedNodes.filter((n) => n.type === NodeType.CONDITION).map((n) => n.id)
        );

        // 保留条件节点的特殊连接
        const conditionConnections = workflow.connections.filter((conn) => {
          const fromNode = sortedNodes.find((n) => n.id === conn.from);
          return fromNode?.type === NodeType.CONDITION;
        });

        // 创建条件连接的目标节点集合
        const conditionTargetNodes = new Set(conditionConnections.map((c) => c.to));

        // 根据新的节点顺序，为相邻节点创建连接线
        const updatedConnections: ConnectionData[] = [];
        for (let i = 0; i < sortedNodes.length - 1; i++) {
          const currentNode = sortedNodes[i];
          const nextNode = sortedNodes[i + 1];

          // 如果当前节点是条件节点，跳过
          if (conditionNodeIds.has(currentNode.id)) {
            continue;
          }

          // 如果下一个节点已经被条件连接指向，跳过
          if (conditionTargetNodes.has(nextNode.id)) {
            continue;
          }

          // 查找原有的连接
          const existingConn = workflow.connections.find(
            (c) => c.from === currentNode.id && c.to === nextNode.id
          );

          if (existingConn) {
            updatedConnections.push(existingConn);
          } else {
            updatedConnections.push({
              id: `conn-${Date.now()}-${currentNode.id}-${nextNode.id}`,
              from: currentNode.id,
              to: nextNode.id,
            });
          }
        }

        // 合并条件节点的连接
        updatedConnections.push(...conditionConnections);
        connectionsToSave = updatedConnections;
        nodesToSave = nodesWithSwappedCoords;

        // 更新原始顺序引用，以便下次保存时使用
        originalNodesOrderRef.current = new Map(
          nodesToSave.map((node, index) => [node.id, index])
        );
      }

      // 节点配置处理：对于HTTP节点，将bodyType转换为paramType（后端使用paramType）
      const processedNodes = nodesToSave.map((n) => {
        let nodeConfig = n.config;

        // HTTP节点特殊处理：将bodyType转换为paramType
        if (n.type === NodeType.HTTP_REQUEST && nodeConfig) {
          const httpConfig = nodeConfig as HttpConfig;
          // 如果存在bodyType，转换为paramType（后端使用paramType）
          if (httpConfig.bodyType) {
            nodeConfig = {
              ...httpConfig,
              paramType: httpConfig.bodyType,
              // 保留bodyType用于前端显示，但后端主要使用paramType
            };
          }
        }

        // 引用子节点：refWorkflowId 来自 config.workflow_id 或节点 refWorkflowId
        const refWorkflowId =
          n.type === NodeType.SUB_WORKFLOW
            ? (((nodeConfig as Record<string, unknown> | undefined)?.workflow_id as string | number | null | undefined) ?? n.refWorkflowId) || null
            : n.refWorkflowId !== undefined ? n.refWorkflowId : null;
        const refMode =
          n.type === NodeType.SUB_WORKFLOW && refWorkflowId ? 'REF_WORKFLOW' : (n.refMode || 'NONE');

        if (n.type === NodeType.SUB_WORKFLOW && nodeConfig && typeof nodeConfig === 'object' && !Array.isArray(nodeConfig)) {
          const cfg = nodeConfig as Record<string, unknown>;
          if ('workflow_name' in cfg) {
            const { workflow_name: _unused, ...rest } = cfg;
            nodeConfig = rest as WorkflowNodeData['config'];
          }
        }

        return {
          id: n.id,
          type: n.type,
          name: n.name,
          description: n.description,
          config: nodeConfig, // 直接保存，environmentVariables 格式为 Record<string, string>
          x: n.x,
          y: n.y,
          // 引用模式相关字段
          refMode,
          refMetadataId:
            n.refMetadataId !== undefined ? n.refMetadataId : null, // 确保 null 而不是 undefined（数据库使用 null）
          refWorkflowId: refWorkflowId !== undefined && refWorkflowId !== null ? String(refWorkflowId) : null,
        };
      });

      const response = await workflowService.saveWorkflow({
        workflowId: workflow.id || workflowId,
        projectId,
        moduleId,
        description: workflow.description,
        category: 'API',
        type: 'TEST_CASE', // E2E用例类型
        environmentId: selectedGlobalEnvironmentId || undefined,
        globalVars: workflow.globalVars,
        nodes: processedNodes,
        connections: connectionsToSave.map((c) => ({
          from: c.from,
          to: c.to,
          label: c.label,
          color: c.color,
        })),
        caseId,
        realizationType,
        // 与后端 GLOBAL_VAR_CASE_REALIZATION 一致；否则 realization 接口不收录，详情 Tab / 工作台无 workflowDefinitionId
        ...(caseId && realizationType ? { caseRealization: true as const } : {}),
      });

      // 处理返回值：可能是字符串（workflowId）或对象 { data: workflowId } 或 { workflowId: ... }
      const savedWorkflowId =
        typeof response === 'string'
          ? response
          : response?.data || response?.workflowId || response;

      // 若父组件 / URL 尚未传入 workflowId，静默重载必须用本次接口返回的 ID，否则会走「无 ID」分支把画布清空
      const reloadWorkflowId =
        savedWorkflowId != null &&
        (typeof savedWorkflowId === 'string' || typeof savedWorkflowId === 'number')
          ? String(savedWorkflowId)
          : undefined;

      // 如果保存成功且返回了新的 ID，更新本地 workflow.id（与静默重载使用同一规范化结果）
      if (savedWorkflowId) {
        if (!workflow.id) {
          const nextId =
            reloadWorkflowId ||
            (typeof savedWorkflowId === 'string' || typeof savedWorkflowId === 'number'
              ? String(savedWorkflowId)
              : undefined);
          if (nextId) {
            setWorkflow((prev) => ({ ...prev, id: nextId }));
          }
        }
        // 保存成功后，静默重新加载工作流数据（以获取数据库中的真实节点ID step_id）
        // 使用 silent 避免先清空界面导致名称变「加载中」、节点被清空；失败时保留当前数据并提示再次保存
        if (loadWorkflowData && reloadWorkflowId) {
          await loadWorkflowData({ silent: true, workflowId: reloadWorkflowId });
        }
      }

      // 显示保存成功提示，包含工作流名称
      const workflowName = workflow.name || '工作流';
      toast.success(`工作流"${workflowName}"保存成功`, {
        duration: 3000,
      });

      // 调用外部保存回调
      if (onSaveCallback) {
        await onSaveCallback();
      }

      return true;
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error(error?.response?.data?.message || error?.message || '保存失败');
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    workflow,
    projectId,
    moduleId,
    workflowId,
    viewMode,
    selectedGlobalEnvironmentId,
    originalNodesOrderRef,
    setWorkflow,
    loadWorkflowData,
    onSaveCallback,
    caseId,
    realizationType,
  ]);

  // 保存节点到公共节点（简化版本，不管理状态）
  const handleSaveToPublic = useCallback(
    async (nodeId: string) => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error('节点不存在');
        return;
      }

      try {
        const meta = NODE_META_REGISTRY[node.type];
        await workflowService.savePublicNode({
          projectId,
          name: node.name,
          description: node.description || '',
          type: node.type,
          config: node.config,
          category: meta?.category || 'other',
        });

        toast.success(`节点"${node.name}"已保存到公共节点`);
      } catch (error: any) {
        console.error('保存到公共节点失败:', error);
        toast.error(
          error?.response?.data?.message || error?.message || '保存到公共节点失败'
        );
      }
    },
    [workflow.nodes, projectId]
  );

  return {
    saving,
    setSaving,
    handleSave,
    handleSaveToPublic,
  };
}
