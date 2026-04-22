/**
 * 节点渲染组件
 * 参考 Coze Studio 的节点样式
 */
import React, { useState } from 'react';
import { 
  Globe, 
  Database, 
  Code, 
  Wifi, 
  GitBranch, 
  Repeat, 
  Zap,
  Play,
  Square,
  Variable,
  Trash2,
  Copy,
  MoreHorizontal,
  Star,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { NodeType, type WorkflowNodeData, NODE_META_REGISTRY, type HttpConfig, type SqlConfig, type ConditionConfig, type LoopConfig } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Database,
  Code,
  Wifi,
  GitBranch,
  Repeat,
  Zap,
  Play,
  Square,
  Variable,
};

interface NodeRendererProps {
  node: WorkflowNodeData;
  selected?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void; // 双击事件，用于打开编辑面板
  onDelete?: () => void;
  onCopy?: () => void;
  onSaveToPublic?: () => void;
  onConnectionStart?: (nodeId: string, portType: 'input' | 'output', options?: { conditionBranch?: 'true' | 'false' }) => void;
  onConnectionEnd?: (nodeId: string) => void;
  isConnecting?: boolean;
  onDebugNode?: (nodeId: string) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  selected,
  onSelect,
  onDoubleClick,
  onDelete,
  onCopy,
  onSaveToPublic,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  onDebugNode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = NODE_META_REGISTRY[node.type];
  const IconComponent = ICON_MAP[meta?.icon] || Globe;
  
  // 检查是否是循环节点且有子节点
  const isLoopNode = node.type === NodeType.LOOP;
  const loopConfig = isLoopNode ? (node.config as LoopConfig) : null;
  const subNodes = loopConfig?.sub_nodes || [];
  const hasSubNodes = subNodes.length > 0;
  
  // 获取节点的主要信息用于展示
  const getNodePreview = () => {
    switch (node.type) {
      case NodeType.HTTP_REQUEST: {
        const config = node.config as HttpConfig;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">请求配置</div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                {config?.method || 'GET'}
              </span>
              <TruncateWithTooltip className="text-xs text-gray-600 flex-1" content={config?.url || '请输入URL'}>
                {config?.url || '请输入URL'}
              </TruncateWithTooltip>
            </div>
          </div>
        );
      }
      case NodeType.MYSQL: {
        const config = node.config as SqlConfig;
        // SQL 预览：优先展示 SELECT 模式下的 sql，其次展示非 SELECT 模式下 sql_list 中第一条非空 SQL
        const sqlFromSelect = typeof config?.sql === 'string' ? config.sql.trim() : '';
        const sqlFromList =
          Array.isArray(config?.sql_list) && config.sql_list.length > 0
            ? (config.sql_list.find((s) => typeof s === 'string' && s.trim() !== '') || '')
            : '';
        const previewSql = sqlFromSelect || sqlFromList || 'SELECT * FROM ...';
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">SQL 语句</div>
            <TruncateWithTooltip className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-2 font-mono block" content={previewSql}>
              {previewSql}
            </TruncateWithTooltip>
          </div>
        );
      }
      case NodeType.CONDITION: {
        const config = node.config as ConditionConfig;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">条件表达式</div>
            <div className="text-xs text-gray-600 bg-yellow-50 rounded px-2 py-2 font-mono border border-yellow-200">
              {config?.expression || 'response.code == 200'}
            </div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">true 分支</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-600">false 分支</span>
              </div>
            </div>
          </div>
        );
      }
      case NodeType.SCRIPT: {
        const config = node.config as any;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">脚本代码</div>
            <TruncateWithTooltip className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-2 font-mono block" content={config?.script || node.description || '// 自定义脚本'}>
              {config?.script || node.description || '// 自定义脚本'}
            </TruncateWithTooltip>
          </div>
        );
      }
      case NodeType.LOOP: {
        const config = node.config as LoopConfig;
        const subNodes = config?.sub_nodes || [];
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">循环配置</div>
            <div className="text-xs text-gray-600 bg-pink-50 rounded px-2 py-1 border border-pink-200">
              {config?.loop_type === 'count_loop' && `次数循环: ${config.count || 0} 次`}
              {config?.loop_type === 'while_loop' && `条件循环: ${config.condition || '未设置'}`}
              {config?.loop_type === 'foreach_loop' && `遍历循环: ${Array.isArray(config.items) ? config.items.length : '变量'} 项`}
            </div>
            {hasSubNodes && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>子节点: {subNodes.length} 个</span>
              </div>
            )}
          </div>
        );
      }
      default:
        return (
          <div className="text-xs text-gray-500">
            {node.description || meta?.description || '点击配置'}
          </div>
        );
    }
  };

  // 节点边框颜色
  const borderColor = selected ? meta?.color : '#E5E7EB';

  return (
    <div
      className={cn(
        "workflow-node bg-white rounded-xl shadow-lg border-2 transition-all duration-200",
        "min-w-[280px] max-w-[320px]",
        selected && "ring-2 ring-offset-2",
        !selected && "hover:shadow-xl"
      )}
      style={{ 
        borderColor,
        ...(selected && { ringColor: meta?.color })
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
    >
      {/* 输入连接点：小圆视觉 w-2 h-2，外层大热区便于松手连上（无需对准） */}
      {node.type !== NodeType.START && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center cursor-pointer"
          style={{ top: -16, width: 32, height: 32 }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onConnectionEnd?.(node.id);
          }}
          title="输入（松手完成连线）"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full border border-white shadow pointer-events-none hover:scale-125 transition-transform" />
        </div>
      )}

      {/* 节点头部 */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: `${meta?.color}10` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: meta?.color }}
          >
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">{node.name}</div>
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
        
        {/* 操作按钮 */}
        {selected && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                onCopy?.();
              }}
              title="复制节点"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-yellow-50 hover:text-yellow-600"
              onClick={(e) => {
                e.stopPropagation();
                onSaveToPublic?.();
              }}
              title="保存到公共节点"
            >
              <Star className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              title="删除节点"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 节点内容 */}
      <div className="p-4">
        {getNodePreview()}
        
        {/* 循环节点的子节点折叠/展开 */}
        {isLoopNode && hasSubNodes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              className="flex items-center gap-2 w-full text-xs text-gray-600 hover:text-gray-900 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>子节点列表 ({subNodes.length})</span>
            </button>
            
            {isExpanded && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {subNodes.map((subNode, index) => {
                  const subMeta = NODE_META_REGISTRY[subNode.type];
                  const SubIconComponent = ICON_MAP[subMeta?.icon] || Globe;
                  return (
                    <div
                      key={subNode.id}
                      className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded text-xs border border-gray-200"
                    >
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: subMeta?.color || '#9CA3AF' }}
                      >
                        <SubIconComponent className="w-3 h-3" />
                      </div>
                      <TruncateWithTooltip className="text-gray-700 font-medium flex-1" content={`${index + 1}. ${subNode.name}`}>
                        {index + 1}. {subNode.name}
                      </TruncateWithTooltip>
                      <span className="text-gray-500 text-xs shrink-0">
                        {subMeta?.name || subNode.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部调试按钮 */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
          onClick={(e) => {
            e.stopPropagation();
            if (onDebugNode) {
              onDebugNode(node.id);
            }
          }}
        >
          <Play className="w-3 h-3 mr-1" />
          调试节点
        </Button>
      </div>

      {/* 输出连接点：小圆视觉 w-2 h-2，外层大热区便于悬停/拖拽时稳定显示手型 */}
      {node.type !== NodeType.END && (
        node.type === NodeType.CONDITION ? (
          <>
            <div
              className="absolute z-10 flex items-center justify-center cursor-pointer"
              style={{ bottom: -24, left: '33.33%', transform: 'translate(-50%, 0)', width: 32, height: 32 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onConnectionStart?.(node.id, 'output', { conditionBranch: 'true' });
              }}
              title="true 分支"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full border border-white shadow pointer-events-none hover:scale-125 transition-transform" />
            </div>
            <div
              className="absolute z-10 flex items-center justify-center cursor-pointer"
              style={{ bottom: -24, left: '66.67%', transform: 'translate(-50%, 0)', width: 32, height: 32 }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onConnectionStart?.(node.id, 'output', { conditionBranch: 'false' });
              }}
              title="false 分支"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow pointer-events-none hover:scale-125 transition-transform" />
            </div>
          </>
        ) : (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center cursor-pointer"
            style={{ bottom: -24, width: 32, height: 32 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onConnectionStart?.(node.id, 'output');
            }}
            title="输出"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full border border-white shadow pointer-events-none hover:scale-125 transition-transform" />
          </div>
        )
      )}
    </div>
  );
};

export default NodeRenderer;

