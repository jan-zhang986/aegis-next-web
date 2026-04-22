import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Search, Plus, Upload, Move, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { metadataService } from '@/services/metadata';
import { toast } from 'sonner';
import type { ApiItem, OpenedTest } from '@/types';
import type { MetadataDefinition, MetadataModuleNode } from '@/services/metadata';
import { getTypeBadgeColor, flattenNodes } from '@/utils/metadataHelpers';
import type { CurrentSelection } from '@/hooks/useMetadataSearch';
import type { UseMetadataDialogsResult } from '@/hooks/useMetadataDialogs';

interface MetadataTablePanelProps {
  currentSelection: CurrentSelection;
  tableData: ApiItem[];
  loading: boolean;
  protocolContext: string;
  tableSearchKeyword: string;
  setTableSearchKeyword: (keyword: string) => void;
  createUserSearch: string;
  setCreateUserSearch: (user: string) => void;
  selectedDefinitionIds: Set<string>;
  handleToggleSelection: (id: string) => void;
  handleToggleSelectAll: (checked: boolean, tableData: ApiItem[]) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  definitions: MetadataDefinition[];
  moduleTree: MetadataModuleNode[];
  userNameMap: Map<string, string>;
  metadataTypes: Array<{ id: string; name: string; count: number; icon: string; moduleIds: string[] }>;
  metadataCategories: Array<{ id: string; name: string; typeId: string; count: number; path: string; parentId: string }>;
  dialogs: UseMetadataDialogsResult;
  projectId: string;
  onSetCurrentSelection: (selection: CurrentSelection) => void;
  onHandleOpenApi: (api: ApiItem) => void;
  onHandleAddApi: (category: string, typeName: string) => void;
  onLoadDdlImportEnvironments: () => Promise<void>;
  onRefresh: () => Promise<void>;
  selectedTopMenu?: string;
}

export function MetadataTablePanel({
  currentSelection,
  tableData,
  loading,
  protocolContext,
  tableSearchKeyword,
  setTableSearchKeyword,
  createUserSearch,
  setCreateUserSearch,
  selectedDefinitionIds,
  handleToggleSelection,
  handleToggleSelectAll,
  isAllSelected,
  isIndeterminate,
  definitions,
  moduleTree,
  userNameMap,
  metadataTypes,
  metadataCategories,
  dialogs,
  projectId,
  onSetCurrentSelection,
  onHandleOpenApi,
  onHandleAddApi,
  onLoadDdlImportEnvironments,
  onRefresh,
  selectedTopMenu,
}: MetadataTablePanelProps) {
  const navigate = useNavigate();
  // 模块搜索相关状态
  const [isModuleSelectOpen, setIsModuleSelectOpen] = useState(false);
  const [moduleSearchKeyword, setModuleSearchKeyword] = useState('');
  const [expandedModuleNodes, setExpandedModuleNodes] = useState<Set<string>>(new Set());
  const moduleSelectRef = useRef<HTMLDivElement>(null);

  // 协议类型到模块类型的映射
  const protocolToModuleTypeMap: Record<string, 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT'> = {
    'HTTP': 'API',
    'SQL': 'SQL',
    'DUBBO': 'DUBBO',
    'ROCKETMQ': 'ROCKETMQ',
    'FILE': 'FILE',
    'SCRIPT': 'SCRIPT',
  };

  // 类型配置
  const TYPE_CONFIG: Record<string, { name: string; icon: string }> = {
    'API': { name: 'HTTP接口', icon: '🔌' },
    'SQL': { name: 'SQL操作', icon: '📊' },
    'DUBBO': { name: 'DUBBO服务', icon: '🔄' },
    'ROCKETMQ': { name: 'RocketMQ消息', icon: '🚀' },
    'FILE': { name: '文件上传', icon: '📁' },
    'SCRIPT': { name: '造数工厂', icon: '🏭' },
    'MODULE': { name: '模块', icon: '📦' },
  };

  // 获取当前协议对应的模块类型
  const currentModuleType = protocolToModuleTypeMap[protocolContext] || 'API';

  // 获取当前选中的模块节点
  const currentModuleNode = useMemo(() => {
    if (currentSelection.level === 'metadata-category' && currentSelection.id) {
      const allNodes = flattenNodes(moduleTree);
      return allNodes.find(node => node.id === currentSelection.id) || null;
    }
    return null;
  }, [currentSelection, moduleTree]);

  // 生成节点路径
  const getModulePath = (node: MetadataModuleNode): string => {
    const allNodes = flattenNodes(moduleTree);
    if (node.parentId === 'NONE') {
      return node.name;
    }
    const parent = allNodes.find(n => n.id === node.parentId);
    if (parent) {
      const parentPath = getModulePath(parent);
      return parentPath === parent.name 
        ? `${parent.name} / ${node.name}` 
        : `${parentPath} / ${node.name}`;
    }
    return node.name;
  };

  // 截断文本，在中间显示省略号
  const truncateText = (text: string, maxLength: number = 30): string => {
    if (text.length <= maxLength) {
      return text;
    }
    const halfLength = Math.floor((maxLength - 3) / 2);
    return `${text.slice(0, halfLength)}...${text.slice(-halfLength)}`;
  };

  // 检查节点是否匹配搜索关键词
  const nodeMatchesSearch = (node: MetadataModuleNode, keyword: string): boolean => {
    if (!keyword.trim()) return true;
    const lowerKeyword = keyword.toLowerCase();
    return node.name.toLowerCase().includes(lowerKeyword);
  };

  // 检查节点或其子节点是否匹配搜索关键词（用于决定是否显示节点）
  const nodeOrChildrenMatchSearch = (node: MetadataModuleNode, keyword: string): boolean => {
    if (!keyword.trim()) return true;
    if (nodeMatchesSearch(node, keyword)) return true;
    if (node.children && node.children.length > 0) {
      return node.children.some(child => nodeOrChildrenMatchSearch(child, keyword));
    }
    return false;
  };

  // 获取过滤后的顶级节点
  const topLevelModuleNodes = useMemo(() => {
    return moduleTree.filter(node => {
      if (node.parentId !== 'NONE') return false;
      // 排除 WORKFLOW 类型
      if ((node.type as string) === 'WORKFLOW') return false;
      // 根据 moduleType 过滤
      if (node.type !== currentModuleType) {
        // 如果节点本身不符合类型，但可能有符合类型的子节点，仍然包含
        const hasValidChildren = node.children?.some(child => {
          if ((child.type as string) === 'WORKFLOW') return false;
          return child.type === currentModuleType;
        });
        if (!hasValidChildren) return false;
      }
      // 根据搜索关键词过滤
      if (moduleSearchKeyword.trim()) {
        return nodeOrChildrenMatchSearch(node, moduleSearchKeyword);
      }
      return true;
    });
  }, [moduleTree, currentModuleType, moduleSearchKeyword]);

  // 切换节点展开状态
  const toggleModuleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedModuleNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // 递归渲染树形节点
  const renderModuleTreeNode = (node: MetadataModuleNode, level: number = 0): JSX.Element | null => {
    // 只过滤掉 WORKFLOW 类型的节点
    if ((node.type as string) === 'WORKFLOW') {
      return null;
    }

    // 根据 moduleType 过滤
    if (node.type !== currentModuleType) {
      // 如果节点本身不符合类型，但可能有符合类型的子节点，仍然渲染（作为容器）
      const hasValidChildren = node.children?.some(child => {
        if ((child.type as string) === 'WORKFLOW') return false;
        return child.type === currentModuleType;
      });
      if (!hasValidChildren) {
        return null;
      }
    }

    const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.MODULE;
    const indent = level * 16;
    // 过滤子节点，只排除 WORKFLOW 类型以及不符合 moduleType 的节点
    const validChildren = node.children?.filter(child => {
      if ((child.type as string) === 'WORKFLOW') return false;
      if (child.type !== currentModuleType) return false;
      // 根据搜索关键词过滤子节点
      if (moduleSearchKeyword.trim()) {
        return nodeOrChildrenMatchSearch(child, moduleSearchKeyword);
      }
      return true;
    }) || [];
    const hasChildren = validChildren.length > 0;
    const isExpanded = expandedModuleNodes.has(node.id);
    const isSelected = currentModuleNode?.id === node.id;
    const isRootNode = node.parentId === 'NONE';

    // 如果禁用根节点，且当前节点是根节点，不渲染为可选项
    if (isRootNode && node.type !== currentModuleType) {
      return (
        <div key={node.id}>
          {hasChildren && (
            <>
              {validChildren.map(child => renderModuleTreeNode(child, 0)).filter(Boolean)}
            </>
          )}
        </div>
      );
    }

    // 如果节点不匹配搜索关键词，且没有匹配的子节点，不渲染
    if (moduleSearchKeyword.trim() && !nodeOrChildrenMatchSearch(node, moduleSearchKeyword)) {
      return null;
    }

    return (
      <div key={node.id}>
        <div
          onClick={() => {
            if (!isRootNode || node.type === currentModuleType) {
              handleSelectModule(node);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 cursor-pointer ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          {/* 展开/收起按钮 */}
          <div
            onClick={(e) => {
              if (hasChildren) {
                toggleModuleNode(node.id, e);
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
          <span 
            className={`text-sm flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-900'}`}
            title={node.name}
          >
            {truncateText(node.name, 30)}
          </span>
          {node.type === currentModuleType && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              ({config?.name || node.type})
            </span>
          )}
        </div>
        {/* 递归渲染子节点 */}
        {hasChildren && isExpanded && (
          <>
            {validChildren.map(child => renderModuleTreeNode(child, level + 1)).filter(Boolean)}
          </>
        )}
      </div>
    );
  };

  // 打开下拉框时，默认展开第二层级（顶级节点的直接子节点）
  useEffect(() => {
    if (isModuleSelectOpen) {
      // 获取所有顶级节点，并展开它们（这样第二层级就会显示）
      const topLevelIds = new Set<string>();
      topLevelModuleNodes.forEach(node => {
        // 如果节点有子节点，展开它
        const validChildren = node.children?.filter(child => {
          if ((child.type as string) === 'WORKFLOW') return false;
          if (child.type !== currentModuleType) return false;
          // 如果有关键词，检查是否匹配
          if (moduleSearchKeyword.trim()) {
            const keyword = moduleSearchKeyword.toLowerCase();
            // 检查节点名称是否匹配
            if (child.name.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查子节点是否匹配（递归检查）
            const checkChildren = (n: MetadataModuleNode): boolean => {
              if (n.name.toLowerCase().includes(keyword)) return true;
              if (n.children && n.children.length > 0) {
                return n.children.some(c => checkChildren(c));
              }
              return false;
            };
            return checkChildren(child);
          }
          return true;
        }) || [];
        if (validChildren.length > 0) {
          topLevelIds.add(node.id);
        }
      });
      setExpandedModuleNodes(topLevelIds);
    } else {
      // 关闭时清空展开状态
      setExpandedModuleNodes(new Set());
    }
  }, [isModuleSelectOpen, topLevelModuleNodes, currentModuleType, moduleSearchKeyword]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moduleSelectRef.current && !moduleSelectRef.current.contains(event.target as Node)) {
        setIsModuleSelectOpen(false);
      }
    };

    if (isModuleSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModuleSelectOpen]);

  // 选择模块
  const handleSelectModule = (module: MetadataModuleNode) => {
    onSetCurrentSelection({
      level: 'metadata-category',
      id: module.id,
      name: module.name,
    });
    setIsModuleSelectOpen(false);
    setModuleSearchKeyword('');
  };

  const handleCopyDefinition = async (id: string) => {
    try {
      await metadataService.copyDefinition(id);
      toast.success('复制成功');
      await onRefresh();
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleDeleteDefinition = async (id: string, name: string) => {
    dialogs.setDeleteDefinitionId(id);
    dialogs.setDeleteDefinitionName(name);
    dialogs.setIsDeleteDefinitionDialogOpen(true);
  };

  const handleExecuteDefinition = (item: ApiItem) => {
    const definition = definitions.find(def => def.id === item.id);
    if (definition) {
      const testTypeMap: { [key: string]: OpenedTest['type'] } = {
        'HTTP': 'http',
        'SQL': 'sql',
        'DUBBO': 'dubbo',
        'ROCKETMQ': 'rocketmq',
        'FILE': 'file',
        'SCRIPT': 'data-factory',
      };
      onHandleOpenApi(item);
    }
  };

  const handleEditDefinition = (item: ApiItem) => {
    const definition = definitions.find(def => def.id === item.id);
    if (definition) {
      const testTypeMap: { [key: string]: OpenedTest['type'] } = {
        'HTTP': 'http',
        'SQL': 'sql',
        'DUBBO': 'dubbo',
        'ROCKETMQ': 'rocketmq',
        'FILE': 'file',
        'SCRIPT': 'data-factory',
      };
      onHandleOpenApi(item);
    }
  };

  const breadcrumbContent = (() => {
    if (currentSelection.level === 'metadata-type') {
      // 类型级别时与下方大标题重复，不显示面包屑文案，仅保留返回按钮
      return null;
    }
    if (currentSelection.level === 'metadata-category') {
      const category = metadataCategories.find(cat => cat.id === currentSelection.id);
      const allNodes = flattenNodes(moduleTree);
      const moduleNode = allNodes.find(node => node.id === currentSelection.id);
      const typeInfo = category ? metadataTypes.find(t => t.id === category.typeId) : null;
      const typeName = typeInfo?.name || 'HTTP接口';
      return (
        <>
          <span className="text-gray-900">{typeName}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{currentSelection.name}</span>
        </>
      );
    }
    return <span className="cursor-pointer hover:text-gray-900">元数据管理</span>;
  })();

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col bg-white flex-1 min-h-0">
          <div className="px-6 pt-2 pb-1 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1.5">
              <button
                onClick={() => {
                  // 如果是从二级菜单进入的造数工厂，返回到 API 接口首页
                  if (selectedTopMenu === 'data-factory') {
                    navigate('/test-factory/api');
                  } else {
                    onSetCurrentSelection({ level: 'none' });
                  }
                }}
                className="text-gray-600 hover:text-gray-900 p-0.5 -ml-0.5"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              {breadcrumbContent != null ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {breadcrumbContent}
                </div>
              ) : (
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">
                  {currentSelection.level === 'metadata' ? '元数据管理' : currentSelection.name}
                </h1>
              )}
            </div>
            {breadcrumbContent != null && (
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 mb-0 leading-tight">
                    {currentSelection.level === 'metadata' ? '元数据管理' : currentSelection.name}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">共{tableData.length}个元数据</p>
                </div>
              </div>
            )}
            {breadcrumbContent == null && (
              <p className="text-xs text-gray-500 mt-0.5">共{tableData.length}个元数据</p>
            )}
          </div>

          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 max-w-md" ref={moduleSelectRef}>
                <button
                  type="button"
                  onClick={() => setIsModuleSelectOpen(!isModuleSelectOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 h-8 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <span className={`flex-1 text-left truncate ${currentModuleNode ? 'text-gray-900' : 'text-gray-500'}`}>
                    {currentModuleNode ? getModulePath(currentModuleNode) : '请选择模块'}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {currentModuleNode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          // 如果当前是模块级别，回到类型级别
                          if (currentSelection.level === 'metadata-category') {
                            // 方法1: 通过 metadataCategories 查找
                            const category = metadataCategories.find(cat => cat.id === currentSelection.id);
                            if (category) {
                              const typeInfo = metadataTypes.find(t => t.id === category.typeId);
                              if (typeInfo) {
                                onSetCurrentSelection({ 
                                  level: 'metadata-type', 
                                  id: typeInfo.id,
                                  name: typeInfo.name 
                                });
                                return;
                              }
                            }
                            // 方法2: 如果找不到，直接根据当前模块类型设置
                            // 根据当前模块节点的类型，找到对应的 metadataType
                            const moduleType = currentModuleNode.type;
                            const typeIdMap: Record<string, string> = {
                              'API': 'metadata-http',
                              'SQL': 'metadata-sql',
                              'DUBBO': 'metadata-dubbo',
                              'ROCKETMQ': 'metadata-mq',
                              'FILE': 'metadata-file',
                              'SCRIPT': 'metadata-script',
                            };
                            const targetTypeId = typeIdMap[moduleType];
                            if (targetTypeId) {
                              const typeInfo = metadataTypes.find(t => t.id === targetTypeId);
                              if (typeInfo) {
                                onSetCurrentSelection({ 
                                  level: 'metadata-type', 
                                  id: typeInfo.id,
                                  name: typeInfo.name 
                                });
                                return;
                              }
                            }
                            // 方法3: 如果还是找不到，直接使用 protocolContext 映射
                            const protocolTypeMap: Record<string, { id: string; name: string }> = {
                              'HTTP': { id: 'metadata-http', name: 'HTTP接口' },
                              'SQL': { id: 'metadata-sql', name: 'SQL操作' },
                              'DUBBO': { id: 'metadata-dubbo', name: 'DUBBO服务' },
                              'ROCKETMQ': { id: 'metadata-mq', name: 'RocketMQ消息' },
                              'FILE': { id: 'metadata-file', name: '文件上传' },
                              'SCRIPT': { id: 'metadata-script', name: '造数工厂' },
                            };
                            const fallbackType = protocolTypeMap[protocolContext];
                            if (fallbackType) {
                              onSetCurrentSelection({ 
                                level: 'metadata-type', 
                                id: fallbackType.id,
                                name: fallbackType.name 
                              });
                            }
                          }
                        }}
                        className="p-0.5 hover:bg-gray-200 rounded cursor-pointer"
                        title="清除选择"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            // 如果当前是模块级别，回到类型级别
                            if (currentSelection.level === 'metadata-category') {
                              const category = metadataCategories.find(cat => cat.id === currentSelection.id);
                              if (category) {
                                const typeInfo = metadataTypes.find(t => t.id === category.typeId);
                                if (typeInfo) {
                                  onSetCurrentSelection({ 
                                    level: 'metadata-type', 
                                    id: typeInfo.id,
                                    name: typeInfo.name 
                                  });
                                  return;
                                }
                              }
                              const moduleType = currentModuleNode.type;
                              const typeIdMap: Record<string, string> = {
                                'API': 'metadata-http',
                                'SQL': 'metadata-sql',
                                'DUBBO': 'metadata-dubbo',
                                'ROCKETMQ': 'metadata-mq',
                                'FILE': 'metadata-file',
                                'SCRIPT': 'metadata-script',
                              };
                              const targetTypeId = typeIdMap[moduleType];
                              if (targetTypeId) {
                                const typeInfo = metadataTypes.find(t => t.id === targetTypeId);
                                if (typeInfo) {
                                  onSetCurrentSelection({ 
                                    level: 'metadata-type', 
                                    id: typeInfo.id,
                                    name: typeInfo.name 
                                  });
                                  return;
                                }
                              }
                              const protocolTypeMap: Record<string, { id: string; name: string }> = {
                                'HTTP': { id: 'metadata-http', name: 'HTTP接口' },
                                'SQL': { id: 'metadata-sql', name: 'SQL操作' },
                                'DUBBO': { id: 'metadata-dubbo', name: 'DUBBO服务' },
                                'ROCKETMQ': { id: 'metadata-mq', name: 'RocketMQ消息' },
                                'FILE': { id: 'metadata-file', name: '文件上传' },
                                'SCRIPT': { id: 'metadata-script', name: '造数工厂' },
                              };
                              const fallbackType = protocolTypeMap[protocolContext];
                              if (fallbackType) {
                                onSetCurrentSelection({ 
                                  level: 'metadata-type', 
                                  id: fallbackType.id,
                                  name: fallbackType.name 
                                });
                              }
                            }
                          }
                        }}
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isModuleSelectOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isModuleSelectOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[400px] overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="搜索模块"
                          className={`pl-8 ${moduleSearchKeyword ? 'pr-8' : ''} text-sm`}
                          value={moduleSearchKeyword}
                          onChange={(e) => setModuleSearchKeyword(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {moduleSearchKeyword && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModuleSearchKeyword('');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                            title="清除搜索"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-[350px]">
                      {topLevelModuleNodes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          {moduleSearchKeyword.trim() ? '未找到匹配的模块' : '暂无模块'}
                        </div>
                      ) : (
                        topLevelModuleNodes.map(node => renderModuleTreeNode(node, 0)).filter(Boolean)
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="请输入名称"
                  className={`h-8 pl-8 text-sm ${tableSearchKeyword ? 'pr-8' : ''} bg-white`}
                  value={tableSearchKeyword}
                  onChange={(e) => setTableSearchKeyword(e.target.value)}
                />
                {tableSearchKeyword && (
                  <button
                    type="button"
                    onClick={() => setTableSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                    title="清除搜索"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="请输入负责人"
                  className={`h-8 pl-8 text-sm ${createUserSearch ? 'pr-8' : ''} bg-white`}
                  value={createUserSearch}
                  onChange={(e) => setCreateUserSearch(e.target.value)}
                />
                {createUserSearch && (
                  <button
                    type="button"
                    onClick={() => setCreateUserSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                    title="清除搜索"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              {selectedDefinitionIds.size > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    dialogs.setIsBatchMoveDialogOpen(true);
                    dialogs.setBatchMoveTargetModuleId('');
                  }}
                >
                  <Move className="w-4 h-4 mr-1" />
                  移动 ({selectedDefinitionIds.size})
                </Button>
              )}
              {(protocolContext === 'HTTP' || protocolContext === 'DUBBO') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    if (currentSelection.level === 'metadata-category' && currentSelection.id) {
                      dialogs.setImportModuleId(currentSelection.id);
                    } else {
                      dialogs.setImportModuleId('');
                    }
                    dialogs.setImportUrl('');
                    dialogs.setImportServiceCode('');
                    dialogs.setImportProjectId(projectId || '');
                    dialogs.setIsImportDialogOpen(true);
                  }}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  导入
                </Button>
              )}
              {protocolContext === 'FILE' ? (
                <Button 
                  size="sm"
                  className="h-8"
                  onClick={() => onHandleAddApi('file', '文件上传')}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  上传文件
                </Button>
              ) : (
                <Button 
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    if (protocolContext === 'SQL') {
                      dialogs.setIsDdlImportDialogOpen(true);
                      onLoadDdlImportEnvironments();
                    } else if (protocolContext === 'DUBBO') {
                      onHandleAddApi('dubbo', '新建DUBBO');
                    } else if (protocolContext === 'ROCKETMQ') {
                      onHandleAddApi('rocketmq', '新建RocketMQ');
                    } else if (protocolContext === 'SCRIPT') {
                      onHandleAddApi('data-factory', '新建造数工厂');
                    } else {
                      onHandleAddApi('http', '新建Http接口');
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {
                    protocolContext === 'SQL' ? '导入DDL' :
                    protocolContext === 'DUBBO' ? '新建DUBBO' :
                    protocolContext === 'ROCKETMQ' ? '新建RocketMQ' :
                    protocolContext === 'SCRIPT' ? '新建造数工厂' :
                    '新建HTTP接口'
                  }
                </Button>
              )}
            </div>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-auto"
            style={{ minHeight: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 250px)' }}
          >
            <div className="min-w-full">
              <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleToggleSelectAll(checked as boolean, tableData)}
                      className={isIndeterminate ? 'data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary' : ''}
                    />
                  </TableHead>
                  <TableHead className="w-64">名称</TableHead>
                  <TableHead className="w-24">类型</TableHead>
                  <TableHead className={protocolContext === 'SCRIPT' ? 'w-24' : 'w-80'}>
                    {
                      protocolContext === 'SQL' ? 'SQL' :
                      protocolContext === 'DUBBO' ? '服务接口' :
                      protocolContext === 'ROCKETMQ' ? 'Topic' :
                      protocolContext === 'FILE' ? '文件ID' :
                      protocolContext === 'SCRIPT' ? '脚本内容' :
                      '路径'
                    }
                  </TableHead>
                  <TableHead className="w-56">所属模块</TableHead>
                  <TableHead className="w-20">用例数</TableHead>
                  <TableHead className="w-20">版本</TableHead>
                  <TableHead className="w-36">创建时间</TableHead>
                  <TableHead className="w-36">更新时间</TableHead>
                  <TableHead className="w-24">负责人</TableHead>
                  {protocolContext !== 'SQL' && (
                    <TableHead className="w-40">操作</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && tableData.length === 0 ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                      {protocolContext !== 'SQL' && (
                        <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                      )}
                    </TableRow>
                  ))
                ) : tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={protocolContext === 'SQL' ? 10 : 11} className="text-center py-8 text-gray-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((item) => {
                    const definition = definitions.find(def => def.id === item.id);
                    const isTestData = definition && 
                      (definition.protocol === 'HTTP' || definition.protocol === 'DUBBO') && 
                      definition.isCase === false;
                    
                    return (
                      <TableRow 
                        key={item.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onHandleOpenApi(item)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {!item.id.startsWith('sync-') ? (
                            <Checkbox
                              checked={selectedDefinitionIds.has(item.id)}
                              onCheckedChange={() => handleToggleSelection(item.id)}
                            />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium overflow-hidden whitespace-nowrap" title={item.name}>
                          {truncateText(item.name, 28)}
                        </TableCell>
                        <TableCell>
                          {protocolContext === 'SCRIPT' ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              SCRIPT
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(item.type)}`}>
                              {item.type}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm overflow-hidden whitespace-nowrap" title={(() => {
                          if (protocolContext === 'SCRIPT') return '';
                          return item.path || '/';
                        })()}>
                          {(() => {
                            if (protocolContext === 'SCRIPT') {
                              return (
                                <span 
                                  className="text-blue-600 hover:underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (definition) {
                                      onHandleOpenApi(item);
                                    }
                                  }}
                                >
                                  点击查看
                                </span>
                              );
                            }
                            
                            const path = item.path || '/';
                            return truncateText(path, 38);
                          })()}
                        </TableCell>
                        <TableCell className="text-gray-600 overflow-hidden whitespace-nowrap" title={item.module || '-'}>
                          {truncateText(item.module || '-', 28)}
                        </TableCell>
                        <TableCell className="text-gray-600 overflow-hidden whitespace-nowrap">
                          {item.testCount ?? 0}
                        </TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm overflow-hidden whitespace-nowrap">
                          {item.version || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm overflow-hidden whitespace-nowrap" title={item.createdAt || '-'}>
                          {truncateText(item.createdAt || '-', 19)}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm overflow-hidden whitespace-nowrap" title={item.updatedAt || '-'}>
                          {truncateText(item.updatedAt || '-', 19)}
                        </TableCell>
                        <TableCell className="text-gray-600 overflow-hidden whitespace-nowrap" title={item.creator ? (userNameMap.get(item.creator) || item.creator) : '-'}>
                          {truncateText(item.creator ? (userNameMap.get(item.creator) || item.creator) : '-', 12)}
                        </TableCell>
                        {protocolContext !== 'SQL' && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {isTestData ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span 
                                  className="text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => handleExecuteDefinition(item)}
                                >
                                  执行
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <span 
                                  className="text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => handleEditDefinition(item)}
                                >
                                  编辑
                                </span>
                                <span className="text-gray-400">|</span>
                                <span 
                                  className="text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => handleExecuteDefinition(item)}
                                >
                                  执行
                                </span>
                                {protocolContext !== 'SCRIPT' && (
                                  <>
                                    <span className="text-gray-400">|</span>
                                    <span 
                                      className="text-blue-600 hover:underline cursor-pointer"
                                      onClick={async () => await handleCopyDefinition(item.id)}
                                    >
                                      复制
                                    </span>
                                  </>
                                )}
                                <span className="text-gray-400">|</span>
                                <span 
                                  className="text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => handleDeleteDefinition(item.id, item.name)}
                                >
                                  删除
                                </span>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

