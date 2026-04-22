/**
 * useCategoryToggle Hook
 * 分类展开/收起状态管理
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback } from 'react';

interface UseCategoryToggleReturn {
  expandedCategories: string[];
  toggleCategory: (categoryId: string) => void;
}

/**
 * useCategoryToggle Hook
 * 管理分类展开状态
 */
export function useCategoryToggle(initialExpanded: string[] = ['api', 'data', 'logic', 'script']): UseCategoryToggleReturn {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(initialExpanded);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  return {
    expandedCategories,
    toggleCategory,
  };
}
