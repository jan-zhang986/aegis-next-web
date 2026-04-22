# 用例生成页面 403 错误修复

## 问题描述

用例生成页面的接口调用返回 403 错误，而智能体、知识库等其他 RAG 相关功能正常工作。

## 根本原因

用例生成页面（`CaseGenerationChat`）使用的 `rag-chat.ts` 服务直接使用原生 `fetch` API，而不是项目封装的 `http` 工具（基于 axios）。

### 关键差异

1. **智能体和知识库**：
   - 使用 `http` 工具（来自 `@/utils/request`）
   - 经过请求拦截器处理
   - 自动添加 RAG Bearer token
   - 路径：`/rag/v1/*`

2. **用例生成（修复前）**：
   - 使用原生 `fetch` API
   - 设置 `credentials: 'omit'`（不发送 cookies）
   - 手动添加 Authorization header
   - 但由于某些原因导致 403

## 问题分析

### 为什么其他接口正常？

查看 `src/utils/request.ts` 的请求拦截器：

```typescript
// 判断是否为 RAG 请求
function isRagRequest(url: string | undefined): boolean {
  return !!url?.includes('/rag/v1');
}

// 请求拦截器
request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';

    // RAG 请求：使用 Bearer token
    if (isRagRequest(url)) {
      const ragToken = await ensureRagLoggedIn();
      if (ragToken && config.headers) {
        config.headers.Authorization = `Bearer ${ragToken}`;
      }
      return config;
    }
    // ... MeterSphere 请求处理
  }
);
```

智能体和知识库的所有请求都经过这个拦截器，自动添加正确的认证信息。

### 为什么用例生成会 403？

原始代码使用 `fetch` 并设置 `credentials: 'omit'`：

```typescript
const res = await fetch(url, {
  method: 'POST',
  credentials: 'omit', // 不发送 cookies
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({}),
});
```

可能的原因：
1. Token 获取逻辑与 `http` 工具不一致
2. `credentials: 'omit'` 可能影响某些认证流程
3. 缺少其他必要的请求头

## 修复方案

### 1. 非流式请求改用 `http` 工具

将 `createSession` 和 `loadMessages` 改为使用 `http` 工具：

```typescript
import { http } from '@/utils/request';

export async function createSession(): Promise<{ id: string }> {
  const url = `${API_BASE}/sessions`;
  const data = await http.post<any>(url, {});
  const id = data?.data?.id ?? data?.id;
  if (!id) throw new Error('创建会话失败：未返回 session_id');
  return { id };
}

export async function loadMessages(
  sessionId: string,
  options?: { before_time?: string; limit?: number }
): Promise<any[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.before_time) params.set('before_time', options.before_time);
  const qs = params.toString();
  const url = `${API_BASE}/messages/${sessionId}/load${qs ? `?${qs}` : ''}`;
  const data = await http.get<any>(url);
  const list = data?.data ?? data?.list ?? data;
  return Array.isArray(list) ? list : [];
}
```

### 2. 流式请求保留 `fetch` 但移除 `credentials: 'omit'`

流式请求必须使用 `fetch`（axios 不支持流式响应），但要确保 token 获取逻辑一致：

```typescript
export async function streamKnowledgeChat(
  sessionId: string,
  query: string,
  onChunk: StreamChunkHandler,
  options?: { signal?: AbortSignal }
): Promise<void> {
  // 使用与 request.ts 一致的 token 获取逻辑
  const getRagToken = () => {
    const AEGIS_RAG_TOKEN_KEY = 'aegis-rag_token';
    const RAG_TOKEN_KEY = 'rag-access-token';
    const RAG_SYSTEM_TOKEN = import.meta.env.VITE_RAG_TOKEN || '...';
    return (
      localStorage.getItem(AEGIS_RAG_TOKEN_KEY) ||
      sessionStorage.getItem(RAG_TOKEN_KEY) ||
      RAG_SYSTEM_TOKEN
    );
  };

  const token = getRagToken();
  const url = `${API_BASE}/knowledge-chat/${sessionId}`;
  const res = await fetch(url, {
    method: 'POST',
    // 移除 credentials: 'omit'，使用默认值
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
    signal: options?.signal,
  });
  // ... 流式处理逻辑
}
```

## 修复效果

修复后，用例生成页面的所有 API 调用将：

1. ✅ 使用与智能体、知识库一致的认证机制
2. ✅ 自动添加正确的 Bearer token
3. ✅ 避免 403 错误
4. ✅ 保持流式响应功能正常

## 测试验证

修复后需要测试：

1. **创建会话**：访问用例生成页面，验证会话创建成功
2. **发送消息**：输入测试需求，验证 AI 响应正常
3. **流式响应**：验证 AI 回复是逐字显示（流式）
4. **错误处理**：验证 token 过期时的错误提示

## 相关文件

- `src/services/rag-chat.ts` - RAG Chat 服务（已修复）
- `src/utils/request.ts` - HTTP 请求工具（包含 RAG 认证拦截器）
- `src/services/rag-auth.ts` - RAG 认证服务
- `src/components/features/case-management/CaseGenerationChat.tsx` - 用例生成页面组件

## 经验教训

1. **统一使用封装的 HTTP 工具**：避免直接使用 `fetch`，除非有特殊需求（如流式响应）
2. **保持认证逻辑一致**：所有 RAG 请求应使用相同的 token 获取和添加逻辑
3. **避免 `credentials: 'omit'`**：除非明确需要，否则使用默认的 credentials 设置
4. **参考已有实现**：新功能应参考已有的、正常工作的类似功能实现

## 后续优化建议

1. 考虑将流式请求也封装到 `http` 工具中，提供统一的流式 API
2. 添加更详细的错误日志，便于排查类似问题
3. 在开发环境添加 RAG token 验证提示
