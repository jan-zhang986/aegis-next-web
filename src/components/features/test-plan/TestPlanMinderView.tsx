/**
 * 测试计划测试规划脑图视图
 * 使用 React Flow 展示测试计划脑图：根 → 功能用例/接口用例/场景 → 测试点 → 用例数/环境/资源池
 * 参考 spotter-metersphere testPlanMinder 与 FeatureCaseMinderView 实现
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, Plus, Minus, Network, Expand, CircleMinus } from 'lucide-react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Position,
  Handle,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { testCaseService } from '@/services/test-case';
import { getLayoutedElements } from '../case-management/utils/mindMapLayoutUtils';

/** 测试计划脑图树节点（与 API PlanMinderNode 对应） */
export interface PlanMinderTreeNode {
  id: string;
  name: string;
  level?: number; // 0=root, 1=分类, 2=测试点, 3=用例数/环境/资源池
  type?: string; // FUNCTIONAL_CASE | API_CASE | SCENARIO_CASE | API | SCENARIO
  num?: number; // 关联用例数
  resource?: string[]; // 标签：用例数、环境、资源池等
  priority?: number; // 2=串行 3=并行
  children?: PlanMinderTreeNode[];
  raw?: any;
}

interface TestPlanMinderViewProps {
  /** 从 getTestPlanMinder 返回的原始数据（数组或单节点） */
  rawData: any;
  /** 是否只读（已归档等） */
  readOnly?: boolean;
}

// 节点展示数据
interface PlanMindMapNodeData extends Record<string, unknown> {
  label: string;
  level: number;
  nodeType: 'root' | 'category' | 'testPoint' | 'level3';
  type?: string;
  num?: number;
  resourceTag?: string;
  expanded: boolean;
  hasChildren: boolean;
  rawNode: PlanMinderTreeNode;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 36;

const CATEGORY_LABEL: Record<string, string> = {
  FUNCTIONAL_CASE: '功能用例',
  API_CASE: '接口用例',
  API: '接口用例',
  SCENARIO_CASE: '自动化用例',
  SCENARIO: '自动化',
};

// 将 API 返回的节点转为 PlanMinderTreeNode
function mapApiNodeToTree(raw: any): PlanMinderTreeNode {
  const data = raw?.data ?? raw;
  const id = data?.id ?? raw?.id ?? '';
  const name = data?.text ?? data?.name ?? raw?.text ?? raw?.name ?? '';
  const children = raw?.children ?? [];
  const filteredChildren = (Array.isArray(children) ? children : []).filter(
    (c: any) => c?.data?.id !== 'fakeNode' && c?.data?.type !== 'tmp' && c?.data?.id !== 'tmp'
  );
  return {
    id,
    name: name || '未命名',
    level: data?.level ?? 0,
    type: data?.type,
    num: data?.num,
    resource: data?.resource,
    priority: data?.priority,
    children: filteredChildren.length > 0 ? filteredChildren.map(mapApiNodeToTree) : undefined,
    raw: data,
  };
}

// 从 API 数据解析出根节点及树
function parseMinderData(rawData: any): PlanMinderTreeNode[] {
  if (!rawData) return [];
  // API 可能返回数组（首项为根）或单节点或 { root }
  const rootRaw = Array.isArray(rawData) ? rawData[0] : rawData?.root ?? rawData;
  if (!rootRaw) return [];
  const root = mapApiNodeToTree(rootRaw);
  // 根节点若没有子节点则直接返回根；否则用根作为唯一顶层
  if (!root.children?.length) return [root];
  return [root];
}

function treeToFlowData(
  treeData: PlanMinderTreeNode[],
  expandedIds: Set<string>
): { nodes: Node<PlanMindMapNodeData>[]; edges: Edge[] } {
  const nodes: Node<PlanMindMapNodeData>[] = [];
  const edges: Edge[] = [];
  let fallback = 0;

  const traverse = (list: PlanMinderTreeNode[], parentId?: string) => {
    for (const node of list) {
      const nodeId = node.id && String(node.id).trim() ? String(node.id) : `_plan-${++fallback}`;
      const expanded = expandedIds.has(node.id || nodeId);
      const children = node.children ?? [];
      const hasChildren = children.length > 0;

      let nodeType: PlanMindMapNodeData['nodeType'] = 'testPoint';
      if (node.level === 0 || node.id === 'root') nodeType = 'root';
      else if (node.level === 1) nodeType = 'category';
      else if (node.level === 2) nodeType = 'testPoint';
      else nodeType = 'level3';

      const label = node.name || '-';
      const resourceTag = Array.isArray(node.resource) ? node.resource[0] : undefined;

      nodes.push({
        id: nodeId,
        type: `planMinder_${nodeType}`,
        position: { x: 0, y: 0 },
        data: {
          label,
          level: node.level ?? 0,
          nodeType,
          type: node.type,
          num: node.num,
          resourceTag,
          expanded: expanded && hasChildren,
          hasChildren,
          rawNode: node,
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

function collectAllIds(nodes: PlanMinderTreeNode[]): Set<string> {
  const ids = new Set<string>();
  function walk(list: PlanMinderTreeNode[]) {
    for (const n of list) {
      if (n.id) ids.add(n.id);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return ids;
}

// 根节点
function RootNode({ data }: NodeProps<Node<PlanMindMapNodeData>>) {
  return (
    <div className="min-w-[160px] px-3 py-2 rounded-lg bg-blue-800 text-white flex items-center gap-2 shadow-md border border-blue-600">
      <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
      <span className="flex-1 truncate text-sm">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
    </div>
  );
}

// 分类节点（功能用例/接口用例/场景）
function CategoryNode({ data }: NodeProps<Node<PlanMindMapNodeData>>) {
  const displayName = CATEGORY_LABEL[data.type ?? ''] ?? data.label;
  const hasChildren = data.hasChildren;
  const expanded = data.expanded;

  return (
    <div className="min-w-[160px] px-2 py-1.5 rounded-md bg-blue-600 text-white flex items-center gap-2 shadow-sm border border-blue-500">
      <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
      <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500 shrink-0">分类</span>
      <span className="flex-1 truncate text-[13px]">{displayName}</span>
      {hasChildren && (
        <span data-action="expand" className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
          {expanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </span>
      )}
      <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
    </div>
  );
}

// 测试点节点
function TestPointNode({ data }: NodeProps<Node<PlanMindMapNodeData>>) {
  const hasChildren = data.hasChildren;
  const expanded = data.expanded;
  const serialLabel = data.rawNode?.raw?.priority === 3 ? '并行' : '串行';

  return (
    <div className="min-w-[170px] px-2 py-1.5 rounded-md bg-blue-500 text-white flex items-center gap-2 shadow-sm border border-blue-400">
      <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
      <span className="text-[10px] px-1 py-0.5 rounded bg-blue-400 shrink-0">测试点</span>
      <span className="flex-1 truncate text-[12px]">{data.label}</span>
      {data.num != null && <span className="text-[10px] opacity-90 shrink-0">({data.num})</span>}
      {hasChildren && (
        <span data-action="expand" className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0">
          {expanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </span>
      )}
      <span className="text-[9px] text-white/70 shrink-0" title="执行方式">{serialLabel}</span>
      <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
    </div>
  );
}

// 三级节点（用例数/环境/资源池）
function Level3Node({ data }: NodeProps<Node<PlanMindMapNodeData>>) {
  const tag = data.resourceTag ?? data.label;

  return (
    <div className="min-w-[140px] px-2 py-1 rounded-md bg-blue-50 text-blue-800 flex items-center gap-2 border border-blue-200">
      <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
      {tag && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-200 shrink-0">{tag}</span>}
      <span className="flex-1 truncate text-[11px]">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
    </div>
  );
}

const nodeTypes = {
  planMinder_root: RootNode,
  planMinder_category: CategoryNode,
  planMinder_testPoint: TestPointNode,
  planMinder_level3: Level3Node,
};

export function TestPlanMinderView({ rawData, readOnly }: TestPlanMinderViewProps) {
  const treeData = useMemo(() => parseMinderData(rawData), [rawData]);

  // 默认展开根节点及所有一级分类，便于直接看到测试规划结构
  const initialExpanded = useMemo(() => {
    const ids = new Set<string>();
    if (treeData.length === 0) return ids;
    const root = treeData[0];
    if (root.id) ids.add(root.id);
    (root.children ?? []).forEach((c) => {
      if (c.id) ids.add(c.id);
    });
    return ids;
  }, [treeData]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  // 数据加载后设置默认展开（根 + 一级分类）
  useEffect(() => {
    if (treeData.length > 0) {
      setExpandedIds(initialExpanded);
    }
  }, [treeData, initialExpanded]);

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => treeToFlowData(treeData, expandedIds),
    [treeData, expandedIds]
  );
  const initialLayout = useMemo(
    () => (rawNodes.length > 0 ? getLayoutedElements(rawNodes, rawEdges, { direction: 'LR', xSpacing: 240 }) : { nodes: rawNodes, edges: rawEdges }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PlanMindMapNodeData>>(initialLayout.nodes as any);
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
          data: { ...rn.data, __isNew: !existingNode, __oldPosition: existingNode?.position }
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

  const toggleExpand = useCallback((node: PlanMinderTreeNode) => {
    const id = node.id;
    if (!id) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(collectAllIds(treeData));
  }, [treeData]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const onNodeClick = useCallback(
    (ev: React.MouseEvent, node: Node<PlanMindMapNodeData>) => {
      const raw = node.data.rawNode;
      const clickedExpand = (ev.target as HTMLElement)?.closest?.('[data-action="expand"]');
      if (clickedExpand && node.data.hasChildren) {
        toggleExpand(raw);
      } else if (node.data.hasChildren) {
        toggleExpand(raw);
      }
    },
    [toggleExpand]
  );

  if (treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 gap-3">
        <Network className="w-12 h-12 text-gray-300" />
        <p className="text-sm">暂无脑图数据</p>
        <p className="text-xs text-gray-400">在脑图中添加测试分类与测试点后将在此展示</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <style>
        {`
          .react-flow__node {
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
          }
          .react-flow__edge-path {
            transition: d 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
        `}
      </style>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50/80 shrink-0 flex-wrap">
        <span className="text-sm text-gray-500">
          根在左侧、向右展开 · 点击节点展开/收起 · 拖拽画布平移、滚轮缩放
        </span>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expandAll}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              title="展开所有节点"
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
          </div>
        )}
      </div>
      <div className="flex-1 min-h-[480px] relative w-full">
        <div className="absolute inset-0 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
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
              style: { stroke: '#3b82f6', strokeWidth: 1 },
              animated: false,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e5e7eb" gap={12} />
            <Controls className="!shadow-sm" />
            <MiniMap
              nodeColor={(n) => {
                const d = n.data as PlanMindMapNodeData;
                if (d.nodeType === 'root') return 'rgb(30, 64, 175)';
                if (d.nodeType === 'category') return 'rgb(37, 99, 235)';
                if (d.nodeType === 'testPoint') return 'rgb(59, 130, 246)';
                return 'rgb(191, 219, 254)';
              }}
              maskColor="rgba(0,0,0,0.05)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
