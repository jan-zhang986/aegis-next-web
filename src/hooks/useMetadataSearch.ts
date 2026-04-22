import { useState, useEffect, useMemo } from 'react';
import { metadataService, type MetadataModuleNode } from '@/services/metadata';
import { TYPE_CONFIG } from '@/constants/metadata';

export interface UseMetadataSearchResult {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  sidebarCreateUserSearch: string;
  setSidebarCreateUserSearch: (user: string) => void;
  tableSearchKeyword: string;
  setTableSearchKeyword: (keyword: string) => void;
  createUserSearch: string;
  setCreateUserSearch: (user: string) => void;
  currentProtocolForSearch: string | undefined;
}

export interface CurrentSelection {
  level: 'none' | 'metadata' | 'metadata-type' | 'metadata-category' | 'metadata-item';
  id?: string;
  name?: string;
}

export function useMetadataSearch(
  projectId: string,
  currentSelection: CurrentSelection,
  moduleTree: MetadataModuleNode[],
  loadDefinitions: (keyword?: string, createUser?: string, protocol?: string, isTableSearch?: boolean) => Promise<void>
) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sidebarCreateUserSearch, setSidebarCreateUserSearch] = useState('');
  const [tableSearchKeyword, setTableSearchKeyword] = useState('');
  const [createUserSearch, setCreateUserSearch] = useState('');

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

  const currentProtocolForSearch = useMemo(() => {
    let currentProtocol: string | undefined = undefined;
    if (currentSelection.level === 'metadata-type') {
      if (currentSelection.id === TYPE_CONFIG.SQL.id) currentProtocol = 'SQL';
      else if (currentSelection.id === TYPE_CONFIG.DUBBO.id) currentProtocol = 'DUBBO';
      else if (currentSelection.id === TYPE_CONFIG.ROCKETMQ.id) currentProtocol = 'ROCKETMQ';
      else if (currentSelection.id === TYPE_CONFIG.FILE.id) currentProtocol = 'FILE';
      else if (currentSelection.id === 'metadata-script') currentProtocol = 'SCRIPT';
      else if (currentSelection.id === TYPE_CONFIG.API.id || currentSelection.id === 'metadata-http') currentProtocol = 'HTTP';
    } else if (currentSelection.level === 'metadata-category' && currentSelection.id) {
      const allNodes = flattenNodes(moduleTree);
      const moduleNode = allNodes.find(node => node.id === currentSelection.id);
      const nodeType = moduleNode?.type;
      if (nodeType === 'SQL' || nodeType === 'DUBBO' || nodeType === 'ROCKETMQ' || 
          nodeType === 'FILE' || nodeType === 'SCRIPT' || nodeType === 'API') {
        currentProtocol = nodeType === 'API' ? 'HTTP' : nodeType;
      }
    }
    return currentProtocol;
  }, [currentSelection, moduleTree]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDefinitions(searchKeyword, sidebarCreateUserSearch || undefined);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword, sidebarCreateUserSearch, loadDefinitions]);

  // 当切换列表页面时，清空搜索栏
  useEffect(() => {
    setTableSearchKeyword('');
    setCreateUserSearch('');
  }, [currentSelection.level, currentSelection.id]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    
    const timer = setTimeout(() => {
      const hasTableSearch = !!(tableSearchKeyword || createUserSearch || currentProtocolForSearch);
      loadDefinitions(tableSearchKeyword || undefined, createUserSearch || undefined, currentProtocolForSearch, hasTableSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [projectId, tableSearchKeyword, createUserSearch, currentProtocolForSearch, loadDefinitions]);

  return {
    searchKeyword,
    setSearchKeyword,
    sidebarCreateUserSearch,
    setSidebarCreateUserSearch,
    tableSearchKeyword,
    setTableSearchKeyword,
    createUserSearch,
    setCreateUserSearch,
    currentProtocolForSearch,
  };
}

