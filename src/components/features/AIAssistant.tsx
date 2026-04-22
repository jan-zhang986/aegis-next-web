import { useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
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
  Minimize2,
  CheckCircle,
  Play,
  Plus,
  Search,
  Trash2,
  Settings,
  Brain,
  Globe,
  Paperclip,
  Plug,
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
import { Separator } from '@/components/ui/separator';
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
import { useAIAssistant } from './ai-assistant';
import type { Message, Conversation, MCPTool } from './ai-assistant';

interface AIAssistantProps {
  currentContext?: string;
}

export function AIAssistant({ currentContext = 'test-factory' }: AIAssistantProps) {
  // 使用 hooks 管理状态
  const assistant = useAIAssistant();
  const {
    isOpen,
    setIsOpen,
    isMinimized,
    setIsMinimized,
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isTyping,
    setIsTyping,
    adoptingId,
    setAdoptingId,
    messagesEndRef,
    inputRef,
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversationId,
    searchQuery,
    setSearchQuery,
    mcpTools,
    setMcpTools,
    useDeepThinking,
    setUseDeepThinking,
    useInternetSearch,
    setUseInternetSearch,
    showMcpSettings,
    setShowMcpSettings,
    generateAIResponse,
  } = assistant;

  // 快捷问题
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  // 重置对话状态
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    if (!currentConversationId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: messageContent.length > 30 ? messageContent.substring(0, 30) + '...' : messageContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 1
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    }

    setTimeout(async () => {
      let aiContent = '';
      
      if (useDeepThinking) {
        aiContent += '🧠 **深度思考模式已启用**\n\n';
      }
      
      if (useInternetSearch && (messageContent.includes('搜索') || messageContent.includes('最新') || messageContent.includes('查询'))) {
        aiContent += '🌐 **联网搜索结果**\n正在为您搜索最新信息...\n\n';
      }

      const baseResponse = generateAIResponse(messageContent);
      aiContent += baseResponse.content;

      const enabledTools = mcpTools.filter(t => t.enabled);
      if (enabledTools.length > 0 && (useDeepThinking || useInternetSearch)) {
        aiContent += '\n\n**📦 使用的工具**: ' + enabledTools.map(t => t.name).join(', ');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        suggestions: baseResponse.suggestions,
        generatedData: baseResponse.generatedData
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      if (currentConversationId) {
        setConversations(prev => prev.map(c => 
          c.id === currentConversationId 
            ? { ...c, updatedAt: new Date(), messageCount: c.messageCount + 2 }
            : c
        ));
      }
    }, 1000 + Math.random() * 1000);
  };
    const lowerQuestion = question.toLowerCase();

    // HTTP测试相关
    if (lowerQuestion.includes('http') || lowerQuestion.includes('接口')) {
      return {
        content: `📝 创建HTTP测试的步骤：

1️⃣ **选择请求方法**

   - GET: 获取数据
   - POST: 创建资源
   - PUT: 更新资源
   - DELETE: 删除资源

2️⃣ **配置请求参数**

   \`\`\`json
   {
     "url": "https://api.example.com/users",
     "headers": {
       "Content-Type": "application/json",
       "Authorization": "Bearer token"
     }
   }
   \`\`\`

3️⃣ **设置断言验证**

   - 状态码验证：response.status == 200
   - 响应时间：response.time < 500ms
   - 数据校验：response.data.success == true

💡 提示：使用变量可以让测试更灵活，例如 {{baseUrl}} 和 {{token}}`,
        suggestions: [
          { id: '1', label: '查看示例代码', icon: <Code className="w-4 h-4" />, action: () => {} },
          { id: '2', label: '生成测试模板', icon: <Sparkles className="w-4 h-4" />, action: () => {} },
        ]
      };
    }

    // 条件节点相关
    if (lowerQuestion.includes('条件') || lowerQuestion.includes('分支')) {
      return {
        content: `⚡ 条件节点使用指南：

**1. 基本用法**

条件节点会根据表达式结果执行不同的分支：

- 🟢 true分支：条件满足时执行
- 🔴 false分支：条件不满足时执行

**2. 常用表达式**

\`\`\`javascript
// 状态码判断
response.code == 200

// 响应时间
response.time < 1000

// 数据验证
response.data.success == true && response.data.count > 0

// 多条件
(response.code == 200 || response.code == 201) && response.data != null
\`\`\`

**3. 最佳实践**

✅ 表达式尽量简单明了
✅ 避免复杂的嵌套逻辑
✅ 为每个分支添加描述性名称
✅ 测试两个分支的执行路径`,
        suggestions: [
          { id: '1', label: '更多表达式示例', icon: <Code className="w-4 h-4" />, action: () => {} },
          { id: '2', label: '调试技巧', icon: <Zap className="w-4 h-4" />, action: () => {} },
        ]
      };
    }

    // 测试数据相关
    if (lowerQuestion.includes('测试数据') || lowerQuestion.includes('生成')) {
      return {
        content: `🎲 测试数据生成建议：

**1. 使用Mock工厂**

- 支持多种数据类型
- 自定义生成规则
- 批量生成能力

**2. 常用数据类型**

\`\`\`javascript
// 用户数据
{
  "username": "user_{{random.number}}",
  "email": "test_{{random.string}}@example.com",
  "age": {{random.int(18, 60)}},
  "createdAt": "{{date.now}}"
}

// 订单数据
{
  "orderId": "ORD_{{timestamp}}",
  "amount": {{random.float(10, 1000)}},
  "status": "{{random.pick(['pending', 'paid', 'shipped'])}}"
}
\`\`\`

**3. 数据工厂功能**

📊 支持CSV/JSON导入
🔄 数据参数化
🎯 边界值生成`,
        suggestions: [
          { id: '1', label: '打开数据工厂', icon: <Sparkles className="w-4 h-4" />, action: () => {} },
          { id: '2', label: '导入测试数据', icon: <Code className="w-4 h-4" />, action: () => {} },
        ],
        generatedData: {
          type: 'test-data',
          data: {
            fields: [
              { name: 'username', type: 'string', rule: 'user_{{random.number}}', example: 'user_12345' },
              { name: 'email', type: 'string', rule: 'test_{{random.string}}@example.com', example: 'test_abc@example.com' },
              { name: 'age', type: 'int', rule: 'random(18, 60)', example: '30' }
            ]
          },
          canAdopt: true
        }
      };
    }

    // 性能优化
    if (lowerQuestion.includes('性能') || lowerQuestion.includes('优化')) {
      return {
        content: `🚀 性能测试优化建议：

**1. 并发策略**

- 逐步增加并发数
- 使用合理的间隔时间
- 监控系统资源

**2. 测试设计**

✅ 设置合理的超时时间
✅ 使用连接池复用
✅ 避免不必要的断言
✅ 合理使用缓存

**3. 关键指标**

📊 响应时间（RT）: < 500ms
📊 吞吐量（TPS）: 根据业务需求
📊 错误率: < 0.1%
📊 资源使用率: < 80%

**4. 优化建议**

- 减少请求大小
- 使用批量接口
- 开启数据压缩
- 优化数据库查询`,
        suggestions: [
          { id: '1', label: '查看性能报告', icon: <Zap className="w-4 h-4" />, action: () => {} },
          { id: '2', label: '压测配置模板', icon: <Code className="w-4 h-4" />, action: () => {} },
        ]
      };
    }

    // 元数据管理
    if (lowerQuestion.includes('元数据') || lowerQuestion.includes('导入') || lowerQuestion.includes('批量')) {
      return {
        content: `📦 元数据管理指南：

**1. 导入方式**

- 📁 CSV文件导入
- 📋 JSON格式导入
- 🔌 API接口导入
- 🔄 从Swagger导入

**2. 批量操作**

✅ 批量编辑：同时修改多个元数据
✅ 批量复制：快速创建相似测试
✅ 批量删除：清理无用数据
✅ 批量导出：备份测试配置

**3. 分类建议**

🏢 按业务模块：用户、订单、商品
👥 按团队：前端、后端、测试
🎯 按环境：开发、测试、生产
⚡按优先级：P0、P1、P2

**4. 数据校验**

- 检查必填字段
- 验证数据格式
- 避免重复命名
- 确保路径唯一`,
        suggestions: [
          { id: '1', label: '查看导入模板', icon: <Code className="w-4 h-4" />, action: () => {} },
          { id: '2', label: '批量操作示例', icon: <Sparkles className="w-4 h-4" />, action: () => {} },
        ]
      };
    }

    // 默认响应
    return {
      content: `我理解您的问题了。针对 "${question}"，我建议：

💡 **快速解决方案**

1. 检查相关配置是否正确
2. 查看官方文档获取详细信息
3. 参考最佳实践案例

📚 **推荐资源**

- AegisOne 使用手册
- API测试最佳实践
- 常见问题解答

如果需要更具体的帮助，请告诉我您当前遇到的具体问题或场景。`,
      suggestions: [
        { id: '1', label: '查看文档', icon: <Lightbulb className="w-4 h-4" />, action: () => {} },
        { id: '2', label: '更多帮助', icon: <MessageSquare className="w-4 h-4" />, action: () => {} },
      ]
    };
  };

  // 复制消息
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // 可以添加toast提示
  };

  // 创建新对话
  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSearchQuery('');
  };

  // 选择对话
  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // TODO: 加载对话消息
  };

  // 删除对话
  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(convs => convs.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      handleNewConversation();
    }
  };

  // 初始化 MCP 工具
  useEffect(() => {
    // 模拟加载 MCP 工具列表
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
        return 'bg-blue-500/20 text-blue-400';
      case 'system':
        return 'bg-gray-500/20 text-gray-400';
      case 'development':
        return 'bg-purple-500/20 text-purple-400';
      case 'data':
        return 'bg-green-500/20 text-green-400';
      case 'cloud':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // 采纳建议
  const handleAdoptSuggestion = async (messageId: string, message: Message) => {
    setAdoptingId(messageId);
    
    try {
      // 模拟保存数据到平台
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 根据数据类型执行不同操作
      if (message.generatedData) {
        const { type, data } = message.generatedData;
        
        if (type === 'api-test') {
          // 创建API测试
          // TODO: 这里可以调用实际的API创建接口
        } else if (type === 'test-data') {
          // 导入测试数据
          // TODO: 实现测试数据导入功能
        } else if (type === 'workflow') {
          // 创建工作流
          // TODO: 实现工作流创建功能
        }
      }
      
      // 添加确认消息
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '✅ 采纳成功！数据已保存到平台，您可以开始使用了。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
      
    } catch (error) {
      console.error('采纳失败:', error);
      // 添加错误消息
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ 采纳失败，请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAdoptingId(null);
    }
  };

  return (
    <>
      {/* 悬浮触发按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-110 z-50 flex items-center justify-center group"
        >
          <Bot className="w-7 h-7 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          
          {/* 脉冲动画 */}
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 animate-ping"></div>
        </button>
      )}

      {/* AI助手面板 - 抽屉模式 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 transition-all duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 抽屉内容 */}
          <div className="fixed right-0 top-0 bottom-0 w-1/2 bg-[#0d1117] z-50 transition-all duration-300 shadow-2xl">
            {/* 完整面板 - 两栏布局 */}
            <div className="flex h-full">
            {/* 左侧边栏 - 对话历史 */}
            <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
              {/* Logo */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-blue-500" />
                  <span className="text-white font-semibold">AegisOne</span>
                </div>
                <div className="flex items-center gap-1">
                  <Dialog open={showMcpSettings} onOpenChange={setShowMcpSettings}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#21262d]"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0d1117] border-[#30363d]">
                      <DialogHeader>
                        <DialogTitle className="text-white">MCP 工具连接设置</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          配置和管理 Model Context Protocol (MCP) 工具连接，扩展AI助手的功能
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* 通用设置 */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium text-gray-300">深度思考模式</Label>
                              <p className="text-xs text-gray-500 mt-1">启用后AI会进行更深入的思考和分析</p>
                            </div>
                            <Switch
                              checked={useDeepThinking}
                              onCheckedChange={setUseDeepThinking}
                            />
                          </div>
                          <Separator className="bg-[#30363d]" />
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium text-gray-300">互联网搜索</Label>
                              <p className="text-xs text-gray-500 mt-1">允许AI访问互联网获取最新信息</p>
                            </div>
                            <Switch
                              checked={useInternetSearch}
                              onCheckedChange={setUseInternetSearch}
                            />
                          </div>
                        </div>

                        <Separator className="bg-[#30363d]" />

                        {/* MCP工具列表 */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-300">MCP 工具</Label>
                            <Badge variant="secondary" className="text-xs bg-[#161b22] text-gray-300 border-[#30363d]">
                              {mcpTools.filter(t => t.enabled).length} / {mcpTools.length} 已启用
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {mcpTools.map((tool) => (
                              <div
                                key={tool.id}
                                className="border border-[#30363d] rounded-lg p-4 space-y-3 bg-[#161b22]"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className={`p-2 rounded-lg ${getCategoryColor(tool.category)}`}>
                                      {getCategoryIcon(tool.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-medium text-white">{tool.name}</h4>
                                        {tool.status === 'connected' && (
                                          <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                            <Wifi className="w-3 h-3 mr-1" />
                                            已连接
                                          </Badge>
                                        )}
                                        {tool.status === 'disconnected' && (
                                          <Badge variant="outline" className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/30">
                                            <WifiOff className="w-3 h-3 mr-1" />
                                            未连接
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400">{tool.description}</p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={tool.enabled}
                                    onCheckedChange={() => handleToggleTool(tool.id)}
                                  />
                                </div>

                                {tool.enabled && (
                                  <div className="pl-11 space-y-2 pt-2 border-t border-[#30363d]">
                                    <div>
                                      <Label className="text-xs text-gray-400">连接地址</Label>
                                      <Input
                                        value={tool.connectionUrl || ''}
                                        onChange={(e) => handleUpdateToolConfig(tool.id, 'connectionUrl', e.target.value)}
                                        placeholder="mcp://tool-name"
                                        className="mt-1 text-sm bg-[#0d1117] border-[#30363d] text-white placeholder-gray-500"
                                      />
                                    </div>
                                    {tool.id === 'github' || tool.id === 'cloud' ? (
                                      <div>
                                        <Label className="text-xs text-gray-400">API Key</Label>
                                        <Input
                                          type="password"
                                          value={tool.apiKey || ''}
                                          onChange={(e) => handleUpdateToolConfig(tool.id, 'apiKey', e.target.value)}
                                          placeholder="输入API密钥"
                                          className="mt-1 text-sm bg-[#0d1117] border-[#30363d] text-white placeholder-gray-500"
                                        />
                                      </div>
                                    ) : null}
                                    {tool.connectionUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleTestConnection(tool.id)}
                                        className="w-full mt-2 bg-[#21262d] border-[#30363d] text-white hover:bg-[#30363d]"
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#21262d]"
                    onClick={() => setIsOpen(false)}
                    title="关闭"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 新建对话按钮 */}
              <div className="px-4 pb-4">
                <Button
                  onClick={handleNewConversation}
                  className="w-full bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  开启新对话
                </Button>
              </div>

              {/* 对话历史列表 */}
              <ScrollArea className="flex-1">
                <div className="px-2">
                  {/* 搜索框 */}
                  {conversations.length > 0 && (
                    <div className="mb-2 relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索对话..."
                        className="bg-[#0d1117] border-[#30363d] text-white pl-8 text-sm"
                      />
                    </div>
                  )}

                  {/* 对话列表 */}
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`p-2 rounded-lg cursor-pointer mb-1 flex items-center justify-between group ${
                        currentConversationId === conv.id ? 'bg-[#1f6feb]' : 'hover:bg-[#21262d]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{conv.title}</p>
                        <p className="text-xs text-gray-400">{conv.messageCount} 条消息</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#30363d] rounded transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧主内容区域 */}
            <div className="flex-1 flex flex-col bg-[#0d1117]">
              {/* Context Badge */}
              <div className="flex-shrink-0 px-4 py-2 border-b border-[#30363d]">
                <Badge variant="secondary" className="gap-1.5 bg-[#161b22] text-blue-500 border-[#30363d]">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs">
                    {currentContext === 'test-factory' && '测试工厂'}
                    {currentContext === 'e2e-automation' && '自动化用例'}
                    {currentContext === 'data-dashboard' && '数据大屏'}
                    {currentContext === 'test-report' && '测试报告'}
                    {currentContext === 'metadata' && '元数据管理'}
                  </span>
                </Badge>
              </div>

              {/* Messages */}
              {messages.length === 0 ? (
                /* 欢迎界面 */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl text-white mb-2">今天有什么可以帮到你?</h3>
                    <p className="text-gray-400 text-sm">How can I help you today?</p>
                  </div>
                </div>
              ) : (
                /* 对话消息列表 */
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 px-4 py-4">
                      {messages.map((message) => (
                        <div key={message.id} className="space-y-2">
                          {message.type === 'user' ? (
                            /* 用户消息 */
                            <div className="flex justify-end">
                              <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          ) : (
                            /* AI消息 */
                            <div className="flex gap-3">
                              <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <div className="bg-[#161b22] border border-[#30363d] text-white rounded-2xl rounded-tl-sm px-4 py-2.5">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                  </p>
                                </div>
                              
                                {/* 快捷操作建议 */}
                                {message.suggestions && message.suggestions.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {message.suggestions.map((suggestion) => (
                                      <button
                                        key={suggestion.id}
                                        onClick={suggestion.action}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-xs text-gray-300 hover:bg-[#30363d] hover:border-blue-600 transition-colors"
                                      >
                                        {suggestion.icon}
                                        <span>{suggestion.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* 采纳按钮 */}
                                {message.generatedData && message.generatedData.canAdopt && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAdoptSuggestion(message.id, message)}
                                      disabled={adoptingId === message.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                                    >
                                      {adoptingId === message.id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          采纳中...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="w-4 h-4" />
                                          采纳建议
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleAdoptSuggestion(message.id, message)}
                                      disabled={adoptingId === message.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                                    >
                                      <Play className="w-4 h-4" />
                                      采纳并开始
                                    </button>
                                  </div>
                                )}

                                {/* 消息操作 */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopyMessage(message.content)}
                                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                                  >
                                    <Copy className="w-3 h-3" />
                                    复制
                                  </button>
                                  <button className="text-xs text-gray-500 hover:text-green-500 flex items-center gap-1 transition-colors">
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                                    <ThumbsDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* 输入中动画 */}
                      {isTyping && (
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </Avatar>
                          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0 border-t border-[#30363d] p-4">
                {/* MCP 工具切换 */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setUseDeepThinking(!useDeepThinking)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      useDeepThinking
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:bg-[#21262d]'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    深度思考
                  </button>
                  <button
                    onClick={() => setUseInternetSearch(!useInternetSearch)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      useInternetSearch
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:bg-[#21262d]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    联网搜索
                  </button>
                </div>

                {/* 输入框 */}
                <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden flex items-center">
                  <textarea
                    ref={inputRef as any}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="输入您的问题..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-3 resize-none focus:outline-none max-h-32"
                    rows={1}
                  />
                  <div className="flex items-center gap-1 px-2">
                    <button className="p-2 hover:bg-[#21262d] rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isTyping}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
}
