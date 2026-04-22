/**
 * MainContent Component
 * 主内容区组件（画布区域或步骤列表）
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { WorkflowCanvas, type WorkflowData, type WorkflowNodeData } from '@/components/workflow';
import { StepsModeView } from './';
import { handleWorkflowCanvasChange } from '../utils/workflowCanvasHandler';
import type { SensorDescriptor } from '@dnd-kit/core';

interface MainContentProps {
  viewMode: 'canvas' | 'steps';
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  getSortedNodes: () => WorkflowNodeData[];
  selectedNodeId: string | null;
  activeDragId: string | null;
  sensors: SensorDescriptor<any>[];
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onSelectNode: (nodeId: string | null) => void;
  onCopyNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  panOffset: { x: number; y: number };
  setPanOffset: (offset: { x: number; y: number }) => void;
  onSaveToPublic: (nodeId: string) => void;
  onNodeSave: (nodeId: string) => Promise<void>;
  onSave: () => Promise<boolean>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onDebugNode: (nodeId: string) => Promise<void>;
  onRunWorkflow: () => Promise<void>;
}

export const MainContent: React.FC<MainContentProps> = ({
  viewMode,
  workflow,
  setWorkflow,
  getSortedNodes,
  selectedNodeId,
  activeDragId,
  sensors,
  onDragStart,
  onDragEnd,
  onSelectNode,
  onCopyNode,
  onDeleteNode,
  zoom,
  setZoom,
  panOffset,
  setPanOffset,
  onSaveToPublic,
  onNodeSave,
  onSave,
  isFullscreen,
  onToggleFullscreen,
  onDebugNode,
  onRunWorkflow,
}) => {
  return (
    <main className="flex-1 min-w-0 relative">
      {viewMode === 'steps' ? (
        <StepsModeView
          nodes={workflow.nodes}
          getSortedNodes={getSortedNodes}
          selectedNodeId={selectedNodeId}
          activeDragId={activeDragId}
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onSelectNode={onSelectNode}
          onCopyNode={onCopyNode}
          onDeleteNode={onDeleteNode}
        />
      ) : (
        <WorkflowCanvas
          workflow={workflow}
          zoom={zoom}
          onZoomChange={setZoom}
          panOffset={panOffset}
          onPanOffsetChange={setPanOffset}
          onSaveToPublic={onSaveToPublic}
          onNodeSave={onNodeSave}
          onChange={(updatedWorkflow) => {
            handleWorkflowCanvasChange(updatedWorkflow, workflow, viewMode, setWorkflow);
          }}
          onSave={onSave}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          onDebugNode={onDebugNode}
          onRunWorkflow={onRunWorkflow}
        />
      )}
    </main>
  );
};
