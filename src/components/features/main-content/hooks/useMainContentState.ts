import { useState, useCallback } from 'react';
import type { OpenedTest, ApiGroup } from '@/types';
import type { MetadataDefinition } from '@/services/metadata';
import type { CurrentSelection } from '@/hooks/useMetadataSearch';

export function useMainContentState() {
  const [currentSelection, setCurrentSelection] = useState<CurrentSelection>({ level: 'none' });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['metadata']));
  const [openedTest, setOpenedTest] = useState<OpenedTest | null>(null);
  const [previewDefinition, setPreviewDefinition] = useState<MetadataDefinition | null>(null);
  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState<Set<string>>(new Set());
  const [userGroups, setUserGroups] = useState<ApiGroup[]>([
    {
      id: 'group-1',
      name: '公开接口',
      items: [],
    },
  ]);

  const handleToggleSelection = useCallback((definitionId: string) => {
    setSelectedDefinitionIds(prev => {
      const next = new Set(prev);
      if (next.has(definitionId)) {
        next.delete(definitionId);
      } else {
        next.add(definitionId);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback((checked: boolean, tableData: any[]) => {
    if (checked) {
      const validIds = tableData
        .filter((item: any) => item.id && !item.id.startsWith('sync-'))
        .map((item: any) => item.id);
      setSelectedDefinitionIds(new Set(validIds));
    } else {
      setSelectedDefinitionIds(new Set());
    }
  }, []);

  return {
    currentSelection,
    setCurrentSelection,
    expandedFolders,
    setExpandedFolders,
    openedTest,
    setOpenedTest,
    previewDefinition,
    setPreviewDefinition,
    selectedDefinitionIds,
    setSelectedDefinitionIds,
    userGroups,
    setUserGroups,
    handleToggleSelection,
    handleToggleSelectAll,
  };
}
