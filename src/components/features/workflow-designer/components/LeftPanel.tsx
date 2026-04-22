/**
 * LeftPanel Component
 * 左侧面板组件
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { NodePanel, MetadataPanel, HistoryPanel, PublicNodesPanel, LeftPanelTabs } from './';
import type { WorkflowData, NodeType } from '@/components/workflow';
import type { MetadataDefinition, MetadataModuleNode, PluginSyncNode } from '@/services/metadata';
import type { NodeCategory } from '../types';

interface LeftPanelProps {
  leftPanelTab: 'public-nodes' | 'nodes' | 'metadata' | 'history';
  setLeftPanelTab: (tab: 'public-nodes' | 'nodes' | 'metadata' | 'history') => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  expandedCategories: string[];
  toggleCategory: (categoryId: string) => void;
  filteredCategories: NodeCategory[];
  loadingPublicNodes: boolean;
  publicNodes: any[];
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  onDeletePublicNode: (nodeId: string) => void;
  handleAddNode: (nodeType: NodeType) => void;
  metadataSearchKeyword: string;
  setMetadataSearchKeyword: (keyword: string) => void;
  loadingMetadata: boolean;
  loadingPluginSyncNodes: boolean;
  expandedMetadataFolders: Set<string>;
  toggleMetadataFolder: (folderId: string) => void;
  metadataTypes: Array<{ id: string; name: string; count: number; icon: string; moduleIds: string[] }>;
  metadataCategories: Array<{ id: string; name: string; typeId: string; count: number; path: string }>;
  metadataItems: Array<{ id: string; name: string; type: string; groupId: string; category: string; protocol: string }>;
  moduleTree: MetadataModuleNode[];
  definitions: MetadataDefinition[];
  pluginSyncNodes: PluginSyncNode[];
  convertDefinitionToNode: (definition: MetadataDefinition) => void;
  historySearchKeyword: string;
  setHistorySearchKeyword: (keyword: string) => void;
  loadingHistory: boolean;
  setLoadingHistory: (loading: boolean) => void;
  workflowHistory: any[];
  setExecutionLogs: React.Dispatch<React.SetStateAction<any[]>>;
  setDebugMode: (mode: any) => void;
  setDebugNodeId: (nodeId: string | null) => void;
  setIsExecuting: (executing: boolean) => void;
  setIsExecutionDrawerOpen: (open: boolean) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  leftPanelTab,
  setLeftPanelTab,
  searchKeyword,
  setSearchKeyword,
  expandedCategories,
  toggleCategory,
  filteredCategories,
  loadingPublicNodes,
  publicNodes,
  workflow,
  setWorkflow,
  onDeletePublicNode,
  handleAddNode,
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
  convertDefinitionToNode,
  historySearchKeyword,
  setHistorySearchKeyword,
  loadingHistory,
  setLoadingHistory,
  workflowHistory,
  setExecutionLogs,
  setDebugMode,
  setDebugNodeId,
  setIsExecuting,
  setIsExecutionDrawerOpen,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      <div className="border-b border-gray-200 flex-shrink-0 px-2 py-2">
        <LeftPanelTabs 
          value={leftPanelTab} 
          onValueChange={(v) => setLeftPanelTab(v as 'public-nodes' | 'nodes' | 'metadata' | 'history')} 
        />
      </div>

      {leftPanelTab === 'public-nodes' && (
        <PublicNodesPanel
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          loadingPublicNodes={loadingPublicNodes}
          publicNodes={publicNodes}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          workflow={workflow}
          setWorkflow={setWorkflow}
          onDeletePublicNode={onDeletePublicNode}
        />
      )}

      {leftPanelTab === 'nodes' && (
        <NodePanel
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          filteredCategories={filteredCategories}
          handleAddNode={handleAddNode}
        />
      )}

      {leftPanelTab === 'metadata' && (
        <MetadataPanel
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
          workflow={workflow}
          setWorkflow={setWorkflow}
          convertDefinitionToNode={convertDefinitionToNode}
        />
      )}

      {leftPanelTab === 'history' && (
        <HistoryPanel
          historySearchKeyword={historySearchKeyword}
          setHistorySearchKeyword={setHistorySearchKeyword}
          loadingHistory={loadingHistory}
          setLoadingHistory={setLoadingHistory}
          workflowHistory={workflowHistory}
          workflow={workflow}
          setExecutionLogs={setExecutionLogs}
          setDebugMode={setDebugMode}
          setDebugNodeId={setDebugNodeId}
          setIsExecuting={setIsExecuting}
          setIsExecutionDrawerOpen={setIsExecutionDrawerOpen}
        />
      )}
    </aside>
  );
};
