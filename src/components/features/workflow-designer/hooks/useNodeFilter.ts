/**
 * useNodeFilter Hook
 * 节点过滤相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useMemo } from 'react';
import { NODE_CATEGORIES } from '../constants/nodeCategories';
import type { NodeCategory } from '../types';

interface UseNodeFilterParams {
  searchKeyword: string;
}

interface UseNodeFilterReturn {
  filteredCategories: NodeCategory[];
}

/**
 * useNodeFilter Hook
 * 根据搜索关键词过滤节点分类
 */
export function useNodeFilter({ searchKeyword }: UseNodeFilterParams): UseNodeFilterReturn {
  const filteredCategories = useMemo(() => {
    return NODE_CATEGORIES.map(category => ({
      ...category,
      nodes: category.nodes.filter(node => 
        node.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        node.description.toLowerCase().includes(searchKeyword.toLowerCase())
      ),
    })).filter(category => category.nodes.length > 0);
  }, [searchKeyword]);

  return {
    filteredCategories,
  };
}
