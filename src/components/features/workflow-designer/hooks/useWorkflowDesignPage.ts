/**
 * useWorkflowDesignPage Hook
 * 整合工作流设计页面的所有状态和逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { convertHttpConfigToRequestConfig } from '../utils/nodeConverter';
import { getSortedNodes as getSortedNodesUtil } from '../utils/nodeSorter';
import type { NodeType, WorkflowNodeData } from '@/components/workflow';
import { NODE_META_REGISTRY } from '@/components/workflow';
import {
  useMetadataSync,
  useWorkflowEditor,
  useNodeManagement,
  useCanvasOperations,
  useWorkflowSave,
  useWorkflowRun,
  usePublicNodes,
  useEngineProfiles,
  useKeyboardShortcuts,
  useWorkflowHistory,
  useWebSocket,
  useNodeOperations,
  useFullscreen,
  useDragAndDrop,
  useNodeFilter,
  useCategoryToggle,
} from './';

interface UseWorkflowDesignPageParams {
  externalViewMode?: 'canvas' | 'steps';
  externalFullscreen?: boolean;
  externalToggleFullscreen?: () => void;
  externalWorkflowId?: string;
  externalModuleId?: string;
  externalProjectId?: string;
  onSaveCallback?: () => Promise<void>;
  /** 受控执行环境：父组件（如 E2E 嵌入页）传入后，运行/调试使用当前选中环境 */
  controlledExecutionEnvironmentId?: string;
  setControlledExecutionEnvironmentId?: (id: string) => void;
}

export function useWorkflowDesignPage({
  externalViewMode,
  externalFullscreen,
  externalToggleFullscreen,
  externalWorkflowId,
  externalModuleId,
  externalProjectId,
  onSaveCallback,
  controlledExecutionEnvironmentId,
  setControlledExecutionEnvironmentId,
}: UseWorkflowDesignPageParams) {
  const viewMode: 'canvas' | 'steps' = externalViewMode ?? 'canvas';
  const [searchParams] = useSearchParams();
  const workflowId = externalWorkflowId || searchParams.get('id') || undefined;
  const projectId = externalProjectId || localStorage.getItem('currentProjectId') || '';
  const [moduleId, setModuleId] = useState<string | undefined>(externalModuleId || searchParams.get('moduleId') || undefined);
  const { user } = useUser();
  const [selectedGlobalEnvironmentId, setSelectedGlobalEnvironmentId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (externalModuleId) {
      setModuleId(externalModuleId);
    }
  }, [externalModuleId]);

  const {
    workflow,
    setWorkflow,
    loading,
    loadWorkflowData,
    originalNodesOrderRef,
  } = useWorkflowEditor({
    workflowId,
    moduleId,
    setModuleId,
    viewMode,
  });

  const { filteredCategories } = useNodeFilter({ searchKeyword });
  const { expandedCategories, toggleCategory } = useCategoryToggle(['api', 'data', 'logic', 'script']);

  const {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    canvasStateRef,
    leftPanelTab,
    setLeftPanelTab,
  } = useCanvasOperations({
    viewMode,
  });

  const {
    workflowHistory,
    loadingHistory,
    setLoadingHistory,
    historySearchKeyword,
    setHistorySearchKeyword,
    loadWorkflowHistory,
  } = useWorkflowHistory({
    workflowId,
    projectId,
    userId: user?.id,
    leftPanelTab,
  });

  const {
    moduleTree,
    definitions,
    loadingMetadata,
    metadataSearchKeyword,
    setMetadataSearchKeyword,
    expandedMetadataFolders,
    toggleMetadataFolder,
    loadingPluginSyncNodes,
    pluginSyncNodes,
    metadataTypes,
    metadataCategories,
    metadataItems,
  } = useMetadataSync({
    projectId,
    leftPanelTab,
  });

  const {
    publicNodes,
    loadingPublicNodes,
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
    handleSaveToPublicWithDialog: handleSaveToPublicWithDialogFromHook,
    handleConfirmSaveToPublic,
    handleDeletePublicNode,
  } = usePublicNodes({
    projectId,
    leftPanelTab,
  });

  const getSortedNodes = useCallback(() => {
    return getSortedNodesUtil(workflow, viewMode);
  }, [workflow, viewMode]);

  const {
    selectedNodeId,
    setSelectedNodeId,
    activeDragId,
    setActiveDragId,
    handleAddNode,
    handleDeleteNode,
    handleCopyNode,
    handlePasteNode,
  } = useNodeManagement({
    workflow,
    setWorkflow,
    viewMode,
    getSortedNodes,
  });

  const {
    handleSave,
  } = useWorkflowSave({
    workflow,
    setWorkflow,
    projectId,
    moduleId,
    workflowId,
    viewMode,
    selectedGlobalEnvironmentId,
    originalNodesOrderRef,
    loadWorkflowData,
    onSaveCallback,
  });

  const connectWebSocketRef = useRef<((runId: string) => void) | undefined>(undefined);

  const {
    executionLogs,
    setExecutionLogs,
    isExecuting,
    setIsExecuting,
    isExecutionDrawerOpen,
    setIsExecutionDrawerOpen,
    debugMode,
    setDebugMode,
    debugNodeId,
    setDebugNodeId,
    isDebugHistoryDrawerOpen,
    setIsDebugHistoryDrawerOpen,
    debugHistoryList,
    debugHistoryLoading,
    selectedHistoryRunId,
    setSelectedHistoryRunId,
    historyDetail,
    isExecutionEnvironmentDialogOpen,
    setIsExecutionEnvironmentDialogOpen,
    executionEnvironmentId,
    setExecutionEnvironmentId,
    pendingExecutionType,
    setPendingExecutionType,
    pendingDebugNodeId,
    setPendingDebugNodeId,
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    handleDebugNode,
    handleRunWorkflow,
    handleShowDebugHistory,
    handleConfirmExecution,
    handleViewHistoryDetail,
    handleDeleteHistory,
    debugPollIntervalRef: debugPollIntervalRefFromHook,
  } = useWorkflowRun({
    workflow,
    workflowId,
    projectId,
    selectedGlobalEnvironmentId,
    user: user || undefined,
    onWebSocketConnect: undefined,
    onWebSocketConnectRef: connectWebSocketRef,
    onLoadWorkflowHistory: loadWorkflowHistory,
    convertHttpConfigToRequestConfig,
    controlledExecutionEnvironmentId,
    setControlledExecutionEnvironmentId,
  });

  const {
    connectWebSocketForRun,
    disconnectWebSocket,
  } = useWebSocket({
    onExecutionLogsUpdate: setExecutionLogs,
    onExecutionComplete: () => setIsExecuting(false),
    onLoadWorkflowHistory: loadWorkflowHistory,
    isExecuting,
  });

  // 设置 ref，确保 useWorkflowRun 可以访问到 connectWebSocketForRun
  useEffect(() => {
    connectWebSocketRef.current = connectWebSocketForRun;
  }, [connectWebSocketForRun]);

  const {
    isFullscreen,
    internalFullscreenContainerRef,
    internalHandleToggleFullscreen,
  } = useFullscreen({
    externalFullscreen,
    externalToggleFullscreen,
  });

  const {
    engineProfiles,
    loadingProfiles,
    handleGlobalEnvironmentChange: handleGlobalEnvironmentChangeFromHook,
  } = useEngineProfiles({
    projectId,
    selectedGlobalEnvironmentId,
  });

  const handleGlobalEnvironmentChange = useCallback((environmentId: string | null) => {
    setSelectedGlobalEnvironmentId(environmentId);
    handleGlobalEnvironmentChangeFromHook(environmentId);
  }, [handleGlobalEnvironmentChangeFromHook]);

  useEffect(() => {
    return () => {
      if (debugPollIntervalRefFromHook?.current) {
        clearInterval(debugPollIntervalRefFromHook.current);
        debugPollIntervalRefFromHook.current = null;
      }
      disconnectWebSocket();
    };
  }, [debugPollIntervalRefFromHook, disconnectWebSocket]);

  useEffect(() => {
    loadWorkflowData();
  }, [loadWorkflowData]);

  useEffect(() => {
    if (workflowId) {
      const savedZoom = canvasStateRef.current.zoom;
      const savedPanOffset = canvasStateRef.current.panOffset;
      loadWorkflowData().then(() => {
        if (savedZoom !== 1) {
          setZoom(savedZoom);
        }
        if (savedPanOffset.x !== 0 || savedPanOffset.y !== 0) {
          setPanOffset(savedPanOffset);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const {
    convertDefinitionToNode,
    handleUpdateNodeConfig,
    handleUpdateNodeName,
    handleNodeSave,
  } = useNodeOperations({
    workflow,
    setWorkflow,
    handleSave,
  });

  const handleSaveToPublicWithDialog = useCallback((nodeId: string) => {
    handleSaveToPublicWithDialogFromHook(nodeId, workflow.nodes);
  }, [handleSaveToPublicWithDialogFromHook, workflow.nodes]);

  // 处理从左侧拖拽节点到画布
  const handleAddNodeToCanvas = useCallback((nodeType: NodeType, clientX: number, clientY: number) => {
    const canvasElement = document.getElementById('canvas-drop-zone');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    // 计算相对于画布容器的坐标（屏幕坐标转容器坐标）
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    // 转换为画布坐标系统
    // canvas-content 的 transform 是: translate(panOffset.x, panOffset.y) scale(zoom)
    // 所以反向转换：先减去平移，再除以缩放
    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 180;
    const canvasX = (relativeX - panOffset.x) / zoom - NODE_WIDTH / 2;
    const canvasY = (relativeY - panOffset.y) / zoom - NODE_HEIGHT / 2;
    
    // 创建新节点
    const meta = NODE_META_REGISTRY[nodeType];
    if (!meta) return;

    const newNode: WorkflowNodeData = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType,
      name: meta.name,
      description: meta.description,
      config: meta.defaultConfig || {},
      x: canvasX,
      y: canvasY,
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    
    setSelectedNodeId(newNode.id);
  }, [zoom, panOffset, setWorkflow, setSelectedNodeId]);

  const {
    sensors,
    handleDragStart,
    handleDragEnd,
  } = useDragAndDrop({
    workflow,
    setWorkflow,
    viewMode,
    getSortedNodes,
    originalNodesOrderRef,
    activeDragId,
    setActiveDragId,
    handleAddNodeToCanvas,
  });

  useKeyboardShortcuts({
    selectedNodeId,
    handleDeleteNode,
    handleCopyNode,
    handlePasteNode,
  });

  const isDataLoaded = useCallback(() => {
    if (workflowId) {
      return !loading && workflow.nodes.length > 0;
    }
    return true;
  }, [workflowId, loading, workflow.nodes.length]);

  return {
    // 基础状态
    viewMode,
    workflowId,
    projectId,
    loading,
    workflow,
    setWorkflow,
    // 搜索和过滤
    searchKeyword,
    setSearchKeyword,
    filteredCategories,
    expandedCategories,
    toggleCategory,
    // 画布操作
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    leftPanelTab,
    setLeftPanelTab,
    // 节点管理
    selectedNodeId,
    setSelectedNodeId,
    activeDragId,
    handleAddNode,
    handleDeleteNode,
    handleCopyNode,
    handlePasteNode,
    getSortedNodes,
    // 工作流操作
    handleSave,
    handleRunWorkflow,
    handleShowDebugHistory,
    isDataLoaded,
    // 节点操作
    convertDefinitionToNode,
    handleUpdateNodeConfig,
    handleUpdateNodeName,
    handleNodeSave,
    handleSaveToPublicWithDialog,
    // 拖拽
    sensors,
    handleDragStart,
    handleDragEnd,
    // 全屏
    isFullscreen,
    internalFullscreenContainerRef,
    internalHandleToggleFullscreen,
    // 公共节点
    publicNodes,
    loadingPublicNodes,
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
    handleConfirmSaveToPublic,
    handleDeletePublicNode,
    // 元数据
    metadataSearchKeyword,
    setMetadataSearchKeyword,
    loadingMetadata,
    loadingPluginSyncNodes,
    expandedMetadataFolders,
    toggleMetadataFolder,
    metadataTypes,
    metadataCategories,
    metadataItems,
    moduleTree,
    definitions,
    pluginSyncNodes,
    // 历史
    historySearchKeyword,
    setHistorySearchKeyword,
    loadingHistory,
    setLoadingHistory,
    workflowHistory,
    // 执行相关
    executionLogs,
    setExecutionLogs,
    isExecuting,
    setIsExecuting,
    isExecutionDrawerOpen,
    setIsExecutionDrawerOpen,
    debugMode,
    setDebugMode,
    debugNodeId,
    setDebugNodeId,
    isDebugHistoryDrawerOpen,
    setIsDebugHistoryDrawerOpen,
    debugHistoryList,
    debugHistoryLoading,
    selectedHistoryRunId,
    setSelectedHistoryRunId,
    historyDetail,
    handleDeleteHistory,
    handleViewHistoryDetail,
    // 执行环境
    isExecutionEnvironmentDialogOpen,
    setIsExecutionEnvironmentDialogOpen,
    executionEnvironmentId,
    setExecutionEnvironmentId,
    pendingExecutionType,
    setPendingExecutionType,
    pendingDebugNodeId,
    setPendingDebugNodeId,
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    handleDebugNode,
    handleConfirmExecution,
    engineProfiles,
    loadingProfiles,
  };
}
