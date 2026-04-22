/**
 * 知识库相关类型定义
 * 从 aegis-rag-frontend 迁移
 */

export type KnowledgeBaseType = 'document' | 'faq';

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  type?: KnowledgeBaseType;
  embedding_model_id?: string;
  summary_model_id?: string;
  vlm_config?: { enabled?: boolean; model_id?: string };
  extract_config?: { enabled?: boolean };
  cos_config?: { provider?: string; bucket_name?: string };
  question_generation_config?: { enabled?: boolean; question_count?: number };
  knowledge_count?: number;
  chunk_count?: number;
  is_processing?: boolean;
  processing_count?: number;
  updated_at?: string;
  created_at?: string;
}

export interface KnowledgeFile {
  id: string;
  file_name?: string;
  title?: string;
  source?: string;
  type?: string;
  file_type?: string;
  updated_at?: string;
  tag_id?: string;
  parse_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'draft';
  summary_status?: 'pending' | 'processing' | 'completed';
  description?: string;
  knowledge_base_id?: string;
}

export interface KnowledgeTag {
  id: string;
  seq_id?: number;
  name: string;
  color?: string;
  sort_order?: number;
  knowledge_count?: number;
}

export interface CreateKnowledgeBaseParams {
  name: string;
  description?: string;
  type?: KnowledgeBaseType;
  chunking_config?: Record<string, unknown>;
  embedding_model_id?: string;
  summary_model_id?: string;
  vlm_config?: { enabled: boolean; model_id?: string };
  cos_config?: Record<string, unknown>;
  extract_config?: Record<string, unknown>;
  faq_config?: { index_mode: string; question_index_mode?: string };
}

export interface FAQEntryFieldsUpdate {
  is_enabled?: boolean;
  is_recommended?: boolean;
  tag_id?: number | null;
}

export interface FAQEntryFieldsBatchRequest {
  by_id?: Record<number, FAQEntryFieldsUpdate>;
  by_tag?: Record<number, FAQEntryFieldsUpdate>;
  exclude_ids?: number[];
}

export interface FAQEntry {
  id?: string; // Compatible with frontend logic if needed as string
  seq_id: number;
  standard_question: string;
  answer?: string; // Legacy/Simple
  answers?: string[]; // Multiple answers support
  similar_questions?: string[];
  negative_questions?: string[];
  tag_id?: number;
  is_enabled?: boolean;
  is_recommended?: boolean;
  chunk_count?: number;
  created_at?: string;
  updated_at?: string;
  // UI Helper
  showMore?: boolean;
  similarCollapsed?: boolean;
  negativeCollapsed?: boolean;
  answersCollapsed?: boolean;
}
