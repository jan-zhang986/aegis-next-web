/**
 * AegisAgent 控制面板组件
 * 提供配置和控制 AegisAgent 的 UI 界面
 * 支持拖拽移动位置
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings,
  Play,
  Square,
  Key,
  Globe,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  MessageSquare,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { AegisAgentStorageConfig } from '@/types/aegisAgent';
import { DEMO_AEGIS_AGENT_CONFIG } from '@/types/aegisAgent';
import {
  getStoredConfig,
  saveConfig,
  validateConfig,
  buildConfig,
  initAegisAgent,
  stopAegisAgent,
  isAegisAgentRunning,
} from '@/services/aegis-agent';

/** 预设模型列表 */
const PRESET_MODELS = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'qwen-max', label: '通义千问 Max' },
  { value: 'qwen-plus', label: '通义千问 Plus' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'custom', label: '自定义模型' },
];

const POSITION_STORAGE_KEY = 'aegis-agent-panel-position';
/** 快捷键：Ctrl/Cmd + B 唤出/隐藏面板 */
const PANEL_HOTKEY = (e: KeyboardEvent) => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b';

interface Position {
  x: number;
  y: number;
}

// 默认位置：右下角
const getDefaultPosition = () => ({
  x: window.innerWidth - 340,
  y: window.innerHeight - 80,
});

interface AegisAgentPanelProps {
  /** 初始是否展开 */
  defaultExpanded?: boolean;
}

export function AegisAgentPanel({ defaultExpanded = false }: AegisAgentPanelProps) {
  // 面板默认隐藏，通过快捷键 Ctrl/Cmd+Shift+A 唤出
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  // 状态
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // 拖拽相关状态 - 使用 left/top 定位
  const [position, setPosition] = useState<Position>(getDefaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const dragStartMousePos = useRef<Position>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 配置表单
  const [useDemoConfig, setUseDemoConfig] = useState(true); // 默认使用 DEMO 配置
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini');
  const [customModel, setCustomModel] = useState('');
  const [autoStart, setAutoStart] = useState(false);

  // 加载存储的位置
  useEffect(() => {
    try {
      const storedPosition = localStorage.getItem(POSITION_STORAGE_KEY);
      if (storedPosition) {
        const parsed = JSON.parse(storedPosition);
        // 确保位置在屏幕范围内
        const x = Math.min(Math.max(0, parsed.x), window.innerWidth - 100);
        const y = Math.min(Math.max(0, parsed.y), window.innerHeight - 60);
        setPosition({ x, y });
      }
    } catch (error) {
      console.error('Failed to load panel position:', error);
    }
  }, []);

  // 快捷键 Ctrl/Cmd+B 唤出或隐藏面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (PANEL_HOTKEY(e)) {
        e.preventDefault();
        setIsPanelVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 鼠标按下 - 准备拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 如果点击的是按钮等交互元素，不处理
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    e.preventDefault();

    // 记录开始位置
    dragStartPos.current = { ...position };
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, [position]);

  // 全局鼠标移动和松开事件
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 计算移动距离
      const deltaX = e.clientX - dragStartMousePos.current.x;
      const deltaY = e.clientY - dragStartMousePos.current.y;

      // 新位置
      let newX = dragStartPos.current.x + deltaX;
      let newY = dragStartPos.current.y + deltaY;

      // 限制在窗口范围内
      const panelWidth = panelRef.current?.offsetWidth || 320;
      const panelHeight = panelRef.current?.offsetHeight || 60;

      newX = Math.max(0, Math.min(window.innerWidth - panelWidth, newX));
      newY = Math.max(0, Math.min(window.innerHeight - panelHeight, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // 计算移动距离，判断是点击还是拖拽
      const deltaX = Math.abs(e.clientX - dragStartMousePos.current.x);
      const deltaY = Math.abs(e.clientY - dragStartMousePos.current.y);

      const wasDragged = deltaX > 5 || deltaY > 5;

      if (!wasDragged) {
        // 是点击，切换展开状态
        setIsExpanded(prev => !prev);
      } else {
        // 是拖拽，保存位置
        const finalPos = {
          x: dragStartPos.current.x + (e.clientX - dragStartMousePos.current.x),
          y: dragStartPos.current.y + (e.clientY - dragStartMousePos.current.y),
        };
        // 限制范围
        const panelWidth = panelRef.current?.offsetWidth || 320;
        const panelHeight = panelRef.current?.offsetHeight || 60;
        finalPos.x = Math.max(0, Math.min(window.innerWidth - panelWidth, finalPos.x));
        finalPos.y = Math.max(0, Math.min(window.innerHeight - panelHeight, finalPos.y));

        try {
          localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(finalPos));
        } catch (error) {
          console.error('Failed to save position:', error);
        }
      }

      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 加载存储的配置
  useEffect(() => {
    const stored = getStoredConfig();
    if (stored) {
      // 检查是否使用默认配置（如果配置为空或与默认配置相同，则使用默认配置）
      const isUsingDemo = !stored.apiKey ||
        stored.apiKey === DEMO_AEGIS_AGENT_CONFIG.DEMO_API_KEY ||
        stored.useDemoConfig === true;

      setUseDemoConfig(isUsingDemo);

      if (isUsingDemo) {
        // 使用默认配置时，显示默认值但不保存到表单
        setApiKey('');
        setBaseURL('');
        setSelectedModel(DEMO_AEGIS_AGENT_CONFIG.DEMO_MODEL);
      } else {
        // 使用自定义配置
        setApiKey(stored.apiKey || '');
        setBaseURL(stored.baseURL || '');

        // 检查是否是预设模型
        const isPreset = PRESET_MODELS.some(m => m.value === stored.model && m.value !== 'custom');
        if (isPreset) {
          setSelectedModel(stored.model || 'gpt-4.1-mini');
        } else if (stored.model) {
          setSelectedModel('custom');
          setCustomModel(stored.model);
        }
      }

      setIsConfigured(true); // 有配置（默认或自定义）就算已配置
    } else {
      // 没有存储配置，使用默认配置
      setUseDemoConfig(true);
      setIsConfigured(true); // 默认配置也算已配置
    }

    // 检查是否正在运行
    setIsRunning(isAegisAgentRunning());
  }, []);

  // 监听 AegisAgent 状态变化（当内置界面关闭时同步状态）
  useEffect(() => {
    if (!isRunning) return;

    const checkStatus = () => {
      const stillRunning = isAegisAgentRunning();
      if (!stillRunning && isRunning) {
        setIsRunning(false);
      }
    };

    // 定期检查状态
    const interval = setInterval(checkStatus, 500);

    return () => clearInterval(interval);
  }, [isRunning]);

  // 获取当前模型名称
  const getCurrentModel = useCallback(() => {
    return selectedModel === 'custom' ? customModel : selectedModel;
  }, [selectedModel, customModel]);

  // 保存配置
  const handleSaveConfig = useCallback(() => {
    let config: AegisAgentStorageConfig;

    if (useDemoConfig) {
      // 使用默认配置
      config = {
        useDemoConfig: true,
        enabled: autoStart,
      };
    } else {
      // 使用自定义配置
      config = {
        apiKey,
        baseURL,
        model: getCurrentModel(),
        enabled: autoStart,
        useDemoConfig: false,
      };

      const validation = validateConfig(config);
      if (!validation.valid) {
        toast.error('配置验证失败', {
          description: validation.errors.join(', '),
        });
        return;
      }
    }

    saveConfig(config);
    setIsConfigured(true);
    setShowSettings(false);
    toast.success('配置已保存');
  }, [useDemoConfig, apiKey, baseURL, getCurrentModel, autoStart]);

  // 启动 AegisAgent
  const handleStart = useCallback(async () => {
    const stored = getStoredConfig();
    const useDemo = !stored || stored.useDemoConfig || !stored.apiKey;

    // 如果使用自定义配置，需要验证
    if (!useDemo && stored) {
      const validation = validateConfig(stored);
      if (!validation.valid) {
        toast.error('配置无效', {
          description: validation.errors.join(', '),
        });
        setShowSettings(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      const config = buildConfig(stored || {}, useDemo);
      const success = await initAegisAgent(config);

      if (success) {
        setIsRunning(true);
        setIsExpanded(false); // 启动后自动收起面板
        toast.success('AegisAgent 已启动', {
          description: '你可以使用自然语言控制页面了',
        });
      } else {
        toast.error('启动失败', {
          description: '请检查配置是否正确',
        });
      }
    } catch (error) {
      console.error('Failed to start AegisAgent:', error);
      toast.error('启动失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 停止 AegisAgent
  const handleStop = useCallback(() => {
    stopAegisAgent();
    setIsRunning(false);
    toast.info('AegisAgent 已停止');
  }, []);

  // 渲染状态指示器
  const renderStatusBadge = () => {
    if (isRunning) {
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          运行中
        </Badge>
      );
    }
    if (isConfigured) {
      return (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          已配置
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
        <AlertCircle className="w-3 h-3" />
        未配置
      </Badge>
    );
  };

  return (
    <>
      {/* 悬浮面板 - 默认隐藏，通过 Ctrl/Cmd+Shift+A 唤出 */}
      {isPanelVisible && (
        <div
          ref={panelRef}
          className="fixed z-40"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div
            className={`
              bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl
              transition-all duration-200 overflow-hidden
              ${isExpanded ? 'w-80' : 'w-auto'}
              ${isDragging ? 'opacity-90 shadow-lg shadow-cyan-500/20' : ''}
            `}
          >
            {/* 头部 - 始终可见，支持拖拽移动 */}
            <div
              className={`
                flex items-center justify-between px-4 py-3 
                hover:bg-[#161b22] transition-colors select-none
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
              `}
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  {isRunning && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d1117] animate-pulse" />
                  )}
                </div>
                {isExpanded && (
                  <div>
                    <h3 className="text-sm font-semibold text-white">AI Agent</h3>
                    <p className="text-xs text-gray-400">AI 智能操作助手</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isExpanded && renderStatusBadge()}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-gray-400 hover:text-white hover:bg-[#21262d]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPanelVisible(false);
                  }}
                  title="隐藏面板 (Ctrl+B / Cmd+B 可再次唤出)"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

          {/* 展开内容 */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-4 border-t border-[#30363d]">
              {/* 功能说明 */}
              <div className="pt-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <MessageSquare className="w-3.5 h-3.5 inline-block mr-1 text-cyan-400" />
                  使用自然语言描述你想要执行的操作，AegisAgent 会自动完成页面交互。
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {isRunning ? (
                  <Button
                    onClick={handleStop}
                    variant="outline"
                    className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    停止
                  </Button>
                ) : (
                  <Button
                    onClick={handleStart}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? '启动中...' : '启动'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  className="bg-[#161b22] border-[#30363d] text-gray-400 hover:text-white hover:bg-[#21262d]"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {/* 快捷提示 */}
              {isRunning && (
                <div className="bg-[#161b22] rounded-lg p-3 border border-[#30363d]">
                  <p className="text-xs text-gray-300 mb-2">💡 试试说：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['点击登录按钮', '填写用户名', '提交表单'].map((tip) => (
                      <span
                        key={tip}
                        className="text-xs px-2 py-1 bg-[#21262d] text-gray-400 rounded-md border border-[#30363d]"
                      >
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* 设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-[#0d1117] border-[#30363d]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              AegisAgent 配置
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              配置 AI 模型接口，让 AegisAgent 能够理解并执行你的指令
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* 使用默认配置开关 */}
            <div className="flex items-center justify-between p-3 bg-[#161b22] border border-[#30363d] rounded-lg">
              <div className="flex-1">
                <Label className="text-sm text-gray-300 flex items-center gap-2 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  使用默认配置（免费测试）
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  使用系统提供的免费测试配置，无需输入 API Key
                </p>
              </div>
              <Switch
                checked={useDemoConfig}
                onCheckedChange={setUseDemoConfig}
                className="ml-4"
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                API Key
              </Label>
              <Input
                type="password"
                value={useDemoConfig ? DEMO_AEGIS_AGENT_CONFIG.DEMO_API_KEY : apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={useDemoConfig ? "使用默认配置" : "输入你的 API Key"}
                disabled={useDemoConfig}
                className="bg-[#161b22] border-[#30363d] text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                {useDemoConfig
                  ? '当前使用默认免费测试配置'
                  : '用于调用 AI 模型的密钥，请妥善保管'}
              </p>
            </div>

            {/* 接口地址 */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                模型接口地址
              </Label>
              <Input
                value={useDemoConfig ? DEMO_AEGIS_AGENT_CONFIG.DEMO_BASE_URL : baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder={useDemoConfig ? "使用默认配置" : "https://api.openai.com/v1"}
                disabled={useDemoConfig}
                className="bg-[#161b22] border-[#30363d] text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                {useDemoConfig
                  ? '当前使用默认免费测试接口'
                  : '支持 OpenAI 兼容的 API 接口'}
              </p>
            </div>

            {/* 模型选择 */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                模型
              </Label>
              <Select
                value={useDemoConfig ? DEMO_AEGIS_AGENT_CONFIG.DEMO_MODEL : selectedModel}
                onValueChange={setSelectedModel}
                disabled={useDemoConfig}
              >
                <SelectTrigger
                  className="bg-[#161b22] border-[#30363d] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={useDemoConfig}
                >
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  {PRESET_MODELS.map((model) => (
                    <SelectItem
                      key={model.value}
                      value={model.value}
                      className="text-gray-300 focus:bg-[#21262d] focus:text-white"
                    >
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedModel === 'custom' && (
                <Input
                  value={useDemoConfig ? DEMO_AEGIS_AGENT_CONFIG.DEMO_MODEL : customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder={useDemoConfig ? "使用默认配置" : "输入自定义模型名称"}
                  disabled={useDemoConfig}
                  className="mt-2 bg-[#161b22] border-[#30363d] text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            </div>

            {/* 自动启动 */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm text-gray-300">自动启动</Label>
                <p className="text-xs text-gray-500">页面加载时自动启动 AegisAgent</p>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="bg-[#21262d] border-[#30363d] text-white hover:bg-[#30363d]"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveConfig}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0"
            >
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
