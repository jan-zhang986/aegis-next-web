import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AddModuleDialog } from './AddModuleDialog';
import { metadataService, type MetadataModuleNode } from '@/services/metadata';

// 类型配置
const TYPE_CONFIG: Record<string, { name: string; icon: string; id: string; category: string }> = {
  'API': { name: 'HTTP接口', icon: '🔌', id: 'metadata-http', category: 'http' },
  'SQL': { name: 'SQL操作', icon: '📊', id: 'metadata-sql', category: 'sql' },
  'DUBBO': { name: 'DUBBO服务', icon: '🔄', id: 'metadata-dubbo', category: 'dubbo' },
  'ROCKETMQ': { name: 'RocketMQ消息', icon: '🚀', id: 'metadata-mq', category: 'rocketmq' },
  'FILE': { name: '文件上传', icon: '📁', id: 'metadata-file', category: 'file' },
  'SCRIPT': { name: '造数工厂', icon: '🏭', id: 'metadata-script', category: 'script' },
  'MODULE': { name: '模块', icon: '📦', id: 'metadata-module', category: 'module' },
};

interface ModuleTreeSelectProps {
  /** 模块树数据 */
  moduleTree: MetadataModuleNode[];
  /** 当前选中的模块ID */
  moduleId?: string;
  /** 模块ID变化回调 */
  onModuleIdChange?: (moduleId: string) => void;
  /** 模块类型过滤（只显示该类型的模块） */
  moduleType?: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT';
  /** 项目ID（用于快速创建模块） */
  projectId?: string;
  /** Space 详情内快速创建模块时写入当前 spaceId */
  typeId?: string;
  /** 模块树刷新回调（用于快速创建模块后刷新） */
  onModuleTreeRefresh?: () => Promise<void>;
  /** 标签文本 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否显示快速创建按钮 */
  showQuickCreate?: boolean;
  /** 是否默认展开第一层 */
  defaultExpandFirstLevel?: boolean;
  /** 是否禁用根节点选择 */
  disableRootNodes?: boolean;
}

/**
 * 可复用的模块树选择组件
 * 支持树形结构选择、快速创建模块、类型过滤等功能
 */
export function ModuleTreeSelect({
  moduleTree,
  moduleId,
  onModuleIdChange,
  moduleType,
  projectId,
  typeId,
  onModuleTreeRefresh,
  label = '所属模块',
  required = false,
  placeholder = '请选择模块',
  showQuickCreate = true,
  defaultExpandFirstLevel = true,
  disableRootNodes = true,
}: ModuleTreeSelectProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isCreateModuleDialogOpen, setIsCreateModuleDialogOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

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

  // 获取当前选中的节点
  const selectedNode = useMemo(() => {
    if (!moduleId) return null;
    const allNodes = flattenNodes(moduleTree);
    return allNodes.find(n => n.id === moduleId) || null;
  }, [moduleId, moduleTree]);

  // 默认展开第一层节点
  useEffect(() => {
    if (defaultExpandFirstLevel && isSelectOpen) {
      const getFirstLevelExpandableNodes = (nodes: MetadataModuleNode[]): Set<string> => {
        const result = new Set<string>();
        nodes.forEach(node => {
          // 根据 moduleType 过滤
          if (moduleType && node.type !== moduleType) return;
          // 排除 WORKFLOW 类型，允许 SCRIPT 类型
          if ((node.type as string) === 'WORKFLOW') return;
          // 只处理顶级节点或第一层有子节点的节点
          if (node.parentId === 'NONE' || (node.children && node.children.length > 0)) {
            // 过滤子节点，只排除 WORKFLOW 类型，允许 SCRIPT 类型
            const validChildren = node.children?.filter(child => {
              if ((child.type as string) === 'WORKFLOW') return false;
              if (moduleType && child.type !== moduleType) return false;
              return true;
            }) || [];
            if (validChildren.length > 0 || (node.parentId === 'NONE' && node.children && node.children.length > 0)) {
              result.add(node.id);
            }
          }
        });
        return result;
      };
      const expandableIds = getFirstLevelExpandableNodes(moduleTree);
      setExpandedNodes(expandableIds);
    }
  }, [defaultExpandFirstLevel, isSelectOpen, moduleTree, moduleType]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };

    if (isSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectOpen]);

  // 切换节点展开状态
  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
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
    // 如果禁用根节点，且当前节点是根节点，不允许选择
    if (disableRootNodes && node.parentId === 'NONE') {
      return;
    }
    if (onModuleIdChange) {
      onModuleIdChange(node.id);
    }
    setIsSelectOpen(false);
  };

  // 递归渲染树形节点（过滤掉 WORKFLOW 类型和不符合 moduleType 的节点）
  const renderTreeNode = (node: MetadataModuleNode, level: number = 0, isRoot: boolean = false): JSX.Element | null => {
    // 只过滤掉 WORKFLOW 类型的节点，允许 SCRIPT 类型
    if ((node.type as string) === 'WORKFLOW') {
      return null;
    }

    // 根据 moduleType 过滤
    if (moduleType && node.type !== moduleType) {
      // 如果节点本身不符合类型，但可能有符合类型的子节点，仍然渲染（作为容器）
      const hasValidChildren = node.children?.some(child => {
        if ((child.type as string) === 'WORKFLOW') return false;
        return child.type === moduleType;
      });
      if (!hasValidChildren) {
        return null;
      }
    }

    const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.MODULE;
    const indent = level * 16;
    // 过滤子节点，只排除 WORKFLOW 类型以及不符合 moduleType 的节点，允许 SCRIPT 类型
    const validChildren = node.children?.filter(child => {
      if ((child.type as string) === 'WORKFLOW') return false;
      if (moduleType && child.type !== moduleType) return false;
      return true;
    }) || [];
    const hasChildren = validChildren.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = moduleId === node.id;
    const isRootNode = node.parentId === 'NONE';

    // 根节点处理
    if (isRoot && isRootNode) {
      return (
        <div key={node.id}>
          {/* 根节点不可选择，只显示子节点 */}
          {hasChildren && (
            <>
              {validChildren.map(child => renderTreeNode(child, 0, false)).filter(Boolean)}
            </>
          )}
        </div>
      );
    }

    // 如果禁用根节点，且当前节点是根节点，不渲染为可选项
    if (disableRootNodes && isRootNode) {
      return (
        <div key={node.id}>
          {hasChildren && (
            <>
              {validChildren.map(child => renderTreeNode(child, 0, false)).filter(Boolean)}
            </>
          )}
        </div>
      );
    }

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
            {validChildren.map(child => renderTreeNode(child, level + 1, false)).filter(Boolean)}
          </>
        )}
      </div>
    );
  };

  // 获取过滤后的顶级节点
  const topLevelNodes = useMemo(() => {
    return moduleTree.filter(node => {
      if (node.parentId !== 'NONE') return false;
      // 只排除 WORKFLOW 类型，允许 SCRIPT 类型
      if ((node.type as string) === 'WORKFLOW') return false;
      if (moduleType && node.type !== moduleType) {
        // 如果节点本身不符合类型，但可能有符合类型的子节点，仍然包含
        const hasValidChildren = node.children?.some(child => {
          // 只排除 WORKFLOW 类型，允许 SCRIPT 类型
          if ((child.type as string) === 'WORKFLOW') return false;
          return child.type === moduleType;
        });
        return hasValidChildren;
      }
      return true;
    });
  }, [moduleTree, moduleType]);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="moduleTreeSelect">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          {showQuickCreate && projectId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsCreateModuleDialogOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              快速创建
            </Button>
          )}
        </div>
        <div className="relative" ref={selectRef}>
          {/* 触发器 */}
          <button
            type="button"
            id="moduleTreeSelect"
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className={moduleId ? 'text-gray-900' : 'text-gray-500'}>
              {selectedNode ? getNodePath(selectedNode) : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* 下拉树形列表 */}
          {isSelectOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
              {topLevelNodes.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  暂无模块
                </div>
              ) : (
                topLevelNodes.map(node => renderTreeNode(node, 0, disableRootNodes)).filter(Boolean)
              )}
            </div>
          )}
        </div>
        {selectedNode && (
          <div className="text-xs text-gray-500 mt-1">
            路径: {getNodePath(selectedNode)}
          </div>
        )}
      </div>

      {/* 快速创建模块对话框 */}
      {projectId && (
        <AddModuleDialog
          open={isCreateModuleDialogOpen}
          onOpenChange={setIsCreateModuleDialogOpen}
          moduleTree={moduleTree}
          projectId={projectId}
          typeId={typeId}
          moduleType={moduleType}
          title="快速创建模块"
          description="选择父模块，创建新的子模块"
          onSuccess={async () => {
            // 刷新模块树
            if (onModuleTreeRefresh) {
              await onModuleTreeRefresh();
            }
          }}
        />
      )}
    </>
  );
}
