/**
 * 知识库高级设置组件
 * 从 aegis-rag-frontend KBAdvancedSettings.vue 迁移
 */

import { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ModelSelector } from './ModelSelector';
import { type ModelConfig } from '@/services/knowledge-base';

export interface MultimodalConfig {
  enabled: boolean;
  storageType?: 'minio' | 'cos' | 's3';
  vllmModelId?: string;
  minio: {
    bucketName: string;
    useSSL: boolean;
    pathPrefix: string;
  };
  cos: {
    secretId: string;
    secretKey: string;
    region: string;
    bucketName: string;
    appId: string;
    pathPrefix: string;
  };
  s3: {
    bucketName: string;
    useSSL: boolean;
    pathPrefix: string;
  };
}

export interface QuestionGenerationConfig {
  enabled: boolean;
  questionCount: number;
}

interface KBAdvancedSettingsProps {
  multimodal: MultimodalConfig;
  questionGeneration?: QuestionGenerationConfig;
  allModels?: ModelConfig[];
  onMultimodalChange: (config: MultimodalConfig) => void;
  onQuestionGenerationChange: (config: QuestionGenerationConfig) => void;
  onAddModel?: () => void;
}

export function KBAdvancedSettings({
  multimodal,
  questionGeneration = { enabled: false, questionCount: 3 },
  allModels = [],
  onMultimodalChange,
  onQuestionGenerationChange,
  onAddModel,
}: KBAdvancedSettingsProps) {
  const [localMultimodal, setLocalMultimodal] = useState<MultimodalConfig>(multimodal);
  const [localQuestionGeneration, setLocalQuestionGeneration] =
    useState<QuestionGenerationConfig>(questionGeneration);

  // 监听 props 变化（使用 useRef 跟踪上次值，避免循环更新）
  const prevMultimodalRef = useRef<MultimodalConfig>(multimodal);
  const prevQuestionGenRef = useRef<QuestionGenerationConfig>(questionGeneration);

  useEffect(() => {
    // 只在 props 真正变化时更新（排除用户操作导致的更新）
    if (JSON.stringify(multimodal) !== JSON.stringify(prevMultimodalRef.current)) {
      prevMultimodalRef.current = multimodal;
      setLocalMultimodal(multimodal);
    }
  }, [multimodal]);

  useEffect(() => {
    // 只在 props 真正变化时更新（排除用户操作导致的更新）
    if (JSON.stringify(questionGeneration) !== JSON.stringify(prevQuestionGenRef.current)) {
      prevQuestionGenRef.current = questionGeneration;
      setLocalQuestionGeneration(questionGeneration);
    }
  }, [questionGeneration]);

  // 处理多模态配置变更
  const handleMultimodalChange = (updates: Partial<MultimodalConfig>) => {
    const updated = { ...localMultimodal, ...updates };
    setLocalMultimodal(updated);
    onMultimodalChange(updated);
  };

  // 处理问题生成配置变更
  const handleQuestionGenerationChange = (updates: Partial<QuestionGenerationConfig>) => {
    const updated = { ...localQuestionGeneration, ...updates };
    setLocalQuestionGeneration(updated);
    onQuestionGenerationChange(updated);
  };

  // 处理多模态开关
  const handleMultimodalToggle = (enabled: boolean) => {
    if (!enabled) {
      handleMultimodalChange({
        enabled: false,
        vllmModelId: '',
        s3: { bucketName: '', useSSL: true, pathPrefix: '' },
      });
    } else {
      handleMultimodalChange({ enabled: true });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">高级设置</h3>
        <p className="text-sm text-muted-foreground mb-6">
          配置知识库的高级功能，包括问题生成和多模态能力
        </p>
      </div>

      {/* 问题生成 */}
      <div className="space-y-4 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-base font-semibold">问题生成</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              自动为文档生成相关问题，提高检索命中率
            </p>
          </div>
          <Switch
            checked={localQuestionGeneration.enabled}
            onCheckedChange={(enabled) => {
              handleQuestionGenerationChange({
                enabled,
                questionCount: enabled ? localQuestionGeneration.questionCount : 3,
              });
            }}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        {localQuestionGeneration.enabled && (
          <div className="pl-4 border-l-2 border-primary/20 mt-2">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap w-24">生成数量</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localQuestionGeneration.questionCount}
                onChange={(e) => {
                  handleQuestionGenerationChange({
                    enabled: localQuestionGeneration.enabled,
                    questionCount: parseInt(e.target.value) || 3,
                  });
                }}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">建议 3-5 个</span>
            </div>
          </div>
        )}
      </div>

      {/* 多模态能力 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-base font-semibold">多模态能力</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              支持图片等非文本内容的理解和检索
            </p>
          </div>
          <Switch
            checked={localMultimodal.enabled}
            onCheckedChange={handleMultimodalToggle}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {localMultimodal.enabled && (
          <div className="pl-4 border-l-2 border-primary/20 space-y-4 mt-2">
            {/* VLLM 模型 */}
            <div className="space-y-1.5">
              <Label>
                VLLM 模型 <span className="text-red-500">*</span>
              </Label>
              <ModelSelector
                modelType="VLLM"
                selectedModelId={localMultimodal.vllmModelId}
                allModels={allModels}
                onSelectedModelIdChange={(v) => handleMultimodalChange({ vllmModelId: v })}
                onAddModel={onAddModel}
                placeholder="选择多模态模型"
              />
            </div>

            {/* S3 存储配置 */}
              <div className="space-y-3 bg-muted/30 p-3 rounded-md">
                <Alert className="py-2 mb-2">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-xs">自动配置凭证</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    系统会自动读取全局设置中的 S3 环境变量作为连接凭证 (Endpoint / AccessKey 等)。您只需在此指定独立存储桶即可（如留空则使用全局默认存储桶）。
                  </AlertDescription>
                </Alert>

                <div className="space-y-1.5">
                  <Label>存储桶 (Bucket_Name)</Label>
                  <Input
                    value={localMultimodal.s3.bucketName}
                    onChange={(e) =>
                      handleMultimodalChange({
                        s3: { ...localMultimodal.s3, bucketName: e.target.value },
                      })
                    }
                    placeholder="选填（为空时读取全局默认 Bucket）"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>使用 SSL</Label>
                  <Switch
                    checked={localMultimodal.s3.useSSL}
                    onCheckedChange={(v) =>
                      handleMultimodalChange({
                        s3: { ...localMultimodal.s3, useSSL: v },
                      })
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>路径前缀</Label>
                  <Input
                    value={localMultimodal.s3.pathPrefix}
                    onChange={(e) =>
                      handleMultimodalChange({
                        s3: { ...localMultimodal.s3, pathPrefix: e.target.value },
                      })
                    }
                    placeholder="e.g. uploads/"
                  />
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
