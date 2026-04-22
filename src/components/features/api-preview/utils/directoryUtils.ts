import type { MetadataModuleNode } from '@/services/metadata';

export function getDirectoryLabel(
  isSyncData: boolean,
  moduleTree: MetadataModuleNode[],
  moduleId: string | undefined,
  moduleName?: string
): string {
  if (isSyncData) return '同步数据';
  if (!moduleTree.length || !moduleId) return moduleName || moduleId || '-';

  const flattenNodes = (nodes: MetadataModuleNode[]): MetadataModuleNode[] => {
    const result: MetadataModuleNode[] = [];
    nodes.forEach((n) => {
      result.push(n);
      if (n.children?.length) result.push(...flattenNodes(n.children));
    });
    return result;
  };

  const allNodes = flattenNodes(moduleTree);
  const getNodePath = (nodeId: string): string => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return moduleName || nodeId;
    if (node.parentId === 'NONE') return node.name;
    const parent = allNodes.find((n) => n.id === node.parentId);
    if (parent) {
      const parentPath = getNodePath(parent.id);
      return parentPath === parent.name ? `${parent.name} / ${node.name}` : `${parentPath} / ${node.name}`;
    }
    return node.name;
  };

  return getNodePath(moduleId);
}
