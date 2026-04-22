/**
 * useWorkflowRun Hook
 * 管理工作流运行和调试逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 * 
 * 注意：这是一个简化版本，WebSocket 连接和复杂的轮询逻辑
 * 需要在主组件中实现，因为涉及到 workflow.nodes 的实时更新
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { WorkflowData, WorkflowNodeData } from '@/components/workflow';
import { NodeType, type HttpConfig } from '@/components/workflow';
import type { ExecutionLog, DebugMode } from '../../workflow/types';

interface UseWorkflowRunParams {
  workflow: WorkflowData;
  workflowId?: string;
  projectId: string;
  selectedGlobalEnvironmentId?: string | null;
  user?: { id?: string };
  onWebSocketConnect?: (runId: string) => void;
  onWebSocketConnectRef?: React.MutableRefObject<((runId: string) => void) | undefined>;
  onLoadWorkflowHistory?: () => void;
  convertHttpConfigToRequestConfig?: (config: HttpConfig) => any;
  /** 受控模式：由父组件（如 E2E 嵌入页）传入，切换环境后运行/调试应使用当前选中值 */
  controlledExecutionEnvironmentId?: string;
  setControlledExecutionEnvironmentId?: (id: string) => void;
}

interface UseWorkflowRunReturn {
  // 执行日志相关状态
  executionLogs: ExecutionLog[];
  setExecutionLogs: React.Dispatch<React.SetStateAction<ExecutionLog[]>>;
  isExecuting: boolean;
  setIsExecuting: React.Dispatch<React.SetStateAction<boolean>>;
  isExecutionDrawerOpen: boolean;
  setIsExecutionDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // 调试模式相关状态
  debugMode: DebugMode;
  setDebugMode: React.Dispatch<React.SetStateAction<DebugMode>>;
  debugNodeId: string | null;
  setDebugNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  // 调试历史相关状态
  isDebugHistoryDrawerOpen: boolean;
  setIsDebugHistoryDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  debugHistoryList: any[];
  setDebugHistoryList: React.Dispatch<React.SetStateAction<any[]>>;
  debugHistoryLoading: boolean;
  setDebugHistoryLoading: React.Dispatch<React.SetStateAction<boolean>>;
  selectedHistoryRunId: string | null;
  setSelectedHistoryRunId: React.Dispatch<React.SetStateAction<string | null>>;
  historyDetail: any;
  setHistoryDetail: React.Dispatch<React.SetStateAction<any>>;
  // 执行环境相关状态
  isExecutionEnvironmentDialogOpen: boolean;
  setIsExecutionEnvironmentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  executionEnvironmentId: string;
  setExecutionEnvironmentId: React.Dispatch<React.SetStateAction<string>>;
  pendingExecutionType: 'debug' | 'run' | null;
  setPendingExecutionType: React.Dispatch<React.SetStateAction<'debug' | 'run' | null>>;
  pendingDebugNodeId: string | null;
  setPendingDebugNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  // 用户变量输入
  userVariableXTagHeader: string;
  setUserVariableXTagHeader: React.Dispatch<React.SetStateAction<string>>;
  userVariableXSiteTenant: string;
  setUserVariableXSiteTenant: React.Dispatch<React.SetStateAction<string>>;
  userVariableXTenantId: string;
  setUserVariableXTenantId: React.Dispatch<React.SetStateAction<string>>;
  userVariableXApp: string;
  setUserVariableXApp: React.Dispatch<React.SetStateAction<string>>;
  // 函数
  handleDebugNode: (nodeId: string) => Promise<void>;
  /** 可选 overrides.userVariables：由外部（如 E2E 嵌入页）传入请求头，优先于页面 state */
  handleRunWorkflow: (overrides?: { userVariables?: Record<string, string> }) => Promise<void>;
  handleShowDebugHistory: () => Promise<void>;
  handleConfirmExecution: () => Promise<void>;
  handleViewHistoryDetail: (runId: string) => Promise<void>;
  handleDeleteHistory: (runId: string) => Promise<void>;
  debugPollIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

/**
 * 验证节点配置
 */
function validateNodeConfig(node: WorkflowNodeData): string[] {
  const missingFields: string[] = [];

  switch (node.type) {
    case NodeType.HTTP_REQUEST: {
      const config = node.config as HttpConfig;
      if (!config.url || config.url.trim() === '') {
        missingFields.push('URL');
      }
      break;
    }
    case NodeType.MYSQL: {
      const config = node.config as any;
      const hasSql =
        typeof config.sql === 'string' && config.sql.trim() !== '';
      const hasSqlList =
        Array.isArray(config.sql_list) &&
        config.sql_list.length > 0 &&
        config.sql_list.some((s: unknown) => typeof s === 'string' && s.trim() !== '');
      if (!hasSql && !hasSqlList) {
        missingFields.push('SQL 语句');
      }
      break;
    }
    case NodeType.DUBBO: {
      const config = node.config as any;
      if (!config.interfaceName || config.interfaceName.trim() === '') {
        missingFields.push('接口名');
      }
      if (!config.methodName || config.methodName.trim() === '') {
        missingFields.push('方法名');
      }
      break;
    }
    // 其他节点类型的验证...
  }

  return missingFields;
}

/**
 * 转换 HTTP 配置为请求配置格式
 */
function convertHttpConfigToRequestConfig(config: HttpConfig): any {
  // 以完整的 config 为基础，避免丢失 upload/files 等字段
  const bodyType = config.bodyType || (config as any).paramType || 'json';

  const requestConfig: any = {
    // 保留原有配置，后面按需覆盖，防止非调试必需字段在调试时丢失
    ...config,
    method: config.method || 'GET',
    url: config.url || '',
    headers: config.headers || {},
    params: config.params || {},
    body: config.body || '',
    bodyType,
    // 后端部分逻辑依赖 paramType，保持与 bodyType 一致
    paramType: (config as any).paramType || bodyType,
  };

  // 先清理按 bodyType 互斥的字段，再按当前类型设置，保证结构干净一致
  if (bodyType === 'json') {
    delete requestConfig.data;
    delete requestConfig.upload;
    delete requestConfig.files;
    if (config.json) {
      requestConfig.json = config.json;
    }
  } else if (bodyType === 'data') {
    delete requestConfig.json;
    delete requestConfig.upload;
    delete requestConfig.files;
    if (config.data) {
      requestConfig.data = config.data;
    }
  } else if (bodyType === 'params') {
    delete requestConfig.json;
    delete requestConfig.data;
    delete requestConfig.upload;
    delete requestConfig.files;
    if (config.params) {
      requestConfig.params = config.params;
    }
  } else if (bodyType === 'upload') {
    // upload 调试场景：必须同时下发 upload 和 files，且保留 data 作为 multipart 文本字段
    delete requestConfig.json;
    delete requestConfig.body;
    const upload = config.upload ?? (config as any).files;
    if (upload) {
      requestConfig.upload = upload;
      requestConfig.files = upload;
    }
    if (config.data) {
      requestConfig.data = config.data;
    }
  }

  return requestConfig;
}

/**
 * useWorkflowRun Hook
 * 管理工作流运行和调试逻辑
 */
export function useWorkflowRun({
  workflow,
  workflowId,
  projectId,
  selectedGlobalEnvironmentId,
  user,
  onWebSocketConnect,
  onWebSocketConnectRef,
  onLoadWorkflowHistory,
  convertHttpConfigToRequestConfig,
  controlledExecutionEnvironmentId,
  setControlledExecutionEnvironmentId,
}: UseWorkflowRunParams): UseWorkflowRunReturn {
  // 执行日志相关状态
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState(false);

  // 调试模式相关状态
  const [debugMode, setDebugMode] = useState<DebugMode>('all');
  const [debugNodeId, setDebugNodeId] = useState<string | null>(null);

  // 调试历史相关状态
  const [isDebugHistoryDrawerOpen, setIsDebugHistoryDrawerOpen] = useState(false);
  const [debugHistoryList, setDebugHistoryList] = useState<any[]>([]);
  const [debugHistoryLoading, setDebugHistoryLoading] = useState(false);
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = useState<any>(null);

  // 执行环境相关状态：支持受控（父组件传入）或内部 state；受控时运行/调试使用当前选中环境
  const [isExecutionEnvironmentDialogOpen, setIsExecutionEnvironmentDialogOpen] = useState(false);
  const [internalExecutionEnvironmentId, setInternalExecutionEnvironmentId] = useState<string>('');
  const [pendingExecutionType, setPendingExecutionType] = useState<'debug' | 'run' | null>(null);
  const [pendingDebugNodeId, setPendingDebugNodeId] = useState<string | null>(null);

  const isControlled = controlledExecutionEnvironmentId !== undefined;
  const executionEnvironmentId = isControlled ? (controlledExecutionEnvironmentId ?? '') : internalExecutionEnvironmentId;
  const setExecutionEnvironmentId = useCallback(
    (value: React.SetStateAction<string>) => {
      if (setControlledExecutionEnvironmentId) {
        setControlledExecutionEnvironmentId(typeof value === 'function' ? value(controlledExecutionEnvironmentId ?? '') : value);
      } else {
        setInternalExecutionEnvironmentId(typeof value === 'function' ? value(internalExecutionEnvironmentId) : value);
      }
    },
    [setControlledExecutionEnvironmentId, controlledExecutionEnvironmentId, internalExecutionEnvironmentId]
  );

  // 非受控时：页面加载或 projectId 变化时从 localStorage 恢复上次选择的执行环境
  useEffect(() => {
    if (isControlled || !projectId) return;
    const last = localStorage.getItem(`lastExecutionEnvironment_${projectId}`);
    const value = last || selectedGlobalEnvironmentId || '';
    if (value) {
      setInternalExecutionEnvironmentId((prev) => (prev ? prev : value));
    }
  }, [projectId, selectedGlobalEnvironmentId, isControlled]);

  // 用户变量输入
  const [userVariableXTagHeader, setUserVariableXTagHeader] = useState<string>('');
  const [userVariableXSiteTenant, setUserVariableXSiteTenant] = useState<string>('');
  const [userVariableXTenantId, setUserVariableXTenantId] = useState<string>('');
  const [userVariableXApp, setUserVariableXApp] = useState<string>('');

  // 调试节点轮询引用
  const debugPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 调试节点：不弹窗，直接使用页面上已选执行环境和请求头
  const handleDebugNode = useCallback(
    async (nodeId: string) => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error('节点不存在');
        return;
      }
      if (!workflowId) {
        toast.error('工作流未保存，请先保存工作流');
        return;
      }

      // 检查节点ID是否是临时生成的
      if (nodeId.startsWith('node-') && nodeId.includes('-')) {
        const parts = nodeId.split('-');
        if (parts.length >= 3 && !isNaN(Number(parts[1]))) {
          toast.error('节点未保存，请先保存工作流后再调试');
          return;
        }
      }

      // 校验必填参数
      const missingFields = validateNodeConfig(node);
      if (missingFields.length > 0) {
        toast.error(`调试节点必填参数缺失：${missingFields.join('、')}`);
        return;
      }

      // 调试节点：始终先弹出环境选择弹窗，用户确认后再接入 debug 接口（在 handleConfirmExecution 中执行）
      const lastSelectedEnvId = projectId
        ? localStorage.getItem(`lastExecutionEnvironment_${projectId}`)
        : null;
      const envId = executionEnvironmentId || lastSelectedEnvId || selectedGlobalEnvironmentId || '';
      setPendingExecutionType('debug');
      setPendingDebugNodeId(nodeId);
      setExecutionEnvironmentId(envId || '');
      setIsExecutionEnvironmentDialogOpen(true);
    },
    [
      workflow.nodes,
      workflowId,
      projectId,
      selectedGlobalEnvironmentId,
      executionEnvironmentId,
    ]
  );

  // 运行工作流：不弹窗，直接使用页面上已选执行环境和请求头；支持外部传入 userVariables（如 E2E 嵌入页工具栏）
  const handleRunWorkflow = useCallback(async (overrides?: { userVariables?: Record<string, string> }) => {
    if (!workflowId) {
      toast.error('请先保存工作流');
      return;
    }

    if (workflow.nodes.length === 0) {
      toast.error('工作流中没有节点');
      return;
    }

    // 直接使用页面上选择的环境（或 localStorage / selectedGlobalEnvironmentId），有则不弹窗；无则弹窗让用户选择
    const lastSelectedEnvId = projectId
      ? localStorage.getItem(`lastExecutionEnvironment_${projectId}`)
      : null;
    const envId = executionEnvironmentId || lastSelectedEnvId || selectedGlobalEnvironmentId || '';
    if (!envId) {
      setPendingExecutionType('run');
      setPendingDebugNodeId(null);
      setExecutionEnvironmentId(lastSelectedEnvId || selectedGlobalEnvironmentId || '');
      setIsExecutionEnvironmentDialogOpen(true);
      return;
    }
    if (projectId) {
      localStorage.setItem(`lastExecutionEnvironment_${projectId}`, envId);
    }
    if (!executionEnvironmentId && envId) {
      setExecutionEnvironmentId(envId);
    }

    setDebugMode('all');
    setDebugNodeId(null);
    setIsExecuting(true);
    setIsExecutionDrawerOpen(true);
    setExecutionLogs([]);

    const workflowLog: ExecutionLog = {
      id: `workflow-${Date.now()}`,
      nodeId: 'workflow',
      name: '工作流执行',
      status: 'running',
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      description: '正在执行工作流...',
    };
    setExecutionLogs([workflowLog]);

    try {
      // 优先使用外部传入的 userVariables（如 E2E 嵌入页工具栏的请求头），否则用页面 state
      const userVariables: Record<string, string> = overrides?.userVariables
        ? { ...overrides.userVariables }
        : (() => {
            const v: Record<string, string> = {};
            if (userVariableXTagHeader.trim()) v['x-tag-header'] = userVariableXTagHeader.trim();
            if (userVariableXSiteTenant.trim()) v['x-site-tenant'] = userVariableXSiteTenant.trim();
            if (userVariableXTenantId.trim()) v['x-tenant-id'] = userVariableXTenantId.trim();
            if (userVariableXApp.trim()) v['x-app'] = userVariableXApp.trim();
            return v;
          })();

      const response = await workflowService.runWorkflow(workflowId, {
        environmentId: envId,
        userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
      });

      const runId = response?.runId || response?.data?.runId;
      if (!runId) {
        throw new Error('未获取到运行ID');
      }

      setExecutionLogs([{
        ...workflowLog,
        status: 'pending',
        description: '任务已提交，等待执行机执行...',
        runId,
      }]);

      const connectFn = onWebSocketConnect || onWebSocketConnectRef?.current;
      if (connectFn) connectFn(runId);
    } catch (error: any) {
      setExecutionLogs([{
        ...workflowLog,
        status: 'failed',
        description: `执行失败: ${error?.response?.data?.message || error?.message || '未知错误'}`,
        duration: 0,
      }]);
      toast.error(`执行工作流失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
      setIsExecuting(false);
    }
  }, [
    workflowId,
    workflow.nodes,
    selectedGlobalEnvironmentId,
    projectId,
    executionEnvironmentId,
    userVariableXTagHeader,
    userVariableXSiteTenant,
    userVariableXTenantId,
    userVariableXApp,
    onWebSocketConnect,
    onWebSocketConnectRef,
  ]);

  // 打开调试历史抽屉
  const handleShowDebugHistory = useCallback(async () => {
    if (!workflowId) {
      toast.error('请先保存工作流');
      return;
    }

    setIsDebugHistoryDrawerOpen(true);
    setSelectedHistoryRunId(null);
    setHistoryDetail(null);

    try {
      setDebugHistoryLoading(true);
      const response = await workflowService.getWorkflowHistory(workflowId, {
        current: 1,
        pageSize: 100,
        triggerUser: user?.id, // 只显示当前用户的调试记录
      });
      setDebugHistoryList(response?.list || []);
    } catch (error: any) {
      console.error('获取调试历史失败:', error);
      toast.error(`获取调试历史失败: ${error?.message || '未知错误'}`);
    } finally {
      setDebugHistoryLoading(false);
    }
  }, [workflowId, user?.id]);

  // 查看调试历史详情
  const handleViewHistoryDetail = useCallback(async (runId: string) => {
    setSelectedHistoryRunId(runId);
    try {
      const detail = await workflowService.getRunDetail(runId);
      setHistoryDetail(detail);
    } catch (error: any) {
      console.error('获取调试详情失败:', error);
      toast.error(`获取调试详情失败: ${error?.message || '未知错误'}`);
    }
  }, []);

  // 删除调试历史记录
  const handleDeleteHistory = useCallback(async (runId: string) => {
    try {
      await workflowService.deleteRun(runId);
      setDebugHistoryList(prev => prev.filter(item => item.runId !== runId));
      if (selectedHistoryRunId === runId) {
        setSelectedHistoryRunId(null);
        setHistoryDetail(null);
      }
    } catch (error: any) {
      throw error; // 重新抛出错误，让组件处理
    }
  }, [selectedHistoryRunId, setDebugHistoryList, setSelectedHistoryRunId, setHistoryDetail]);

  // 确认执行（调试节点或运行工作流）
  const handleConfirmExecution = useCallback(async () => {
    if (!executionEnvironmentId) {
      toast.error('请选择执行环境');
      return;
    }

    // 保存用户选择的环境ID到 localStorage（按项目ID区分）
    if (projectId) {
      localStorage.setItem(`lastExecutionEnvironment_${projectId}`, executionEnvironmentId);
    }

    // 关闭环境选择弹窗
    setIsExecutionEnvironmentDialogOpen(false);

    if (pendingExecutionType === 'debug' && pendingDebugNodeId) {
      // 执行调试节点
      const node = workflow.nodes.find(n => n.id === pendingDebugNodeId);
      if (!node) {
        toast.error('节点不存在');
        return;
      }

      // 设置调试模式为单个节点
      setDebugMode('single');
      setDebugNodeId(pendingDebugNodeId);
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

      try {
        // 将节点配置转换为后端期望的格式
        let nodeConfigToSend = node.config;
        if (node.type === NodeType.HTTP_REQUEST && convertHttpConfigToRequestConfig) {
          // HTTP节点需要转换格式：json/data/params/upload -> body/bodyType
          nodeConfigToSend = convertHttpConfigToRequestConfig(node.config as HttpConfig);
        }

        // 使用选择的环境ID
        if (nodeConfigToSend) {
          nodeConfigToSend = {
            ...nodeConfigToSend,
            environmentId: executionEnvironmentId,
          };
        }

        // 组装用户输入的变量（只包含有值的变量，变量key使用小写）
        const userVariables: Record<string, string> = {};
        if (userVariableXTagHeader.trim()) {
          userVariables['x-tag-header'] = userVariableXTagHeader.trim();
        }
        if (userVariableXSiteTenant.trim()) {
          userVariables['x-site-tenant'] = userVariableXSiteTenant.trim();
        }
        if (userVariableXTenantId.trim()) {
          userVariables['x-tenant-id'] = userVariableXTenantId.trim();
        }
        if (userVariableXApp.trim()) {
          userVariables['x-app'] = userVariableXApp.trim();
        }
        
        const response = await workflowService.debugNode(workflowId!, pendingDebugNodeId, nodeConfigToSend, {
          userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
        });
        
        const runId = response?.runId || response?.data?.runId;
        
        if (response?.success === false || !runId) {
          setExecutionLogs([{
            ...debugLog,
            status: 'failed',
            description: response?.message || '调试节点失败：无法获取运行ID',
            duration: 0,
          }]);
          toast.error(response?.message || '调试节点失败');
          setIsExecuting(false);
          return;
        }
        
        setExecutionLogs([{
          ...debugLog,
          status: 'pending',
          description: `任务已提交，等待执行机执行...`,
          runId: runId,
        }]);
        
        // 清理之前的轮询
        if (debugPollIntervalRef.current) {
          clearInterval(debugPollIntervalRef.current);
        }
        
        // 轮询获取执行状态（复用之前的轮询逻辑）
        const pollInterval = setInterval(async () => {
          try {
            const detailResponse = await workflowService.getRunDetail(runId);
            
            if (!detailResponse) {
              return;
            }
            
            if (detailResponse.steps && detailResponse.steps.length > 0) {
              const step = detailResponse.steps.find((s: any) => s.stepId === pendingDebugNodeId);
              
              if (step) {
                const statusMap: Record<string, ExecutionLog['status']> = {
                  'PENDING': 'pending',
                  'RUNNING': 'running',
                  'SUCCESS': 'success',
                  'SUCCEED': 'success',
                  'FAILED': 'failed',
                  'FAIL': 'failed',
                  'SKIPPED': 'skipped',
                };
                
                const stepStatus = statusMap[step.status] || 'pending';
                const stepDetail: ExecutionLog['stepDetail'] = {
                  requestData: step.requestData,
                  responseData: step.responseData,
                  assertion: step.assertion,
                  extractVars: step.extractVars,
                  errorMsg: step.errorMsg,
                  errorStack: step.errorStack,
                };
                
                setExecutionLogs([{
                  ...debugLog,
                  status: stepStatus,
                  description: step.errorMsg || step.description || 
                    (stepStatus === 'success' 
                      ? `${node.type.toUpperCase()} 节点调试成功` 
                      : stepStatus === 'failed'
                      ? `${node.type.toUpperCase()} 节点调试失败`
                      : `${node.type.toUpperCase()} 节点执行中...`),
                  duration: step.durationMs || 0,
                  runId: runId,
                  runStepId: step.runStepId,
                  stepDetail: stepDetail,
                }]);
                
                if (stepStatus === 'success' || stepStatus === 'failed') {
                  clearInterval(pollInterval);
                  debugPollIntervalRef.current = null;
                  setIsExecuting(false);
                }
              }
            }
            
            if (detailResponse.status === 'SUCCESS' || detailResponse.status === 'SUCCEED' 
                || detailResponse.status === 'FAILED' || detailResponse.status === 'FAIL') {
              clearInterval(pollInterval);
              debugPollIntervalRef.current = null;
              setIsExecuting(false);
            }
          } catch (pollError: any) {
            // 轮询错误，继续尝试
          }
        }, 1000);
        
        debugPollIntervalRef.current = pollInterval;
        
        setTimeout(() => {
          if (debugPollIntervalRef.current === pollInterval) {
            clearInterval(pollInterval);
            debugPollIntervalRef.current = null;
          }
          setIsExecuting(false);
        }, 60000);
        
      } catch (error: any) {
        setExecutionLogs([{
          ...debugLog,
          status: 'failed',
          description: `调试失败: ${error?.response?.data?.message || error?.message || '未知错误'}`,
          duration: 0,
        }]);
        toast.error(`调试节点失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
        setIsExecuting(false);
      }
    } else if (pendingExecutionType === 'run') {
      // 执行运行工作流
      setDebugMode('all');
      setDebugNodeId(null);
      setIsExecuting(true);
      setIsExecutionDrawerOpen(true);

      // 清空之前的日志
      setExecutionLogs([]);

      // 添加工作流开始执行的日志
      const workflowLog: ExecutionLog = {
        id: `workflow-${Date.now()}`,
        nodeId: 'workflow',
        name: '工作流执行',
        status: 'running',
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        description: '正在执行工作流...',
      };

      setExecutionLogs([workflowLog]);

      try {
        // 组装用户输入的变量（只包含有值的变量，变量key使用小写）
        const userVariables: Record<string, string> = {};
        if (userVariableXTagHeader.trim()) {
          userVariables['x-tag-header'] = userVariableXTagHeader.trim();
        }
        if (userVariableXSiteTenant.trim()) {
          userVariables['x-site-tenant'] = userVariableXSiteTenant.trim();
        }
        if (userVariableXTenantId.trim()) {
          userVariables['x-tenant-id'] = userVariableXTenantId.trim();
        }
        if (userVariableXApp.trim()) {
          userVariables['x-app'] = userVariableXApp.trim();
        }

        const response = await workflowService.runWorkflow(workflowId!, {
          environmentId: executionEnvironmentId,
          userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
        });

        const runId = response?.runId || response?.data?.runId;
        if (!runId) {
          throw new Error('未获取到运行ID');
        }

        // 更新工作流日志，添加 runId
        setExecutionLogs([{
          ...workflowLog,
          status: 'pending',
          description: '任务已提交，等待执行机执行...',
          runId: runId,
        }]);

        const connectFn = onWebSocketConnect || onWebSocketConnectRef?.current;
        if (connectFn) {
          connectFn(runId);
        }

      } catch (error: any) {
        setExecutionLogs([{
          ...workflowLog,
          status: 'failed',
          description: `执行失败: ${error?.response?.data?.message || error?.message || '未知错误'}`,
          duration: 0,
        }]);
        toast.error(`执行工作流失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
        setIsExecuting(false);
      }
    }

    // 清空待执行状态
    setPendingExecutionType(null);
    setPendingDebugNodeId(null);
  }, [
    executionEnvironmentId,
    pendingExecutionType,
    pendingDebugNodeId,
    workflow.nodes,
    workflowId,
    projectId,
    convertHttpConfigToRequestConfig,
    userVariableXTagHeader,
    userVariableXSiteTenant,
    userVariableXTenantId,
    userVariableXApp,
    onWebSocketConnect,
    debugPollIntervalRef,
    setDebugMode,
    setDebugNodeId,
    setIsExecuting,
    setIsExecutionDrawerOpen,
    setExecutionLogs,
    setIsExecutionEnvironmentDialogOpen,
    setPendingExecutionType,
    setPendingDebugNodeId,
  ]);

  return {
    // 执行日志相关状态
    executionLogs,
    setExecutionLogs,
    isExecuting,
    setIsExecuting,
    isExecutionDrawerOpen,
    setIsExecutionDrawerOpen,
    // 调试模式相关状态
    debugMode,
    setDebugMode,
    debugNodeId,
    setDebugNodeId,
    // 调试历史相关状态
    isDebugHistoryDrawerOpen,
    setIsDebugHistoryDrawerOpen,
    debugHistoryList,
    setDebugHistoryList,
    debugHistoryLoading,
    setDebugHistoryLoading,
    selectedHistoryRunId,
    setSelectedHistoryRunId,
    historyDetail,
    setHistoryDetail,
    // 执行环境相关状态
    isExecutionEnvironmentDialogOpen,
    setIsExecutionEnvironmentDialogOpen,
    executionEnvironmentId,
    setExecutionEnvironmentId,
    pendingExecutionType,
    setPendingExecutionType,
    pendingDebugNodeId,
    setPendingDebugNodeId,
    // 用户变量输入
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    // 函数
    handleDebugNode,
    handleRunWorkflow,
    handleShowDebugHistory,
    handleConfirmExecution,
    handleViewHistoryDetail,
    handleDeleteHistory,
    debugPollIntervalRef,
  };
}
