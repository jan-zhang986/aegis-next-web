import { useState, useEffect, useMemo, useRef } from "react";
import {
  Play,
  Save,
  Database,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Maximize,
  Minimize,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { http } from "@/utils/request";
import { runDataCodeAsync, runProjectScriptTestAsync } from "@/services/data-forge-run";
import { useSearchParams } from "react-router-dom";
import { metadataService, type MetadataModuleNode } from "@/services/metadata";
import { environmentService, type Environment } from "@/services/environment";
import { ScriptConfigTab } from "./ScriptConfigTab";
import { trackAction } from '@/utils/analytics';
import { copyToClipboard as copyTextToClipboard } from '@/utils/clipboard';
import { SaveDialog } from '@/components/features/common/SaveDialog';

interface UserParam {
  required: boolean;
  paramName: string;
  paramType: string;
  paramLabel: string;
  description?: string;
  defaultValue?: string;
  options?: string[];
}

interface DataFactoryPageProps {
  onClose?: () => void;
  definitionId?: string;
  onRefresh?: () => void | Promise<void>;
}

export function DataFactoryPage({
  onClose,
  definitionId,
  onRefresh,
}: DataFactoryPageProps) {
  const [searchParams] = useSearchParams();

  const projectId = useMemo(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    const projectIdFromStorage = localStorage.getItem('currentProjectId');
    const finalProjectId = projectIdFromUrl || projectIdFromStorage;

    if (!finalProjectId) {
      toast.error('项目ID不存在，请先选择项目');
    }

    return finalProjectId || '';
  }, [searchParams]);

  const moduleId = searchParams.get('moduleId') || '';

  const [activeTab, setActiveTab] = useState<"quick" | "config">("quick");
  const [userParams, setUserParams] = useState<UserParam[]>([]);
  const [chainCallTemplate, setChainCallTemplate] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [debugResult, setDebugResult] = useState<string>('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveTags, setSaveTags] = useState<string[]>(["SCRIPT"]);
  const [saveModuleId, setSaveModuleId] = useState(moduleId);
  const [moduleTree, setModuleTree] = useState<MetadataModuleNode[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [executionCount, setExecutionCount] = useState<number>(1);
  const [enableGlobalsVariables, setEnableGlobalsVariables] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  // 当前脚本对应的 definitionId：
  // - 打开已有脚本：初始为 props.definitionId
  // - 新建脚本第一次保存成功后：更新为后端返回的 id，后续保存走 update 接口
  const [currentDefinitionId, setCurrentDefinitionId] = useState<string | null>(definitionId ?? null);
  // 左右分栏：左侧（描述+参数）宽度占比，默认 45%
  const [leftPanelPercent, setLeftPanelPercent] = useState(45);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const paramTypes = [
    { value: "str", label: "str (字符串)" },
    { value: "int", label: "int (整数)" },
    { value: "float", label: "float (浮点数)" },
    { value: "bool", label: "bool (布尔值)" },
    { value: "list", label: "list (列表)" },
    { value: "dict", label: "dict (字典)" },
    { value: "tuple", label: "tuple (元组)" },
    { value: "set", label: "set (集合)" },
    { value: "None", label: "None (空值)" },
  ];

  useEffect(() => {
    const loadModuleTree = async () => {
      if (!projectId) return;
      try {
        const tree = await metadataService.getModuleTree(projectId);
        setModuleTree(tree);
      } catch (error) {
        // Silent fail
      }
    };
    loadModuleTree();
  }, [projectId]);

  // 加载环境列表
  useEffect(() => {
    const loadEnvironments = async () => {
      if (!projectId || !enableGlobalsVariables) {
        setEnvironments([]);
        return;
      }
      try {
        setLoadingEnvironments(true);
        const response = await environmentService.getEnvironmentList({
          projectId: projectId,
          current: 1,
          pageSize: 100,
        });
        setEnvironments(response.records || response || []);
      } catch (error) {
        console.error('加载环境列表失败:', error);
        setEnvironments([]);
      } finally {
        setLoadingEnvironments(false);
      }
    };
    loadEnvironments();
  }, [projectId, enableGlobalsVariables]);

  useEffect(() => {
    if (definitionId) {
      setCurrentDefinitionId(definitionId);
      loadDefinition();
    } else {
      setCurrentDefinitionId(null);
    }
  }, [definitionId]);

  useEffect(() => {
    setSaveModuleId(moduleId);
  }, [moduleId]);

  // 左右分栏：拖拽调整左侧（描述+参数）与右侧（执行结果）宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      const container = resizeRef.current.closest('.data-factory-quick-split');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const percent = Math.round((mouseX / containerRect.width) * 100);
      const clamped = Math.min(75, Math.max(25, percent));
      setLeftPanelPercent(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const loadDefinition = async () => {
    try {
      setIsLoading(true);
      const response = await http.get(`/metadata/definition/get/${definitionId}`);
      const definition = response.data || response;

      if (definition.name) {
        setSaveName(definition.name);
      }
      if (definition.description) {
        setSaveDescription(definition.description);
      }
      if (definition.tags && Array.isArray(definition.tags)) {
        setSaveTags(definition.tags);
      } else {
        setSaveTags(["SCRIPT"]);
      }
      if (definition.moduleId) {
        setSaveModuleId(definition.moduleId);
      }

      if (definition.requestConfig) {
        if (definition.requestConfig.userParams) {
          // 后端返回的 bool 可能是 true/false，统一转为大写 True/False 用于展示；为空时默认 False
          setUserParams((definition.requestConfig.userParams as UserParam[]).map((p: UserParam) => {
            if (p.paramType === 'bool') {
              if (p.defaultValue !== undefined && p.defaultValue !== null && p.defaultValue !== '') {
                const v = p.defaultValue;
                const normalized = typeof v === 'boolean' ? (v ? 'True' : 'False') : (String(v).toLowerCase() === 'false' ? 'False' : 'True');
                return { ...p, defaultValue: normalized };
              } else {
                // 返回为空或没有默认值时，默认显示 False
                return { ...p, defaultValue: 'False' };
              }
            }
            return { ...p };
          }));
        }
        if (definition.requestConfig.chainCallTemplate) {
          setChainCallTemplate(definition.requestConfig.chainCallTemplate);
        }
        if (definition.requestConfig.enableGlobalsVariables !== undefined) {
          setEnableGlobalsVariables(definition.requestConfig.enableGlobalsVariables);
        }
        if (definition.requestConfig.selectedEnvironmentId) {
          setSelectedEnvironmentId(definition.requestConfig.selectedEnvironmentId);
        }
      }

      if (definition.scriptContent) {
        const scriptId = definition.scriptContent;
        setScriptId(scriptId);
        try {
          const scriptResponse = await http.get(`/metadata/definition/script/${scriptId}`);
          const scriptData = scriptResponse.data || scriptResponse;
          if (scriptData.scriptContent) {
            setScriptContent(scriptData.scriptContent);
          }
        } catch (scriptError: any) {
          toast.error('加载脚本内容失败');
        }
      }
    } catch (error: any) {
      toast.error('加载配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const addUserParam = () => {
    setUserParams([
      ...userParams,
      {
        required: true,
        paramName: "",
        paramType: "str",
        paramLabel: "",
        description: "",
        defaultValue: "",
      },
    ]);
  };

  const updateUserParam = (
    index: number,
    field: keyof UserParam,
    value: any,
  ) => {
    const updated = [...userParams];
    updated[index] = { ...updated[index], [field]: value };
    // 当参数类型改为 bool 时，如果默认值为空，自动设置为 'False'
    if (field === 'paramType' && value === 'bool' && (!updated[index].defaultValue || updated[index].defaultValue === '')) {
      updated[index].defaultValue = 'False';
    }
    setUserParams(updated);
  };

  const removeUserParam = (index: number) => {
    setUserParams(userParams.filter((_, i) => i !== index));
  };

  const addOption = (paramIndex: number) => {
    const updated = [...userParams];
    if (!updated[paramIndex].options) {
      updated[paramIndex].options = [];
    }
    updated[paramIndex].options!.push("");
    setUserParams(updated);
  };

  const updateOption = (
    paramIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const updated = [...userParams];
    if (updated[paramIndex].options) {
      updated[paramIndex].options![optionIndex] = value;
      setUserParams(updated);
    }
  };

  const removeOption = (paramIndex: number, optionIndex: number) => {
    const updated = [...userParams];
    if (updated[paramIndex].options) {
      updated[paramIndex].options = updated[paramIndex].options!.filter(
        (_, i) => i !== optionIndex,
      );
      setUserParams(updated);
    }
  };

  const handleGenerateData = async () => {
    if (!chainCallTemplate.trim()) {
      toast.error('请配置链式调用模板');
      return;
    }

    const missingParams = userParams.filter(
      p => !p.paramName.trim() || !p.paramType.trim(),
    );
    if (missingParams.length > 0) {
      toast.error('请填写完整的参数信息（参数名称和参数类型）');
      return;
    }

    if (!scriptContent.trim()) {
      toast.error('请先配置Python脚本');
      return;
    }

    // 如果启用了环境变量，必须选择环境
    if (enableGlobalsVariables && !selectedEnvironmentId) {
      toast.error('请选择环境');
      return;
    }

    // 埋点：记录执行开始时间
    const executeStartTime = Date.now();

    try {
      setIsExecuting(true);
      setExecutionResult(null);
      setDebugResult(''); // 清空脚本执行结果

      const params = userParams
        .filter(p => p.paramName.trim())
        .map(param => {
          const paramName = param.paramName.trim();
          const defaultValue = param.defaultValue || '';

          let value: any;
          if (param.paramType === 'int') {
            value = defaultValue ? parseInt(defaultValue) : 0;
          } else if (param.paramType === 'float') {
            value = defaultValue ? parseFloat(defaultValue) : 0.0;
          } else if (param.paramType === 'bool') {
            value = defaultValue === 'true' || defaultValue === 'True' || defaultValue === 'True';
          } else if (param.paramType === 'list' || param.paramType === 'tuple' || param.paramType === 'set') {
            try {
              value = defaultValue ? JSON.parse(defaultValue) : [];
            } catch {
              value = defaultValue ? defaultValue.split(',') : [];
            }
          } else if (param.paramType === 'dict') {
            try {
              value = defaultValue ? JSON.parse(defaultValue) : {};
            } catch {
              value = defaultValue ? {} : {};
            }
          } else if (param.paramType === 'None') {
            value = null;
          } else {
            value = defaultValue;
          }

          // 后端要求 params[].value 为 string/int/float/bool；list/dict 需传 JSON 字符串供后端解析
          const finalValue = (param.paramType === 'list' || param.paramType === 'tuple' || param.paramType === 'set' || param.paramType === 'dict')
            ? JSON.stringify(value)  // 传 JSON 字符串，如 '["B0DD3WS671","B0C1JZBH9F"]'
            : String(value);

          return {
            key: paramName,
            value: finalValue,
            type: param.paramType,
            valid: true,
          };
        });

      const requestData: any = {
        type: 'python',
        script: scriptContent.trim(),
        chainCallTemplate: chainCallTemplate.trim() || undefined,
        params: params,
        projectId: projectId || '',
        executionCount: executionCount,
      };

      // 如果启用了环境变量，传递环境 ID
      if (enableGlobalsVariables && selectedEnvironmentId) {
        requestData.environmentId = selectedEnvironmentId;
      }

      const result = await runProjectScriptTestAsync(requestData);

      const executionData = {
        code: 200,
        message: result.message,
        success: result.success,
        results: result.results ?? [],
        execution_count: result.execution_count ?? result.results?.length ?? 0,
        ...(result.success === false && result.message ? { error: result.message } : {}),
      };

      setExecutionResult(executionData);
      if (result.success) {
        toast.success('数据生成成功');
      } else {
        toast.error(result.message || '数据生成失败');
      }

      // 埋点：记录执行事件
      const executeEndTime = Date.now();
      const duration = executeEndTime - executeStartTime;
      const userEmail = localStorage.getItem('currentemail') || '';
      trackAction('SCRIPT', {
        protocol: 'SCRIPT',
        page: 'SCRIPT',
        action: 'generate_data',
        scriptId: scriptId || '',
        definitionId: scriptId || '',
        name: saveName || '',
        moduleId: saveModuleId || '',
        projectId: projectId || '',
        executionCount: executionCount,
        success: executionData.success,
        duration: duration,
        email: userEmail || undefined,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '执行失败';
      toast.error(`执行失败: ${errorMessage}`);
      setExecutionResult({
        error: errorMessage,
        details: error?.response?.data || error,
      });

      // 埋点：记录执行失败事件
      const executeEndTime = Date.now();
      const duration = executeEndTime - executeStartTime;
      const userEmail = localStorage.getItem('currentemail') || '';
      trackAction('SCRIPT', {
        protocol: 'SCRIPT',
        page: 'SCRIPT',
        action: 'generate_data',
        scriptId: scriptId || '',
        definitionId: scriptId || '',
        name: saveName || '',
        moduleId: saveModuleId || '',
        projectId: projectId || '',
        executionCount: executionCount,
        success: false,
        error: errorMessage,
        duration: duration,
        email: userEmail || undefined,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // 直接保存方法（第一次调用 add，后续调用 update，保留所有数据）
  const doSave = async (moduleIdToUse: string) => {
    if (!projectId) {
      toast.error('缺少项目ID');
      return;
    }

    if (!saveName.trim()) {
      toast.error('请输入名称');
      return;
    }
    if (!chainCallTemplate.trim()) {
      toast.error('请配置链式调用模板');
      return;
    }
    if (!scriptContent.trim()) {
      toast.error('请输入脚本内容');
      return;
    }

    try {
      setIsSaving(true);

      const formattedUserParams = userParams
        .filter(p => p.paramName.trim())
        .map(param => {
          const result: any = {
            paramName: param.paramName.trim(),
            paramType: param.paramType,
            required: param.required,
          };

          if (param.description) {
            result.description = param.description;
          }
          if (param.defaultValue) {
            if (param.paramType === 'int') {
              result.defaultValue = parseInt(param.defaultValue) || 0;
            } else if (param.paramType === 'float') {
              result.defaultValue = parseFloat(param.defaultValue) || 0.0;
            } else if (param.paramType === 'bool') {
              // 后端要求传大写 True/False 才能保存成功
              result.defaultValue = (param.defaultValue === 'False' || param.defaultValue === 'false') ? 'False' : 'True';
            } else {
              result.defaultValue = param.defaultValue;
            }
          }

          return result;
        });

      const requestConfig: any = {
        userParams: formattedUserParams,
        enableGlobalsVariables: enableGlobalsVariables,
      };

      if (chainCallTemplate.trim()) {
        requestConfig.chainCallTemplate = chainCallTemplate.trim();
      }

      if (enableGlobalsVariables && selectedEnvironmentId) {
        requestConfig.selectedEnvironmentId = selectedEnvironmentId;
      }

      const saveData: any = {
        name: saveName.trim(),
        protocol: 'SCRIPT',
        projectId,
        moduleId: moduleIdToUse,
        requestConfig,
      };

      if (scriptContent.trim()) {
        saveData.scriptContent = scriptContent.trim();
      }

      if (saveDescription.trim()) {
        saveData.description = saveDescription.trim();
      }
      if (saveTags.length > 0) {
        saveData.tags = saveTags;
      }

      // 已有 definitionId：走 update；否则第一次保存走 add，并把返回的 id 写入 currentDefinitionId，后续保存使用 update
      // 后端响应格式与 RocketMQ 一致：{ code: 100200, data: "id字符串" } 或 { data: { id, ... } }
      if (currentDefinitionId) {
        const updateResponse = await http.post('/metadata/definition/update', {
          id: currentDefinitionId,
          ...saveData,
        });
        const updatedRaw = updateResponse.data ?? updateResponse;
        const newId = typeof updatedRaw === 'string' ? updatedRaw : (updatedRaw?.id ?? updatedRaw?.definitionId ?? currentDefinitionId);
        if (newId) {
          setCurrentDefinitionId(String(newId));
        }
        if (typeof updatedRaw === 'object' && updatedRaw?.scriptContent) {
          setScriptId(updatedRaw.scriptContent);
        }
        toast.success('保存成功');
      } else {
        const addResponse = await http.post('/metadata/definition/add', saveData);
        const addedRaw = addResponse.data ?? addResponse;
        const newId = typeof addedRaw === 'string' ? addedRaw : (addedRaw?.id ?? addedRaw?.definitionId ?? null);
        if (newId) {
          setCurrentDefinitionId(String(newId));
        }
        if (typeof addedRaw === 'object' && addedRaw?.scriptContent) {
          setScriptId(addedRaw.scriptContent);
        }
        toast.success('保存成功');
      }

      // 刷新模块协议列表
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      toast.error(`保存失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理保存
  const handleSave = async () => {
    // 校验必填：名称、链式调用模板、脚本内容（描述为非必填）
    if (!saveName.trim()) {
      toast.error('请输入名称');
      return;
    }
    if (!chainCallTemplate.trim()) {
      toast.error('请配置链式调用模板');
      return;
    }
    if (!scriptContent.trim()) {
      toast.error('请输入脚本内容');
      return;
    }

    // 如果已经有 definitionId，直接保存（更新不需要选择模块）
    if (currentDefinitionId) {
      let finalModuleId = saveModuleId;
      if (!finalModuleId) {
        const findScriptRootModule = (nodes: MetadataModuleNode[]): string | null => {
          for (const node of nodes) {
            if (node.type === 'SCRIPT' && node.parentId === 'NONE') {
              return node.id;
            }
            if (node.children && node.children.length > 0) {
              const found = findScriptRootModule(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        const scriptRootModuleId = findScriptRootModule(moduleTree);
        if (scriptRootModuleId) {
          finalModuleId = scriptRootModuleId;
        } else {
          toast.error('未找到造数工厂根模块，请先创建模块');
          return;
        }
      }
      await doSave(finalModuleId);
    } else {
      // 打开保存对话框（新增需要选择模块）
      setIsSaveDialogOpen(true);
    }
  };

  // 处理保存对话框确认
  const handleSaveDialogConfirm = async () => {
    if (!saveModuleId) {
      toast.error('请选择模块');
      return;
    }
    // 调用直接保存方法
    await doSave(saveModuleId);
    // 关闭保存对话框
    setIsSaveDialogOpen(false);
  };

  const copyToClipboard = async (text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) toast.success('已复制到剪贴板');
    else toast.error('复制失败');
  };

  // 执行脚本（调试模式，和 ScriptConfigTab 中的逻辑一样）
  const handleDebugRun = async () => {
    if (!scriptContent.trim()) {
      toast.error('请先编写Python脚本');
      return;
    }

    // 埋点：记录执行开始时间
    const executeStartTime = Date.now();
    const finalScriptId = scriptId || `DATA${new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]}`;
    const userEmail = localStorage.getItem('currentemail') || '';

    try {
      setIsDebugging(true);
      setDebugResult('');
      setExecutionResult(null); // 清空一键造数结果

      if (!userEmail) {
        toast.error('无法获取用户邮箱，请先登录');
        setIsDebugging(false);
        return;
      }

      const requestData = {
        textCode: scriptContent.trim(),
        bizCode: finalScriptId,
        author: userEmail,
      };

      const result = await runDataCodeAsync(requestData, (msg) => setDebugResult(msg));

      const outputContent = result.output || result.message;
      if (outputContent) {
        setDebugResult(outputContent);
      } else {
        setDebugResult(result.success ? '执行完成' : result.message || '执行失败');
      }

      if (result.success) {
        toast.success('脚本执行成功');
      } else {
        toast.error(result.message || '脚本执行失败');
      }

      const executeEndTime = Date.now();
      const duration = executeEndTime - executeStartTime;
      trackAction('SCRIPT', {
        protocol: 'SCRIPT',
        page: 'SCRIPT',
        action: 'debug_execute',
        scriptId: finalScriptId,
        definitionId: scriptId || finalScriptId || '',
        name: saveName || '',
        moduleId: saveModuleId || '',
        projectId: projectId || '',
        success: result.success,
        duration: duration,
        email: userEmail || undefined,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '执行失败';
      setDebugResult(`错误: ${errorMessage}\n${error?.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`);
      toast.error(`执行失败: ${errorMessage}`);

      // 埋点：记录执行失败事件
      const executeEndTime = Date.now();
      const duration = executeEndTime - executeStartTime;
      trackAction('SCRIPT', {
        protocol: 'SCRIPT',
        page: 'SCRIPT',
        action: 'debug_execute',
        scriptId: finalScriptId,
        definitionId: scriptId || finalScriptId || '',
        name: saveName || '',
        moduleId: saveModuleId || '',
        projectId: projectId || '',
        success: false,
        error: errorMessage,
        duration: duration,
        email: userEmail || undefined,
      });
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 min-w-0 flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all duration-200 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="请输入名称 *"
                  className="text-xl font-bold text-gray-900 border-0 shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 bg-transparent placeholder:text-gray-400 w-full hover:bg-gray-50/50 rounded transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                <Select
                  value={executionCount.toString()}
                  onValueChange={(v) => setExecutionCount(parseInt(v))}
                >
                  <SelectTrigger className="w-24 h-9 text-xs border-0 bg-transparent focus:ring-0 shadow-none hover:bg-white rounded transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">执行 1 次</SelectItem>
                    <SelectItem value="5">执行 5 次</SelectItem>
                    <SelectItem value="10">执行 10 次</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <Button
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 rounded-md gap-2"
                  onClick={handleGenerateData}
                  disabled={isExecuting || isLoading}
                >
                  {isExecuting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isExecuting ? '生成中...' : '运行'}
                </Button>
                <Button
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 rounded-md gap-2"
                  onClick={handleDebugRun}
                  disabled={isDebugging || isLoading}
                >
                  {isDebugging ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      执行脚本
                    </>
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg shadow-sm"
                onClick={handleSave}
                disabled={isLoading}
                title="保存"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-gray-50/50 flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-shrink-0 min-h-[52px] bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="h-9 bg-gray-100 p-0.5 rounded-lg w-fit shrink-0">
                <TabsTrigger
                  value="quick"
                  className="h-8 rounded-md px-4 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  一键造数
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className="h-8 rounded-md px-4 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm transition-all duration-200"
                >
                  脚本配置
                </TabsTrigger>
              </TabsList>
              {enableGlobalsVariables && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600 whitespace-nowrap">
                    环境选择
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={selectedEnvironmentId}
                    onValueChange={setSelectedEnvironmentId}
                    disabled={loadingEnvironments}
                  >
                    <SelectTrigger className="w-40 h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                      <SelectValue placeholder={loadingEnvironments ? "加载中..." : "请选择运行环境"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEnvironments ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">加载中...</div>
                      ) : environments.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">暂无环境</div>
                      ) : (
                        environments.map((env) => (
                          <SelectItem key={env.id} value={env.id || ''}>
                            {env.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <TabsContent value="quick" className="flex-1 m-0 flex flex-col overflow-hidden min-h-0 data-factory-quick-split">
            {/* 左右分栏：左侧 描述+参数配置，右侧 执行结果 */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* 左侧：描述 + 参数配置 */}
              <div
                className="overflow-y-auto shrink-0 bg-gray-50/50"
                style={{ width: `${leftPanelPercent}%`, minWidth: 280 }}
              >
                <div className="p-6 space-y-8">
                {/* 描述 - 新增/编辑均可见，支持换行 */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <Label htmlFor="df-description" className="text-sm font-medium text-gray-900 mb-3 block flex items-center gap-2 !select-text">
                    <div className="w-1 h-4 bg-blue-500 rounded-full shrink-0 pointer-events-none" aria-hidden></div>
                    描述（选填）
                  </Label>
                  <Textarea
                    id="df-description"
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="请输入描述（支持换行）"
                    rows={3}
                    className="min-h-[4.5rem] text-sm border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y"
                  />
                </div>

                {userParams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 select-text">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 pointer-events-none">
                      <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">暂无参数配置</h3>
                    <p className="text-sm text-gray-500 mb-4">请先在"脚本配置"标签页添加参数</p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('config')}
                      className="gap-2"
                    >
                      去配置
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 select-text">
                      <div className="w-1 h-4 bg-blue-500 rounded-full shrink-0 pointer-events-none" aria-hidden></div>
                      <h3 className="text-sm font-medium text-gray-900">参数配置</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {userParams
                        .filter(p => p.paramName.trim())
                        .map((param, index) => (
                          <div
                            key={index}
                            className="group bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <Label className="text-sm font-medium text-gray-700 leading-tight pt-1 whitespace-pre-wrap !select-text">
                                  {param.description || param.paramName}
                                </Label>
                                {param.required && (
                                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0 font-medium">
                                    必填
                                  </span>
                                )}
                              </div>

                              <div>
                                {param.paramType === "bool" ? (
                                  <Select
                                    value={(param.defaultValue === 'True' || param.defaultValue === 'true') ? 'True' : 'False'}
                                    onValueChange={(v) => updateUserParam(index, "defaultValue", v)}
                                  >
                                    <SelectTrigger className="h-9 text-sm border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                                      <SelectValue placeholder="请选择" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="True">True</SelectItem>
                                      <SelectItem value="False">False</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : param.options && param.options.length > 0 ? (
                                  <Select
                                    value={param.defaultValue || ""}
                                    onValueChange={(v) =>
                                      updateUserParam(index, "defaultValue", v)
                                    }
                                  >
                                    <SelectTrigger className="h-9 text-sm border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                                      <SelectValue placeholder="请选择" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {param.options.map((option, optIndex) => (
                                        <SelectItem key={optIndex} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    value={param.defaultValue || ""}
                                    onChange={(e) =>
                                      updateUserParam(index, "defaultValue", e.target.value)
                                    }
                                    placeholder={
                                      param.paramType === "int"
                                        ? "请输入整数"
                                        : param.paramType === "float"
                                          ? "请输入浮点数"
                                          : "请输入值"
                                    }
                                    className="h-9 text-sm border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* 可拖拽的垂直分割线 */}
              <div
                ref={resizeRef}
                className="w-2 flex-shrink-0 flex items-center justify-center bg-gray-100 hover:bg-blue-100 cursor-col-resize transition-colors group"
                onMouseDown={(e) => {
                  setIsResizing(true);
                  e.preventDefault();
                }}
              >
                <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-blue-500 transition-colors rounded-full"></div>
              </div>

              {/* 右侧：执行结果（黑色控制台风格） */}
              <div className="flex-1 min-w-0 flex flex-col p-4 bg-gray-100">
                <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-gray-300 shadow-lg flex flex-col bg-[#1e1e1e]">
                  {/* 控制台标题栏 */}
                  <div className="flex items-center justify-between px-4 py-2 bg-[#323233] border-b border-[#3c3c3c] shrink-0">
                    <span className="text-xs text-gray-400 font-medium">
                      Terminal
                      {!debugResult && executionResult?.execution_count && (
                        <span className="text-gray-500 ml-1">(共 {executionResult.execution_count} 次)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      {debugResult && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/10"
                          onClick={() => copyToClipboard(debugResult)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          复制
                        </Button>
                      )}
                      {!debugResult && executionResult?.results && Array.isArray(executionResult.results) && executionResult.results.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/10"
                          onClick={() => {
                            const allOutputs = executionResult.results
                              .map((result: any, index: number) => {
                                return `=== 执行 ${result.execution_index || index + 1} ===\n${result.output || ''}${result.error_output ? `\n错误输出:\n${result.error_output}` : ''}`;
                              })
                              .join('\n\n');
                            copyToClipboard(allOutputs);
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          复制全部
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* 控制台内容区 */}
                  <div className="flex-1 min-h-0 overflow-auto p-4 bg-[#1e1e1e] font-mono text-[13px] leading-relaxed" style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 #2d2d2d' }}>
                    {debugResult ? (
                      <pre className="text-[#d4d4d4] whitespace-pre-wrap break-words">
                        {debugResult}
                      </pre>
                    ) : executionResult?.results && Array.isArray(executionResult.results) && executionResult.results.length > 0 ? (
                      <div className="space-y-4">
                        {executionResult.results.map((result: any, index: number) => (
                          <div key={`execution-${result.execution_index || index + 1}-${index}`} className="space-y-2">
                            <div className="flex items-center justify-between text-[#858585]">
                              <span>
                                执行 #{result.execution_index || index + 1}
                                {result.success ? (
                                  <span className="ml-2 text-[#4ec9b0]">✓</span>
                                ) : (
                                  <span className="ml-2 text-[#f14c4c]">✗</span>
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                onClick={() => {
                                  const output = result.output || '';
                                  const errorOutput = result.error_output || '';
                                  const fullOutput = errorOutput ? `${output}\n\n错误输出:\n${errorOutput}` : output;
                                  copyToClipboard(fullOutput);
                                }}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                复制
                              </Button>
                            </div>
                            {result.output && (
                              <pre className="text-[#d4d4d4] whitespace-pre-wrap break-words">
                                {result.output}
                              </pre>
                            )}
                            {result.error_output && (
                              <pre className="text-[#f14c4c] whitespace-pre-wrap break-words">
                                {result.error_output}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#858585]">执行结果将显示在这里</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <ScriptConfigTab
            userParams={userParams}
            chainCallTemplate={chainCallTemplate}
            scriptContent={scriptContent}
            scriptId={scriptId}
            isFullscreen={isFullscreen}
            paramTypes={paramTypes}
            enableGlobalsVariables={enableGlobalsVariables}
            tags={saveTags}
            onUserParamsChange={setUserParams}
            onChainCallTemplateChange={setChainCallTemplate}
            onScriptContentChange={setScriptContent}
            onFullscreenChange={setIsFullscreen}
            onAddUserParam={addUserParam}
            onUpdateUserParam={updateUserParam}
            onRemoveUserParam={removeUserParam}
            onEnableGlobalsVariablesChange={setEnableGlobalsVariables}
            onTagsChange={setSaveTags}
          />
        </Tabs>
      </div>

      <SaveDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        moduleTree={moduleTree}
        moduleId={saveModuleId}
        description={saveDescription}
        tags={saveTags.join(', ')}
        onDescriptionChange={setSaveDescription}
        onTagsChange={(tagsStr) => {
          const tagsArray = tagsStr
            ? tagsStr.split(',').map((t) => t.trim()).filter((t) => t)
            : [];
          setSaveTags(tagsArray.length > 0 ? tagsArray : ['SCRIPT']);
        }}
        onModuleIdChange={setSaveModuleId}
        moduleType="SCRIPT"
        projectId={projectId}
        onModuleTreeRefresh={async () => {
          try {
            const tree = await metadataService.getModuleTree(projectId);
            setModuleTree(tree);
          } catch (error) {
            console.error('刷新模块树失败:', error);
          }
        }}
        onConfirm={handleSaveDialogConfirm}
        saving={isSaving}
        showDescription={true}
        showTags={false}
      />
    </div>
  );
}