/**
 * useMetadataSync Hook
 * 管理元数据同步逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { metadataService, type MetadataDefinition, type MetadataModuleNode, pluginSyncNodeService, type PluginSyncNode } from '@/services/metadata';

interface UseMetadataSyncParams {
  projectId: string;
  leftPanelTab: 'public-nodes' | 'nodes' | 'metadata' | 'history';
}

interface UseMetadataSyncReturn {
  // 元数据状态
  moduleTree: MetadataModuleNode[];
  setModuleTree: React.Dispatch<React.SetStateAction<MetadataModuleNode[]>>;
  definitions: MetadataDefinition[];
  setDefinitions: React.Dispatch<React.SetStateAction<MetadataDefinition[]>>;
  loadingMetadata: boolean;
  setLoadingMetadata: React.Dispatch<React.SetStateAction<boolean>>;
  metadataSearchKeyword: string;
  setMetadataSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  expandedMetadataFolders: Set<string>;
  setExpandedMetadataFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  // 插件同步节点状态
  pluginSyncNodes: PluginSyncNode[];
  setPluginSyncNodes: React.Dispatch<React.SetStateAction<PluginSyncNode[]>>;
  loadingPluginSyncNodes: boolean;
  setLoadingPluginSyncNodes: React.Dispatch<React.SetStateAction<boolean>>;
  // 加载函数
  loadModuleTree: () => Promise<void>;
  loadDefinitions: (keyword?: string) => Promise<void>;
  loadPluginSyncNodes: () => Promise<void>;
  // 工具函数
  toggleMetadataFolder: (folderId: string) => void;
  // 计算属性
  metadataTypes: Array<{ id: string; name: string; count: number; icon: string; moduleIds: string[] }>;
  metadataCategories: Array<{ id: string; name: string; typeId: string; count: number; path: string }>;
  metadataItems: Array<{ id: string; name: string; type: string; groupId: string; category: string; protocol: string }>;
}

// 元数据类型配置（从 WorkflowDesignPageV2.tsx 复制）
const TYPE_CONFIG: Record<string, { name: string; icon: string; id: string; category: string }> = {
  'API': { name: 'HTTP接口', icon: '🔌', id: 'metadata-http', category: 'http' },
  'SQL': { name: 'SQL操作', icon: '📊', id: 'metadata-sql', category: 'sql' },
  'DUBBO': { name: 'DUBBO服务', icon: '🔄', id: 'metadata-dubbo', category: 'dubbo' },
  'ROCKETMQ': { name: 'RocketMQ消息', icon: '🚀', id: 'metadata-mq', category: 'rocketmq' },
  'FILE': { name: '文件上传', icon: '📁', id: 'metadata-file', category: 'file' },
};

/**
 * useMetadataSync Hook
 * 管理元数据同步逻辑
 */
export function useMetadataSync({
  projectId,
  leftPanelTab,
}: UseMetadataSyncParams): UseMetadataSyncReturn {
  // 元数据列表相关状态
  const [moduleTree, setModuleTree] = useState<MetadataModuleNode[]>([]);
  const [definitions, setDefinitions] = useState<MetadataDefinition[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataSearchKeyword, setMetadataSearchKeyword] = useState('');
  const [expandedMetadataFolders, setExpandedMetadataFolders] = useState<Set<string>>(
    new Set(['metadata'])
  );

  // 插件同步节点相关状态
  const [pluginSyncNodes, setPluginSyncNodes] = useState<PluginSyncNode[]>([]);
  const [loadingPluginSyncNodes, setLoadingPluginSyncNodes] = useState(false);

  // 加载模块树
  const loadModuleTree = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingMetadata(true);
      const data = await metadataService.getModuleTree(projectId);
      setModuleTree(data || []);
    } catch (error) {
      console.error('加载模块树失败:', error);
      setModuleTree([]);
    } finally {
      setLoadingMetadata(false);
    }
  }, [projectId]);

  // 加载定义列表
  const loadDefinitions = useCallback(
    async (keyword?: string) => {
      if (!projectId) {
        setDefinitions([]);
        return;
      }

      try {
        setLoadingMetadata(true);
        const params: any = {
          projectId,
          current: 1,
          pageSize: 99999,
        };

        if (keyword && keyword.trim()) {
          params.keyword = keyword.trim();
        }

        const data = await metadataService.getDefinitionPage(params);
        setDefinitions(data || []);
      } catch (error) {
        console.error('加载定义列表失败:', error);
        setDefinitions([]);
      } finally {
        setLoadingMetadata(false);
      }
    },
    [projectId]
  );

  // 加载插件同步节点
  const loadPluginSyncNodes = useCallback(async () => {
    try {
      setLoadingPluginSyncNodes(true);
      const nodes = await pluginSyncNodeService.getNodes();
      setPluginSyncNodes(nodes || []);
    } catch (error) {
      console.error('加载插件同步节点失败:', error);
      setPluginSyncNodes([]);
    } finally {
      setLoadingPluginSyncNodes(false);
    }
  }, []);

  // 加载元数据（模块树和定义列表）
  useEffect(() => {
    if (leftPanelTab === 'metadata' && projectId) {
      loadModuleTree();
      loadDefinitions(metadataSearchKeyword || undefined);
      loadPluginSyncNodes();
    }
  }, [leftPanelTab, projectId, loadModuleTree, loadDefinitions, metadataSearchKeyword, loadPluginSyncNodes]);

  // 元数据管理下的类型分类（从后端数据生成）
  const metadataTypes = useMemo(() => {
    const typeMap = new Map<
      string,
      { id: string; name: string; count: number; icon: string; moduleIds: string[] }
    >();

    Object.values(TYPE_CONFIG).forEach((config) => {
      typeMap.set(config.id, {
        id: config.id,
        name: config.name,
        count: 0,
        icon: config.icon,
        moduleIds: [],
      });
    });

    moduleTree.forEach((node) => {
      const config = TYPE_CONFIG[node.type];
      if (config) {
        const typeInfo = typeMap.get(config.id);
        if (typeInfo) {
          typeInfo.count += node.count || 0;
          typeInfo.moduleIds.push(node.id);
        }
      }
    });

    return Array.from(typeMap.values());
  }, [moduleTree]);

  // 元数据分类（第三层）- 从模块树生成
  const metadataCategories = useMemo(() => {
    return moduleTree.map((node) => {
      const config = TYPE_CONFIG[node.type];
      return {
        id: node.id,
        name: node.name,
        typeId: config?.id || '',
        count: node.count || 0,
        path: node.path,
      };
    });
  }, [moduleTree]);

  // 元数据项（第四层）- 从定义列表转换
  const metadataItems = useMemo(() => {
    return definitions.map((def) => {
      const protocolKey = def.protocol === 'HTTP' ? 'API' : def.protocol;
      const config = TYPE_CONFIG[protocolKey] || TYPE_CONFIG['API'];

      let type: string = 'GET';
      if (def.protocol === 'HTTP') {
        let method = 'GET';
        if (def.requestConfig) {
          try {
            const configObj =
              typeof def.requestConfig === 'string'
                ? JSON.parse(def.requestConfig)
                : def.requestConfig;
            method = configObj?.method || 'GET';
          } catch {
            method = 'GET';
          }
        }
        type = method.toUpperCase();
      } else {
        const protocolTypeMap: Record<string, string> = {
          'SQL': 'SQL',
          'DUBBO': 'DUBBO',
          'ROCKETMQ': 'RocketMQ',
          'FILE': 'FILE',
        };
        type = protocolTypeMap[def.protocol] || def.protocol;
      }

      const moduleNode = moduleTree.find((node) => node.id === def.moduleId);
      const moduleName = moduleNode?.name || def.moduleId;

      return {
        id: def.id,
        name: def.name,
        type,
        groupId: def.moduleId,
        category: config.category,
        protocol: def.protocol,
      };
    });
  }, [definitions, moduleTree]);

  // 切换文件夹展开/折叠
  const toggleMetadataFolder = useCallback((folderId: string) => {
    setExpandedMetadataFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  return {
    // 元数据状态
    moduleTree,
    setModuleTree,
    definitions,
    setDefinitions,
    loadingMetadata,
    setLoadingMetadata,
    metadataSearchKeyword,
    setMetadataSearchKeyword,
    expandedMetadataFolders,
    setExpandedMetadataFolders,
    // 插件同步节点状态
    pluginSyncNodes,
    setPluginSyncNodes,
    loadingPluginSyncNodes,
    setLoadingPluginSyncNodes,
    // 加载函数
    loadModuleTree,
    loadDefinitions,
    loadPluginSyncNodes,
    // 工具函数
    toggleMetadataFolder,
    // 计算属性
    metadataTypes,
    metadataCategories,
    metadataItems,
  };
}
