/**
 * 模块树与模块数量数据 Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { caseManagementService } from '@/services';
import type { ModuleTreeNode } from '../types';

interface UseModuleTreeOptions {
  projectId: string;
  searchKeyword?: string;
}

export function useModuleTree({ projectId, searchKeyword }: UseModuleTreeOptions) {
  const [moduleTree, setModuleTree] = useState<ModuleTreeNode[]>([]);
  const [modulesCount, setModulesCount] = useState<Record<string, number>>({});
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [treeLoaded, setTreeLoaded] = useState(false);

  const fetchModuleTree = useCallback(async () => {
    try {
      const result = await caseManagementService.getCaseModuleTree({ projectId });
      setModuleTree(Array.isArray(result) ? result : []);
      // 不重置 expandedNodes，避免移动/删除/复制模块后整棵树被收起
    } catch (err) {
      console.error('获取模块树失败:', err);
      setModuleTree([]);
    } finally {
      setTreeLoaded(true);
    }
  }, [projectId]);

  const fetchModulesCount = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        projectId,
        moduleIds: [],
        current: 1,
        pageSize: 10,
      };
      if (searchKeyword?.trim()) params.keyword = searchKeyword.trim();
      const result = await caseManagementService.getCaseModulesCounts(params);
      const safeCount =
        typeof result === 'object' && result !== null && !Array.isArray(result) && !('message' in result)
          ? (result as Record<string, number>)
          : {};
      setModulesCount(safeCount);
    } catch (err) {
      console.error('获取模块数量失败:', err);
      setModulesCount({});
    }
  }, [projectId, searchKeyword]);

  useEffect(() => {
    fetchModuleTree();
    fetchModulesCount();
  }, [fetchModuleTree, fetchModulesCount]);

  const toggleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  function collectExpandableIds(nodes: ModuleTreeNode[]): string[] {
    const ids: string[] = [];
    nodes.forEach((n) => {
      if (n.children?.length) {
        ids.push(n.id);
        ids.push(...collectExpandableIds(n.children));
      }
    });
    return ids;
  }

  /** 从根到 nodeId 的祖先路径（不含 nodeId 自身），用于展开到该节点 */
  function findPathToNode(nodes: ModuleTreeNode[], targetId: string, path: string[] = []): string[] | null {
    for (const n of nodes) {
      if (n.id === targetId) return path;
      if (n.children?.length) {
        const found = findPathToNode(n.children, targetId, [...path, n.id]);
        if (found) return found;
      }
    }
    return null;
  }

  const expandPathToNode = useCallback((nodeId: string) => {
    if (!nodeId || nodeId === 'all') return;
    const path = findPathToNode(moduleTree, nodeId);
    if (path?.length) {
      setExpandedNodes((prev) => new Set([...prev, ...path]));
    }
  }, [moduleTree]);

  const expandableIds = useMemo(() => collectExpandableIds(moduleTree), [moduleTree]);
  const expandAll = useCallback(() => {
    setExpandedNodes((prev) => new Set([...prev, ...expandableIds]));
  }, [expandableIds]);
  const collapseAll = useCallback(() => setExpandedNodes(new Set()), []);
  const isExpandAll = expandableIds.length > 0 && expandableIds.every((id) => expandedNodes.has(id));

  return {
    moduleTree,
    modulesCount,
    expandedNodes,
    toggleNodeExpand,
    expandAll,
    collapseAll,
    isExpandAll,
    expandPathToNode,
    fetchModuleTree,
    fetchModulesCount,
    treeLoaded,
  };
}
