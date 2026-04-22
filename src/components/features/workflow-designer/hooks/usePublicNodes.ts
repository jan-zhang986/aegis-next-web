/**
 * usePublicNodes Hook
 * 管理公共节点相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { WorkflowNodeData } from '@/components/workflow';
import { NodeType, NODE_META_REGISTRY } from '@/components/workflow';

interface UsePublicNodesParams {
  projectId: string;
  leftPanelTab: string;
}

interface UsePublicNodesReturn {
  // 状态
  publicNodes: any[];
  loadingPublicNodes: boolean;
  savingToPublicNode: WorkflowNodeData | null;
  setSavingToPublicNode: React.Dispatch<React.SetStateAction<WorkflowNodeData | null>>;
  publicNodeName: string;
  setPublicNodeName: React.Dispatch<React.SetStateAction<string>>;
  publicNodeDescription: string;
  setPublicNodeDescription: React.Dispatch<React.SetStateAction<string>>;
  isSaveToPublicDialogOpen: boolean;
  setIsSaveToPublicDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deletePublicNodeId: string | null;
  setDeletePublicNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  isDeletePublicNodeDialogOpen: boolean;
  setIsDeletePublicNodeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // 函数
  loadPublicNodes: () => Promise<void>;
  handleSaveToPublicWithDialog: (nodeId: string, workflowNodes: WorkflowNodeData[]) => void;
  handleConfirmSaveToPublic: () => Promise<void>;
  handleDeletePublicNode: (nodeId: string) => Promise<void>;
}

/**
 * usePublicNodes Hook
 * 管理公共节点相关逻辑
 */
export function usePublicNodes({
  projectId,
  leftPanelTab,
}: UsePublicNodesParams): UsePublicNodesReturn {
  // 公共节点相关状态
  const [publicNodes, setPublicNodes] = useState<any[]>([]);
  const [loadingPublicNodes, setLoadingPublicNodes] = useState(false);
  const [savingToPublicNode, setSavingToPublicNode] = useState<WorkflowNodeData | null>(null);
  const [publicNodeName, setPublicNodeName] = useState<string>('');
  const [publicNodeDescription, setPublicNodeDescription] = useState<string>('');
  const [isSaveToPublicDialogOpen, setIsSaveToPublicDialogOpen] = useState(false);
  const [deletePublicNodeId, setDeletePublicNodeId] = useState<string | null>(null);
  const [isDeletePublicNodeDialogOpen, setIsDeletePublicNodeDialogOpen] = useState(false);

  // 加载公共节点列表
  const loadPublicNodes = useCallback(async () => {
    if (!projectId) {
      setPublicNodes([]);
      return;
    }
    try {
      setLoadingPublicNodes(true);
      const data = await workflowService.getPublicNodeList(projectId);
      setPublicNodes(data || []);
    } catch (error) {
      console.error('加载公共节点失败:', error);
      setPublicNodes([]);
    } finally {
      setLoadingPublicNodes(false);
    }
  }, [projectId]);

  // 加载公共节点列表
  useEffect(() => {
    if (leftPanelTab === 'public-nodes' && projectId) {
      loadPublicNodes();
    }
  }, [leftPanelTab, projectId, loadPublicNodes]);

  // 处理保存到公共节点对话框
  const handleSaveToPublicWithDialog = useCallback((nodeId: string, workflowNodes: WorkflowNodeData[]) => {
    const node = workflowNodes.find(n => n.id === nodeId);
    if (!node) {
      toast.error('节点不存在');
      return;
    }
    if (!projectId) {
      toast.error('请先选择项目');
      return;
    }
    // 排除开始和结束节点
    if (node.type === NodeType.START || node.type === NodeType.END) {
      toast.error('开始和结束节点不能保存为公共节点');
      return;
    }
    setSavingToPublicNode(node);
    setPublicNodeName(node.name);
    setPublicNodeDescription(node.description || '');
    setIsSaveToPublicDialogOpen(true);
  }, [projectId]);

  // 确认保存到公共节点
  const handleConfirmSaveToPublic = useCallback(async () => {
    if (!savingToPublicNode || !projectId) {
      return;
    }
    if (!publicNodeName.trim()) {
      toast.error('请输入节点名称');
      return;
    }
    const meta = NODE_META_REGISTRY[savingToPublicNode.type];
    if (!meta) {
      toast.error('节点类型不支持');
      return;
    }
    try {
      await workflowService.savePublicNode({
        projectId,
        name: publicNodeName.trim(),
        description: publicNodeDescription.trim() || undefined,
        type: savingToPublicNode.type,
        category: meta.category || 'other',
        config: savingToPublicNode.config || {},
      });
      toast.success('已保存到公共节点');
      setIsSaveToPublicDialogOpen(false);
      setSavingToPublicNode(null);
      setPublicNodeName('');
      setPublicNodeDescription('');
      // 刷新公共节点列表
      loadPublicNodes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || '保存失败');
    }
  }, [savingToPublicNode, projectId, publicNodeName, publicNodeDescription, loadPublicNodes]);

  // 处理删除公共节点
  const handleDeletePublicNode = useCallback(async (nodeId: string) => {
    if (!projectId) {
      toast.error('请先选择项目');
      return;
    }
    try {
      await workflowService.deletePublicNode(nodeId, projectId);
      toast.success('已删除公共节点');
      // 刷新公共节点列表
      loadPublicNodes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || '删除失败');
    }
  }, [projectId, loadPublicNodes]);

  return {
    // 状态
    publicNodes,
    loadingPublicNodes,
    savingToPublicNode,
    setSavingToPublicNode,
    publicNodeName,
    setPublicNodeName,
    publicNodeDescription,
    setPublicNodeDescription,
    isSaveToPublicDialogOpen,
    setIsSaveToPublicDialogOpen,
    deletePublicNodeId,
    setDeletePublicNodeId,
    isDeletePublicNodeDialogOpen,
    setIsDeletePublicNodeDialogOpen,
    // 函数
    loadPublicNodes,
    handleSaveToPublicWithDialog,
    handleConfirmSaveToPublic,
    handleDeletePublicNode,
  };
}
