/**
 * 节点分类常量
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { Globe, Database, GitBranch, Repeat, Clock, Variable, Code, CheckCircle2, MessageSquare, Zap } from 'lucide-react';
import { NodeType } from '@/components/workflow';
import type { NodeCategory } from '../types';

/**
 * 节点分类列表
 */
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'api',
    name: 'API 请求',
    icon: <Globe className="w-4 h-4" />,
    nodes: [
      { type: NodeType.HTTP_REQUEST, name: 'HTTP 请求', description: 'HTTP API 调用', icon: <Globe className="w-4 h-4" /> },
      { type: NodeType.DUBBO, name: 'Dubbo 调用', description: 'Dubbo RPC 调用', icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    id: 'data',
    name: '数据操作',
    icon: <Database className="w-4 h-4" />,
    nodes: [
      { type: NodeType.MYSQL, name: 'SQL 查询', description: '数据库操作', icon: <Database className="w-4 h-4" /> },
    ],
  },
  {
    id: 'logic',
    name: '逻辑控制',
    icon: <GitBranch className="w-4 h-4" />,
    nodes: [
      { type: NodeType.CONDITION, name: '条件判断', description: '条件分支节点', icon: <GitBranch className="w-4 h-4" /> },
      { type: NodeType.LOOP, name: '循环', description: '循环执行节点', icon: <Repeat className="w-4 h-4" /> },
      { type: NodeType.SUB_WORKFLOW, name: '引用子工作流', description: '引用并执行其他工作流', icon: <GitBranch className="w-4 h-4" /> },
      { type: NodeType.SLEEP, name: '休眠', description: '暂停指定时间', icon: <Clock className="w-4 h-4" /> },
      { type: NodeType.VARIABLE_EXTRACTOR, name: '变量提取', description: '提取变量', icon: <Variable className="w-4 h-4" /> },
      { type: NodeType.ASSERTION, name: '断言', description: '断言验证', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
  {
    id: 'script',
    name: '脚本执行',
    icon: <Code className="w-4 h-4" />,
    nodes: [
      { type: NodeType.SCRIPT, name: '脚本执行', description: '执行自定义脚本', icon: <Code className="w-4 h-4" /> },
    ],
  },
  {
    id: 'other',
    name: '其他节点',
    icon: <MessageSquare className="w-4 h-4" />,
    nodes: [
      { type: NodeType.XXLJOB, name: 'XXL-Job', description: '任务调度', icon: <Clock className="w-4 h-4" /> },
      { type: NodeType.ROCKETMQ, name: 'RocketMQ', description: '消息队列', icon: <MessageSquare className="w-4 h-4" /> },
    ],
  },
];
