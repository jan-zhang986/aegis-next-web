/**
 * 功能用例思维导图
 * 使用 React Flow 实现图形化思维导图：从左到右树形布局、弯曲连线
 * 逻辑参考 aegis-next-web featureCaseMinder
 *
 * 已支持：
 * - 模块树 + 用例树展示
 * - 「全部用例」根节点包裹多模块
 * - 每层超过 50 个模块时显示「更多模块...」点击加载下一批（与 aegis 一致）
 * - 用例分页：每页 100 条，超出显示「更多用例...」点击加载下一页
 * - 用例展开后显示前置条件、步骤描述、预期结果、文本描述、备注（MINDER_CONTENT_TAGS）
 * - 用例等级（P0-P3）展示
 * - 点击用例打开详情
 * - moduleId 指定时自动展开到对应模块
 * - 全部展开/收起、保存
 * - 键盘快捷键（M/C/Shift+M/Shift+C/Tab/Enter/Delete 等）
 * - 悬浮菜单（插入节点/设置优先级/更多操作）
 * - 详情侧边栏（基本信息/附件/评论/缺陷）
 * - 节点操作（新增/删除/复制/剪切/粘贴）
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, Plus, Minus, Network, Expand, CircleMinus, Save, Keyboard, Maximize, Minimize2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Position,
  Handle,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import { caseManagementService } from '@/services';
import { getLayoutedElements } from './utils/mindMapLayoutUtils';
import { MindMapModuleNode, MindMapCaseNode, MindMapContentNode, MindMapMoreNode } from './components/MindMapSharedNodes';
import { getCaseLevel, generateId, resolvePriorityFieldId } from './utils';
import { RichTextContent } from './components/RichTextContent';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinderFloatMenu } from './components/MinderFloatMenu';
import { MinderDetailSidebar } from './components/MinderDetailSidebar';
import {
  useMinderOperations,
  MINDER_TAGS,
  type MinderTreeNode as MinderOpsTreeNode,
} from './hooks/useMinderOperations';
import { useMinderShortcuts } from './hooks/useMinderShortcuts';
import {
  CASE_LEVEL_MAP,
  MINDER_CONTENT_TAGS,
  MINDER_MODULE_LIMIT,
  MINDER_CASE_PAGE_SIZE,
  MINDER_MORE_MODULE_TEXT,
  MINDER_MORE_CASE_TEXT,
} from './constants';

export interface MinderTreeNode {
  id: string;
  name: string;
  text?: string;
  type?: string;
  count?: number;
  children?: MinderTreeNode[];
  isModule?: boolean;
  isCase?: boolean;
  /** 新建节点（未保存到后端的用例/模块） */
  isNew?: boolean;
  isContent?: boolean;
  resourceType?: string;
  isLoaded?: boolean;
  /** 更多模块占位节点（与 aegis tmpModule 一致） */
  isMoreModule?: boolean;
  /** 更多用例占位节点（与 aegis tmp 一致） */
  isMoreCase?: boolean;
  /** 更多用例时的当前页码 */
  currentPage?: number;
  data?: { [key: string]: any; id?: string; text?: string; resource?: string[]; priority?: string | number };
}

interface FeatureCaseMinderViewProps {
  projectId: string;
  spaceId?: string;
  moduleId?: string;
  modulesCount: Record<string, number>;
  onViewCase?: (caseId: string) => void;
  onSave?: () => void;
}

// 节点数据
export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  count?: number;
  isModule: boolean;
  isCase: boolean;
  isContent: boolean;
  isMoreModule?: boolean;
  isMoreCase?: boolean;
  resourceType?: string;
  expanded: boolean;
  hasChildren: boolean;
  rawNode: MinderTreeNode;
  isLoading?: boolean;
}

// 从 getCaseMinder 返回的用例项递归映射为 MinderTreeNode（含前置/步骤/预期结果等子节点）
function mapCaseItemFromApi(item: any): MinderTreeNode {
  const d = item?.data ?? item;
  // 优先从 item.id 提取（getCaseMinder 返回的数据结构），其次从 data.caseId 或 data.id
  const id = item?.id ?? d?.caseId ?? d?.id ?? '';
  const name = d?.text ?? d?.name ?? item?.name ?? item?.text ?? '';
  let children = item?.children ?? d?.children ?? [];
  const filteredChildren = (Array.isArray(children) ? children : []).filter(
    (c: any) => c?.data?.type !== 'tmp' && c?.data?.id !== 'tmp'
  );
  // 若 API 返回嵌套 children，直接映射；否则从平铺字段构建（prerequisite/steps/textDescription/expectedResult）
  const caseIdStr = String(id || '').trim() || `case_${generateId()}`;
  let mappedChildren = filteredChildren.map((c: any, i: number) =>
    mapContentNodeFromApi(c, caseIdStr, String(i))
  );
  if (mappedChildren.length === 0 && (d?.prerequisite || d?.steps || d?.textDescription || d?.expectedResult)) {
    mappedChildren = buildContentChildrenFromFlat(d);
  }
  return {
    id,
    name,
    text: name,
    isCase: true,
    isLoaded: true,
    data: d,
    children: mappedChildren.length > 0 ? mappedChildren : undefined,
  };
}

// 从平铺的 prerequisite/steps/textDescription/expectedResult 构建内容子节点（API 未返回嵌套 children 时的回退）
function buildContentChildrenFromFlat(d: any): MinderTreeNode[] {
  const nodes: MinderTreeNode[] = [];
  const tags = MINDER_CONTENT_TAGS;
  const baseId = d?.caseId ?? d?.id ?? '';
  if (d?.prerequisite) {
    nodes.push({
      id: `${baseId}-pre`,
      name: String(d.prerequisite),
      isContent: true,
      resourceType: tags.precondition,
      data: { resource: [tags.precondition], text: d.prerequisite },
    });
  }
  // 文本模式（caseEditType === 'TEXT'）时用 textDescription/expectedResult 构建子节点，否则用 steps
  const isTextMode = d?.caseEditType === 'TEXT';
  if (isTextMode && d?.textDescription) {
    nodes.push({
      id: `${baseId}-text`,
      name: String(d.textDescription),
      isContent: true,
      resourceType: tags.textDesc,
      data: { resource: [tags.textDesc], text: d.textDescription },
      children: d?.expectedResult ? [{
        id: `${baseId}-text-exp`,
        name: String(d.expectedResult),
        isContent: true,
        resourceType: tags.stepExpect,
        data: { resource: [tags.stepExpect], text: d.expectedResult },
      }] : undefined,
    });
  } else {
    const steps = typeof d?.steps === 'string'
      ? (() => { try { return JSON.parse(d.steps) || []; } catch { return []; } })()
      : (Array.isArray(d?.steps) ? d.steps : []);
    if (steps.length > 0) {
      steps.forEach((s: any, i: number) => {
        const desc = s?.desc ?? s?.text ?? '';
        const result = s?.result ?? s?.expectedResult ?? '';
        if (desc || result) {
          nodes.push({
            id: `${baseId}-step-${i}`,
            name: desc || '-',
            isContent: true,
            resourceType: tags.stepDesc,
            data: { resource: [tags.stepDesc], text: desc },
            children: result ? [{
              id: `${baseId}-step-${i}-exp`,
              name: String(result),
              isContent: true,
              resourceType: tags.stepExpect,
              data: { resource: [tags.stepExpect], text: result },
            }] : undefined,
          });
        }
      });
    } else if (d?.textDescription) {
      nodes.push({
        id: `${baseId}-text`,
        name: String(d.textDescription),
        isContent: true,
        resourceType: tags.textDesc,
        data: { resource: [tags.textDesc], text: d.textDescription },
        children: d?.expectedResult ? [{
          id: `${baseId}-text-exp`,
          name: String(d.expectedResult),
          isContent: true,
          resourceType: tags.stepExpect,
          data: { resource: [tags.stepExpect], text: d.expectedResult },
        }] : undefined,
      });
    }
  }
  if (d?.description) {
    nodes.push({
      id: `${baseId}-remark`,
      name: String(d.description),
      isContent: true,
      resourceType: tags.remark,
      data: { resource: [tags.remark], text: d.description },
    });
  }
  return nodes;
}

// 映射内容节点（前置条件/步骤描述/预期结果/文本描述/备注）
// caseId + pathKey 保证 React Flow 节点 id 全局唯一；后端若按内容/相似度复用 id，不再跨用例冲突
function mapContentNodeFromApi(item: any, caseId: string, pathKey: string): MinderTreeNode {
  const d = item?.data ?? item;
  const id = `${caseId}_m_${pathKey}`;
  const name = d?.text ?? item?.text ?? '';
  const resource = d?.resource ?? item?.resource ?? [];
  const children = item?.children ?? d?.children ?? [];
  const filteredChildren = (Array.isArray(children) ? children : []).filter(
    (c: any) => c?.data?.type !== 'tmp' && c?.data?.id !== 'tmp'
  );
  const mappedChildren = filteredChildren.map((c: any, i: number) =>
    mapContentNodeFromApi(c, caseId, `${pathKey}_${i}`)
  );
  return {
    id,
    name,
    text: name,
    isContent: true,
    resourceType: Array.isArray(resource) ? resource[0] : undefined,
    data: d,
    children: mappedChildren.length > 0 ? mappedChildren : undefined,
  };
}

// 将树形数据转为 React Flow 的 nodes 和 edges（仅展开的节点）
function treeToFlowData(
  treeData: MinderTreeNode[],
  expandedIds: Set<string>,
  loadingNodeId?: string | null
): { nodes: Node<MindMapNodeData>[]; edges: Edge[] } {
  const nodes: Node<MindMapNodeData>[] = [];
  const edges: Edge[] = [];
  let fallbackIdCounter = 0;

  const traverse = (nodesList: MinderTreeNode[], parentId?: string): void => {
    for (const node of nodesList) {
      const rawId = node.id;
      const nodeId = rawId && String(rawId).trim() ? String(rawId) : `_fallback-${++fallbackIdCounter}`;
      const expanded = expandedIds.has(String(rawId ?? nodeId));
      const children = node.children ?? [];
      const hasChildren = children.length > 0 || (node.count && node.count > 0 && !node.isLoaded);
      const isLoading = loadingNodeId != null && (String(loadingNodeId) === String(rawId) || String(loadingNodeId) === nodeId);

      const displayName = node.name || node.text || node.data?.text || '-';
      const nodeType = node.isMoreModule || node.isMoreCase
        ? 'mindMapMore'
        : node.isCase
          ? 'mindMapCase'
          : node.isContent
            ? 'mindMapContent'
            : 'mindMapModule';
      nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: 0, y: 0 },
        data: {
          label: displayName,
          count: node.count,
          isModule: node.isModule !== false && !node.isCase && !node.isContent && !node.isMoreModule && !node.isMoreCase,
          isCase: !!node.isCase,
          isContent: !!node.isContent,
          isMoreModule: !!node.isMoreModule,
          isMoreCase: !!node.isMoreCase,
          resourceType: node.resourceType,
          expanded: !!(expanded && hasChildren),
          hasChildren: !!hasChildren,
          rawNode: node,
          isLoading,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      if (parentId) {
        edges.push({ id: `${parentId}-${nodeId}`, source: parentId, target: nodeId, type: 'default' });
      }

      if (expanded && children.length > 0) {
        traverse(children, nodeId);
      }
    }
  };

  traverse(treeData);
  return { nodes, edges };
}

// 将路径上的所有祖先节点 id 加入 expandedIds，便于展开到目标模块（统一字符串保证与 expandedIds 一致）
function expandPathToNode(nodes: MinderTreeNode[], targetId: string, out: Set<string>): boolean {
  const targetStr = String(targetId);
  for (const n of nodes) {
    if (String(n.id) === targetStr) {
      out.add(String(n.id));
      return true;
    }
    if (n.children && expandPathToNode(n.children, targetId, out)) {
      out.add(String(n.id));
      return true;
    }
  }
  return false;
}

// 在树中查找指定 id 的节点（统一字符串比较，兼容接口返回 number）
function findNodeInTree(nodes: MinderTreeNode[], id: string): MinderTreeNode | null {
  const idStr = String(id);
  for (const n of nodes) {
    if (String(n.id) === idStr) return n;
    if (n.children) {
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 将树中某节点的 id 替换为真实 id（插入模块后后端返回），并清除 isNew
function replaceNodeIdInTree(nodes: MinderTreeNode[], oldId: string, newId: string): MinderTreeNode[] {
  return nodes.map((n) => {
    if (n.id === oldId) {
      return {
        ...n,
        id: newId,
        isNew: false,
        changed: false,
        data: { ...n.data, id: newId, isNew: false, changed: false },
      };
    }
    if (n.children?.length) {
      return { ...n, children: replaceNodeIdInTree(n.children, oldId, newId) };
    }
    return n;
  });
}

// 递归收集树中所有节点 id（用于「全部展开」）
function collectAllIdsInTree(nodes: MinderTreeNode[]): Set<string> {
  const ids = new Set<string>();
  function walk(list: MinderTreeNode[]) {
    for (const n of list) {
      if (!n.isMoreModule && !n.isMoreCase) ids.add(String(n.id));
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return ids;
}

export function FeatureCaseMinderView({
  projectId,
  spaceId,
  moduleId = 'all',
  modulesCount,
  onViewCase,
  onSave,
}: FeatureCaseMinderViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [treeData, setTreeData] = useState<MinderTreeNode[]>([]);
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  /** 存储每层超过 50 个的剩余模块（与 aegis largeModulesMap 一致） */
  const largeModulesMapRef = useRef<Record<string, MinderTreeNode[]>>({});

  // ========== 新增：交互状态 ==========
  const [selectedNode, setSelectedNode] = useState<MinderTreeNode | null>(null);
  const [floatMenuPosition, setFloatMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [caseDetail, setCaseDetail] = useState<any>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  /** 编辑模块名称：双击模块或 F2 时打开 */
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleName, setEditingModuleName] = useState('');
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 稳定 nodeTypes 引用，避免 React Flow 报错导致长时间停留后展开失效
  const nodeTypes = useMemo(
    () => ({
      mindMapModule: MindMapModuleNode,
      mindMapCase: MindMapCaseNode,
      mindMapContent: MindMapContentNode,
      mindMapMore: MindMapMoreNode,
    }),
    []
  );

  // ========== 节点操作 Hook ==========
  const minderOps = useMinderOperations({ hasEditPermission: true });
  const {
    insertSiblingMenus,
    insertSonMenus,
    checkNodeCanShowMenu,
    insertChildNode,
    insertSiblingNode,
    deleteNode,
    updateNodeText,
    updateNodePriority,
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    clipboardRef,
    canShowFloatMenu,
    canShowPriorityMenu,
    canShowMoreMenu,
    getUpdateParams,
    resetUpdateParams,
    MINDER_TAGS: tags,
  } = minderOps;

  // ========== 快捷键处理函数 ==========
  const findParentNode = useCallback((nodeId: string): MinderTreeNode | null => {
    const findInTree = (nodes: MinderTreeNode[], parent: MinderTreeNode | null): MinderTreeNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return parent;
        if (node.children) {
          const found = findInTree(node.children, node);
          if (found !== null) return found;
        }
      }
      return null;
    };
    return findInTree(treeData, null);
  }, [treeData]);

  /** 从当前节点向上查找最近的模块 ID，用于新建用例的 moduleId */
  const findNearestModuleId = useCallback((nodeId: string): string => {
    let current: MinderTreeNode | null = findParentNode(nodeId);
    while (current) {
      if (current.isModule && current.id && current.id !== 'NONE') return current.id;
      current = findParentNode(current.id);
    }
    return 'NONE';
  }, [findParentNode]);

  const handleAddSiblingModule = useCallback(async () => {
    if (!selectedNode || selectedNode.id === 'NONE') return;
    const parent = findParentNode(selectedNode.id);
    const canAdd = selectedNode.isModule || parent?.isModule;
    if (!canAdd) return;
    const parentId = parent?.id ?? 'NONE';
    // 先基于当前树算出新树和新节点，保证 tempId 在调用接口前已有值（避免 setState 异步导致 tempId 为空）
    const { newTree, newNode } = insertSiblingNode(treeData, selectedNode.id, tags.module);
    if (!newNode) return;
    const tempId = newNode.id;
    setTreeData(newTree);
    try {
      const res: any = await caseManagementService.createCaseModuleTree({
        projectId,
        name: '新建模块',
        parentId: parentId === 'NONE' ? 'NONE' : parentId,
      });
      const realId = typeof res === 'string' ? res : (res?.id ?? res?.data?.id);
      if (realId) {
        setTreeData((prev) => replaceNodeIdInTree(prev, tempId, realId));
      }
      toast.success('已添加同级模块');
    } catch (err: any) {
      toast.error(err?.message || '添加模块失败');
      setTreeData((prev) => deleteNode(prev, tempId));
    }
  }, [selectedNode, findParentNode, insertSiblingNode, deleteNode, tags, projectId, treeData]);

  const handleAddSiblingCase = useCallback(() => {
    if (!selectedNode || selectedNode.id === 'NONE') return;
    const parent = findParentNode(selectedNode.id);
    if (parent?.isModule && parent.id !== 'NONE') {
      setTreeData(prev => {
        const { newTree, newNode } = insertSiblingNode(prev, selectedNode.id, tags.case);
        if (newNode?.isCase) {
          queueMicrotask(() => {
            setSelectedNode(newNode as MinderTreeNode);
            setShowDetailSidebar(true);
          });
        }
        return newTree;
      });
      toast.success('已添加同级用例');
    }
  }, [selectedNode, findParentNode, insertSiblingNode, tags]);

  const handleAddChildModule = useCallback(async () => {
    if (!selectedNode || selectedNode.id === 'root') return;
    const canAdd = selectedNode.isModule || selectedNode.id === 'NONE';
    if (!canAdd) return;
    const parentId = selectedNode.id;
    const { newTree, newNode } = insertChildNode(treeData, selectedNode.id, tags.module);
    if (!newNode) return;
    const tempId = newNode.id;
    setTreeData(newTree);
    setExpandedIds((prev) => new Set([...prev, String(selectedNode.id)]));
    try {
      const res: any = await caseManagementService.createCaseModuleTree({
        projectId,
        name: '新建模块',
        parentId: parentId === 'NONE' ? 'NONE' : parentId,
      });
      const realId = typeof res === 'string' ? res : (res?.id ?? res?.data?.id);
      if (realId) {
        setTreeData((prev) => replaceNodeIdInTree(prev, tempId, realId));
      }
      toast.success('已添加子模块');
    } catch (err: any) {
      toast.error(err?.message || '添加模块失败');
      setTreeData((prev) => deleteNode(prev, tempId));
    }
  }, [selectedNode, insertChildNode, deleteNode, tags, projectId, treeData]);

  const handleAddChildCase = useCallback(() => {
    if (!selectedNode || !selectedNode.isModule || selectedNode.id === 'NONE') return;
    setTreeData(prev => {
      const { newTree, newNode } = insertChildNode(prev, selectedNode.id, tags.case);
      if (newNode?.isCase) {
        queueMicrotask(() => {
          setSelectedNode(newNode as MinderTreeNode);
          setShowDetailSidebar(true);
        });
      }
      return newTree;
    });
    setExpandedIds(prev => new Set([...prev, String(selectedNode.id)]));
    toast.success('已添加子用例');
  }, [selectedNode, insertChildNode, tags]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode || selectedNode.id === 'NONE' || selectedNode.id === 'root') return;
    setTreeData(prev => deleteNode(prev, selectedNode.id));
    setSelectedNode(null);
    setFloatMenuPosition(null);
    toast.success('已删除节点');
  }, [selectedNode, deleteNode]);

  const handleCopy = useCallback(() => {
    if (!selectedNode) return;
    copyToClipboard([selectedNode]);
    toast.success('已复制到剪贴板');
  }, [selectedNode, copyToClipboard]);

  const handleCut = useCallback(() => {
    if (!selectedNode || selectedNode.id === 'NONE') return;
    setTreeData(prev => cutToClipboard(prev, [selectedNode]));
    setSelectedNode(null);
    setFloatMenuPosition(null);
    toast.success('已剪切到剪贴板');
  }, [selectedNode, cutToClipboard]);

  const handlePaste = useCallback(() => {
    if (!selectedNode || clipboardRef.current.length === 0) return;
    setTreeData(prev => pasteFromClipboard(prev, selectedNode.id));
    setExpandedIds(prev => new Set([...prev, String(selectedNode.id)]));
    toast.success('已粘贴');
  }, [selectedNode, pasteFromClipboard, clipboardRef]);

  const handleToggleExpand = useCallback(() => {
    if (!selectedNode) return;
    const idStr = String(selectedNode.id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(idStr)) {
        next.delete(idStr);
      } else {
        next.add(idStr);
      }
      return next;
    });
  }, [selectedNode]);

  const handlePriorityChange = useCallback((priority: number) => {
    if (!selectedNode || !selectedNode.isCase) return;
    setTreeData(prev => updateNodePriority(prev, selectedNode.id, priority));
    toast.success(`已设置优先级为 P${priority - 1}`);
  }, [selectedNode, updateNodePriority]);

  // ========== 键盘快捷键 Hook ==========
  useMinderShortcuts({
    enabled: true,
    isEditing,
    selectedNode,
    handlers: {
      onAddSiblingModule: handleAddSiblingModule,
      onAddSiblingCase: handleAddSiblingCase,
      onAddChildModule: handleAddChildModule,
      onAddChildCase: handleAddChildCase,
      onDelete: handleDeleteNode,
      onCopy: handleCopy,
      onCut: handleCut,
      onPaste: handlePaste,
      onToggleExpand: handleToggleExpand,
      onPriorityChange: handlePriorityChange,
      onSave: () => handleSave(),
      onEditText: () => {
        // F2：编辑模块名称（仅模块节点）
        if (selectedNode?.isModule && selectedNode.id && selectedNode.id !== 'root' && selectedNode.id !== 'NONE') {
          setEditingModuleId(selectedNode.id);
          setEditingModuleName(selectedNode.name ?? selectedNode.text ?? '');
        }
      },
      onEscape: () => {
        setSelectedNode(null);
        setFloatMenuPosition(null);
        setShowDetailSidebar(false);
        setEditingModuleId(null);
      },
      onViewDetail: () => {
        if (selectedNode?.isCase) {
          // 已有用例：复用表格的 CaseDetailDrawer，编辑保存逻辑一致
          if (!selectedNode?.isNew && selectedNode?.id && onViewCase) {
            setShowDetailSidebar(false);
            onViewCase(selectedNode.id);
            return;
          }
          // 新建用例：用侧边栏编辑
          setShowDetailSidebar(true);
        }
      },
    },
  });

  // ========== 用例详情加载 ==========
  const loadCaseDetail = useCallback(async (caseId: string) => {
    if (!caseId) {
      console.error('用例ID为空');
      return;
    }
    setCaseDetailLoading(true);
    try {
      const detail = await caseManagementService.getCaseDetail(caseId);
      // 确保返回的数据格式正确
      if (detail && typeof detail === 'object') {
        setCaseDetail(detail);
      } else {
        console.error('用例详情数据格式错误:', detail);
        toast.error('用例详情数据格式错误');
      }
    } catch (err: any) {
      console.error('加载用例详情失败:', err);
      const errorMsg = err?.response?.data?.message || err?.message || '加载用例详情失败';
      toast.error(errorMsg);
      // 发生错误时关闭侧边栏，避免白屏
      setShowDetailSidebar(false);
    } finally {
      setCaseDetailLoading(false);
    }
  }, []);

  const handleSaveCaseDetail = useCallback(async (data: any) => {
    if (!selectedNode?.id) return;
    const isNewCase = selectedNode.isNew;

    if (isNewCase) {
      // 新建用例：调用创建接口，成功后刷新树
      try {
        const stepsPayload = Array.isArray(data.steps)
          ? (data.steps as Array<{ id?: string; desc?: string; result?: string }>)
            .filter((s) => (s.desc ?? '').trim() || (s.result ?? '').trim())
            .map((s, i) => ({
              id: s.id || generateId(),
              num: i,
              desc: (s.desc ?? '').trim(),
              result: (s.result ?? '').trim(),
            }))
          : [];
        const stepsStr = stepsPayload.length ? JSON.stringify(stepsPayload) : '';

        let templateId = '';
        let priorityFieldId: string | null = null;
        try {
          const defaultFields: any = await caseManagementService.getCaseDefaultFields(projectId);
          templateId = defaultFields?.id ?? '';
          priorityFieldId = resolvePriorityFieldId(defaultFields);
        } catch {
          // 使用空 templateId，后端可能使用默认模板
        }

        const priority = data.priority ?? selectedNode.data?.priority ?? 'P0';
        const customFields: Array<{ fieldId: string; value: string }> = [];
        if (priority) customFields.push({ fieldId: priorityFieldId || 'functional_priority', value: String(priority) });

        const request: Record<string, any> = {
          projectId,
          templateId,
          name: (data.name ?? selectedNode.name ?? '新建用例').trim() || '新建用例',
          moduleId: findNearestModuleId(selectedNode.id),
          prerequisite: (data.prerequisite ?? '').trim(),
          caseEditType: data.caseEditType ?? 'STEP',
          steps: stepsStr,
          textDescription: (data.textDescription ?? '').trim(),
          expectedResult: (data.expectedResult ?? '').trim(),
          description: (data.description ?? '').trim(),
          tags: Array.isArray(data.tags) ? data.tags : [],
          customFields,
        };

        const newCaseId = await (spaceId
          ? caseManagementService.saveUnifiedCase({
            projectId,
            spaceId,
            moduleId: request.moduleId,
            title: request.name,
            precondition: request.prerequisite,
            expectedResult: request.expectedResult,
            description: request.description,
            priority: priority === 'P0' ? 1 : priority === 'P1' ? 2 : priority === 'P2' ? 3 : 4,
            sourceType: 'AI',
            tags: request.tags,
            metadata: {
              templateId,
              caseEditType: request.caseEditType,
              aiCreate: true,
              functionalPriority: priority,
            },
            realizations: [
              {
                realizationType: 'MANUAL',
                name: `${request.name} [MANUAL]`,
                workflowDefinition: {
                  caseEditType: request.caseEditType,
                  steps: request.steps,
                  textDescription: request.textDescription,
                  expectedResult: request.expectedResult,
                },
                status: 'ACTIVE',
                enabled: true,
              },
            ],
          })
          : caseManagementService.createCaseRequest({
            request,
            fileList: [],
          }).then((res: any) => res?.id ?? res?.data?.id ?? ''));
        if (newCaseId) {
          toast.success('用例创建成功');
          setShowDetailSidebar(false);
          setCaseDetail(null);
          setSelectedNode(null);
          onSave?.();
        } else {
          toast.error('创建成功但未返回用例 ID');
        }
      } catch (err: any) {
        console.error('创建用例失败:', err);
        const msg = err?.response?.data?.message ?? err?.message ?? '创建失败';
        toast.error(msg);
      }
      return;
    }

    // 已有用例在思维导图侧栏不应走到这里（应走 CaseDetailDrawer），仅做兜底
    try {
      if (data.name && data.name !== selectedNode.name) {
        setTreeData(prev => updateNodeText(prev, selectedNode.id, data.name));
      }
      toast.success('用例详情已保存');
      setShowDetailSidebar(false);
    } catch (err) {
      console.error('保存用例详情失败:', err);
      toast.error('保存失败');
    }
  }, [selectedNode, projectId, findNearestModuleId, updateNodeText, onSave]);

  const mapApiNodeToTree = useCallback(
    (raw: any): MinderTreeNode => {
      // 优先从 raw.id 提取（getCaseMinderTree 返回的数据结构），其次从 data.id
      const id = raw?.id ?? raw?.data?.id ?? '';
      const name = raw?.name ?? raw?.data?.text ?? raw?.text ?? '';
      const children = raw?.children;
      const type = raw?.type ?? raw?.data?.resource?.[0];
      // 用例节点识别：resource 包含 '用例' 或存在 caseId 字段
      const isCaseNode = raw?.data?.resource?.includes?.('用例') || raw?.data?.caseId || raw?.caseId;
      const isModuleNode = type === 'module' || (raw?.data?.resource && raw.data.resource.includes('模块')) || !isCaseNode;
      const count = modulesCount[id] ?? raw?.count ?? raw?.data?.count;
      const filteredChildren = Array.isArray(children)
        ? children.filter((c: any) => c?.data?.id !== 'fakeNode' && c?.data?.type !== 'tmp' && c?.data?.id !== 'tmp')
        : [];
      let mappedChildren = filteredChildren.map((c: any) => mapApiNodeToTree(c));
      // 只对模块节点进行数量限制（超过 MINDER_MODULE_LIMIT 时显示「更多模块」），用例节点不限制
      const moduleChildren = mappedChildren.filter((c) => c.isModule && !c.isCase);
      const caseChildren = mappedChildren.filter((c) => c.isCase);
      if (moduleChildren.length > MINDER_MODULE_LIMIT) {
        largeModulesMapRef.current[id] = moduleChildren.slice(MINDER_MODULE_LIMIT);
        const showingModules = moduleChildren.slice(0, MINDER_MODULE_LIMIT);
        showingModules.push({
          id: `tmp-${id}`,
          name: MINDER_MORE_MODULE_TEXT,
          isMoreModule: true,
          type: 'tmpModule',
        });
        // 合并：先显示模块（含「更多模块」占位），再显示用例
        mappedChildren = [...showingModules, ...caseChildren];
      }
      return {
        id,
        name,
        text: name,
        type,
        count,
        isModule: isModuleNode,
        isCase: isCaseNode,
        children: mappedChildren.length > 0 ? mappedChildren : undefined,
      };
    },
    [modulesCount]
  );

  const fetchModuleTree = useCallback(async () => {
    setLoading(true);
    try {
      // 参考 spotter：始终加载全部（moduleId: ''），再按需进入具体模块
      const res: any = await caseManagementService.getCaseMinderTree({
        projectId,
        moduleId: '',
      });
      const list = Array.isArray(res) ? res : res?.list ?? res?.data ?? [];
      const mapped = list.map(mapApiNodeToTree);

      let displayTree: MinderTreeNode[];

      // 如果指定了具体模块ID，以该模块作为根节点
      if (moduleId && moduleId !== 'all') {
        // 先构建完整树结构以便查找
        const fullTree: MinderTreeNode[] = [
          {
            id: 'NONE',
            name: '全部用例',
            text: '全部用例',
            isModule: true,
            count: mapped.reduce((sum, n) => sum + (n.count ?? 0), 0),
            children: mapped,
          },
        ];

        // 查找指定的模块节点
        const targetNode = findNodeInTree(fullTree, moduleId);

        if (targetNode) {
          displayTree = [targetNode];
        } else {
          displayTree = fullTree;
        }
      } else {
        // 未指定模块或 moduleId 为 'all'，显示「全部用例」根节点
        displayTree = [
          {
            id: 'NONE',
            name: '全部用例',
            text: '全部用例',
            isModule: true,
            count: mapped.reduce((sum, n) => sum + (n.count ?? 0), 0),
            children: mapped,
          },
        ];
      }

      setTreeData(displayTree);
      // 默认全部收起：不预填 expandedIds；点击节点再展开
    } catch (err) {
      console.error('获取脑图模块树失败:', err);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, moduleId, mapApiNodeToTree]);

  const loadModuleCases = useCallback(
    async (node: MinderTreeNode, page = 1) => {
      const moduleId = node.id;
      if (!moduleId) return;
      const moduleIdStr = String(moduleId);
      if (page === 1 && loadedModules.has(moduleIdStr)) return;
      setLoadingNodeId(moduleId);
      try {
        const res: any = await caseManagementService.getCaseMinder({
          projectId,
          moduleId,
          current: page,
        });
        const list = res?.list ?? res?.data ?? [];
        const total = res?.total ?? list?.length ?? 0;
        const caseNodes: MinderTreeNode[] = (list || []).map((item: any) => mapCaseItemFromApi(item));
        // 调试：确保所有用例都被正确映射
        if (import.meta.env.DEV && caseNodes.length !== list.length) {
          console.warn('[FeatureCaseMinderView] 用例映射数量不匹配:', {
            listLength: list.length,
            caseNodesLength: caseNodes.length,
            moduleId,
          });
        }
        const mergeCasesIntoNode = (
          nodes: MinderTreeNode[],
          targetId: string,
          cases: MinderTreeNode[],
          append: boolean,
          addMoreCase: boolean,
          moreCasePage: number
        ): MinderTreeNode[] =>
          nodes.map((n) => {
            if (String(n.id) === String(targetId)) {
              // 保留现有的子模块节点和用例节点，追加新加载的用例节点
              // 根节点（NONE）和普通模块都可能同时有子模块和用例，且用例和模块可能是同级
              const existing = n.children || [];
              // 分离现有子节点：模块节点、用例节点、占位节点
              const existingModules = existing.filter((c) => c.isModule && !c.isCase && !c.isMoreCase && !c.isMoreModule);
              // 无论是否 append，都要保留现有的用例节点（它们可能是 getCaseMinderTree 返回的，与模块同级）
              const existingCases = existing.filter((c) => c.isCase && !c.isMoreCase);
              // 如果 append，保留「更多用例」占位；否则移除（会被新的替换）
              const existingMoreCase = append ? existing.filter((c) => c.isMoreCase) : [];
              // 去重：新加载的用例中，如果 id 已存在于现有用例中，则跳过（避免重复）
              const existingCaseIds = new Set(existingCases.map((c) => c.id).filter(Boolean));
              const newCases = cases.filter((c) => {
                const caseId = c.id;
                if (!caseId) {
                  console.warn('[FeatureCaseMinderView] 用例缺少 id:', c);
                  return true; // 没有 id 的用例也保留，避免丢失
                }
                return !existingCaseIds.has(caseId);
              });
              // 调试：检查去重结果
              if (import.meta.env.DEV && cases.length > 0) {
                const filteredCount = cases.length - newCases.length;
                if (filteredCount > 0) {
                  console.log('[FeatureCaseMinderView] 用例去重:', {
                    moduleId: targetId,
                    totalCases: cases.length,
                    newCases: newCases.length,
                    filteredCount,
                    existingCaseIds: Array.from(existingCaseIds),
                  });
                }
              }
              // 合并：先显示子模块，再显示用例（现有用例 + 新加载用例，去重后）
              const merged = [...existingModules, ...existingCases, ...newCases, ...existingMoreCase];
              if (addMoreCase) {
                merged.push({
                  id: `tmp-${targetId}`,
                  name: MINDER_MORE_CASE_TEXT,
                  isMoreCase: true,
                  currentPage: moreCasePage,
                  type: 'tmp',
                });
              }
              return { ...n, children: merged, isLoaded: true };
            }
            if (n.children)
              return {
                ...n,
                children: mergeCasesIntoNode(n.children, targetId, cases, append, addMoreCase, moreCasePage),
              };
            return n;
          });
        const append = page > 1;
        const addMoreCase = total > MINDER_CASE_PAGE_SIZE * page;
        setTreeData((prev) =>
          mergeCasesIntoNode(prev, moduleIdStr, caseNodes, append, addMoreCase, page)
        );
        if (page === 1) setLoadedModules((s) => new Set(s).add(moduleIdStr));
      } catch (err) {
        console.error('加载模块用例失败:', err);
      } finally {
        setLoadingNodeId(null);
      }
    },
    [projectId, loadedModules]
  );

  const loadMoreModules = useCallback(
    (parentId: string) => {
      const remaining = largeModulesMapRef.current[parentId];
      if (!remaining || remaining.length === 0) return;
      const batch = remaining.slice(0, MINDER_MODULE_LIMIT);
      largeModulesMapRef.current[parentId] = remaining.slice(MINDER_MODULE_LIMIT);
      const mappedBatch = batch.map((raw: any) => mapApiNodeToTree(raw));
      const moreNode: MinderTreeNode = {
        id: `tmp-${parentId}`,
        name: MINDER_MORE_MODULE_TEXT,
        isMoreModule: true,
        type: 'tmpModule',
      };
      const mergeMoreModulesIntoNode = (
        nodes: MinderTreeNode[],
        targetId: string,
        newModules: MinderTreeNode[],
        addMore: boolean
      ): MinderTreeNode[] =>
        nodes.map((n) => {
          if (String(n.id) === String(targetId)) {
            const withoutMore = (n.children || []).filter((c) => !c.isMoreModule);
            const merged = [...withoutMore, ...newModules];
            if (addMore) merged.push(moreNode);
            return { ...n, children: merged };
          }
          if (n.children)
            return { ...n, children: mergeMoreModulesIntoNode(n.children, targetId, newModules, addMore) };
          return n;
        });
      const addMore = remaining.length > 0;
      setTreeData((prev) => mergeMoreModulesIntoNode(prev, parentId, mappedBatch, addMore));
    },
    [mapApiNodeToTree]
  );

  const toggleExpand = useCallback(
    (node: MinderTreeNode) => {
      const idStr = String(node.id ?? '');
      const hasChildren = (node.children && node.children.length > 0) || (node.count && node.count > 0 && !node.isLoaded);
      // 模块节点即使用户未加载过也允许展开（避免保存用例后重拉树导致模块收拢且无法再次展开）
      const canExpand = hasChildren || (node.isModule && !node.isLoaded);
      if (!canExpand) return;
      if (node.count && node.count > 0 && !node.isLoaded) {
        loadModuleCases(node);
      }
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(idStr)) next.delete(idStr);
        else next.add(idStr);
        return next;
      });
    },
    [loadModuleCases]
  );

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => treeToFlowData(treeData, expandedIds, loadingNodeId),
    [treeData, expandedIds, loadingNodeId]
  );

  const initialLayout = useMemo(
    () => (rawNodes.length > 0 ? getLayoutedElements(rawNodes, rawEdges, { direction: 'LR' }) : { nodes: rawNodes, edges: rawEdges }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindMapNodeData>>(initialLayout.nodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialLayout.edges);

  const dimensionsStr = useMemo(
    () => nodes.map(n => `${n.id}:${n.measured?.width || 0}x${n.measured?.height || 0}`).join(','),
    [nodes]
  );

  const layouted = useMemo(
    () => {
      if (rawNodes.length === 0) return { nodes: rawNodes as any, edges: rawEdges };
      const nodesWithDimensions = rawNodes.map(rn => {
        const existingNode = nodes.find(n => n.id === rn.id);
        return {
          ...rn,
          measured: existingNode?.measured || rn.measured,
          width: existingNode?.width || rn.width,
          height: existingNode?.height || rn.height,
          data: { ...rn.data },
        };
      });
      return getLayoutedElements(nodesWithDimensions as Node<any>[], rawEdges, { direction: 'LR' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawNodes, rawEdges, dimensionsStr]
  );

  useEffect(() => {
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [layouted.nodes, layouted.edges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (ev: React.MouseEvent, node: Node<MindMapNodeData>) => {
      const raw = node.data.rawNode;
      const target = ev.target as HTMLElement;
      const clickedExpand = target?.closest?.('[data-action="expand"]');

      // 点击「更多模块」：加载下一批模块
      if (raw.isMoreModule && raw.id?.startsWith('tmp-')) {
        const parentId = raw.id.replace(/^tmp-/, '');
        loadMoreModules(parentId);
        return;
      }
      // 点击「更多用例」：加载下一页用例
      if (raw.isMoreCase && raw.id?.startsWith('tmp-')) {
        const moduleId = raw.id.replace(/^tmp-/, '');
        const moduleNode = findNodeInTree(treeData, moduleId);
        if (moduleNode) loadModuleCases(moduleNode, (raw.currentPage ?? 1) + 1);
        return;
      }

      // 点击展开图标：展开/收起
      if (clickedExpand && node.data.hasChildren) {
        toggleExpand(raw);
        return;
      }

      // 内容节点：点击展开/收起
      if (raw.isContent && node.data.hasChildren) {
        toggleExpand(raw);
        return;
      }

      // 模块节点与用例节点：单击选中并显示悬浮菜单（含插入节点/更多操作等）
      // 展开/收起仅通过节点上的展开图标触发，不在此处处理
      if (raw.isCase && raw.id) {
        setSelectedNode(raw);
        const parent = findParentNode(raw.id);
        checkNodeCanShowMenu(raw, parent ?? undefined);

        // 计算悬浮菜单位置（节点上方）
        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
        setFloatMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        });
        return;
      }

      // 其他情况：选中节点并显示悬浮菜单
      setSelectedNode(raw);
      const parent = findParentNode(raw.id);
      checkNodeCanShowMenu(raw, parent ?? undefined);

      // 计算悬浮菜单位置（节点上方）
      const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
      setFloatMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    },
    [toggleExpand, loadMoreModules, loadModuleCases, treeData, findParentNode, checkNodeCanShowMenu]
  );

  // 双击节点打开详情：已有用例用表格的 CaseDetailDrawer，新建用例用侧边栏
  const onNodeDoubleClick = useCallback(
    (ev: React.MouseEvent, node: Node<MindMapNodeData>) => {
      const raw = node.data.rawNode;
      // 双击模块节点：打开编辑模块名称
      if (raw.isModule && raw.id && raw.id !== 'root' && raw.id !== 'NONE') {
        setEditingModuleId(raw.id);
        setEditingModuleName(raw.name ?? raw.text ?? '');
        return;
      }
      if (raw.isCase && raw.id) {
        if (!raw.isNew && onViewCase) {
          setShowDetailSidebar(false);
          onViewCase(raw.id);
          return;
        }
        setShowDetailSidebar(true);
      }
    },
    [onViewCase]
  );

  // 点击画布空白处取消选中
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setFloatMenuPosition(null);
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(collectAllIdsInTree(treeData));
  }, [treeData]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const params = getUpdateParams();

      // 模块的增删改已即时调用 createCaseModuleTree/updateCaseModuleTree，此处只保存用例与删除
      const hasCaseOrDelete =
        (params.updateCaseList?.length ?? 0) > 0 ||
        (params.deleteResourceList?.length ?? 0) > 0 ||
        (params.additionalNodeList?.length ?? 0) > 0;
      if (hasCaseOrDelete) {
        await caseManagementService.saveCaseMinder({
          projectId,
          updateCaseList: params.updateCaseList ?? [],
          updateModuleList: [],
          deleteResourceList: params.deleteResourceList ?? [],
          additionalNodeList: params.additionalNodeList ?? [],
        });
      }

      toast.success('保存成功');
      resetUpdateParams(projectId);
      onSave?.();
      await fetchModuleTree();
    } catch (err: any) {
      toast.error(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }, [projectId, onSave, getUpdateParams, resetUpdateParams, fetchModuleTree]);

  /** 编辑模块名称弹窗「确定」：立即保存（与左侧模块树一致），新建用 createCaseModuleTree，已有用 updateCaseModuleTree */
  const handleConfirmEditModuleName = useCallback(async () => {
    if (!editingModuleId || !editingModuleName.trim()) return;
    const name = editingModuleName.trim();
    const node = findNodeInTree(treeData, editingModuleId);
    try {
      if (node?.isNew) {
        const parentId = findParentNode(editingModuleId)?.id ?? 'NONE';
        const res: any = await caseManagementService.createCaseModuleTree({
          projectId,
          name,
          parentId: parentId === 'NONE' ? 'NONE' : parentId,
        });
        const realId = res?.id ?? res?.data?.id;
        if (realId) {
          setTreeData((prev) => replaceNodeIdInTree(prev, editingModuleId, realId));
        }
        await fetchModuleTree();
      } else {
        await caseManagementService.updateCaseModuleTree({ id: editingModuleId, name });
        setTreeData((prev) => updateNodeText(prev, editingModuleId, name));
        await fetchModuleTree();
      }
      setEditingModuleId(null);
      toast.success('模块名称已更新');
    } catch (err: any) {
      toast.error(err?.message || '保存失败');
    }
  }, [editingModuleId, editingModuleName, treeData, findParentNode, projectId, updateNodeText, fetchModuleTree]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  useEffect(() => {
    fetchModuleTree();
  }, [fetchModuleTree]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      fullscreenContainerRef.current?.requestFullscreen();
    }
  }, []);
  useEffect(() => {
    const el = fullscreenContainerRef.current;
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === el);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  if (loading && treeData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-500 gap-3">
        <Network className="w-12 h-12 text-gray-300" />
        <p>暂无模块数据</p>
        <p className="text-xs text-gray-400">请先在列表中创建模块与用例</p>
      </div>
    );
  }

  return (
    <div
      ref={fullscreenContainerRef}
      className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isFullscreen ? 'bg-white' : ''}`}
    >
      <style>
        {`
          .feature-case-minder-flow .react-flow__node {
            /* 不对 transform 做过渡：排版/测高后节点位移大时，会像从下或斜向「飞入」 */
            transition: opacity 0.2s ease;
            border-radius: 0.5rem;
            background: transparent !important;
          }
          .feature-case-minder-flow .react-flow__node.selectable:hover {
            box-shadow: none !important;
          }
          .react-flow__edge-path {
            transition: d 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          .feature-case-minder-flow .react-flow__pane {
            background: #f4f4f5;
          }
          .feature-case-minder-flow .react-flow__minimap {
            background: #e4e4e7;
          }
          /* 选中高亮由内层圆角卡片承担，外层仅去描边避免与内容尺寸不一致产生缝隙 */
          .feature-case-minder-flow .react-flow__node.selected,
          .feature-case-minder-flow .react-flow__node.selectable.selected,
          .feature-case-minder-flow .react-flow__node.selectable:focus,
          .feature-case-minder-flow .react-flow__node.selectable:focus-visible {
            box-shadow: none !important;
            outline: none !important;
          }
        `}
      </style>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50/80 shrink-0 flex-wrap">
        <span className="text-sm text-gray-500">
          点击节点选中 · 双击用例查看详情 · M/C 添加同级模块/用例 · Shift+M/C 添加子级 · Delete 删除
        </span>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowShortcutHint(!showShortcutHint)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={6}
                hideArrow
                className="max-w-[300px] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-md"
              >
                <div className="space-y-1 text-left">
                  <div><kbd className="bg-gray-100 px-1 rounded">M</kbd> 添加同级模块</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">C</kbd> 添加同级用例</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Shift+M</kbd> 添加子模块</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Shift+C</kbd> 添加子用例</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Delete</kbd> 删除节点</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Ctrl/⌘+C/X/V</kbd> 复制/剪切/粘贴</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Space</kbd> 展开/收起</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">1-4</kbd> 设置优先级 P0-P3</div>
                  <div><kbd className="bg-gray-100 px-1 rounded">Ctrl/⌘+S</kbd> 保存</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            title="保存当前思维导图 (Ctrl/⌘+S)"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="展开当前已加载的所有节点"
          >
            <Expand className="w-3.5 h-3.5" /> 全部展开
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="收起所有节点"
          >
            <CircleMinus className="w-3.5 h-3.5" /> 全部收起
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title={isFullscreen ? '退出全屏 (Esc)' : '全屏'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative w-full" ref={reactFlowRef}>
        <div className="absolute inset-0 w-full h-full feature-case-minder-flow">
          <ReactFlow
            className="!bg-zinc-100"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            defaultEdgeOptions={{
              type: 'step',
              style: { stroke: '#94a3b8', strokeWidth: 1 },
              animated: false,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls className="!shadow-sm" />
            <MiniMap
              nodeColor={(n) => {
                const t = n.type ?? '';
                if (t === 'mindMapContent') return 'rgb(5, 150, 105)';
                if (t === 'mindMapCase') return 'rgb(51, 65, 85)';
                if (t === 'mindMapMore') return 'rgb(161, 161, 170)';
                return 'rgb(71, 85, 105)';
              }}
              maskColor="rgba(15, 23, 42, 0.08)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* 悬浮菜单 */}
      <MinderFloatMenu
        visible={!!floatMenuPosition && !!selectedNode}
        position={floatMenuPosition || { x: 0, y: 0 }}
        selectedNode={selectedNode}
        insertSiblingMenus={insertSiblingMenus}
        insertSonMenus={insertSonMenus}
        canShowPriority={selectedNode ? canShowPriorityMenu([selectedNode]) : false}
        canShowMore={selectedNode ? canShowMoreMenu(selectedNode) : false}
        canShowDetail={selectedNode?.isCase ?? false}
        hasClipboard={clipboardRef.current.length > 0}
        currentPriority={(selectedNode as any)?.priority || selectedNode?.data?.priority as number | undefined}
        onInsertSibling={(tag) => {
          if (selectedNode) {
            setTreeData(prev => {
              const { newTree, newNode } = insertSiblingNode(prev, selectedNode.id, tag);
              if (tag === tags.case && newNode?.isCase) {
                queueMicrotask(() => {
                  setSelectedNode(newNode as MinderTreeNode);
                  setShowDetailSidebar(true);
                });
              }
              return newTree;
            });
            toast.success(`已添加同级${tag}`);
          }
        }}
        onInsertChild={(tag) => {
          if (selectedNode) {
            setTreeData(prev => {
              const { newTree, newNode } = insertChildNode(prev, selectedNode.id, tag);
              if (tag === tags.case && newNode?.isCase) {
                queueMicrotask(() => {
                  setSelectedNode(newNode as MinderTreeNode);
                  setShowDetailSidebar(true);
                });
              }
              return newTree;
            });
            setExpandedIds(prev => new Set([...prev, String(selectedNode.id)]));
            toast.success(`已添加子级${tag}`);
          }
        }}
        onSetPriority={handlePriorityChange}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDeleteNode}
        onViewDetail={() => {
          if (selectedNode?.isCase && selectedNode.id) {
            // 已有用例：复用表格的 CaseDetailDrawer，编辑保存逻辑一致
            if (!selectedNode?.isNew && onViewCase) {
              setShowDetailSidebar(false);
              onViewCase(selectedNode.id);
              return;
            }
            setShowDetailSidebar(true);
          }
        }}
        onEditModuleName={
          selectedNode?.isModule && selectedNode.id && selectedNode.id !== 'root' && selectedNode.id !== 'NONE'
            ? () => {
              setEditingModuleId(selectedNode.id);
              setEditingModuleName(selectedNode.name ?? selectedNode.text ?? '');
            }
            : undefined
        }
      />

      {/* 详情侧边栏：仅新建用例使用；已有用例走 CaseDetailDrawer（与表格同一套编辑保存） */}
      <MinderDetailSidebar
        visible={showDetailSidebar && (selectedNode?.isNew === true)}
        selectedNode={selectedNode}
        caseDetail={caseDetail}
        loading={caseDetailLoading}
        onClose={() => {
          setShowDetailSidebar(false);
          setCaseDetail(null);
        }}
        onSave={handleSaveCaseDetail}
        onLoadDetail={loadCaseDetail}
      />

      {/* 编辑模块名称：双击模块或 F2 打开，确定后立即保存（与左侧模块树一致） */}
      <Dialog open={!!editingModuleId} onOpenChange={(open) => !open && setEditingModuleId(null)}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={() => setEditingModuleId(null)}>
          <DialogHeader>
            <DialogTitle>编辑模块名称</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={editingModuleName}
              onChange={(e) => setEditingModuleName(e.target.value)}
              placeholder="请输入模块名称"
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmEditModuleName();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModuleId(null)}>取消</Button>
            <Button onClick={handleConfirmEditModuleName}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
