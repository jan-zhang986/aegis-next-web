/**
 * 智能体编辑弹窗（完整版）
 * 从 aegis-rag-frontend AgentEditorModal.vue 迁移
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Info,
  Cpu,
  Folder,
  Wrench,
  Search,
  Globe,
  MessageCircle,
  X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AgentAvatar } from './AgentAvatar';
import { ModelSelector } from '@/components/features/knowledge-base/ModelSelector';
import { PromptTemplateSelector } from './PromptTemplateSelector';
import { agentService } from '@/services/agent';
import { knowledgeBaseService } from '@/services/knowledge-base';
import { mcpService, systemConfigService } from '@/services/agent-settings';
import type { CustomAgent, CustomAgentConfig, PlaceholderDefinition } from '@/types/agent';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface AgentEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  agent: CustomAgent | null;
  onSuccess: () => void;
  initialSection?: string;
}

const NAV_ITEMS: { key: string; icon: typeof Info; label: string }[] = [
  { key: 'basic', icon: Info, label: '基本信息' },
  { key: 'model', icon: Cpu, label: '模型配置' },
  { key: 'knowledge', icon: Folder, label: '知识库' },
  { key: 'tools', icon: Wrench, label: '工具配置' },
  { key: 'retrieval', icon: Search, label: '检索策略' },
  { key: 'websearch', icon: Globe, label: '网络搜索' },
  { key: 'conversation', icon: MessageCircle, label: '多轮对话' },
];

const ALL_TOOLS = [
  { value: 'thinking', label: '思考', requiresKB: false },
  { value: 'todo_write', label: '制定计划', requiresKB: false },
  { value: 'grep_chunks', label: '关键词搜索', requiresKB: true },
  { value: 'knowledge_search', label: '语义搜索', requiresKB: true },
  { value: 'list_knowledge_chunks', label: '查看文档分块', requiresKB: true },
  { value: 'query_knowledge_graph', label: '查询知识图谱', requiresKB: true },
  { value: 'get_document_info', label: '获取文档信息', requiresKB: true },
  { value: 'database_query', label: '查询数据库', requiresKB: true },
  { value: 'data_analysis', label: '数据分析', requiresKB: true },
  { value: 'data_schema', label: '查看数据元信息', requiresKB: true },
];

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word' },
  { value: 'txt', label: '文本' },
  { value: 'md', label: 'Markdown' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'jpg', label: '图片' },
];

const defaultConfig: CustomAgentConfig = {
  agent_mode: 'quick-answer',
  system_prompt: '',
  context_template: '{{query}}',
  model_id: '',
  rerank_model_id: '',
  temperature: 0.7,
  max_completion_tokens: 2048,
  thinking: false,
  max_iterations: 10,
  allowed_tools: [],
  mcp_selection_mode: 'none',
  mcp_services: [],
  kb_selection_mode: 'none',
  knowledge_bases: [],
  supported_file_types: [],
  retrieve_kb_only_when_mentioned: false,
  faq_priority_enabled: true,
  faq_direct_answer_threshold: 0.9,
  faq_score_boost: 1.2,
  web_search_enabled: false,
  web_search_max_results: 5,
  multi_turn_enabled: false,
  history_turns: 5,
  enable_rewrite: true,
  rewrite_prompt_system: '',
  rewrite_prompt_user: '',
  embedding_top_k: 10,
  keyword_threshold: 0.3,
  vector_threshold: 0.5,
  rerank_top_k: 5,
  rerank_threshold: 0.5,
  enable_query_expansion: true,
  fallback_strategy: 'model',
  fallback_response: '',
  fallback_prompt: '',
};

function PlaceholderTags({
  placeholders,
  onInsert,
}: {
  placeholders: PlaceholderDefinition[];
  onInsert: (name: string) => void;
}) {
  if (!placeholders?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      <span className="text-xs text-muted-foreground">可用变量：</span>
      {placeholders.map((p) => (
        <button
          key={p.name}
          type="button"
          className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono cursor-pointer"
          onClick={() => onInsert(p.name)}
          title={p.description}
        >
          {`{{${p.name}}}`}
        </button>
      ))}
    </div>
  );
}

function insertAtCursor(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  insertText: string
): string {
  const el = ref.current;
  if (!el) return value;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = value.substring(0, start);
  const after = value.substring(end);
  return before + insertText + after;
}

export function AgentEditorModal({
  open,
  onOpenChange,
  mode,
  agent,
  onSuccess,
  initialSection = 'basic',
}: AgentEditorModalProps) {
  const [section, setSection] = useState(initialSection);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<CustomAgentConfig>({ ...defaultConfig });
  const [submitting, setSubmitting] = useState(false);
  const [placeholders, setPlaceholders] = useState<Record<string, PlaceholderDefinition[]>>({});
  const [kbOptions, setKbOptions] = useState<{ label: string; value: string; type?: string }[]>([]);
  const [mcpOptions, setMcpOptions] = useState<{ label: string; value: string }[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLTextAreaElement>(null);

  const isBuiltin = agent?.is_builtin ?? false;
  const isAgentMode = config.agent_mode === 'smart-reasoning';
  const kbMode = config.kb_selection_mode ?? 'none';
  const mcpMode = config.mcp_selection_mode ?? 'none';
  const hasKB = kbMode !== 'none';

  const updateConfig = useCallback((patch: Partial<CustomAgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const loadDeps = useCallback(async () => {
    try {
      const [placeholdersRes, kbRes, mcpRes, agentCfg, convCfg] = await Promise.all([
        agentService.getPlaceholders().catch(() => ({ data: {} })),
        knowledgeBaseService.listKnowledgeBases().catch(() => []),
        mcpService.list().catch(() => []),
        systemConfigService.getAgentConfig().catch(() => ({ data: {} })),
        systemConfigService.getConversationConfig().catch(() => ({ data: {} })),
      ]);

      const ph = (placeholdersRes as any)?.data ?? {};
      setPlaceholders(ph);

      const kbList = Array.isArray(kbRes) ? kbRes : (kbRes as any)?.data ?? [];
      setKbOptions(kbList.map((kb: any) => ({ label: kb.name, value: kb.id, type: kb.type })));

      const mcpList = Array.isArray(mcpRes) ? mcpRes : (mcpRes as any)?.data ?? [];
      setMcpOptions(
        mcpList.filter((m: any) => m.enabled).map((m: any) => ({ label: m.name, value: m.id }))
      );

      const modelsRes = await import('@/services/knowledge-base').then((m) =>
        m.modelService.listModels().catch(() => [])
      );
      const models = Array.isArray(modelsRes) ? modelsRes : (modelsRes as any)?.data ?? [];
      setAllModels(models);

      if (agent) return;
      const cc = (convCfg as any)?.data ?? {};
      setConfig((prev) => ({
        ...prev,
        embedding_top_k: cc.embedding_top_k ?? prev.embedding_top_k,
        keyword_threshold: cc.keyword_threshold ?? prev.keyword_threshold,
        vector_threshold: cc.vector_threshold ?? prev.vector_threshold,
        rerank_top_k: cc.rerank_top_k ?? prev.rerank_top_k,
        rerank_threshold: cc.rerank_threshold ?? prev.rerank_threshold,
        context_template: cc.context_template || prev.context_template,
      }));
    } catch (e) {
      console.error('load deps', e);
    }
  }, [agent]);

  useEffect(() => {
    if (open) {
      setSection(initialSection);
      loadDeps();
      if (agent) {
        setName(agent.name || '');
        setDescription(agent.description || '');
        setConfig({ ...defaultConfig, ...agent.config });
      } else {
        setName('');
        setDescription('');
        setConfig({ ...defaultConfig });
      }
    }
  }, [open, agent, initialSection, loadDeps]);

  const handleSubmit = async () => {
    if (!name.trim() && !isBuiltin) {
      toast.error('请输入智能体名称');
      return;
    }
    if (!config.model_id) {
      toast.error('请选择模型');
      return;
    }
    if (hasKB && !config.rerank_model_id) {
      toast.error('使用知识库时请选择 ReRank 模型');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim() || agent?.name,
        description: description.trim(),
        config: { ...config },
      };
      if (mode === 'create') {
        await agentService.create(payload);
        toast.success('智能体创建成功');
      } else if (agent) {
        await agentService.update(agent.id, payload);
        toast.success('智能体更新成功');
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const insertPlaceholder = (field: 'system_prompt' | 'context_template', name: string) => {
    const ref = field === 'system_prompt' ? promptRef : contextRef;
    const tag = `{{${name}}}`;
    updateConfig({ [field]: insertAtCursor(ref, config[field] ?? '', tag) });
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'tools' && !isAgentMode) return false;
    if (item.key === 'conversation' && isAgentMode) return false;
    return true;
  });

  const availablePlaceholders = isAgentMode
    ? placeholders.agent_system_prompt ?? []
    : placeholders.system_prompt ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-4xl sm:max-w-4xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>{mode === 'create' ? '创建智能体' : '编辑智能体'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* 左侧导航 */}
          <aside className="w-52 shrink-0 border-r flex flex-col py-4">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSection(item.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm',
                    section === item.key
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </aside>

          {/* 右侧内容 */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* 基本信息 */}
            {section === 'basic' && (
              <div className="space-y-6 max-w-2xl">
                {isBuiltin && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    内置智能体，名称和描述不可修改，但可调整配置参数
                  </div>
                )}

                <div>
                  <Label>运行模式</Label>
                  <RadioGroup
                    value={config.agent_mode}
                    onValueChange={(v) =>
                      updateConfig({ agent_mode: v as 'quick-answer' | 'smart-reasoning' })
                    }
                    className="flex gap-4 mt-2"
                    disabled={isBuiltin}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="quick-answer" id="q" />
                      <Label htmlFor="q" className="font-normal cursor-pointer">快速问答</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="smart-reasoning" id="a" />
                      <Label htmlFor="a" className="font-normal cursor-pointer">智能推理</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>名称</Label>
                  <div className="flex items-center gap-3 mt-1">
                    {isBuiltin ? (
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                          isAgentMode ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'
                        )}
                      />
                    ) : (
                      <AgentAvatar name={name || '?'} size="large" />
                    )}
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入智能体名称"
                      disabled={isBuiltin}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>描述</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简要描述智能体的用途和特点"
                    rows={2}
                    className="mt-1"
                    disabled={isBuiltin}
                  />
                </div>

                <div>
                  <Label>系统提示词</Label>
                  <PlaceholderTags
                    placeholders={availablePlaceholders}
                    onInsert={(n) => insertPlaceholder('system_prompt', n)}
                  />
                  <div className="relative mt-1">
                    <Textarea
                      ref={promptRef}
                      value={config.system_prompt ?? ''}
                      onChange={(e) => updateConfig({ system_prompt: e.target.value })}
                      placeholder="自定义系统提示词，使用 {{web_search_status}} 等占位符"
                      rows={10}
                      className="font-mono text-sm pr-28"
                    />
                    <div className="absolute right-2 bottom-2">
                      <PromptTemplateSelector
                        type="systemPrompt"
                        hasKnowledgeBase={hasKB}
                        position="corner"
                        onSelect={(c) => updateConfig({ system_prompt: c })}
                      />
                    </div>
                  </div>
                </div>

                {!isAgentMode && (
                  <div>
                    <Label>上下文模板</Label>
                    <PlaceholderTags
                      placeholders={placeholders.context_template ?? []}
                      onInsert={(n) => insertPlaceholder('context_template', n)}
                    />
                    <div className="relative mt-1">
                      <Textarea
                        ref={contextRef}
                        value={config.context_template ?? ''}
                        onChange={(e) => updateConfig({ context_template: e.target.value })}
                        placeholder="需包含 {{contexts}} {{query}}"
                        rows={6}
                        className="font-mono text-sm pr-28"
                      />
                      <div className="absolute right-2 bottom-2">
                        <PromptTemplateSelector
                          type="contextTemplate"
                          hasKnowledgeBase={hasKB}
                          position="corner"
                          onSelect={(c) => updateConfig({ context_template: c })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 模型配置 */}
            {section === 'model' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label>模型</Label>
                  <ModelSelector
                    modelType="KnowledgeQA"
                    selectedModelId={config.model_id}
                    allModels={allModels}
                    onSelectedModelIdChange={(v) => updateConfig({ model_id: v })}
                    placeholder="请选择模型"
                  />
                </div>
                <div>
                  <Label>温度: {config.temperature ?? 0.7}</Label>
                  <Slider
                    value={[config.temperature ?? 0.7]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([v]) => updateConfig({ temperature: v })}
                    className="mt-2"
                  />
                </div>
                {!isAgentMode && (
                  <div>
                    <Label>最大生成 Token 数</Label>
                    <Input
                      type="number"
                      min={100}
                      max={100000}
                      value={config.max_completion_tokens ?? 2048}
                      onChange={(e) =>
                        updateConfig({ max_completion_tokens: parseInt(e.target.value, 10) || 2048 })
                      }
                      className="mt-1 w-40"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>思考模式</Label>
                    <p className="text-xs text-muted-foreground">启用模型扩展思考能力</p>
                  </div>
                  <Switch
                    checked={config.thinking ?? false}
                    onCheckedChange={(v) => updateConfig({ thinking: v })}
                  />
                </div>
                {isAgentMode && (
                  <div>
                    <Label>最大迭代次数</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={config.max_iterations ?? 10}
                      onChange={(e) =>
                        updateConfig({ max_iterations: parseInt(e.target.value, 10) || 10 })
                      }
                      className="mt-1 w-32"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 知识库 */}
            {section === 'knowledge' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label>关联知识库</Label>
                  <RadioGroup
                    value={kbMode}
                    onValueChange={(v) => {
                      updateConfig({ kb_selection_mode: v as 'all' | 'selected' | 'none' });
                      if (v === 'none') updateConfig({ knowledge_bases: [] });
                      if (v === 'all') updateConfig({ knowledge_bases: [] });
                    }}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="kball" />
                      <Label htmlFor="kball" className="font-normal cursor-pointer">全部</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="kbsel" />
                      <Label htmlFor="kbsel" className="font-normal cursor-pointer">指定</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="kbnone" />
                      <Label htmlFor="kbnone" className="font-normal cursor-pointer">禁用</Label>
                    </div>
                  </RadioGroup>
                </div>
                {kbMode === 'selected' && kbOptions.length > 0 && (
                  <div>
                    <Label>选择知识库</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {kbOptions.map((kb) => {
                        const selected = (config.knowledge_bases ?? []).includes(kb.value);
                        return (
                          <label
                            key={kb.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(checked) => {
                                const list = config.knowledge_bases ?? [];
                                updateConfig({
                                  knowledge_bases: checked
                                    ? [...list, kb.value]
                                    : list.filter((id) => id !== kb.value),
                                });
                              }}
                            />
                            <span className="text-sm">{kb.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {hasKB && (
                  <>
                    <div>
                      <Label>支持的文件类型</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {FILE_TYPES.map((ft) => {
                          const selected = (config.supported_file_types ?? []).includes(ft.value);
                          return (
                            <label key={ft.value} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const list = config.supported_file_types ?? [];
                                  updateConfig({
                                    supported_file_types: checked
                                      ? [...list, ft.value]
                                      : list.filter((v) => v !== ft.value),
                                  });
                                }}
                              />
                              <span className="text-sm">{ft.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>仅在 @ 提及时检索</Label>
                        <p className="text-xs text-muted-foreground">只有用户 @ 提及知识库时才检索</p>
                      </div>
                      <Switch
                        checked={config.retrieve_kb_only_when_mentioned ?? false}
                        onCheckedChange={(v) => updateConfig({ retrieve_kb_only_when_mentioned: v })}
                      />
                    </div>
                    <div>
                      <Label>ReRank 模型</Label>
                      <ModelSelector
                        modelType="Rerank"
                        selectedModelId={config.rerank_model_id}
                        allModels={allModels}
                        onSelectedModelIdChange={(v) => updateConfig({ rerank_model_id: v })}
                        placeholder="请选择 ReRank 模型"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 工具配置（Agent 模式） */}
            {section === 'tools' && isAgentMode && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label>允许的工具</Label>
                  <div className="mt-2 space-y-2">
                    {ALL_TOOLS.map((t) => {
                      const disabled = t.requiresKB && !hasKB;
                      const checked = (config.allowed_tools ?? []).includes(t.value);
                      return (
                        <label
                          key={t.value}
                          className={cn(
                            'flex items-center gap-2 cursor-pointer',
                            disabled && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(c) => {
                              const list = config.allowed_tools ?? [];
                              updateConfig({
                                allowed_tools: c
                                  ? [...list, t.value]
                                  : list.filter((v) => v !== t.value),
                              });
                            }}
                          />
                          <span className="text-sm">{t.label}</span>
                          {disabled && (
                            <span className="text-xs text-muted-foreground">（需要配置知识库）</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>MCP 服务</Label>
                  <RadioGroup
                    value={mcpMode}
                    onValueChange={(v) => {
                      updateConfig({ mcp_selection_mode: v as 'all' | 'selected' | 'none' });
                      if (v === 'none') updateConfig({ mcp_services: [] });
                      if (v === 'all') updateConfig({ mcp_services: [] });
                    }}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="mcpa" />
                      <Label htmlFor="mcpa" className="font-normal cursor-pointer">全部</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="mcps" />
                      <Label htmlFor="mcps" className="font-normal cursor-pointer">指定</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="mcpn" />
                      <Label htmlFor="mcpn" className="font-normal cursor-pointer">禁用</Label>
                    </div>
                  </RadioGroup>
                </div>
                {mcpMode === 'selected' && mcpOptions.length > 0 && (
                  <div>
                    <Label>选择 MCP 服务</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {mcpOptions.map((m) => {
                        const selected = (config.mcp_services ?? []).includes(m.value);
                        return (
                          <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={(c) => {
                                const list = config.mcp_services ?? [];
                                updateConfig({
                                  mcp_services: c
                                    ? [...list, m.value]
                                    : list.filter((id) => id !== m.value),
                                });
                              }}
                            />
                            <span className="text-sm">{m.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 检索策略 */}
            {section === 'retrieval' && hasKB && (
              <div className="space-y-6 max-w-2xl">
                {!isAgentMode && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>查询扩展</Label>
                      <p className="text-xs text-muted-foreground">自动扩展查询词提高召回</p>
                    </div>
                    <Switch
                      checked={config.enable_query_expansion ?? true}
                      onCheckedChange={(v) => updateConfig({ enable_query_expansion: v })}
                    />
                  </div>
                )}
                <div>
                  <Label>向量召回数量</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={config.embedding_top_k ?? 10}
                    onChange={(e) =>
                      updateConfig({ embedding_top_k: parseInt(e.target.value, 10) || 10 })
                    }
                    className="mt-1 w-32"
                  />
                </div>
                <div>
                  <Label>关键词阈值: {(config.keyword_threshold ?? 0.3).toFixed(2)}</Label>
                  <Slider
                    value={[config.keyword_threshold ?? 0.3]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => updateConfig({ keyword_threshold: v })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>向量阈值: {(config.vector_threshold ?? 0.5).toFixed(2)}</Label>
                  <Slider
                    value={[config.vector_threshold ?? 0.5]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => updateConfig({ vector_threshold: v })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>重排数量</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={config.rerank_top_k ?? 5}
                    onChange={(e) =>
                      updateConfig({ rerank_top_k: parseInt(e.target.value, 10) || 5 })
                    }
                    className="mt-1 w-32"
                  />
                </div>
                <div>
                  <Label>重排阈值: {(config.rerank_threshold ?? 0.5).toFixed(2)}</Label>
                  <Slider
                    value={[config.rerank_threshold ?? 0.5]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => updateConfig({ rerank_threshold: v })}
                    className="mt-2"
                  />
                </div>
                {!isAgentMode && (
                  <>
                    <div>
                      <Label>兜底策略</Label>
                      <RadioGroup
                        value={config.fallback_strategy ?? 'model'}
                        onValueChange={(v) =>
                          updateConfig({ fallback_strategy: v as 'fixed' | 'model' })
                        }
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="fb1" />
                          <Label htmlFor="fb1" className="font-normal cursor-pointer">固定回复</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="model" id="fb2" />
                          <Label htmlFor="fb2" className="font-normal cursor-pointer">模型生成</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {config.fallback_strategy === 'fixed' && (
                      <div>
                        <Label>固定回复内容</Label>
                        <Textarea
                          value={config.fallback_response ?? ''}
                          onChange={(e) => updateConfig({ fallback_response: e.target.value })}
                          placeholder="抱歉，我无法回答这个问题。"
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    )}
                    {config.fallback_strategy === 'model' && (
                      <div>
                        <Label>兜底提示词</Label>
                        <div className="relative mt-1">
                          <Textarea
                            value={config.fallback_prompt ?? ''}
                            onChange={(e) => updateConfig({ fallback_prompt: e.target.value })}
                            placeholder="留空使用系统默认"
                            rows={4}
                            className="font-mono text-sm pr-28"
                          />
                          <div className="absolute right-2 bottom-2">
                            <PromptTemplateSelector
                              type="fallback"
                              onSelect={(c) => updateConfig({ fallback_prompt: c })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 网络搜索 */}
            {section === 'websearch' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>网络搜索</Label>
                    <p className="text-xs text-muted-foreground">启用后智能体可搜索互联网</p>
                  </div>
                  <Switch
                    checked={config.web_search_enabled ?? false}
                    onCheckedChange={(v) => updateConfig({ web_search_enabled: v })}
                  />
                </div>
                {config.web_search_enabled && (
                  <div>
                    <Label>最大结果数: {config.web_search_max_results ?? 5}</Label>
                    <Slider
                      value={[config.web_search_max_results ?? 5]}
                      min={1}
                      max={10}
                      onValueChange={([v]) => updateConfig({ web_search_max_results: v })}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 多轮对话（仅普通模式） */}
            {section === 'conversation' && !isAgentMode && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>多轮对话</Label>
                    <p className="text-xs text-muted-foreground">保留历史对话上下文</p>
                  </div>
                  <Switch
                    checked={config.multi_turn_enabled ?? false}
                    onCheckedChange={(v) => updateConfig({ multi_turn_enabled: v })}
                  />
                </div>
                {config.multi_turn_enabled && (
                  <>
                    <div>
                      <Label>保留轮数</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={config.history_turns ?? 5}
                        onChange={(e) =>
                          updateConfig({ history_turns: parseInt(e.target.value, 10) || 5 })
                        }
                        className="mt-1 w-32"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>问题改写</Label>
                        <p className="text-xs text-muted-foreground">多轮时自动改写用户问题</p>
                      </div>
                      <Switch
                        checked={config.enable_rewrite ?? true}
                        onCheckedChange={(v) => updateConfig({ enable_rewrite: v })}
                      />
                    </div>
                    {config.enable_rewrite && (
                      <>
                        <div>
                          <Label>改写系统提示词</Label>
                          <div className="relative mt-1">
                            <Textarea
                              value={config.rewrite_prompt_system ?? ''}
                              onChange={(e) =>
                                updateConfig({ rewrite_prompt_system: e.target.value })
                              }
                              placeholder="留空使用默认"
                              rows={3}
                              className="font-mono text-sm pr-28"
                            />
                            <div className="absolute right-2 bottom-2">
                              <PromptTemplateSelector
                                type="rewriteSystem"
                                onSelect={(c) => updateConfig({ rewrite_prompt_system: c })}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>改写用户提示词</Label>
                          <div className="relative mt-1">
                            <Textarea
                              value={config.rewrite_prompt_user ?? ''}
                              onChange={(e) =>
                                updateConfig({ rewrite_prompt_user: e.target.value })
                              }
                              placeholder="需包含 {{query}} {{conversation}}"
                              rows={3}
                              className="font-mono text-sm pr-28"
                            />
                            <div className="absolute right-2 bottom-2">
                              <PromptTemplateSelector
                                type="rewriteUser"
                                onSelect={(c) => updateConfig({ rewrite_prompt_user: c })}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>

        {/* 底部操作 */}
        <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
