/**
 * AI助理页面
 * 路由: /ai-assistant
 * 这是与路由对应的顶层页面组件
 */

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lightbulb,
  Code,
  AlertCircle,
  CheckCircle2,
  Zap,
  MessageSquare,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Search,
  Trash2,
  X,
  Settings,
  Plug,
  Globe,
  Folder,
  GitBranch,
  Database,
  Cloud,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ComingSoon } from '@/components/common/ComingSoon';

// 功能开关：是否显示"即将开放"占位页面（设置为 true 显示占位页面，false 显示实际功能）
const SHOW_COMING_SOON = true;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  createdAt: Date;
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category?: string;
  connectionUrl?: string;
  apiKey?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

type AIAssistantContext = 'test-factory' | 'realization' | 'data-dashboard' | 'test-report' | 'metadata' | 'general';
interface AIAssistantPageProps {
  currentContext?: AIAssistantContext;
}

export function AIAssistantPage({ currentContext: propCurrentContext = 'general' }: AIAssistantPageProps = {}) {
  // 如果开关打开，显示"即将开放"占位页面
  if (SHOW_COMING_SOON) {
    return (
      <ComingSoon 
        title="AI 助理即将开放"
        description="AI 助理功能正在开发中，敬请期待..."
      />
    );
  }

  const [searchParams] = useSearchParams();
  // 优先使用路由参数，如果不存在则使用 props（向后兼容）
  const routeContext = searchParams.get('context') as AIAssistantContext | null;
  const currentContext: AIAssistantContext = routeContext || propCurrentContext;
  
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [useDeepThinking, setUseDeepThinking] = useState(false);
  const [useInternetSearch, setUseInternetSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 初始化 MCP 工具
  useEffect(() => {
    const initialTools: MCPTool[] = [
      { 
        id: 'browser', 
        name: 'Browser', 
        description: '网页浏览和操作，支持页面导航、截图、交互等功能', 
        enabled: true, 
        category: 'web',
        connectionUrl: 'mcp://browser',
        status: 'connected'
      },
      { 
        id: 'filesystem', 
        name: 'File System', 
        description: '文件系统操作，支持文件读写、目录管理等', 
        enabled: true, 
        category: 'system',
        connectionUrl: 'mcp://filesystem',
        status: 'connected'
      },
      { 
        id: 'github', 
        name: 'GitHub', 
        description: 'GitHub 仓库操作，支持代码查看、提交、PR管理等', 
        enabled: false, 
        category: 'development',
        connectionUrl: '',
        apiKey: '',
        status: 'disconnected'
      },
      { 
        id: 'database', 
        name: 'Database', 
        description: '数据库连接和查询，支持多种数据库类型', 
        enabled: false, 
        category: 'data',
        connectionUrl: '',
        status: 'disconnected'
      },
      { 
        id: 'cloud', 
        name: 'Cloud Services', 
        description: '云服务集成，支持AWS、Azure等云平台操作', 
        enabled: false, 
        category: 'cloud',
        connectionUrl: '',
        apiKey: '',
        status: 'disconnected'
      },
    ];
    setMcpTools(initialTools);
  }, []);

  const handleToggleTool = (toolId: string) => {
    setMcpTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, enabled: !tool.enabled }
        : tool
    ));
  };

  const handleUpdateToolConfig = (toolId: string, field: 'connectionUrl' | 'apiKey', value: string) => {
    setMcpTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, [field]: value }
        : tool
    ));
  };

  const handleTestConnection = async (toolId: string) => {
    const tool = mcpTools.find(t => t.id === toolId);
    if (!tool) return;

    // 模拟测试连接
    setMcpTools(prev => prev.map(t => 
      t.id === toolId 
        ? { ...t, status: 'connected' as const }
        : t
    ));
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'web':
        return <Globe className="w-4 h-4" />;
      case 'system':
        return <Folder className="w-4 h-4" />;
      case 'development':
        return <GitBranch className="w-4 h-4" />;
      case 'data':
        return <Database className="w-4 h-4" />;
      case 'cloud':
        return <Cloud className="w-4 h-4" />;
      default:
        return <Plug className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'web':
        return 'bg-blue-100 text-blue-600';
      case 'system':
        return 'bg-gray-100 text-gray-600';
      case 'development':
        return 'bg-purple-100 text-purple-600';
      case 'data':
        return 'bg-green-100 text-green-600';
      case 'cloud':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 模拟AI回复
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `我理解您的问题："${userMessage.content}"。这是一个很好的问题。让我为您提供一些建议...`,
        timestamp: new Date(),
        suggestions: [
          {
            id: '1',
            label: '生成测试用例',
            icon: <Code className="w-4 h-4" />,
            action: () => {},
          },
          {
            id: '2',
            label: '优化建议',
            icon: <Lightbulb className="w-4 h-4" />,
            action: () => {},
          },
        ],
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      messageCount: 0,
      lastMessage: '',
      createdAt: new Date(),
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    // 这里可以加载对话历史
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex bg-gray-50 min-w-0 overflow-hidden">
      {/* 左侧边栏 - 对话历史 */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <span className="text-gray-900 font-semibold">AI 助理</span>
          </div>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4 text-gray-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>MCP 工具连接设置</DialogTitle>
                <DialogDescription>
                  配置和管理 Model Context Protocol (MCP) 工具连接，扩展AI助手的功能
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* 通用设置 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">深度思考模式</Label>
                      <p className="text-xs text-gray-500 mt-1">启用后AI会进行更深入的思考和分析</p>
                    </div>
                    <Switch
                      checked={useDeepThinking}
                      onCheckedChange={setUseDeepThinking}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">互联网搜索</Label>
                      <p className="text-xs text-gray-500 mt-1">允许AI访问互联网获取最新信息</p>
                    </div>
                    <Switch
                      checked={useInternetSearch}
                      onCheckedChange={setUseInternetSearch}
                    />
                  </div>
                </div>

                <Separator />

                {/* MCP工具列表 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">MCP 工具</Label>
                    <Badge variant="secondary" className="text-xs">
                      {mcpTools.filter(t => t.enabled).length} / {mcpTools.length} 已启用
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {mcpTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getCategoryColor(tool.category)}`}>
                              {getCategoryIcon(tool.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{tool.name}</h4>
                                {tool.status === 'connected' && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                                    <Wifi className="w-3 h-3 mr-1" />
                                    已连接
                                  </Badge>
                                )}
                                {tool.status === 'disconnected' && (
                                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                                    <WifiOff className="w-3 h-3 mr-1" />
                                    未连接
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{tool.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={tool.enabled}
                            onCheckedChange={() => handleToggleTool(tool.id)}
                          />
                        </div>

                        {tool.enabled && (
                          <div className="pl-11 space-y-2 pt-2 border-t border-gray-100">
                            <div>
                              <Label className="text-xs text-gray-600">连接地址</Label>
                              <Input
                                value={tool.connectionUrl || ''}
                                onChange={(e) => handleUpdateToolConfig(tool.id, 'connectionUrl', e.target.value)}
                                placeholder="mcp://tool-name"
                                className="mt-1 text-sm"
                              />
                            </div>
                            {tool.id === 'github' || tool.id === 'cloud' ? (
                              <div>
                                <Label className="text-xs text-gray-600">API Key</Label>
                                <Input
                                  type="password"
                                  value={tool.apiKey || ''}
                                  onChange={(e) => handleUpdateToolConfig(tool.id, 'apiKey', e.target.value)}
                                  placeholder="输入API密钥"
                                  className="mt-1 text-sm"
                                />
                              </div>
                            ) : null}
                            {tool.connectionUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTestConnection(tool.id)}
                                className="w-full mt-2"
                              >
                                测试连接
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 新建对话按钮 */}
        <div className="px-4 py-4 border-b border-gray-200">
          <Button
            onClick={handleNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            开启新对话
          </Button>
        </div>

        {/* 对话历史列表 */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            {/* 搜索框 */}
            {conversations.length > 0 && (
              <div className="mb-2 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索对话..."
                  className="bg-gray-50 border-gray-200 pl-8 text-sm"
                />
              </div>
            )}

            {/* 对话列表 */}
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`p-2 rounded-lg cursor-pointer mb-1 flex items-center justify-between group ${
                  currentConversationId === conv.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500">{conv.messageCount} 条消息</p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧主内容区域 */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Context Badge */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 bg-gray-50">
          <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-blue-600 border-blue-200">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs">
              {currentContext === 'test-factory' && '测试工厂'}
              {currentContext === 'realization' && '用例实现'}
              {currentContext === 'data-dashboard' && '数据大屏'}
              {currentContext === 'test-report' && '测试报告'}
              {currentContext === 'metadata' && '元数据管理'}
              {currentContext === 'general' && '通用助手'}
            </span>
          </Badge>
        </div>

        {/* 消息列表 */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 智能助手</h3>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                  我可以帮助您进行测试用例生成、代码优化、问题解答等。请告诉我您需要什么帮助？
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  <button className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                    <Code className="w-5 h-5 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">生成测试用例</div>
                    <div className="text-xs text-gray-500 mt-1">快速创建测试场景</div>
                  </button>
                  <button className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                    <Lightbulb className="w-5 h-5 text-blue-600 mb-2" />
                    <div className="text-sm font-medium text-gray-900">优化建议</div>
                    <div className="text-xs text-gray-500 mt-1">代码和流程优化</div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <Avatar className="w-8 h-8 bg-blue-100">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </Avatar>
                    )}
                    <div
                      className={`flex flex-col max-w-[70%] ${
                        message.type === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={suggestion.action}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              {suggestion.icon}
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.type === 'assistant' && (
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {message.type === 'user' && (
                      <Avatar className="w-8 h-8 bg-gray-200">
                        <span className="text-xs text-gray-600">U</span>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="w-8 h-8 bg-blue-100">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 输入框 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 border border-gray-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="输入您的问题..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 px-4 py-3 resize-none focus:outline-none max-h-32"
                rows={1}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

