/**
 * DraggableNodeItem 组件
 * 可拖拽的节点项，用于左侧节点面板
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { NODE_META_REGISTRY } from '@/components/workflow';
import type { NodeType } from '@/components/workflow';

interface DraggableNodeItemProps {
  nodeType: NodeType;
  name: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({
  nodeType,
  name,
  description,
  icon,
  onClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `node-type-${nodeType}`,
    data: {
      type: 'node-type',
      nodeType,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const meta = NODE_META_REGISTRY[nodeType];

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group ${
        isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
      }`}
      onClick={onClick}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: meta?.color }}
      >
        <div className="text-white">{icon}</div>
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-gray-700">{name}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
