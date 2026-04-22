/**
 * 收集模块树中某节点的所有子孙节点 ID
 * 参考 spotter-metersphere caseTree.vue mapTree(node.children, e => offspringIds.push(e.id))
 * 用于模块查询时包含本级及下级用例
 */

import type { ModuleTreeNode } from '../types';

function walkCollectIds(node: ModuleTreeNode, ids: string[]): void {
  if (!node.children?.length) return;
  for (const child of node.children) {
    ids.push(child.id);
    walkCollectIds(child, ids);
  }
}

/** 从 tree 中查找 nodeId 对应节点，并收集其所有子孙节点 ID */
export function collectOffspringIds(tree: ModuleTreeNode[], nodeId: string): string[] {
  const ids: string[] = [];
  function findAndCollect(nodes: ModuleTreeNode[]): boolean {
    for (const node of nodes) {
      if (node.id === nodeId) {
        walkCollectIds(node, ids);
        return true;
      }
      if (node.children?.length && findAndCollect(node.children)) return true;
    }
    return false;
  }
  findAndCollect(tree);
  return ids;
}

/** 判断 nodeId 是否存在于当前模块树中（用于校验 URL 中的 moduleId 是否有效） */
export function moduleExistsInTree(tree: ModuleTreeNode[], nodeId: string): boolean {
  if (!nodeId || nodeId === 'all') return true;
  function find(nodes: ModuleTreeNode[]): boolean {
    for (const node of nodes) {
      if (node.id === nodeId) return true;
      if (node.children?.length && find(node.children)) return true;
    }
    return false;
  }
  return find(tree);
}
