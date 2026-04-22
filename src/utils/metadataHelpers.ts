import { TYPE_CONFIG } from '@/constants/metadata';
import type { MetadataModuleNode } from '@/services/metadata';
import type { ApiItem } from '@/types';

export function flattenNodes(nodes: MetadataModuleNode[]): MetadataModuleNode[] {
  const result: MetadataModuleNode[] = [];
  nodes.forEach(node => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result.push(...flattenNodes(node.children));
    }
  });
  return result;
}

export function collectAllNodeIds(node: MetadataModuleNode): string[] {
  const ids = [node.id];
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      ids.push(...collectAllNodeIds(child));
    });
  }
  return ids;
}

export function getTypeBadgeColor(type: string): string {
  const colors: { [key: string]: string } = {
    'GET': 'bg-green-100 text-green-600',
    'POST': 'bg-yellow-100 text-yellow-600',
    'PUT': 'bg-blue-100 text-blue-600',
    'DELETE': 'bg-red-100 text-red-600',
    'SQL': 'bg-cyan-100 text-cyan-600',
    'DUBBO': 'bg-blue-100 text-blue-600',
    'RocketMQ': 'bg-green-100 text-green-600',
    'FILE': 'bg-purple-100 text-purple-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

export function getProtocolContext(
  currentSelection: { level: string; id?: string },
  moduleTree: MetadataModuleNode[]
): string {
  if (currentSelection.level === 'metadata-type') {
    if (currentSelection.id === TYPE_CONFIG.SQL.id) return 'SQL';
    if (currentSelection.id === TYPE_CONFIG.DUBBO.id) return 'DUBBO';
    if (currentSelection.id === TYPE_CONFIG.ROCKETMQ.id) return 'ROCKETMQ';
    if (currentSelection.id === TYPE_CONFIG.FILE.id) return 'FILE';
    if (currentSelection.id === 'metadata-script') return 'SCRIPT';
    return 'HTTP';
  }
  if (currentSelection.level === 'metadata-category' && currentSelection.id) {
    const allNodes = flattenNodes(moduleTree);
    const moduleNode = allNodes.find(node => node.id === currentSelection.id);
    const nodeType = moduleNode?.type;
    if (nodeType === 'SQL') return 'SQL';
    if (nodeType === 'DUBBO') return 'DUBBO';
    if (nodeType === 'ROCKETMQ') return 'ROCKETMQ';
    if (nodeType === 'FILE') return 'FILE';
    if (nodeType === 'SCRIPT') return 'SCRIPT';
    return 'HTTP';
  }
  return 'HTTP';
}

