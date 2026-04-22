/**
 * 节点编辑面板
 * 参考 Coze Studio 的右侧编辑面板设计
 */
import React, { useState, useEffect } from 'react';
import { X, Play, Save, Code, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  NodeType, 
  type WorkflowNodeData, 
  type NodeConfig,
  type HttpConfig,
  type SqlConfig,
  type ConditionConfig,
  type ScriptConfig,
  type AssertionConfig,
  type XxlJobConfig,
  type MqConfig,
  type LoopConfig,
  type SleepConfig,
  type DubboConfig,
  type VariableExtractorConfig,
  type SubWorkflowConfig,
  NODE_META_REGISTRY,
} from '../types';
import { 
  HttpNodeForm, 
  ConditionNodeForm, 
  SqlNodeForm,
  ScriptNodeForm,
  AssertionNodeForm,
  VariableExtractorNodeForm,
  LoopNodeForm,
  SleepNodeForm,
  XxlJobNodeForm,
  DubboNodeForm,
  MqNodeForm,
  SubWorkflowNodeForm,
} from './nodes';

interface NodeFormPanelProps {
  node: WorkflowNodeData | null;
  onClose: () => void;
  onChange: (nodeId: string, config: NodeConfig) => void;
  onNameChange: (nodeId: string, name: string) => void;
  onSave?: (nodeId: string) => void;
  projectId?: string; // 项目ID，用于获取环境配置与工作流列表
  moduleId?: string; // 模块ID，用于筛选当前项目下的工作流列表
  onDebugNode?: (nodeId: string) => void; // 调试节点回调
}


// 主面板组件
export const NodeFormPanel: React.FC<NodeFormPanelProps> = ({
  node,
  onClose,
  onChange,
  onNameChange,
  onSave,
  projectId,
  moduleId,
  onDebugNode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // 当节点变化时，重置编辑状态
  useEffect(() => {
    setIsEditingName(false);
    setTempName('');
  }, [node?.id]);

  if (!node) {
    return null;
  }

  const meta = NODE_META_REGISTRY[node.type];

  const handleConfigChange = (config: NodeConfig) => {
    onChange(node.id, config);
  };

  // 根据节点类型渲染对应的表单
  const renderForm = () => {
    switch (node.type) {
      case NodeType.HTTP_REQUEST:
        return (
          <HttpNodeForm
            config={node.config as HttpConfig}
            onChange={handleConfigChange}
            projectId={projectId}
          />
        );
      case NodeType.MYSQL:
        return (
          <SqlNodeForm
            config={node.config as SqlConfig}
            onChange={handleConfigChange}
            projectId={projectId}
          />
        );
      case NodeType.CONDITION:
        return (
          <ConditionNodeForm
            config={node.config as ConditionConfig}
            onChange={handleConfigChange}
          />
        );
      case NodeType.SCRIPT:
        return (
          <ScriptNodeForm
            config={node.config as ScriptConfig}
            onChange={handleConfigChange}
          />
        );
      case NodeType.ASSERTION:
        return (
          <AssertionNodeForm
            config={node.config as AssertionConfig}
            onChange={handleConfigChange}
          />
        );
      case NodeType.XXLJOB:
        return (
          <XxlJobNodeForm
            config={node.config as XxlJobConfig}
            onChange={handleConfigChange}
            projectId={projectId}
          />
        );
      case NodeType.ROCKETMQ:
        return (
          <MqNodeForm
            config={node.config as MqConfig}
            onChange={handleConfigChange}
            projectId={projectId}
          />
        );
      case NodeType.VARIABLE_EXTRACTOR:
        return (
          <VariableExtractorNodeForm
            config={node.config as VariableExtractorConfig}
            onChange={handleConfigChange}
          />
        );
      case NodeType.LOOP:
        return (
          <LoopNodeForm
            config={node.config as LoopConfig}
            onChange={handleConfigChange}
            projectId={projectId}
          />
        );
      case NodeType.SLEEP:
        return (
          <SleepNodeForm
            config={node.config as SleepConfig}
            onChange={handleConfigChange}
          />
        );
      case NodeType.DUBBO:
        return (
          <DubboNodeForm
            config={node.config as DubboConfig}
            onChange={handleConfigChange}
            projectId={projectId}
          />
        );
      case NodeType.SUB_WORKFLOW:
        return (
          <SubWorkflowNodeForm
            config={node.config as SubWorkflowConfig}
            onChange={handleConfigChange}
            projectId={projectId}
            moduleId={moduleId}
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
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* 头部 */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: `${meta?.color}10` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: meta?.color }}
          >
            <Code className="w-4 h-4 text-white" />
          </div>
          <div>
            {isEditingName ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  if (tempName.trim()) {
                    onNameChange(node.id, tempName.trim());
                  }
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tempName.trim()) {
                      onNameChange(node.id, tempName.trim());
                    }
                    setIsEditingName(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setTempName(node.name);
                  }
                }}
                className="font-medium text-gray-900 text-sm h-8 border-2 border-gray-300 bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-2 -ml-1 transition-all cursor-text"
                autoComplete="off"
                autoFocus
              />
            ) : (
              <div
                onClick={() => {
                  setTempName(node.name);
                  setIsEditingName(true);
                }}
                className="font-medium text-gray-900 text-sm h-8 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors -ml-1 px-2 rounded"
              >
                {node.name || (
                  <span className="text-gray-400 flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>点击编辑标题</span>
                  </span>
                )}
              </div>
            )}
            <Badge 
              variant="secondary" 
              className="text-xs mt-1"
              style={{ 
                backgroundColor: `${meta?.color}15`,
                color: meta?.color,
                borderColor: `${meta?.color}40`
              }}
            >
              {meta?.name}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 表单内容 */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
        {renderForm()}
        </div>
      </ScrollArea>

      {/* 底部操作栏 */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            if (node && onDebugNode) {
              onDebugNode(node.id);
            }
          }}
        >
          <Play className="w-3 h-3 mr-1" />
          调试节点
        </Button>
        <Button
          size="sm"
          className="text-xs bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            if (node && onSave) {
              onSave(node.id);
            }
          }}
        >
          <Save className="w-3 h-3 mr-1" />
          保存
        </Button>
      </div>
    </div>
  );
};

export default NodeFormPanel;

