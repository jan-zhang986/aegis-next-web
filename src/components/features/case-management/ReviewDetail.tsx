/**
 * 评审详情
 * 完整迁移自 spotter-metersphere caseReview/detail.vue
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, Link2, Edit, Copy, Star, MoreHorizontal, Trash2,
  Folder, ChevronRight, ChevronDown, RefreshCw, Filter, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { caseManagementService, projectManagementService } from '@/services';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { cn } from '@/utils/cn';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ReviewItem } from './types';
import { REVIEW_STATUS_LABEL_MAP, REVIEW_PASS_RULE_MAP, REVIEW_STATUS_MAP, CASE_LEVEL_MAP, EXECUTE_RESULT_MAP } from './constants';
import { ReviewPassRateDisplay } from './ReviewPassRateDisplay';
import { AssociateCaseDrawer } from './components/AssociateCaseDrawer';
import { CaseLevelBadge } from './components/CaseLevelBadge';
import { getCaseLevel } from './utils/getCaseLevel';
import { ReviewMinderView } from './ReviewMinderView';

const TABLE_COLUMN_WIDTHS_KEY = 'review-detail-column-widths';
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 560;
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  num: 120,
  name: 260,
  caseLevel: 120,
  reviewer: 220,
  status: 150,
  executeResult: 140,
  createUser: 140,
  actions: 140,
};

/** 可拖拽列宽的表头 */
function ResizableTh({
  columnKey,
  width,
  onResize,
  children,
  className,
}: {
  columnKey: string;
  width: number;
  onResize: (key: string, w: number) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const startX = useRef(0);
  const startW = useRef(0);
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startW.current = width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX.current;
        const w = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, startW.current + delta));
        onResize(columnKey, w);
      };
      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [columnKey, width, onResize]
  );

  return (
    <TableHead
      className={cn('relative group !px-4 overflow-hidden', className)}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      <div className="w-full flex items-center pr-2">
        <div className="truncate w-full text-left">{children}</div>
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整列宽"
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-[8px] cursor-col-resize z-10 flex items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <div className="w-[3px] h-4 bg-gray-300/80 rounded-full opacity-0 group-hover:opacity-100 group-hover:bg-[#165DFF] transition-all duration-200" />
      </div>
    </TableHead>
  );
}

interface ReviewDetailProps {
  reviewId: string;
  projectId?: string;
  onBack?: () => void;
  onViewCase?: (caseId: string, moduleId?: string) => void;
  onEditReview?: (id: string) => void;
  initialModuleId?: string;
}

export function ReviewDetail({
  reviewId,
  projectId = localStorage.getItem('currentProjectId') || 'default-project',
  onBack,
  onViewCase,
  onEditReview,
  initialModuleId,
}: ReviewDetailProps) {
  const [loading, setLoading] = useState(false);
  const [reviewInfo, setReviewInfo] = useState<ReviewItem | null>(null);
  const [caseList, setCaseList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpToPage, setJumpToPage] = useState<string | number>('');
  const [moduleTree, setModuleTree] = useState<any[]>([]);
  const [modulesCount, setModulesCount] = useState<Record<string, number>>({});
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId || 'all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [moduleSearchKeyword, setModuleSearchKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [associateDrawerOpen, setAssociateDrawerOpen] = useState(false);
  const [associatedIds, setAssociatedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [caseLevelFilter, setCaseLevelFilter] = useState<string[]>([]);
  const [createUserFilter, setCreateUserFilter] = useState<string[]>([]);
  const [lastExecuteResultFilter, setLastExecuteResultFilter] = useState<string[]>([]);
  /** 排序：后端 sort 为 Map<字段名(camelCase), 'asc'|'desc'>，如 { num: 'asc' }、{ name: 'desc' } */
  const [sort, setSort] = useState<Record<string, 'asc' | 'desc'> | null>(null);
  /** 用例等级筛选项：与原项目一致从 getCaseDefaultFields 的 functional_priority 的 options 来，筛选时传 option.value 与后端 functional_case_custom_field.value 一致 */
  const [caseLevelOptions, setCaseLevelOptions] = useState<{ value: string; label: string }[]>([]);
  /** 显式选择的关联记录 id（case_review_functional_case.id），支持跨页累积 */
  const [selectedAssociationIds, setSelectedAssociationIds] = useState<Set<string>>(new Set());
  /** 全选全部（当前查询结果）模式：不在 exclude 集合里的关联记录都视为已选 */
  const [selectAll, setSelectAll] = useState(false);
  /** 全选全部模式下被排除的关联记录 id（case_review_functional_case.id） */
  const [excludedAssociationIds, setExcludedAssociationIds] = useState<Set<string>>(new Set());
  const [disassociateDialogOpen, setDisassociateDialogOpen] = useState(false);
  const [disassociateSelectAll, setDisassociateSelectAll] = useState(false);
  const [disassociateSelectIds, setDisassociateSelectIds] = useState<string[]>([]);
  const [disassociateExcludeIds, setDisassociateExcludeIds] = useState<string[]>([]);
  const [disassociateCount, setDisassociateCount] = useState(0);
  const [disassociateLoading, setDisassociateLoading] = useState(false);
  const [reviewerOptions, setReviewerOptions] = useState<{ id: string; name: string }[]>([]);
  const [creatorOptions, setCreatorOptions] = useState<{ id: string; name: string }[]>([]);
  /** 创建人筛选项内的搜索关键字，用于在 Popover 内过滤成员列表 */
  const [creatorSearchKeyword, setCreatorSearchKeyword] = useState('');
  const [reviewerChangingId, setReviewerChangingId] = useState<string | null>(null);
  const [editingReviewerCaseId, setEditingReviewerCaseId] = useState<string | null>(null);
  const [editingReviewerIds, setEditingReviewerIds] = useState<string[]>([]);
  const [caseViewMode, setCaseViewMode] = useState<'list' | 'minder'>('list');
  const [onlyMineStatus, setOnlyMineStatus] = useState(false);
  const [batchReviewDialogOpen, setBatchReviewDialogOpen] = useState(false);
  const [batchReReviewDialogOpen, setBatchReReviewDialogOpen] = useState(false);
  const [batchReviewResult, setBatchReviewResult] = useState<'PASS' | 'UN_PASS'>('PASS');
  const [batchReviewContent, setBatchReviewContent] = useState('');
  const [batchReReviewContent, setBatchReReviewContent] = useState('');
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [selectRangePromptOpen, setSelectRangePromptOpen] = useState(false);

  /** 表格列宽（可拖拽表头调整），持久化到 localStorage */
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const v = localStorage.getItem(TABLE_COLUMN_WIDTHS_KEY);
      if (v) {
        const o = JSON.parse(v) as Record<string, number>;
        if (o && typeof o === 'object') return { ...DEFAULT_COLUMN_WIDTHS, ...o };
      }
    } catch {}
    return { ...DEFAULT_COLUMN_WIDTHS };
  });
  useEffect(() => {
    try {
      localStorage.setItem(TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
    } catch {}
  }, [columnWidths]);
  const getColumnWidth = useCallback(
    (key: string) => columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key] ?? 120,
    [columnWidths]
  );
  const handleColumnResize = useCallback((key: string, w: number) => {
    setColumnWidths((prev) => ({ ...prev, [key]: w }));
  }, []);

  const fetchDetail = useCallback(async () => {
    try {
      const detail = await caseManagementService.getReviewDetail(reviewId);
      setReviewInfo(detail as ReviewItem);
    } catch (err) {
      console.error('获取评审详情失败:', err);
    }
  }, [reviewId]);

  const clearSelection = useCallback(() => {
    setSelectAll(false);
    setSelectedAssociationIds(new Set());
    setExcludedAssociationIds(new Set());
  }, []);

  const offspringIds = useMemo(() => {
    if (selectedModuleId === 'all' || !moduleTree.length) return [];
    const collect: string[] = [];
    function collectDescendants(nodes: any[]): void {
      for (const n of nodes) {
        collect.push(n.id);
        if (n.children?.length) collectDescendants(n.children);
      }
    }
    function findAndCollect(nodes: any[]): boolean {
      for (const n of nodes) {
        if (n.id === selectedModuleId) {
          if (n.children?.length) collectDescendants(n.children);
          return true;
        }
        if (n.children?.length && findAndCollect(n.children)) return true;
      }
      return false;
    }
    findAndCollect(moduleTree);
    return collect;
  }, [selectedModuleId, moduleTree]);

  /** 表格筛选条件：后端 filter 为 Map<String, List<String>>，支持多选 */
  const tableFilter = useMemo(() => {
    const f: Record<string, string[]> = {};
    if (statusFilter.length) f.status = statusFilter;
    if (caseLevelFilter.length) f.caseLevel = caseLevelFilter.filter((v) => v != null && String(v).trim() !== '');
    if (createUserFilter.length) f.create_user = createUserFilter;
    if (lastExecuteResultFilter.length) f.last_execute_result = lastExecuteResultFilter;
    return f;
  }, [statusFilter, caseLevelFilter, createUserFilter, lastExecuteResultFilter]);

  const selectionQueryKey = useMemo(
    () => JSON.stringify({ selectedModuleId, keyword, tableFilter, sort, onlyMineStatus }),
    [selectedModuleId, keyword, tableFilter, sort, onlyMineStatus]
  );
  useEffect(() => {
    clearSelection();
  }, [selectionQueryKey, clearSelection]);

  const fetchCaseList = useCallback(async () => {
    setLoading(true);
    try {
      // 与原项目 setLoadListParams/tableQueryParams 一致：含 sort、viewId、combineSearch、moduleIds、filter
      const params: any = {
        reviewId,
        projectId,
        current: Math.max(1, currentPage),
        pageSize: Math.max(5, pageSize),
        sort: sort && Object.keys(sort).length > 0 ? sort : {},
        keyword: keyword || '',
        viewId: '',
        combineSearch: { searchMode: 'AND' as const, conditions: [] },
        moduleIds: selectedModuleId === 'all' ? [] : [selectedModuleId, ...offspringIds],
        filter: tableFilter,
      };
      if (reviewInfo?.reviewPassRule === 'MULTIPLE' && onlyMineStatus) params.viewStatusFlag = true;
      const res: any = await caseManagementService.getReviewDetailCasePage(params);
      const list = res?.list ?? res?.data ?? [];
      setCaseList(list);
      setTotal(res?.total ?? list.length);
    } catch (err) {
      console.error('获取用例列表失败:', err);
      setCaseList([]);
    } finally {
      setLoading(false);
    }
  }, [reviewId, projectId, currentPage, pageSize, keyword, selectedModuleId, offspringIds, tableFilter, onlyMineStatus, reviewInfo?.reviewPassRule, sort]);

  const fetchModuleTree = useCallback(async () => {
    try {
      const tree = await caseManagementService.getReviewDetailModuleTree(reviewId);
      setModuleTree(tree || []);
    } catch (err) {
      console.error('获取用例模块树失败:', err);
      setModuleTree([]);
    }
  }, [reviewId]);

  /** 加载用例等级筛选项：与 spotter caseReview/detail/caseTable getCaseLevelFields 一致，用模板 functional_priority 的 options，筛选传 value 与后端 functional_case_custom_field.value 一致 */
  const fetchCaseLevelOptions = useCallback(async () => {
    if (!projectId) return;
    try {
      const res: any = await caseManagementService.getCaseDefaultFields(projectId);
      const customFields = res?.customFields ?? res?.data?.customFields ?? res ?? [];
      const arr = Array.isArray(customFields) ? customFields : [];
      const priorityField = arr.find((f: any) => f?.internal && f?.internalFieldKey === 'functional_priority');
      const options = priorityField?.options ?? [];
      // 与原项目 defaultFilter 一致：筛选用 option.value（后端 functional_case_custom_field 存的是 value，勿用 opt.id）
      const list = options.map((opt: any) => {
        const rawValue = opt.value ?? opt.text ?? opt.label;
        const rawLabel = opt.text ?? opt.label ?? opt.value ?? '';
        return { value: String(rawValue ?? ''), label: String(rawLabel ?? '') };
      }).filter((o: { value: string; label: string }) => o.value !== '');
      setCaseLevelOptions(list.length > 0 ? list : Object.entries(CASE_LEVEL_MAP).map(([value, { label }]) => ({ value, label })));
    } catch {
      setCaseLevelOptions(Object.entries(CASE_LEVEL_MAP).map(([value, { label }]) => ({ value, label })));
    }
  }, [projectId]);

  const fetchModuleCount = useCallback(async () => {
    try {
      // 与 fetchCaseList 保持一致，统计也带相同 filter/sort，否则模块数量与列表不一致
      const params: any = {
        reviewId,
        projectId,
        current: Math.max(1, currentPage),
        pageSize: Math.max(5, pageSize),
        sort: sort && Object.keys(sort).length > 0 ? sort : {},
        keyword: keyword || '',
        viewId: '',
        combineSearch: { searchMode: 'AND' as const, conditions: [] },
        moduleIds: selectedModuleId === 'all' ? [] : [selectedModuleId, ...offspringIds],
        filter: tableFilter,
      };
      if (reviewInfo?.reviewPassRule === 'MULTIPLE' && onlyMineStatus) params.viewStatusFlag = true;
      const res: any = await caseManagementService.getReviewDetailModuleCount(params);
      setModulesCount(res || {});
    } catch (err) {
      console.error('获取模块数量失败:', err);
    }
  }, [reviewId, projectId, currentPage, pageSize, keyword, selectedModuleId, offspringIds, tableFilter, onlyMineStatus, reviewInfo?.reviewPassRule, sort]);

  const fetchReviewers = useCallback(async () => {
    try {
      const res: any = await caseManagementService.getReviewUsers(projectId, '');
      const list = Array.isArray(res) ? res : res?.list ?? res?.data ?? [];
      setReviewerOptions(list.map((u: any) => ({ id: u.id, name: u.name || u.userName || u.email || '-' })));
    } catch {
      setReviewerOptions([]);
    }
  }, [projectId]);

  const fetchCreatorOptions = useCallback(async () => {
    try {
      const res: any = await projectManagementService.getProjectMemberOptions(projectId);
      const list = Array.isArray(res) ? res : res?.list ?? res?.data ?? [];
      setCreatorOptions(list.map((u: any) => ({ id: u.id, name: u.name || u.userName || u.email || '-' })));
    } catch {
      setCreatorOptions([]);
    }
  }, [projectId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);
  useEffect(() => { fetchCaseList(); }, [fetchCaseList]);
  useEffect(() => { fetchModuleTree(); }, [fetchModuleTree]);
  useEffect(() => { fetchModuleCount(); }, [fetchModuleCount]);
  useEffect(() => { fetchCaseLevelOptions(); }, [fetchCaseLevelOptions]);
  useEffect(() => { fetchReviewers(); }, [fetchReviewers]);
  useEffect(() => { fetchCreatorOptions(); }, [fetchCreatorOptions]);

  useEffect(() => {
    if (initialModuleId && initialModuleId !== 'all' && moduleTree.length > 0) {
      const ancestors = new Set<string>();
      const findAncestors = (nodes: any[], targetId: string, path: string[] = []): boolean => {
        for (const node of nodes) {
          if (node.id === targetId) {
            path.forEach((id) => ancestors.add(id));
            return true;
          }
          if (node.children?.length) {
            if (findAncestors(node.children, targetId, [...path, String(node.id)])) return true;
          }
        }
        return false;
      };
      findAncestors(moduleTree, initialModuleId);
      if (ancestors.size > 0) {
        setExpandedNodes((prev) => new Set([...prev, ...ancestors]));
      }
    }
  }, [initialModuleId, moduleTree]);

  const fetchAssociatedIds = useCallback(async () => {
    try {
      const ids = await caseManagementService.getAssociatedIds(reviewId);
      setAssociatedIds(Array.isArray(ids) ? ids : []);
    } catch {
      setAssociatedIds([]);
    }
  }, [reviewId]);

  useEffect(() => { fetchAssociatedIds(); }, [fetchAssociatedIds]);

  const handleFollow = async () => {
    const userId = localStorage.getItem('currentUserId') || localStorage.getItem('userId') || '';
    if (!userId) return;
    setFollowLoading(true);
    try {
      await caseManagementService.followReview({ userId, caseReviewId: reviewId });
      toast.success(reviewInfo?.followFlag ? '已取消关注' : '关注成功');
      fetchDetail();
    } catch (err) {
      toast.error('操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!reviewInfo) return;
    try {
      const res: any = await caseManagementService.copyReview({
        copyId: reviewId,
        projectId,
        name: `${reviewInfo.name}_复制`,
        moduleId: reviewInfo.moduleId || 'root',
        reviewPassRule: (reviewInfo.reviewPassRule as 'SINGLE' | 'MULTIPLE') || 'SINGLE',
        startTime: reviewInfo.startTime ?? null,
        endTime: reviewInfo.endTime ?? null,
        tags: reviewInfo.tags || [],
        description: reviewInfo.description || '',
        reviewers: Array.isArray(reviewInfo.reviewers)
          ? (reviewInfo.reviewers as (string | { userId?: string })[]).map((r) => (typeof r === 'string' ? r : (r as { userId?: string }).userId)).filter(Boolean) as string[]
          : [],
      });
      const newId = res?.id || res?.data?.id;
      if (newId) {
        toast.success('复制成功');
        onViewCase?.(newId, selectedModuleId);
      }
    } catch (err) {
      toast.error('复制失败');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await caseManagementService.deleteReview(reviewId, projectId);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      onBack?.();
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const caseIdField = (item: any) => item.caseId ?? item.id;
  /** 表格行 id 为评审-用例关联表主键(case_review_functional_case.id)，批量接口 selectIds 需传此 id */
  const associationIdField = (item: any) => item.id;
  const isCurrentPageAllSelected =
    caseList.length > 0 &&
    caseList.every((item) => {
      const aid = String(associationIdField(item));
      if (!aid) return false;
      return selectAll ? !excludedAssociationIds.has(aid) : selectedAssociationIds.has(aid);
    });

  const currentPageAssociationIds = useMemo(
    () => caseList.map((item) => String(associationIdField(item))).filter(Boolean),
    [caseList]
  );

  const currentPageSelectedCount = useMemo(() => {
    if (currentPageAssociationIds.length === 0) return 0;
    if (selectAll) {
      let excludedOnPage = 0;
      currentPageAssociationIds.forEach((id) => {
        if (excludedAssociationIds.has(id)) excludedOnPage += 1;
      });
      return Math.max(0, currentPageAssociationIds.length - excludedOnPage);
    }
    let count = 0;
    currentPageAssociationIds.forEach((id) => {
      if (selectedAssociationIds.has(id)) count += 1;
    });
    return count;
  }, [currentPageAssociationIds, selectAll, excludedAssociationIds, selectedAssociationIds]);

  const selectedCount = useMemo(() => {
    if (selectAll) return Math.max(0, total - excludedAssociationIds.size);
    return selectedAssociationIds.size;
  }, [selectAll, total, excludedAssociationIds, selectedAssociationIds]);

  const toggleRowSelect = useCallback((associationId: string, checked: boolean) => {
    const aid = String(associationId);
    if (!aid) return;
    if (selectAll) {
      setExcludedAssociationIds((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(aid);
        else next.add(aid);
        return next;
      });
    } else {
      setSelectedAssociationIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(aid);
        else next.delete(aid);
        return next;
      });
    }
  }, [selectAll]);

  const toggleSelectCurrentPage = useCallback((checked: boolean) => {
    if (currentPageAssociationIds.length === 0) return;
    if (selectAll) {
      setExcludedAssociationIds((prev) => {
        const next = new Set(prev);
        if (checked) currentPageAssociationIds.forEach((id) => next.delete(id));
        else currentPageAssociationIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      setSelectedAssociationIds((prev) => {
        const next = new Set(prev);
        if (checked) currentPageAssociationIds.forEach((id) => next.add(id));
        else currentPageAssociationIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, [currentPageAssociationIds, selectAll]);

  const handleSelectRange = useCallback((mode: 'page' | 'all') => {
    if (mode === 'page') {
      // 仅当前页：保留已选的其他页，并把当前页补全为全选
      setSelectAll(false);
      setExcludedAssociationIds(new Set());
      setSelectedAssociationIds((prev) => {
        const next = new Set(prev);
        currentPageAssociationIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      // 全部：按当前查询条件全选（后端用 selectAll + excludeIds 表达）
      setSelectAll(true);
      setSelectedAssociationIds(new Set());
      setExcludedAssociationIds(new Set());
    }
    setSelectRangePromptOpen(false);
  }, [currentPageAssociationIds]);

  const openDisassociateConfirmForSelection = useCallback(() => {
    if (selectedCount === 0) {
      toast.error('请先勾选要取消关联的用例');
      return;
    }
    if (selectAll) {
      setDisassociateSelectAll(true);
      setDisassociateSelectIds([]);
      setDisassociateExcludeIds(Array.from(excludedAssociationIds));
      setDisassociateCount(selectedCount);
    } else {
      setDisassociateSelectAll(false);
      setDisassociateSelectIds(Array.from(selectedAssociationIds));
      setDisassociateExcludeIds([]);
      setDisassociateCount(selectedAssociationIds.size);
    }
    setDisassociateDialogOpen(true);
  }, [selectedCount, selectAll, excludedAssociationIds, selectedAssociationIds]);

  const confirmDisassociate = async () => {
    if (disassociateCount === 0) return;
    setDisassociateLoading(true);
    try {
      await caseManagementService.batchDisassociateReviewCase({
        reviewId,
        projectId,
        moduleIds: selectedModuleId === 'all' ? [] : [selectedModuleId, ...offspringIds],
        selectIds: disassociateSelectIds,
        selectAll: disassociateSelectAll,
        excludeIds: disassociateExcludeIds,
        condition: { filter: tableFilter },
        currentSelectCount: disassociateCount,
        keyword: keyword || undefined,
      });
      toast.success('取消关联成功');
      setDisassociateDialogOpen(false);
      setDisassociateSelectAll(false);
      setDisassociateSelectIds([]);
      setDisassociateExcludeIds([]);
      setDisassociateCount(0);
      clearSelection();
      fetchCaseList();
      fetchDetail();
      fetchModuleCount();
      fetchAssociatedIds();
    } catch (err) {
      toast.error('取消关联失败');
    } finally {
      setDisassociateLoading(false);
    }
  };
  const handleSingleDisassociate = (item: any) => {
    const aid = String(associationIdField(item));
    if (!aid) return;
    setDisassociateSelectAll(false);
    setDisassociateSelectIds([aid]);
    setDisassociateExcludeIds([]);
    setDisassociateCount(1);
    setDisassociateDialogOpen(true);
  };

  const handleBatchReview = async () => {
    if (selectedCount === 0) {
      toast.error('请先勾选要评审的用例');
      return;
    }
    setBatchActionLoading(true);
    try {
      await caseManagementService.batchReview({
        reviewId,
        projectId,
        reviewPassRule: (reviewInfo?.reviewPassRule as 'SINGLE' | 'MULTIPLE') || 'SINGLE',
        status: batchReviewResult,
        content: batchReviewContent.trim(),
        notifier: '',
        moduleIds: selectedModuleId === 'all' ? [] : [selectedModuleId, ...offspringIds],
        selectIds: selectAll ? [] : Array.from(selectedAssociationIds),
        selectAll,
        excludeIds: selectAll ? Array.from(excludedAssociationIds) : [],
        condition: { filter: tableFilter },
        currentSelectCount: selectedCount,
        keyword: keyword || undefined,
      });
      toast.success('批量评审已提交');
      setBatchReviewDialogOpen(false);
      setBatchReviewContent('');
      setBatchReviewResult('PASS');
      clearSelection();
      fetchCaseList();
      fetchDetail();
      fetchModuleCount();
    } catch (err: any) {
      toast.error(err?.message || '批量评审失败');
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchReReview = async () => {
    if (selectedCount === 0) {
      toast.error('请先勾选要重新评审的用例');
      return;
    }
    setBatchActionLoading(true);
    try {
      await caseManagementService.batchReview({
        reviewId,
        projectId,
        reviewPassRule: (reviewInfo?.reviewPassRule as 'SINGLE' | 'MULTIPLE') || 'SINGLE',
        status: 'RE_REVIEWED',
        content: batchReReviewContent.trim(),
        notifier: '',
        moduleIds: selectedModuleId === 'all' ? [] : [selectedModuleId, ...offspringIds],
        selectIds: selectAll ? [] : Array.from(selectedAssociationIds),
        selectAll,
        excludeIds: selectAll ? Array.from(excludedAssociationIds) : [],
        condition: { filter: tableFilter },
        currentSelectCount: selectedCount,
        keyword: keyword || undefined,
      });
      toast.success('已提交重新评审');
      setBatchReReviewDialogOpen(false);
      setBatchReReviewContent('');
      clearSelection();
      fetchCaseList();
      fetchDetail();
      fetchModuleCount();
    } catch (err: any) {
      toast.error(err?.message || '批量重新评审失败');
    } finally {
      setBatchActionLoading(false);
    }
  };

  const getCaseReviewerIds = (item: any): string[] => {
    const r = item.reviewers;
    if (!Array.isArray(r)) return [];
    return r.map((x: any) => (typeof x === 'string' ? x : x?.userId ?? x?.id)).filter(Boolean);
  };

  const handleReviewerChange = async (item: any, reviewerIds: string[]) => {
    const associationId = associationIdField(item);
    if (!associationId) return;
    setReviewerChangingId(caseIdField(item));
    try {
      await caseManagementService.batchChangeReviewer({
        reviewId,
        selectIds: [associationId],
        selectAll: false,
        condition: {},
        reviewerId: reviewerIds,
        append: false,
      });
      toast.success('评审人已更新');
      fetchCaseList();
    } catch {
      toast.error('更新失败');
    } finally {
      setReviewerChangingId(null);
    }
  };

  const normalizedModuleSearch = moduleSearchKeyword.trim().toLowerCase();

  const nodeOrChildrenMatchModuleSearch = useCallback((node: any, kw: string): boolean => {
    if (!kw) return true;
    const selfMatch = String(node?.name ?? '').toLowerCase().includes(kw);
    if (selfMatch) return true;
    const children = Array.isArray(node?.children) ? node.children : [];
    return children.some((c: any) => nodeOrChildrenMatchModuleSearch(c, kw));
  }, []);

  const filteredModuleTree = useMemo(() => {
    if (!normalizedModuleSearch) return moduleTree;
    return (Array.isArray(moduleTree) ? moduleTree : []).filter((n: any) => nodeOrChildrenMatchModuleSearch(n, normalizedModuleSearch));
  }, [moduleTree, normalizedModuleSearch, nodeOrChildrenMatchModuleSearch]);

  const expandedNodesForModuleSearch = useMemo(() => {
    const ids = new Set<string>();
    if (!normalizedModuleSearch) return ids;
    const walk = (n: any): boolean => {
      const selfMatch = String(n?.name ?? '').toLowerCase().includes(normalizedModuleSearch);
      const children = Array.isArray(n?.children) ? n.children : [];
      let childMatch = false;
      for (const c of children) {
        if (walk(c)) childMatch = true;
      }
      if (selfMatch || childMatch) {
        if (n?.id != null) ids.add(String(n.id));
      }
      return selfMatch || childMatch;
    };
    (Array.isArray(moduleTree) ? moduleTree : []).forEach((n: any) => walk(n));
    return ids;
  }, [moduleTree, normalizedModuleSearch]);

  const highlightModuleName = useCallback((name?: string) => {
    if (!name) return null;
    if (!normalizedModuleSearch) return name;
    const lower = name.toLowerCase();
    const idx = lower.indexOf(normalizedModuleSearch);
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + normalizedModuleSearch.length);
    const after = name.slice(idx + normalizedModuleSearch.length);
    return (
      <>
        {before}
        <span className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5">{match}</span>
        {after}
      </>
    );
  }, [normalizedModuleSearch]);

  const effectiveExpandedNodes = normalizedModuleSearch ? expandedNodesForModuleSearch : expandedNodes;

  const renderTreeNode = (node: any): JSX.Element => {
    const nodeId = String(node.id);
    const isExpanded = effectiveExpandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedModuleId === node.id;
    const count = modulesCount[node.id] ?? node.count ?? 0;
    const filteredChildren =
      hasChildren && normalizedModuleSearch
        ? (Array.isArray(node.children) ? node.children : []).filter((c: any) => nodeOrChildrenMatchModuleSearch(c, normalizedModuleSearch))
        : (Array.isArray(node.children) ? node.children : []);
    return (
      <div key={node.id} className="mb-0.5">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${isSelected ? 'bg-[#165DFF]/10 text-[#165DFF] font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => {
            if (hasChildren && !normalizedModuleSearch) {
              setExpandedNodes((prev) => (prev.has(nodeId) ? new Set([...prev].filter((x) => x !== nodeId)) : new Set([...prev, nodeId])));
            }
            setSelectedModuleId(node.id);
            setCurrentPage(1);
          }}
        >
          {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />) : <div className="w-4 shrink-0" />}
          <span className="flex-1 truncate min-w-0">{highlightModuleName(node.name)}</span>
          {count > 0 && <span className="text-xs text-gray-400 tabular-nums shrink-0">({count})</span>}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {filteredChildren.map((c: any) => renderTreeNode(c))}
          </div>
        )}
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoToPrev = currentPage > 1;
  const canGoToNext = currentPage < totalPages;
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  const handleJumpToPage = () => {
    if (jumpToPage === '' || jumpToPage === 0) return;
    const pageNum = typeof jumpToPage === 'string' ? parseInt(jumpToPage, 10) : jumpToPage;
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpToPage('');
    } else {
      toast.error(`请输入有效的页码（1-${totalPages}）`);
      setJumpToPage('');
    }
  };
  const handleJumpToPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJumpToPage();
    }
  };
  const reviewedCount = reviewInfo?.reviewedCount ?? (reviewInfo as any)?.reviewedCount ?? 0;
  const caseCount = reviewInfo?.caseCount ?? 0;
  const passRate = reviewInfo?.passRate ?? 0;
  const passCount = reviewInfo?.passCount;
  const unPassCount = reviewInfo?.unPassCount;
  const reReviewCount = reviewInfo?.reReviewCount;
  const underReviewCount = reviewInfo?.underReviewCount;
  const unReviewCount = reviewInfo?.unReviewCount;

  /** 点击表头排序：编号、用例名称 支持 asc -> desc -> 取消 */
  const toggleSort = (field: 'num' | 'name') => {
    const next =
      sort && sort[field] === 'asc'
        ? { [field]: 'desc' as const }
        : sort && sort[field] === 'desc'
          ? null
          : { [field]: 'asc' as const };
    setSort(next);
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f5f6f8] min-h-0 overflow-hidden">
      <Card className="m-4 flex-shrink-0 border-gray-200/80 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {onBack && (
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#165DFF]" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> 返回
                </Button>
              )}
              <h2 className="text-xl font-semibold truncate max-w-[320px] text-gray-900" title={reviewInfo?.name}>
                {reviewInfo?.name || '评审详情'}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${reviewInfo?.reviewPassRule === 'SINGLE' ? 'bg-green-100 text-green-700' : 'bg-[#165DFF]/10 text-[#165DFF]'}`}>
                {REVIEW_PASS_RULE_MAP[reviewInfo?.reviewPassRule || '']}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                {REVIEW_STATUS_LABEL_MAP[reviewInfo?.status || '']}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => setAssociateDrawerOpen(true)}>
                <Link2 className="w-4 h-4 mr-1.5" /> 关联用例
              </Button>
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => onEditReview?.(reviewId)}>
                <Edit className="w-4 h-4 mr-1.5" /> 编辑
              </Button>
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1.5" /> 复制
              </Button>
              <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={handleFollow} disabled={followLoading}>
                <Star className={`w-4 h-4 mr-1.5 ${reviewInfo?.followFlag ? 'fill-amber-400 text-amber-500' : ''}`} /> {reviewInfo?.followFlag ? '已关注' : '关注'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 rounded-lg p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> 删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-5 max-w-lg">
            <ReviewPassRateDisplay
              passRate={passRate}
              caseCount={caseCount}
              reviewedCount={reviewedCount}
              passCount={passCount}
              unPassCount={unPassCount}
              reReviewCount={reReviewCount}
              underReviewCount={underReviewCount}
              unReviewCount={unReviewCount}
              showTitle
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex flex-col min-h-0 mx-4 mb-4">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-white border border-gray-200/80 rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">用例模块</h3>
              <Input
                placeholder="搜索模块..."
                value={moduleSearchKeyword}
                onChange={(e) => setModuleSearchKeyword(e.target.value)}
                className="h-9 rounded-lg border-gray-200 bg-white mb-2"
              />
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer mb-1.5 transition-colors ${selectedModuleId === 'all' ? 'bg-[#165DFF]/10 text-[#165DFF] font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => { setSelectedModuleId('all'); setCurrentPage(1); }}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">全部用例</span>
                <span className="text-xs text-gray-400 tabular-nums">({total})</span>
              </div>
              <ScrollArea className="flex-1 min-h-0 -mx-1 pr-1 mt-1">
                <div className="py-1">
                  {filteredModuleTree.map((n) => renderTreeNode(n))}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>
            <Card className="flex-1 flex flex-col h-full min-h-0 border-gray-200/80 shadow-sm">
              <CardContent className="flex-1 flex flex-col p-5 min-h-0">
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <ToggleGroup
                    type="single"
                    value={caseViewMode}
                    onValueChange={(v) => v && setCaseViewMode(v as 'list' | 'minder')}
                    className="bg-gray-100 p-0.5 rounded-lg"
                  >
                    <ToggleGroupItem value="list" className="text-xs px-4 rounded-md data-[state=on]:bg-white data-[state=on]:text-[#165DFF] data-[state=on]:shadow-sm">
                      列表
                    </ToggleGroupItem>
                    <ToggleGroupItem value="minder" className="text-xs px-4 rounded-md data-[state=on]:bg-white data-[state=on]:text-[#165DFF] data-[state=on]:shadow-sm">
                      脑图
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {reviewInfo?.reviewPassRule === 'MULTIPLE' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={onlyMineStatus}
                        onCheckedChange={setOnlyMineStatus}
                        className="data-[state=checked]:bg-[#165DFF]"
                      />
                      <span className="text-sm text-gray-600">仅看我的评审状态</span>
                    </label>
                  )}
                  {caseViewMode === 'list' && (
                    <>
                      <Input
                        placeholder="搜索用例..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (setCurrentPage(1), fetchCaseList())}
                        className="max-w-xs h-9 rounded-lg border-gray-200 bg-white"
                      />
                      <Button size="sm" className="h-9 rounded-lg" onClick={() => { setCurrentPage(1); fetchCaseList(); }}>搜索</Button>
                      {(statusFilter.length || caseLevelFilter.length || createUserFilter.length || lastExecuteResultFilter.length) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg gap-1.5 text-gray-600"
                          onClick={() => {
                            setStatusFilter([]);
                            setCaseLevelFilter([]);
                            setCreateUserFilter([]);
                            setLastExecuteResultFilter([]);
                            setCurrentPage(1);
                            fetchCaseList();
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          清除筛选
                        </Button>
                      ) : null}
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={fetchCaseList} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </>
                  )}
                  {selectedCount > 0 && caseViewMode === 'list' && (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm text-gray-500">已选 {selectedCount} 条</span>
                      <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => setBatchReviewDialogOpen(true)}>
                        批量评审
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => setBatchReReviewDialogOpen(true)}>
                        批量重新评审
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-lg text-red-600 border-red-200 hover:bg-red-50" onClick={openDisassociateConfirmForSelection}>
                        取消关联
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9" onClick={clearSelection}>取消选择</Button>
                    </div>
                  )}
                </div>
                {caseViewMode === 'list' && (
                <>
                <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white">
                  {(selectedCount > 0 || selectAll) && (
                    <div className="px-4 py-2 border-b border-gray-200 bg-[#fafafa] text-sm flex items-center gap-2 flex-wrap">
                      <span className="text-gray-600">
                        已选 <span className="font-medium text-gray-900">{selectedCount}</span> 条
                      </span>
                      {selectAll && excludedAssociationIds.size > 0 && (
                        <span className="text-gray-500">（已排除 {excludedAssociationIds.size} 条）</span>
                      )}
                      <button type="button" className="text-gray-500 hover:text-gray-700 text-sm" onClick={clearSelection}>
                        清除选择
                      </button>
                    </div>
                  )}
                  <Table className="text-sm table-fixed">
                    <TableHeader className="bg-[#fafafa] sticky top-0 z-10 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent border-none h-11">
                        <TableHead className="w-10 px-2">
                          <Popover open={selectRangePromptOpen} onOpenChange={setSelectRangePromptOpen}>
                            <PopoverTrigger asChild>
                              <div className="inline-flex">
                                <Checkbox
                                  checked={
                                    isCurrentPageAllSelected
                                      ? true
                                      : currentPageSelectedCount > 0
                                        ? 'indeterminate'
                                        : false
                                  }
                                  onCheckedChange={(checked) => {
                                    const next = Boolean(checked);
                                    // 取消勾选：全选全部模式下清空；否则仅取消当前页
                                    if (!next) {
                                      if (selectAll) clearSelection();
                                      else toggleSelectCurrentPage(false);
                                      return;
                                    }
                                    // 勾选：弹出范围选择（当前页 / 全部），不自动选
                                    setSelectRangePromptOpen(true);
                                  }}
                                  className="rounded-[2px]"
                                  aria-label="选择范围"
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                              <div className="text-sm font-medium text-gray-900 mb-2">选择勾选范围</div>
                              <div className="text-xs text-gray-500 mb-3">
                                请选择要勾选的范围：仅当前页（{currentPageAssociationIds.length} 条）或全部结果（按当前筛选条件，共 {total} 条）。
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => setSelectRangePromptOpen(false)}
                                >
                                  取消
                                </Button>
                                <Button size="sm" className="h-8" onClick={() => handleSelectRange('page')}>
                                  当前页
                                </Button>
                                <Button size="sm" className="h-8" onClick={() => handleSelectRange('all')}>
                                  全部
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableHead>
                        <ResizableTh columnKey="num" width={getColumnWidth('num')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-gray-900 font-medium w-full text-left"
                            onClick={() => toggleSort('num')}
                          >
                            编号
                            {sort?.num === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#165DFF]" />
                            ) : sort?.num === 'desc' ? (
                              <ArrowDown className="w-3.5 h-3.5 text-[#165DFF]" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </ResizableTh>
                        <ResizableTh columnKey="name" width={getColumnWidth('name')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-gray-900 font-medium w-full text-left"
                            onClick={() => toggleSort('name')}
                          >
                            用例名称
                            {sort?.name === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#165DFF]" />
                            ) : sort?.name === 'desc' ? (
                              <ArrowDown className="w-3.5 h-3.5 text-[#165DFF]" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </ResizableTh>
                        <ResizableTh columnKey="caseLevel" width={getColumnWidth('caseLevel')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="flex items-center gap-1 hover:text-gray-900">
                                用例等级
                                <Filter className="w-3.5 h-3.5 text-gray-400" />
                                {caseLevelFilter.length > 0 && (
                                  <span className="text-[#165DFF] text-xs">(已筛{caseLevelFilter.length})</span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2 max-h-[280px] overflow-auto" align="start">
                              <div className="px-2 py-1 text-xs text-gray-500 mb-0.5">可多选</div>
                              <button
                                type="button"
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100"
                                onClick={() => { setCaseLevelFilter([]); setCurrentPage(1); }}
                              >
                                全部
                              </button>
                              {(caseLevelOptions.length > 0 ? caseLevelOptions : Object.entries(CASE_LEVEL_MAP).map(([value, { label }]) => ({ value, label }))).map((opt) => {
                                const isSelected = caseLevelFilter.includes(opt.value);
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 ${isSelected ? 'text-[#165DFF] font-medium' : ''}`}
                                    onClick={() => {
                                      const next = isSelected ? caseLevelFilter.filter((v) => v !== opt.value) : [...caseLevelFilter, opt.value];
                                      setCaseLevelFilter(next);
                                      setCurrentPage(1);
                                    }}
                                  >
                                    <span className={cn('w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px]', isSelected ? 'bg-[#165DFF] border-[#165DFF] text-white' : 'border-gray-300')}>
                                      {isSelected ? '✓' : ''}
                                    </span>
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </PopoverContent>
                          </Popover>
                        </ResizableTh>
                        <ResizableTh columnKey="reviewer" width={getColumnWidth('reviewer')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          评审人
                        </ResizableTh>
                        <ResizableTh columnKey="status" width={getColumnWidth('status')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="flex items-center gap-1 hover:text-gray-900">
                                评审结果
                                <Filter className="w-3.5 h-3.5 text-gray-400" />
                                {statusFilter.length > 0 && <span className="text-[#165DFF] text-xs">(已筛{statusFilter.length})</span>}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-44 p-2 max-h-[280px] overflow-auto" align="start">
                              <div className="px-2 py-1 text-xs text-gray-500 mb-0.5">可多选</div>
                              <button
                                type="button"
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100"
                                onClick={() => { setStatusFilter([]); setCurrentPage(1); }}
                              >
                                全部
                              </button>
                              {Object.entries(REVIEW_STATUS_MAP).map(([value, { label }]) => {
                                const isSelected = statusFilter.includes(value);
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 ${isSelected ? 'text-[#165DFF] font-medium' : ''}`}
                                    onClick={() => {
                                      const next = isSelected ? statusFilter.filter((v) => v !== value) : [...statusFilter, value];
                                      setStatusFilter(next);
                                      setCurrentPage(1);
                                    }}
                                  >
                                    <span className={cn('w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px]', isSelected ? 'bg-[#165DFF] border-[#165DFF] text-white' : 'border-gray-300')}>
                                      {isSelected ? '✓' : ''}
                                    </span>
                                    {label}
                                  </button>
                                );
                              })}
                            </PopoverContent>
                          </Popover>
                        </ResizableTh>
                        <ResizableTh columnKey="executeResult" width={getColumnWidth('executeResult')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="flex items-center gap-1 hover:text-gray-900">
                                执行结果
                                <Filter className="w-3.5 h-3.5 text-gray-400" />
                                {lastExecuteResultFilter.length > 0 && <span className="text-[#165DFF] text-xs">(已筛{lastExecuteResultFilter.length})</span>}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2 max-h-[280px] overflow-auto" align="start">
                              <div className="px-2 py-1 text-xs text-gray-500 mb-0.5">可多选</div>
                              <button
                                type="button"
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100"
                                onClick={() => { setLastExecuteResultFilter([]); setCurrentPage(1); }}
                              >
                                全部
                              </button>
                              {Object.entries(EXECUTE_RESULT_MAP).map(([value, { label }]) => {
                                const isSelected = lastExecuteResultFilter.includes(value);
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2 ${isSelected ? 'text-[#165DFF] font-medium' : ''}`}
                                    onClick={() => {
                                      const next = isSelected ? lastExecuteResultFilter.filter((v) => v !== value) : [...lastExecuteResultFilter, value];
                                      setLastExecuteResultFilter(next);
                                      setCurrentPage(1);
                                    }}
                                  >
                                    <span className={cn('w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px]', isSelected ? 'bg-[#165DFF] border-[#165DFF] text-white' : 'border-gray-300')}>
                                      {isSelected ? '✓' : ''}
                                    </span>
                                    {label}
                                  </button>
                                );
                              })}
                            </PopoverContent>
                          </Popover>
                        </ResizableTh>
                        <ResizableTh columnKey="createUser" width={getColumnWidth('createUser')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="flex items-center gap-1 hover:text-gray-900">
                                创建人
                                <Filter className="w-3.5 h-3.5 text-gray-400" />
                                {createUserFilter.length > 0 && (
                                  <span className="text-[#165DFF] text-xs">(已筛{createUserFilter.length})</span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 max-h-[320px] overflow-hidden flex flex-col" align="start">
                              <Input
                                placeholder="搜索创建人"
                                value={creatorSearchKeyword}
                                onChange={(e) => setCreatorSearchKeyword(e.target.value)}
                                className="h-8 mb-2 border-gray-200 text-sm"
                              />
                              <div className="px-2 py-1 text-xs text-gray-500 mb-0.5">可多选</div>
                              <button
                                type="button"
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100"
                                onClick={() => { setCreateUserFilter([]); setCurrentPage(1); }}
                              >
                                全部
                              </button>
                              <div className="max-h-[220px] overflow-auto mt-0.5">
                                {(() => {
                                  const filtered = creatorOptions.filter((u) => !creatorSearchKeyword.trim() || u.name.toLowerCase().includes(creatorSearchKeyword.trim().toLowerCase()));
                                  if (creatorOptions.length === 0) return <div className="px-2 py-2 text-xs text-gray-400">暂无成员</div>;
                                  if (filtered.length === 0) return <div className="px-2 py-2 text-xs text-gray-400">无匹配成员</div>;
                                  return filtered.map((u) => {
                                    const isSelected = createUserFilter.includes(u.id);
                                    return (
                                      <button
                                        key={u.id}
                                        type="button"
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 truncate flex items-center gap-2 ${isSelected ? 'text-[#165DFF] font-medium' : ''}`}
                                        title={u.name}
                                        onClick={() => {
                                          const next = isSelected ? createUserFilter.filter((v) => v !== u.id) : [...createUserFilter, u.id];
                                          setCreateUserFilter(next);
                                          setCurrentPage(1);
                                        }}
                                      >
                                        <span className={cn('w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px]', isSelected ? 'bg-[#165DFF] border-[#165DFF] text-white' : 'border-gray-300')}>
                                          {isSelected ? '✓' : ''}
                                        </span>
                                        <span className="truncate block">{u.name}</span>
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </ResizableTh>
                        <ResizableTh columnKey="actions" width={getColumnWidth('actions')} onResize={handleColumnResize} className="py-3 text-sm font-medium text-gray-700 text-right pr-4">
                          操作
                        </ResizableTh>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                          </TableCell>
                        </TableRow>
                      ) : caseList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                            暂无关联用例，可点击「关联用例」添加
                          </TableCell>
                        </TableRow>
                      ) : (
                        caseList.map((item) => {
                          const cid = caseIdField(item);
                          const wNum = getColumnWidth('num');
                          const wName = getColumnWidth('name');
                          const wCaseLevel = getColumnWidth('caseLevel');
                          const wReviewer = getColumnWidth('reviewer');
                          const wStatus = getColumnWidth('status');
                          const wExecuteResult = getColumnWidth('executeResult');
                          const wCreateUser = getColumnWidth('createUser');
                          const wActions = getColumnWidth('actions');
                          return (
                            <TableRow key={cid} className="hover:bg-gray-50/70">
                              <TableCell className="px-2 py-2">
                                <Checkbox
                                  checked={(() => {
                                    const aid = String(associationIdField(item));
                                    if (!aid) return false;
                                    return selectAll ? !excludedAssociationIds.has(aid) : selectedAssociationIds.has(aid);
                                  })()}
                                  onCheckedChange={(checked) => {
                                    const aid = String(associationIdField(item));
                                    if (!aid) return;
                                    toggleRowSelect(aid, Boolean(checked));
                                  }}
                                  className="rounded-[2px]"
                                  aria-label={`选择 ${item.name}`}
                                />
                              </TableCell>
                              <TableCell className="px-4 py-2.5 truncate" style={{ width: wNum, minWidth: wNum, maxWidth: wNum }}>
                                <button
                                  className="text-[#165DFF] font-medium hover:underline font-mono text-sm"
                                  onClick={() => onViewCase?.(cid, selectedModuleId)}
                                >
                                  {item.num ?? '-'}
                                </button>
                              </TableCell>
                              <TableCell className="px-4 py-2.5 truncate" style={{ width: wName, minWidth: wName, maxWidth: wName }}>
                                <button
                                  className="text-[#165DFF] font-medium hover:underline text-left truncate block text-sm w-full"
                                  onClick={() => onViewCase?.(cid, selectedModuleId)}
                                  title={item.name}
                                >
                                  {item.name}
                                </button>
                              </TableCell>
                              <TableCell className="px-4 py-2.5 truncate" style={{ width: wCaseLevel, minWidth: wCaseLevel, maxWidth: wCaseLevel }}>
                                <CaseLevelBadge item={item} level={(item as any).caseLevel ?? getCaseLevel(item as any) ?? (item as any).functionalPriority} />
                              </TableCell>
                              <TableCell className="px-4 py-2.5 truncate" style={{ width: wReviewer, minWidth: wReviewer, maxWidth: wReviewer }}>
                                {reviewInfo?.reviewPassRule === 'MULTIPLE' ? (
                                  <Popover
                                    open={editingReviewerCaseId === cid}
                                    onOpenChange={(open) => {
                                      if (!open) setEditingReviewerCaseId(null);
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-sm font-normal text-gray-700 hover:bg-gray-100 max-w-full justify-start truncate"
                                        disabled={reviewerChangingId === cid}
                                        onClick={() => {
                                          setEditingReviewerCaseId(cid);
                                          setEditingReviewerIds(getCaseReviewerIds(item));
                                        }}
                                      >
                                        {reviewerChangingId === cid
                                          ? '保存中...'
                                          : Array.isArray(item.reviewNames) && item.reviewNames.length > 0
                                            ? item.reviewNames.join('、')
                                            : getCaseReviewerIds(item).length > 0
                                              ? getCaseReviewerIds(item).map((id) => reviewerOptions.find((r) => r.id === id)?.name ?? id).join('、')
                                              : '请选择评审人'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="start">
                                      <div className="max-h-[200px] overflow-auto space-y-1">
                                        {reviewerOptions.map((r) => (
                                          <label
                                            key={r.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                                          >
                                            <Checkbox
                                              checked={editingReviewerCaseId === cid ? editingReviewerIds.includes(r.id) : getCaseReviewerIds(item).includes(r.id)}
                                              onCheckedChange={(checked) => {
                                                if (editingReviewerCaseId !== cid) {
                                                  setEditingReviewerCaseId(cid);
                                                  setEditingReviewerIds(getCaseReviewerIds(item));
                                                }
                                                setEditingReviewerIds((prev) =>
                                                  checked ? [...prev, r.id] : prev.filter((x) => x !== r.id)
                                                );
                                              }}
                                            />
                                            <span className="truncate">{r.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <div className="flex justify-end gap-1 mt-2 pt-2 border-t">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingReviewerCaseId(null)}>
                                          取消
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const ids = editingReviewerCaseId === cid ? editingReviewerIds : getCaseReviewerIds(item);
                                            setEditingReviewerCaseId(null);
                                            handleReviewerChange(item, ids);
                                          }}
                                        >
                                          确定
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <span className="text-sm text-gray-600 truncate block max-w-[140px]">
                                    {Array.isArray(item.reviewNames) ? item.reviewNames.join('、') : item.reviewers?.join?.('、') ?? '-'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-2.5 truncate" style={{ width: wStatus, minWidth: wStatus, maxWidth: wStatus }}>
                                <button
                                  type="button"
                                  onClick={() => onViewCase?.(cid, selectedModuleId)}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity ${REVIEW_STATUS_MAP[item.status]?.color || 'bg-gray-100 text-gray-700'}`}
                                >
                                  {REVIEW_STATUS_MAP[item.status]?.label ?? item.status ?? '-'}
                                </button>
                              </TableCell>
                              <TableCell className="px-4 py-2.5 truncate" style={{ width: wExecuteResult, minWidth: wExecuteResult, maxWidth: wExecuteResult }}>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${EXECUTE_RESULT_MAP[item.lastExecuteResult]?.color ?? 'bg-gray-100 text-gray-700'}`}>
                                  {EXECUTE_RESULT_MAP[item.lastExecuteResult]?.label ?? item.lastExecuteResult ?? '-'}
                                </span>
                              </TableCell>
                              <TableCell
                                className="px-4 py-2.5 text-sm text-gray-600 truncate"
                                style={{ width: wCreateUser, minWidth: wCreateUser, maxWidth: wCreateUser }}
                                title={item.createUserName ?? (item as any).createUser}
                              >
                                {item.createUserName ?? (item as any).createUser ?? '-'}
                              </TableCell>
                              <TableCell className="text-right pr-4 py-2.5 truncate" style={{ width: wActions, minWidth: wActions, maxWidth: wActions }}>
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[#165DFF] hover:bg-[#165DFF]/5" onClick={() => onViewCase?.(cid, selectedModuleId)}>
                                    评审
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:bg-red-50" onClick={() => handleSingleDisassociate(item)}>
                                    取消关联
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* 分页 - 与报告中心自动化测试报告一致 */}
                {total > 0 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
                    <div className="text-sm text-gray-500">
                      共 <span className="font-medium text-gray-900">{total}</span> 条
                      <span className="mx-2">|</span>
                      每页显示
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => handlePageSizeChange(Number(v))}
                      >
                        <SelectTrigger className="inline-flex h-8 w-20 mx-2 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      条
                    </div>
                    <div className="flex items-center gap-6">
                      <Pagination className="w-auto m-0">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(currentPage - 1)}
                              className={cn('cursor-pointer', !canGoToPrev && 'pointer-events-none opacity-50')}
                            />
                          </PaginationItem>
                          {(() => {
                            const items: React.ReactNode[] = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }
                            if (startPage > 1) {
                              items.push(
                                <PaginationItem key={1}>
                                  <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                                </PaginationItem>
                              );
                              if (startPage > 2) items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis key="ellipsis-start-icon" /></PaginationItem>);
                            }
                            for (let i = startPage; i <= endPage; i++) {
                              items.push(
                                <PaginationItem key={i}>
                                  <PaginationLink
                                    onClick={() => handlePageChange(i)}
                                    isActive={currentPage === i}
                                  >
                                    {i}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis key="ellipsis-end-icon" /></PaginationItem>);
                              items.push(
                                <PaginationItem key={totalPages}>
                                  <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                                </PaginationItem>
                              );
                            }
                            return items;
                          })()}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(currentPage + 1)}
                              className={cn('cursor-pointer', !canGoToNext && 'pointer-events-none opacity-50')}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      <div className="flex items-center gap-2 pl-6 border-l border-gray-100">
                        <span className="text-sm text-gray-500 whitespace-nowrap">跳至</span>
                        <Input
                          className="w-14 h-8 px-1 text-center border-gray-200"
                          value={jumpToPage}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setJumpToPage('');
                            else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num)) setJumpToPage(num);
                            }
                          }}
                          onKeyDown={handleJumpToPageKeyDown}
                        />
                        <span className="text-sm text-gray-500 whitespace-nowrap">页</span>
                      </div>
                    </div>
                  </div>
                )}
                </>
                )}
                {caseViewMode === 'minder' && (
                  <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-200 bg-white flex flex-col">
                    <ReviewMinderView
                      projectId={projectId}
                      reviewId={reviewId}
                      moduleTree={moduleTree}
                      modulesCount={modulesCount}
                      selectedModuleId={selectedModuleId}
                      viewStatusFlag={reviewInfo?.reviewPassRule === 'MULTIPLE' ? onlyMineStatus : undefined}
                      onViewCase={onViewCase}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <AssociateCaseDrawer
        open={associateDrawerOpen}
        onOpenChange={setAssociateDrawerOpen}
        projectId={projectId}
        reviewId={reviewId}
        reviewers={(reviewInfo?.reviewers as { userId?: string }[])?.map((r) => r.userId).filter((id): id is string => Boolean(id)) ?? []}
        excludeIds={associatedIds}
        onSuccess={() => { fetchCaseList(); fetchDetail(); fetchModuleCount(); fetchAssociatedIds(); }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除评审 &quot;{reviewInfo?.name}&quot; 吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700">
              {deleteLoading ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={disassociateDialogOpen} onOpenChange={setDisassociateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消关联</AlertDialogTitle>
            <AlertDialogDescription>
              确定要取消关联 {disassociateCount} 条用例吗？取消后再次关联，评审结果为未评审。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisassociate} disabled={disassociateLoading}>
              {disassociateLoading ? '处理中...' : '确定'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchReviewDialogOpen} onOpenChange={setBatchReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量评审</AlertDialogTitle>
            <AlertDialogDescription>
              对已选 {selectedCount} 条用例提交评审结果。不通过时请填写评审意见。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">评审结果</label>
              <RadioGroup value={batchReviewResult} onValueChange={(v) => setBatchReviewResult(v as 'PASS' | 'UN_PASS')} className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="PASS" id="batch-pass" className="text-[#165DFF]" />
                  <span className="text-sm">通过</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" htmlFor="batch-unpass">
                  <RadioGroupItem value="UN_PASS" id="batch-unpass" className="text-[#165DFF]" />
                  <span className="text-sm">不通过</span>
                </label>
              </RadioGroup>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">评审意见（不通过时必填）</label>
              <Input
                value={batchReviewContent}
                onChange={(e) => setBatchReviewContent(e.target.value)}
                placeholder="选填"
                className="h-10 rounded-lg border-gray-200"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchReview} disabled={batchActionLoading || (batchReviewResult === 'UN_PASS' && !batchReviewContent.trim())}>
              {batchActionLoading ? '提交中...' : '提交'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchReReviewDialogOpen} onOpenChange={setBatchReReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量重新评审</AlertDialogTitle>
            <AlertDialogDescription>
              对已选 {selectedCount} 条用例提交重新评审，用例将变为「重新提审」状态。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">评审意见（选填）</label>
            <Input
              value={batchReReviewContent}
              onChange={(e) => setBatchReReviewContent(e.target.value)}
              placeholder="选填"
              className="h-10 rounded-lg border-gray-200"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchReReview} disabled={batchActionLoading}>
              {batchActionLoading ? '提交中...' : '提交'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
