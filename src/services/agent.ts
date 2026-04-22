/**
 * 智能体 API 服务
 * 从 aegis-rag-frontend api/agent 迁移
 */

import { http } from '@/utils/request';
import type {
  CustomAgent,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '@/types/agent';

const API = '/rag/v1';

export const agentService = {
  list: () => http.get<{ data: CustomAgent[] }>(`${API}/agents`),
  get: (id: string) => http.get<{ data: CustomAgent }>(`${API}/agents/${id}`),
  create: (data: CreateAgentRequest) => http.post<{ data: CustomAgent }>(`${API}/agents`, data),
  update: (id: string, data: UpdateAgentRequest) =>
    http.put<{ data: CustomAgent }>(`${API}/agents/${id}`, data),
  delete: (id: string) => http.delete<{ success: boolean }>(`${API}/agents/${id}`),
  copy: (id: string) => http.post<{ data: CustomAgent }>(`${API}/agents/${id}/copy`),
  getPlaceholders: () =>
    http.get<{ data: import('@/types/agent').PlaceholdersResponse }>(`${API}/agents/placeholders`),
};
