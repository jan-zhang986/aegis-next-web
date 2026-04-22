/**
 * 测试计划详情 - 测试规划
 * 参考测试工厂 API 接口结构树：左侧树形列表 + 右侧表格
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { testPlanManagementService } from '@/services';
import { PlanDetailFeatureCase } from './PlanDetailFeatureCase';
import { PlanDetailApiCase } from './PlanDetailApiCase';
import { PlanDetailScenarioCase } from './PlanDetailScenarioCase';

/** 测试计划脑图树节点（与 API PlanMinderNode 对应） */
interface PlanMinderTreeNode {
  id: string;
  name: string;
  level?: number;
  type?: string;
  num?: number;
  /** 该测试点下关联用例数（从子节点「N条」用例数提取，不单独占一级） */
  caseCount?: number;
  resource?: string[];
  priority?: number;
  children?: PlanMinderTreeNode[];
}

const CATEGORY_LABEL: Record<string, string> = {
  FUNCTIONAL_CASE: '功能用例',
  API_CASE: '接口用例',
  API: '接口用例',
  SCENARIO_CASE: '自动化用例',
  SCENARIO: '自动化',
};

/** 判断是否为「用例数」展示子节点（如 19条），应提取数字挂到父节点后并从树中移除 */
function isCaseCountDisplayNode(c: any): boolean {
  const data = c?.data ?? c;
  const text = data?.text ?? data?.name ?? c?.text ?? c?.name ?? '';
  const resource = data?.resource ?? c?.resource;
  const isCaseNum = Array.isArray(resource) && resource[0] === '用例数';
  const match = String(text).match(/^(\d+)条$/);
  return isCaseNum && !!match;
}

/** 从「N条」节点解析出数字 */
function parseCaseCountFromNode(c: any): number | undefined {
  const data = c?.data ?? c;
  const text = data?.text ?? data?.name ?? c?.text ?? c?.name ?? '';
  const match = String(text).match(/^(\d+)条$/);
  return match ? parseInt(match[1], 10) : undefined;
}

/** 按深度注入 level；将「用例数」子节点（如 19条）提取为父节点 caseCount，不单独占一级 */
function mapApiNodeToTree(raw: any, depth = 0): PlanMinderTreeNode {
  const data = raw?.data ?? raw;
  const id = data?.id ?? raw?.id ?? '';
  const name = data?.text ?? data?.name ?? raw?.text ?? raw?.name ?? '';
  const level = data?.level ?? depth;
  const children = raw?.children ?? [];
  const filteredRaw = (Array.isArray(children) ? children : []).filter(
    (c: any) => c?.data?.id !== 'fakeNode' && c?.data?.type !== 'tmp' && c?.data?.id !== 'tmp'
  );
  let caseCount: number | undefined;
  const realChildrenRaw = filteredRaw.filter((c: any) => {
    if (isCaseCountDisplayNode(c)) {
      const n = parseCaseCountFromNode(c);
      if (n !== undefined) caseCount = n;
      return false;
    }
    return true;
  });
  const mappedChildren =
    realChildrenRaw.length > 0 ? realChildrenRaw.map((c: any) => mapApiNodeToTree(c, depth + 1)) : undefined;
  return {
    id,
    name: name || '未命名',
    level,
    type: data?.type,
    num: data?.num,
    caseCount,
    resource: data?.resource,
    priority: data?.priority,
    children: mappedChildren,
  };
}

/** 递归聚合子节点用例数，填到根（level=0）和分类（level=1）的 caseCount，便于显示合计 */
function aggregateCaseCount(node: PlanMinderTreeNode): number {
  if (node.level === 2 && node.caseCount != null) return node.caseCount;
  if (node.children?.length) {
    const sum = node.children.reduce((acc, c) => acc + aggregateCaseCount(c), 0);
    if (node.level === 0 || node.level === 1) (node as PlanMinderTreeNode).caseCount = sum;
    return sum;
  }
  return 0;
}

function parseMinderData(rawData: any): PlanMinderTreeNode[] {
  if (!rawData) return [];
  let rootRaw: any;
  if (Array.isArray(rawData)) {
    rootRaw = rawData[0];
  } else if (rawData?.data && Array.isArray(rawData.data)) {
    // 兼容未解包的 { code, message, data: [树] } 响应
    rootRaw = rawData.data[0];
  } else {
    rootRaw = rawData?.root ?? rawData;
  }
  if (!rootRaw || !(rootRaw?.data ?? rootRaw?.children)) return [];
  const root = mapApiNodeToTree(rootRaw);
  aggregateCaseCount(root);
  if (!root.children?.length) return [root];
  return [root];
}

interface PlanDetailPlanTreeProps {
  planId: string;
  projectId: string;
  status: string;
  canEdit: boolean;
  onRefresh?: () => void;
  /** 测试计划下关联用例总数，用于在「测试规划」标题旁展示，不单独占一行 */
  totalCaseCount?: number | null;
}

/** 递归查找节点 */
function findNode(nodes: PlanMinderTreeNode[], id: string): PlanMinderTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** 判断 level1 节点是否为「功能用例」分类（按 type 或 name 兼容后端，type 含 FUNCTIONAL） */
function isFunctionalCaseCategory(n: PlanMinderTreeNode): boolean {
  if (n.level !== 1) return false;
  if (n.type === 'FUNCTIONAL_CASE' || n.type === 'FUNCTIONAL') return true;
  const name = (n.name || '').trim();
  return name === '功能用例';
}

/** 判断 level1 节点是否为「接口用例」分类 */
function isApiCaseCategory(n: PlanMinderTreeNode): boolean {
  if (n.level !== 1) return false;
  if (n.type === 'API_CASE' || n.type === 'API') return true;
  const name = (n.name || '').trim();
  return name === '接口用例';
}

/** 判断 level1 节点是否为「自动化用例」分类 */
function isScenarioCaseCategory(n: PlanMinderTreeNode): boolean {
  if (n.level !== 1) return false;
  if (n.type === 'SCENARIO_CASE' || n.type === 'SCENARIO') return true;
  const name = (n.name || '').trim();
  return name === '场景用例' || name === '自动化用例';
}

function collectBranchIds(nodes: PlanMinderTreeNode[], isCategory: (n: PlanMinderTreeNode) => boolean): Set<string> {
  const ids = new Set<string>();
  function walk(list: PlanMinderTreeNode[]) {
    for (const n of list) {
      if (isCategory(n)) {
        ids.add(n.id);
        if (n.children?.length) collect(n.children);
        return;
      }
      if (n.children?.length) walk(n.children);
    }
  }
  function collect(list: PlanMinderTreeNode[]) {
    for (const n of list) {
      if (n.id) ids.add(n.id);
      if (n.children?.length) collect(n.children);
    }
  }
  walk(nodes);
  return ids;
}

// ============ 新增测试点弹窗 ============

/** 当前选中的分类对应的中文名（功能用例 / 接口用例 / 自动化用例） */
const CATEGORY_DISPLAY_NAMES: Record<'FUNCTIONAL' | 'API' | 'SCENARIO', string> = {
  FUNCTIONAL: '功能用例',
  API: '接口用例',
  SCENARIO: '自动化用例',
};

interface AddTestPointDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading: boolean;
  /** 当前选中的模块名，用于弹窗标题与描述 */
  categoryLabel: string;
  onConfirm: (name: string, executeMethod: 'SERIAL' | 'PARALLEL') => Promise<void>;
}

function AddTestPointDialog({ open, onOpenChange, loading, categoryLabel, onConfirm }: AddTestPointDialogProps) {
  const [name, setName] = useState('');
  const [executeMethod, setExecuteMethod] = useState<'SERIAL' | 'PARALLEL'>('PARALLEL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setExecuteMethod('PARALLEL');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm(name, executeMethod);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4 text-blue-500" />
            新增测试点
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            在「{categoryLabel}」下新增一个测试点
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 名称输入 */}
          <div className="space-y-1.5">
            <Label htmlFor="point-name" className="text-sm font-medium text-gray-700">
              测试点名称
            </Label>
            <Input
              id="point-name"
              ref={inputRef}
              placeholder={`请输入名称（留空使用默认）`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) handleConfirm();
              }}
              className="h-9"
            />
          </div>

          {/* 执行方式 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">执行方式</Label>
            <ToggleGroup
              type="single"
              value={executeMethod}
              onValueChange={(v) => { if (v) setExecuteMethod(v as 'SERIAL' | 'PARALLEL'); }}
              className="justify-start gap-2"
            >
              <ToggleGroupItem
                value="PARALLEL"
                className="h-8 px-3 text-sm rounded-md data-[state=on]:bg-blue-600 data-[state=on]:text-white border border-gray-200 data-[state=on]:border-blue-600"
              >
                并行
              </ToggleGroupItem>
              <ToggleGroupItem
                value="SERIAL"
                className="h-8 px-3 text-sm rounded-md data-[state=on]:bg-blue-600 data-[state=on]:text-white border border-gray-200 data-[state=on]:border-blue-600"
              >
                串行
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-sm text-gray-400">
              {executeMethod === 'PARALLEL' ? '并行：用例同时执行，速度更快' : '串行：用例依次执行，便于排查问题'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            确认新增
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ 主组件 ============

export function PlanDetailPlanTree({ planId, projectId, status, canEdit, onRefresh, totalCaseCount }: PlanDetailPlanTreeProps) {
  const [loading, setLoading] = useState(false);
  const [addPointLoading, setAddPointLoading] = useState(false);
  const [minderData, setMinderData] = useState<any>(null);
  const [showTip, setShowTip] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 「新增功能点」弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  /** 弹窗触发时的「插入到此节点后」id，null=不指定（插入到功能用例分类下首位） */
  const [insertAfterNodeId, setInsertAfterNodeId] = useState<string | null>(null);

  // 树节点悬浮「+」按钮展示控制
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const treeData = useMemo(() => parseMinderData(minderData), [minderData]);

  const selectedNode = useMemo(() => {
    if (!selectedId || treeData.length === 0) return null;
    return findNode(treeData, selectedId);
  }, [treeData, selectedId]);

  const tableRows = useMemo((): PlanMinderTreeNode[] => {
    if (!selectedNode) return treeData;
    return selectedNode.children ?? [];
  }, [selectedNode, treeData]);

  const functionalCaseBranchIds = useMemo(() => collectBranchIds(treeData, isFunctionalCaseCategory), [treeData]);
  const apiCaseBranchIds = useMemo(() => collectBranchIds(treeData, isApiCaseCategory), [treeData]);
  const scenarioCaseBranchIds = useMemo(() => collectBranchIds(treeData, isScenarioCaseCategory), [treeData]);
  const isFunctionalCaseBranch = Boolean(selectedId && functionalCaseBranchIds.has(selectedId));
  const isApiCaseBranch = Boolean(selectedId && apiCaseBranchIds.has(selectedId));
  const isScenarioCaseBranch = Boolean(selectedId && scenarioCaseBranchIds.has(selectedId));
  const rootId = treeData.length > 0 ? treeData[0]?.id ?? null : null;
  const showRightContent = treeData.length > 0;
  const featureCaseCollectionId = useMemo(() => {
    if (!selectedNode) return '';
    if (selectedNode.id === rootId) return '';
    if (!functionalCaseBranchIds.has(selectedNode.id)) return '';
    if (selectedNode.level === 1) return '';
    return selectedNode.id;
  }, [selectedNode, rootId, functionalCaseBranchIds]);
  const apiCaseModuleId = useMemo(() => {
    if (!selectedNode) return '';
    if (!apiCaseBranchIds.has(selectedNode.id)) return '';
    if (selectedNode.level === 1) return '';
    return selectedNode.id;
  }, [selectedNode, apiCaseBranchIds]);
  const scenarioCaseModuleId = useMemo(() => {
    if (!selectedNode) return '';
    if (!scenarioCaseBranchIds.has(selectedNode.id)) return '';
    if (selectedNode.level === 1) return '';
    return selectedNode.id;
  }, [selectedNode, scenarioCaseBranchIds]);

  const loadMinder = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const data = await testPlanManagementService.getTestPlanMinder(planId);
      const hasData =
        Array.isArray(data) ? data.length > 0 : data != null && (typeof data !== 'object' || Object.keys(data).length > 0);
      setMinderData(hasData ? data : null);
    } catch {
      setMinderData(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  /** 当前选中所属分类（根默认按功能用例）；用于新增测试点 */
  const currentCategory = useMemo((): 'FUNCTIONAL' | 'API' | 'SCENARIO' | null => {
    if (!selectedId || !selectedNode) return null;
    if (selectedId === rootId) return 'FUNCTIONAL';
    if (functionalCaseBranchIds.has(selectedId)) return 'FUNCTIONAL';
    if (apiCaseBranchIds.has(selectedId)) return 'API';
    if (scenarioCaseBranchIds.has(selectedId)) return 'SCENARIO';
    return null;
  }, [selectedId, selectedNode, rootId, functionalCaseBranchIds, apiCaseBranchIds, scenarioCaseBranchIds]);

  const hasApiBranch = apiCaseBranchIds.size > 0;
  const hasScenarioBranch = scenarioCaseBranchIds.size > 0;
  const hasFunctionalBranch = functionalCaseBranchIds.size > 0;
  /** 任一分类存在且可编辑，且当前选中在根或该分类下（level 1/2）时显示「新增测试点」 */
  const canAddTestPoint =
    canEdit &&
    (hasFunctionalBranch || hasApiBranch || hasScenarioBranch) &&
    Boolean(selectedId && selectedNode && currentCategory && (selectedId === rootId || selectedNode.level === 1 || selectedNode.level === 2));

  /** 打开新增测试点弹窗
   * @param afterNodeId 传入已有测试点 id 时，新增节点插入到其后；否则插入到当前分类下首位
   */
  const openAddDialog = useCallback((afterNodeId?: string) => {
    setInsertAfterNodeId(afterNodeId ?? null);
    setAddDialogOpen(true);
  }, []);

  const handleAddTestPoint = useCallback(
    async (name: string, executeMethod: 'SERIAL' | 'PARALLEL') => {
      if (!planId || !currentCategory) return;
      setAddPointLoading(true);
      try {
        await testPlanManagementService.addPlanCollectionTestPoint(
          planId,
          currentCategory,
          insertAfterNodeId ?? undefined,
          { name, executeMethod }
        );
        const msg = currentCategory === 'FUNCTIONAL' ? '已新增功能点' : currentCategory === 'API' ? '已新增接口测试点' : '已新增场景测试点';
        toast.success(msg);
        setAddDialogOpen(false);
        await loadMinder();
        // 仅刷新模块树，不触发整页/详情刷新
      } catch (e: any) {
        toast.error(e?.message ?? '新增测试点失败');
      } finally {
        setAddPointLoading(false);
      }
    },
    [planId, currentCategory, insertAfterNodeId, loadMinder]
  );

  useEffect(() => {
    loadMinder();
  }, [loadMinder]);

  useEffect(() => {
    if (treeData.length > 0) {
      const root = treeData[0];
      const ids = new Set<string>();
      if (root.id) ids.add(root.id);
      (root.children ?? []).forEach((c) => {
        if (c.id) ids.add(c.id);
      });
      setExpandedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      if (!selectedId && root.id) setSelectedId(root.id);
    }
  }, [treeData]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  /** 与测试工厂 API 接口结构树一致的树节点渲染；key 使用稳定唯一值，避免空 id 导致重复 key */
  const renderNode = (node: PlanMinderTreeNode, depth: number, index: number, parentKey: string): JSX.Element => {
    const rawId = node.id != null ? String(node.id).trim() : '';
    const nodeId = rawId || `_plan-${parentKey}-${index}`;
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const expanded = expandedIds.has(rawId) || (rawId === '' && expandedIds.has(nodeId));
    const isCategory = node.level === 1;
    const isRoot = node.level === 0;
    let displayName = isCategory ? (CATEGORY_LABEL[node.type ?? ''] ?? node.name) : node.name;
    if (displayName === '场景用例') displayName = '自动化用例';
    else if (displayName === '场景') displayName = '自动化';
    const count = node.caseCount != null ? node.caseCount : (node.num != null ? node.num : (hasChildren ? children.length : undefined));
    const isSelected = selectedId === rawId || (rawId === '' && selectedId === nodeId);
    const isInAnyBranch =
      rawId &&
      (functionalCaseBranchIds.has(rawId) || apiCaseBranchIds.has(rawId) || scenarioCaseBranchIds.has(rawId));
    const canInlineAdd = canAddTestPoint && isInAnyBranch && node.level === 2;
    const isHovered = hoveredNodeId === nodeId;

    // 根节点：不渲染自身，仅渲染子节点
    if (isRoot) {
      return (
        <div key={nodeId}>
          {children.map((child, i) => renderNode(child, 0, i, nodeId))}
        </div>
      );
    }

    return (
      <div key={nodeId}>
        <div
          onMouseEnter={() => setHoveredNodeId(nodeId)}
          onMouseLeave={() => setHoveredNodeId(null)}
          onClick={() => {
            setSelectedId(rawId || nodeId);
            if (hasChildren) toggleExpand(rawId || nodeId);
          }}
          className={[
            'group w-full flex items-center gap-1.5 cursor-pointer select-none transition-colors rounded-md',
            isCategory
              ? `mx-1 px-2 py-1.5 mt-1 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`
              : `mx-1 px-2 py-1 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`,
          ].join(' ')}
          style={!isCategory && depth > 0 ? { paddingLeft: 8 + depth * 14 } : undefined}
          title={node.name}
        >
          {/* 分类节点：彩色左侧竖条 */}
          {isCategory && (
            <span className={`w-0.5 h-3.5 rounded-full shrink-0 ${functionalCaseBranchIds.has(rawId) ? 'bg-blue-500' :
                apiCaseBranchIds.has(rawId) ? 'bg-emerald-500' :
                  scenarioCaseBranchIds.has(rawId) ? 'bg-violet-500' : 'bg-gray-300'
              }`} />
          )}
          {/* 展开/收起箭头 */}
          <div className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
            {hasChildren ? (
              expanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )
            ) : (
              <span className="w-1 h-1 rounded-full bg-gray-200 mx-auto" />
            )}
          </div>
          {/* 名称 */}
          <span className={[
            'flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap',
            isCategory
              ? `text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`
              : `text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`,
          ].join(' ')}>
            {displayName}
          </span>
          {/* 用例数 badge */}
          {count != null && (
            <span className={`flex-shrink-0 text-sm tabular-nums px-1.5 py-0.5 rounded-full ${isSelected
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-400'
              }`}>
              {count}
            </span>
          )}
          {/* 节点内联「+」按钮：可编辑的测试点（level=2）悬浮时显示 */}
          {canInlineAdd && (
            <button
              type="button"
              title="在此后新增测试点"
              className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              onClick={(e) => {
                e.stopPropagation();
                openAddDialog(rawId);
              }}
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
        {hasChildren && expanded && (
          <div className="mt-0.5 space-y-0">
            {children.map((child, i) => renderNode(child, depth + 1, i, nodeId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 新增功能点弹窗 */}
      <AddTestPointDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        loading={addPointLoading}
        categoryLabel={currentCategory ? CATEGORY_DISPLAY_NAMES[currentCategory] : '功能用例'}
        onConfirm={handleAddTestPoint}
      />

      <div className="flex flex-col h-full min-h-[600px]">
        {showTip && (
          <Alert className="mb-3 border-blue-100 bg-blue-50/40">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="flex items-center justify-between text-sm text-gray-500">
              <span>点击左侧节点查看用例；测试点（level 2）悬浮显示 + 可在其后插入新测试点。</span>
              <X className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 shrink-0 ml-3" onClick={() => setShowTip(false)} />
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 flex gap-0 min-h-[560px] min-w-0 overflow-hidden">
          {/* 左侧结构树（与测试工厂 API 接口树一致） */}
          <div className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col relative">
            {/* 左侧树标题栏：精简一行，+ 按钮改为 tooltip icon */}
            <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <span className="flex-1 text-base font-semibold text-gray-700 pl-1">测试规划</span>
              {totalCaseCount != null && (
                <span className="text-sm text-gray-400 tabular-nums">{totalCaseCount} 个用例</span>
              )}
              {/* 新增测试点：精简 icon 按钮，tooltip 说明在哪个分类下新增 */}
              {canAddTestPoint && currentCategory && (
                <button
                  type="button"
                  onClick={() => openAddDialog()}
                  title={`在「${CATEGORY_DISPLAY_NAMES[currentCategory]}」下新增测试点`}
                  className="shrink-0 w-6 h-6 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {treeData.length > 0 ? (
              <div className="flex-1 overflow-y-auto py-2">
                {treeData.map((root, i) => renderNode(root, 0, i, 'root'))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center text-gray-400 text-base">暂无规划数据</div>
              </div>
            )}
          </div>
          {/* 右侧：按选中的分支显示对应列表（功能用例 / 接口用例 / 自动化用例） */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
            {showRightContent ? (
              isApiCaseBranch ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <PlanDetailApiCase
                    planId={planId}
                    projectId={projectId}
                    canEdit={canEdit}
                    embedInPlanTree
                    defaultModuleId={apiCaseModuleId || undefined}
                  />
                </div>
              ) : isScenarioCaseBranch ? (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <PlanDetailScenarioCase
                    planId={planId}
                    projectId={projectId}
                    canEdit={canEdit}
                    onRefresh={onRefresh}
                    embedInPlanTree
                    defaultModuleId={scenarioCaseModuleId || undefined}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <PlanDetailFeatureCase
                    planId={planId}
                    projectId={projectId}
                    canEdit={canEdit}
                    onRefresh={onRefresh}
                    embedInPlanTree
                    defaultCollectionId={featureCaseCollectionId || undefined}
                    onRefreshPlanTree={loadMinder}
                  />
                </div>
              )
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100 text-base font-medium text-gray-700">
                  {selectedNode ? `「${selectedNode.name}」 下属` : '概览'}
                </div>
                <div className="flex-1 overflow-auto">
                  {treeData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[40%] text-sm font-medium text-gray-600">名称</TableHead>
                          <TableHead className="w-[100px] text-sm font-medium text-gray-600">类型</TableHead>
                          <TableHead className="w-[80px] text-sm font-medium text-gray-600">用例数</TableHead>
                          <TableHead className="w-[80px] text-sm font-medium text-gray-600">执行方式</TableHead>
                          <TableHead className="text-sm font-medium text-gray-600">备注/资源</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-400 text-base py-8">
                              当前节点下暂无子项
                            </TableCell>
                          </TableRow>
                        ) : (
                          tableRows.map((row, rowIndex) => {
                            const typeLabel =
                              row.level === 1
                                ? CATEGORY_LABEL[row.type ?? ''] ?? '分类'
                                : row.level === 2
                                  ? '测试点'
                                  : Array.isArray(row.resource) && row.resource[0]
                                    ? row.resource[0]
                                    : '-';
                            const execLabel = row.priority === 3 ? '并行' : row.priority === 2 ? '串行' : '-';
                            let name = row.level === 1 ? (CATEGORY_LABEL[row.type ?? ''] ?? row.name) : row.name;
                            if (name === '场景用例') name = '自动化用例';
                            else if (name === '场景') name = '自动化';
                            const rowKey = (row.id != null && String(row.id).trim()) ? row.id : `plan-row-${rowIndex}`;
                            return (
                              <TableRow key={rowKey} className="hover:bg-gray-50/80">
                                <TableCell className="font-medium text-gray-900 text-sm">{name}</TableCell>
                                <TableCell className="text-gray-600 text-sm">{typeLabel}</TableCell>
                                <TableCell className="text-gray-600 text-sm">{row.num ?? '-'}</TableCell>
                                <TableCell className="text-gray-600 text-sm">{execLabel}</TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                  {Array.isArray(row.resource) && row.resource.length > 1
                                    ? row.resource.slice(1).join(' / ')
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-base">
                      在功能用例、接口用例、自动化用例等 tab 中关联用例后将生成规划结构
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
