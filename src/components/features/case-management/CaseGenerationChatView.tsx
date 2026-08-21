/**
 * 用例生成 - 对话视图（有 chatId）
 * 参考 aegis-rag-frontend chat/index.vue
 * 支持历史加载、首条消息自动发送、@ 提及
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2, AtSign, Paperclip, Folder, FileText, X, Bot, Globe, User, Brain, ChevronDown, Square, LayoutPanelLeft, Plus, Copy, Check, FileCode, Code, Sparkles } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from './components/MarkdownContent';
import { ReferencesDisplay } from './components/ReferencesDisplay';
import { DeepThinkDisplay } from './components/DeepThinkDisplay';
import { AgentStreamDisplay, type AgentStreamEvent } from './components/AgentStreamDisplay';
import { CasePreviewAndSavePanel, type ParsedCaseItem } from './components/CasePreviewAndSavePanel';
import { extractTestCasesJson, parseJsonCasesToParsedItems } from './utils/case-extractor';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { loadMessages, streamKnowledgeChat, stopSession, uploadSessionFile, normalizeStreamNetworkError, type MentionedItem } from '@/services/rag-chat';
import { modelService, type ModelConfig } from '@/services/knowledge-base';
import { CaseGenerationMentionSelector, type MentionItem } from './components/CaseGenerationMentionSelector';
import { CaseGenerationAgentSelector } from './components/CaseGenerationAgentSelector';
import { CaseGenerationModelSelector } from './components/CaseGenerationModelSelector';
import type { CustomAgent } from '@/types/agent';
import { BUILTIN_QUICK_ANSWER_ID, BUILTIN_SMART_REASONING_ID } from '@/types/agent';
import { toast } from 'sonner';

interface Props {
  projectId?: string;
  spaceId?: string;
  chatId: string;
  firstQuery?: string;
  firstMentionedItems?: Array<{ id: string; name: string; type: string; kb_type?: string }>;
  firstModelId?: string;
  onSessionCreated?: (id: string) => void;
  /** 收到 session_title 事件时回调（用于更新侧栏标题） */
  onSessionTitle?: (sessionId: string, title: string) => void;
}

/** 参考资料项（与 aegis-rag-frontend 一致） */
interface KnowledgeRef {
  id?: string;
  knowledge_title?: string;
  chunk_type?: string;
  content?: string;
  metadata?: { url?: string; title?: string };
}



interface AttachedFile {
  id: string; // knowledge_id
  name: string;
  type: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  mentioned_items?: Array<{ id: string; name: string; type: string; kb_type?: string }>;
  /** 参考资料（参考了N个相关内容） */
  knowledge_references?: KnowledgeRef[];
  /** 是否展示思考过程 */
  showThink?: boolean;
  /** 思考过程内容 */
  thinkContent?: string;
  /** 思考是否进行中 */
  thinking?: boolean;
  /** Agent 模式：思维与工具调用事件流（与 aegis-rag-frontend 一致） */
  isAgentMode?: boolean;
  agentEventStream?: AgentStreamEvent[];
}

/** 从 agent_steps 重建 agentEventStream（与 aegis-rag-frontend 一致） */
function reconstructEventStreamFromSteps(
  agentSteps: Array<{ thought?: string; tool_calls?: Array<{ id: string; name: string; args?: unknown; result?: { success?: boolean; output?: string; data?: Record<string, unknown> }; duration?: number }> }>,
  messageContent: string,
  isCompleted = false
): AgentStreamEvent[] {
  const events: AgentStreamEvent[] = [];
  if (agentSteps && Array.isArray(agentSteps)) {
    for (let i = 0; i < agentSteps.length; i++) {
      const step = agentSteps[i];
      if (step.thought?.trim()) {
        events.push({
          type: 'thinking',
          event_id: `step-${i}-thought`,
          content: step.thought,
          done: true,
          thinking: false,
        });
      }
      if (step.tool_calls && Array.isArray(step.tool_calls)) {
        for (const tc of step.tool_calls) {
          events.push({
            type: 'tool_call',
            tool_call_id: tc.id,
            tool_name: tc.name,
            arguments: tc.args,
            pending: false,
            success: tc.result?.success !== false,
            output: tc.result?.output ?? '',
            display_type: tc.result?.data?.display_type as string | undefined,
            tool_data: tc.result?.data,
          });
        }
      }
    }
  }
  if (messageContent?.trim()) {
    events.push({ type: 'answer', content: messageContent, done: true });
  } else if (isCompleted) {
    events.push({ type: 'answer', content: '', done: true });
  }
  return events;
}

function stripThinkTags(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/i, '')
    .trim();
}

/** 从完整内容解析 think 标签，返回 { thinkContent, displayContent, showThink, thinking } */
function parseThinkFromContent(full: string): {
  thinkContent: string;
  displayContent: string;
  showThink: boolean;
  thinking: boolean;
} {
  if (!full?.trim()) {
    return { thinkContent: '', displayContent: '', showThink: false, thinking: false };
  }
  if (full.includes('<think>') && !full.includes('</think>')) {
    const thinkContent = full.replace(/<think>/i, '').trim();
    return { thinkContent, displayContent: '', showThink: true, thinking: true };
  }
  if (full.includes('<think>') && full.includes('</think>')) {
    const idx = full.indexOf('</think>');
    const thinkContent = full.substring(0, idx).replace(/<think>/i, '').trim();
    const displayContent = full.substring(idx + 8).trim();
    return { thinkContent, displayContent, showThink: true, thinking: false };
  }
  return { thinkContent: '', displayContent: full, showThink: false, thinking: false };
}

export function CaseGenerationChatView({
  projectId = localStorage.getItem('currentProjectId') || 'default-project',
  spaceId,
  chatId,
  firstQuery,
  firstMentionedItems,
  firstModelId,
  onSessionTitle,
}: Props) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<MentionedItem[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentButtonRef = useRef<HTMLButtonElement>(null);

  const agentEnabled = selectedAgentId === BUILTIN_SMART_REASONING_ID || agents.some((a) => a.id === selectedAgentId && a.config?.agent_mode === 'smart-reasoning');
  const selectedAgentName = agents.find((a) => a.id === selectedAgentId)?.name ?? (selectedAgentId === BUILTIN_QUICK_ANSWER_ID ? '快速问答' : selectedAgentId === BUILTIN_SMART_REASONING_ID ? '智能推理' : '智能体');
  const [modelId, setModelId] = useState<string>('');
  const [chatModels, setChatModels] = useState<ModelConfig[]>([]);
  const [previewAction, setPreviewAction] = useState<{ type: 'overwrite' | 'append'; content: string; timestamp: number; mode?: 'case' | 'code' | 'html'; language?: string; parsedCases?: ParsedCaseItem[] } | undefined>(undefined);
  /** 右侧预览面板是否展示：默认收起，仅在有预览内容或用户手动打开时展示 */
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const previewShownForRef = useRef<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const currentAssistantMessageIdRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const atButtonRef = useRef<HTMLDivElement>(null);
  const firstQuerySentRef = useRef(false);
  const firstMessageInSessionRef = useRef(false);
  const modelInitializedRef = useRef(false);
  const [isSendingFirst, setIsSendingFirst] = useState(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  const sendMessage = useCallback(
    async (
      query: string,
      mentionedItems: MentionedItem[],
      overrides?: { agentEnabled?: boolean; agentId?: string; webSearchEnabled?: boolean; summaryModelId?: string }
    ) => {
      // 首条消息时用首句作为临时标题，后端 session_title 到达后会覆盖
      if (!firstMessageInSessionRef.current && onSessionTitle) {
        firstMessageInSessionRef.current = true;
        const fallbackTitle = query.trim().length > 20 ? query.trim().slice(0, 20) + '...' : query.trim() || '新对话';
        onSessionTitle(chatId, fallbackTitle);
      }
      const attachedItems = attachedFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: 'file',
      }));
      const allMentionedItems = [...mentionedItems, ...attachedItems];

      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: query, mentioned_items: allMentionedItems },
      ]);
      setLoading(true);
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);
      scrollToBottom();
      currentAssistantMessageIdRef.current = assistantId;

      const kbIds = mentionedItems.filter((m) => m.type === 'kb').map((m) => m.id);

      // 合并 @提及的文件 和 上传的文件
      const mentionedFileIds = mentionedItems.filter((m) => m.type === 'file').map((m) => m.id);
      const uploadedFileIds = attachedFiles.map((f) => f.id);
      const knowledgeIds = [...new Set([...mentionedFileIds, ...uploadedFileIds])];

      // 清空输入框和临时状态
      setAttachedFiles([]);
      setInput('');


      abortRef.current = new AbortController();
      let fullContent = '';
      let fullThink = '';
      let lastAnswerChunk = ''; // 用于检测后端是增量还是全量

      try {
        await streamKnowledgeChat(
          chatId,
          query,
          (chunk) => {
            // 会话标题更新（与 aegis-rag-frontend 一致，后端 GenerateTitleAsync 异步生成后通过 SSE 推送）
            if (chunk.response_type === 'session_title') {
              const title = chunk.content || (chunk.data as any)?.title;
              const sid = (chunk.data as any)?.session_id || chatId;
              if (title && sid) onSessionTitle?.(sid, title);
              return;
            }

            const refs = chunk.knowledge_references || (chunk.data as any)?.references || (chunk.data as any)?.data?.references;

            // agent_query：保存 assistant_message_id 供停止 API 使用（与 aegis-rag-frontend 一致）
            if (chunk.response_type === 'agent_query') {
              const amid = (chunk as any).assistant_message_id || (chunk.data as any)?.assistant_message_id;
              if (amid) currentAssistantMessageIdRef.current = String(amid);
              return;
            }

            // 其他 chunk 若有 id/assistant_message_id 则更新，供 stop API 使用
            const msgId = (chunk as any).assistant_message_id || (chunk.data as any)?.assistant_message_id || chunk.id;
            if (msgId) currentAssistantMessageIdRef.current = String(msgId);

            // 参考资料事件（与 aegis-rag-frontend 一致）
            if (chunk.response_type === 'references' && refs?.length) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, knowledge_references: refs } : m
                )
              );
              scrollToBottom();
              return;
            }

            const streamAgentEnabled = overrides?.agentEnabled ?? agentEnabled;
            const isAnswer = chunk.response_type === 'answer' || chunk.response_type === 'final_answer';

            // Agent 模式：构建 agentEventStream，展示思维与工具调用
            if (streamAgentEnabled) {
              setMessages((prev) => {
                const update = (m: ChatMessage): ChatMessage => {
                  if (m.id !== assistantId) return m;
                  let stream = [...(m.agentEventStream || [])];
                  const ensureAgentMode = { ...m, isAgentMode: true };

                  if (chunk.response_type === 'thinking') {
                    const eventId = (chunk.data as any)?.event_id;
                    if (!eventId) return { ...ensureAgentMode, agentEventStream: stream };
                    let ev = stream.find((e) => e.type === 'thinking' && e.event_id === eventId) as AgentStreamEvent | undefined;
                    if (!ev) {
                      ev = { type: 'thinking', event_id: eventId, content: '', done: false, thinking: true };
                      stream = [...stream, ev];
                    }
                    if (chunk.content) ev.content = (ev.content || '') + chunk.content;
                    if (chunk.done) {
                      ev.done = true;
                      ev.thinking = false;
                    }
                    return { ...ensureAgentMode, agentEventStream: [...stream], isStreaming: !chunk.done };
                  }

                  if (chunk.response_type === 'tool_call' && (chunk.data as any)?.tool_name != null) {
                    const data = chunk.data as any;
                    const toolCallId = data.tool_call_id || data.tool_name + '_' + Date.now();
                    let ev = stream.find((e) => e.type === 'tool_call' && e.tool_call_id === toolCallId) as AgentStreamEvent | undefined;
                    if (!ev) {
                      ev = {
                        type: 'tool_call',
                        tool_call_id: toolCallId,
                        tool_name: data.tool_name,
                        arguments: data.arguments,
                        pending: true,
                      };
                      stream = [...stream, ev];
                    } else {
                      ev = { ...ev, tool_name: data.tool_name ?? ev.tool_name, arguments: data.arguments ?? ev.arguments, pending: true };
                      stream = stream.map((e) => (e.type === 'tool_call' && e.tool_call_id === toolCallId ? ev! : e));
                    }
                    return { ...ensureAgentMode, agentEventStream: stream };
                  }

                  if (chunk.response_type === 'tool_result' || chunk.response_type === 'error') {
                    const data = (chunk.data || {}) as any;
                    const toolCallId = data.tool_call_id;
                    const toolName = data.tool_name;
                    const success = chunk.response_type !== 'error' && data.success !== false;
                    const ev = stream.find(
                      (e) => e.type === 'tool_call' && (e.tool_call_id === toolCallId || e.tool_name === toolName)
                    ) as AgentStreamEvent | undefined;
                    if (ev) {
                      const updated = {
                        ...ev,
                        pending: false,
                        success,
                        output: success ? (data.output ?? chunk.content) : (data.error ?? chunk.content),
                        display_type: data.display_type,
                        tool_data: data,
                      };
                      stream = stream.map((e) => (e === ev ? updated : e));
                    }
                    return { ...ensureAgentMode, agentEventStream: stream };
                  }

                  if (chunk.response_type === 'answer' || chunk.response_type === 'final_answer') {
                    // 智能检测：后端可能发送增量（delta）或全量（accumulated）内容
                    // 如果 chunk.content 以 fullContent 开头，说明是全量；否则是增量
                    if (chunk.response_type === 'answer' && chunk.content) {
                      if (fullContent && chunk.content.startsWith(fullContent)) {
                        // 全量模式：chunk.content 包含了之前所有内容
                        fullContent = chunk.content;
                      } else {
                        // 增量模式：chunk.content 只是新增部分
                        fullContent += chunk.content;
                      }
                    } else if (chunk.response_type === 'final_answer' && chunk.content) {
                      fullContent = chunk.content;
                    }

                    let answerEv = stream.find((e) => e.type === 'answer') as AgentStreamEvent | undefined;
                    if (!answerEv) {
                      answerEv = { type: 'answer', content: '', done: false };
                      stream = [...stream, answerEv];
                    }
                    answerEv = { ...answerEv, content: fullContent, done: chunk.done ? true : answerEv.done };
                    stream = stream.map((e) => (e.type === 'answer' ? answerEv! : e));
                    return {
                      ...ensureAgentMode,
                      agentEventStream: stream,
                      content: fullContent,
                      knowledge_references: refs?.length ? refs : m.knowledge_references,
                      isStreaming: !chunk.done,
                    };
                  }

                  if (chunk.response_type === 'complete') {
                    return { ...ensureAgentMode, agentEventStream: stream, isStreaming: false };
                  }

                  return m;
                };
                return prev.map(update);
              });
              scrollToBottom();
              return;
            }

            // 非 Agent 模式：原有逻辑
            const hasAgentThinking = fullThink.length > 0;
            if (chunk.response_type === 'answer' || chunk.response_type === 'final_answer') {
              // 智能检测：后端可能发送增量（delta）或全量（accumulated）内容
              // 如果 chunk.content 以 fullContent 开头，说明是全量；否则是增量
              if (chunk.response_type === 'answer' && chunk.content) {
                if (fullContent && chunk.content.startsWith(fullContent)) {
                  // 全量模式：chunk.content 包含了之前所有内容
                  fullContent = chunk.content;
                } else {
                  // 增量模式：chunk.content 只是新增部分
                  fullContent += chunk.content;
                }
              } else if (chunk.response_type === 'final_answer' && chunk.content) {
                fullContent = chunk.content;
              }

              if (refs?.length) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, knowledge_references: refs } : m
                  )
                );
              }
              const raw = fullThink + fullContent;
              const parsed = parseThinkFromContent(raw);
              const thinkContent = hasAgentThinking ? fullThink : parsed.thinkContent;
              const display = hasAgentThinking
                ? (fullContent || fullThink)
                : (parsed.displayContent || stripThinkTags(raw));
              const showThink = hasAgentThinking && fullContent.length > 0;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                      ...m,
                      content: display,
                      isStreaming: !chunk.done,
                      showThink,
                      thinkContent,
                      thinking: false,
                    }
                    : m
                )
              );
              scrollToBottom();
            } else if (chunk.response_type === 'thinking') {
              if (chunk.content) fullThink += chunk.content;
              const parsed = parseThinkFromContent(fullThink + fullContent);
              const thinkContent = fullThink || parsed.thinkContent;
              const display = fullContent || (parsed.displayContent || stripThinkTags(fullThink + fullContent));
              const showThink = hasAgentThinking && fullContent.length > 0;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                      ...m,
                      content: display,
                      isStreaming: true,
                      showThink,
                      thinkContent,
                      thinking: !chunk.done,
                    }
                    : m
                )
              );
              scrollToBottom();
            } else if (chunk.response_type === 'complete') {
              const raw = fullThink + fullContent;
              const parsed = parseThinkFromContent(raw);
              const thinkContent = hasAgentThinking ? fullThink : parsed.thinkContent;
              const display = hasAgentThinking
                ? (fullContent || fullThink)
                : (parsed.displayContent || stripThinkTags(raw) || '');
              const showThink = hasAgentThinking && fullContent.length > 0;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                      ...m,
                      content: display,
                      isStreaming: false,
                      showThink,
                      thinkContent,
                      thinking: false,
                    }
                    : m
                )
              );
            }
          },
          {
            signal: abortRef.current.signal,
            knowledge_base_ids: kbIds.length ? kbIds : undefined,
            knowledge_ids: knowledgeIds.length ? knowledgeIds : undefined,
            mentioned_items: mentionedItems.length ? mentionedItems : undefined,
            agent_enabled: overrides?.agentEnabled ?? agentEnabled,
            agent_id: overrides?.agentId ?? selectedAgentId,
            web_search_enabled: overrides?.webSearchEnabled ?? webSearchEnabled,
            summary_model_id: (overrides?.summaryModelId ?? modelId) || undefined,
          }
        );
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
          );
          return;
        }
        const displayMessage = normalizeStreamNetworkError(e);
        toast.error(displayMessage);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `发送失败: ${displayMessage}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setLoading(false);
        abortRef.current = null;
        currentAssistantMessageIdRef.current = '';
      }
    },

    [chatId, scrollToBottom, agentEnabled, selectedAgentId, webSearchEnabled, modelId, onSessionTitle, attachedFiles]
  );

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

  // 加载可选模型列表（用于模型选择，VLLM/KnowledgeQA 为对话模型）
  // 同步读取 sessionStorage：首条消息 effect 会清除它，需在异步完成前捕获
  useEffect(() => {
    const fromCreatChat = sessionStorage.getItem('case-generation-first-model');
    modelService
      .listModels()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
        const all = Array.isArray(list) ? list : [];
        const chatTypes = ['VLLM', 'KnowledgeQA'];
        const filtered = all.filter((m: ModelConfig) => chatTypes.includes(m.type ?? ''));
        setChatModels(filtered);
        if (!modelInitializedRef.current && filtered.length > 0) {
          // 优先使用从新建对话传递的模型（sessionStorage 或 firstModelId prop）
          const preferred = fromCreatChat || firstModelId;
          const existsInList = preferred && filtered.some((m) => (m.id ?? m.name) === preferred);
          if (existsInList) {
            setModelId(preferred!);
          } else {
            // 默认选择最后一个（最新添加的）模型
            const lastModel = filtered[filtered.length - 1];
            const lastModelId = lastModel.id ?? lastModel.name;
            if (lastModelId) setModelId(lastModelId);
          }
          modelInitializedRef.current = true;
        }
      })
      .catch(() => { });
  }, [firstModelId]);

  // 切换会话时重置首条消息标记与预览已展示记录
  useEffect(() => {
    firstMessageInSessionRef.current = false;
    previewShownForRef.current.clear();
    setPreviewAction(undefined);
    setShowPreviewPanel(false);
  }, [chatId]);

  // 当 AI 返回用例（assistant 消息完成且有 JSON test_cases）时，自动打开右侧预览
  useEffect(() => {
    /** 抽取用于检测/展示用例的文本：Agent 模式下若 answer 为空，拼接所有事件 content（与复制逻辑一致），否则只用 answer/last；非 Agent 用 m.content */
    const extractContent = (m: ChatMessage): string => {
      if (m.isAgentMode && m.agentEventStream?.length) {
        const ans = m.agentEventStream.find((e) => e.type === 'answer') as { content?: string } | undefined;
        let c = (ans?.content ?? m.content ?? '').trim();
        if (!c) {
          // 后端可能只存了 agent_steps，answer 为空；用例 JSON 可能在某个 thinking 的 thought 里，取“最后一段”会漏掉。改为拼接所有事件的 content，保证包含含 JSON 的 thought。
          const allContent = m.agentEventStream
            .filter((e) => (e as any).content?.trim())
            .map((e) => (e as any).content as string)
            .join('\n\n');
          c = allContent.trim();
        }
        return c;
      }
      return (m.content ?? '').trim();
    };

    const hasJsonTestCases = (text: string) => {
      const jsonCases = extractTestCasesJson(text);
      return jsonCases !== null && jsonCases.length > 0;
    };

    const assistants = messages.filter((m) => m.role === 'assistant' && !m.isStreaming);
    let target: ChatMessage | undefined;
    let isJsonMode = false;

    for (let i = assistants.length - 1; i >= 0; i--) {
      const c = extractContent(assistants[i]);
      if (c && hasJsonTestCases(c)) {
        target = assistants[i];
        isJsonMode = true;
        break;
      }
    }

    if (!target) return;
    const content = extractContent(target);
    if (!content) return;

    if (previewShownForRef.current.has(target.id)) return;

    const jsonCases = extractTestCasesJson(content);
    if (jsonCases && jsonCases.length > 0) {
      const parsedCases = parseJsonCasesToParsedItems(jsonCases);
      previewShownForRef.current.add(target.id);
      setPreviewAction({ type: 'overwrite', content, timestamp: Date.now(), parsedCases });
      setShowPreviewPanel(true);
    }
  }, [messages]);

  const handlePreview = (m: ChatMessage, type: 'overwrite' | 'append', forceMode?: 'case' | 'code' | 'html') => {
    let content = '';
    if (m.isAgentMode && m.agentEventStream?.length) {
      const ans = m.agentEventStream.find((e) => e.type === 'answer') as { content?: string } | undefined;
      content = (ans?.content ?? m.content ?? '').trim();
      if (!content) {
        content = m.agentEventStream
          .filter((e) => (e as any).content?.trim())
          .map((e) => (e as any).content as string)
          .join('\n\n')
          .trim();
      }
    } else {
      content = (m.content ?? '').trim();
    }

    if (!content) {
      toast.error('该消息暂无可用内容');
      return;
    }

    // Detect mode if not forced
    let mode: 'case' | 'code' | 'html' = 'case';
    let language = '';

    if (forceMode) {
      mode = forceMode;
    } else {
      // Auto-detect
      const htmlMatch = content.match(/```html\n([\s\S]*?)```/);
      const codeMatch = content.match(/```(\w+)\n([\s\S]*?)```/);

      if (htmlMatch) {
        mode = 'html';
        content = htmlMatch[1];
      } else if (codeMatch) {
        mode = 'code';
        language = codeMatch[1];
        content = codeMatch[2];
      }
    }

    // Clean content for code/html if needed (already detected above, but if forced we might need extraction)
    // For simplicity, if forced, we assume the user wants the raw content or we extracted it. 
    // Let's refine:

    if (forceMode === 'html') {
      const match = content.match(/```html\n([\s\S]*?)```/);
      if (match) content = match[1];
    } else if (forceMode === 'code') {
      const match = content.match(/```(\w+)\n([\s\S]*?)```/);
      if (match) {
        language = match[1];
        content = match[2];
        // 如果代码块是 JSON 且包含 test_cases，自动转为用例预览模式
        if (language === 'json') {
          const jsonCases = extractTestCasesJson(content);
          if (jsonCases && jsonCases.length > 0) {
            const parsedCases = parseJsonCasesToParsedItems(jsonCases);
            setPreviewAction({ type, content, timestamp: Date.now(), parsedCases });
            setShowPreviewPanel(true);
            return;
          }
        }
      }
    }

    setPreviewAction({ type, content, timestamp: Date.now(), mode, language });
    setShowPreviewPanel(true);
  };



  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    const uploadedFiles: AttachedFile[] = [];
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          toast.error(`文件 ${file.name} 大小不能超过 20MB`);
          continue;
        }
        try {
          console.log('[handleUploadFiles] 开始上传文件:', file.name);
          const res = await uploadSessionFile(chatId, file);
          console.log('[handleUploadFiles] 上传响应:', res);

          if (res?.knowledge_id) {
            uploadedFiles.push({
              id: res.knowledge_id,
              name: res.file_name || file.name,
              type: res.file_type || file.type || 'file',
            });
            successCount++;
            console.log('[handleUploadFiles] 文件上传成功:', {
              id: res.knowledge_id,
              name: res.file_name || file.name,
            });
          } else {
            console.error('[handleUploadFiles] 响应缺少 knowledge_id:', res);
            toast.error(`文件 ${file.name} 上传失败: 响应格式异常`);
          }
        } catch (err: any) {
          console.error('[handleUploadFiles] 文件上传失败:', err);
          toast.error(`文件 ${file.name} 上传失败: ${err.message}`);
        }
      }
      // 批量更新状态，避免多次 setState 导致的状态丢失
      if (uploadedFiles.length > 0) {
        console.log('[handleUploadFiles] 批量添加文件到状态:', uploadedFiles);
        setAttachedFiles((prev) => {
          const newFiles = [...prev, ...uploadedFiles];
          console.log('[handleUploadFiles] 更新后的 attachedFiles:', newFiles);
          return newFiles;
        });
        toast.success(`成功上传 ${successCount} 个文件`);
      }
    } catch (err: any) {
      console.error('[handleUploadFiles] 批量上传失败:', err);
      toast.error(err.message || '文件上传失败');
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 加载历史（解析 think 标签、agent_steps、knowledge_references，与 aegis-rag-frontend 一致）
  // 若存在 firstQuery（从 CreatChat 跳转的首条消息），则不加载历史，避免覆盖流式输出
  useEffect(() => {
    const hasFirstQuery = firstQuery?.trim() || sessionStorage.getItem('case-generation-first-query');
    if (hasFirstQuery) {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    loadMessages(chatId, { limit: 20 })
      .then((list) => {
        const raw = Array.isArray(list) ? list : [];
        const mapped: ChatMessage[] = raw.map((m: any) => {
          const role = m.role || 'user';
          if (role !== 'assistant') {
            return {
              id: m.id || `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              role: 'user' as const,
              content: m.content || '',
              mentioned_items: m.mentioned_items || [],
            };
          }
          // 有 agent_steps 时重建 agentEventStream（与 aegis-rag-frontend 一致）
          const steps = m.agent_steps;
          if (Array.isArray(steps) && steps.length > 0) {
            const agentEventStream = reconstructEventStreamFromSteps(steps, m.content || '', m.is_completed);
            return {
              id: m.id || `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              role: 'assistant' as const,
              content: m.content || '',
              mentioned_items: m.mentioned_items || [],
              knowledge_references: m.knowledge_references || [],
              isAgentMode: true,
              agentEventStream,
            };
          }
          // 非智能体模式
          let rawContent = m.content || '';
          const parsed = parseThinkFromContent(rawContent);
          return {
            id: m.id || `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: 'assistant' as const,
            content: parsed.displayContent || stripThinkTags(rawContent),
            mentioned_items: m.mentioned_items || [],
            knowledge_references: m.knowledge_references || [],
            showThink: parsed.showThink,
            thinkContent: parsed.thinkContent,
            thinking: false,
          };
        });
        // 去重：先对映射后的消息按 ID 去重，避免后端返回重复消息
        const uniqueMapped = Array.from(
          new Map(mapped.map((m) => [m.id, m])).values()
        );
        // 如果已有正在流式更新的消息，保留它并合并历史消息；否则完全替换
        setMessages((prev) => {
          const hasStreaming = prev.some((m) => m.isStreaming);
          if (!hasStreaming) {
            // 没有流式更新，直接替换为历史消息
            return uniqueMapped;
          }
          // 有流式更新，保留流式更新的消息，合并历史消息（按 ID 去重）
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = uniqueMapped.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMessages];
        });
        if (mapped.length > 0) firstMessageInSessionRef.current = true;
      })
      .catch(() => toast.error('加载历史失败'))
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [chatId]);

  // 当 chatId 变化时，保留已上传的文件（不清空）
  // 注意：只有在 chatId 变化时才保留，组件重新挂载时会重置
  const prevChatIdRef = useRef<string>(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      // chatId 变化时，不清空 attachedFiles，因为文件已经上传到会话中
      prevChatIdRef.current = chatId;
    }
  }, [chatId]);

  // 历史加载完成后滚动到底部，显示最新消息（延迟一帧确保 DOM 已渲染）
  useEffect(() => {
    if (!historyLoading && messages.length > 0) {
      const t = requestAnimationFrame(() => {
        scrollToBottom();
      });
      return () => cancelAnimationFrame(t);
    }
  }, [historyLoading, messages.length, scrollToBottom]);

  // 首条消息（从 creatChat 跳转时），应用 CreatChat 传来的 agent/websearch/model
  useEffect(() => {
    if (historyLoading || firstQuerySentRef.current) return;
    const q = firstQuery || sessionStorage.getItem('case-generation-first-query');
    const mentioned = firstMentionedItems || (() => {
      try {
        const s = sessionStorage.getItem('case-generation-first-mentioned');
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    })();
    const firstAgent = sessionStorage.getItem('case-generation-first-agent');
    const firstAgentId = sessionStorage.getItem('case-generation-first-agent-id');
    const firstWebsearch = sessionStorage.getItem('case-generation-first-websearch');
    const firstModel = sessionStorage.getItem('case-generation-first-model');
    if (q && q.trim()) {
      firstQuerySentRef.current = true;
      setIsSendingFirst(true);
      sessionStorage.removeItem('case-generation-first-query');
      sessionStorage.removeItem('case-generation-first-mentioned');
      sessionStorage.removeItem('case-generation-first-agent');
      sessionStorage.removeItem('case-generation-first-agent-id');
      sessionStorage.removeItem('case-generation-first-websearch');
      sessionStorage.removeItem('case-generation-first-model');
      if (firstAgentId) setSelectedAgentId(firstAgentId);
      else if (firstAgent !== null) setSelectedAgentId(firstAgent === 'true' ? BUILTIN_SMART_REASONING_ID : BUILTIN_QUICK_ANSWER_ID);
      if (firstWebsearch !== null) setWebSearchEnabled(firstWebsearch === 'true');
      if (firstModel !== null) setModelId(firstModel);
      // 首条消息需使用 CreatChat 的设置，但 sendMessage 依赖当前 state，会有一帧延迟
      // 使用 setTimeout 确保 state 更新后再发送
      const agentEnabled = Boolean(firstAgent === 'true' || (firstAgentId && firstAgentId !== BUILTIN_QUICK_ANSWER_ID));
      const agentId = firstAgentId || (firstAgent === 'true' ? BUILTIN_SMART_REASONING_ID : BUILTIN_QUICK_ANSWER_ID);
      const websearch = (firstWebsearch ?? '') === 'true';
      const model = firstModel ?? '';
      sendMessage(q.trim(), mentioned, {
        agentEnabled,
        agentId,
        webSearchEnabled: websearch,
        summaryModelId: model,
      });
    }
  }, [historyLoading, firstQuery, firstMentionedItems, firstModelId, sendMessage]);

  useEffect(() => {
    if (messages.length > 0 && isSendingFirst) setIsSendingFirst(false);
  }, [messages.length, isSendingFirst]);

  const addSelectedItem = useCallback((item: MentionItem) => {
    setSelectedItems((prev) => {
      if (prev.some((p) => p.id === item.id && p.type === item.type)) return prev;
      return [
        ...prev,
        { id: item.id, name: item.name, type: item.type, kb_type: item.kbType },
      ];
    });
  }, []);

  const removeSelectedItem = useCallback((item: MentionedItem) => {
    setSelectedItems((prev) => prev.filter((p) => !(p.id === item.id && p.type === item.type)));
  }, []);

  const handleStopGeneration = useCallback(async () => {
    const messageId = currentAssistantMessageIdRef.current || '';
    abortRef.current?.abort();
    if (messageId && chatId) {
      try {
        await stopSession(chatId, messageId);
        toast.success('已停止生成');
      } catch {
        // 本地已 abort，后端可能已收到断开，忽略 stop API 失败
      }
    }
  }, [chatId]);

  const safeCopyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // ignore and try fallback
    }
    try {
      if (typeof document === 'undefined') return false;
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }, []);

  const handleSend = useCallback(() => {
    const query = input.trim();
    if (!query || loading) return;
    const mentionedItems = selectedItems.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      kb_type: s.kb_type,
    }));
    setInput('');
    setSelectedItems([]);
    sendMessage(query, mentionedItems);
  }, [input, loading, selectedItems, sendMessage]);

  const chatContent = (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-background relative">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-10 pb-8">
          {historyLoading && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                <span className="text-sm text-muted-foreground">加载中...</span>
              </div>
            </div>
          )}
          {!historyLoading && messages.length === 0 && (
            <div className="text-center py-24 px-6">
              {isSendingFirst || (typeof window !== 'undefined' && sessionStorage.getItem('case-generation-first-query')) || loading ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-primary/60 mx-auto mb-4" />
                  <p className="text-base font-medium text-foreground">正在加载对话...</p>
                  <p className="text-sm text-muted-foreground mt-2">请稍候，您的消息即将展示</p>
                </>
              ) : (
                <>
                  <div className="text-center space-y-4 py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 dark:bg-primary/10 mb-2">
                      <Bot className="w-8 h-8 text-primary/70" />
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-xl font-semibold text-foreground tracking-tight">
                        {user?.name || user?.nickname ? `你好，${user?.name || user?.nickname}` : '你好'}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        描述你的需求或场景，AI 将帮你生成测试用例
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {!historyLoading &&
            messages.map((m) => (
              <div
                key={m.id}
                className={`group flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/90 to-indigo-600/90 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                )}
                <div
                  className={`flex flex-col gap-2 ${m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl px-4 py-3 bg-primary/5 dark:bg-primary/10 text-foreground border border-primary/10 dark:border-primary/20'
                    : 'max-w-full px-0 py-0 text-foreground'
                    }`}
                >
                  {m.role === 'user' && m.mentioned_items && m.mentioned_items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {m.mentioned_items.map((item) => (
                        <span
                          key={`${item.type}-${item.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-primary/10 text-primary"
                        >
                          {item.type === 'kb' ? (
                            <Folder className="w-3 h-3 shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{item.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-[15px] leading-[1.65]">{m.content}</p>
                  ) : m.isAgentMode && m.agentEventStream && m.agentEventStream.length > 0 ? (
                    <div className="flex flex-col gap-4 w-full min-w-0">
                      {m.knowledge_references && m.knowledge_references.length > 0 && (
                        <ReferencesDisplay references={m.knowledge_references} />
                      )}
                      <AgentStreamDisplay
                        events={m.agentEventStream}
                        isStreaming={m.isStreaming}
                        onJsonCasePreview={(parsedCases) => {
                          setPreviewAction({ type: 'overwrite', content: m.content || '', timestamp: Date.now(), parsedCases });
                          setShowPreviewPanel(true);
                        }}
                        onJsonCaseAppend={(parsedCases) => {
                          setPreviewAction({ type: 'append', content: m.content || '', timestamp: Date.now(), parsedCases });
                          setShowPreviewPanel(true);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 w-full min-w-0">
                      {m.knowledge_references && m.knowledge_references.length > 0 && (
                        <ReferencesDisplay references={m.knowledge_references} />
                      )}
                      {m.showThink && (
                        <DeepThinkDisplay
                          thinkContent={m.thinkContent ?? ''}
                          thinking={m.thinking}
                        />
                      )}
                      <div className="text-[15px] leading-[1.7] text-foreground">
                        {m.isStreaming && !m.content?.trim() ? (
                          <div className="flex items-center gap-2.5 py-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                            <span className="animate-pulse">AI 思考中...</span>
                          </div>
                        ) : (
                          <MarkdownContent
                            content={m.content || (m.isStreaming ? '' : '')}
                            isStreaming={m.isStreaming}
                            onJsonCasePreview={(parsedCases) => {
                              setPreviewAction({ type: 'overwrite', content: m.content || '', timestamp: Date.now(), parsedCases });
                              setShowPreviewPanel(true);
                            }}
                            onJsonCaseAppend={(parsedCases) => {
                              setPreviewAction({ type: 'append', content: m.content || '', timestamp: Date.now(), parsedCases });
                              setShowPreviewPanel(true);
                            }}
                          />
                        )}
                        {m.isStreaming && m.content?.trim() && (
                          <span className="inline-block w-2 h-4 ml-1.5 bg-primary animate-pulse rounded-sm align-middle" />
                        )}
                      </div>
                    </div>
                  )}
                  {/* 复制 + 预览按钮（固定显示在消息下方） */}
                  {m.role === 'assistant' && (
                    <div className="flex items-center mt-3 gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        onClick={() => {
                          let text = '';
                          if (m.agentEventStream?.length) {
                            // 收集所有事件中的文本内容（answer、thinking 等）
                            text = m.agentEventStream
                              .filter((e) => (e as any).content?.trim())
                              .map((e) => (e as any).content)
                              .join('\n\n');
                          }
                          if (!text) text = (m.content ?? '').trim();
                          if (!text) {
                            toast.error('暂无可复制内容');
                            return;
                          }
                          safeCopyToClipboard(text).then((ok) => {
                            if (ok) {
                              setCopiedId(m.id);
                              toast.success('已复制到剪贴板');
                              setTimeout(() => setCopiedId(''), 2000);
                            } else {
                              toast.error('复制失败，请手动选择文本复制');
                            }
                          });
                        }}
                        title="复制内容"
                      >
                        {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      {/* HTML 预览按钮 */}
                      {(m.content?.includes('```html') || m.agentEventStream?.some((e) => ((e as any).content || '').includes('```html'))) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 rounded-lg text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                          onClick={() => handlePreview(m, 'overwrite', 'html')}
                          title="预览 HTML"
                        >
                          <Globe className="w-4 h-4 mr-1.5" />
                          预览 HTML
                        </Button>
                      )}
                      {/* 代码预览按钮 (非 HTML 的代码块) */}
                      {['python', 'javascript', 'typescript', 'java', 'go', 'json', 'sql'].some(lang =>
                        (m.content?.includes(`\`\`\`${lang}`) || m.agentEventStream?.some((e) => ((e as any).content || '').includes(`\`\`\`${lang}`)))
                      ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 rounded-lg text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
                            onClick={() => handlePreview(m, 'overwrite', 'code')}
                            title="预览代码"
                          >
                            <Code className="w-4 h-4 mr-1.5" />
                            预览代码
                          </Button>
                        )}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/90 to-teal-600/90 text-white shadow-sm">
                    {user?.name || user?.nickname ? (
                      <span className="text-sm font-semibold">
                        {(user.name || user.nickname || '').charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </div>
                )}
              </div>
            ))}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="shrink-0 pt-4 pb-6 px-4 md:px-6 max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-3">
          <div
            ref={atButtonRef}
            onPaste={handlePaste}
            className="group flex flex-col rounded-2xl bg-muted/30 dark:bg-muted/20 border border-border/50 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 overflow-hidden relative"
          >
            {/* Input Area */}
            <div className="pt-3 pb-2 px-4">
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
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 dark:bg-muted/40 rounded-lg text-xs text-muted-foreground"
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
                className="w-full min-h-[44px] max-h-40 py-1 px-0 text-[15px] leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/60 bg-transparent"
                placeholder="描述需求或场景，按 Ctrl+Enter 发送..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-xl transition-all ${showPreviewPanel
                    ? 'text-primary bg-primary/10 hover:bg-primary/15'
                    : 'text-muted-foreground/70 hover:text-foreground hover:bg-background/80'
                    }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPreviewPanel((v) => !v);
                  }}
                  title={showPreviewPanel ? '收起用例预览' : '打开用例预览'}
                  type="button"
                >
                  <LayoutPanelLeft className="w-4 h-4" />
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
                    <Globe className="w-3.5 h-3.5" />
                    联网
                  </button>
                  <CaseGenerationModelSelector
                    models={chatModels}
                    currentModelId={modelId}
                    onSelect={setModelId}
                  />
                </div>
              </div>

              {loading ? (
                <Button
                  onClick={handleStopGeneration}
                  className="shrink-0 h-9 w-9 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                  size="icon"
                  title="停止生成"
                >
                  <Square className="w-4 h-4 fill-current" />
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
            <div className="flex flex-wrap gap-2 px-1">
              {selectedItems.map((item) => (
                <span
                  key={`${item.type}-${item.id}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${item.type === 'kb'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
                    }`}
                >
                  {item.type === 'kb' ? (
                    <Folder className="w-3 h-3 shrink-0" />
                  ) : (
                    <FileText className="w-3 h-3 shrink-0" />
                  )}
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
        </div>
        {showMention && (
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
        )}
        {showAgentSelector && (
          <CaseGenerationAgentSelector
            visible={showAgentSelector}
            anchorRef={agentButtonRef}
            currentAgentId={selectedAgentId}
            onClose={() => setShowAgentSelector(false)}
            onSelect={(agent) => setSelectedAgentId(agent.id)}
          />
        )}
      </div>
    </div>
  );

  if (!showPreviewPanel) {
    return <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{chatContent}</div>;
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
      <ResizablePanel defaultSize={60} minSize={40} maxSize={80} className="min-w-0">
        {chatContent}
      </ResizablePanel>
      <ResizableHandle className="bg-border/50 hover:bg-border transition-colors w-[1px]" />
      <ResizablePanel defaultSize={40} minSize={25} maxSize={60} className="min-w-0">
        <CasePreviewAndSavePanel
          projectId={projectId}
          spaceId={spaceId}
          previewAction={previewAction}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
