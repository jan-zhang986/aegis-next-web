/**
 * NodePanel 组件
 * 节点列表面板
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DraggableNodeItem } from './DraggableNodeItem';
import type { NodeCategory } from '../types';

interface NodePanelProps {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  expandedCategories: string[];
  toggleCategory: (categoryId: string) => void;
  filteredCategories: NodeCategory[];
  handleAddNode: (type: NodeType) => void;
}

/**
 * NodePanel 组件
 */
export const NodePanel = React.memo<NodePanelProps>(function NodePanel({
  searchKeyword,
  setSearchKeyword,
  expandedCategories,
  toggleCategory,
  filteredCategories,
  handleAddNode,
}: NodePanelProps) {
  return (
    <>
      {/* 搜索 */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索节点..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">拖拽到画布即可添加节点</p>
      </div>

      {/* 节点列表 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {/* 其他节点分类 */}
          {filteredCategories.map((category) => (
            <div key={category.id} className="mb-2">
              <button
                className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                </div>
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedCategories.includes(category.id) && (
                <div className="ml-2 mt-1 space-y-1">
                  {category.nodes.map((node) => (
                    <DraggableNodeItem
                      key={node.type}
                      nodeType={node.type}
                      name={node.name}
                      description={node.description}
                      icon={node.icon}
                      onClick={() => handleAddNode(node.type)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
});
