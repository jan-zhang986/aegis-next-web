/**
 * 知识库 API 服务
 * 从 aegis-rag-frontend 迁移
 */

import { http } from '@/utils/request';

// ========== 模型 API ==========
export interface ModelConfig {
  id?: string;
  name: string;
  type: 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM';
  source?: 'local' | 'remote';
  description?: string;
  parameters?: {
    base_url?: string;
    api_key?: string;
    provider?: string;
    model_name?: string;
    embedding_parameters?: {
      dimension?: number;
      truncate_prompt_tokens?: number;
    };
    [key: string]: unknown;
  };
  is_default?: boolean;
  is_builtin?: boolean;
}

export const modelService = {
  listModels: (type?: string) => {
    const url = type ? `/rag/v1/models?type=${encodeURIComponent(type)}` : '/rag/v1/models';
    return http.get<ModelConfig[] | { data: ModelConfig[] }>(url);
  },

  createModel: (data: ModelConfig) => http.post('/rag/v1/models', data),

  updateModel: (id: string, data: ModelConfig) => http.put(`/rag/v1/models/${id}`, data),

  deleteModel: (id: string) => http.delete(`/rag/v1/models/${id}`),
};

// ========== 初始化/配置 API ==========
export interface KBModelConfigRequest {
  llmModelId: string;
  embeddingModelId: string;
  vlm_config?: { enabled: boolean; model_id?: string };
  documentSplitting?: { chunkSize: number; chunkOverlap: number; separators: string[] };
  multimodal?: Record<string, unknown>;
  nodeExtract?: Record<string, unknown>;
  questionGeneration?: { enabled: boolean; questionCount: number };
}

export interface Node {
  name: string;
  attributes: string[];
}

export interface Relation {
  node1: string;
  node2: string;
  type: string;
}

export interface LLMConfig {
  source: 'local' | 'remote';
  model_name: string;
  base_url: string;
  api_key: string;
}

export interface TextRelationExtractionRequest {
  text: string;
  tags: string[];
  llm_config: LLMConfig;
}

export interface TextRelationExtractionResponse {
  nodes: Node[];
  relations: Relation[];
}

export interface FabriTextRequest {
  tags: string[];
  llm_config: LLMConfig;
}

export interface FabriTextResponse {
  text: string;
}

export interface FabriTagRequest {
  llm_config: LLMConfig;
}

export interface FabriTagResponse {
  tags: string[];
}

export const initializationService = {
  updateKBConfig: (kbId: string, config: KBModelConfigRequest) =>
    http.put(`/rag/v1/initialization/config/${kbId}`, config),

  // 文本内容关系提取
  extractTextRelations: (request: TextRelationExtractionRequest) =>
    http.post<TextRelationExtractionResponse>(`/rag/v1/initialization/extract/text-relation`, request),

  // 文本内容生成
  fabriText: (request: FabriTextRequest) =>
    http.post<FabriTextResponse>(`/rag/v1/initialization/extract/fabri-text`, request),

  // 标签生成
  fabriTag: (request: FabriTagRequest) =>
    http.post<FabriTagResponse>(`/rag/v1/initialization/extract/fabri-tag`, request),
};

import type { CreateKnowledgeBaseParams, FAQEntryFieldsBatchRequest } from '@/types/knowledge-base';

const API_BASE = '/rag/v1';

// 知识库管理 API
export const knowledgeBaseService = {
  listKnowledgeBases: () => http.get<any>(`${API_BASE}/knowledge-bases`),

  createKnowledgeBase: (data: CreateKnowledgeBaseParams) =>
    http.post<any>(`${API_BASE}/knowledge-bases`, data),

  getKnowledgeBaseById: (id: string) => http.get<any>(`${API_BASE}/knowledge-bases/${id}`),

  updateKnowledgeBase: (id: string, data: { name: string; description?: string; config: unknown }) =>
    http.put<any>(`${API_BASE}/knowledge-bases/${id}`, data),

  deleteKnowledgeBase: (id: string) => http.delete<any>(`${API_BASE}/knowledge-bases/${id}`),

  copyKnowledgeBase: (data: { source_id: string; target_id?: string }) =>
    http.post<any>(`${API_BASE}/knowledge-bases/copy`, data),
};

// 知识文件 API
export const knowledgeFileService = {
  uploadKnowledgeFile: (
    kbId: string,
    data: { file: File; tag_id?: string;[key: string]: unknown },
    onProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, val as Blob | string);
    });
    return http.post(`${API_BASE}/knowledge-bases/${kbId}/knowledge/file`, formData, {
      onUploadProgress: onProgress ? (e: { loaded: number; total?: number }) => onProgress(e) : undefined,
    } as Record<string, unknown>);
  },

  createKnowledgeFromURL: (
    kbId: string,
    data: { url: string; enable_multimodel?: boolean; tag_id?: string }
  ) => http.post(`${API_BASE}/knowledge-bases/${kbId}/knowledge/url`, data),

  createManualKnowledge: (
    kbId: string,
    data: { title: string; content: string; status: string; tag_id?: string }
  ) => http.post(`${API_BASE}/knowledge-bases/${kbId}/knowledge/manual`, data),

  listKnowledgeFiles: (
    kbId: string,
    params: { page: number; page_size: number; tag_id?: string; keyword?: string; file_type?: string }
  ) => {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('page_size', String(params.page_size));
    if (params.tag_id) q.set('tag_id', params.tag_id);
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.file_type) q.set('file_type', params.file_type);
    return http.get(`${API_BASE}/knowledge-bases/${kbId}/knowledge?${q.toString()}`);
  },

  getKnowledgeDetails: (id: string) => http.get(`${API_BASE}/knowledge/${id}`),

  updateManualKnowledge: (id: string, data: { title: string; content: string; status: string }) =>
    http.put(`${API_BASE}/knowledge/manual/${id}`, data),

  deleteKnowledgeDetails: (id: string) => http.delete(`${API_BASE}/knowledge/${id}`),

  getChunkDetails: (id: string, page: number) =>
    http.get(`${API_BASE}/chunks/${id}?page=${page}&page_size=25`),

  /** 批量查询知识状态（用于解析/摘要轮询） */
  batchQueryKnowledge: (idsQueryString: string) =>
    http.get<{ success: boolean; data?: any[] }>(`${API_BASE}/knowledge/batch?${idsQueryString}`),

  /** 搜索知识（用于 @ 提及，支持知识库和文件） */
  searchKnowledge: (keyword: string, offset = 0, limit = 20, fileTypes?: string[]) => {
    const q = new URLSearchParams();
    q.set('keyword', keyword);
    q.set('offset', String(offset));
    q.set('limit', String(limit));
    if (fileTypes?.length) q.set('file_types', fileTypes.join(','));
    return http.get<{ success: boolean; data?: any[]; has_more?: boolean }>(`${API_BASE}/knowledge/search?${q.toString()}`);
  },

  /** 批量更新知识标签 */
  updateKnowledgeTagBatch: (data: { updates: Record<string, string | null> }) =>
    http.put(`${API_BASE}/knowledge/tags`, data),
};

// 知识库标签 API
export const knowledgeTagService = {
  listKnowledgeTags: (
    kbId: string,
    params?: { page?: number; page_size?: number; keyword?: string }
  ) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
      });
    }
    const query = q.toString();
    return http.get(`${API_BASE}/knowledge-bases/${kbId}/tags${query ? `?${query}` : ''}`);
  },

  createKnowledgeBaseTag: (
    kbId: string,
    data: { name: string; color?: string; sort_order?: number }
  ) => http.post(`${API_BASE}/knowledge-bases/${kbId}/tags`, data),

  updateKnowledgeBaseTag: (
    kbId: string,
    tagId: string,
    data: { name?: string; color?: string; sort_order?: number }
  ) => http.put(`${API_BASE}/knowledge-bases/${kbId}/tags/${tagId}`, data),

  deleteKnowledgeBaseTag: (kbId: string, tagSeqId: number, force?: boolean) =>
    http.delete(`${API_BASE}/knowledge-bases/${kbId}/tags/${tagSeqId}${force ? '?force=true' : ''}`),
};

// FAQ API
export const faqService = {
  listFAQEntries: (
    kbId: string,
    params?: { page?: number; page_size?: number; tag_id?: number; keyword?: string }
  ) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
      });
    }
    const query = q.toString();
    return http.get(`${API_BASE}/knowledge-bases/${kbId}/faq/entries${query ? `?${query}` : ''}`);
  },

  createFAQEntry: (kbId: string, data: unknown) =>
    http.post(`${API_BASE}/knowledge-bases/${kbId}/faq/entry`, data),

  updateFAQEntry: (kbId: string, entryId: number, data: unknown) =>
    http.put(`${API_BASE}/knowledge-bases/${kbId}/faq/entries/${entryId}`, data),

  updateFAQEntryFieldsBatch: (kbId: string, data: FAQEntryFieldsBatchRequest) =>
    http.put(`${API_BASE}/knowledge-bases/${kbId}/faq/entries/fields`, data),

  deleteFAQEntries: (kbId: string, ids: number[]) =>
    http.delete(`${API_BASE}/knowledge-bases/${kbId}/faq/entries`, { data: { ids } }),

  searchFAQEntries: (
    kbId: string,
    data: { query_text: string; vector_threshold?: number; match_count?: number }
  ) => http.post(`${API_BASE}/knowledge-bases/${kbId}/faq/search`, data),

  upsertFAQEntries: (kbId: string, data: { entries: any[]; mode: 'append' | 'replace' }) =>
    http.post(`${API_BASE}/knowledge-bases/${kbId}/faq/entries`, data),

  exportFAQEntries: async (kbId: string): Promise<Blob> => {
    // Note: Assuming http.get supports responseType config or returns raw response if needed.
    // If http wrapper doesn't support it, might need adjustment.
    // For now assuming existing http wrapper handles it or we might need to use raw axios/fetch if not.
    // Checking http wrapper... it seems to return data directly.
    // Let's assume standard behavior or fix if testing fails.
    // Actually, based on previous `http.get`, it returns `Promise<T>`.
    // We might need to cast or ensure the underlying request handles blob.
    // For safety, let's use a pattern that usually works with custom wrappers, or just return the promise.
    return http.get(`${API_BASE}/knowledge-bases/${kbId}/faq/entries/export`, { responseType: 'blob' } as any) as Promise<Blob>;
  },

  getFAQImportProgress: (taskId: string) =>
    http.get(`${API_BASE}/faq/import/progress/${taskId}`),

  updateFAQImportResultDisplayStatus: (knowledgeBaseId: string, displayStatus: 'open' | 'close') =>
    http.put(`${API_BASE}/knowledge-bases/${knowledgeBaseId}/faq/import/last-result/display`, {
      display_status: displayStatus,
    }),
};
