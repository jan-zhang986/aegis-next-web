import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { workflowService } from '@/services/workflow';
import { toast } from 'sonner';
import { 
  Globe, 
  Database, 
  Code, 
  Wifi,
  ChevronRight,
  ChevronDown,
  Search,
  LayoutGrid,
  List,
  Save,
  Play,
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Bookmark,
  Circle,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  History,
  Import,
  Bot,
  Send,
  X,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';

interface WorkflowNode {
  id: string;
  type: 'http' | 'sql' | 'dubbo' | 'script' | 'websocket' | 'condition';
  name: string;
  description: string;
  config?: any;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  label?: string; // 用于条件分支的标签，如 "true", "false", "case1"
  color?: string; // 连线颜色
}

interface ExecutionLog {
  id: string;
  nodeId: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  timestamp: string;
  description: string;
  duration?: number;
}

interface TestHistory {
  id: string;
  name: string;
  type: 'http' | 'sql' | 'dubbo' | 'websocket' | 'script';
  executionTime: string;
  status: 'success' | 'failed';
  duration: number;
}

interface SavedTest {
  id: string;
  name: string;
  type: 'http' | 'sql' | 'dubbo' | 'websocket';
  description: string;
  config: any;
}

interface SuggestedNode {
  name: string;
  type: WorkflowNode['type'];
  description: string;
  config?: any;
}

interface SuggestedConnection {
  fromName: string;
  toName: string;
  label?: string;
  color?: string;
}

interface GeneratedSuggestion {
  nodes: SuggestedNode[];
  connections?: SuggestedConnection[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedData?: GeneratedSuggestion;
  isAdopting?: boolean;
  isAdopted?: boolean;
  isRejected?: boolean;
}

export function WorkflowDesignPage() {
  const [searchParams] = useSearchParams();
  const workflowIdFromUrl = searchParams.get('id');
  
  const [viewMode, setViewMode] = useState<'canvas' | 'steps' | 'logs'>('canvas');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['automation-list', 'test-history']));
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(workflowIdFromUrl || null);
  const [projectId, setProjectId] = useState<string>(() => {
    // 从 localStorage 或 URL 参数获取 projectId
    return localStorage.getItem('currentProjectId') || 'default-project';
  });
  const [moduleId, setModuleId] = useState<string>(() => {
    // 从 localStorage 或 URL 参数获取 moduleId
    return localStorage.getItem('currentModuleId') || 'default-module';
  });
  const [workflowName, setWorkflowName] = useState<string>('未命名工作流');
  const [workflowDescription, setWorkflowDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'http', name: 'HTTP请求', description: 'HTTP GET 新建HTTP请求', x: 150, y: 100 },
    { id: '2', type: 'condition', name: '条件判断', description: '条件 判断表达式', x: 150, y: 280 },
    { id: '3', type: 'sql', name: 'SQL查询-成功', description: 'SQL 成功分支', x: 50, y: 460 },
    { id: '4', type: 'script', name: '脚本执行-失败', description: '脚本 失败分支', x: 280, y: 460 },
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { from: '1', to: '2' },
    { from: '2', to: '3', label: 'true', color: '#10B981' },
    { from: '2', to: '4', label: 'false', color: '#EF4444' },
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedImportType, setSelectedImportType] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  
  // WebSocket 连接状态
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        '你好!我是AI助手，可以帮助你用自然语言构建自动化测试流程。\n\n你可以输入“创建登录流程”等自然语言描述，我会生成候选方案供你采纳或拒绝。',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const automationGroups = [
    { id: 'basic-service', name: '基础服务', count: 4 },
    { id: 'business-platform', name: '业务平台', count: 4 },
    { id: 'data-team', name: '数据团队', count: 3 },
    { id: 'unassigned', name: '未分配', count: 3 },
  ];

  const testHistory: TestHistory[] = [
    { id: '1', name: '登录接口测试', type: 'http', executionTime: '2025-11-03 14:30', status: 'success', duration: 1250 },
    { id: '2', name: '用户查询SQL', type: 'sql', executionTime: '2025-11-03 14:28', status: 'success', duration: 890 },
    { id: '3', name: 'Dubbo服务调用', type: 'dubbo', executionTime: '2025-11-03 14:25', status: 'failed', duration: 2100 },
    { id: '4', name: 'WebSocket连接', type: 'websocket', executionTime: '2025-11-03 14:20', status: 'success', duration: 560 },
    { id: '5', name: '数据处理脚本', type: 'script', executionTime: '2025-11-03 14:15', status: 'success', duration: 3200 },
  ];

  const savedTests: SavedTest[] = [
    { id: 'http-1', name: '用户登录接口', type: 'http', description: 'POST /api/login', config: { method: 'POST', url: '/api/login' } },
    { id: 'http-2', name: '获取用户信息', type: 'http', description: 'GET /api/user/info', config: { method: 'GET', url: '/api/user/info' } },
    { id: 'http-3', name: '创建订单', type: 'http', description: 'POST /api/order/create', config: { method: 'POST', url: '/api/order/create' } },
    { id: 'sql-1', name: '查询用户列表', type: 'sql', description: 'SELECT * FROM users', config: { query: 'SELECT * FROM users WHERE status = 1' } },
    { id: 'sql-2', name: '更新订单状态', type: 'sql', description: 'UPDATE orders SET status', config: { query: 'UPDATE orders SET status = ? WHERE id = ?' } },
    { id: 'dubbo-1', name: '用户服务调用', type: 'dubbo', description: 'com.example.UserService', config: { interface: 'com.example.UserService', method: 'getUserInfo' } },
    { id: 'dubbo-2', name: '订单服务调用', type: 'dubbo', description: 'com.example.OrderService', config: { interface: 'com.example.OrderService', method: 'createOrder' } },
    { id: 'ws-1', name: '实时消息推送', type: 'websocket', description: 'ws://localhost:8080/ws', config: { url: 'ws://localhost:8080/ws' } },
  ];

  const mentionCandidates = [
    ...testHistory.map(history => ({
      id: `history-${history.id}`,
      label: history.name,
      description: history.executionTime,
      category: '测试历史',
    })),
    ...savedTests.map(test => ({
      id: `saved-${test.id}`,
      label: test.name,
      description: test.description,
      category: '元数据',
    })),
  ];

  const filteredMentions = mentionCandidates.filter(candidate =>
    candidate.label.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const nodeTypes = [
    { id: 'http', name: 'HTTP请求', desc: 'HTTP API 调用', icon: Globe, color: 'bg-blue-500', iconColor: 'text-blue-500', logo: '🌐' },
    { id: 'dubbo', name: 'Dubbo 调用', desc: 'Dubbo RPC 调用', icon: Globe, color: 'bg-purple-500', iconColor: 'text-purple-500', logo: '🔄' },
    { id: 'sql', name: 'SQL查询', desc: '数据库操作', icon: Database, color: 'bg-green-500', iconColor: 'text-green-500', logo: '💾' },
    { id: 'script', name: '脚本执行', desc: '执行自定义脚本', icon: Code, color: 'bg-orange-500', iconColor: 'text-orange-500', logo: '📜' },
    { id: 'websocket', name: 'WebSocket', desc: 'WebSocket 连接', icon: Wifi, color: 'bg-pink-500', iconColor: 'text-pink-500', logo: '💬' },
    { id: 'condition', name: '条件判断', desc: '条件分支节点', icon: Code, color: 'bg-yellow-500', iconColor: 'text-yellow-500', logo: '⚡' },
  ];

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(t => t.id === type);
    return nodeType?.icon || Globe;
  };

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(t => t.id === type);
    return nodeType?.color || 'bg-gray-500';
  };

  const getNodeIconColor = (type: string) => {
    const nodeType = nodeTypes.find(t => t.id === type);
    return nodeType?.iconColor || 'text-gray-500';
  };

  // 处理节点拖拽开始
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest('.connection-point')) {
      return; // 如果点击的是连接点，不触发拖拽
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const node = workflowNodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNode(nodeId);
    setSelectedNode(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  // 处理节点拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNode) {
      setWorkflowNodes(prev =>
        prev.map(node =>
          node.id === draggingNode
            ? { ...node, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
            : node
        )
      );
    }

    if (connectingFrom && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [draggingNode, dragOffset, connectingFrom]);

  // 处理节点拖拽结束
  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setConnectingFrom(null);
    setTempConnection(null);
  }, []);

  // 注册全局鼠标事件
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // WebSocket 连接管理
  useEffect(() => {
    // 构建 WebSocket URL
    const getWebSocketUrl = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // 根据实际后端 WebSocket 路径调整
      // 这里假设后端 WebSocket 路径为 /ws/workflow 或 /ws/api
      return `${protocol}//${host}/ws/workflow`;
    };

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      try {
        const wsUrl = getWebSocketUrl();
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          setWsConnection(ws);
          reconnectAttempts = 0;
          
          // 发送工作流 ID（如果需要）
          // ws.send(JSON.stringify({ type: 'subscribe', workflowId: 'xxx' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // 处理不同类型的消息
            // 消息格式示例：
            // { type: 'step_status', stepId: 'xxx', status: 'success' | 'failed' | 'running', ... }
            if (data.type === 'step_status' && data.stepId) {
              const { stepId, status, description, duration, timestamp } = data;
              
              // 更新执行日志
              setExecutionLogs(prev => {
                const existingLog = prev.find(log => log.nodeId === stepId);
                if (existingLog) {
                  // 更新现有日志
                  return prev.map(log =>
                    log.nodeId === stepId
                      ? {
                          ...log,
                          status: status as 'pending' | 'running' | 'success' | 'failed',
                          description: description || log.description,
                          duration: duration || log.duration,
                          timestamp: timestamp || log.timestamp,
                        }
                      : log
                  );
                } else {
                  // 创建新日志
                  const node = workflowNodes.find(n => n.id === stepId);
                  return [
                    ...prev,
                    {
                      id: `log-${stepId}-${Date.now()}`,
                      nodeId: stepId,
                      name: node?.name || '未知节点',
                      status: status as 'pending' | 'running' | 'success' | 'failed',
                      timestamp: timestamp || new Date().toLocaleTimeString(),
                      description: description || '节点执行中...',
                      duration: duration,
                    },
                  ];
                }
              });
            } else if (data.type === 'workflow_status') {
              // 处理工作流级别的状态更新
            }
          } catch (error) {
            console.error('[WebSocket] 解析消息失败:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] 连接错误:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
          setWsConnection(null);

          // 自动重连逻辑
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // 指数退避，最多30秒
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            console.error('[WebSocket] 达到最大重连次数，停止重连');
          }
        };
      } catch (error) {
        console.error('[WebSocket] 连接失败:', error);
        setWsConnected(false);
      }
    };

    // 建立连接
    connectWebSocket();

    // 清理函数
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []); // 只在组件挂载时执行一次

  // 处理连接点点击
  const handleConnectionPointClick = (e: React.MouseEvent, nodeId: string, type: 'input' | 'output', outputType?: 'true' | 'false') => {
    e.stopPropagation();
    
    if (type === 'output') {
      setConnectingFrom(nodeId);
    } else if (type === 'input' && connectingFrom) {
      // 创建连接
      if (connectingFrom !== nodeId) {
        const fromNode = workflowNodes.find(n => n.id === connectingFrom);
        
        // 检查是否是条件节点，自动设置标签和颜色
        let label: string | undefined;
        let color: string | undefined;
        
        if (fromNode?.type === 'condition') {
          // 计算当前条件节点的现有连接数
          const existingConnections = connections.filter(c => c.from === connectingFrom);
          
          // 根据现有连接数判断是 true 还是 false 分支
          if (existingConnections.length === 0) {
            label = 'true';
            color = '#10B981'; // green
          } else if (existingConnections.length === 1) {
            label = 'false';
            color = '#EF4444'; // red
          } else {
            // 如果已经有两个连接，默认不设置标签
            label = `case${existingConnections.length + 1}`;
            color = '#3B82F6'; // blue
          }
        }
        
        setConnections(prev => [...prev, { from: connectingFrom, to: nodeId, label, color }]);
      }
      setConnectingFrom(null);
      setTempConnection(null);
    }
  };

  // 添加新节点
  const handleAddNode = (type: string) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: type as WorkflowNode['type'],
      name: nodeTypes.find(t => t.id === type)?.name || '新节点',
      description: nodeTypes.find(t => t.id === type)?.desc || '',
      x: 150 + Math.random() * 100,
      y: 100 + Math.random() * 100,
    };
    setWorkflowNodes(prev => [...prev, newNode]);
  };

  // 打开引入测试数据对话框
  const handleImportTest = (type: string) => {
    setSelectedImportType(type);
    setIsImportDialogOpen(true);
  };

  // 引入已保存的测试
  const handleSelectSavedTest = (test: SavedTest) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: test.type as WorkflowNode['type'],
      name: test.name,
      description: test.description,
      config: test.config,
      x: 150 + Math.random() * 100,
      y: 100 + Math.random() * 100,
    };
    setWorkflowNodes(prev => [...prev, newNode]);
    setIsImportDialogOpen(false);
  };

  // 调试单个节点
  const handleDebugNode = (nodeId: string) => {
    const node = workflowNodes.find(n => n.id === nodeId);
    if (!node) return;

    // 设置执行状态
    setIsExecuting(true);
    setIsExecutionDrawerOpen(true);

    // 清空之前的日志
    setExecutionLogs([]);

    // 添加调试日志
    const debugLog: ExecutionLog = {
      id: Date.now().toString(),
      nodeId: node.id,
      name: node.name,
      status: 'running',
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      description: `正在调试 ${node.type.toUpperCase()} 节点...`,
    };

    setExecutionLogs([debugLog]);

    // 模拟执行过程
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% 成功率
      setExecutionLogs([{
        ...debugLog,
        status: success ? 'success' : 'failed',
        description: success 
          ? `${node.type.toUpperCase()} 节点调试成功` 
          : `${node.type.toUpperCase()} 节点调试失败：连接超时`,
        duration: Math.floor(Math.random() * 2000) + 500,
      }]);
      setIsExecuting(false);
    }, 2000);
  };

  // 删除节点
  const handleDeleteNode = (nodeId: string) => {
    setWorkflowNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  // 运行工作流测试
  // 加载工作流
  const loadWorkflow = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await workflowService.getWorkflowDetail(id);
      const data = response?.data || response;
      
      if (data) {
        setCurrentWorkflowId(data.workflowId);
        setWorkflowName(data.name || '未命名工作流');
        setWorkflowDescription(data.description || '');
        
        // 恢复节点（包含坐标）
        if (data.nodes && Array.isArray(data.nodes)) {
          setWorkflowNodes(data.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            name: node.name,
            description: node.description || '',
            config: node.config,
            x: node.x || 0,
            y: node.y || 0,
            refMode: node.refMode || 'NONE',
            refMetadataId: node.refMetadataId,
          })));
        }
        
        // 恢复连线（包含样式）
        if (data.connections && Array.isArray(data.connections)) {
          setConnections(data.connections.map((conn: any) => ({
            from: conn.from,
            to: conn.to,
            label: conn.label,
            color: conn.color,
          })));
        }
        
        toast.success('工作流加载成功');
      }
    } catch (error: any) {
      console.error('加载工作流失败:', error);
      toast.error(error?.response?.data?.message || error?.message || '加载工作流失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存工作流
  const handleSave = async () => {
    if (!projectId || !moduleId) {
      toast.error('请先选择项目和模块');
      return;
    }

    if (!workflowName.trim()) {
      toast.error('请输入工作流名称');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        ...(currentWorkflowId && { workflowId: currentWorkflowId }),
        projectId,
        moduleId,
        name: workflowName,
        description: workflowDescription,
        category: 'API',
        type: 'TEST_CASE',
        nodes: workflowNodes.map((node, index) => ({
          id: node.id,
          type: node.type,
          name: node.name,
          description: node.description,
          config: node.config || {},
          x: node.x,
          y: node.y,
          orderNum: index,
          refMode: (node as any).refMode || 'NONE',
          refMetadataId: (node as any).refMetadataId,
        })),
        connections: connections.map((conn, index) => ({
          from: conn.from,
          to: conn.to,
          label: conn.label,
          color: conn.color,
          orderNum: index,
        })),
      };

      const response = await workflowService.saveWorkflow(saveData);
      const data = response?.data || response;
      
      if (data?.workflowId) {
        setCurrentWorkflowId(data.workflowId);
        toast.success(currentWorkflowId ? '工作流更新成功' : '工作流保存成功');
        
        // 更新 URL（如果是新创建的工作流）
        if (!currentWorkflowId) {
          window.history.replaceState({}, '', `/workflow/design?id=${data.workflowId}`);
        }
      } else {
        throw new Error('保存失败：未返回工作流ID');
      }
    } catch (error: any) {
      console.error('保存工作流失败:', error);
      toast.error(error?.response?.data?.message || error?.message || '保存工作流失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 组件加载时，如果有 workflowId 则加载工作流
  useEffect(() => {
    if (workflowIdFromUrl && workflowIdFromUrl !== currentWorkflowId) {
      loadWorkflow(workflowIdFromUrl);
    }
  }, [workflowIdFromUrl]);

  const handleRunTest = async () => {
    setIsExecutionDrawerOpen(true);
    setIsExecuting(true);
    
    // 初始化执行日志
    const initialLogs: ExecutionLog[] = [
      {
        id: '0',
        nodeId: 'workflow',
        name: '工作流',
        status: 'running',
        timestamp: new Date().toLocaleTimeString(),
        description: '开始执行工作流...',
      }
    ];
    
    setExecutionLogs(initialLogs);

    // 模拟按顺序执行节点
    for (let i = 0; i < workflowNodes.length; i++) {
      const node = workflowNodes[i];
      
      // 添加节点开始执行日志
      setExecutionLogs(prev => [...prev, {
        id: `${i + 1}`,
        nodeId: node.id,
        name: node.name,
        status: 'running',
        timestamp: new Date().toLocaleTimeString(),
        description: `开始执行节点: ${node.name}`,
      }]);

      // 模拟执行时间
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // 随机成功或失败（90%成功率）
      const success = Math.random() > 0.1;
      
      setExecutionLogs(prev => prev.map(log => 
        log.id === `${i + 1}` 
          ? { 
              ...log, 
              status: success ? 'success' : 'failed',
              description: success 
                ? `节点 ${node.name} 执行成功` 
                : `节点 ${node.name} 执行失败: 模拟错误`,
              duration: Math.floor(1500 + Math.random() * 1000)
            }
          : log
      ));

      // 如果失败，停止执行
      if (!success) {
        setExecutionLogs(prev => prev.map(log => 
          log.id === '0' 
            ? { ...log, status: 'failed', description: '工作流执行失败' }
            : log
        ));
        setIsExecuting(false);
        return;
      }
    }

    // 所有节点执行成功
    setExecutionLogs(prev => prev.map(log => 
      log.id === '0' 
        ? { ...log, status: 'success', description: '工作流执行完成' }
        : log
    ));
    setIsExecuting(false);
  };

  // 计算执行进度
  const executionProgress = executionLogs.length > 1 
    ? ((executionLogs.filter(log => log.status === 'success' || log.status === 'failed').length - 1) / workflowNodes.length) * 100
    : 0;

  // 处理聊天消息发送
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setCursorPosition(0);
    setIsChatTyping(true);
    setShowMentionList(false);

    // 模拟AI处理（实际应调用AI API）
    setTimeout(() => {
      const response = parseNaturalLanguageToWorkflow(chatInput);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.text,
        timestamp: new Date(),
        generatedData: response.generatedData,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setIsChatTyping(false);
    }, 1000);
  };

  const handleAdoptSuggestion = (messageId: string) => {
    const targetMessage = chatMessages.find(msg => msg.id === messageId);
    if (!targetMessage?.generatedData || targetMessage.isAdopting || targetMessage.isAdopted) {
      return;
    }

    setChatMessages(prev =>
      prev.map(msg => (msg.id === messageId ? { ...msg, isAdopting: true } : msg))
    );

    setTimeout(() => {
      const timestamp = Date.now();
      const newNodes: WorkflowNode[] = targetMessage.generatedData!.nodes.map((node, index) => ({
        id: `ai-${timestamp}-${index}`,
        type: node.type,
        name: node.name,
        description: node.description,
        config: node.config,
        x: 150 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 200,
      }));

      const nodeMap = newNodes.reduce<Record<string, WorkflowNode>>((acc, node) => {
        acc[node.name] = node;
        return acc;
      }, {});

      const newConnections: Connection[] =
        targetMessage.generatedData?.connections
          ?.map(conn => {
            const fromNode = nodeMap[conn.fromName];
            const toNode = nodeMap[conn.toName];
            if (!fromNode || !toNode) {
              return null;
            }
            return {
              from: fromNode.id,
              to: toNode.id,
              label: conn.label,
              color: conn.color,
            } as Connection;
          })
          .filter((conn): conn is Connection => conn !== null) || [];

      setWorkflowNodes(prev => [...prev, ...newNodes]);
      if (newConnections.length > 0) {
        setConnections(prev => [...prev, ...newConnections]);
      }

      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isAdopting: false, isAdopted: true } : msg
        )
      );
      setViewMode('canvas');
    }, 600);
  };

  const handleRejectSuggestion = (messageId: string) => {
    setChatMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isRejected: true, generatedData: undefined } : msg
      )
    );
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setChatInput(value);
    setCursorPosition(position);

    const lastAtPos = value.lastIndexOf('@', position - 1);
    if (lastAtPos !== -1) {
      const charBefore = value[lastAtPos - 1];
      if (lastAtPos === 0 || charBefore === ' ' || charBefore === '\n') {
        const query = value.slice(lastAtPos + 1, position);
        if (!query.includes(' ')) {
          setMentionQuery(query);
          setShowMentionList(true);
          return;
        }
      }
    }
    setShowMentionList(false);
  };

  const handleSelectMention = (label: string) => {
    const lastAtPos = chatInput.lastIndexOf('@', cursorPosition - 1);
    if (lastAtPos === -1) {
      return;
    }
    const newValue = `${chatInput.slice(0, lastAtPos)}@${label} ${chatInput.slice(cursorPosition)}`;
    const newCursor = lastAtPos + label.length + 2;
    setChatInput(newValue);
    setCursorPosition(newCursor);
    setShowMentionList(false);
    requestAnimationFrame(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        chatInputRef.current.selectionStart = newCursor;
        chatInputRef.current.selectionEnd = newCursor;
      }
    });
  };

  // 解析自然语言并生成工作流节点
  const parseNaturalLanguageToWorkflow = (
    text: string
  ): {
    text: string;
    generatedData?: GeneratedSuggestion;
  } => {
    const lowerText = text.toLowerCase();

    // 处理 @历史测试 的场景
    const mentions = text.match(/@(\S+)/g);
    const mentionedTests = mentions ? mentions.map(m => m.substring(1)) : [];
    if (mentionedTests.length > 0) {
      const nodes: SuggestedNode[] = [];
      const connections: SuggestedConnection[] = [];

      mentionedTests.forEach((testName, index) => {
        const historyItem = testHistory.find(h => h.name === testName);
        if (historyItem) {
          nodes.push({
            name: historyItem.name,
            type: historyItem.type,
            description: `复用: ${historyItem.name}`,
            config: { sourceId: historyItem.id },
          });

          if (index > 0) {
            connections.push({
              fromName: mentionedTests[index - 1],
              toName: testName,
            });
          }
        }
      });

      if (nodes.length > 0) {
        return {
          text: `我找到了 ${nodes.length} 个历史测试并组合成流程建议，包含：\n${nodes
            .map(node => `- ${node.name}`)
            .join('\n')}\n\n如需落地到画布，可点击“采纳方案”；若不需要，可以拒绝或继续描述其他需求。`,
          generatedData: {
            nodes,
            connections,
          },
        };
      }
    }

    // 检测用户登录测试流程
    if (lowerText.includes('登录') || lowerText.includes('login')) {
      return {
        text:
          '我准备了一个“用户登录”流程建议：\n1. POST /api/login\n2. 验证登录结果\n3. 成功分支获取用户信息\n4. 失败分支记录错误\n\n点击“采纳方案”即可生成节点，也可以拒绝后继续描述。',
        generatedData: {
          nodes: [
            {
              name: 'POST /api/login',
              type: 'http',
              description: '发送登录请求',
              config: { method: 'POST', url: '/api/login' },
            },
            { name: '验证登录结果', type: 'condition', description: '检查响应状态码' },
            {
              name: 'GET /api/user/info',
              type: 'http',
              description: '获取用户信息',
              config: { method: 'GET', url: '/api/user/info' },
            },
            { name: '记录错误日志', type: 'script', description: '登录失败处理' },
          ],
          connections: [
            { fromName: 'POST /api/login', toName: '验证登录结果' },
            { fromName: '验证登录结果', toName: 'GET /api/user/info', label: 'success', color: '#10B981' },
            { fromName: '验证登录结果', toName: '记录错误日志', label: 'failed', color: '#EF4444' },
          ],
        },
      };
    }

    // 检测订单创建流程
    if (lowerText.includes('订单') || lowerText.includes('order')) {
      return {
        text:
          '这里有一个订单创建 + 支付流程建议：\n1. POST /api/order\n2. 验证订单结果\n3. 成功分支支付订单\n4. 失败分支取消订单\n\n可以选择采纳或拒绝，也可继续描述更复杂的需求。',
        generatedData: {
          nodes: [
            {
              name: 'POST /api/order',
              type: 'http',
              description: '创建订单',
              config: { method: 'POST', url: '/api/order' },
            },
            { name: '验证订单结果', type: 'condition', description: '检查订单状态' },
            {
              name: 'POST /api/payment',
              type: 'http',
              description: '支付订单',
              config: { method: 'POST', url: '/api/payment' },
            },
            { name: '取消订单', type: 'script', description: '订单创建失败处理' },
          ],
          connections: [
            { fromName: 'POST /api/order', toName: '验证订单结果' },
            { fromName: '验证订单结果', toName: 'POST /api/payment', label: 'success', color: '#10B981' },
            { fromName: '验证订单结果', toName: '取消订单', label: 'failed', color: '#EF4444' },
          ],
        },
      };
    }

    // 默认响应
    return {
      text: '我理解你想创建测试流程。请描述具体的测试场景，比如："创建用户登录测试"、"创建订单支付流程"等。我会根据你的描述自动生成相应的测试节点和流程。',
    };
  };

  // 滚动聊天消息到底部
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionListRef.current &&
        !mentionListRef.current.contains(event.target as Node) &&
        chatInputRef.current &&
        !chatInputRef.current.contains(event.target as Node)
      ) {
        setShowMentionList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-gray-50">
      {/* Right Sidebar - Node Palette */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="搜索自动化"
              className="pl-9 h-8 text-sm bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Automation Groups */}
          <div className="mb-3">
            <button
              onClick={() => toggleFolder('automation-list')}
              className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm"
            >
              {expandedFolders.has('automation-list') ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span className="text-gray-700">自动化列表</span>
            </button>
            
            {expandedFolders.has('automation-list') && (
              <div className="ml-3 mt-1 space-y-0.5">
                {automationGroups.map((group) => (
                  <button
                    key={group.id}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-sm text-gray-700"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <span>{group.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{group.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-gray-200"></div>

          {/* New Node Types */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs text-gray-500 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              <span>新建节点</span>
            </div>
            
            {nodeTypes.map((nodeType) => {
              const Icon = nodeType.icon;
              return (
                <div key={nodeType.id} className="relative group">
                  <button
                    onClick={() => handleAddNode(nodeType.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200"
                  >
                    <div className={`w-9 h-9 ${nodeType.color} bg-opacity-10 rounded-lg flex items-center justify-center relative shadow-sm`}>
                      <span className="text-lg">{nodeType.logo}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm text-gray-900">{nodeType.name}</div>
                      <div className="text-xs text-gray-500">{nodeType.desc}</div>
                    </div>
                  </button>
                  {nodeType.id !== 'script' && (
                    <button
                      onClick={() => handleImportTest(nodeType.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="引入测试数据"
                    >
                      <Import className="w-4 h-4 text-blue-600 hover:text-blue-700" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-gray-200"></div>

          {/* Test History */}
          <div className="space-y-1">
            <button
              onClick={() => toggleFolder('test-history')}
              className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded text-sm"
            >
              {expandedFolders.has('test-history') ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              )}
              <History className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-700">测试历史</span>
              <span className="text-xs text-gray-400 ml-auto">{testHistory.length}</span>
            </button>
            
            {expandedFolders.has('test-history') && (
              <div className="ml-3 mt-1 space-y-1">
                {testHistory.map((history) => {
                  const nodeTypeInfo = nodeTypes.find(t => t.id === history.type);
                  return (
                    <button
                      key={history.id}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded text-xs group"
                    >
                      <div className={`w-7 h-7 ${getNodeColor(history.type)} bg-opacity-10 rounded flex items-center justify-center flex-shrink-0`}>
                        <span className="text-sm">{nodeTypeInfo?.logo || '📦'}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-gray-900 truncate">{history.name}</div>
                        <div className="text-gray-400 text-[10px]">{history.executionTime}</div>
                      </div>
                      {history.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm text-gray-900">API元数据管理</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('canvas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                    viewMode === 'canvas'
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>画布</span>
                </button>
                <button
                  onClick={() => setViewMode('steps')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                    viewMode === 'steps'
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>步骤</span>
                </button>
              </div>

              {/* WebSocket 连接状态指示器 */}
              <div className="flex items-center gap-2 px-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'} />
                <span className="text-xs text-gray-500 hidden md:inline">
                  {wsConnected ? '实时反馈已连接' : '实时反馈未连接'}
                </span>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={handleSave}
                disabled={isSaving || isLoading}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? '保存中...' : '保存'}
              </Button>

              <Button 
                size="sm" 
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={handleRunTest}
                disabled={isExecuting}
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                {isExecuting ? '执行中...' : '运行测试'}
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setIsExecutionDrawerOpen(true)}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                执行日志
              </Button>

              <Button
                variant={showChatPanel ? 'secondary' : 'ghost'}
                size="sm"
                className={`h-8 gap-2 ${showChatPanel ? 'bg-blue-50 text-blue-600' : ''}`}
                onClick={() => setShowChatPanel(prev => !prev)}
              >
                <Brain className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">AI</span>
              </Button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-gray-600 min-w-[3rem] text-center">{zoom}%</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas / Steps View */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">
          {viewMode === 'canvas' && (
            <div 
              ref={canvasRef}
              className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100"
            >
              {/* Canvas Grid Background */}
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />

              {/* SVG for Connections - 使用z-20确保标签在节点之上 */}
              <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: '100%', height: '100%' }}>
                <defs>
                  {/* Default arrow */}
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
                  </marker>
                  {/* Green arrow for success */}
                  <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
                  </marker>
                  {/* Red arrow for failure */}
                  <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#EF4444" />
                  </marker>
                  {/* Blue arrow */}
                  <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
                  </marker>
                </defs>
                
                {/* Draw connections with bezier curves */}
                {connections.map((conn, index) => {
                  const fromNode = workflowNodes.find(n => n.id === conn.from);
                  const toNode = workflowNodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;

                  // 节点尺寸
                  const NODE_WIDTH = 280;
                  const CONNECTION_POINT_SIZE = 4; // 连接点大小（w-4 h-4）
                  const CONNECTION_POINT_OFFSET = 2; // -bottom-2 和 -top-2 的偏移值
                  
                  // 根据节点类型动态计算节点高度
                  // 条件判断节点有更多内容（条件表达式 + true/false分支说明），所以高度更大
                  const getNodeHeight = (nodeType: string): number => {
                    if (nodeType === 'condition') {
                      return 220; // 条件节点更高（包括表达式和分支说明）
                    }
                    return 180; // 普通节点（HTTP、SQL、脚本等）
                  };
                  
                  const fromNodeHeight = getNodeHeight(fromNode.type);
                  const toNodeHeight = getNodeHeight(toNode.type);
                  
                  // 计算输出点位置（从节点的底部）
                  // CSS: left-1/3 -translate-x-1/2 意味着：
                  // - left-1/3: 元素左边缘在父元素宽度的33.33%位置
                  // - -translate-x-1/2: 向左平移自身宽度的50%
                  // - 所以元素中心 = 父元素宽度 * 33.33% - 元素宽度 * 50%
                  let startX: number;
                  let startY: number;
                  
                  if (fromNode.type === 'condition') {
                    // 条件节点：根据连接的颜色判断是true还是false分支
                    if (conn.color === '#10B981') {
                      // true分支：left-1/3 -translate-x-1/2
                      // 连接点中心 = fromNode.x + (NODE_WIDTH * 1/3) - (CONNECTION_POINT_SIZE / 2)
                      startX = fromNode.x + (NODE_WIDTH / 3) - (CONNECTION_POINT_SIZE / 2);
                    } else if (conn.color === '#EF4444') {
                      // false分支：left-2/3 -translate-x-1/2
                      // 连接点中心 = fromNode.x + (NODE_WIDTH * 2/3) - (CONNECTION_POINT_SIZE / 2)
                      startX = fromNode.x + (NODE_WIDTH * 2 / 3) - (CONNECTION_POINT_SIZE / 2);
                    } else {
                      // 默认使用中心
                      startX = fromNode.x + NODE_WIDTH / 2;
                    }
                    // 输出点在节点底部：-bottom-2 意味着节点底部向下2px
                    // 连接点中心 = 节点底部 + CONNECTION_POINT_OFFSET + 连接点半径
                    startY = fromNode.y + fromNodeHeight + CONNECTION_POINT_OFFSET + (CONNECTION_POINT_SIZE / 2);
                  } else {
                    // 普通节点：输出点在底部中心，left-1/2 -translate-x-1/2
                    startX = fromNode.x + NODE_WIDTH / 2;
                    startY = fromNode.y + fromNodeHeight + CONNECTION_POINT_OFFSET + (CONNECTION_POINT_SIZE / 2);
                  }
                  
                  // 计算输入点位置（到节点的顶部中心）
                  // CSS: left-1/2 -translate-x-1/2 意味着：距离左边缘50%，然后向左平移自身宽度的一半
                  const endX = toNode.x + NODE_WIDTH / 2;
                  // 输入点在节点顶部：-top-2 意味着节点顶部向上2px
                  // 连接点中心 = 节点顶部 - CONNECTION_POINT_OFFSET - 连接点半径
                  const endY = toNode.y - CONNECTION_POINT_OFFSET - (CONNECTION_POINT_SIZE / 2);

                  // 计算贝塞尔曲线控制点
                  const deltaY = endY - startY;
                  const controlPointOffset = Math.max(Math.abs(deltaY) * 0.5, 50);
                  
                  const controlPoint1Y = startY + controlPointOffset;
                  const controlPoint2Y = endY - controlPointOffset;

                  // 创建贝塞尔曲线路径
                  const path = `M ${startX} ${startY} C ${startX} ${controlPoint1Y}, ${endX} ${controlPoint2Y}, ${endX} ${endY}`;
                  
                  const strokeColor = conn.color || '#a855f7';
                  const markerEnd = conn.color === '#10B981' ? 'url(#arrowhead-green)' 
                                  : conn.color === '#EF4444' ? 'url(#arrowhead-red)'
                                  : conn.color === '#3B82F6' ? 'url(#arrowhead-blue)'
                                  : 'url(#arrowhead)';

                  // 计算标签位置（路径中点，但偏移以避免被节点遮挡）
                  // 对于条件判断节点的输出，标签应该更靠近源节点，在节点底部附近
                  const isConditionOutput = fromNode.type === 'condition';
                  let labelX = 0;
                  let labelY = 0;
                  
                  if (isConditionOutput) {
                    // 条件判断节点的输出，标签位置在节点底部输出点附近
                    // true分支（绿色）在左侧输出点，false分支（红色）在右侧输出点
                    if (conn.color === '#10B981') {
                      // true分支，位置在输出点右侧
                      labelX = startX + 30;
                      labelY = startY + 25; // 在输出点下方25px
                    } else if (conn.color === '#EF4444') {
                      // false分支，位置在输出点右侧
                      labelX = startX + 30;
                      labelY = startY + 25; // 在输出点下方25px
                    }
                  } else {
                    // 普通连接，标签位置在连接线中点上方
                    labelX = startX + (endX - startX) / 2;
                    labelY = startY + (endY - startY) / 2 - 30; // 向上偏移30px
                  }

                  const midX = labelX;
                  const midY = labelY;

                  return (
                    <g key={index}>
                      {/* 连线外层（白色边框效果） */}
                      <path
                        d={path}
                        stroke="#ffffff"
                        strokeWidth="5"
                        fill="none"
                        opacity="0.8"
                      />
                      {/* 连线主体 */}
                      <path
                        d={path}
                        stroke={strokeColor}
                        strokeWidth="2.5"
                        fill="none"
                        markerEnd={markerEnd}
                      />
                      {/* 连线标签 - 使用更高的层级和阴影效果，确保可见 */}
                      {conn.label && (
                        <g style={{ pointerEvents: 'none' }}>
                          {/* 白色背景，带阴影 */}
                          <rect
                            x={midX - 24}
                            y={midY - 14}
                            width="48"
                            height="28"
                            fill="white"
                            stroke={strokeColor}
                            strokeWidth="2"
                            rx="6"
                            style={{ 
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                              pointerEvents: 'none'
                            }}
                          />
                          {/* 标签文字 */}
                          <text
                            x={midX}
                            y={midY + 5}
                            textAnchor="middle"
                            fill={strokeColor}
                            fontSize="13"
                            fontWeight="700"
                            style={{ 
                              pointerEvents: 'none', 
                              userSelect: 'none',
                              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                            }}
                          >
                            {conn.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Draw temporary connection line with bezier */}
                {connectingFrom && tempConnection && (() => {
                  const fromNode = workflowNodes.find(n => n.id === connectingFrom);
                  if (!fromNode) return null;
                  
                  // 节点尺寸
                  const NODE_WIDTH = 280;
                  const CONNECTION_POINT_SIZE = 4;
                  const CONNECTION_POINT_OFFSET = 2;
                  
                  // 根据节点类型动态计算节点高度
                  const getNodeHeight = (nodeType: string): number => {
                    if (nodeType === 'condition') {
                      return 220; // 条件节点更高
                    }
                    return 180; // 普通节点
                  };
                  
                  const fromNodeHeight = getNodeHeight(fromNode.type);
                  
                  // 计算输出点位置（从节点的底部中心）
                  const startX = fromNode.x + NODE_WIDTH / 2;
                  const startY = fromNode.y + fromNodeHeight + CONNECTION_POINT_OFFSET + (CONNECTION_POINT_SIZE / 2);
                  const endX = tempConnection.x;
                  const endY = tempConnection.y;

                  const deltaY = endY - startY;
                  const controlPointOffset = Math.max(Math.abs(deltaY) * 0.5, 50);
                  const controlPoint1Y = startY + controlPointOffset;
                  const controlPoint2Y = endY - controlPointOffset;

                  const path = `M ${startX} ${startY} C ${startX} ${controlPoint1Y}, ${endX} ${controlPoint2Y}, ${endX} ${endY}`;

                  return (
                    <path
                      d={path}
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      fill="none"
                      opacity="0.6"
                    />
                  );
                })()}
              </svg>

              {/* Workflow Nodes - 使用z-10，在SVG连线之下，但节点内容可以交互 */}
              <div className="relative w-full h-full p-8 z-10">
                {workflowNodes.map((node) => {
                  const nodeTypeInfo = nodeTypes.find(t => t.id === node.type);
                  const executionStatus = executionLogs.find(log => log.nodeId === node.id)?.status;
                  
                  // 根据执行状态确定边框颜色
                  const getBorderColor = () => {
                    if (executionStatus === 'success') {
                      return 'border-green-500';
                    } else if (executionStatus === 'failed') {
                      return 'border-red-500';
                    } else if (executionStatus === 'running') {
                      return 'border-blue-500';
                    } else if (selectedNode === node.id) {
                      return 'border-blue-500';
                    } else {
                      return 'border-gray-200';
                    }
                  };
                  
                  return (
                    <div
                      key={node.id}
                      className={`absolute bg-white rounded-lg border-2 shadow-lg hover:shadow-xl transition-all ${getBorderColor()} ${
                        draggingNode === node.id ? 'opacity-70 cursor-grabbing' : 'cursor-grab'
                      }`}
                      style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: '280px',
                      }}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onClick={() => setSelectedNode(node.id)}
                    >
                      {/* Execution Status Badge */}
                      {executionStatus && (
                        <div className="absolute -top-2 -right-2 z-10">
                          {executionStatus === 'running' && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                              <Activity className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          {executionStatus === 'success' && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          {executionStatus === 'failed' && (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <XCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Node Header */}
                      <div className="flex items-start justify-between p-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-10 h-10 ${getNodeColor(node.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900">{node.name}</div>
                            <div className="text-xs text-gray-500">{nodeTypeInfo?.desc || ''}</div>
                          </div>
                        </div>
                        <button 
                          className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Node Content */}
                      <div className="p-4 pt-3 space-y-3">
                        {node.type === 'http' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">请求配置</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {node.config?.method || 'GET'}
                              </span>
                              <span className="text-xs text-gray-600 truncate">
                                {node.config?.url || '请输入URL'}
                              </span>
                            </div>
                          </div>
                        )}
                        {node.type === 'sql' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">SQL查询</div>
                            <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-2 font-mono">
                              {node.config?.query || 'SELECT * FROM ...'}
                            </div>
                          </div>
                        )}
                        {node.type === 'dubbo' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">Dubbo接口</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="truncate">{node.config?.interface || 'com.example.Service'}</div>
                              <div className="text-gray-500">{node.config?.method || 'methodName'}</div>
                            </div>
                          </div>
                        )}
                        {node.type === 'websocket' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">WebSocket连接</div>
                            <div className="text-xs text-gray-600 truncate">
                              {node.config?.url || 'ws://localhost:8080/ws'}
                            </div>
                          </div>
                        )}
                        {node.type === 'script' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">脚本代码</div>
                            <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-2 font-mono">
                              {node.description}
                            </div>
                          </div>
                        )}
                        {node.type === 'condition' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">条件表达式</div>
                            <div className="text-xs text-gray-600 bg-yellow-50 rounded px-2 py-2 font-mono border border-yellow-200">
                              {node.config?.expression || 'response.code == 200'}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">true分支</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">false分支</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Debug Button */}
                        <div className="pt-2 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-7 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDebugNode(node.id);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            调试节点
                          </Button>
                        </div>
                      </div>

                      {/* Connection Points */}
                      {/* Input point (top) */}
                      <div 
                        className="connection-point absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform z-10"
                        onClick={(e) => handleConnectionPointClick(e, node.id, 'input')}
                        title="输入连接点"
                      />
                      
                      {/* Output points (bottom) - 条件节点有两个输出点 */}
                      {node.type === 'condition' ? (
                        <>
                          {/* True output (bottom-left) */}
                          <div 
                            className="connection-point absolute -bottom-2 left-1/3 -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleConnectionPointClick(e, node.id, 'output');
                            }}
                            title="true分支"
                          />
                          {/* False output (bottom-right) */}
                          <div 
                            className="connection-point absolute -bottom-2 left-2/3 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleConnectionPointClick(e, node.id, 'output');
                            }}
                            title="false分支"
                          />
                        </>
                      ) : (
                        /* 普通节点只有一个输出点 */
                        <div 
                          className="connection-point absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleConnectionPointClick(e, node.id, 'output');
                          }}
                          title="输出连接点"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'steps' && (
            <div className="w-full h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Circle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <div className="mb-1">步骤模式说明:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
                        <li>节点按照顺序排列，支持拖拽变更顺序</li>
                        <li>拖拽节点至删除区回收站到左侧即可删除节点</li>
                        <li>点击右侧编辑图标可展开节点详情编辑，点击位置快捷编辑节点</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step List */}
                <div className="space-y-3">
                  {workflowNodes.map((node, index) => {
                    const nodeTypeInfo = nodeTypes.find(t => t.id === node.type);
                    return (
                      <div
                        key={node.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 ${getNodeColor(node.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{index + 1}</span>
                                <span className="text-sm text-gray-900">{node.name}</span>
                              </div>
                              <div className="text-xs text-gray-500">{node.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDebugNode(node.id);
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              调试
                            </Button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Step Button */}
                <div className="mt-6 flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <Plus className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">点击左侧添加更多节点</span>
                </div>
              </div>
            </div>
          )}
          </div>

          {showChatPanel && (
            <div className="w-80 md:w-96 lg:w-[420px] bg-white border-l border-gray-200 flex flex-col min-h-0 flex-shrink-0 h-full">
              <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">AI 助手</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowChatPanel(false)}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>

              <ScrollArea className="flex-1 min-h-0 p-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </Avatar>
                      )}
                      <div
                        className={`flex flex-col max-w-[85%] ${
                          message.type === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.type === 'assistant' &&
                          message.generatedData &&
                          !message.isAdopted &&
                          !message.isRejected && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleAdoptSuggestion(message.id)}
                                disabled={message.isAdopting}
                              >
                                {message.isAdopting ? '生成中...' : '采纳方案'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleRejectSuggestion(message.id)}
                                disabled={message.isAdopting}
                              >
                                拒绝
                              </Button>
                            </div>
                          )}
                        {message.isAdopted && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已采纳并生成画布
                          </div>
                        )}
                        {message.isRejected && (
                          <div className="mt-2 text-xs text-gray-400">已拒绝该方案</div>
                        )}
                        <span className="text-xs text-gray-400 mt-1">
                          {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isChatTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-gray-200 relative">
                {showMentionList && (
                  <div
                    ref={mentionListRef}
                    className="absolute bottom-[120px] left-4 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                  >
                    <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                      使用 @ 引用测试历史或元数据
                    </div>
                    <div className="max-h-60 overflow-auto">
                      {filteredMentions.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-400">未找到匹配项</div>
                      ) : (
                        filteredMentions.slice(0, 15).map(item => (
                          <button
                            key={item.id}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col"
                            onClick={() => handleSelectMention(item.label)}
                          >
                            <span className="text-sm text-gray-900">{item.label}</span>
                            <span className="text-[11px] text-gray-500">
                              {item.category} · {item.description || '无描述'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Textarea
                    ref={chatInputRef}
                    placeholder="描述你想创建的测试流程..."
                    value={chatInput}
                    onChange={handleChatInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">按Enter 发送,Shift + Enter换行</span>
                    <Button
                      size="sm"
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || isChatTyping}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Test Data Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Import className="w-5 h-5 text-blue-600" />
              <span>引入测试数据</span>
            </DialogTitle>
            <DialogDescription>
              从已保存的测试中选择并引入到工作流
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="http">HTTP接口</TabsTrigger>
              <TabsTrigger value="sql">SQL查询</TabsTrigger>
              <TabsTrigger value="dubbo">Dubbo调用</TabsTrigger>
              <TabsTrigger value="websocket">WebSocket</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {savedTests.map((test) => {
                    const nodeTypeInfo = nodeTypes.find(t => t.id === test.type);
                    return (
                      <button
                        key={test.id}
                        onClick={() => handleSelectSavedTest(test)}
                        className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 ${getNodeColor(test.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900">{test.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{test.type.toUpperCase()}</span>
                          </div>
                          <div className="text-xs text-gray-500">{test.description}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="http" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {savedTests.filter(t => t.type === 'http').map((test) => {
                    const nodeTypeInfo = nodeTypes.find(t => t.id === test.type);
                    return (
                      <button
                        key={test.id}
                        onClick={() => handleSelectSavedTest(test)}
                        className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 ${getNodeColor(test.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 mb-1">{test.name}</div>
                          <div className="text-xs text-gray-500">{test.description}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sql" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {savedTests.filter(t => t.type === 'sql').map((test) => {
                    const nodeTypeInfo = nodeTypes.find(t => t.id === test.type);
                    return (
                      <button
                        key={test.id}
                        onClick={() => handleSelectSavedTest(test)}
                        className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 ${getNodeColor(test.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 mb-1">{test.name}</div>
                          <div className="text-xs text-gray-500">{test.description}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dubbo" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {savedTests.filter(t => t.type === 'dubbo').map((test) => {
                    const nodeTypeInfo = nodeTypes.find(t => t.id === test.type);
                    return (
                      <button
                        key={test.id}
                        onClick={() => handleSelectSavedTest(test)}
                        className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 ${getNodeColor(test.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 mb-1">{test.name}</div>
                          <div className="text-xs text-gray-500">{test.description}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="websocket" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {savedTests.filter(t => t.type === 'websocket').map((test) => {
                    const nodeTypeInfo = nodeTypes.find(t => t.id === test.type);
                    return (
                      <button
                        key={test.id}
                        onClick={() => handleSelectSavedTest(test)}
                        className="w-full flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 ${getNodeColor(test.type)} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <span className="text-xl">{nodeTypeInfo?.logo || '📦'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 mb-1">{test.name}</div>
                          <div className="text-xs text-gray-500">{test.description}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Execution Drawer */}
      <Drawer open={isExecutionDrawerOpen} onOpenChange={setIsExecutionDrawerOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>执行日志</span>
              {isExecuting && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Circle className="w-2 h-2 animate-pulse fill-blue-600" />
                  执行中
                </span>
              )}
            </DrawerTitle>
            <DrawerDescription>
              实时查看工作流执行情况和详细日志
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {/* Progress Bar */}
            {executionLogs.length > 0 && (
              <div className="mb-6 bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">执行进度</span>
                  <span className="text-sm text-gray-500">{Math.round(executionProgress)}%</span>
                </div>
                <Progress value={executionProgress} className="h-2" />
                <div className="mt-2 text-xs text-gray-500">
                  已完��� {executionLogs.filter(log => log.status === 'success' || log.status === 'failed').length - 1} / {workflowNodes.length} 个节点
                </div>
              </div>
            )}

            {/* Execution Logs */}
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {executionLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mb-3" />
                    <p className="text-sm">暂无执行记录</p>
                    <p className="text-xs mt-1">点击"运行测试"开始执行工作流</p>
                  </div>
                ) : (
                  executionLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className="mt-0.5 flex-shrink-0">
                          {log.status === 'pending' && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          {log.status === 'running' && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                              <Activity className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {log.status === 'success' && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                          {log.status === 'failed' && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>

                        {/* Log Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-900">{log.name}</span>
                            <span className="text-xs text-gray-400">{log.timestamp}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">{log.description}</div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {log.status === 'running' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <Circle className="w-2 h-2 animate-pulse fill-blue-600" />
                                执行中
                              </span>
                            )}
                            {log.status === 'success' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                成功
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                <XCircle className="w-3 h-3" />
                                失败
                              </span>
                            )}
                            {log.duration && (
                              <span className="text-xs text-gray-500">
                                耗时: {log.duration}ms
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="mt-6 flex gap-2 border-t pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setExecutionLogs([])}
                disabled={isExecuting}
              >
                清空日志
              </Button>
              <Button 
                className="flex-1 bg-black hover:bg-gray-800"
                onClick={() => setIsExecutionDrawerOpen(false)}
              >
                关闭
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
