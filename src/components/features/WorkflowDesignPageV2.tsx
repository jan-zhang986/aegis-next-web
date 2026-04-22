import React, { forwardRef, useImperativeHandle } from 'react';
import { DndContext } from '@dnd-kit/core';
import { cn } from '@/utils/cn';
import { LoadingView, LeftPanel, DialogsAndDrawers, MainContent, StepsModeSidebar } from './workflow-designer/components';
import { useWorkflowDesignPage } from './workflow-designer/hooks';

interface WorkflowDesignPageV2Props {
  viewMode?: 'canvas' | 'steps';
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  workflowId?: string; // 外部传入的工作流ID
  moduleId?: string; // 外部传入的模块ID
  projectId?: string; // 外部传入的项目ID
  onSave?: () => Promise<void>; // 保存成功后的回调
  /** 受控模式：由父组件传入执行环境 ID 和 setter（用于嵌入页如 E2E 空间） */
  executionEnvironmentId?: string;
  setExecutionEnvironmentId?: (id: string) => void;
}

export interface WorkflowDesignPageV2Ref {
  handleSave: () => Promise<boolean>;
  /** 可选 overrides.userVariables：由外部传入请求头（如 E2E 嵌入页工具栏） */
  handleRunWorkflow: (overrides?: { userVariables?: Record<string, string> }) => Promise<void>;
  handleShowDebugHistory?: () => Promise<void>;
  isDataLoaded?: () => boolean; // 检查数据是否已加载完成
  // 执行环境相关
  executionEnvironmentId?: string;
  setExecutionEnvironmentId?: (id: string) => void;
  engineProfiles?: any[];
  loadingProfiles?: boolean;
  // 用户变量相关
  userVariableXTagHeader?: string;
  setUserVariableXTagHeader?: (value: string) => void;
  userVariableXSiteTenant?: string;
  setUserVariableXSiteTenant?: (value: string) => void;
  userVariableXTenantId?: string;
  setUserVariableXTenantId?: (value: string) => void;
  userVariableXApp?: string;
  setUserVariableXApp?: (value: string) => void;
  projectId?: string;
}

const WorkflowDesignPageV2 = forwardRef<WorkflowDesignPageV2Ref, WorkflowDesignPageV2Props>(function WorkflowDesignPageV2({ 
  viewMode: externalViewMode,
  isFullscreen: externalFullscreen, 
  onToggleFullscreen: externalToggleFullscreen,
  workflowId: externalWorkflowId,
  moduleId: externalModuleId,
  projectId: externalProjectId,
  onSave: onSaveCallback,
  executionEnvironmentId: controlledExecutionEnvironmentId,
  setExecutionEnvironmentId: setControlledExecutionEnvironmentId,
}, ref) {
  const {
    viewMode,
          projectId,
    loading,
    workflow,
    setWorkflow,
    searchKeyword,
    setSearchKeyword,
    filteredCategories,
    expandedCategories,
    toggleCategory,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    leftPanelTab,
    setLeftPanelTab,
    selectedNodeId,
    setSelectedNodeId,
    activeDragId,
    handleAddNode,
    handleDeleteNode,
    handleCopyNode,
    handlePasteNode,
    getSortedNodes,
    handleSave,
    handleRunWorkflow,
    handleShowDebugHistory,
    isDataLoaded,
    convertDefinitionToNode,
    handleUpdateNodeConfig,
    handleUpdateNodeName,
    handleNodeSave,
    handleSaveToPublicWithDialog,
    sensors,
    handleDragStart,
    handleDragEnd,
    isFullscreen,
    internalFullscreenContainerRef,
    internalHandleToggleFullscreen,
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
    historySearchKeyword,
    setHistorySearchKeyword,
    loadingHistory,
    setLoadingHistory,
    workflowHistory,
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
  } = useWorkflowDesignPage({
    externalViewMode,
    externalFullscreen,
    externalToggleFullscreen,
    externalWorkflowId,
    externalModuleId,
    externalProjectId,
    onSaveCallback,
    controlledExecutionEnvironmentId,
    setControlledExecutionEnvironmentId,
  });

  useImperativeHandle(ref, () => ({
    handleSave,
    handleRunWorkflow,
    handleShowDebugHistory,
    isDataLoaded,
    executionEnvironmentId,
    setExecutionEnvironmentId,
    engineProfiles,
    loadingProfiles,
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    projectId,
  }), [
    handleSave,
    handleRunWorkflow,
    handleShowDebugHistory,
    isDataLoaded,
    executionEnvironmentId,
    setExecutionEnvironmentId,
    engineProfiles,
    loadingProfiles,
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    projectId,
  ]);

  if (loading) {
    return <LoadingView />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        ref={externalFullscreen === undefined ? internalFullscreenContainerRef : undefined}
        className={cn(
          "h-full w-full flex flex-col bg-gray-100",
          externalFullscreen === undefined && isFullscreen && "fixed inset-0 z-[9999] bg-gray-100 h-screen w-screen"
        )}
      >

        {/* 主内容区（步骤模式下详情抽屉为浮层，需 relative 定位） */}
        <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧节点面板 */}
        <LeftPanel
          leftPanelTab={leftPanelTab}
          setLeftPanelTab={setLeftPanelTab}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          filteredCategories={filteredCategories}
          loadingPublicNodes={loadingPublicNodes}
          publicNodes={publicNodes}
          workflow={workflow}
          setWorkflow={setWorkflow}
          onDeletePublicNode={(nodeId) => {
            setDeletePublicNodeId(nodeId);
                                          setIsDeletePublicNodeDialogOpen(true);
                                        }}
          handleAddNode={handleAddNode}
          metadataSearchKeyword={metadataSearchKeyword}
          setMetadataSearchKeyword={setMetadataSearchKeyword}
          loadingMetadata={loadingMetadata}
          loadingPluginSyncNodes={loadingPluginSyncNodes}
          expandedMetadataFolders={expandedMetadataFolders}
          toggleMetadataFolder={toggleMetadataFolder}
          metadataTypes={metadataTypes}
          metadataCategories={metadataCategories}
          metadataItems={metadataItems}
          moduleTree={moduleTree}
          definitions={definitions}
          pluginSyncNodes={pluginSyncNodes}
          convertDefinitionToNode={convertDefinitionToNode}
          historySearchKeyword={historySearchKeyword}
          setHistorySearchKeyword={setHistorySearchKeyword}
          loadingHistory={loadingHistory}
          setLoadingHistory={setLoadingHistory}
          workflowHistory={workflowHistory}
          setExecutionLogs={setExecutionLogs}
          setDebugMode={setDebugMode}
          setDebugNodeId={setDebugNodeId}
          setIsExecuting={setIsExecuting}
          setIsExecutionDrawerOpen={setIsExecutionDrawerOpen}
        />

        {/* 画布区域或步骤列表 */}
        <MainContent
          viewMode={viewMode}
          workflow={workflow}
          setWorkflow={setWorkflow}
          getSortedNodes={getSortedNodes}
          selectedNodeId={selectedNodeId}
          activeDragId={activeDragId}
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
          onSelectNode={setSelectedNodeId}
          onCopyNode={handleCopyNode}
          onDeleteNode={handleDeleteNode}
              zoom={zoom}
          setZoom={setZoom}
              panOffset={panOffset}
          setPanOffset={setPanOffset}
          onSaveToPublic={handleSaveToPublicWithDialog}
              onNodeSave={handleNodeSave}
              onSave={handleSave}
              isFullscreen={isFullscreen}
              onToggleFullscreen={externalToggleFullscreen || internalHandleToggleFullscreen}
              onDebugNode={handleDebugNode}
              onRunWorkflow={handleRunWorkflow}
            />
        
        {/* 步骤模式下的节点编辑面板 */}
        <StepsModeSidebar
          viewMode={viewMode}
          workflow={workflow}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          handleUpdateNodeConfig={handleUpdateNodeConfig}
          handleUpdateNodeName={handleUpdateNodeName}
          handleNodeSave={handleNodeSave}
                  projectId={projectId}
                  onDebugNode={handleDebugNode}
                />
      </div>

      {/* 对话框和抽屉 */}
      <DialogsAndDrawers
        isExecutionDrawerOpen={isExecutionDrawerOpen}
        setIsExecutionDrawerOpen={setIsExecutionDrawerOpen}
        executionLogs={executionLogs}
        setExecutionLogs={setExecutionLogs}
        isExecuting={isExecuting}
        debugMode={debugMode}
        debugNodeId={debugNodeId}
        isDebugHistoryDrawerOpen={isDebugHistoryDrawerOpen}
        setIsDebugHistoryDrawerOpen={setIsDebugHistoryDrawerOpen}
        debugHistoryList={debugHistoryList}
        debugHistoryLoading={debugHistoryLoading}
        selectedHistoryRunId={selectedHistoryRunId}
        setSelectedHistoryRunId={setSelectedHistoryRunId}
        historyDetail={historyDetail}
        workflowNodes={workflow.nodes}
        handleDeleteHistory={handleDeleteHistory}
        handleViewHistoryDetail={handleViewHistoryDetail}
        isSaveToPublicDialogOpen={isSaveToPublicDialogOpen}
        setIsSaveToPublicDialogOpen={setIsSaveToPublicDialogOpen}
        publicNodeName={publicNodeName}
        setPublicNodeName={setPublicNodeName}
        publicNodeDescription={publicNodeDescription}
        setPublicNodeDescription={setPublicNodeDescription}
        handleConfirmSaveToPublic={handleConfirmSaveToPublic}
        isDeletePublicNodeDialogOpen={isDeletePublicNodeDialogOpen}
        setIsDeletePublicNodeDialogOpen={setIsDeletePublicNodeDialogOpen}
        deletePublicNodeId={deletePublicNodeId}
        setDeletePublicNodeId={setDeletePublicNodeId}
        publicNodes={publicNodes}
        handleDeletePublicNode={handleDeletePublicNode}
        isExecutionEnvironmentDialogOpen={isExecutionEnvironmentDialogOpen}
        setIsExecutionEnvironmentDialogOpen={setIsExecutionEnvironmentDialogOpen}
        setExecutionEnvironmentId={setExecutionEnvironmentId}
        setPendingExecutionType={setPendingExecutionType}
        setPendingDebugNodeId={setPendingDebugNodeId}
        setUserVariableXTagHeader={setUserVariableXTagHeader}
        setUserVariableXSiteTenant={setUserVariableXSiteTenant}
        setUserVariableXTenantId={setUserVariableXTenantId}
        setUserVariableXApp={setUserVariableXApp}
        pendingExecutionType={pendingExecutionType}
        executionEnvironmentId={executionEnvironmentId}
        loadingProfiles={loadingProfiles}
        engineProfiles={engineProfiles}
        userVariableXTagHeader={userVariableXTagHeader}
        userVariableXSiteTenant={userVariableXSiteTenant}
        userVariableXTenantId={userVariableXTenantId}
        userVariableXApp={userVariableXApp}
        handleConfirmExecution={handleConfirmExecution}
      />
      </div>
    </DndContext>
  );
});

export default WorkflowDesignPageV2;

