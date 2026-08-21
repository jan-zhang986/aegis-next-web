import { useState, useEffect, useCallback } from 'react';
import { metadataService, type MetadataDefinition, type MetadataModuleNode, pluginSyncNodeService, type PluginSyncNode } from '@/services/metadata';
import { projectManagementService } from '@/services/project-management';

export interface UseMetadataDataOptions {
  spaceId?: string;
  moduleType?: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT' | 'WORKFLOW';
}

export interface UseMetadataDataResult {
  moduleTree: MetadataModuleNode[];
  definitions: MetadataDefinition[];
  filteredDefinitions: MetadataDefinition[];
  hasActiveSearch: boolean;
  loading: boolean;
  userNameMap: Map<string, string>;
  pluginSyncNodes: PluginSyncNode[];
  loadingPluginSyncNodes: boolean;
  loadModuleTree: () => Promise<void>;
  loadDefinitions: (keyword?: string, createUser?: string, protocol?: string, isTableSearch?: boolean) => Promise<void>;
  loadPluginSyncNodes: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMetadataData(projectId: string, options: UseMetadataDataOptions = {}) {
  const { spaceId, moduleType } = options;
  const [moduleTree, setModuleTree] = useState<MetadataModuleNode[]>([]);
  const [definitions, setDefinitions] = useState<MetadataDefinition[]>([]);
  const [filteredDefinitions, setFilteredDefinitions] = useState<MetadataDefinition[]>([]);
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userNameMap, setUserNameMap] = useState<Map<string, string>>(new Map());
  const [pluginSyncNodes, setPluginSyncNodes] = useState<PluginSyncNode[]>([]);
  const [loadingPluginSyncNodes, setLoadingPluginSyncNodes] = useState(false);

  const loadModuleTree = useCallback(async () => {
    if (!projectId) {
      setModuleTree([]);
      return;
    }
    try {
      setLoading(true);
      const data = await metadataService.getModuleTree(projectId, {
        ...(spaceId ? { typeId: spaceId } : {}),
        ...(moduleType ? { moduleType } : {}),
      });
      setModuleTree(data || []);
    } catch (error) {
      console.error('加载模块树失败:', error);
      setModuleTree([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, spaceId, moduleType]);

  const loadDefinitions = useCallback(async (
    keyword?: string,
    createUser?: string,
    protocol?: string,
    isTableSearch: boolean = false
  ) => {
    if (!projectId) {
      setDefinitions([]);
      setFilteredDefinitions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      let nameMap = new Map<string, string>();
      let nameToIdMap = new Map<string, string>();
      try {
        const members = await projectManagementService.getProjectMemberOptions(projectId);
        members.forEach(member => {
          nameMap.set(member.id, member.name);
          nameToIdMap.set(member.name.toLowerCase(), member.id);
        });
        setUserNameMap(nameMap);
      } catch (error) {
        console.error('加载用户名称映射失败:', error);
      }
      
      const params: any = {
        projectId: projectId,
        current: 1,
        pageSize: 99999,
      };
      if (spaceId) {
        params.spaceId = spaceId;
      }
      
      if (keyword && keyword.trim()) {
        params.keyword = keyword.trim();
      }
      
      if (createUser && createUser.trim()) {
        const searchValue = createUser.trim();
        const matchedUserId = nameToIdMap.get(searchValue.toLowerCase());
        params.createUser = matchedUserId || searchValue;
      }
      
      if (protocol) {
        params.protocol = protocol;
      }
      
      const data = await metadataService.getDefinitionPage(params);
      
      let filteredData = data || [];
      if (createUser && createUser.trim() && !nameToIdMap.has(createUser.trim().toLowerCase())) {
        const searchValue = createUser.trim().toLowerCase();
        filteredData = filteredData.filter(def => {
          if (!def.createUser) return false;
          const userName = nameMap.get(def.createUser) || def.createUser;
          return userName.toLowerCase().includes(searchValue);
        });
      }
      
      if (isTableSearch) {
        // 列表搜索时，只更新 filteredDefinitions，不更新 definitions
        // 这样模块树的计数不会受到影响
        setFilteredDefinitions(filteredData);
        setHasActiveSearch(!!(keyword || createUser || protocol));
      } else {
        // 非列表搜索时（如侧边栏搜索），更新 definitions
        setDefinitions(filteredData);
        setFilteredDefinitions(filteredData);
        setHasActiveSearch(false);
      }
    } catch (error) {
      console.error('加载定义列表失败:', error);
      setDefinitions([]);
      setFilteredDefinitions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, spaceId]);

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

  const refresh = useCallback(async () => {
    await Promise.all([
      loadModuleTree(),
      loadDefinitions(),
    ]);
  }, [loadModuleTree, loadDefinitions]);

  useEffect(() => {
    setDefinitions([]);
    setFilteredDefinitions([]);
    setModuleTree([]);
    loadModuleTree();
    // 初始加载时，加载所有 definitions（不传搜索参数）
    if (projectId) {
      loadDefinitions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, spaceId, moduleType, loadModuleTree]);

  useEffect(() => {
    loadPluginSyncNodes();
  }, [loadPluginSyncNodes]);

  return {
    moduleTree,
    definitions,
    filteredDefinitions,
    hasActiveSearch,
    loading,
    userNameMap,
    pluginSyncNodes,
    loadingPluginSyncNodes,
    loadModuleTree,
    loadDefinitions,
    loadPluginSyncNodes,
    refresh,
  };
}
