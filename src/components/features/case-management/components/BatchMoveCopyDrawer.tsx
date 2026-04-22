/**
 * 批量移动/复制到模块
 * 参考 spotter-metersphere caseTable.vue handleCaseMoveOrCopy
 * 支持按模块名称搜索匹配
 */

import { useState, useEffect, useMemo } from 'react';
import { FolderOpen, ChevronRight, ChevronDown, Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { caseManagementService } from '@/services';
import { toast } from 'sonner';
import type { ModuleTreeNode } from '../types';
import { collectOffspringIds } from '../utils/collectOffspringIds';

const SEARCH_DEBOUNCE_MS = 180;

/** 收集某节点自身 id 及其所有子孙 id，用于勾选父节点时联动子节点 */
function collectNodeAndDescendantIds(tree: ModuleTreeNode[], nodeId: string): string[] {
  const offspring = collectOffspringIds(tree, nodeId);
  return [nodeId, ...offspring];
}

export interface BatchMoveCopyParams {
  selectedIds: string[];
  selectAll: boolean;
  excludeIds: string[];
  projectId: string;
  activeFolder: string;
  offspringIds: string[];
  condition?: Record<string, unknown>;
}

interface BatchMoveCopyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMove: boolean;
  selectCount: number;
  params: BatchMoveCopyParams;
  moduleTree: ModuleTreeNode[];
  onSuccess?: () => void;
}

function nodeMatchesSearch(node: ModuleTreeNode, keyword: string): boolean {
  if (!keyword) return true;
  return (node.name ?? '').toLowerCase().includes(keyword);
}

function nodeOrChildrenMatchSearch(node: ModuleTreeNode, keyword: string): boolean {
  if (!keyword) return true;
  if (nodeMatchesSearch(node, keyword)) return true;
  if (node.children?.length) {
    return node.children.some((c) => nodeOrChildrenMatchSearch(c, keyword));
  }
  return false;
}

/** 收集需要展开的节点 ID，使包含关键词的节点在搜索时可见（可被用户再收起） */
function collectIdsToExpandForSearch(nodes: ModuleTreeNode[], keyword: string): Set<string> {
  const ids = new Set<string>();
  if (!keyword.trim()) return ids;
  const lower = keyword.trim().toLowerCase();
  function walk(n: ModuleTreeNode): boolean {
    const selfMatch = (n.name ?? '').toLowerCase().includes(lower);
    let childMatch = false;
    if (n.children?.length) {
      for (const c of n.children) {
        if (walk(c)) childMatch = true;
      }
    }
    if (selfMatch || childMatch) ids.add(n.id);
    return selfMatch || childMatch;
  }
  nodes.forEach((n) => walk(n));
  return ids;
}

/** 节点自身或在 checkedIds 中的任意子孙被勾选时，父级也应显示为已选；用于「选中子级时父级也显示勾选」 */
function isNodeOrDescendantChecked(node: ModuleTreeNode, checkedIds: string[]): boolean {
  if (checkedIds.includes(node.id)) return true;
  if (node.children?.length) return node.children.some((c) => isNodeOrDescendantChecked(c, checkedIds));
  return false;
}

function ModuleTreeSelect({
  moduleTree,
  selectedIds,
  checkedIds,
  isMove,
  expanded,
  searchKeyword,
  onToggleExpand,
  onSelect,
  onCheck,
}: {
  moduleTree: ModuleTreeNode[];
  selectedIds: string[];
  checkedIds: string[];
  isMove: boolean;
  expanded: Set<string>;
  searchKeyword: string;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
}) {
  const normalizedSearch = searchKeyword.trim().toLowerCase();

  const highlightName = (name?: string) => {
    if (!name) return null;
    if (!normalizedSearch) return name;
    const lowerName = name.toLowerCase();
    const index = lowerName.indexOf(normalizedSearch);
    if (index === -1) return name;
    const before = name.slice(0, index);
    const match = name.slice(index, index + normalizedSearch.length);
    const after = name.slice(index + normalizedSearch.length);
    return (
      <>
        {before}
        <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-0.5 font-medium">{match}</span>
        {after}
      </>
    );
  };

  const renderNode = (node: ModuleTreeNode) => {
    if (normalizedSearch && !nodeOrChildrenMatchSearch(node, normalizedSearch)) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedIds.includes(node.id);
    const isChecked =
      isMove
        ? selectedIds.includes(node.id)
        : checkedIds.includes(node.id) || isNodeOrDescendantChecked(node, checkedIds);
    const isIndeterminate =
      !isMove && !checkedIds.includes(node.id) && isNodeOrDescendantChecked(node, checkedIds);

    return (
      <div key={node.id} className="mb-0.5">
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
          onClick={() => {
            if (hasChildren) onToggleExpand(node.id);
            if (isMove) onSelect(node.id);
            else onCheck(node.id, !isChecked);
          }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="p-0.5 -ml-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Checkbox
            checked={isIndeterminate ? 'indeterminate' : isChecked}
            onCheckedChange={(c) => {
              onCheck(node.id, c === true);
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-[2px]"
          />
          <FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="flex-1 truncate text-sm">{highlightName(node.name)}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-5 mt-0.5">
            {node.children!.map((c) => renderNode(c))}
          </div>
        )}
      </div>
    );
  };

  const hasAnyMatch = useMemo(
    () =>
      !normalizedSearch || moduleTree.some((n) => nodeOrChildrenMatchSearch(n, normalizedSearch)),
    [moduleTree, normalizedSearch],
  );

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {!hasAnyMatch ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          未找到匹配的模块
        </div>
      ) : (
        moduleTree.map((n) => renderNode(n))
      )}
    </div>
  );
}

export function BatchMoveCopyDrawer({
  open,
  onOpenChange,
  isMove,
  selectCount,
  params,
  moduleTree,
  onSuccess,
}: BatchMoveCopyDrawerProps) {
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [checkedModuleIds, setCheckedModuleIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchKeyword.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchKeyword]);

  // 有搜索关键词时自动展开包含匹配的节点，便于看到结果；用户仍可随时收起/展开
  useEffect(() => {
    if (!debouncedSearch || !moduleTree.length) return;
    const toExpand = collectIdsToExpandForSearch(moduleTree, debouncedSearch);
    if (toExpand.size === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      toExpand.forEach((id) => next.add(id));
      return next;
    });
  }, [debouncedSearch, moduleTree]);

  const targetIds = isMove ? selectedModuleIds : checkedModuleIds;

  const handleToggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setSelectedModuleIds([id]);
  };

  const handleCheck = (id: string, checked: boolean) => {
    if (isMove) {
      setSelectedModuleIds(checked ? [id] : []);
    } else {
      const idsToToggle = collectNodeAndDescendantIds(moduleTree, id);
      setCheckedModuleIds((prev) => {
        if (checked) {
          const next = new Set(prev);
          idsToToggle.forEach((x) => next.add(x));
          return [...next];
        }
        const toRemove = new Set(idsToToggle);
        return prev.filter((x) => !toRemove.has(x));
      });
    }
  };

  const handleConfirm = async () => {
    if (targetIds.length === 0) {
      toast.error(isMove ? '请选择目标模块' : '请至少选择一个目标模块');
      return;
    }
    setLoading(true);
    try {
      const baseParams = {
        selectIds: params.selectedIds,
        selectAll: params.selectAll,
        excludeIds: params.excludeIds || [],
        condition: params.condition,
        projectId: params.projectId,
        moduleIds:
          params.activeFolder === 'all' || params.activeFolder === 'all_data'
            ? []
            : [params.activeFolder, ...(params.offspringIds || [])],
      };
      if (isMove) {
        await caseManagementService.batchMoveToModules({
          ...baseParams,
          moduleId: targetIds[0],
        });
        toast.success('批量移动成功');
      } else {
        for (const targetId of targetIds) {
          await caseManagementService.batchCopyToModules({
            ...baseParams,
            moduleId: targetId,
          });
        }
        toast.success('批量复制成功');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(isMove ? '批量移动失败' : '批量复制失败:', err);
      toast.error(err?.message || (isMove ? '批量移动失败' : '批量复制失败'));
    } finally {
      setLoading(false);
    }
  };

  const title = isMove ? '批量移动' : '批量复制';
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-base">{title}</SheetTitle>
          <p className="text-sm text-gray-500 mt-1">已选 {selectCount} 条用例</p>
        </SheetHeader>
        <div className="flex-1 overflow-auto px-6 py-4">
          <p className="text-sm text-gray-600 mb-3">
            {isMove ? '选择目标模块（单选）' : '选择目标模块（可多选）'}
          </p>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索模块名称..."
              className="h-9 pl-8 text-sm bg-muted/40 border-border"
              autoComplete="off"
            />
          </div>
          <ModuleTreeSelect
            moduleTree={moduleTree}
            selectedIds={selectedModuleIds}
            checkedIds={checkedModuleIds}
            isMove={isMove}
            expanded={expanded}
            searchKeyword={debouncedSearch}
            onToggleExpand={handleToggleExpand}
            onSelect={handleSelect}
            onCheck={handleCheck}
          />
        </div>
        <SheetFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading || targetIds.length === 0}>
            {loading
              ? '处理中...'
              : isMove
                ? (targetIds.length > 0 ? `移动至已选模块 (1 个)` : '确定')
                : targetIds.length > 0
                  ? `复制 ${selectCount} 个用例至已选模块 (${targetIds.length} 个模块)`
                  : '确定'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
