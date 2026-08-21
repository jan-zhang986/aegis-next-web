/**
 * 模块树侧边栏
 * 「用例模板库」「用例模块库」「回归用例库」及其下所有子级均显示红色，根级节点前缀 🔥
 * 支持：添加子模块、重命名、删除、复制、移动模块；支持拖拽调整模块顺序（参考原项目 caseTree handleDrag + moveCaseModuleTree）
 */

import { useMemo, useState, useCallback, useRef, Fragment, useEffect } from 'react';
import { Search, Plus, Trash2, ChevronRight, ChevronDown, ChevronUp, Folder, MoreHorizontal, Pencil, Copy, Move } from 'lucide-react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';

/** 项目下若存在则高亮显示（红色 + 🔥）的模块名称；其下所有子级也使用红色保持一致 */
const HIGHLIGHT_MODULE_NAMES = ['用例模板库', '用例模版库', '用例模块库', '回归用例库'];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ModuleTreeNode } from '../types';
import { cn } from '@/utils/cn';

/** 拖放目标 id 格式：mb-xxx=置于节点前，mi-xxx=放入节点内，ma-xxx=置于节点后；mi-root=置于根 */
const DROP_PREFIX_BEFORE = 'mb-';
const DROP_PREFIX_INTO = 'mi-';
const DROP_PREFIX_AFTER = 'ma-';
const DROP_ROOT = 'mi-root';

function parseDropId(overId: string): { dropNodeId: string; dropPosition: number } | null {
  if (overId === DROP_ROOT) return { dropNodeId: '', dropPosition: 0 };
  if (overId.startsWith(DROP_PREFIX_BEFORE)) return { dropNodeId: overId.slice(DROP_PREFIX_BEFORE.length), dropPosition: -1 };
  if (overId.startsWith(DROP_PREFIX_INTO)) return { dropNodeId: overId.slice(DROP_PREFIX_INTO.length), dropPosition: 0 };
  if (overId.startsWith(DROP_PREFIX_AFTER)) return { dropNodeId: overId.slice(DROP_PREFIX_AFTER.length), dropPosition: 1 };
  return null;
}

/** 收集需要展开的节点 ID，使包含关键词的节点在搜索时可见（用于移动模块对话框） */
function collectIdsToExpandForSearch(nodes: ModuleTreeNode[], keyword: string): Set<string> {
  const ids = new Set<string>();
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return ids;

  const walk = (n: ModuleTreeNode): boolean => {
    const selfMatch = (n.name ?? '').toLowerCase().includes(trimmed);
    let childMatch = false;
    if (n.children?.length) {
      for (const c of n.children) {
        if (walk(c)) childMatch = true;
      }
    }
    if (selfMatch || childMatch) {
      ids.add(n.id);
    }
    return selfMatch || childMatch;
  };

  nodes.forEach((n) => walk(n));
  return ids;
}

/** 放置区（before/into/after/root），与原项目 -1/0/1 对应；before/after 为插入线，root 与 into 悬停时高亮 */
function DropZone({ id, className, children }: { id: string; className?: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isLine = id.startsWith(DROP_PREFIX_BEFORE) || id.startsWith(DROP_PREFIX_AFTER);
  const isBefore = id.startsWith(DROP_PREFIX_BEFORE);
  const isRoot = id === DROP_ROOT;
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors flex items-center ${className ?? ''} ${isLine ? (isOver ? 'min-h-[6px]' : 'min-h-[2px]') : ''} ${isOver && isLine ? 'bg-blue-100/60 rounded' : ''} ${isOver && isRoot ? 'min-h-[28px] bg-blue-100/80 rounded-md px-2' : ''}`}
      data-droppable={id}
    >
      {isOver && isLine && (
        <div className="w-full h-1 rounded-full bg-blue-500 flex-shrink-0" aria-label={isBefore ? '插入到上方' : '插入到下方'} />
      )}
      {isOver && isRoot && (
        <span className="text-xs font-medium text-blue-600">放入根级</span>
      )}
      {children}
    </div>
  );
}

interface ModuleTreePanelProps {
  moduleTree: ModuleTreeNode[];
  modulesCount: Record<string, number>;
  expandedNodes: Set<string>;
  selectedModuleId: string;
  moduleSearchKeyword: string;
  allModuleCount: number;
  onModuleSearchChange: (value: string) => void;
  onModuleSelect: (moduleId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  /** 全部展开/收起（与参考图一致：全部用例行右侧图标） */
  isExpandAll?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onCreateCase?: () => void;
  onNavigateToRecycle?: () => void;
  onAddSubModule?: (parentId: string, name: string) => Promise<void>;
  onRenameModule?: (nodeId: string, name: string) => Promise<void>;
  onDeleteModule?: (nodeId: string) => Promise<void>;
  onCopyModule?: (sourceId: string, targetId: string) => Promise<void>;
  /** 移动模块：dragNodeId 被移动节点，dropNodeId 目标节点（空字符串表示根），dropPosition 0=放入目标内 */
  onMoveModule?: (dragNodeId: string, dropNodeId: string, dropPosition: number) => Promise<void>;
  projectId?: string;
  /** 回收站数量（与老前端 recycleModulesCount.all 一致，可选展示） */
  recycleCount?: number;
  /** 首行「全部xxx」文案，默认「全部用例」；用例评审传「全部评审」 */
  allLabel?: string;
  /** 顶部搜索栏右侧插槽，如用例评审的「新建」按钮 */
  headerRight?: React.ReactNode;
  /** 在「全部xxx」行与模块树之间插入的自定义行（如测试计划的「未规划计划」） */
  extraRowsBeforeTree?: React.ReactNode;
  /** 可选：在搜索栏上方渲染的标题栏（如测试计划的「测试计划」+ 新建下拉） */
  titleBar?: React.ReactNode;
}

export function ModuleTreePanel({
  moduleTree,
  modulesCount,
  expandedNodes,
  selectedModuleId,
  moduleSearchKeyword,
  allModuleCount,
  onModuleSearchChange,
  onModuleSelect,
  onToggleExpand,
  isExpandAll = false,
  onExpandAll,
  onCollapseAll,
  onCreateCase,
  onNavigateToRecycle,
  onAddSubModule,
  onRenameModule,
  onDeleteModule,
  onCopyModule,
  onMoveModule,
  recycleCount,
  allLabel = '全部用例',
  headerRight,
  extraRowsBeforeTree,
  titleBar,
}: ModuleTreePanelProps) {
  const [addSubOpen, setAddSubOpen] = useState(false);
  const [addSubParentId, setAddSubParentId] = useState('');
  const [addSubName, setAddSubName] = useState('');
  const [addSubLoading, setAddSubLoading] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState('');
  const [renameName, setRenameName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteNodeId, setDeleteNodeId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copyModuleOpen, setCopyModuleOpen] = useState(false);
  const [copySourceId, setCopySourceId] = useState('');
  const [copySourceName, setCopySourceName] = useState('');
  const [copyTargetId, setCopyTargetId] = useState('');
  const [copyExpanded, setCopyExpanded] = useState<Set<string>>(new Set());
  const [copyLoading, setCopyLoading] = useState(false);
  const [copySearchKeyword, setCopySearchKeyword] = useState('');
  const [copyDebouncedSearch, setCopyDebouncedSearch] = useState('');
  const [moveModuleOpen, setMoveModuleOpen] = useState(false);
  const [moveSourceId, setMoveSourceId] = useState('');
  const [moveSourceName, setMoveSourceName] = useState('');
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [moveExpanded, setMoveExpanded] = useState<Set<string>>(new Set());
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveSearchKeyword, setMoveSearchKeyword] = useState('');
  const [moveDebouncedSearch, setMoveDebouncedSearch] = useState('');

  const safeModuleTree = Array.isArray(moduleTree) ? moduleTree : [];
  const normalizedSearch = moduleSearchKeyword.trim().toLowerCase();
  const dragEnabled = Boolean(onMoveModule) && !normalizedSearch;

  const nodeMatchesSearch = (node: ModuleTreeNode, keyword: string): boolean => {
    if (!keyword) return true;
    return (node.name ?? '').toLowerCase().includes(keyword);
  };

  const nodeOrChildrenMatchSearch = (node: ModuleTreeNode, keyword: string): boolean => {
    if (!keyword) return true;
    if (nodeMatchesSearch(node, keyword)) return true;
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => nodeOrChildrenMatchSearch(child, keyword));
    }
    return false;
  };

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
        <span className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5">{match}</span>
        {after}
      </>
    );
  };

  const getDescendantIds = (nodeId: string, nodes: ModuleTreeNode[]): string[] => {
    for (const n of nodes) {
      if (n.id === nodeId) {
        const ids: string[] = [];
        const collect = (list: ModuleTreeNode[]) => list.forEach((c) => { ids.push(c.id); if (c.children?.length) collect(c.children!); });
        if (n.children?.length) collect(n.children);
        return ids;
      }
      if (n.children?.length) {
        const found = getDescendantIds(nodeId, n.children);
        if (found.length) return found;
      }
    }
    return [];
  };

  /** 获取节点在树中的父节点 id 及同级兄弟 id 列表（顺序与树一致）。根节点返回 parentId='', siblings=顶层节点 */
  function getParentAndSiblings(nodes: ModuleTreeNode[], nodeId: string): { parentId: string; siblingIds: string[] } | null {
    for (const n of nodes) {
      if (n.id === nodeId) return { parentId: '', siblingIds: nodes.map((c) => c.id) };
      if (n.children?.length) {
        const found = getParentAndSiblings(n.children, nodeId);
        if (found) return { parentId: n.id, siblingIds: n.children!.map((c) => c.id) };
      }
    }
    return null;
  }

  /** 同层级移动时，若放置后顺序未变则视为无效移动（不请求接口） */
  function isSameLevelNoOp(dragNodeId: string, dropNodeId: string, dropPosition: number): boolean {
    if (dropPosition === 0) return false;
    const dragInfo = getParentAndSiblings(safeModuleTree, dragNodeId);
    const dropInfo = getParentAndSiblings(safeModuleTree, dropNodeId);
    if (!dragInfo || !dropInfo || dragInfo.parentId !== dropInfo.parentId) return false;
    const sibs = dragInfo.siblingIds;
    const dragIdx = sibs.indexOf(dragNodeId);
    const dropIdx = sibs.indexOf(dropNodeId);
    if (dragIdx === -1 || dropIdx === -1) return false;
    const insertIdx = dropPosition === 1 ? dropIdx + 1 : dropIdx;
    const newOrder = sibs.filter((id) => id !== dragNodeId);
    newOrder.splice(insertIdx, 0, dragNodeId);
    return sibs.join(',') === newOrder.join(',');
  }

  const moveExcludeIds = new Set([moveSourceId, ...getDescendantIds(moveSourceId, safeModuleTree)]);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // 移动模块对话框内搜索：防抖更新关键字
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMoveDebouncedSearch(moveSearchKeyword.trim());
    }, 180);
    return () => window.clearTimeout(timer);
  }, [moveSearchKeyword]);

  // 搜索时自动展开包含匹配结果的节点，便于用户看到搜索结果
  useEffect(() => {
    if (!moveDebouncedSearch || !safeModuleTree.length) return;
    const toExpand = collectIdsToExpandForSearch(safeModuleTree, moveDebouncedSearch);
    if (!toExpand.size) return;
    setMoveExpanded((prev) => {
      const next = new Set(prev);
      toExpand.forEach((id) => next.add(id));
      return next;
    });
  }, [moveDebouncedSearch, safeModuleTree]);

  // 复制模块对话框内搜索：防抖更新关键字
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCopyDebouncedSearch(copySearchKeyword.trim());
    }, 180);
    return () => window.clearTimeout(timer);
  }, [copySearchKeyword]);

  // 复制模块搜索时自动展开包含匹配结果的节点
  useEffect(() => {
    if (!copyDebouncedSearch || !safeModuleTree.length) return;
    const toExpand = collectIdsToExpandForSearch(safeModuleTree, copyDebouncedSearch);
    if (!toExpand.size) return;
    setCopyExpanded((prev) => {
      const next = new Set(prev);
      toExpand.forEach((id) => next.add(id));
      return next;
    });
  }, [copyDebouncedSearch, safeModuleTree]);

  /** 优先用指针位置判定放置目标：指针在「行内」即视为「放入节点内」，避免拖到行上却被上下缝隙抢成前/后 */
  const collisionDetection = useCallback((args: Parameters<typeof pointerWithin>[0]) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);
  const lastDraggedIdRef = useRef<string | null>(null);
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const dragId = active?.id ? String(active.id) : null;
      if (dragId) lastDraggedIdRef.current = dragId;
      setActiveDragId(null);
      if (!over?.id || !onMoveModule) return;
      const dragNodeId = String(active.id);
      const parsed = parseDropId(String(over.id));
      if (!parsed) return;
      const { dropNodeId, dropPosition } = parsed;
      // 与原项目 spotter-metersphere caseTree.vue + ms-tree 一致：不转换语义，-1=前/0=放入/1=后，完全由放置区决定

      if (dropPosition === 0) {
        if (dropNodeId === dragNodeId) return;
        const descendants = getDescendantIds(dragNodeId, safeModuleTree);
        if (descendants.includes(dropNodeId)) return;
        // 与原项目 utils handleTreeDragDrop 一致：拖到当前父节点内（位置不变）视为 no-op
        const dragParent = getParentAndSiblings(safeModuleTree, dragNodeId);
        if (dragParent && dragParent.parentId === dropNodeId) return;
      }
      if (isSameLevelNoOp(dragNodeId, dropNodeId, dropPosition)) return;
      onMoveModule(dragNodeId, dropNodeId, dropPosition);
    },
    [onMoveModule, safeModuleTree]
  );

  function findNodeInTree(nodes: ModuleTreeNode[], id: string): ModuleTreeNode | null {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children?.length) {
        const found = findNodeInTree(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }
  const draggedNode = activeDragId ? findNodeInTree(safeModuleTree, activeDragId) : null;

  /** 可拖拽的树节点行（仅在 dragEnabled 时使用，与 renderTreeNode 内容一致并增加拖拽把手与放置区） */
  function DraggableTreeNodeRow({ node, parentIsHighlight = false }: { node: ModuleTreeNode; parentIsHighlight?: boolean }) {
    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: node.id });
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: DROP_PREFIX_INTO + node.id });
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedModuleId === node.id;
    const isHighlightModule = node.name != null && HIGHLIGHT_MODULE_NAMES.includes(String(node.name).trim());
    const isUnderHighlight = isHighlightModule || parentIsHighlight;
    const hasModuleActions = onAddSubModule || onRenameModule || onDeleteModule || onCopyModule || onMoveModule;
    /** 悬停时整行高亮，明确表示「放入为该节点子级」（对齐原项目 arco-tree-node-title-highlight） */
    const isDropInto = isOver;
    return (
      <div
        ref={setDropRef}
        className={`mb-0 group relative rounded-md transition-colors ${isDropInto ? 'bg-blue-100/90 ring-1 ring-blue-300 ring-inset' : ''}`}
      >
        <div
          ref={setDragRef}
          className={`w-full flex items-center gap-1 px-2 py-1 min-h-[28px] rounded-md text-[13px] border-l-4 transition-colors ${isDropInto ? 'border-blue-500 bg-blue-50/80' : 'border-transparent'} ${!isDropInto && isSelected ? 'bg-blue-50' : ''} ${!isDropInto && (isSelected || isDropInto) ? '' : 'hover:bg-gray-50'} ${isUnderHighlight ? 'text-red-600' : isSelected || isDropInto ? 'text-blue-600 font-medium' : 'text-gray-700'} ${isDragging ? 'opacity-60 shadow' : ''} cursor-grab active:cursor-grabbing`}
          {...attributes}
          {...listeners}
          onClick={() => {
            if (lastDraggedIdRef.current === node.id) {
              lastDraggedIdRef.current = null;
              return;
            }
            if (hasChildren) onToggleExpand(node.id);
            onModuleSelect(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )
          ) : (
            <div className="w-4 shrink-0" />
          )}
          {isHighlightModule && <span className="shrink-0" aria-hidden>🔥</span>}
          <span className="min-w-0 flex-1 truncate">{highlightName(node.name)}</span>
          <span className={`text-xs shrink-0 ml-1 ${isUnderHighlight ? 'text-red-500' : isSelected || isDropInto ? 'text-blue-600' : 'text-gray-400'}`}>({modulesCount[node.id] ?? node.count ?? 0})</span>
          {isDropInto && (
            <span className="shrink-0 ml-1.5 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-500 text-white" aria-hidden>
              作为子级
            </span>
          )}
          {hasModuleActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onAddSubModule && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAddSubParentId(node.id); setAddSubName(''); setAddSubOpen(true); }}>
                    <Plus className="w-3.5 h-3.5 mr-2" /> 添加子模块
                  </DropdownMenuItem>
                )}
                {onRenameModule && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameNodeId(node.id); setRenameName(node.name); setRenameOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> 重命名
                  </DropdownMenuItem>
                )}
                {onCopyModule && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setCopySourceId(node.id);
                      setCopySourceName(node.name);
                      setCopyTargetId('');
                      setCopyExpanded(new Set());
                      setCopySearchKeyword('');
                      setCopyDebouncedSearch('');
                      setCopyModuleOpen(true);
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" /> 复制模块
                  </DropdownMenuItem>
                )}
                {onMoveModule && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveSourceId(node.id);
                      setMoveSourceName(node.name);
                      setMoveTargetId(null);
                      setMoveExpanded(new Set());
                      setMoveSearchKeyword('');
                      setMoveDebouncedSearch('');
                      setMoveModuleOpen(true);
                    }}
                  >
                    <Move className="w-3.5 h-3.5 mr-2" /> 移动模块
                  </DropdownMenuItem>
                )}
                {onDeleteModule && (
                  <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setDeleteNodeId(node.id); setDeleteOpen(true); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> 删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }

  const filteredTree = useMemo(
    () =>
      normalizedSearch
        ? safeModuleTree.filter((n) => nodeOrChildrenMatchSearch(n, normalizedSearch))
        : safeModuleTree,
    [safeModuleTree, normalizedSearch],
  );

  /** 启用拖拽时递归渲染树：每个节点前/行/后为放置区，与原项目 dropPosition -1/0/1 对应 */
  function renderTreeWithDrag(nodes: ModuleTreeNode[], parentIsHighlight = false) {
    return nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const isHighlightModule = node.name != null && HIGHLIGHT_MODULE_NAMES.includes(String(node.name).trim());
      const isUnderHighlight = isHighlightModule || parentIsHighlight;
      const filteredChildren =
        hasChildren && normalizedSearch
          ? node.children!.filter((c) => nodeOrChildrenMatchSearch(c, normalizedSearch))
          : node.children || [];
      return (
        <Fragment key={node.id}>
          <DropZone id={DROP_PREFIX_BEFORE + node.id} className="w-full flex-shrink-0" />
          <DraggableTreeNodeRow node={node} parentIsHighlight={parentIsHighlight} />
          {hasChildren && isExpanded && filteredChildren.length > 0 && (
            <div className="ml-4 mt-0 space-y-0">{renderTreeWithDrag(filteredChildren, isUnderHighlight)}</div>
          )}
          <DropZone id={DROP_PREFIX_AFTER + node.id} className="w-full flex-shrink-0" />
        </Fragment>
      );
    });
  }

  const renderTreeNode = (node: ModuleTreeNode, parentIsHighlight = false) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedModuleId === node.id;
    const isHighlightModule = node.name != null && HIGHLIGHT_MODULE_NAMES.includes(String(node.name).trim());
    const isUnderHighlight = isHighlightModule || parentIsHighlight;
    const hasModuleActions = onAddSubModule || onRenameModule || onDeleteModule || onCopyModule || onMoveModule;
    return (
      <div key={node.id} className="mb-0 group">
        <div
          className={`w-full flex items-center gap-1 px-2 py-1 min-h-[24px] hover:bg-gray-50 rounded-md cursor-pointer text-[13px] ${isSelected ? 'bg-blue-50' : ''} ${isUnderHighlight ? 'text-red-600' : isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
          onClick={() => {
            if (hasChildren) onToggleExpand(node.id);
            onModuleSelect(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )
          ) : (
            <div className="w-4 shrink-0" />
          )}
          {isHighlightModule && <span className="shrink-0" aria-hidden>🔥</span>}
          <span className="min-w-0 flex-1 truncate">{highlightName(node.name)}</span>
          <span className={`text-xs shrink-0 ml-1 ${isUnderHighlight ? 'text-red-500' : isSelected ? 'text-blue-600' : 'text-gray-400'}`}>({modulesCount[node.id] ?? node.count ?? 0})</span>
          {hasModuleActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onAddSubModule && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAddSubParentId(node.id); setAddSubName(''); setAddSubOpen(true); }}>
                    <Plus className="w-3.5 h-3.5 mr-2" /> 添加子模块
                  </DropdownMenuItem>
                )}
                {onRenameModule && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameNodeId(node.id); setRenameName(node.name); setRenameOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> 重命名
                  </DropdownMenuItem>
                )}
                {onCopyModule && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setCopySourceId(node.id); setCopySourceName(node.name); setCopyTargetId(''); setCopyModuleOpen(true); }}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> 复制模块
                  </DropdownMenuItem>
                )}
                {onMoveModule && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMoveSourceId(node.id); setMoveSourceName(node.name); setMoveTargetId(null); setMoveModuleOpen(true); }}>
                    <Move className="w-3.5 h-3.5 mr-2" /> 移动模块
                  </DropdownMenuItem>
                )}
                {onDeleteModule && (
                  <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setDeleteNodeId(node.id); setDeleteOpen(true); }}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> 删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-0 space-y-0">
            {node.children!
              .filter((child) => nodeOrChildrenMatchSearch(child, normalizedSearch))
              .map((child) => renderTreeNode(child, isUnderHighlight))}
          </div>
        )}
      </div>
    );
  };

  const handleAddSub = async () => {
    if (!addSubName.trim() || !onAddSubModule) return;
    setAddSubLoading(true);
    try {
      await onAddSubModule(addSubParentId || 'NONE', addSubName.trim());
      setAddSubOpen(false);
      setAddSubName('');
    } finally {
      setAddSubLoading(false);
    }
  };
  const handleRename = async () => {
    if (!renameName.trim() || !onRenameModule) return;
    setRenameLoading(true);
    try {
      await onRenameModule(renameNodeId, renameName.trim());
      setRenameOpen(false);
    } finally {
      setRenameLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!onDeleteModule) return;
    setDeleteLoading(true);
    try {
      await onDeleteModule(deleteNodeId);
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyModuleConfirm = async () => {
    if (!onCopyModule || !copyTargetId) return;
    setCopyLoading(true);
    try {
      await onCopyModule(copySourceId, copyTargetId);
      setCopyModuleOpen(false);
    } finally {
      setCopyLoading(false);
    }
  };

  const handleMoveModuleConfirm = async () => {
    if (!onMoveModule || moveTargetId === null) return;
    setMoveLoading(true);
    try {
      await onMoveModule(moveSourceId, moveTargetId, 0);
      setMoveModuleOpen(false);
    } finally {
      setMoveLoading(false);
    }
  };

  const moveNormalizedSearch = moveDebouncedSearch.trim().toLowerCase();

  const highlightMoveName = (name?: string) => {
    if (!name) return null;
    if (!moveNormalizedSearch) return name;
    const lowerName = name.toLowerCase();
    const index = lowerName.indexOf(moveNormalizedSearch);
    if (index === -1) return name;
    const before = name.slice(0, index);
    const match = name.slice(index, index + moveNormalizedSearch.length);
    const after = name.slice(index + moveNormalizedSearch.length);
    return (
      <>
        {before}
        <span className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5">{match}</span>
        {after}
      </>
    );
  };

  const hasAnyMoveMatch = useMemo(
    () =>
      !moveNormalizedSearch ||
      safeModuleTree.some((n) => nodeOrChildrenMatchSearch(n, moveNormalizedSearch)),
    [safeModuleTree, moveNormalizedSearch],
  );

  const copyNormalizedSearch = copyDebouncedSearch.trim().toLowerCase();

  const highlightCopyName = (name?: string) => {
    if (!name) return null;
    if (!copyNormalizedSearch) return name;
    const lowerName = name.toLowerCase();
    const index = lowerName.indexOf(copyNormalizedSearch);
    if (index === -1) return name;
    const before = name.slice(0, index);
    const match = name.slice(index, index + copyNormalizedSearch.length);
    const after = name.slice(index + copyNormalizedSearch.length);
    return (
      <>
        {before}
        <span className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5">{match}</span>
        {after}
      </>
    );
  };

  const hasAnyCopyMatch = useMemo(
    () =>
      !copyNormalizedSearch ||
      safeModuleTree.some((n) => nodeOrChildrenMatchSearch(n, copyNormalizedSearch)),
    [safeModuleTree, copyNormalizedSearch],
  );

  const renderMoveTargetTree = (nodes: ModuleTreeNode[]) =>
    nodes.map((n) => {
      if (moveExcludeIds.has(n.id)) return null;
      if (moveNormalizedSearch && !nodeOrChildrenMatchSearch(n, moveNormalizedSearch)) return null;
      const hasChildren = n.children && n.children.length > 0;
      const isExpanded = moveExpanded.has(n.id);
      const isSelected = moveTargetId === n.id;
      return (
        <div key={n.id} className="mb-0.5">
          <div
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
            onClick={() => setMoveTargetId(n.id)}
          >
            {hasChildren ? (
              <button
                type="button"
                className="p-0.5 -ml-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveExpanded((p) => {
                    const next = new Set(p);
                    next.has(n.id) ? next.delete(n.id) : next.add(n.id);
                    return next;
                  });
                }}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Folder className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 truncate text-sm">{highlightMoveName(n.name)}</span>
          </div>
          {hasChildren && isExpanded && <div className="ml-5 mt-0.5">{renderMoveTargetTree(n.children!)}</div>}
        </div>
      );
    });

  const renderCopyTargetTree = (nodes: ModuleTreeNode[]) =>
    nodes.map((n) => {
      if (n.id === copySourceId) return null;
      if (copyNormalizedSearch && !nodeOrChildrenMatchSearch(n, copyNormalizedSearch)) return null;
      const hasChildren = n.children && n.children.length > 0;
      const isExpanded = copyExpanded.has(n.id);
      const isSelected = copyTargetId === n.id;
      return (
        <div key={n.id} className="mb-0.5">
          <div
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
            onClick={() => setCopyTargetId(n.id)}
          >
            {hasChildren ? (
              <button
                type="button"
                className="p-0.5 -ml-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setCopyExpanded((p) => {
                    const next = new Set(p);
                    next.has(n.id) ? next.delete(n.id) : next.add(n.id);
                    return next;
                  });
                }}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Folder className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 truncate text-sm">{highlightCopyName(n.name)}</span>
          </div>
          {hasChildren && isExpanded && <div className="ml-5 mt-0.5">{renderCopyTargetTree(n.children!)}</div>}
        </div>
      );
    });

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full">
      {titleBar && <div className="flex-shrink-0 border-b border-gray-200">{titleBar}</div>}
      {/* 搜索栏，可选 headerRight（如用例评审的「新建」） */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className={cn('flex items-center gap-2', headerRight && 'gap-2')}>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={moduleSearchKeyword}
              onChange={(e) => onModuleSearchChange(e.target.value)}
              placeholder="请输入模块名称"
              className="pl-9 h-8 text-[13px] border-gray-200 rounded-md placeholder:text-gray-400"
            />
          </div>
          {headerRight}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1.5 min-h-0">
        {/* 全部用例/全部评审：左侧文件夹+文字+数量，右侧展开/收起全部、添加子模块 */}
        <div
          className={`flex items-center min-h-[32px] px-2 py-1.5 rounded-md cursor-pointer ${selectedModuleId === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
          onClick={() => onModuleSelect('all')}
        >
          <Folder className={`w-4 h-4 shrink-0 mr-1.5 ${selectedModuleId === 'all' ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className="min-w-0 flex-1 truncate text-[13px]">{allLabel}</span>
          <span className={`text-xs shrink-0 mr-1 ${selectedModuleId === 'all' ? 'text-blue-600' : 'text-gray-400'}`}>({allModuleCount})</span>
          {(onExpandAll || onCollapseAll) && (
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-200/80 text-gray-500 shrink-0"
              onClick={(e) => { e.stopPropagation(); isExpandAll ? onCollapseAll?.() : onExpandAll?.(); }}
              title={isExpandAll ? '收起全部子模块' : '展开全部子模块'}
              aria-label={isExpandAll ? '收起全部子模块' : '展开全部子模块'}
            >
              {isExpandAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {onAddSubModule && (
            <button
              type="button"
              className="ml-0.5 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center shrink-0"
              onClick={(e) => { e.stopPropagation(); setAddSubParentId('NONE'); setAddSubName(''); setAddSubOpen(true); }}
              title="添加子模块"
              aria-label="添加子模块"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
        {extraRowsBeforeTree}
        {moduleTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-[13px]">
            <Folder className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            暂无模块
          </div>
        ) : dragEnabled ? (
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="mt-1 space-y-0">
              <DropZone id={DROP_ROOT} className="w-full rounded" />
              {renderTreeWithDrag(filteredTree)}
            </div>
            <DragOverlay dropAnimation={null}>
              {draggedNode ? (
                <div className="w-full flex items-center gap-1 px-2 py-1 min-h-[24px] rounded-md text-[13px] bg-white border border-gray-200 shadow-lg cursor-grabbing opacity-95">
                  <ChevronRight className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate text-gray-700">{draggedNode.name}</span>
                  <span className="text-xs shrink-0 ml-1 text-gray-400">({modulesCount[draggedNode.id] ?? draggedNode.count ?? 0})</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="mt-1 space-y-0">
            {filteredTree.map((n) => renderTreeNode(n))}
          </div>
        )}
      </div>
      <Dialog open={addSubOpen} onOpenChange={setAddSubOpen}>
        <DialogContent className="sm:max-w-[360px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>添加子模块</DialogTitle>
            <DialogDescription className="sr-only">输入分组名称并保存</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={addSubName}
              onChange={(e) => setAddSubName(e.target.value)}
              placeholder="请输入分组名称,按回车键保存"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSub()}
              className="text-[13px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubOpen(false)}>取消</Button>
            <Button onClick={handleAddSub} disabled={!addSubName.trim() || addSubLoading}>{addSubLoading ? '添加中...' : '确认'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-[360px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>重命名模块</DialogTitle>
            <DialogDescription className="sr-only">输入新名称并保存</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="请输入新名称"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>取消</Button>
            <Button onClick={handleRename} disabled={!renameName.trim() || renameLoading}>{renameLoading ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除该模块？</AlertDialogTitle>
            <AlertDialogDescription>删除后模块下的用例将移至回收站，此操作不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteLoading}>
              {deleteLoading ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={copyModuleOpen} onOpenChange={setCopyModuleOpen}>
        <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>复制模块</DialogTitle>
            <DialogDescription className="sr-only">将「{copySourceName}」及其下用例复制到目标模块</DialogDescription>
            <p className="text-sm text-gray-500">将「{copySourceName}」及其下用例复制到目标模块</p>
          </DialogHeader>
          <div className="py-4 max-h-[320px] overflow-y-auto">
            <div className="px-1 mb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={copySearchKeyword}
                  onChange={(e) => setCopySearchKeyword(e.target.value)}
                  placeholder="搜索模块名称..."
                  className="h-8 pl-7 text-sm"
                  autoComplete="off"
                />
              </div>
            </div>
            {!hasAnyCopyMatch ? (
              <div className="py-6 text-center text-sm text-gray-500">
                <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                未找到匹配的模块
              </div>
            ) : (
              renderCopyTargetTree(moduleTree)
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyModuleOpen(false)}>取消</Button>
            <Button onClick={handleCopyModuleConfirm} disabled={!copyTargetId || copyLoading}>
              {copyLoading ? '复制中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={moveModuleOpen} onOpenChange={setMoveModuleOpen}>
        <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>移动模块</DialogTitle>
            <DialogDescription className="sr-only">将「{moveSourceName}」移动到目标位置</DialogDescription>
            <p className="text-sm text-gray-500">将「{moveSourceName}」移动到目标位置</p>
          </DialogHeader>
          <div className="py-4 max-h-[320px] overflow-y-auto space-y-1">
            <div className="px-1 mb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={moveSearchKeyword}
                  onChange={(e) => setMoveSearchKeyword(e.target.value)}
                  placeholder="搜索模块名称..."
                  className="h-8 pl-7 text-sm"
                  autoComplete="off"
                />
              </div>
            </div>
            <div
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 ${moveTargetId === '' ? 'bg-blue-50' : ''}`}
              onClick={() => setMoveTargetId('')}
            >
              <Folder className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm">根（项目下）</span>
            </div>
            {!hasAnyMoveMatch ? (
              <div className="py-6 text-center text-sm text-gray-500">
                <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                未找到匹配的模块
              </div>
            ) : (
              renderMoveTargetTree(safeModuleTree)
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModuleOpen(false)}>取消</Button>
            <Button onClick={handleMoveModuleConfirm} disabled={moveTargetId === null || moveLoading}>
              {moveLoading ? '移动中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        {onNavigateToRecycle && (
        <div className="px-4 py-1.5 border-t border-gray-200 flex-shrink-0">
          <div
            className="flex items-center min-h-[32px] px-2 py-1.5 rounded-md cursor-pointer text-[13px] text-gray-700 hover:bg-gray-50"
            onClick={onNavigateToRecycle}
          >
            <Trash2 className="w-4 h-4 shrink-0 mr-1 text-gray-400" />
            <span className="flex-1">回收站</span>
            {typeof recycleCount === 'number' && <span className="text-xs text-gray-400 shrink-0">{recycleCount}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
