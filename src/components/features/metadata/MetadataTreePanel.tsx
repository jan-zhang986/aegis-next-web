import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderPlus, Edit, Trash2, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TYPE_CONFIG } from '@/constants/metadata';
import type { MetadataModuleNode, MetadataDefinition, PluginSyncNode } from '@/services/metadata';
import type { ApiItem, ApiGroup, OpenedTest } from '@/types';
import { flattenNodes, getTypeBadgeColor } from '@/utils/metadataHelpers';
import type { CurrentSelection } from '@/hooks/useMetadataSearch';
import type { UseMetadataDialogsResult } from '@/hooks/useMetadataDialogs';

interface MetadataTreePanelProps {
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  currentSelection: CurrentSelection;
  metadataTypes: Array<{ id: string; name: string; count: number; icon: string; moduleIds: string[] }>;
  metadataCategories: Array<{ id: string; name: string; typeId: string; count: number; path: string; parentId: string }>;
  moduleTree: MetadataModuleNode[];
  metadataItems: ApiItem[];
  calculateModuleCounts: Map<string, number>;
  userGroups: ApiGroup[];
  pluginSyncNodes: PluginSyncNode[];
  loadingPluginSyncNodes: boolean;
  searchKeyword: string;
  dialogs: UseMetadataDialogsResult;
  onHandleClickMetadata: () => void;
  onHandleClickMetadataType: (typeId: string, typeName: string) => void;
  onHandleClickMetadataCategory: (categoryId: string, categoryName: string) => void;
  onHandleOpenApi: (api: ApiItem) => void;
  onHandlePreviewSyncNode: (node: PluginSyncNode, e?: React.MouseEvent) => void;
  onHandleOpenSyncNode: (node: PluginSyncNode, e?: React.MouseEvent) => void;
  onSetOpenedTest: (test: OpenedTest | null) => void;
  onSetPreviewDefinition: (def: MetadataDefinition | null) => void;
  selectedTopMenu?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function MetadataTreePanel({
  expandedFolders,
  toggleFolder,
  currentSelection,
  metadataTypes,
  metadataCategories,
  moduleTree,
  metadataItems,
  calculateModuleCounts,
  userGroups,
  pluginSyncNodes,
  loadingPluginSyncNodes,
  searchKeyword,
  dialogs,
  onHandleClickMetadata,
  onHandleClickMetadataType,
  onHandleClickMetadataCategory,
  onHandleOpenApi,
  onHandlePreviewSyncNode,
  onHandleOpenSyncNode,
  onSetOpenedTest,
  onSetPreviewDefinition,
  selectedTopMenu,
  isCollapsed = false,
  onToggleCollapse,
}: MetadataTreePanelProps) {
  const handleAddModule = () => {
    if (currentSelection.level === 'metadata-type') {
      const typeInfo = metadataTypes.find(t => t.id === currentSelection.id);
      if (typeInfo) {
        const typeMap: Record<string, 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE'> = {
          'metadata-http': 'API',
          'metadata-sql': 'SQL',
          'metadata-dubbo': 'DUBBO',
          'metadata-mq': 'ROCKETMQ',
          'metadata-file': 'FILE',
        };
        dialogs.setSelectedModuleType(typeMap[typeInfo.id] || 'API');
      }
    } else if (currentSelection.level === 'metadata-category') {
      const category = metadataCategories.find(cat => cat.id === currentSelection.id);
      if (category) {
        const allNodes = flattenNodes(moduleTree);
        const moduleNode = allNodes.find(node => node.id === category.id);
        if (moduleNode && (moduleNode.type === 'API' || moduleNode.type === 'SQL' || moduleNode.type === 'DUBBO' || moduleNode.type === 'ROCKETMQ' || moduleNode.type === 'FILE')) {
          dialogs.setSelectedModuleType(moduleNode.type);
        }
      }
    }
    dialogs.setIsAddModuleDialogOpen(true);
  };

  const handleEditModule = () => {
    // 如果当前有选中的模块，自动填充
    if (currentSelection.level === 'metadata-category' && currentSelection.id && currentSelection.name) {
      dialogs.setEditModuleId(currentSelection.id);
      dialogs.setEditModuleName(currentSelection.name);
    } else {
      // 清空状态，让用户在对话框中选择
      dialogs.setEditModuleId('');
      dialogs.setEditModuleName('');
    }
    dialogs.setIsEditModuleDialogOpen(true);
  };

  const handleDeleteModule = () => {
    // 如果当前有选中的模块，自动设置
    if (currentSelection.level === 'metadata-category' && currentSelection.id) {
      dialogs.setDeleteModuleId(currentSelection.id);
    } else {
      // 清空状态，让用户在对话框中选择
      dialogs.setDeleteModuleId('');
    }
    dialogs.setIsDeleteModuleDialogOpen(true);
  };

  const renderNodeTree = (node: MetadataModuleNode): JSX.Element => {
    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const hasItems = metadataItems.filter(item => item.groupId === node.id).length > 0;
    const canExpand = hasChildren || hasItems;
    const isExpanded = expandedFolders.has(node.id);

    return (
      <div key={node.id}>
        <div
          onClick={() => {
            if (canExpand) {
              toggleFolder(node.id);
            } else {
              onHandleClickMetadataCategory(node.id, node.name);
            }
          }}
          className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
        >
          <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
            {canExpand ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )
            ) : null}
          </div>
          <span
            className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            onClick={(e) => {
              e.stopPropagation();
              onHandleClickMetadataCategory(node.id, node.name);
            }}
            title={node.name}
          >
            {node.name}
          </span>
          <span className="flex-shrink-0 text-xs text-gray-400">({calculateModuleCounts.get(node.id) || 0})</span>
        </div>

        {canExpand && isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5">
            {hasChildren && node.children!.map(child => renderNodeTree(child))}
            {metadataItems
              .filter(item => item.groupId === node.id)
              .map((item) => {
                // 只有HTTP协议需要显示GET、POST等标签
                const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
                const shouldShowType = item.protocol === 'HTTP' && httpMethods.includes(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => onHandleOpenApi(item)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer"
                  >
                    {shouldShowType && (
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(item.type)}`}>
                        {item.type}
                      </span>
                    )}
                    <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-green-600" title={item.name}>{item.name}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  // 收起状态：只显示一个窄的侧边栏，包含收起/展开按钮和图标
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center justify-center relative">
        {/* 展开按钮 - 简单的 > 符号 */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            title="展开模块树"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col relative">
      {/* 收起按钮 - 简单的 < 符号 */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-10 flex items-center justify-center bg-white border border-l-0 border-gray-200 rounded-r hover:bg-gray-50 transition-colors z-10 shadow-sm text-gray-500 hover:text-gray-700"
          title="收起模块树"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}
      
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex justify-between items-center px-2">
          <button
            onClick={handleAddModule}
            className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="text-sm font-medium">添加</span>
          </button>

          <button
            onClick={handleEditModule}
            className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm font-medium">修改</span>
          </button>

          <button
            onClick={handleDeleteModule}
            className="flex items-center gap-1.5 text-gray-700 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">删除</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {selectedTopMenu === 'data-factory' ? (
          // 造数工厂页面：只显示造数工厂的模块树
          <div className="mb-2">
            {(() => {
              const scriptNodes = moduleTree.filter(node => {
                const config = TYPE_CONFIG[node.type];
                return config?.id === 'metadata-script' && node.parentId === 'NONE';
              });

              // 计算总数：所有脚本根节点的计数之和
              const totalCount = scriptNodes.reduce((sum, node) => {
                return sum + (calculateModuleCounts.get(node.id) || 0);
              }, 0);

              if (scriptNodes.length === 0) {
                return (
                  <div className="px-4 py-8 text-sm text-gray-400 text-center flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                      <FolderPlus className="w-4 h-4 text-gray-300" />
                    </div>
                    <p>暂无造数模块</p>
                    <Button variant="outline" size="sm" onClick={handleAddModule} className="mt-2 h-8">
                      创建模块
                    </Button>
                  </div>
                );
              }

              const isAllSelected = currentSelection.level === 'metadata-type' && currentSelection.id === 'metadata-script';
              return (
                <div>
                  <div className="w-full flex items-center gap-1 px-3 py-2 text-sm text-gray-700 select-none group">
                    <div
                      onClick={() => toggleFolder('data-factory-root')}
                      className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer rounded"
                    >
                      {expandedFolders.has('data-factory-root') ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onHandleClickMetadataType('metadata-script', '造数工厂');
                      }}
                      className={`flex-1 flex items-center gap-1 min-w-0 rounded cursor-pointer py-0.5 -my-0.5 px-1 -mx-1 ${isAllSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      title="造数工厂（全部）"
                    >
                      <span className="text-base mr-1">🏭</span>
                      <span className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium ${isAllSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        造数工厂
                      </span>
                      <span className={`flex-shrink-0 text-xs ${isAllSelected ? 'text-blue-500' : 'text-gray-400'}`}>({totalCount})</span>
                    </div>
                  </div>

                  {expandedFolders.has('data-factory-root') && (
                    <div className="ml-5 mt-1 border-l border-gray-100 pl-1">
                      {scriptNodes.flatMap(node => {
                        // 如果根节点有子节点，只显示子节点（不显示根节点本身）
                        if (node.children && node.children.length > 0) {
                          // 这里我们只渲染子节点的文件夹结构
                          // 如果需要渲染根节点下的文件，需要在 map 外部额外处理，
                          // 但为了保持与原有逻辑一致（原有逻辑就是这样unwarp的），我们先只渲染子节点
                          return node.children.map(child => renderNodeTree(child));
                        }

                        // 如果根节点没有子节点，但有脚本，显示根节点本身
                        // 这样至少能看到那个唯一的文件夹
                        const hasItems = metadataItems.filter(item => item.groupId === node.id).length > 0;
                        if (hasItems) {
                          return [renderNodeTree(node)];
                        }
                        return [];
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            <div className="mb-2">
              <div
                onClick={() => toggleFolder('metadata')}
                className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm cursor-pointer"
              >
                {expandedFolders.has('metadata') ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span
                  className="text-gray-700 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHandleClickMetadata();
                  }}
                >
                  元数据管理
                </span>
              </div>

              {expandedFolders.has('metadata') && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {metadataTypes.filter(type => type.id !== 'metadata-script').map((type) => {
                    const typeCategories = metadataCategories.filter(cat => cat.typeId === type.id);
                    return (
                      <div key={type.id}>
                        <div
                          onClick={() => toggleFolder(type.id)}
                          className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                        >
                          <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
                            {expandedFolders.has(type.id) ? (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <span className="flex-shrink-0 text-xs mr-1">{type.icon}</span>
                          <span
                            className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              onHandleClickMetadataType(type.id, type.name);
                            }}
                            title={type.name}
                          >
                            {type.name}
                          </span>
                          <span className="flex-shrink-0 text-xs text-gray-400">({type.count})</span>
                        </div>

                        {expandedFolders.has(type.id) && (() => {
                          const typeNodes = moduleTree.filter(node => {
                            const config = TYPE_CONFIG[node.type];
                            return config?.id === type.id && node.parentId === 'NONE';
                          });

                          if (typeNodes.length === 0) return null;

                          return (
                            <div className="ml-4 mt-1 space-y-0.5">
                              {typeNodes.flatMap(node => {
                                if (node.children && node.children.length > 0) {
                                  return node.children.map(child => renderNodeTree(child));
                                }
                                const hasItems = metadataItems.filter(item => item.groupId === node.id).length > 0;
                                if (hasItems) {
                                  return [renderNodeTree(node)];
                                }
                                return [];
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="my-2 border-t border-gray-200"></div>
          </>
        )}

        {selectedTopMenu !== 'data-factory' && (
          <div className="mb-2">
            <div
              onClick={() => toggleFolder('plugin-sync')}
              className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm cursor-pointer"
            >
              {expandedFolders.has('plugin-sync') ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-gray-700 flex-1">同步数据</span>
              <span className="text-xs text-gray-400">({pluginSyncNodes.length})</span>
            </div>

            {expandedFolders.has('plugin-sync') && (
              <div className="ml-4 mt-1 space-y-0.5">
                <div>
                  <div
                    onClick={() => toggleFolder('plugin-sync-http')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedFolders.has('plugin-sync-http') ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs mr-1">🔌</span>
                    <span className="flex-1">HTTP接口</span>
                    <span className="text-xs text-gray-400">
                      ({pluginSyncNodes.filter(n => n.nodeType === 'HTTP').length})
                    </span>
                  </div>

                  {expandedFolders.has('plugin-sync-http') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'HTTP').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'HTTP')
                          .filter(n => {
                            if (!searchKeyword) return true;
                            const keyword = searchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.name || endpointData.path || endpointData.url || n.nodeId;
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const method = endpointData.method || 'GET';
                            const name = endpointData.name || endpointData.path || endpointData.url || node.nodeId;
                            const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
                            const shouldShowType = httpMethods.includes(method);

                            return (
                              <div
                                key={node.nodeId}
                                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer"
                                onClick={(e) => onHandlePreviewSyncNode(node, e)}
                              >
                                {shouldShowType && (
                                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(method)}`}>
                                    {method}
                                  </span>
                                )}
                                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-green-600" title={name}>{name}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    onClick={() => toggleFolder('plugin-sync-sql')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedFolders.has('plugin-sync-sql') ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs mr-1">📊</span>
                    <span className="flex-1">SQL操作</span>
                    <span className="text-xs text-gray-400">
                      ({pluginSyncNodes.filter(n => n.nodeType === 'SQL').length})
                    </span>
                  </div>

                  {expandedFolders.has('plugin-sync-sql') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'SQL').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'SQL')
                          .filter(n => {
                            if (!searchKeyword) return true;
                            const keyword = searchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.name || endpointData.sql || '';
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const sql = endpointData.sql || '';
                            const name = endpointData.name || (sql.length > 50 ? sql.substring(0, 50) + '...' : sql);

                            return (
                              <div
                                key={node.nodeId}
                                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer"
                                onClick={(e) => onHandlePreviewSyncNode(node, e)}
                              >
                                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-green-600" title={sql}>{name}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    onClick={() => toggleFolder('plugin-sync-dubbo')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedFolders.has('plugin-sync-dubbo') ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs mr-1">🔄</span>
                    <span className="flex-1">DUBBO服务</span>
                    <span className="text-xs text-gray-400">
                      ({pluginSyncNodes.filter(n => n.nodeType === 'DUBBO').length})
                    </span>
                  </div>

                  {expandedFolders.has('plugin-sync-dubbo') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'DUBBO').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'DUBBO')
                          .filter(n => {
                            if (!searchKeyword) return true;
                            const keyword = searchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.name || endpointData.interface_name || endpointData.interfaceName || n.nodeId;
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const interfaceName = endpointData.interface_name || endpointData.interfaceName || '';
                            const methodName = endpointData.method_name || endpointData.methodName || '';
                            const name = endpointData.name || (interfaceName && methodName
                              ? `${interfaceName}.${methodName}`
                              : interfaceName || methodName || node.nodeId);

                            return (
                              <div
                                key={node.nodeId}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer"
                                onClick={(e) => onHandlePreviewSyncNode(node, e)}
                              >
                                <span className="text-xs text-gray-500 flex-shrink-0">DUBBO</span>
                                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-green-600" title={name}>{name}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    onClick={() => toggleFolder('plugin-sync-mq')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedFolders.has('plugin-sync-mq') ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs mr-1">🚀</span>
                    <span className="flex-1">RocketMQ消息</span>
                    <span className="text-xs text-gray-400">
                      ({pluginSyncNodes.filter(n => n.nodeType === 'ROCKETMQ').length})
                    </span>
                  </div>

                  {expandedFolders.has('plugin-sync-mq') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'ROCKETMQ').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'ROCKETMQ')
                          .filter(n => {
                            if (!searchKeyword) return true;
                            const keyword = searchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.topic || n.nodeId;
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const topic = endpointData.topic || '';
                            const name = topic || node.nodeId;

                            return (
                              <div
                                key={node.nodeId}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer"
                                onClick={(e) => onHandleOpenSyncNode(node, e)}
                              >
                                <span className="text-xs text-gray-500 flex-shrink-0">RocketMQ</span>
                                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-green-600" title={name}>{name}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTopMenu !== 'data-factory' && (
          <>
            {userGroups.map((group) => (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleFolder(group.id)}
                  className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm"
                >
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    {expandedFolders.has(group.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span
                    className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-gray-700 text-left"
                    title={group.name}
                  >
                    {group.name}
                  </span>
                  <span className="flex-shrink-0 text-xs text-gray-400">({group.items.length})</span>
                </button>

                {expandedFolders.has(group.id) && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
                      const shouldShowType = httpMethods.includes(item.type);
                      return (
                        <div
                          key={item.id}
                          onClick={() => onHandleOpenApi(item)}
                          className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer"
                        >
                          {shouldShowType && (
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(item.type)}`}>
                              {item.type}
                            </span>
                          )}
                          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-green-600" title={item.name}>{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

