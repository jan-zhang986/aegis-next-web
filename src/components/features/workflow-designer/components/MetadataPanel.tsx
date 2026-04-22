/**
 * MetadataPanel 组件
 * 元数据列表面板
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';
import { NodeType } from '@/components/workflow';
import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import type { MetadataDefinition, MetadataModuleNode, PluginSyncNode } from '@/services/metadata';
import { convertDefinitionToNode, generateId } from '../utils/nodeConverter';
import { toast } from 'sonner';

interface MetadataPanelProps {
  // 搜索
  metadataSearchKeyword: string;
  setMetadataSearchKeyword: (keyword: string) => void;
  // 加载状态
  loadingMetadata: boolean;
  loadingPluginSyncNodes: boolean;
  // 展开/折叠
  expandedMetadataFolders: Set<string>;
  toggleMetadataFolder: (folderId: string) => void;
  // 元数据
  metadataTypes: Array<{ id: string; name: string; count: number; icon: string; moduleIds: string[] }>;
  metadataCategories: Array<{ id: string; name: string; typeId: string; count: number; path: string }>;
  metadataItems: Array<{ id: string; name: string; type: string; groupId: string; category: string; protocol: string }>;
  moduleTree: MetadataModuleNode[];
  definitions: MetadataDefinition[];
  // 插件同步节点
  pluginSyncNodes: PluginSyncNode[];
  // 工作流
  workflow: WorkflowData;
  setWorkflow: React.Dispatch<React.SetStateAction<WorkflowData>>;
  // 转换函数
  convertDefinitionToNode: (definition: MetadataDefinition) => void;
}

/**
 * 获取类型颜色
 */
const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'GET': 'text-orange-600',
    'POST': 'text-yellow-600',
    'PUT': 'text-blue-600',
    'DELETE': 'text-red-600',
    'SQL': 'text-cyan-600',
    'DUBBO': 'text-blue-600',
    'RocketMQ': 'text-green-600',
    'FILE': 'text-purple-600',
  };
  return colors[type] || 'text-gray-600';
};

/**
 * MetadataPanel 组件
 */
export const MetadataPanel = React.memo<MetadataPanelProps>(function MetadataPanel({
  metadataSearchKeyword,
  setMetadataSearchKeyword,
  loadingMetadata,
  loadingPluginSyncNodes,
  expandedMetadataFolders,
  toggleMetadataFolder,
  metadataTypes,
  metadataCategories,
  metadataItems,
  moduleTree,
  definitions,
  pluginSyncNodes,
  workflow,
  setWorkflow,
  convertDefinitionToNode,
}: MetadataPanelProps) {
  // 递归渲染节点树
  const renderNodeTree = React.useCallback((node: MetadataModuleNode): JSX.Element => {
    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const hasItems = metadataItems.filter(item => item.groupId === node.id).length > 0;
    const canExpand = hasChildren || hasItems;
    const isExpanded = expandedMetadataFolders.has(node.id);

    return (
      <div key={node.id}>
        <div
          onClick={() => {
            if (canExpand) {
              toggleMetadataFolder(node.id);
            }
          }}
          className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer min-w-0"
          title={node.name}
        >
          {/* 展开/收起箭头 */}
          <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
            {canExpand ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )
            ) : null}
          </div>
          {/* 节点名称 */}
          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
            {node.name}
          </span>
          {/* 数据统计 */}
          <span className="flex-shrink-0 text-xs text-gray-400">({node.count || 0})</span>
        </div>

        {/* 展开时显示子节点和定义项 */}
        {canExpand && isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5">
            {/* 递归渲染子节点 */}
            {hasChildren && node.children!.map(child => renderNodeTree(child))}
            {/* 显示该节点下的定义项 */}
            {metadataItems
              .filter(item => item.groupId === node.id)
              .filter(item => {
                if (!metadataSearchKeyword) return true;
                const keyword = metadataSearchKeyword.toLowerCase();
                return item.name.toLowerCase().includes(keyword);
              })
              .map((item) => {
                const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
                const shouldShowType = httpMethods.includes(item.type);

                const definition = definitions.find(def => def.id === item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (definition) {
                        convertDefinitionToNode(definition);
                      } else {
                        toast.error('未找到对应的接口定义');
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer text-left min-w-0',
                      getTypeColor(item.type)
                    )}
                    title={item.name}
                  >
                    {shouldShowType && (
                      <span className="flex-shrink-0 text-xs">{item.type}</span>
                    )}
                    <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.name}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    );
  }, [metadataItems, expandedMetadataFolders, toggleMetadataFolder, metadataSearchKeyword, definitions, convertDefinitionToNode]);

  // 处理插件同步节点添加到画布
  const handleAddPluginSyncNode = React.useCallback((
    node: PluginSyncNode,
    nodeType: NodeType,
    nodeConfig: any,
    nodeName: string
  ) => {
    const existingNodes = workflow.nodes;
    const maxY = existingNodes.length > 0
      ? Math.max(...existingNodes.map(n => n.y)) + 200
      : 100;

    const newNode: WorkflowNodeData = {
      id: generateId(),
      type: nodeType,
      name: nodeName,
      description: '',
      config: nodeConfig,
      x: 100 + Math.random() * 200,
      y: maxY,
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    toast.success(`已添加节点"${nodeName}"`);
  }, [workflow.nodes, setWorkflow]);

  return (
    <>
      {/* 搜索框 */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索目标接口"
            value={metadataSearchKeyword}
            onChange={(e) => setMetadataSearchKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {/* Metadata Management */}
          <div className="mb-2">
            <div
              onClick={() => toggleMetadataFolder('metadata')}
              className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm cursor-pointer"
            >
              {expandedMetadataFolders.has('metadata') ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-gray-700 flex-1">元数据管理</span>
            </div>

            {expandedMetadataFolders.has('metadata') && (
              <div className="ml-4 mt-1 space-y-0.5">
                {loadingMetadata ? (
                  <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                ) : (
                  metadataTypes.map((type) => {
                    // 获取该类型下的所有顶级节点（parentId 为 NONE 的节点）
                    const typeNodes = moduleTree.filter(node => {
                      // 匹配类型：根据 type.id 匹配 node.type
                    // type.id 格式：'metadata-http', 'metadata-sql' 等
                    // node.type 格式：'API', 'SQL', 'DUBBO' 等
                    const typeIdToNodeTypeMap: Record<string, string> = {
                      'metadata-http': 'API',
                      'metadata-sql': 'SQL',
                      'metadata-dubbo': 'DUBBO',
                      'metadata-mq': 'ROCKETMQ',
                      'metadata-file': 'FILE',
                    };
                    const expectedNodeType = typeIdToNodeTypeMap[type.id] || '';
                    return node.type === expectedNodeType && node.parentId === 'NONE';
                    });

                    if (typeNodes.length === 0) return null;

                    return (
                      <div key={type.id}>
                        <div
                          onClick={() => toggleMetadataFolder(type.id)}
                          className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer min-w-0"
                          title={type.name}
                        >
                          <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
                            {expandedMetadataFolders.has(type.id) ? (
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <span className="flex-shrink-0 text-xs mr-1">{type.icon}</span>
                          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {type.name}
                          </span>
                          <span className="flex-shrink-0 text-xs text-gray-400">({type.count})</span>
                        </div>

                        {expandedMetadataFolders.has(type.id) && (
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
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 同步数据菜单 */}
          <div className="mb-2">
            <div
              onClick={() => toggleMetadataFolder('plugin-sync')}
              className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm cursor-pointer"
            >
              {expandedMetadataFolders.has('plugin-sync') ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-gray-700 flex-1">同步数据</span>
              <span className="text-xs text-gray-400">({pluginSyncNodes.length})</span>
            </div>

            {expandedMetadataFolders.has('plugin-sync') && (
              <div className="ml-4 mt-1 space-y-0.5">
                {/* HTTP接口子菜单 */}
                <div>
                  <div
                    onClick={() => toggleMetadataFolder('plugin-sync-http')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedMetadataFolders.has('plugin-sync-http') ? (
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

                  {expandedMetadataFolders.has('plugin-sync-http') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'HTTP').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'HTTP')
                          .filter(n => {
                            if (!metadataSearchKeyword) return true;
                            const keyword = metadataSearchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.path || endpointData.url || n.nodeId;
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const method = endpointData.method || 'GET';
                            const name = endpointData.path || endpointData.url || node.nodeId;

                            return (
                              <button
                                key={node.nodeId}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer text-left"
                                onClick={() => {
                                  const nodeConfig: any = {
                                    method: endpointData.method || 'GET',
                                    url: endpointData.url || '',
                                    path: endpointData.path || '',
                                    headers: endpointData.headers || {},
                                    queryParams: endpointData.queryParams || {},
                                  };
                                  handleAddPluginSyncNode(node, NodeType.HTTP_REQUEST, nodeConfig, name || 'HTTP 请求');
                                }}
                              >
                                <span className={cn(
                                  'text-xs font-medium',
                                  method === 'GET' ? 'text-green-600' :
                                  method === 'POST' ? 'text-blue-600' :
                                  method === 'PUT' ? 'text-yellow-600' :
                                  method === 'DELETE' ? 'text-red-600' :
                                  'text-gray-600'
                                )}>
                                  {method}
                                </span>
                                <span className="flex-1 truncate">{name}</span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                {/* SQL操作子菜单 */}
                <div>
                  <div
                    onClick={() => toggleMetadataFolder('plugin-sync-sql')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedMetadataFolders.has('plugin-sync-sql') ? (
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

                  {expandedMetadataFolders.has('plugin-sync-sql') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'SQL').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'SQL')
                          .filter(n => {
                            if (!metadataSearchKeyword) return true;
                            const keyword = metadataSearchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const sql = endpointData.sql || '';
                            return sql.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const sql = endpointData.sql || '';
                            const operationType = endpointData.operationType || 'SELECT';
                            const name = sql.length > 50 ? sql.substring(0, 50) + '...' : sql;

                            return (
                              <button
                                key={node.nodeId}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer text-left"
                                onClick={() => {
                                  const nodeConfig: any = {
                                    sql: endpointData.sql || '',
                                    operationType: endpointData.operationType || 'SELECT',
                                  };
                                  handleAddPluginSyncNode(node, NodeType.MYSQL, nodeConfig, name || 'SQL 操作');
                                }}
                              >
                                <span className="text-xs text-gray-500">SQL</span>
                                <span className="flex-1 truncate">{name}</span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                {/* DUBBO服务子菜单 */}
                <div>
                  <div
                    onClick={() => toggleMetadataFolder('plugin-sync-dubbo')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedMetadataFolders.has('plugin-sync-dubbo') ? (
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

                  {expandedMetadataFolders.has('plugin-sync-dubbo') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'DUBBO').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'DUBBO')
                          .filter(n => {
                            if (!metadataSearchKeyword) return true;
                            const keyword = metadataSearchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.interface_name || endpointData.interfaceName || n.nodeId;
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const interfaceName = endpointData.interface_name || endpointData.interfaceName || '';
                            const methodName = endpointData.method_name || endpointData.methodName || '';
                            const name = interfaceName || node.nodeId;

                            return (
                              <button
                                key={node.nodeId}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer text-left"
                                onClick={() => {
                                  const nodeConfig: any = {
                                    url: endpointData.url || '',
                                    interface_name: endpointData.interface_name || endpointData.interfaceName || '',
                                    method_name: endpointData.method_name || endpointData.methodName || '',
                                    version: endpointData.version || '',
                                    group: endpointData.group || '',
                                    timeout: endpointData.timeout || 3000,
                                    parameters: endpointData.parameters || [],
                                  };
                                  handleAddPluginSyncNode(node, NodeType.DUBBO, nodeConfig, name || 'DUBBO 调用');
                                }}
                              >
                                <span className="text-xs text-gray-500">DUBBO</span>
                                <span className="flex-1 truncate">{name}</span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                {/* MQ消息子菜单 */}
                <div>
                  <div
                    onClick={() => toggleMetadataFolder('plugin-sync-mq')}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700 cursor-pointer"
                  >
                    {expandedMetadataFolders.has('plugin-sync-mq') ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs mr-1">🚀</span>
                    <span className="flex-1">MQ消息</span>
                    <span className="text-xs text-gray-400">
                      ({pluginSyncNodes.filter(n => n.nodeType === 'ROCKETMQ').length})
                    </span>
                  </div>

                  {expandedMetadataFolders.has('plugin-sync-mq') && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {loadingPluginSyncNodes ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">加载中...</div>
                      ) : pluginSyncNodes.filter(n => n.nodeType === 'ROCKETMQ').length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">暂无数据</div>
                      ) : (
                        pluginSyncNodes
                          .filter(n => n.nodeType === 'ROCKETMQ')
                          .filter(n => {
                            if (!metadataSearchKeyword) return true;
                            const keyword = metadataSearchKeyword.toLowerCase();
                            const endpointData = n.endpointData || {};
                            const name = endpointData.topic || n.nodeId;
                            return name.toLowerCase().includes(keyword);
                          })
                          .map((node) => {
                            const endpointData = node.endpointData || {};
                            const topic = endpointData.topic || '';
                            const name = topic || node.nodeId;

                            return (
                              <button
                                key={node.nodeId}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-50 rounded cursor-pointer text-left"
                                onClick={() => {
                                  const nodeConfig: any = {
                                    topic: endpointData.topic || '',
                                    message_body: endpointData.message_body || endpointData.messageBody || '',
                                    mq_url: endpointData.mq_url || endpointData.mqUrl || '',
                                    tag: endpointData.tag || '',
                                    producer_group: endpointData.producer_group || endpointData.producerGroup || '',
                                  };
                                  handleAddPluginSyncNode(node, NodeType.ROCKETMQ, nodeConfig, name || 'RocketMQ 消息');
                                }}
                              >
                                <span className="text-xs text-gray-500">MQ</span>
                                <span className="flex-1 truncate">{name}</span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  );
});
