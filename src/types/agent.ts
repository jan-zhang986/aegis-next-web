/**
 * 智能体类型
 * 从 aegis-rag-frontend api/agent 迁移
 */

export interface CustomAgentConfig {
  agent_mode?: 'quick-answer' | 'smart-reasoning';
  system_prompt?: string;
  context_template?: string;
  model_id?: string;
  rerank_model_id?: string;
  temperature?: number;
  max_completion_tokens?: number;
  max_iterations?: number;
  allowed_tools?: string[];
  reflection_enabled?: boolean;
  mcp_selection_mode?: 'all' | 'selected' | 'none';
  mcp_services?: string[];
  kb_selection_mode?: 'all' | 'selected' | 'none';
  knowledge_bases?: string[];
  retrieve_kb_only_when_mentioned?: boolean;
  supported_file_types?: string[];
  web_search_enabled?: boolean;
  web_search_max_results?: number;
  multi_turn_enabled?: boolean;
  history_turns?: number;
  embedding_top_k?: number;
  keyword_threshold?: number;
  vector_threshold?: number;
  rerank_top_k?: number;
  rerank_threshold?: number;
  enable_query_expansion?: boolean;
  enable_rewrite?: boolean;
  rewrite_prompt_system?: string;
  rewrite_prompt_user?: string;
  fallback_strategy?: 'fixed' | 'model';
  fallback_response?: string;
  fallback_prompt?: string;
  welcome_message?: string;
  suggested_prompts?: string[];
  // 思考模式
  thinking?: boolean;
  // FAQ 策略
  faq_priority_enabled?: boolean;
  faq_direct_answer_threshold?: number;
  faq_score_boost?: number;
  retrieve_kb_only_when_mentioned?: boolean;
}

export interface PlaceholderDefinition {
  name: string;
  label: string;
  description: string;
}

export interface PlaceholdersResponse {
  all: PlaceholderDefinition[];
  system_prompt: PlaceholderDefinition[];
  agent_system_prompt: PlaceholderDefinition[];
  context_template: PlaceholderDefinition[];
  rewrite_system_prompt: PlaceholderDefinition[];
  rewrite_prompt: PlaceholderDefinition[];
  fallback_prompt: PlaceholderDefinition[];
}

export interface CustomAgent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  is_builtin: boolean;
  tenant_id?: number;
  created_by?: string;
  config: CustomAgentConfig;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatar?: string;
  config?: CustomAgentConfig;
}

export interface UpdateAgentRequest {
  name: string;
  description?: string;
  avatar?: string;
  config?: CustomAgentConfig;
}

export const BUILTIN_QUICK_ANSWER_ID = 'builtin-quick-answer';
export const BUILTIN_SMART_REASONING_ID = 'builtin-smart-reasoning';

export const AGENT_MODE_QUICK_ANSWER = 'quick-answer';
export const AGENT_MODE_SMART_REASONING = 'smart-reasoning';
