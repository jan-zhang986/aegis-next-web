/**
 * Agent 设置相关 API
 * 从 aegis-rag-frontend 迁移
 */

import { http } from '@/utils/request';

const API = '/rag/v1';

// ========== Ollama ==========
export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface DownloadTask {
  id: string;
  modelName: string;
  status: string;
  progress: number;
  message?: string;
}

export const ollamaService = {
  checkStatus: () =>
    http.get<{ available: boolean; version?: string; error?: string; baseUrl?: string }>(
      `${API}/initialization/ollama/status`
    ),

  listModels: () =>
    http.get<{ models: OllamaModelInfo[] }>(`${API}/initialization/ollama/models`),

  downloadModel: (modelName: string) =>
    http.post<{ taskId: string; modelName: string; status: string; progress: number }>(
      `${API}/initialization/ollama/models/download`,
      { modelName }
    ),

  getDownloadProgress: (taskId: string) =>
    http.get<DownloadTask>(`${API}/initialization/ollama/download/progress/${taskId}`),
};

// ========== Web Search ==========
export interface WebSearchProviderConfig {
  id: string;
  name: string;
  free: boolean;
  requires_api_key: boolean;
  description?: string;
  api_url?: string;
}

export interface WebSearchConfig {
  provider: string;
  api_key?: string;
  max_results: number;
  include_date: boolean;
  compression_method: string;
  blacklist: string[];
}

export const webSearchService = {
  getProviders: () => http.get<{ data?: WebSearchProviderConfig[] }>(`${API}/web-search/providers`),

  getTenantConfig: () =>
    http.get<{ data?: WebSearchConfig }>(`${API}/tenants/kv/web-search-config`),

  updateTenantConfig: (config: WebSearchConfig) =>
    http.put(`${API}/tenants/kv/web-search-config`, config),
};

// ========== MCP Service ==========
export interface MCPService {
  id: string;
  tenant_id?: number;
  name: string;
  description: string;
  enabled: boolean;
  transport_type: 'sse' | 'http-streamable' | 'stdio';
  url?: string;
  headers?: Record<string, string>;
  auth_config?: {
    api_key?: string;
    token?: string;
    custom_headers?: Record<string, string>;
    [key: string]: unknown;
  };
  advanced_config?: {
    timeout?: number;
    retry_count?: number;
    retry_delay?: number;
    [key: string]: unknown;
  };
  stdio_config?: {
    command?: string;
    args?: string[];
    [key: string]: unknown;
  };
  env_vars?: Record<string, string>;
  command?: string; // Legacy or alternative
  created_at?: string;
  updated_at?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPTestResult {
  success: boolean;
  message?: string;
  tools?: MCPTool[];
  resources?: MCPResource[];
}

// ========== 系统配置（Agent/对话默认值）==========
export interface AgentConfigResponse {
  system_prompt?: string;
  max_iterations?: number;
  temperature?: number;
  allowed_tools?: string[];
}

export interface ConversationConfigResponse {
  prompt?: string;
  context_template?: string;
  temperature?: number;
  max_completion_tokens?: number;
  embedding_top_k?: number;
  keyword_threshold?: number;
  vector_threshold?: number;
  rerank_top_k?: number;
  rerank_threshold?: number;
  rewrite_prompt_system?: string;
  rewrite_prompt_user?: string;
  fallback_prompt?: string;
  fallback_response?: string;
  enable_rewrite?: boolean;
  enable_query_expansion?: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  has_knowledge_base?: boolean;
  has_web_search?: boolean;
}

export interface PromptTemplatesConfig {
  system_prompt: PromptTemplate[];
  context_template: PromptTemplate[];
  rewrite_system: PromptTemplate[];
  rewrite_user: PromptTemplate[];
  fallback: PromptTemplate[];
}

export const systemConfigService = {
  getAgentConfig: () => http.get<{ data: AgentConfigResponse }>(`${API}/tenants/kv/agent-config`),
  getConversationConfig: () =>
    http.get<{ data: ConversationConfigResponse }>(`${API}/tenants/kv/conversation-config`),
  getPromptTemplates: () =>
    http.get<{ data: PromptTemplatesConfig }>(`${API}/tenants/kv/prompt-templates`),
};

// ========== MCP Service ==========
export const mcpService = {
  list: () => http.get<MCPService[] | { data: MCPService[] }>(`${API}/mcp-services`),

  get: (id: string) => http.get<MCPService>(`${API}/mcp-services/${id}`),

  create: (data: Partial<MCPService>) =>
    http.post<MCPService>(`${API}/mcp-services`, data),

  update: (id: string, data: Partial<MCPService>) =>
    http.put<MCPService>(`${API}/mcp-services/${id}`, data),

  delete: (id: string) => http.delete(`${API}/mcp-services/${id}`),

  test: (id: string) =>
    http.post<MCPTestResult | { data: MCPTestResult }>(`${API}/mcp-services/${id}/test`, {}),

  // Get tools from an MCP service
  getTools: (id: string) =>
    http.get<MCPTool[] | { data: MCPTool[] }>(`${API}/mcp-services/${id}/tools`),

  // Get resources from an MCP service
  getResources: (id: string) =>
    http.get<MCPResource[] | { data: MCPResource[] }>(`${API}/mcp-services/${id}/resources`),
};
