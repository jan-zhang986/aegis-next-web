/**
 * 新建对话 - 参考 Google Gemini 风格
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2, Paperclip, AtSign, Folder, FileText, X, Brain, Globe, Lightbulb, Sparkles, BookOpen, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { modelService, type ModelConfig } from '@/services/knowledge-base';
import { createSession, uploadSessionFile } from '@/services/rag-chat';
import { CaseGenerationMentionSelector, type MentionItem } from './components/CaseGenerationMentionSelector';
import { CaseGenerationAgentSelector } from './components/CaseGenerationAgentSelector';
import { CaseGenerationModelSelector } from './components/CaseGenerationModelSelector';
import type { CustomAgent } from '@/types/agent';
import { BUILTIN_QUICK_ANSWER_ID, BUILTIN_SMART_REASONING_ID } from '@/types/agent';
import { toast } from 'sonner';

interface Props {
  onSessionCreated: (id: string) => void;
}

const SUGGESTED_PROMPTS = [
  { icon: Sparkles, text: '为登录功能生成 10 条功能用例' },
  { icon: Lightbulb, text: '基于用户注册流程编写测试场景' },
  { icon: BookOpen, text: '为 API 接口设计边界值测试用例' },
  { icon: Zap, text: '帮我设计一个电商下单的完整测试用例集' },
];

export function CaseGenerationCreatChat({ onSessionCreated }: Props) {
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; name: string; type: string; kb_type?: string }>>([]);
  const [showMention, setShowMention] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [preCreatedSessionId, setPreCreatedSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentButtonRef = useRef<HTMLButtonElement>(null);

  const agentEnabled = selectedAgentId === BUILTIN_SMART_REASONING_ID || agents.some((a) => a.id === selectedAgentId && a.config?.agent_mode === 'smart-reasoning');
  const selectedAgentName = agents.find((a) => a.id === selectedAgentId)?.name ?? (selectedAgentId === BUILTIN_QUICK_ANSWER_ID ? '快速问答' : selectedAgentId === BUILTIN_SMART_REASONING_ID ? '智能推理' : '智能体');
  const [modelId, setModelId] = useState<string>('');
  const [chatModels, setChatModels] = useState<ModelConfig[]>([]);
  const atButtonRef = useRef<HTMLDivElement>(null);
  const modelInitializedRef = useRef(false);

  const userName = user?.name || user?.nickname || user?.email?.split('@')[0] || '';

  useEffect(() => {
    import('@/services/agent').then(({ agentService }) => {
      agentService.list().then((res: any) => {
        const data = res?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setAgents(list);
        // 默认选第一个用户自定义智能体（非内置），如果没有则回退内置智能推理
        if (!selectedAgentId) {
          const firstCustom = list.find((a: CustomAgent) => a.is_builtin === false);
          setSelectedAgentId(firstCustom ? firstCustom.id : BUILTIN_SMART_REASONING_ID);
        }
      }).catch(() => { });
    });
  }, []);

  useEffect(() => {
    modelService
      .listModels()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
        const all = Array.isArray(list) ? list : [];
        const chatTypes = ['VLLM', 'KnowledgeQA'];
        const filtered = all.filter((m: ModelConfig) => chatTypes.includes(m.type ?? ''));
        setChatModels(filtered);
        // 如果当前没有选择模型且列表有模型，默认选择最后一个（最新添加的）
        if (!modelInitializedRef.current && filtered.length > 0) {
          const lastModel = filtered[filtered.length - 1];
          const lastModelId = lastModel.id ?? lastModel.name;
          if (lastModelId) {
            setModelId(lastModelId);
            modelInitializedRef.current = true;
          }
        }
      })
      .catch(() => { });
  }, []);

  const addSelectedItem = useCallback((item: MentionItem) => {
    setSelectedItems((prev) => {
      if (prev.some((p) => p.id === item.id && p.type === item.type)) return prev;
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          type: item.type,
          kb_type: item.kbType,
        },
      ];
    });
  }, []);

  const removeSelectedItem = useCallback((item: { id: string; type: string }) => {
    setSelectedItems((prev) => prev.filter((p) => !(p.id === item.id && p.type === item.type)));
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    await handleUploadFiles(files);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await handleUploadFiles(files);
    }
  };

  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    try {
      // 如果还没有创建会话，先创建会话
      let sessionId = preCreatedSessionId;
      if (!sessionId) {
        const { id } = await createSession();
        sessionId = id;
        setPreCreatedSessionId(id);
      }

      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          toast.error(`文件 ${file.name} 大小不能超过 20MB`);
          continue;
        }
        try {
          const res = await uploadSessionFile(sessionId!, file);
          if (res?.knowledge_id) {
            setAttachedFiles((prev) => [
              ...prev,
              {
                id: res.knowledge_id,
                name: res.file_name,
                type: res.file_type,
              },
            ]);
            // 同时添加到 selectedItems 中，以便在发送消息时一起传递
            addSelectedItem({
              id: res.knowledge_id,
              name: res.file_name,
              type: 'file',
            });
            successCount++;
          }
        } catch (err: any) {
          toast.error(`文件 ${file.name} 上传失败: ${err.message}`);
        }
      }
      if (successCount > 0) {
        toast.success(`成功上传 ${successCount} 个文件`);
      }
    } catch (err: any) {
      toast.error(err.message || '文件上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedItems((prev) => prev.filter((p) => !(p.id === id && p.type === 'file')));
  };

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || loading) return;

    const kbIds = selectedItems.filter((s) => s.type === 'kb').map((s) => s.id);
    const knowledgeIds = selectedItems.filter((s) => s.type === 'file').map((s) => s.id);

    setLoading(true);
    try {
      const agentConfig = {
        agent_config: {
          enabled: true,
          max_iterations: 5,
          temperature: 0.7,
          knowledge_bases: kbIds,
          knowledge_ids: knowledgeIds,
          allowed_tools: [],
        },
      };

      // 如果已经有预创建的会话（因为上传了文件），使用它；否则创建新会话
      let sessionId: string;
      if (preCreatedSessionId) {
        sessionId = preCreatedSessionId;
      } else {
        const { id } = await createSession(agentConfig);
        sessionId = id;
      }

      onSessionCreated(sessionId);
      // 父组件会切换到 ChatView，并传入 firstQuery 触发首条消息发送
      // 通过 sessionStorage 传递首条消息参数
      sessionStorage.setItem('case-generation-first-query', query);
      sessionStorage.setItem(
        'case-generation-first-mentioned',
        JSON.stringify(selectedItems.map((s) => ({ id: s.id, name: s.name, type: s.type, kb_type: s.kb_type })))
      );
      sessionStorage.setItem('case-generation-first-agent', String(agentEnabled));
      sessionStorage.setItem('case-generation-first-agent-id', selectedAgentId);
      sessionStorage.setItem('case-generation-first-websearch', String(webSearchEnabled));
      sessionStorage.setItem('case-generation-first-model', modelId);
    } catch (e: any) {
      toast.error(e?.message || '创建会话失败');
    } finally {
      setLoading(false);
    }
  }, [input, loading, selectedItems, agentEnabled, selectedAgentId, webSearchEnabled, modelId, preCreatedSessionId, onSessionCreated]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-0 relative">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        {/* 欢迎语 - Gemini 风格 */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {userName ? `${userName}，你好` : '你好'}
          </h1>
          <p className="text-base text-muted-foreground">需要我为你做些什么？</p>
        </div>

        {/* 主输入框 - 与对话页一致 */}
        <div className="w-full space-y-5">
          <div className="flex justify-end mb-[-12px] relative z-20 pr-2">
            <CaseGenerationModelSelector
              models={chatModels}
              currentModelId={modelId}
              onSelect={setModelId}
              showPrefix={true}
            />
          </div>
          <div
            ref={atButtonRef}
            className="group flex flex-col rounded-[24px] bg-muted/40 dark:bg-muted/20 border border-border/40 shadow-sm focus-within:bg-muted/50 focus-within:border-primary/20 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden relative"
          >
            {/* Input Area */}
            <div className="pt-4 pb-2 px-5">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md text-xs text-muted-foreground border border-border/50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                className="w-full min-h-[44px] max-h-40 py-1 px-0 text-[15px] leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50 bg-transparent"
                placeholder="描述需求或场景，按 Ctrl+Enter 发送...（支持粘贴截图）"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onPaste={handlePaste}
                disabled={loading}
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                }}
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-0">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground/70 hover:text-foreground hover:bg-background/80 rounded-xl transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  title="添加附件"
                  type="button"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>
                <div className="h-4 w-[1px] bg-border/40 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground/70 hover:text-foreground hover:bg-background/80 rounded-xl transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMention((v) => !v);
                  }}
                  title="关联知识库 / @ 提及"
                  type="button"
                >
                  <AtSign className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    ref={agentButtonRef}
                    type="button"
                    onClick={() => setShowAgentSelector((v) => !v)}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-background/40 hover:bg-background/80 border border-transparent hover:border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Brain className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                    <span className="truncate max-w-[80px]">{selectedAgentName}</span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled((v) => !v)}
                    className={`flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${webSearchEnabled
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-background/40 hover:bg-background/80 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/40'
                      }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    联网
                  </button>
                </div>
              </div>

              {loading ? (
                <Button
                  onClick={() => setLoading(false)}
                  variant="outline"
                  className="shrink-0 h-9 w-9 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  size="icon"
                  title="停止生成"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="shrink-0 h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedItems.map((item) => (
                <span
                  key={`${item.type}-${item.id}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${item.type === 'kb'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
                    }`}
                >
                  {item.type === 'kb' ? <Folder className="w-3 h-3 shrink-0" /> : <FileText className="w-3 h-3 shrink-0" />}
                  <span className="truncate max-w-[100px]">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedItem(item)}
                    className="ml-0.5 hover:opacity-70 rounded p-0.5 transition-opacity"
                    aria-label="移除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 示例提示 - 卡片风格 */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {SUGGESTED_PROMPTS.map(({ icon: Icon, text }) => (
              <button
                key={text}
                type="button"
                onClick={() => setInput(text)}
                className="flex items-start gap-3 p-4 rounded-xl text-left text-sm bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border/50 hover:shadow-sm transition-all group"
              >
                <div className="p-2 rounded-lg bg-background shadow-xs group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4 text-primary/80" />
                </div>
                <span className="flex-1 pt-1 text-foreground/80 group-hover:text-foreground line-clamp-2 leading-relaxed">
                  {text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {
        showMention && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowMention(false)}
              aria-hidden
            />
            <CaseGenerationMentionSelector
              visible={showMention}
              onSelect={(item) => {
                addSelectedItem(item);
                setShowMention(false);
              }}
              onClose={() => setShowMention(false)}
              anchorRef={atButtonRef}
            />
          </>
        )
      }
      {
        showAgentSelector && (
          <CaseGenerationAgentSelector
            visible={showAgentSelector}
            anchorRef={agentButtonRef}
            currentAgentId={selectedAgentId}
            onClose={() => setShowAgentSelector(false)}
            onSelect={(agent) => setSelectedAgentId(agent.id)}
          />
        )
      }
    </div >
  );
}
