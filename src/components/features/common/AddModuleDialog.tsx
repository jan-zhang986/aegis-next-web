/**
 * 添加模块对话框组件
 * 用于在任意位置快速创建新模块
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { MetadataModuleNode } from '@/services/metadata';
import { metadataService } from '@/services/metadata';

// 类型配置（与 MainContent.tsx 保持一致）
const TYPE_CONFIG: Record<string, { name: string; icon: string; id: string; category: string }> = {
  'API': { name: 'HTTP接口', icon: '🔌', id: 'metadata-http', category: 'http' },
  'SQL': { name: 'SQL操作', icon: '📊', id: 'metadata-sql', category: 'sql' },
  'DUBBO': { name: 'DUBBO服务', icon: '🔄', id: 'metadata-dubbo', category: 'dubbo' },
  'ROCKETMQ': { name: 'RocketMQ消息', icon: '🚀', id: 'metadata-mq', category: 'rocketmq' },
  'FILE': { name: '文件上传', icon: '📁', id: 'metadata-file', category: 'file' },
  'SCRIPT': { name: '造数工厂', icon: '🏭', id: 'metadata-script', category: 'script' },
};

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleTree: MetadataModuleNode[];
  projectId: string;
  // 模块类型，如果指定则自动设置，否则允许用户选择
  moduleType?: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT';
  // 创建成功后的回调
  onSuccess?: () => void | Promise<void>;
  // 标题，默认为"添加模块"
  title?: string;
  // 描述，默认为"选择父模块，在任意节点下添加子模块"
  description?: string;
}

export function AddModuleDialog({
  open,
  onOpenChange,
  moduleTree,
  projectId,
  moduleType,
  onSuccess,
  title = '添加模块',
  description = '选择父模块，在任意节点下添加子模块',
}: AddModuleDialogProps) {
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedParentPath, setSelectedParentPath] = useState<string>('');
  const [selectedModuleType, setSelectedModuleType] = useState<'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT'>(moduleType || 'API');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParentSelectOpen, setIsParentSelectOpen] = useState(false);
  const [expandedParentNodes, setExpandedParentNodes] = useState<Set<string>>(new Set());
  const parentSelectRef = useRef<HTMLDivElement>(null);

  // 递归展平所有节点（包括子节点）
  const flattenNodes = (nodes: MetadataModuleNode[]): MetadataModuleNode[] => {
    const result: MetadataModuleNode[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result.push(...flattenNodes(node.children));
      }
    });
    return result;
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (parentSelectRef.current && !parentSelectRef.current.contains(event.target as Node)) {
        setIsParentSelectOpen(false);
      }
    };

    if (isParentSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isParentSelectOpen]);

  // 关闭对话框时重置状态
  useEffect(() => {
    if (!open) {
      setNewModuleName('');
      setSelectedParentId('');
      setSelectedParentPath('');
      setIsParentSelectOpen(false);
      setExpandedParentNodes(new Set());
      // 重置为传入的 moduleType 或默认值
      setSelectedModuleType(moduleType || 'API');
    }
  }, [open, moduleType]);
  
  // 打开对话框时，如果有传入的 moduleType，设置为初始值
  useEffect(() => {
    if (open) {
      if (moduleType) {
        setSelectedModuleType(moduleType);
      }
      // 默认全部收起，不展开任何节点
      setExpandedParentNodes(new Set());
    }
  }, [open, moduleType]);

  // 生成节点路径
  const getNodePath = (node: MetadataModuleNode): string => {
    const allNodes = flattenNodes(moduleTree);
    if (node.parentId === 'NONE') {
      return node.name;
    }
    const parent = allNodes.find(n => n.id === node.parentId);
    if (parent) {
      const parentPath = getNodePath(parent);
      return parentPath === parent.name 
        ? `${parent.name} / ${node.name}` 
        : `${parentPath} / ${node.name}`;
    }
    return node.name;
  };

  const handleSubmit = async () => {
    if (!newModuleName.trim()) {
      toast.error('请输入模块名称');
      return;
    }
    if (!selectedParentId || !selectedParentId.trim()) {
      toast.error('请选择父模块');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await metadataService.addModule({
        projectId: projectId,
        name: newModuleName.trim(),
        parentId: selectedParentId,
        moduleType: selectedModuleType,
      });
      
      toast.success('模块添加成功！');
      onOpenChange(false);
      setNewModuleName('');
      setSelectedParentId('');
      setSelectedParentPath('');
      
      // 调用成功回调
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error: any) {
      console.error('添加模块失败:', error);
      const errorMessage = error?.message || error?.response?.data?.message || '添加模块失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="moduleName">模块名称 *</Label>
            <Input
              id="moduleName"
              placeholder="请输入模块名称"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              className="border border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parentModule">选择父模块 *</Label>
            <div className="relative" ref={parentSelectRef}>
              {/* 触发器 */}
              <button
                type="button"
                id="parentModule"
                onClick={() => setIsParentSelectOpen(!isParentSelectOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className={selectedParentId ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedParentId ? (() => {
                    const allNodes = flattenNodes(moduleTree);
                    const selectedNode = allNodes.find(n => n.id === selectedParentId);
                    return selectedNode ? selectedNode.name : '请选择父模块';
                  })() : '请选择父模块'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isParentSelectOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 下拉树形列表 */}
              {isParentSelectOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
                  {(() => {
                    // 切换节点展开状态
                    const toggleNode = (nodeId: string, e: React.MouseEvent) => {
                      e.stopPropagation();
                      setExpandedParentNodes(prev => {
                        const next = new Set(prev);
                        if (next.has(nodeId)) {
                          next.delete(nodeId);
                        } else {
                          next.add(nodeId);
                        }
                        return next;
                      });
                    };
                    
                    // 选择节点
                    const selectNode = (node: MetadataModuleNode) => {
                      setSelectedParentId(node.id);
                      setSelectedParentPath(getNodePath(node));
                      // 根据父节点类型自动设置 moduleType（覆盖传入的 moduleType）
                      if (node.type === 'API' || node.type === 'SQL' || node.type === 'DUBBO' || node.type === 'ROCKETMQ' || node.type === 'FILE' || node.type === 'SCRIPT') {
                        setSelectedModuleType(node.type);
                      }
                      setIsParentSelectOpen(false);
                    };
                    
                    // 递归渲染树形节点（只过滤掉 WORKFLOW 类型，允许 SCRIPT 类型）
                    const renderTreeNode = (node: MetadataModuleNode, level: number = 0): JSX.Element | null => {
                      // 只过滤掉 WORKFLOW 类型的节点，允许 SCRIPT 类型
                      if ((node.type as string) === 'WORKFLOW') {
                        return null;
                      }
                      
                      const config = TYPE_CONFIG[node.type] || TYPE_CONFIG['API'];
                      const indent = level * 16;
                      // 过滤子节点，只排除 WORKFLOW 类型，允许 SCRIPT 类型
                      const validChildren = node.children?.filter(child => {
                        const childType = child.type as string;
                        return childType !== 'WORKFLOW';
                      }) || [];
                      const hasChildren = validChildren.length > 0;
                      const isExpanded = expandedParentNodes.has(node.id);
                      const isSelected = selectedParentId === node.id;
                      
                      return (
                        <div key={node.id}>
                          <div
                            onClick={() => selectNode(node)}
                            className={`flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                            style={{ paddingLeft: `${indent + 12}px` }}
                          >
                            {/* 展开/收起按钮 */}
                            <div
                              onClick={(e) => {
                                if (hasChildren) {
                                  toggleNode(node.id, e);
                                }
                              }}
                              className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                            >
                              {hasChildren ? (
                                isExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                )
                              ) : (
                                <div className="w-3 h-3"></div>
                              )}
                            </div>
                            <span className={`text-sm flex-1 ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>
                              {node.name}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({config?.name || node.type})
                            </span>
                          </div>
                          {/* 递归渲染子节点（只渲染非 WORKFLOW 类型的子节点） */}
                          {hasChildren && isExpanded && (
                            <>
                              {validChildren.map(child => renderTreeNode(child, level + 1)).filter(Boolean)}
                            </>
                          )}
                        </div>
                      );
                    };
                    
                    // 只渲染顶级节点（parentId 为 NONE 的节点），排除 WORKFLOW 类型
                    const topLevelNodes = moduleTree
                      .filter(node => node.parentId === 'NONE' && (node.type as string) !== 'WORKFLOW')
                      // 排序：SCRIPT 类型放在后面，其他类型保持原顺序
                      .sort((a, b) => {
                        const aIsScript = (a.type as string) === 'SCRIPT';
                        const bIsScript = (b.type as string) === 'SCRIPT';
                        if (aIsScript && !bIsScript) return 1; // SCRIPT 排在后面
                        if (!aIsScript && bIsScript) return -1; // 非 SCRIPT 排在前面
                        return 0; // 相同类型保持原顺序
                      });
                    
                    if (topLevelNodes.length === 0) {
                      return (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          暂无模块
                        </div>
                      );
                    }
                    
                    return topLevelNodes.map(node => renderTreeNode(node, 0));
                  })()}
                </div>
              )}
            </div>
            {selectedParentPath && selectedParentId && (
              <div className="text-xs text-gray-500 mt-1">
                路径: {selectedParentPath}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newModuleName.trim() || !selectedParentId}
          >
            {isSubmitting ? '添加中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

