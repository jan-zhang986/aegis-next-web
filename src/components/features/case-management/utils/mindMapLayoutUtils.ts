import { Edge, Node, Position } from '@xyflow/react';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 36;
const VERTICAL_SEP = 16;
const RANK_SEP = 120; // 层级间的水平基础间距

interface LayoutOptions {
    direction?: 'LR' | 'TB';
    ySpacing?: number;
    xSpacing?: number;
}

/**
 * 脑图通用排版引擎
 * 支撑功能用例、用例评审、测试规划三个统一视角的树状节点排布。
 * 支持动态基于文本长宽排版。
 */
export function getLayoutedElements<T extends Record<string, any>>(
    nodes: Node<T>[],
    edges: Edge[],
    options: LayoutOptions = {}
): { nodes: Node<T>[]; edges: Edge[] } {
    const { direction = 'LR', ySpacing = VERTICAL_SEP, xSpacing = RANK_SEP } = options;

    if (nodes.length === 0) return { nodes, edges };

    // 1. 计算入度，找根节点树丛
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => inDegree.set(n.id, 0));
    edges.forEach((e) => {
        if (inDegree.has(e.target)) {
            inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
        }
    });

    const roots = nodes.filter((n) => inDegree.get(n.id) === 0);

    // 2. 建立邻接表 (父 -> 子列表) 和 nodeMap
    const adj = new Map<string, string[]>();
    const nodeMap = new Map<string, Node<T>>();
    nodes.forEach((n) => {
        adj.set(n.id, []);
        nodeMap.set(n.id, n);
    });
    edges.forEach((e) => {
        if (adj.has(e.source)) {
            adj.get(e.source)!.push(e.target);
        }
    });

    // 避免循环依赖
    const visited = new Set<string>();

    // 计算每个节点的子树高度及需要的 Y 跨度
    const subtreeHeight = new Map<string, number>();

    function calcHeight(nodeId: string): number {
        if (visited.has(nodeId)) return subtreeHeight.get(nodeId) || NODE_HEIGHT;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        const nodeHeight = node?.measured?.height || node?.height || NODE_HEIGHT;

        const children = adj.get(nodeId) || [];
        if (children.length === 0) {
            const h = nodeHeight;
            subtreeHeight.set(nodeId, h);
            return h;
        }

        let totalChildrenHeight = 0;
        for (let i = 0; i < children.length; i++) {
            const childId = children[i];
            totalChildrenHeight += calcHeight(childId);
        }
        // 添加子节点之间的间距
        totalChildrenHeight += (children.length - 1) * ySpacing;

        const h = Math.max(nodeHeight, totalChildrenHeight);
        subtreeHeight.set(nodeId, h);
        return h;
    }

    visited.clear();
    roots.forEach((r) => calcHeight(r.id));

    // 对于可能存在的森林（孤立点或多个根），也算一下
    nodes.forEach(n => {
        if (!visited.has(n.id)) calcHeight(n.id);
    });

    // 3. 计算每一层的最大宽度
    const depthMaxWidth: number[] = [];
    const widthVisited = new Set<string>();
    function calcDepthWidth(id: string, depth: number) {
        if (widthVisited.has(id)) return;
        widthVisited.add(id);
        const node = nodeMap.get(id);
        const w = node?.measured?.width || node?.width || NODE_WIDTH;
        depthMaxWidth[depth] = Math.max(depthMaxWidth[depth] || NODE_WIDTH, w);
        const children = adj.get(id) || [];
        children.forEach(c => calcDepthWidth(c, depth + 1));
    }

    widthVisited.clear();
    roots.forEach(r => calcDepthWidth(r.id, 0));
    nodes.forEach(n => {
        if (!widthVisited.has(n.id)) calcDepthWidth(n.id, 0);
    });

    const depthStartX: number[] = [0];
    for (let i = 1; i < depthMaxWidth.length; i++) {
        depthStartX[i] = depthStartX[i - 1] + depthMaxWidth[i - 1] + xSpacing;
    }

    visited.clear();
    const nodePositions = new Map<string, { x: number; y: number }>();

    // 4. 自上而下分配坐标 (x, y)
    // startY 是当前可用的顶部 Y 坐标
    function assignPos(nodeId: string, depth: number, startY: number): void {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        const nodeHeight = node?.measured?.height || node?.height || NODE_HEIGHT;
        const h = subtreeHeight.get(nodeId) || nodeHeight;
        // 节点的中心 Y 坐标位于分配给它的区域的中心
        const y = startY + h / 2 - nodeHeight / 2;
        const x = depthStartX[depth];
        nodePositions.set(nodeId, { x, y });

        const children = adj.get(nodeId) || [];
        let currentChildY = startY;

        for (const childId of children) {
            const childNode = nodeMap.get(childId);
            const childNodeHeight = childNode?.measured?.height || childNode?.height || NODE_HEIGHT;
            const childH = subtreeHeight.get(childId) || childNodeHeight;
            assignPos(childId, depth + 1, currentChildY);
            currentChildY += childH + ySpacing;
        }
    }

    let currentRootY = 0;
    roots.forEach(r => {
        const rootNode = nodeMap.get(r.id);
        const rootNodeHeight = rootNode?.measured?.height || rootNode?.height || NODE_HEIGHT;
        const h = subtreeHeight.get(r.id) || rootNodeHeight;
        assignPos(r.id, 0, currentRootY);
        currentRootY += h + ySpacing * 2; // 根节点之间多留一点空间
    });

    // 处理孤立节点/游离环
    nodes.forEach(n => {
        if (!visited.has(n.id)) {
            const isolatedNode = nodeMap.get(n.id);
            const isolatedNodeHeight = isolatedNode?.measured?.height || isolatedNode?.height || NODE_HEIGHT;
            const h = subtreeHeight.get(n.id) || isolatedNodeHeight;
            assignPos(n.id, 0, currentRootY);
            currentRootY += h + ySpacing;
        }
    });

    const layoutNodes: Node<T>[] = nodes.map((node: any) => {
        // 不再把新节点首帧钉在父节点坐标：否则 transition 会从父位置插值到子位置，
        // 子节点多在父右侧且纵向错开，视觉上像「从下/斜向飞出」，而非从左向右展开。
        const p = nodePositions.get(node.id);
        const finalPos = p || { x: 0, y: 0 };
        const x = finalPos.x;
        const y = finalPos.y;

        return {
            ...node,
            position: { x, y },
            sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
            targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        } as Node<T>;
    });

    return { nodes: layoutNodes, edges };
}
