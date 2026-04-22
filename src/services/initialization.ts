import { http } from '@/utils/request';

const API = '/rag/v1';

// Ollama 模型详细信息接口
export interface OllamaModelInfo {
    name: string;
    size: number;
    digest: string;
    modified_at: string;
}

// 下载任务状态类型
export interface DownloadTask {
    id: string;
    modelName: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number;
    message: string;
    startTime: string;
    endTime?: string;
}

// Helper to unwrap RAG response
const unwrap = <T>(res: any): T => (res?.data ?? res) as T;

// 检查Ollama服务状态
export const checkOllamaStatus = () =>
    http.get<{ available: boolean; version?: string; error?: string; baseUrl?: string }>(
        `${API}/initialization/ollama/status`
    ).then(unwrap);

// 列出已安装的 Ollama 模型（详细信息）
export const listOllamaModels = () =>
    http.get<{ models: OllamaModelInfo[] }>(`${API}/initialization/ollama/models`)
        .then(unwrap)
        .then(res => res.models || []);

// 检查Ollama模型状态
export const checkOllamaModels = (models: string[]) =>
    http.post<{ models: Record<string, boolean> }>(`${API}/initialization/ollama/models/check`, { models })
        .then(unwrap);

// 启动Ollama模型下载（异步）
export const downloadOllamaModel = (modelName: string) =>
    http.post<{ taskId: string; modelName: string; status: string; progress: number }>(
        `${API}/initialization/ollama/models/download`,
        { modelName }
    ).then(unwrap);

// 查询下载进度
export const getDownloadProgress = (taskId: string) =>
    http.get<DownloadTask>(`${API}/initialization/ollama/download/progress/${taskId}`)
        .then(unwrap);


// 检查远程API模型
export const checkRemoteModel = (modelConfig: {
    modelName: string;
    baseUrl: string;
    apiKey?: string;
}) =>
    http.post<{ available: boolean; message?: string }>(`${API}/initialization/remote/check`, modelConfig)
        .then(unwrap);

// 测试 Embedding 模型（本地/远程）是否可用
export const testEmbeddingModel = (modelConfig: {
    source: 'local' | 'remote';
    modelName: string;
    baseUrl?: string;
    apiKey?: string;
    dimension?: number;
    provider?: string;
}) =>
    http.post<{ available: boolean; message?: string; dimension?: number }>(
        `${API}/initialization/embedding/test`,
        modelConfig
    ).then(unwrap);

// 检查 Rerank 模型
export const checkRerankModel = (modelConfig: {
    modelName: string;
    baseUrl: string;
    apiKey?: string;
}) =>
    http.post<{ available: boolean; message?: string }>(`${API}/initialization/rerank/check`, modelConfig)
        .then(unwrap);

// 模型厂商信息类型
export interface ModelProviderOption {
    value: string;        // provider 标识符
    label: string;        // 显示名称
    description: string;  // 描述
    defaultUrls: Record<string, string>;  // 按模型类型区分的默认 URL
    modelTypes: string[]; // 支持的模型类型
}

// 获取模型厂商列表
export const listModelProviders = (modelType?: string) => {
    const url = modelType
        ? `${API}/models/providers?model_type=${encodeURIComponent(modelType)}`
        : `${API}/models/providers`;
    return http.get<ModelProviderOption[]>(url);
};
