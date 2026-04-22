# 知识库功能迁移说明

从 `aegis-rag-frontend` 迁移知识库和接口到本项目。

## 迁移内容

### 1. API 服务 (`src/services/knowledge-base/`)
- **knowledgeBaseService**: 知识库 CRUD、复制
- **knowledgeFileService**: 文件上传、URL 创建、手工创建、列表、删除、分块详情
- **knowledgeTagService**: 标签 CRUD
- **faqService**: FAQ 条目、搜索、批量更新
- **modelService**: 模型列表
- **initializationService**: 知识库配置更新 (updateKBConfig)

### 2. 类型定义 (`src/types/knowledge-base.ts`)
- KnowledgeBase, KnowledgeFile, KnowledgeTag
- CreateKnowledgeBaseParams, FAQEntryFieldsBatchRequest 等

### 3. 页面与组件
- **KnowledgeBasePage**: 知识库列表 + 详情、创建/编辑弹窗、删除确认
- **KnowledgeBaseDetailView**: 知识库详情（文档列表 / FAQ 管理）
- **KnowledgeBaseEditorModal**: 创建/编辑知识库（基本信息、模型、分块、FAQ 配置）
- **KBModelConfig**: 模型选择（LLM、Embedding）
- **KBChunkingSettings**: 分块设置（块大小、重叠、分隔符）
- **ModelSelector**: 模型选择器
- **ManualKnowledgeEditor**: 手工知识创建/编辑
- **DocContentViewer**: 文档分块内容预览
- **FAQEntryManager**: FAQ 条目列表与搜索

### 4. 代理配置 (vite.config.ts)
- 新增 `VITE_RAG_BACKEND_URL`，默认 `http://localhost:8081`
- 代理 `/api/v1` 到 RAG 后端（须在 `/api` 之前匹配）

## 环境变量

在 `.env.local` 中可配置：

```bash
# RAG 知识库后端（开发环境）
VITE_RAG_BACKEND_URL_DEVELOPMENT=http://localhost:8081

# RAG 知识库后端（生产环境）
VITE_RAG_BACKEND_URL_PRODUCTION=https://your-rag-backend.example.com
```

## 认证说明

- keeper-one-web 使用 MeterSphere 鉴权（X-AUTH-TOKEN / CSRF-TOKEN）
- aegis-rag-frontend 使用 Bearer Token（aegis-rag_token）
- 若 RAG 后端与 MeterSphere 分离，需在后端或网关统一鉴权

## 已实现功能

- [x] 创建/编辑知识库弹窗
- [x] 知识库设置（模型、分块、FAQ 配置）
- [x] FAQ 类型知识库的条目列表与搜索
- [x] 文档内容预览（分块展示）
- [x] 手工知识创建
- [x] 文件上传、删除

## 待完善功能

- [ ] FAQ 条目新增/编辑/删除
- [ ] 知识库标签管理
- [ ] 图谱设置、高级设置（多模态、问题生成）
- [ ] 上传进度展示
