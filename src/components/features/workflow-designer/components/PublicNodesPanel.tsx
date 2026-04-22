/**
 * PublicNodesPanel 组件
 * 显示公共节点列表
 */

import React from 'react';
import { Search, Star, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { NODE_META_REGISTRY, type WorkflowNodeData, type WorkflowData } from '@/components/workflow';
import { NODE_CATEGORIES } from '../constants/nodeCategories';

interface PublicNodesPanelProps {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  loadingPublicNodes: boolean;
  publicNodes: any[];
  expandedCategories: string[];
  toggleCategory: (categoryId: string) => void;
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  onDeletePublicNode: (nodeId: string) => void;
}

// 生成唯一 ID
const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const PublicNodesPanel: React.FC<PublicNodesPanelProps> = ({
  searchKeyword,
  setSearchKeyword,
  loadingPublicNodes,
  publicNodes,
  expandedCategories,
  toggleCategory,
  workflow,
  setWorkflow,
  onDeletePublicNode,
}) => {
  const handleAddPublicNode = (node: any) => {
    const existingNodes = workflow.nodes;
    const maxY = existingNodes.length > 0 
      ? Math.max(...existingNodes.map(n => n.y)) + 200 
      : 100;
    
    const newNode: WorkflowNodeData = {
      id: generateId(),
      type: node.type,
      name: node.name,
      description: node.description || '',
      config: node.config || {},
      x: 100 + Math.random() * 200,
      y: maxY,
    };
    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    toast.success(`已添加公共节点"${node.name}"`);
  };

  return (
    <>
      {/* 搜索 */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索公共节点..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 公共节点列表 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {loadingPublicNodes ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              <div className="mb-2">加载中...</div>
            </div>
          ) : publicNodes.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              <Star className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div>暂无公共节点</div>
            </div>
          ) : (
            <div className="space-y-2">
              {NODE_CATEGORIES.map(category => {
                const categoryNodes = publicNodes.filter(node => {
                  const meta = NODE_META_REGISTRY[node.type];
                  const matchesCategory = meta?.category === category.id;
                  const matchesSearch = !searchKeyword || 
                    node.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                    (node.description || '').toLowerCase().includes(searchKeyword.toLowerCase());
                  return matchesCategory && matchesSearch;
                });
                
                if (categoryNodes.length === 0) {
                  return null;
                }
                
                return (
                  <Collapsible key={category.id} defaultOpen={expandedCategories.includes(category.id)}>
                    <CollapsibleTrigger 
                      className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        <span className="text-xs text-gray-400">({categoryNodes.length})</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-2 mt-1 space-y-1">
                        {categoryNodes.map(node => {
                          const meta = NODE_META_REGISTRY[node.type];
                          return (
                            <div
                              key={node.id}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                              <button
                                className="flex-1 flex items-center gap-3"
                                onClick={() => handleAddPublicNode(node)}
                              >
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: meta?.color || '#6B7280' }}
                                >
                                  <div className="text-white">
                                    {category.nodes.find(n => n.type === node.type)?.icon || <Star className="w-4 h-4" />}
                                  </div>
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-sm font-medium text-gray-700">{node.name}</div>
                                  {node.description && (
                                    <div className="text-xs text-gray-500">{node.description}</div>
                                  )}
                                </div>
                                <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePublicNode(node.id);
                                }}
                                title="删除公共节点"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};
