/**
 * DialogsAndDrawers Component
 * 对话框和抽屉组件集合
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { ExecutionLogDrawer } from '../../workflow/ExecutionLogDrawer';
import { DebugHistoryDrawer } from '../../workflow/DebugHistoryDrawer';
import { SaveToPublicDialog, DeletePublicNodeDialog, ExecutionEnvironmentDialog } from './';
import type { ExecutionLog, DebugHistoryItem, DebugMode } from '../../workflow/types';
import type { WorkflowNodeData } from '@/components/workflow';
import type { EngineProfile } from '../hooks/useEngineProfiles';
import type { Dispatch, SetStateAction } from 'react';

interface DialogsAndDrawersProps {
  // ExecutionLogDrawer
  isExecutionDrawerOpen: boolean;
  setIsExecutionDrawerOpen: (open: boolean) => void;
  executionLogs: ExecutionLog[];
  setExecutionLogs: React.Dispatch<React.SetStateAction<ExecutionLog[]>>;
  isExecuting: boolean;
  debugMode: DebugMode;
  debugNodeId: string | null;
  
  // DebugHistoryDrawer
  isDebugHistoryDrawerOpen: boolean;
  setIsDebugHistoryDrawerOpen: (open: boolean) => void;
  debugHistoryList: DebugHistoryItem[];
  debugHistoryLoading: boolean;
  selectedHistoryRunId: string | null;
  setSelectedHistoryRunId: (runId: string | null) => void;
  historyDetail: any;
  workflowNodes: WorkflowNodeData[];
  handleDeleteHistory: (runId: string) => Promise<void>;
  handleViewHistoryDetail: (runId: string) => Promise<void>;
  
  // SaveToPublicDialog
  isSaveToPublicDialogOpen: boolean;
  setIsSaveToPublicDialogOpen: (open: boolean) => void;
  publicNodeName: string;
  setPublicNodeName: (name: string) => void;
  publicNodeDescription: string;
  setPublicNodeDescription: (description: string) => void;
  handleConfirmSaveToPublic: () => Promise<void>;
  
  // DeletePublicNodeDialog
  isDeletePublicNodeDialogOpen: boolean;
  setIsDeletePublicNodeDialogOpen: (open: boolean) => void;
  deletePublicNodeId: string | null;
  setDeletePublicNodeId: (id: string | null) => void;
  publicNodes: any[];
  handleDeletePublicNode: (nodeId: string) => Promise<void>;
  
  // ExecutionEnvironmentDialog
  isExecutionEnvironmentDialogOpen: boolean;
  setIsExecutionEnvironmentDialogOpen: (open: boolean) => void;
  setExecutionEnvironmentId: (id: string) => void;
  setPendingExecutionType: Dispatch<SetStateAction<'debug' | 'run' | null>>;
  setPendingDebugNodeId: (nodeId: string | null) => void;
  setUserVariableXTagHeader: (value: string) => void;
  setUserVariableXSiteTenant: (value: string) => void;
  setUserVariableXTenantId: (value: string) => void;
  setUserVariableXApp: (value: string) => void;
  pendingExecutionType: 'debug' | 'run' | null;
  executionEnvironmentId: string;
  loadingProfiles: boolean;
  engineProfiles: EngineProfile[];
  userVariableXTagHeader: string;
  userVariableXSiteTenant: string;
  userVariableXTenantId: string;
  userVariableXApp: string;
  handleConfirmExecution: () => Promise<void>;
}

export const DialogsAndDrawers: React.FC<DialogsAndDrawersProps> = ({
  isExecutionDrawerOpen,
  setIsExecutionDrawerOpen,
  executionLogs,
  setExecutionLogs,
  isExecuting,
  debugMode,
  debugNodeId,
  isDebugHistoryDrawerOpen,
  setIsDebugHistoryDrawerOpen,
  debugHistoryList,
  debugHistoryLoading,
  selectedHistoryRunId,
  setSelectedHistoryRunId,
  historyDetail,
  workflowNodes,
  handleDeleteHistory,
  handleViewHistoryDetail,
  isSaveToPublicDialogOpen,
  setIsSaveToPublicDialogOpen,
  publicNodeName,
  setPublicNodeName,
  publicNodeDescription,
  setPublicNodeDescription,
  handleConfirmSaveToPublic,
  isDeletePublicNodeDialogOpen,
  setIsDeletePublicNodeDialogOpen,
  deletePublicNodeId,
  setDeletePublicNodeId,
  publicNodes,
  handleDeletePublicNode,
  isExecutionEnvironmentDialogOpen,
  setIsExecutionEnvironmentDialogOpen,
  setExecutionEnvironmentId,
  setPendingExecutionType,
  setPendingDebugNodeId,
  setUserVariableXTagHeader,
  setUserVariableXSiteTenant,
  setUserVariableXTenantId,
  setUserVariableXApp,
  pendingExecutionType,
  executionEnvironmentId,
  loadingProfiles,
  engineProfiles,
  userVariableXTagHeader,
  userVariableXSiteTenant,
  userVariableXTenantId,
  userVariableXApp,
  handleConfirmExecution,
}) => {
  return (
    <>
      <ExecutionLogDrawer
        open={isExecutionDrawerOpen}
        onOpenChange={setIsExecutionDrawerOpen}
        logs={executionLogs}
        isExecuting={isExecuting}
        debugMode={debugMode}
        debugNodeId={debugNodeId}
        onClearLogs={() => setExecutionLogs([])}
        onUpdateLogs={(updater) => setExecutionLogs(updater)}
      />

      <DebugHistoryDrawer
        open={isDebugHistoryDrawerOpen}
        onOpenChange={setIsDebugHistoryDrawerOpen}
        historyList={debugHistoryList}
        loading={debugHistoryLoading}
        selectedRunId={selectedHistoryRunId}
        historyDetail={historyDetail}
        workflowNodes={workflowNodes}
        onSelectHistory={setSelectedHistoryRunId}
        onDeleteHistory={handleDeleteHistory}
        onLoadDetail={handleViewHistoryDetail}
      />

      <SaveToPublicDialog
        open={isSaveToPublicDialogOpen}
        onOpenChange={setIsSaveToPublicDialogOpen}
        publicNodeName={publicNodeName}
        setPublicNodeName={setPublicNodeName}
        publicNodeDescription={publicNodeDescription}
        setPublicNodeDescription={setPublicNodeDescription}
        onConfirm={handleConfirmSaveToPublic}
      />

      <DeletePublicNodeDialog
        open={isDeletePublicNodeDialogOpen}
        onOpenChange={setIsDeletePublicNodeDialogOpen}
        publicNodeName={publicNodes.find(n => n.id === deletePublicNodeId)?.name || ''}
        onConfirm={async () => {
          if (deletePublicNodeId) {
            await handleDeletePublicNode(deletePublicNodeId);
            setDeletePublicNodeId(null);
            setIsDeletePublicNodeDialogOpen(false);
          }
        }}
        onCancel={() => {
          setDeletePublicNodeId(null);
          setIsDeletePublicNodeDialogOpen(false);
        }}
      />

      <ExecutionEnvironmentDialog
        open={isExecutionEnvironmentDialogOpen}
        onOpenChange={(open) => {
          setIsExecutionEnvironmentDialogOpen(open);
          if (!open) {
            setExecutionEnvironmentId('');
            setPendingExecutionType(null);
            setPendingDebugNodeId(null);
            // 不再清空请求头，保留用户已设置的值供下次运行测试使用
          }
        }}
        pendingExecutionType={pendingExecutionType}
        executionEnvironmentId={executionEnvironmentId}
        setExecutionEnvironmentId={setExecutionEnvironmentId}
        loadingProfiles={loadingProfiles}
        engineProfiles={engineProfiles}
        userVariableXTagHeader={userVariableXTagHeader}
        setUserVariableXTagHeader={setUserVariableXTagHeader}
        userVariableXSiteTenant={userVariableXSiteTenant}
        setUserVariableXSiteTenant={setUserVariableXSiteTenant}
        userVariableXTenantId={userVariableXTenantId}
        setUserVariableXTenantId={setUserVariableXTenantId}
        userVariableXApp={userVariableXApp}
        setUserVariableXApp={setUserVariableXApp}
        onConfirm={handleConfirmExecution}
      />
    </>
  );
};
