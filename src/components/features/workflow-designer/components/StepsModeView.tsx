/**
 * StepsModeView Component
 * 步骤模式视图组件
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { List, Circle, Play, Square, Globe, Database, Zap, Wifi, GitBranch, Repeat, Code, Variable, MessageSquare } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { WorkflowNodeData } from '@/components/workflow';
import { NODE_META_REGISTRY } from '@/components/workflow';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import { SortableStepItem } from './SortableStepItem';

// 图标映射（与 SortableStepItem 保持一致）
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Play, Square, Globe, Database, Zap, Wifi, GitBranch, Repeat, Code, Variable, MessageSquare,
};

interface StepsModeViewProps {
  nodes: WorkflowNodeData[];
  getSortedNodes: () => WorkflowNodeData[];
  selectedNodeId: string | null;
  activeDragId: string | null;
  sensors: any;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onSelectNode: (nodeId: string) => void;
  onCopyNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const StepsModeView: React.FC<StepsModeViewProps> = ({
  nodes,
  getSortedNodes,
  selectedNodeId,
  activeDragId,
  sensors,
  onDragStart,
  onDragEnd,
  onSelectNode,
  onCopyNode,
  onDeleteNode,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Circle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <div className="mb-1">步骤模式说明:</div>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
                <li>节点按照画布中的顺序排列显示</li>
                <li>点击节点可以查看和编辑节点详情</li>
                <li>拖拽节点可以调整执行顺序（拖拽时会出现占位提示）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step List */}
        {nodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <List className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无节点，请在画布模式下添加节点</p>
            <p className="text-xs mt-1 text-gray-400">可从左侧拖拽节点到画布添加，或点击左侧节点类型在画布中心添加</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={getSortedNodes().map(node => node.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {getSortedNodes().map((node, index) => (
                  <SortableStepItem
                    key={node.id}
                    node={node}
                    index={index}
                    selectedNodeId={selectedNodeId}
                    onSelect={() => onSelectNode(node.id)}
                    onCopy={onCopyNode}
                    onDelete={onDeleteNode}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragId ? (
                (() => {
                  const draggingNode = getSortedNodes().find(n => n.id === activeDragId);
                  if (!draggingNode) return null;
                  const meta = NODE_META_REGISTRY[draggingNode.type];
                  const index = getSortedNodes().findIndex(n => n.id === activeDragId);
                  return (
                    <div className="bg-white rounded-lg border-2 border-blue-500 p-4 shadow-2xl opacity-95 w-full min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: meta?.color || '#9CA3AF' }}
                        >
                          {meta?.icon && ICON_MAP[meta.icon] ? (
                            React.createElement(ICON_MAP[meta.icon], { 
                              className: "w-5 h-5 text-white" 
                            })
                          ) : (
                            <span className="text-white text-lg">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 min-w-0">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex-shrink-0">{index + 1}</span>
                            <TruncateWithTooltip className="text-sm font-medium text-gray-900">{draggingNode.name}</TruncateWithTooltip>
                          </div>
                          <TruncateWithTooltip className="text-xs text-gray-500 block" content={draggingNode.description || meta?.description || '无描述'}>
                            {draggingNode.description || meta?.description || '无描述'}
                          </TruncateWithTooltip>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};
