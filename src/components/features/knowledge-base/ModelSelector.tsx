/**
 * 模型选择器
 * 从 aegis-rag-frontend ModelSelector.vue 迁移
 */

import { useEffect, useState } from 'react';
import { modelService, type ModelConfig } from '@/services/knowledge-base';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  modelType: 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM';
  selectedModelId?: string;
  allModels?: ModelConfig[];
  disabled?: boolean;
  placeholder?: string;
  onSelectedModelIdChange: (value: string) => void;
  onAddModel?: () => void;
}

export function ModelSelector({
  modelType,
  selectedModelId,
  allModels,
  disabled,
  placeholder = '选择模型',
  onSelectedModelIdChange,
  onAddModel,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (allModels && Array.isArray(allModels)) {
      setModels(allModels.filter((m) => m.type === modelType));
      return;
    }
    setLoading(true);
    modelService
      .listModels()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setModels(list.filter((m: ModelConfig) => m.type === modelType));
      })
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [modelType, allModels]);

  const handleChange = (value: string) => {
    if (value === '__add_model__') {
      onAddModel?.();
      return;
    }
    onSelectedModelIdChange(value);
  };

  return (
    <Select value={selectedModelId || ''} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? '加载中...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {models.map((m) => (
          <SelectItem key={m.id!} value={m.id!}>
            <div className="flex items-center gap-2">
              <span>{m.name}</span>
              {m.is_builtin && <Badge variant="secondary">内置</Badge>}
              {m.is_default && <Badge variant="default">默认</Badge>}
            </div>
          </SelectItem>
        ))}
        {!disabled && onAddModel && (
          <SelectItem value="__add_model__" className="text-primary">
            去设置中添加模型
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
