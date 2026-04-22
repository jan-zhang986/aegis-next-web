import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, Conversation, MCPTool, QuickAction, GeneratedData } from '../types';
import { Code, Sparkles, Zap } from 'lucide-react';

export function useAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [useDeepThinking, setUseDeepThinking] = useState(false);
  const [useInternetSearch, setUseInternetSearch] = useState(false);
  const [showMcpSettings, setShowMcpSettings] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateAIResponse = useCallback((question: string): { content: string; suggestions?: QuickAction[]; generatedData?: GeneratedData } => {
    const lowerQuestion = question.toLowerCase();

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
          { id: '1', label: '查看示例代码', icon: React.createElement(Code, { className: 'w-4 h-4' }), action: () => {} },
          { id: '2', label: '生成测试模板', icon: React.createElement(Sparkles, { className: 'w-4 h-4' }), action: () => {} },
        ]
      };
    }

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
          { id: '1', label: '更多表达式示例', icon: React.createElement(Code, { className: 'w-4 h-4' }), action: () => {} },
          { id: '2', label: '调试技巧', icon: React.createElement(Zap, { className: 'w-4 h-4' }), action: () => {} },
        ]
      };
    }

    return {
      content: '我可以帮助您创建测试用例、配置工作流、生成测试数据等。请告诉我您需要什么帮助？',
    };
  }, []);

  return {
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
  };
}
