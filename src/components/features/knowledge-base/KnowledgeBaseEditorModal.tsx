/**
 * 知识库创建/编辑弹窗
 * 从 aegis-rag-frontend KnowledgeBaseEditorModal.vue 迁移
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, Cpu, FileText, HelpCircle, Layers, Settings, RefreshCw, Network } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  knowledgeBaseService,
  knowledgeFileService,
  modelService,
  initializationService,
} from '@/services/knowledge-base';
import type { ModelConfig } from '@/services/knowledge-base';
import { KBModelConfig } from './KBModelConfig';
import { KBChunkingSettings, type ChunkingConfig } from './KBChunkingSettings';
import { KBAdvancedSettings, type MultimodalConfig, type QuestionGenerationConfig } from './KBAdvancedSettings';
import { GraphSettings, type GraphExtractConfig } from './GraphSettings';
import { ModelSelector } from './ModelSelector';
import { toast } from 'sonner';

type KBMode = 'create' | 'edit';
type KBType = 'document' | 'faq';

interface FormData {
  type: KBType;
  name: string;
  description: string;
  faqConfig: { indexMode: string; questionIndexMode: string };
  modelConfig: { llmModelId: string; embeddingModelId: string };
  chunkingConfig: ChunkingConfig;
  // Advanced
  questionGeneration: QuestionGenerationConfig;
  multimodal: MultimodalConfig;
  graphExtract: GraphExtractConfig;
}

const DEFAULT_CHUNKING: ChunkingConfig = {
  chunkSize: 512,
  chunkOverlap: 100,
  separators: ['\n\n', '\n', '。', '！', '？', ';', '；'],
};

const DEFAULT_MULTIMODAL: MultimodalConfig = {
  enabled: false,
  storageType: 'minio',
  vllmModelId: '',
  minio: { bucketName: '', useSSL: false, pathPrefix: '' },
  cos: { secretId: '', secretKey: '', region: '', bucketName: '', appId: '', pathPrefix: '' },
  s3: { bucketName: '', useSSL: true, pathPrefix: '' },
};

const NAV_ITEMS = [
  { key: 'basic', icon: Info, label: '基本信息' },
  { key: 'models', icon: Cpu, label: '模型配置' },
  { key: 'faq', icon: HelpCircle, label: 'FAQ 配置' },
  { key: 'chunking', icon: FileText, label: '分块设置' },
  { key: 'graph', icon: Network, label: '图谱设置' },
  { key: 'advanced', icon: Settings, label: '高级设置' },
];

interface KnowledgeBaseEditorModalProps {
  open: boolean;
  mode: KBMode;
  kbId?: string;
  initialType?: KBType;
  onOpenChange: (open: boolean) => void;
  onSuccess: (kbId: string) => void;
}

export function KnowledgeBaseEditorModal({
  open,
  mode,
  kbId,
  initialType = 'document',
  onOpenChange,
  onSuccess,
}: KnowledgeBaseEditorModalProps) {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('basic');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [allModels, setAllModels] = useState<ModelConfig[]>([]);
  const [hasFiles, setHasFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isFAQ = formData?.type === 'faq';

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'faq' && !isFAQ) return false;
    if (item.key === 'chunking' && isFAQ) return false;
    if (item.key === 'graph' && isFAQ) return false;
    if (item.key === 'advanced' && isFAQ) return false;
    return true;
  });

  const loadModels = useCallback(async () => {
    try {
      const res = await modelService.listModels();
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setAllModels(list);
    } catch {
      setAllModels([]);
      toast.error('加载模型列表失败');
    }
  }, []);

  const loadKBData = useCallback(async () => {
    if (mode !== 'edit' || !kbId) return;
    setLoading(true);
    try {
      const [kbRes, filesRes] = await Promise.all([
        knowledgeBaseService.getKnowledgeBaseById(kbId),
        knowledgeFileService.listKnowledgeFiles(kbId, { page: 1, page_size: 1 }),
      ]);
      const kb = (kbRes as any)?.data ?? kbRes;
      const filesTotal = (filesRes as any)?.total ?? 0;
      setHasFiles(filesTotal > 0);

      const kbType = (kb.type as KBType) || 'document';

      // Parse advanced config from backend response
      const qGenConfig = kb.question_generation_config ?? kb.question_generation ?? kb.questionGeneration ?? null;
      const vlmConfig = kb.vlm_config ?? null;
      const multimodalEnabled = vlmConfig?.enabled === true;
      const storageObj = kb.storage_config || kb.storageConfig || {};
      const cosConfig = kb.cos_config ?? null;

      const hasCosConfig = cosConfig && (
        cosConfig.secret_id || cosConfig.secret_key || cosConfig.region ||
        cosConfig.bucket_name || cosConfig.app_id || cosConfig.path_prefix
      );

      const hasS3Config = storageObj.provider === 's3';

      let storageType: 'minio' | 'cos' | 's3' = 'minio';
      if (hasS3Config) {
        storageType = 's3';
      } else if (hasCosConfig) {
        storageType = 'cos';
      }

      setFormData({
        type: kbType,
        name: kb.name || '',
        description: kb.description || '',
        faqConfig: {
          indexMode: kb.faq_config?.index_mode || 'question_only',
          questionIndexMode: kb.faq_config?.question_index_mode || 'separate',
        },
        modelConfig: {
          llmModelId: kb.summary_model_id || '',
          embeddingModelId: kb.embedding_model_id || '',
        },
        chunkingConfig: {
          chunkSize: kb.chunking_config?.chunk_size ?? 512,
          chunkOverlap: kb.chunking_config?.chunk_overlap ?? 100,
          separators: kb.chunking_config?.separators ?? DEFAULT_CHUNKING.separators,
        },
        questionGeneration: {
          enabled: qGenConfig?.enabled ?? false,
          questionCount: qGenConfig?.question_count ?? qGenConfig?.questionCount ?? 3
        },
        multimodal: {
          enabled: multimodalEnabled,
          storageType: storageType, // Compute correctly
          vllmModelId: vlmConfig?.model_id ?? '',
          minio: { ...DEFAULT_MULTIMODAL.minio },
          cos: {
            secretId: cosConfig?.secret_id ?? '',
            secretKey: cosConfig?.secret_key ?? '',
            region: cosConfig?.region ?? '',
            bucketName: cosConfig?.bucket_name ?? '',
            appId: cosConfig?.app_id ?? '',
            pathPrefix: cosConfig?.path_prefix ?? '',
          },
          s3: {
            bucketName: storageType === 's3' ? (storageObj.bucket_name || storageObj.bucketName || '') : '',
            useSSL: storageType === 's3' ? (storageObj.use_ssl ?? storageObj.useSSL ?? true) : true,
            pathPrefix: storageType === 's3' ? (storageObj.path_prefix || storageObj.pathPrefix || '') : '',
          },
        },
        graphExtract: {
          enabled: kb.extract_config?.enabled ?? false,
          text: kb.extract_config?.text ?? '',
          tags: kb.extract_config?.tags ?? [],
          nodes: kb.extract_config?.nodes ?? [],
          relations: kb.extract_config?.relations ?? [],
        },
      });
    } catch (e: any) {
      toast.error(e?.message || '加载知识库数据失败');
    } finally {
      setLoading(false);
    }
  }, [mode, kbId]);

  const initFormData = useCallback(() => {
    return {
      type: initialType,
      name: '',
      description: '',
      faqConfig: { indexMode: 'question_only', questionIndexMode: 'separate' },
      modelConfig: { llmModelId: '', embeddingModelId: '' },
      chunkingConfig: DEFAULT_CHUNKING,
      questionGeneration: { enabled: false, questionCount: 3 },
      multimodal: DEFAULT_MULTIMODAL,
      graphExtract: {
        enabled: false,
        text: '',
        tags: [],
        nodes: [],
        relations: [],
      },
    };
  }, [initialType]);

  useEffect(() => {
    if (!open) return;
    loadModels();
    if (mode === 'edit' && kbId) {
      loadKBData();
    } else {
      setFormData(initFormData());
      setHasFiles(false);
    }
  }, [open, mode, kbId, loadModels, loadKBData, initFormData]);

  const handleSubmit = async () => {
    if (!formData) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('请输入知识库名称');
      setCurrentSection('basic');
      return;
    }
    if (!formData.modelConfig.embeddingModelId) {
      toast.error('请选择嵌入模型');
      setCurrentSection('models');
      return;
    }
    if (!formData.modelConfig.llmModelId) {
      toast.error('请选择大语言模型');
      setCurrentSection('models');
      return;
    }

    setSaving(true);
    try {
      const data: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        embedding_model_id: formData.modelConfig.embeddingModelId,
        summary_model_id: formData.modelConfig.llmModelId,
        chunking_config: {
          chunk_size: formData.chunkingConfig.chunkSize,
          chunk_overlap: formData.chunkingConfig.chunkOverlap,
          separators: formData.chunkingConfig.separators,
        },
        // Advanced config
        question_generation: {
          enabled: formData.questionGeneration.enabled,
          question_count: formData.questionGeneration.questionCount
        },
        multimodal: {
          enabled: formData.multimodal.enabled,
          vllm_model_id: formData.multimodal.vllmModelId,
          s3: formData.multimodal.enabled ? {
            bucketName: formData.multimodal.s3.bucketName,
            useSSL: formData.multimodal.s3.useSSL,
            pathPrefix: formData.multimodal.s3.pathPrefix,
          } : undefined,
        },
      };

      if (formData.type === 'faq') {
        data.faq_config = {
          index_mode: formData.faqConfig.indexMode,
          question_index_mode: formData.faqConfig.questionIndexMode,
        };
      }

      if (mode === 'create') {
        const res = await knowledgeBaseService.createKnowledgeBase(data);
        const id = (res as any)?.data?.id ?? (res as any)?.id;
        if (id) {
          // Also update advanced config via initializationService for consistency
          try {
            const configData: any = {
              llmModelId: data.summary_model_id,
              embeddingModelId: data.embedding_model_id,
              documentSplitting: {
                chunkSize: data.chunking_config.chunk_size,
                chunkOverlap: data.chunking_config.chunk_overlap,
                separators: data.chunking_config.separators,
              },
              questionGeneration: {
                enabled: data.question_generation.enabled,
                questionCount: data.question_generation.question_count
              },
              multimodal: {
                enabled: data.multimodal.enabled,
                s3: data.multimodal.s3,
              },
              nodeExtract: {
                enabled: formData.graphExtract.enabled,
                text: formData.graphExtract.text,
                tags: formData.graphExtract.tags,
                nodes: formData.graphExtract.nodes,
                relations: formData.graphExtract.relations,
              },
            };

            // Add vlm_config if multimodal is enabled
            if (data.multimodal.enabled && data.multimodal.vllm_model_id) {
              configData.vlm_config = {
                enabled: true,
                model_id: data.multimodal.vllm_model_id,
              };
            }

            await initializationService.updateKBConfig(id, configData);
          } catch (e: any) {
            console.warn('Failed to update advanced config:', e);
            // Don't fail the whole operation if advanced config update fails
          }
          toast.success('创建成功');
          onSuccess(id);
          onOpenChange(false);
        } else {
          throw new Error('创建失败');
        }
      } else {
        if (!kbId) throw new Error('缺少知识库 ID');
        await knowledgeBaseService.updateKnowledgeBase(kbId, {
          name: data.name,
          description: data.description,
          config: formData.type === 'faq' ? data.faq_config : {},
        });

        // Use initializationService to update full config including advanced settings
        const configData: any = {
          llmModelId: data.summary_model_id,
          embeddingModelId: data.embedding_model_id,
          documentSplitting: {
            chunkSize: data.chunking_config.chunk_size,
            chunkOverlap: data.chunking_config.chunk_overlap,
            separators: data.chunking_config.separators,
          },
          questionGeneration: {
            enabled: formData.questionGeneration?.enabled ?? false,
            questionCount: formData.questionGeneration?.questionCount ?? 3
          },
          multimodal: {
            enabled: formData.multimodal?.enabled ?? false,
            storageType: formData.multimodal?.storageType,
            vllmModelId: formData.multimodal?.vllmModelId,
            minio: formData.multimodal?.enabled && formData.multimodal?.storageType === 'minio' ? {
              bucketName: formData.multimodal.minio.bucketName,
              useSSL: formData.multimodal.minio.useSSL,
              pathPrefix: formData.multimodal.minio.pathPrefix,
            } : undefined,
            cos: formData.multimodal?.enabled && formData.multimodal?.storageType === 'cos' ? {
              secretId: formData.multimodal.cos.secretId,
              secretKey: formData.multimodal.cos.secretKey,
              region: formData.multimodal.cos.region,
              bucketName: formData.multimodal.cos.bucketName,
              appId: formData.multimodal.cos.appId,
              pathPrefix: formData.multimodal.cos.pathPrefix,
            } : undefined,
            s3: formData.multimodal?.enabled && formData.multimodal?.storageType === 's3' ? {
              bucketName: formData.multimodal.s3.bucketName,
              useSSL: formData.multimodal.s3.useSSL,
              pathPrefix: formData.multimodal.s3.pathPrefix,
            } : undefined,
          },
          nodeExtract: {
            enabled: formData.graphExtract?.enabled ?? false,
            text: formData.graphExtract?.text ?? '',
            tags: formData.graphExtract?.tags ?? [],
            nodes: formData.graphExtract?.nodes ?? [],
            relations: formData.graphExtract?.relations ?? [],
          },
        };

        // Add vlm_config if multimodal is enabled
        if (formData.multimodal?.enabled && formData.multimodal?.vllmModelId) {
          configData.vlm_config = {
            enabled: true,
            model_id: formData.multimodal.vllmModelId,
          };
        }

        console.log('Updating KB config:', JSON.stringify(configData, null, 2));
        try {
          await initializationService.updateKBConfig(kbId, configData);
          console.log('KB config updated successfully');
        } catch (configError: any) {
          console.error('Failed to update KB config:', configError);
          throw new Error(`更新高级配置失败: ${configError?.message || '未知错误'}`);
        }

        toast.success('更新成功');
        onSuccess(kbId);
        onOpenChange(false);
      }
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[900px] !max-w-[900px] sm:!max-w-[800px] h-[600px] max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>
            {mode === 'create' ? '创建知识库' : '编辑知识库'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧导航 */}
          <aside className="w-48 shrink-0 border-r border-gray-200 pr-6 pl-4 pt-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentSection(item.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${currentSection === item.key
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* 右侧内容 */}
          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4">
            {loading ? (
              <div className="py-12 text-center text-gray-500">加载中...</div>
            ) : (
              <div className="space-y-6 pb-6">
                {currentSection === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <Label>类型</Label>
                      <RadioGroup
                        value={formData.type}
                        onValueChange={(v) => setFormData({ ...formData, type: v as KBType })}
                        className="flex gap-4 mt-2"
                        disabled={mode === 'edit'}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value="document"
                            id="type-doc"
                            className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                          />
                          <Label htmlFor="type-doc" className="cursor-pointer font-normal">文档知识库</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value="faq"
                            id="type-faq"
                            className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                          />
                          <Label htmlFor="type-faq" className="cursor-pointer font-normal">FAQ 问答</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label>名称 <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="请输入知识库名称"
                        maxLength={50}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>描述</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="请输入描述"
                        rows={3}
                        maxLength={200}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {currentSection === 'models' && (
                  <KBModelConfig
                    config={formData.modelConfig}
                    hasFiles={hasFiles}
                    allModels={allModels}
                    onConfigChange={(c) =>
                      setFormData({
                        ...formData,
                        modelConfig: {
                          llmModelId: c.llmModelId || '',
                          embeddingModelId: c.embeddingModelId || '',
                        },
                      })
                    }
                    onAddModel={() => {
                      onOpenChange(false);
                      navigate('/?menu=aegis-agent&tab=agent-settings');
                    }}
                  />
                )}

                {currentSection === 'faq' && isFAQ && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">FAQ 设置</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        配置 FAQ 知识库的索引和检索方式
                      </p>
                    </div>

                    <div className="space-y-4 pb-4 border-b">
                      <div>
                        <Label className="text-base font-semibold mb-1 block">索引模式</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          选择索引的内容范围，影响检索的准确性
                        </p>
                        <RadioGroup
                          value={formData.faqConfig.indexMode}
                          onValueChange={(v) =>
                            setFormData({
                              ...formData,
                              faqConfig: { ...formData.faqConfig, indexMode: v },
                            })
                          }
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value="question_only"
                              id="index-q"
                              className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                            />
                            <Label htmlFor="index-q" className="font-normal cursor-pointer">仅问题</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value="question_answer"
                              id="index-qa"
                              className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                            />
                            <Label htmlFor="index-qa" className="font-normal cursor-pointer">问题+答案</Label>
                          </div>
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formData.faqConfig.indexMode === 'question_only'
                            ? '仅对问题进行索引，检索时只匹配问题内容，响应速度快'
                            : '对问题和答案都进行索引，检索时同时匹配问题和答案，准确性更高'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold mb-1 block">问题索引模式</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          选择标准问题和相似问题的索引方式
                        </p>
                        <RadioGroup
                          value={formData.faqConfig.questionIndexMode}
                          onValueChange={(v) =>
                            setFormData({
                              ...formData,
                              faqConfig: { ...formData.faqConfig, questionIndexMode: v },
                            })
                          }
                          className="flex gap-4 mt-2"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value="combined"
                              id="q-combined"
                              className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                            />
                            <Label htmlFor="q-combined" className="font-normal cursor-pointer">合并</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem
                              value="separate"
                              id="q-separate"
                              className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                            />
                            <Label htmlFor="q-separate" className="font-normal cursor-pointer">分离</Label>
                          </div>
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formData.faqConfig.questionIndexMode === 'combined'
                            ? '将标准问题和相似问题合并为一个索引，检索效率更高'
                            : '将标准问题和相似问题分别索引，可以更精确地匹配问题类型'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentSection === 'chunking' && !isFAQ && (
                  <KBChunkingSettings
                    config={formData.chunkingConfig}
                    onChange={(c) => setFormData({ ...formData, chunkingConfig: c })}
                  />
                )}

                {currentSection === 'graph' && !isFAQ && (
                  <GraphSettings
                    graphExtract={formData.graphExtract}
                    allModels={allModels}
                    onGraphExtractChange={(c) => setFormData({ ...formData, graphExtract: c })}
                  />
                )}

                {currentSection === 'advanced' && !isFAQ && (
                  <KBAdvancedSettings
                    multimodal={formData.multimodal}
                    questionGeneration={formData.questionGeneration}
                    allModels={allModels}
                    onMultimodalChange={(c) => {
                      setFormData(prev => prev ? { ...prev, multimodal: c } : null);
                    }}
                    onQuestionGenerationChange={(c) => {
                      setFormData(prev => prev ? { ...prev, questionGeneration: c } : null);
                    }}
                    onAddModel={() => {
                      onOpenChange(false);
                      navigate('/?menu=aegis-agent&tab=agent-settings');
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? '保存中...' : mode === 'create' ? '创建' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
