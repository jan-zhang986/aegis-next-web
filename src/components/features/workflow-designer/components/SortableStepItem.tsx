/**
 * SortableStepItem Component
 * 可排序的步骤项组件
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, ChevronRight, Play, Square, Globe, Database, Zap, Wifi, GitBranch, Repeat, Code, Variable, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NODE_META_REGISTRY } from '@/components/workflow';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import type { WorkflowNodeData } from '@/components/workflow';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Play,
  Square,
  Globe,
  Database,
  Zap,
  Wifi,
  GitBranch,
  Repeat,
  Code,
  Variable,
  MessageSquare,
};

// 全局拖拽状态，用于区分拖拽和点击
let isDraggingGlobal = false;

interface SortableStepItemProps {
  node: WorkflowNodeData;
  index: number;
  selectedNodeId: string | null;
  onSelect: () => void;
  onCopy: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export const SortableStepItem: React.FC<SortableStepItemProps> = ({
  node,
  index,
  selectedNodeId,
  onSelect,
  onCopy,
  onDelete,
}) => {
  const meta = NODE_META_REGISTRY[node.type];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: node.id,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : (transition || undefined),
    opacity: isDragging ? 0 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingGlobal || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onSelect();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "bg-white rounded-lg border p-4 group cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg z-50 cursor-grabbing",
        selectedNodeId === node.id && "border-blue-500 border-2 shadow-md",
        selectedNodeId !== node.id && "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
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
              <TruncateWithTooltip className="text-sm font-medium text-gray-900">{node.name}</TruncateWithTooltip>
            </div>
            <TruncateWithTooltip className="text-xs text-gray-500 block" content={node.description || meta?.description || '无描述'}>
              {node.description || meta?.description || '无描述'}
            </TruncateWithTooltip>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            selectedNodeId === node.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(node.id);
              }}
              title="复制节点"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              title="删除节点"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};
