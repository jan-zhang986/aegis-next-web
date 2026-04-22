/**
 * API 预览相关类型定义
 * 从 ApiPreviewPage.tsx 提取
 */

import type { MetadataDefinition, MetadataModuleNode } from '@/services/metadata';

/**
 * API 预览页面 Props
 */
export interface ApiPreviewPageProps {
  definition: MetadataDefinition;
  onStartDebug: () => void; // 发起调试回调
  onBack?: () => void; // 返回回调
  moduleName?: string; // 目录名称
  moduleTree?: MetadataModuleNode[]; // 模块树，用于获取完整路径
  definitions?: MetadataDefinition[]; // 定义列表，用于传递给调试页
  onRefresh?: () => void; // 刷新回调
}
