/**
 * 获取模块路径（从模块树中查找）
 */

import type { ModuleTreeNode } from '../types';

function findPath(nodes: ModuleTreeNode[], id: string, path: string[]): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [...path, node.name];
    if (node.children?.length) {
      const found = findPath(node.children, id, [...path, node.name]);
      if (found) return found;
    }
  }
  return null;
}

export function getModulePath(moduleId: string, tree: ModuleTreeNode[]): string {
  const path = findPath(tree, moduleId, []);
  return path ? path.join(' / ') : moduleId;
}
