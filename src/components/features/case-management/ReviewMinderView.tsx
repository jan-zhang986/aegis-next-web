/**
 * 评审详情 - 脑图视图
 * 展示评审关联用例的思维导图，根节点「全部用例」下为模块，展开模块加载用例（getCaseReviewMinder）
 * 参考 metersphere-frontend caseReviewMinder 与本地 FeatureCaseMinderView
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, Plus, Minus, Network, Expand, CircleMinus, Maximize, Minimize2 } from 'lucide-react';
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
import { caseManagementService } from '@/services';
import { getLayoutedElements } from './utils/mindMapLayoutUtils';
import { MindMapModuleNode, MindMapCaseNode, MindMapContentNode, MindMapMoreNode } from './components/MindMapSharedNodes';
import { getCaseLevel, generateId } from './utils';
import { RichTextContent } from './components/RichTextContent';
import {
  CASE_LEVEL_MAP,
  MINDER_CONTENT_TAGS,
  MINDER_MODULE_LIMIT,
  MINDER_CASE_PAGE_SIZE,
  MINDER_MORE_MODULE_TEXT,
  MINDER_MORE_CASE_TEXT,
  REVIEW_STATUS_MAP,
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
  isContent?: boolean;
  resourceType?: string;
  isLoaded?: boolean;
  isMoreModule?: boolean;
  isMoreCase?: boolean;
  currentPage?: number;
  data?: Record<string, unknown>;
}

interface MindMapNodeData extends Record<string, unknown> {
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
      children: d?.expectedResult
        ? [
          {
            id: `${baseId}-text-exp`,
            name: String(d.expectedResult),
            isContent: true,
            resourceType: tags.stepExpect,
            data: { resource: [tags.stepExpect], text: d.expectedResult },
          },
        ]
        : undefined,
    });
  } else {
    const steps =
      typeof d?.steps === 'string'
        ? (() => {
          try {
            return JSON.parse(d.steps) || [];
          } catch {
            return [];
          }
        })()
        : Array.isArray(d?.steps)
          ? d.steps
          : [];
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
            children: result
              ? [
                {
                  id: `${baseId}-step-${i}-exp`,
                  name: String(result),
                  isContent: true,
                  resourceType: tags.stepExpect,
                  data: { resource: [tags.stepExpect], text: result },
                },
              ]
              : undefined,
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
        children: d?.expectedResult
          ? [
            {
              id: `${baseId}-text-exp`,
              name: String(d.expectedResult),
              isContent: true,
              resourceType: tags.stepExpect,
              data: { resource: [tags.stepExpect], text: d.expectedResult },
            },
          ]
          : undefined,
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

function mapContentNodeFromApi(item: any, caseId: string, pathKey: string): MinderTreeNode {
  const d = item?.data ?? item;
  const id = `${caseId}_m_${pathKey}`;
  const name = d?.text ?? item?.text ?? '';
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
    resourceType: Array.isArray(d?.resource) ? d.resource[0] : undefined,
    data: d,
    children: mappedChildren.length > 0 ? mappedChildren : undefined,
  };
}

function mapReviewCaseItemFromApi(item: any): MinderTreeNode {
  const d = item?.data ?? item;
  const id = item?.id ?? d?.caseId ?? d?.id ?? '';
  const name = d?.text ?? d?.name ?? item?.text ?? '';
  let children = item?.children ?? d?.children ?? [];
  const filteredChildren = (Array.isArray(children) ? children : []).filter(
    (c: any) => c?.data?.type !== 'tmp' && c?.data?.id !== 'tmp'
  );
  const caseIdStr = String(id || '').trim() || `case_${generateId()}`;
  let mappedChildren = filteredChildren.map((c: any, i: number) =>
    mapContentNodeFromApi(c, caseIdStr, String(i))
  );
  if (
    mappedChildren.length === 0 &&
    (d?.prerequisite || d?.steps || d?.textDescription || d?.expectedResult)
  ) {
    mappedChildren = buildContentChildrenFromFlat(d);
  }
  return {
    id,
    name,
    text: name,
    isCase: true,
    isLoaded: true,
    data: { ...d, status: d?.status },
    children: mappedChildren.length > 0 ? mappedChildren : undefined,
  };
}

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
      const nodeId =
        rawId && String(rawId).trim() ? String(rawId) : `_fallback-${++fallbackIdCounter}`;
      const expanded = expandedIds.has(String(rawId ?? nodeId));
      const children = node.children ?? [];
      const hasChildren =
        children.length > 0 || (node.count && node.count > 0 && !node.isLoaded);
      const isLoading = loadingNodeId != null && (String(loadingNodeId) === String(rawId) || String(loadingNodeId) === nodeId);
      const displayName = node.name || node.text || (node.data as any)?.text || '-';
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
          isModule:
            node.isModule !== false &&
            !node.isCase &&
            !node.isContent &&
            !node.isMoreModule &&
            !node.isMoreCase,
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
      if (parentId) edges.push({ id: `${parentId}-${nodeId}`, source: parentId, target: nodeId, type: 'default' });
      if (expanded && children.length > 0) traverse(children, nodeId);
    }
  };
  traverse(treeData);
  return { nodes, edges };
}

function expandPathToNode(
  nodes: MinderTreeNode[],
  targetId: string,
  out: Set<string>
): boolean {
  for (const n of nodes) {
    if (String(n.id) === String(targetId)) {
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



const nodeTypes = {
  mindMapModule: MindMapModuleNode,
  mindMapCase: MindMapCaseNode,
  mindMapContent: MindMapContentNode,
  mindMapMore: MindMapMoreNode,
};

export interface ReviewMinderViewProps {
  projectId: string;
  reviewId: string;
  moduleTree: Array<{ id: string; name: string; children?: any[] }>;
  modulesCount: Record<string, number>;
  selectedModuleId?: string;
  /** 多人评审时仅看我的评审状态，与 metersphere viewStatusFlag 一致 */
  viewStatusFlag?: boolean;
  onViewCase?: (caseId: string) => void;
}

export function ReviewMinderView({
  projectId,
  reviewId,
  moduleTree,
  modulesCount,
  selectedModuleId = 'all',
  viewStatusFlag = false,
  onViewCase,
}: ReviewMinderViewProps) {
  const [treeData, setTreeData] = useState<MinderTreeNode[]>([]);
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const largeModulesMapRef = useRef<Record<string, any[]>>({});
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const mapModuleTree = useCallback(
    (nodes: any[], parentId: string = 'NONE'): MinderTreeNode[] => {
      const list = Array.isArray(nodes) ? nodes : [];
      const result: MinderTreeNode[] = [];
      const takeCount = Math.min(list.length, MINDER_MODULE_LIMIT);
      const take = list.slice(0, takeCount);
      if (list.length > MINDER_MODULE_LIMIT) {
        largeModulesMapRef.current[String(parentId)] = list.slice(MINDER_MODULE_LIMIT);
      }
      for (const e of take) {
        const id = String(e.id ?? e.data?.id ?? '');
        const name = e.name ?? e.data?.text ?? '';
        const count = modulesCount[id] ?? e.count ?? 0;
        const childList = e.children ?? [];
        const mappedChildren = mapModuleTree(childList, id);
        const children: MinderTreeNode[] = mappedChildren.length > 0 ? mappedChildren : [];
        result.push({
          id,
          name,
          text: name,
          isModule: true,
          count: count as number,
          children: children.length > 0 ? children : undefined,
        });
      }
      if (list.length > MINDER_MODULE_LIMIT) {
        result.push({
          id: `tmp-${parentId}`,
          name: MINDER_MORE_MODULE_TEXT,
          isMoreModule: true,
          type: 'tmpModule',
        });
      }
      return result;
    },
    [modulesCount]
  );

  const buildInitialTree = useCallback(() => {
    const mapped = mapModuleTree(moduleTree);
    const rootCount = modulesCount.all ?? Object.values(modulesCount).reduce((a, b) => a + (b ?? 0), 0);
    const fullTree: MinderTreeNode[] = [
      {
        id: 'NONE',
        name: '全部用例',
        text: '全部用例',
        isModule: true,
        count: rootCount,
        children: mapped.length > 0 ? mapped : undefined,
      },
    ];

    if (selectedModuleId && selectedModuleId !== 'all') {
      const targetNode = findNodeInTree(fullTree, selectedModuleId);
      if (targetNode) {
        return [targetNode];
      }
    }
    return fullTree;
  }, [moduleTree, modulesCount, mapModuleTree, selectedModuleId]);

  const hasInitializedRef = useRef(false);
  const prevSelectedModuleIdRef = useRef(selectedModuleId);
  useEffect(() => {
    const initial = buildInitialTree();
    const selectedChanged = prevSelectedModuleIdRef.current !== selectedModuleId;
    const isFirstMount = !hasInitializedRef.current;
    if (isFirstMount || selectedChanged) {
      hasInitializedRef.current = true;
      prevSelectedModuleIdRef.current = selectedModuleId;
      setTreeData(initial);
      setExpandedIds((prev) => {
        const next = new Set<string>();
        if (selectedModuleId && selectedModuleId !== 'all') {
          const targetNode = findNodeInTree(initial, selectedModuleId);
          if (targetNode) {
            next.add(String(selectedModuleId));
          } else {
            next.add('NONE');
          }
        } else {
          next.add('NONE');
        }
        return next;
      });
    }
  }, [buildInitialTree, selectedModuleId]);

  const loadModuleCases = useCallback(
    async (node: MinderTreeNode, page = 1) => {
      const moduleId = node.id;
      if (!moduleId || moduleId === 'NONE') return;
      const moduleIdStr = String(moduleId);
      if (page === 1 && loadedModules.has(moduleIdStr)) return;
      setLoadingNodeId(moduleId);
      try {
        const res: any = await caseManagementService.getCaseReviewMinder({
          projectId,
          reviewId,
          moduleId,
          current: page,
          viewStatusFlag,
        });
        const list = Array.isArray(res) ? res : res?.list ?? res?.data ?? [];
        const total = res?.total ?? list?.length ?? 0;
        const caseNodes: MinderTreeNode[] = (list || []).map((item: any) =>
          mapReviewCaseItemFromApi(item)
        );

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
              // 保留现有的子模块节点和用例节点，追加新加载的用例节点（对齐 FeatureCaseMinderView）
              const existing = n.children || [];
              const existingModules = existing.filter(
                (c) => c.isModule && !c.isCase && !c.isMoreCase && !c.isMoreModule
              );
              const existingCases = existing.filter((c) => c.isCase && !c.isMoreCase);
              const existingMoreCase = append ? existing.filter((c) => c.isMoreCase) : [];
              // 占位节点（如初始 fakeNode）：既不是模块也不是用例/更多，用于保持 hasChildren 为 true
              const placeholderChildren = existing.filter(
                (c) => !c.isModule && !c.isCase && !c.isMoreCase && !c.isMoreModule
              );
              const existingCaseIds = new Set(
                existingCases.map((c) => c.id).filter(Boolean)
              );
              const newCases = cases.filter((c) => {
                const caseId = c.id;
                if (!caseId) return true;
                return !existingCaseIds.has(caseId);
              });
              
              // 模块节点、原有内容节点以及用例
              const existingOthers = existing.filter(
                (c) => !c.isModule && !c.isCase && !c.isMoreCase && !c.isMoreModule && c.id !== 'tmp'
              );

              let merged = [
                ...existingModules,
                ...existingOthers,
                ...existingCases,
                ...newCases,
                ...existingMoreCase,
              ];
              // 合并：现有的和新加的用例
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
                children: mergeCasesIntoNode(
                  n.children,
                  targetId,
                  cases,
                  append,
                  addMoreCase,
                  moreCasePage
                ),
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
        console.error('加载评审用例失败:', err);
      } finally {
        setLoadingNodeId(null);
      }
    },
    [projectId, reviewId, loadedModules]
  );

  const loadMoreModules = useCallback(
    (parentId: string) => {
      const parentIdStr = String(parentId);
      const remaining = largeModulesMapRef.current[parentIdStr];
      if (!remaining?.length) return;
      const batch = remaining.slice(0, MINDER_MODULE_LIMIT);
      largeModulesMapRef.current[parentIdStr] = remaining.slice(MINDER_MODULE_LIMIT);
      const mappedBatch = mapModuleTree(batch, parentIdStr);
      const moreNode: MinderTreeNode = {
        id: `tmp-${parentIdStr}`,
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
            return {
              ...n,
              children: mergeMoreModulesIntoNode(
                n.children,
                targetId,
                newModules,
                addMore
              ),
            };
          return n;
        });
      const addMore = largeModulesMapRef.current[parentIdStr]?.length > 0;
      setTreeData((prev) =>
        mergeMoreModulesIntoNode(prev, parentIdStr, mappedBatch, addMore)
      );
    },
    [mapModuleTree]
  );

  const toggleExpand = useCallback(
    (node: MinderTreeNode) => {
      const idStr = String(node.id ?? '');
      const hasChildren =
        (node.children && node.children.length > 0) ||
        (node.count && node.count > 0 && !node.isLoaded);
      // 模块节点即使用户未加载过也允许展开（与 FeatureCaseMinderView 一致，避免重拉数据后无法再次展开）
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

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 用于在节点尺寸测算出来后，触发重新排版
  const dimensionsStr = useMemo(() => {
    return nodes.map((n) => `${n.id}:${n.measured?.width || 0}x${n.measured?.height || 0}`).join('|');
  }, [nodes]);

  const layouted = useMemo(
    () => {
      if (rawNodes.length === 0) return { nodes: rawNodes as any, edges: rawEdges };
      const nodesWithDimensions = rawNodes.map((rn) => {
        const existingNode = nodes.find((n) => n.id === rn.id);
        return {
          ...rn,
          measured: existingNode?.measured || rn.measured,
          width: existingNode?.width || rn.width,
          height: existingNode?.height || rn.height,
          data: { ...rn.data },
        };
      });
      return getLayoutedElements(nodesWithDimensions as Node<any>[], rawEdges, { direction: 'LR', xSpacing: 240 });
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
      const clickedExpand = (ev.target as HTMLElement)?.closest?.('[data-action="expand"]');
      if (raw.isMoreModule && raw.id?.startsWith?.('tmp-')) {
        const parentId = raw.id.replace(/^tmp-/, '');
        loadMoreModules(parentId);
        return;
      }
      if (raw.isMoreCase && raw.id?.startsWith?.('tmp-')) {
        const moduleId = raw.id.replace(/^tmp-/, '');
        const moduleNode = findNodeInTree(treeData, moduleId);
        if (moduleNode) loadModuleCases(moduleNode, ((raw.currentPage as number) ?? 1) + 1);
        return;
      }
      // 点击展开图标：展开/收起（包含模块节点，加载用例由 toggleExpand 内部处理）
      if (clickedExpand && node.data.hasChildren) {
        toggleExpand(raw);
        return;
      }
      // 内容节点：点击整块也支持展开/收起
      if (raw.isContent && node.data.hasChildren) {
        toggleExpand(raw);
        return;
      }
    },
    [toggleExpand, loadMoreModules, loadModuleCases, treeData]
  );

  const onNodeDoubleClick = useCallback(
    (ev: React.MouseEvent, node: Node<MindMapNodeData>) => {
      const raw = node.data.rawNode;
      if (raw.isCase && raw.id && onViewCase) {
        onViewCase(raw.id);
      }
    },
    [onViewCase]
  );

  const expandAll = useCallback(() => {
    setExpandedIds(collectAllIdsInTree(treeData));
  }, [treeData]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  if (treeData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-500 gap-3">
        <Network className="w-12 h-12 text-gray-300" />
        <p>暂无模块数据</p>
        <p className="text-xs text-gray-400">请先在列表中关联用例</p>
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
          .review-minder-flow .react-flow__node {
            transition: opacity 0.2s ease;
            border-radius: 0.5rem;
            background: transparent !important;
          }
          .review-minder-flow .react-flow__node.selectable:hover {
            box-shadow: none !important;
          }
          .react-flow__edge-path {
            transition: d 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          .review-minder-flow .react-flow__pane {
            background: #f4f4f5;
          }
          .review-minder-flow .react-flow__minimap {
            background: #e4e4e7;
          }
          .review-minder-flow .react-flow__node.selected,
          .review-minder-flow .react-flow__node.selectable.selected,
          .review-minder-flow .react-flow__node.selectable:focus,
          .review-minder-flow .react-flow__node.selectable:focus-visible {
            box-shadow: none !important;
            outline: none !important;
          }
        `}
      </style>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50/80 shrink-0 flex-wrap">
        <span className="text-sm text-gray-500">
          根在左侧、向右展开 · 点击模块展开用例 · 点击用例查看详情 · 拖拽画布平移、滚轮缩放
        </span>
        <div className="flex items-center gap-1">
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
      <div className="flex-1 min-h-0 relative w-full">
        <div className="absolute inset-0 w-full h-full review-minder-flow">
          <ReactFlow
            className="!bg-zinc-100"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
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
    </div>
  );
}
