import { useState, useEffect, useMemo } from 'react';
import { metadataService, type MetadataModuleNode } from '@/services/metadata';
import { TYPE_CONFIG } from '@/constants/metadata';

export function useModuleTree(projectId: string) {
  const [moduleTree, setModuleTree] = useState<MetadataModuleNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadModuleTree = async () => {
    if (!projectId) {
      setModuleTree([]);
      return;
    }
    try {
      setLoading(true);
      const data = await metadataService.getModuleTree(projectId);
      setModuleTree(data || []);
    } catch (error) {
      console.error('加载模块树失败:', error);
      setModuleTree([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleTree();
  }, [projectId]);

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

  const collectAllNodeIds = (node: MetadataModuleNode): string[] => {
    const ids = [node.id];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        ids.push(...collectAllNodeIds(child));
      });
    }
    return ids;
  };

  const calculateModuleCounts = useMemo(() => {
    const moduleCountMap = new Map<string, number>();
    
    return new Map<string, number>();
  }, []);

  const countNodeAndChildren = (node: MetadataModuleNode, definitions: any[]): number => {
    const moduleCountMap = new Map<string, number>();
    definitions.forEach(def => {
      const count = moduleCountMap.get(def.moduleId) || 0;
      moduleCountMap.set(def.moduleId, count + 1);
    });
    
    const calculateNodeCount = (node: MetadataModuleNode): number => {
      const directCount = moduleCountMap.get(node.id) || 0;
      let childrenCount = 0;
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          childrenCount += calculateNodeCount(child);
        });
      }
      return directCount + childrenCount;
    };
    
    return calculateNodeCount(node);
  };

  const metadataTypes = useMemo(() => {
    const typeMap = new Map<string, { id: string; name: string; count: number; icon: string; moduleIds: string[] }>();
    
    Object.values(TYPE_CONFIG).forEach(config => {
      typeMap.set(config.id, {
        id: config.id,
        name: config.name,
        count: 0,
        icon: config.icon,
        moduleIds: [],
      });
    });

    return Array.from(typeMap.values());
  }, [moduleTree]);

  const metadataCategories = useMemo(() => {
    const allNodes = flattenNodes(moduleTree);
    return allNodes.map(node => {
      const config = TYPE_CONFIG[node.type];
      return {
        id: node.id,
        name: node.name,
        typeId: config?.id || '',
        count: 0,
        path: node.path,
        parentId: node.parentId,
      };
    });
  }, [moduleTree]);

  return {
    moduleTree,
    loading,
    loadModuleTree,
    flattenNodes,
    collectAllNodeIds,
    countNodeAndChildren,
    metadataTypes,
    metadataCategories,
  };
}

