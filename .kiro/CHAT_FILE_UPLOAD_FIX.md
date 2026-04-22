# 聊天文件上传显示问题修复

## 问题描述

用户在聊天界面上传文件后，文件上传成功但页面不显示已上传的文件。

## 根本原因

后端返回的字段是 `file_id` 而不是 `knowledge_id`，但前端代码期望的是 `knowledge_id`。

### 后端实际响应格式

```json
{
  "data": {
    "content_length": 19513,
    "content_preview": "...",
    "file_id": "647366c0-35e6-4369-b069-a73a57bb0092",
    "file_name": "2025 质量中台工作总结.pdf",
    "file_type": "pdf"
  },
  "success": true
}
```

### 前端期望的字段

前端代码期望返回值包含 `knowledge_id` 字段：

```typescript
if (res?.knowledge_id) {  // ❌ 后端返回的是 file_id
  uploadedFiles.push({
    id: res.knowledge_id,
    name: res.file_name,
    type: res.file_type,
  });
}
```

## 修复方案

### 修改 `uploadSessionFile` 函数

**文件：`src/services/rag-chat.ts`**

```typescript
export async function uploadSessionFile(sessionId: string, file: File): Promise<{
  knowledge_id: string;
  knowledge_base_id: string;
  file_name: string;
  file_type: string;
}> {
  const url = `${SESSION_API_BASE}/sessions/${sessionId}/files`;
  const formData = new FormData();
  formData.append('file', file);

  const res = await http.post<any>(url, formData);
  
  // 兼容多种后端响应格式
  const data = res?.data?.data ?? res?.data ?? res;
  
  console.log('[uploadSessionFile] 后端响应:', res);
  console.log('[uploadSessionFile] 提取的数据:', data);
  
  // ✅ 后端返回的是 file_id，需要映射为 knowledge_id
  const fileId = data?.file_id || data?.knowledge_id;
  
  if (!fileId) {
    console.error('[uploadSessionFile] 响应格式异常，缺少 file_id 或 knowledge_id:', res);
    throw new Error('文件上传成功但未返回文件ID');
  }
  
  // ✅ 使用 file_id 作为 knowledge_id
  return {
    knowledge_id: fileId,
    knowledge_base_id: data.knowledge_base_id || '',
    file_name: data.file_name || data.filename || file.name,
    file_type: data.file_type || data.type || file.type || 'file',
  };
}
```

**关键改动：**

1. **字段映射**：`const fileId = data?.file_id || data?.knowledge_id;`
   - 优先使用 `file_id`（后端实际返回的字段）
   - 回退到 `knowledge_id`（兼容旧版本或其他接口）

2. **返回值映射**：`knowledge_id: fileId`
   - 将 `file_id` 映射为前端期望的 `knowledge_id`
   - 保持前端代码不变，只在服务层做适配

3. **详细日志**：添加 console.log 便于调试

## 修复效果

- ✅ 正确识别后端返回的 `file_id` 字段
- ✅ 兼容 `file_id` 和 `knowledge_id` 两种字段名
- ✅ 文件上传成功后正确显示在输入框上方
- ✅ 详细的控制台日志，便于排查问题

## 测试验证

修复后，上传文件时会看到以下日志：

```
[handleUploadFiles] 开始上传文件: 2025 质量中台工作总结.pdf
[uploadSessionFile] 后端响应: { data: { file_id: "...", file_name: "...", ... }, success: true }
[uploadSessionFile] 提取的数据: { file_id: "...", file_name: "...", ... }
[handleUploadFiles] 上传响应: { knowledge_id: "...", file_name: "...", ... }
[handleUploadFiles] 文件上传成功: { id: "...", name: "2025 质量中台工作总结.pdf" }
[handleUploadFiles] 批量添加文件到状态: [{ id: "...", name: "...", type: "pdf" }]
[handleUploadFiles] 更新后的 attachedFiles: [{ id: "...", name: "...", type: "pdf" }]
```

文件会正确显示在输入框上方：

```
┌─────────────────────────────────────┐
│ 📄 2025 质量中台工作总结.pdf  ✕    │
└─────────────────────────────────────┘
```

## 后端接口说明

**接口：** `POST /api/v1/sessions/{sessionId}/files`

**请求：**
```
Content-Type: multipart/form-data
file: <binary>
```

**响应：**
```json
{
  "data": {
    "file_id": "647366c0-35e6-4369-b069-a73a57bb0092",
    "file_name": "2025 质量中台工作总结.pdf",
    "file_type": "pdf",
    "content_length": 19513,
    "content_preview": "..."
  },
  "success": true
}
```

**字段说明：**
- `file_id`: 文件唯一标识符（用于后续引用）
- `file_name`: 文件名
- `file_type`: 文件类型（pdf, docx, txt 等）
- `content_length`: 文件大小（字节）
- `content_preview`: 文件内容预览（可选）

## 相关文件

- `src/services/rag-chat.ts` - RAG Chat 服务（已修复）
- `src/components/features/case-management/CaseGenerationChatView.tsx` - 聊天视图组件

## 经验教训

1. **字段名不一致**：前后端字段名要保持一致，或在服务层做好映射
2. **详细日志**：在关键步骤添加日志，便于快速定位问题
3. **兼容性处理**：同时支持新旧字段名，提高代码健壮性
4. **类型定义**：应该为后端响应定义明确的 TypeScript 类型

### 原始代码问题

```typescript
// src/services/rag-chat.ts
export async function uploadSessionFile(sessionId: string, file: File) {
  const url = `${SESSION_API_BASE}/sessions/${sessionId}/files`;
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await http.post<any>(url, formData);
  return (res as any)?.data ?? res;  // ❌ 数据提取逻辑不够健壮
}
```

**问题分析：**

1. **数据提取不完整**：只尝试 `res?.data ?? res`，无法处理嵌套的数据结构
2. **缺少验证**：没有验证返回的数据是否包含必需的 `knowledge_id` 字段
3. **缺少回退值**：如果某些字段缺失（如 `file_name`），没有使用原始文件信息作为回退

### 后端可能的响应格式

后端可能返回以下几种格式：

```typescript
// 格式 1: 直接返回数据
{
  knowledge_id: "xxx",
  file_name: "test.pdf",
  file_type: "pdf",
  knowledge_base_id: "yyy"
}

// 格式 2: 包装在 data 中
{
  data: {
    knowledge_id: "xxx",
    file_name: "test.pdf",
    ...
  }
}

// 格式 3: 双层嵌套
{
  data: {
    data: {
      knowledge_id: "xxx",
      ...
    }
  }
}
```

原始代码只能正确处理格式 1 和 2，无法处理格式 3。

## 修复方案

### 1. 改进 `uploadSessionFile` 函数

**文件：`src/services/rag-chat.ts`**

```typescript
export async function uploadSessionFile(sessionId: string, file: File): Promise<{
  knowledge_id: string;
  knowledge_base_id: string;
  file_name: string;
  file_type: string;
}> {
  const url = `${SESSION_API_BASE}/sessions/${sessionId}/files`;
  const formData = new FormData();
  formData.append('file', file);

  const res = await http.post<any>(url, formData);
  
  // ✅ 兼容多种后端响应格式
  // 1. { data: { knowledge_id, file_name, ... } }
  // 2. { knowledge_id, file_name, ... }
  // 3. { data: { data: { knowledge_id, ... } } } (嵌套)
  const data = res?.data?.data ?? res?.data ?? res;
  
  // ✅ 验证必需字段
  if (!data?.knowledge_id) {
    console.error('[uploadSessionFile] 响应格式异常:', res);
    throw new Error('文件上传成功但未返回 knowledge_id');
  }
  
  // ✅ 使用原始文件信息作为回退值
  return {
    knowledge_id: data.knowledge_id,
    knowledge_base_id: data.knowledge_base_id || '',
    file_name: data.file_name || data.filename || file.name,
    file_type: data.file_type || data.type || file.type || 'file',
  };
}
```

**改进点：**

1. **多层数据提取**：`res?.data?.data ?? res?.data ?? res` 可以处理各种嵌套结构
2. **必需字段验证**：检查 `knowledge_id` 是否存在，不存在则抛出明确的错误
3. **字段回退值**：
   - `file_name`: 尝试 `data.file_name` → `data.filename` → `file.name`
   - `file_type`: 尝试 `data.file_type` → `data.type` → `file.type` → `'file'`
4. **错误日志**：在控制台输出完整的响应数据，便于调试

### 2. 改进前端错误处理和日志

**文件：`src/components/features/case-management/CaseGenerationChatView.tsx`**

```typescript
const handleUploadFiles = async (files: File[]) => {
  if (files.length === 0) return;
  setIsUploading(true);
  let successCount = 0;
  const uploadedFiles: AttachedFile[] = [];
  try {
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 大小不能超过 20MB`);
        continue;
      }
      try {
        // ✅ 添加详细日志
        console.log('[handleUploadFiles] 开始上传文件:', file.name);
        const res = await uploadSessionFile(chatId, file);
        console.log('[handleUploadFiles] 上传响应:', res);
        
        if (res?.knowledge_id) {
          uploadedFiles.push({
            id: res.knowledge_id,
            name: res.file_name || file.name,  // ✅ 使用回退值
            type: res.file_type || file.type || 'file',  // ✅ 使用回退值
          });
          successCount++;
          console.log('[handleUploadFiles] 文件上传成功:', {
            id: res.knowledge_id,
            name: res.file_name || file.name,
          });
        } else {
          // ✅ 明确的错误提示
          console.error('[handleUploadFiles] 响应缺少 knowledge_id:', res);
          toast.error(`文件 ${file.name} 上传失败: 响应格式异常`);
        }
      } catch (err: any) {
        console.error('[handleUploadFiles] 文件上传失败:', err);
        toast.error(`文件 ${file.name} 上传失败: ${err.message}`);
      }
    }
    
    if (uploadedFiles.length > 0) {
      // ✅ 添加状态更新日志
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
```

**改进点：**

1. **详细日志**：在关键步骤添加 console.log，便于排查问题
2. **回退值**：使用原始文件信息作为回退值
3. **明确错误**：区分不同的错误情况，提供更有用的错误信息

## 修复效果

修复后，文件上传功能将：

1. ✅ 正确处理各种后端响应格式
2. ✅ 验证必需字段，及时发现问题
3. ✅ 使用回退值确保文件信息完整
4. ✅ 在控制台输出详细日志，便于调试
5. ✅ 文件上传成功后正确显示在输入框上方

## 调试步骤

如果问题仍然存在，请按以下步骤调试：

### 1. 打开浏览器控制台

在聊天页面按 F12 打开开发者工具，切换到 Console 标签。

### 2. 上传文件

点击附件按钮上传一个文件。

### 3. 查看日志

在控制台中查找以下日志：

```
[handleUploadFiles] 开始上传文件: test.pdf
[handleUploadFiles] 上传响应: { ... }
[handleUploadFiles] 文件上传成功: { id: "xxx", name: "test.pdf" }
[handleUploadFiles] 批量添加文件到状态: [{ id: "xxx", name: "test.pdf", type: "pdf" }]
[handleUploadFiles] 更新后的 attachedFiles: [{ id: "xxx", name: "test.pdf", type: "pdf" }]
```

### 4. 检查响应格式

如果看到错误日志：

```
[uploadSessionFile] 响应格式异常: { ... }
```

请检查响应数据的结构，确认 `knowledge_id` 字段的位置。

### 5. 检查网络请求

在 Network 标签中找到 `/api/v1/sessions/{sessionId}/files` 请求：

- **Status**: 应该是 200
- **Response**: 查看返回的 JSON 数据结构
- **Headers**: 确认 `Content-Type` 是 `multipart/form-data`

## 常见问题

### Q1: 文件上传成功但仍不显示

**可能原因：**
- 后端返回的数据结构与预期不符
- `knowledge_id` 字段名不同（如 `knowledgeId`、`id` 等）

**解决方法：**
1. 查看控制台日志中的 `[handleUploadFiles] 上传响应`
2. 根据实际的字段名调整代码

### Q2: 上传后文件列表被清空

**可能原因：**
- 组件重新渲染导致状态丢失
- `chatId` 变化触发了状态重置

**解决方法：**
- 检查 `chatId` 是否稳定
- 确认没有其他代码调用 `setAttachedFiles([])`

### Q3: 多个文件只显示最后一个

**可能原因：**
- 状态更新时机问题
- 使用了错误的状态更新方式

**解决方法：**
- 已修复：使用批量更新 `setAttachedFiles((prev) => [...prev, ...uploadedFiles])`

## 相关文件

- `src/services/rag-chat.ts` - RAG Chat 服务（已修复）
- `src/components/features/case-management/CaseGenerationChatView.tsx` - 聊天视图组件（已改进）

## 测试验证

修复后需要测试：

1. **单文件上传**：上传一个文件，验证显示正确
2. **多文件上传**：同时上传多个文件，验证都能显示
3. **大文件限制**：上传超过 20MB 的文件，验证错误提示
4. **粘贴上传**：在输入框粘贴文件，验证上传和显示
5. **文件移除**：点击文件的 X 按钮，验证能正确移除
6. **发送消息**：上传文件后发送消息，验证文件被包含在消息中

## 后续优化建议

1. **统一响应格式**：与后端协商统一 API 响应格式
2. **类型定义**：为后端响应添加 TypeScript 类型定义
3. **上传进度**：添加文件上传进度显示
4. **文件预览**：支持图片文件的缩略图预览
5. **拖拽上传**：支持拖拽文件到输入框上传
