/**
 * WorkflowDesigner 类型定义
 */

import React from 'react';
import { NodeType } from '@/components/workflow';

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
