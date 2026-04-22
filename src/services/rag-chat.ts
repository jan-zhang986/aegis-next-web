/**
 * RAG Chat 服务
 * 从 aegis-rag-backend / aegis-rag-frontend chat API 迁移
 * 用于用例生成页面的对话能力
 * 流式请求使用 @microsoft/fetch-event-source 与 aegis-rag-frontend 一致
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getRagApiKey, getCurrentUserId } from '@/services/rag-auth';
import { http } from '@/utils/request';

/** 会话/聊天/消息使用 /api/v1，与 aegis-rag-frontend 及正常请求一致 */
const SESSION_API_BASE = '/api/v1';

/** 将浏览器/SSE 的通用网络错误转为用户可读说明（连接中断、超时、后端不可用等） */
export function normalizeStreamNetworkError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (!msg || typeof msg !== 'string') return '连接异常，请稍后重试';
  const lower = msg.toLowerCase();
  if (lower.includes('network error') || lower.includes('failed to fetch') || lower.includes('load failed')) {
    return '网络连接异常，请检查网络或 RAG 服务是否可用后重试';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return '请求超时，请稍后重试';
  }
  if (lower.includes('aborted') || lower.includes('abort')) {
    return '请求已取消';
  }
  return msg;
}

/** 会话列表项 */
export interface SessionItem {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

/** 获取会话列表（分页，走 axios 拦截器自动加认证） */
export async function getSessionsList(page = 1, pageSize = 30): Promise<{
  data: SessionItem[];
  total?: number;
}> {
  const url = `${SESSION_API_BASE}/sessions?page=${page}&page_size=${pageSize}`;
  const json = await http.get<any>(url);
  const data = (json as any)?.data ?? (json as any)?.list ?? [];
  const total = (json as any)?.total ?? data?.length;
  return { data: Array.isArray(data) ? data : [], total };
}

/** 删除会话 */
export async function deleteSession(sessionId: string): Promise<void> {
  await http.delete(`${SESSION_API_BASE}/sessions/${sessionId}`);
}

/** 停止生成 */
export async function stopSession(sessionId: string, messageId: string): Promise<void> {
  await http.post(`${SESSION_API_BASE}/sessions/${sessionId}/stop`, { message_id: messageId });
}

/** 创建会话（走 http，与同文件其它 /api/v1 请求一致，经 RAG 拦截器） */
export async function createSession(agentConfig?: Record<string, unknown>): Promise<{ id: string }> {
  const url = `${SESSION_API_BASE}/sessions`;
  const data = await http.post<any>(url, agentConfig ?? {});
  const id = data?.data?.id ?? data?.id;
  if (!id) throw new Error('创建会话失败：未返回 session_id');
  return { id };
}

/** 上传会话文件 */
export async function uploadSessionFile(sessionId: string, file: File): Promise<{
  knowledge_id: string;
  knowledge_base_id: string;
  file_name: string;
  file_type: string;
}> {
  const url = `${SESSION_API_BASE}/sessions/${sessionId}/files`;
  const formData = new FormData();
  formData.append('file', file);

  // axios 拦截器会自动处理认证，并删除 Content-Type 让浏览器自动设置
  const res = await http.post<any>(url, formData);
  
  // 兼容多种后端响应格式
  // 1. { data: { file_id, file_name, ... } }
  // 2. { file_id, file_name, ... }
  // 3. { data: { data: { file_id, ... } } } (嵌套)
  const data = res?.data?.data ?? res?.data ?? res;
  
  console.log('[uploadSessionFile] 后端响应:', res);
  console.log('[uploadSessionFile] 提取的数据:', data);
  
  // 后端返回的是 file_id，需要映射为 knowledge_id
  const fileId = data?.file_id || data?.knowledge_id;
  
  if (!fileId) {
    console.error('[uploadSessionFile] 响应格式异常，缺少 file_id 或 knowledge_id:', res);
    throw new Error('文件上传成功但未返回文件ID');
  }
  
  return {
    knowledge_id: fileId,  // 使用 file_id 作为 knowledge_id
    knowledge_base_id: data.knowledge_base_id || '',
    file_name: data.file_name || data.filename || file.name,
    file_type: data.file_type || data.type || file.type || 'file',
  };
}

/** 加载历史消息 */
export async function loadMessages(
  sessionId: string,
  options?: { before_time?: string; limit?: number }
): Promise<any[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.before_time) params.set('before_time', options.before_time);
  const qs = params.toString();
  const url = `${SESSION_API_BASE}/messages/${sessionId}/load${qs ? `?${qs}` : ''}`;
  const data = await http.get<any>(url);
  const list = data?.data ?? data?.list ?? data;
  return Array.isArray(list) ? list : [];
}

export interface StreamChunk {
  response_type?: string;
  id?: string;
  content?: string;
  done?: boolean;
  knowledge_references?: any[];
  data?: any;
  [key: string]: unknown;
}

export type StreamChunkHandler = (chunk: StreamChunk) => void;

/** 提及项（@ 知识库/文件），与 aegis-rag-frontend 一致 */
export interface MentionedItem {
  id: string;
  name: string;
  type: 'kb' | 'file';
  kb_type?: 'document' | 'faq';
}

export interface StreamKnowledgeChatOptions {
  signal?: AbortSignal;
  knowledge_base_ids?: string[];
  knowledge_ids?: string[];
  mentioned_items?: MentionedItem[];
  agent_enabled?: boolean;
  agent_id?: string;
  web_search_enabled?: boolean;
  summary_model_id?: string;
}

/**
 * 发起 knowledge-chat 流式请求
 * 支持 knowledge_base_ids、knowledge_ids、mentioned_items（与 aegis-rag-frontend 一致）
 */
export async function streamKnowledgeChat(
  sessionId: string,
  query: string,
  onChunk: StreamChunkHandler,
  options?: StreamKnowledgeChatOptions
): Promise<void> {
  const body: Record<string, unknown> = {
    query,
    agent_enabled: options?.agent_enabled ?? false,
  };
  if (options?.knowledge_base_ids?.length) body.knowledge_base_ids = options.knowledge_base_ids;
  if (options?.knowledge_ids?.length) body.knowledge_ids = options.knowledge_ids;
  if (options?.mentioned_items?.length) body.mentioned_items = options.mentioned_items;
  if (options?.agent_id) body.agent_id = options.agent_id;
  if (options?.web_search_enabled !== undefined) body.web_search_enabled = options.web_search_enabled;
  if (options?.summary_model_id) body.summary_model_id = options.summary_model_id;

  const endpoint = options?.agent_enabled ? 'agent-chat' : 'knowledge-chat';
  const url = `${SESSION_API_BASE}/${endpoint}/${sessionId}`;
  const controller = new AbortController();
  const signal = options?.signal ?? controller.signal;

  await fetchEventSource(url, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getRagApiKey(),
      'X-User-ID': getCurrentUserId(),
    },
    body: JSON.stringify(body),
    signal,
    openWhenHidden: true,

    onopen: async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.message || `请求失败: ${res.status}`);
      }
    },

    onmessage: (ev) => {
      const json = ev.data?.trim();
      if (!json || json === '[DONE]') return;
      try {
        const chunk = JSON.parse(json) as StreamChunk;
        onChunk(chunk);
      } catch {
        // 忽略解析错误
      }
    },

    // 流式连接中断（网络断开、代理/后端超时、服务重启等）时会触发，抛出以便上层统一捕获并提示
    onerror: (err) => {
      throw err;
    },
  });
}
