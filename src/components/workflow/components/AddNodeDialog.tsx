/**
 * 添加节点对话框组件
 * 按照分类显示所有可用的节点类型
 */
import React, { useState, useMemo } from 'react';
import { Search, Globe, Database, GitBranch, Code, MessageSquare, Zap, Wifi, Variable, Repeat, Play, Square, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NodeType, NODE_META_REGISTRY } from '../types';
import { cn } from '@/utils/cn';

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNode: (nodeType: NodeType) => void;
}

interface NodeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  nodeTypes: NodeType[];
}

const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'basic',
    name: '基础节点',
    icon: <Play className="w-4 h-4" />,
    nodeTypes: [NodeType.START, NodeType.END],
  },
  {
    id: 'api',
    name: 'API 请求',
    icon: <Globe className="w-4 h-4" />,
    nodeTypes: [NodeType.HTTP_REQUEST, NodeType.DUBBO],
  },
  {
    id: 'data',
    name: '数据操作',
    icon: <Database className="w-4 h-4" />,
    nodeTypes: [NodeType.MYSQL],
  },
  {
    id: 'logic',
    name: '逻辑控制',
    icon: <GitBranch className="w-4 h-4" />,
    nodeTypes: [NodeType.CONDITION, NodeType.LOOP, NodeType.VARIABLE_EXTRACTOR, NodeType.ASSERTION],
  },
  {
    id: 'script',
    name: '脚本执行',
    icon: <Code className="w-4 h-4" />,
    nodeTypes: [NodeType.SCRIPT],
  },
  {
    id: 'comment',
    name: '注释',
    icon: <MessageSquare className="w-4 h-4" />,
    nodeTypes: [NodeType.COMMENT],
  },
  {
    id: 'other',
    name: '其他节点',
    icon: <MessageSquare className="w-4 h-4" />,
    nodeTypes: [NodeType.XXLJOB, NodeType.ROCKETMQ, NodeType.SLEEP],
  },
];

// 使用 NODE_META_REGISTRY 中的图标，而不是硬编码
const NODE_ICONS: Record<NodeType, React.ReactNode> = {
  [NodeType.START]: <Play className="w-4 h-4" />,
  [NodeType.END]: <Square className="w-4 h-4" />,
  [NodeType.HTTP_REQUEST]: <Globe className="w-4 h-4" />,
  [NodeType.DUBBO]: <Zap className="w-4 h-4" />,
  [NodeType.MYSQL]: <Database className="w-4 h-4" />,
  [NodeType.CONDITION]: <GitBranch className="w-4 h-4" />,
  [NodeType.LOOP]: <Repeat className="w-4 h-4" />,
  [NodeType.SCRIPT]: <Code className="w-4 h-4" />,
  [NodeType.VARIABLE_EXTRACTOR]: <Variable className="w-4 h-4" />,
  [NodeType.COMMENT]: <MessageSquare className="w-4 h-4" />,
  // 其他节点类型使用默认图标
  [NodeType.LOG_MESSAGE]: <MessageSquare className="w-4 h-4" />,
  [NodeType.ASSERTION]: <CheckCircle2 className="w-4 h-4" />,
  [NodeType.ROCKETMQ]: <MessageSquare className="w-4 h-4" />,
  [NodeType.SUB_WORKFLOW]: <MessageSquare className="w-4 h-4" />,
  [NodeType.REDIS]: <Database className="w-4 h-4" />,
  [NodeType.MONGODB]: <Database className="w-4 h-4" />,
  [NodeType.OSS]: <MessageSquare className="w-4 h-4" />,
  [NodeType.XXLJOB]: <Clock className="w-4 h-4" />,
  [NodeType.SLEEP]: <Clock className="w-4 h-4" />,
  [NodeType.UI_BROWSER]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_ELEMENT]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_NAVIGATION]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_SCREENSHOT]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_WAIT]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_VALIDATION]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_ACTION]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_RECORDING]: <MessageSquare className="w-4 h-4" />,
  [NodeType.UI_ADVANCED]: <MessageSquare className="w-4 h-4" />,
};

export const AddNodeDialog: React.FC<AddNodeDialogProps> = ({
  open,
  onOpenChange,
  onSelectNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤节点
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return NODE_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    return NODE_CATEGORIES.map(category => {
      const filteredTypes = category.nodeTypes.filter(nodeType => {
        const meta = NODE_META_REGISTRY[nodeType];
        return (
          meta.name.toLowerCase().includes(query) ||
          meta.description.toLowerCase().includes(query)
        );
      });

      if (filteredTypes.length === 0) {
        return null;
      }

      return {
        ...category,
        nodeTypes: filteredTypes,
      };
    }).filter(Boolean) as NodeCategory[];
  }, [searchQuery]);

  const handleSelectNode = (nodeType: NodeType) => {
    onSelectNode(nodeType);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>添加节点</DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索节点、插件、工作流"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="text-gray-400">{category.icon}</div>
                  {category.name}
                </div>
                <div className="space-y-1">
                  {category.nodeTypes.map((nodeType) => {
                    const meta = NODE_META_REGISTRY[nodeType];
                    return (
                      <button
                        key={nodeType}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                          "hover:bg-gray-50 transition-colors text-left",
                          "border border-transparent hover:border-gray-200"
                        )}
                        onClick={() => handleSelectNode(nodeType)}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: meta.color }}
                        >
                          {NODE_ICONS[nodeType]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {meta.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {meta.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

