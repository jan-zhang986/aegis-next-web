/**
 * 工作流设计器相关类型定义
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import type { WorkflowNodeData, NodeType } from '@/components/workflow';

/**
 * 节点面板分类
 */
export interface NodeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  nodes: Array<{
    type: NodeType;
    name: string;
    description: string;
    icon: React.ReactNode;
  }>;
}

/**
 * 公共节点接口定义
 */
export interface PublicNode {
  id: string;
  name: string;
  description?: string;
  type: NodeType;
  config?: any;
  icon?: React.ReactNode;
}

/**
 * 工作流设计页面 Props
 */
export interface WorkflowDesignPageV2Props {
  viewMode?: 'canvas' | 'steps';
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  workflowId?: string; // 外部传入的工作流ID
  moduleId?: string; // 外部传入的模块ID
  projectId?: string; // 外部传入的项目ID
  onSave?: () => void | Promise<void>; // 保存成功后的回调
}

/**
 * 工作流设计页面 Ref 接口
 */
export interface WorkflowDesignPageV2Ref {
  handleSave: () => Promise<boolean>;
  getWorkflowData: () => any;
  loadWorkflow: (workflowId: string) => Promise<void>;
}
