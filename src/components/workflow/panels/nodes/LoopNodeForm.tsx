import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import type { LoopConfig, WorkflowNodeData, NodeConfig } from '../../types';
import { NodeType, NODE_META_REGISTRY } from '../../types';
import {
  HttpNodeForm,
  ConditionNodeForm,
  SqlNodeForm,
  ScriptNodeForm,
  AssertionNodeForm,
  VariableExtractorNodeForm,
  SleepNodeForm,
  XxlJobNodeForm,
  DubboNodeForm,
  MqNodeForm,
} from './index';
import type {
  HttpConfig,
  SqlConfig,
  ConditionConfig,
  ScriptConfig,
  AssertionConfig,
  VariableExtractorConfig,
  SleepConfig,
  XxlJobConfig,
  DubboConfig,
  MqConfig,
} from '../../types';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Globe,
  Database,
  GitBranch,
  Code,
  MessageSquare,
  Zap,
  Variable,
  Repeat,
  Play,
  Square,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface LoopNodeFormProps {
  config: LoopConfig;
  onChange: (config: LoopConfig) => void;
  projectId?: string; // 项目ID，用于子节点编辑时获取环境配置
}

// 节点图标映射
const NODE_ICONS: Partial<Record<NodeType, React.ComponentType<{ className?: string }>>> = {
  [NodeType.START]: Play,
  [NodeType.END]: Square,
  [NodeType.HTTP_REQUEST]: Globe,
  [NodeType.DUBBO]: Zap,
  [NodeType.MYSQL]: Database,
  [NodeType.CONDITION]: GitBranch,
  [NodeType.LOOP]: Repeat,
  [NodeType.SCRIPT]: Code,
  [NodeType.VARIABLE_EXTRACTOR]: Variable,
  [NodeType.COMMENT]: MessageSquare,
  [NodeType.LOG_MESSAGE]: MessageSquare,
  [NodeType.ASSERTION]: CheckCircle2,
  [NodeType.ROCKETMQ]: MessageSquare,
  [NodeType.SUB_WORKFLOW]: MessageSquare,
  [NodeType.REDIS]: Database,
  [NodeType.MONGODB]: Database,
  [NodeType.OSS]: MessageSquare,
  [NodeType.XXLJOB]: Clock,
  [NodeType.SLEEP]: Clock,
  [NodeType.UI_BROWSER]: MessageSquare,
  [NodeType.UI_ELEMENT]: MessageSquare,
  [NodeType.UI_NAVIGATION]: MessageSquare,
  [NodeType.UI_SCREENSHOT]: MessageSquare,
  [NodeType.UI_WAIT]: MessageSquare,
  [NodeType.UI_VALIDATION]: MessageSquare,
  [NodeType.UI_ACTION]: MessageSquare,
  [NodeType.UI_RECORDING]: MessageSquare,
  [NodeType.UI_ADVANCED]: MessageSquare,
};

// 可用的子节点类型（循环内不能嵌套循环，避免无限递归）
const ALLOWED_SUB_NODE_TYPES: NodeType[] = [
  NodeType.HTTP_REQUEST,
  NodeType.DUBBO,
  NodeType.ROCKETMQ,
  NodeType.MYSQL,
  NodeType.CONDITION,
  NodeType.SCRIPT,
  NodeType.VARIABLE_EXTRACTOR,
  NodeType.ASSERTION,
  NodeType.SLEEP,
  NodeType.LOG_MESSAGE,
  NodeType.COMMENT,
];

export const LoopNodeForm: React.FC<LoopNodeFormProps> = ({ config, onChange, projectId }) => {
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [editingSubNodeIndex, setEditingSubNodeIndex] = useState<number | null>(null);

  const subNodes = (config.sub_nodes || []) as WorkflowNodeData[];

  const updateConfig = (updates: Partial<LoopConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleAddSubNode = (nodeType: NodeType) => {
    const meta = NODE_META_REGISTRY[nodeType];
    if (!meta) return;

    const newSubNode: WorkflowNodeData = {
      id: `sub-node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType,
      name: meta.name,
      description: meta.description,
      config: meta.defaultConfig || {},
      x: 0,
      y: 0,
    };

    updateConfig({
      sub_nodes: [...subNodes, newSubNode],
    });
    setIsAddNodeDialogOpen(false);
  };

  const handleDeleteSubNode = (index: number) => {
    const newSubNodes = subNodes.filter((_, i) => i !== index);
    updateConfig({ sub_nodes: newSubNodes });
  };

  const handleMoveSubNode = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === subNodes.length - 1) return;

    const newSubNodes = [...subNodes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSubNodes[index], newSubNodes[targetIndex]] = [newSubNodes[targetIndex], newSubNodes[index]];
    updateConfig({ sub_nodes: newSubNodes });
  };

  const handleUpdateSubNode = (index: number, updates: Partial<WorkflowNodeData>) => {
    const newSubNodes = [...subNodes];
    newSubNodes[index] = { ...newSubNodes[index], ...updates };
    updateConfig({ sub_nodes: newSubNodes });
  };

  return (
    <div className="space-y-0">
      <Section title="循环类型">
        <div className="space-y-2">
          <FormLabel required>循环类型</FormLabel>
          <Select
            value={config.loop_type || 'count_loop'}
            onValueChange={(value) => updateConfig({ loop_type: value as LoopConfig['loop_type'] })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count_loop">次数循环</SelectItem>
              <SelectItem value="while_loop">条件循环</SelectItem>
              <SelectItem value="foreach_loop">遍历循环</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {config.loop_type === 'count_loop' && (
        <Section title="循环次数">
          <div className="space-y-2">
            <FormLabel required>循环次数</FormLabel>
            <Input
              placeholder="10"
              value={config.count !== undefined ? String(config.count) : ''}
              onChange={(e) => updateConfig({ count: e.target.value ? Number(e.target.value) : undefined })}
              className={INPUT_STYLE}
              type="number"
              autoComplete="off"
            />
          </div>
        </Section>
      )}

      {config.loop_type === 'while_loop' && (
        <>
          <Section title="条件表达式">
            <div className="space-y-2">
              <FormLabel required>条件表达式</FormLabel>
              <Textarea
                placeholder="count < 10 && status == 'running'"
                value={config.condition || ''}
                onChange={(e) => updateConfig({ condition: e.target.value })}
                className={cn("min-h-[80px]", TEXTAREA_STYLE)}
              />
            </div>
          </Section>
          <Section title="最大迭代次数" defaultOpen={false}>
            <div className="space-y-2">
              <FormLabel>最大迭代次数</FormLabel>
              <Input
                placeholder="100"
                value={config.max_iterations !== undefined ? String(config.max_iterations) : ''}
                onChange={(e) => updateConfig({ max_iterations: e.target.value ? Number(e.target.value) : undefined })}
                className={INPUT_STYLE}
                type="number"
                autoComplete="off"
              />
            </div>
          </Section>
        </>
      )}

      {config.loop_type === 'foreach_loop' && (
        <>
          <Section title="遍历集合">
            <div className="space-y-2">
              <FormLabel required>遍历集合</FormLabel>
              <Input
                placeholder="${items} 或 [1, 2, 3]"
                value={typeof config.items === 'string' ? config.items : (config.items ? JSON.stringify(config.items) : '')}
                onChange={(e) => {
                  const value = e.target.value;
                  try {
                    const parsed = JSON.parse(value);
                    updateConfig({ items: parsed });
                  } catch {
                    updateConfig({ items: value });
                  }
                }}
                className={cn(INPUT_STYLE, "font-mono")}
                autoComplete="off"
              />
            </div>
          </Section>
          <Section title="项目变量名" defaultOpen={false}>
            <div className="space-y-2">
              <FormLabel>项目变量名</FormLabel>
              <Input
                placeholder="item"
                value={config.item_variable || ''}
                onChange={(e) => updateConfig({ item_variable: e.target.value })}
                className={INPUT_STYLE}
                autoComplete="off"
              />
            </div>
          </Section>
          <Section title="索引变量名" defaultOpen={false}>
            <div className="space-y-2">
              <FormLabel>索引变量名</FormLabel>
              <Input
                placeholder="index"
                value={config.index_variable || ''}
                onChange={(e) => updateConfig({ index_variable: e.target.value })}
                className={INPUT_STYLE}
                autoComplete="off"
              />
            </div>
          </Section>
        </>
      )}

      <Section title="循环延迟（秒）" defaultOpen={false}>
        <div className="space-y-2">
          <FormLabel>循环延迟（秒）</FormLabel>
          <Input
            placeholder="0.1"
            value={config.delay !== undefined ? String(config.delay) : ''}
            onChange={(e) => updateConfig({ delay: e.target.value ? Number(e.target.value) : undefined })}
            className={INPUT_STYLE}
            type="number"
            step="0.1"
            autoComplete="off"
          />
        </div>
      </Section>

      <Section title="子节点列表">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>循环内执行的子节点</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddNodeDialogOpen(true)}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加子节点
            </Button>
          </div>

          {subNodes.length === 0 ? (
            <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-lg">
              暂无子节点，点击"添加子节点"添加
            </div>
          ) : (
            <div className="space-y-2">
              {subNodes.map((subNode, index) => (
                <div
                  key={subNode.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {(() => {
                      const IconComponent = NODE_ICONS[subNode.type] || Globe;
                      const meta = NODE_META_REGISTRY[subNode.type];
                      if (!IconComponent) {
                        return null;
                      }
                      return (
                        <>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: meta?.color || '#9CA3AF' }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <TruncateWithTooltip className="text-sm font-medium text-gray-900 block">
                              {subNode.name}
                            </TruncateWithTooltip>
                            <TruncateWithTooltip className="text-xs text-gray-500 block">
                              {meta?.name || subNode.type}
                            </TruncateWithTooltip>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => setEditingSubNodeIndex(index)}
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveSubNode(index, 'up')}
                      disabled={index === 0}
                      title="上移"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveSubNode(index, 'down')}
                      disabled={index === subNodes.length - 1}
                      title="下移"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteSubNode(index)}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* 添加子节点对话框 */}
      <Dialog open={isAddNodeDialogOpen} onOpenChange={setIsAddNodeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>添加子节点</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="grid grid-cols-2 gap-2">
              {ALLOWED_SUB_NODE_TYPES.map((nodeType) => {
                const meta = NODE_META_REGISTRY[nodeType];
                const IconComponent = NODE_ICONS[nodeType] || Globe;
                if (!meta || !IconComponent) {
                  return null;
                }
                return (
                  <button
                    key={nodeType}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg",
                      "hover:bg-gray-50 transition-colors text-left",
                      "border border-transparent hover:border-gray-200"
                    )}
                    onClick={() => handleAddSubNode(nodeType)}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: meta.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <TruncateWithTooltip className="text-sm font-medium text-gray-900 block">
                        {meta.name}
                      </TruncateWithTooltip>
                      <TruncateWithTooltip className="text-xs text-gray-500 block" content={meta.description}>
                        {meta.description}
                      </TruncateWithTooltip>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 编辑子节点对话框 */}
      {editingSubNodeIndex !== null && (() => {
        // 使用最新的 config.sub_nodes 数据，而不是闭包中的 subNodes
        const currentSubNodes = (config.sub_nodes || []) as WorkflowNodeData[];
        const editingSubNode = currentSubNodes[editingSubNodeIndex];
        if (!editingSubNode) return null;

        const meta = NODE_META_REGISTRY[editingSubNode.type];

        const handleSubNodeConfigChange = (newConfig: NodeConfig) => {
          handleUpdateSubNode(editingSubNodeIndex, { config: newConfig });
        };

        const handleSubNodeNameChange = (newName: string) => {
          handleUpdateSubNode(editingSubNodeIndex, { name: newName });
        };

        const renderSubNodeForm = () => {
          switch (editingSubNode.type) {
            case NodeType.HTTP_REQUEST:
              return (
                <HttpNodeForm
                  config={editingSubNode.config as HttpConfig}
                  onChange={handleSubNodeConfigChange}
                  projectId={projectId}
                />
              );
            case NodeType.MYSQL:
              return (
                <SqlNodeForm
                  config={editingSubNode.config as SqlConfig}
                  onChange={handleSubNodeConfigChange}
                  projectId={projectId}
                />
              );
            case NodeType.CONDITION:
              return (
                <ConditionNodeForm
                  config={editingSubNode.config as ConditionConfig}
                  onChange={handleSubNodeConfigChange}
                />
              );
            case NodeType.SCRIPT:
              return (
                <ScriptNodeForm
                  config={editingSubNode.config as ScriptConfig}
                  onChange={handleSubNodeConfigChange}
                />
              );
            case NodeType.ASSERTION:
              return (
                <AssertionNodeForm
                  config={editingSubNode.config as AssertionConfig}
                  onChange={handleSubNodeConfigChange}
                />
              );
            case NodeType.VARIABLE_EXTRACTOR:
              return (
                <VariableExtractorNodeForm
                  config={editingSubNode.config as VariableExtractorConfig}
                  onChange={handleSubNodeConfigChange}
                />
              );
            case NodeType.SLEEP:
              return (
                <SleepNodeForm
                  config={editingSubNode.config as SleepConfig}
                  onChange={handleSubNodeConfigChange}
                />
              );
            case NodeType.XXLJOB:
              return (
                <XxlJobNodeForm
                  config={editingSubNode.config as XxlJobConfig}
                  onChange={handleSubNodeConfigChange}
                  projectId={projectId}
                />
              );
            case NodeType.DUBBO:
              return (
                <DubboNodeForm
                  config={editingSubNode.config as DubboConfig}
                  onChange={handleSubNodeConfigChange}
                  projectId={projectId}
                />
              );
            case NodeType.ROCKETMQ:
              return (
                <MqNodeForm
                  config={editingSubNode.config as MqConfig}
                  onChange={handleSubNodeConfigChange}
                  projectId={projectId}
                />
              );
            default:
              return (
                <div className="p-4 text-center text-gray-500">
                  该节点类型暂不支持编辑
                </div>
              );
          }
        };

        return (
          <Dialog open={editingSubNodeIndex !== null} onOpenChange={(open) => !open && setEditingSubNodeIndex(null)}>
            <style>{`
              [data-slot="dialog-content"] button[data-slot="dialog-close"] {
                top: 1rem !important;
                right: 1rem !important;
              }
            `}</style>
            <DialogContent
              className="max-w-3xl h-[85vh] flex flex-col p-0"
              onOpenAutoFocus={(e) => e.preventDefault()}
              aria-describedby={undefined}
            >
              <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
                <DialogTitle className="sr-only">编辑子节点</DialogTitle>
                <div className="flex items-center gap-3">
                  {(() => {
                    const IconComponent = NODE_ICONS[editingSubNode.type] || Globe;
                    return IconComponent ? (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: meta?.color || '#9CA3AF' }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                    ) : null;
                  })()}
                  <div className="flex-1">
                    <Input
                      value={editingSubNode.name}
                      onChange={(e) => handleSubNodeNameChange(e.target.value)}
                      className="font-medium text-gray-900 text-base h-9 border-2 border-gray-300 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 transition-all"
                      autoComplete="off"
                      autoFocus={false}
                    />
                    <div className="text-xs text-gray-500 mt-1">{meta?.name}</div>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full px-6 py-4">
                  {renderSubNodeForm()}
                </ScrollArea>
              </div>
              <div className="px-6 py-3 border-t border-gray-100 flex justify-end shrink-0">
                <Button
                  onClick={() => setEditingSubNodeIndex(null)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  完成
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
};

