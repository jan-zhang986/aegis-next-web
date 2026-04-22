/**
 * 知识库模型配置
 * 从 aegis-rag-frontend KBModelConfig.vue 迁移
 */

import { ModelSelector } from './ModelSelector';
import type { ModelConfig } from '@/services/knowledge-base';

interface ModelConfigForm {
  llmModelId?: string;
  embeddingModelId?: string;
}

interface KBModelConfigProps {
  config: ModelConfigForm;
  hasFiles: boolean;
  allModels?: ModelConfig[];
  onConfigChange: (config: ModelConfigForm) => void;
  onAddModel?: (section: string) => void;
}

export function KBModelConfig({
  config,
  hasFiles,
  allModels,
  onConfigChange,
  onAddModel,
}: KBModelConfigProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-1">模型配置</h3>
        <p className="text-sm text-gray-500">配置大语言模型与嵌入模型</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            大语言模型 (LLM) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">用于摘要与问答</p>
          <ModelSelector
            modelType="KnowledgeQA"
            selectedModelId={config.llmModelId}
            allModels={allModels}
            placeholder="选择 LLM 模型"
            onSelectedModelIdChange={(id) => onConfigChange({ ...config, llmModelId: id })}
            onAddModel={() => onAddModel?.('chat')}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            嵌入模型 (Embedding) <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">用于文档向量化</p>
          {hasFiles && (
            <p className="text-xs text-amber-600 mb-2">已有文档时不可更改嵌入模型</p>
          )}
          <ModelSelector
            modelType="Embedding"
            selectedModelId={config.embeddingModelId}
            allModels={allModels}
            disabled={hasFiles}
            placeholder="选择 Embedding 模型"
            onSelectedModelIdChange={(id) => onConfigChange({ ...config, embeddingModelId: id })}
            onAddModel={() => onAddModel?.('embedding')}
          />
        </div>
      </div>
    </div>
  );
}
