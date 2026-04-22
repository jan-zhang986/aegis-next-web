/**
 * 知识图谱设置组件
 * 从 aegis-rag-frontend GraphSettings.vue 迁移
 */

import { useState, useEffect, useCallback } from 'react';
import { User, X, Plus, ArrowRight, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  initializationService,
  modelService,
  type Node,
  type Relation,
  type LLMConfig,
  type ModelConfig,
} from '@/services/knowledge-base';
import { systemService } from '@/services/system';
import { toast } from 'sonner';

export interface GraphExtractConfig {
  enabled: boolean;
  text: string;
  tags: string[];
  nodes: Node[];
  relations: Relation[];
}

interface GraphSettingsProps {
  graphExtract: GraphExtractConfig;
  allModels?: ModelConfig[];
  onGraphExtractChange: (config: GraphExtractConfig) => void;
}

const DEFAULT_EXAMPLE_TEXT = `《红楼梦》，又名《石头记》，是清代作家曹雪芹创作的中国古典四大名著之一，被誉为中国封建社会的百科全书。该书前80回由曹雪芹所著，后40回一般认为是高鹗所续。小说以贾、史、王、薛四大家族的兴衰为背景，以贾宝玉、林黛玉和薛宝钗的爱情悲剧为主线，刻画了以贾宝玉和金陵十二钗为中心的正邪两赋、贤愚并出的高度复杂的人物群像。成书于乾隆年间（1743年前后），是中国文学史上现实主义的高峰，对后世影响深远。`;

const DEFAULT_EXAMPLE_TAGS = ['作者', '别名'];

const DEFAULT_EXAMPLE_NODES: Node[] = [
  { name: '红楼梦', attributes: ['中国古典四大名著之一', '又名《石头记》', '被誉为中国封建社会的百科全书'] },
  { name: '石头记', attributes: ['《红楼梦》的别名'] },
  { name: '曹雪芹', attributes: ['清代作家', '《红楼梦》前 80 回的作者'] },
  { name: '高鹗', attributes: ['一般认为是《红楼梦》后 40 回的续写者'] },
];

const DEFAULT_EXAMPLE_RELATIONS: Relation[] = [
  { node1: '红楼梦', node2: '石头记', type: '别名' },
  { node1: '红楼梦', node2: '曹雪芹', type: '作者' },
  { node1: '红楼梦', node2: '高鹗', type: '作者' },
];

export function GraphSettings({
  graphExtract,
  allModels = [],
  onGraphExtractChange,
}: GraphSettingsProps) {
  const [localGraphExtract, setLocalGraphExtract] = useState<GraphExtractConfig>(graphExtract);
  const [tagFabring, setTagFabring] = useState(false);
  const [textFabring, setTextFabring] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [isGraphDatabaseEnabled, setIsGraphDatabaseEnabled] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(null);

  // 加载系统信息和模型状态
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载系统信息
        const systemRes = await systemService.getSystemInfo();
        const systemInfo = (systemRes as any)?.data ?? systemRes;
        setIsGraphDatabaseEnabled(
          systemInfo?.graph_database_engine && systemInfo.graph_database_engine !== '未启用'
        );

        // 加载 LLM 模型配置
        const models = allModels.length > 0 ? allModels : await modelService.listModels();
        const modelList = Array.isArray(models) ? models : (models as any)?.data ?? [];
        const llmModels = modelList.filter((m: ModelConfig) => m.type === 'KnowledgeQA');

        if (llmModels.length > 0) {
          const llmModel = llmModels[0];
          setLlmConfig({
            source: (llmModel.source as 'local' | 'remote') || 'remote',
            model_name: llmModel.name,
            base_url: llmModel.parameters?.base_url || '',
            api_key: llmModel.parameters?.api_key || '',
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [allModels]);

  // 监听 props 变化
  useEffect(() => {
    setLocalGraphExtract(graphExtract);
  }, [graphExtract]);

  // 处理配置变更
  const handleConfigChange = useCallback(() => {
    onGraphExtractChange(localGraphExtract);
  }, [localGraphExtract, onGraphExtractChange]);

  // 处理启用/禁用切换
  const handleEnabledChange = (enabled: boolean) => {
    if (!enabled) {
      setLocalGraphExtract({
        enabled: false,
        text: '',
        tags: [],
        nodes: [],
        relations: [],
      });
      handleConfigChange();
    } else {
      setLocalGraphExtract({ ...localGraphExtract, enabled: true });
      handleConfigChange();
    }
  };

  // 节点操作
  const addNode = () => {
    const updated = {
      ...localGraphExtract,
      nodes: [...localGraphExtract.nodes, { name: '', attributes: [] }],
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const removeNode = (index: number) => {
    const updated = {
      ...localGraphExtract,
      nodes: localGraphExtract.nodes.filter((_, i) => i !== index),
      relations: localGraphExtract.relations.filter(
        (r) => r.node1 !== localGraphExtract.nodes[index].name && r.node2 !== localGraphExtract.nodes[index].name
      ),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const addAttribute = (nodeIndex: number) => {
    const updated = {
      ...localGraphExtract,
      nodes: localGraphExtract.nodes.map((node, i) =>
        i === nodeIndex ? { ...node, attributes: [...node.attributes, ''] } : node
      ),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const removeAttribute = (nodeIndex: number, attrIndex: number) => {
    const updated = {
      ...localGraphExtract,
      nodes: localGraphExtract.nodes.map((node, i) =>
        i === nodeIndex
          ? { ...node, attributes: node.attributes.filter((_, j) => j !== attrIndex) }
          : node
      ),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const updateNodeName = (nodeIndex: number, name: string) => {
    const updated = {
      ...localGraphExtract,
      nodes: localGraphExtract.nodes.map((node, i) => (i === nodeIndex ? { ...node, name } : node)),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const updateAttribute = (nodeIndex: number, attrIndex: number, value: string) => {
    const updated = {
      ...localGraphExtract,
      nodes: localGraphExtract.nodes.map((node, i) =>
        i === nodeIndex
          ? {
              ...node,
              attributes: node.attributes.map((attr, j) => (j === attrIndex ? value : attr)),
            }
          : node
      ),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  // 关系操作
  const addRelation = () => {
    const updated = {
      ...localGraphExtract,
      relations: [...localGraphExtract.relations, { node1: '', node2: '', type: '' }],
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const removeRelation = (index: number) => {
    const updated = {
      ...localGraphExtract,
      relations: localGraphExtract.relations.filter((_, i) => i !== index),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  const updateRelation = (index: number, field: 'node1' | 'node2' | 'type', value: string) => {
    const updated = {
      ...localGraphExtract,
      relations: localGraphExtract.relations.map((rel, i) =>
        i === index ? { ...rel, [field]: value } : rel
      ),
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
  };

  // 生成随机标签
  const handleFabriTag = async () => {
    if (!llmConfig) {
      toast.warning('请先完成模型配置');
      return;
    }

    setTagFabring(true);
    try {
      const response = await initializationService.fabriTag({ llm_config: llmConfig });
      const updated = { ...localGraphExtract, tags: response.tags || [] };
      setLocalGraphExtract(updated);
      onGraphExtractChange(updated);
      toast.success('标签生成成功');
    } catch (error: any) {
      console.error('Failed to generate tags:', error);
      toast.error(error?.message || '标签生成失败');
    } finally {
      setTagFabring(false);
    }
  };

  // 生成随机文本
  const handleFabriText = async () => {
    if (!llmConfig) {
      toast.warning('请先完成模型配置');
      return;
    }

    setTextFabring(true);
    try {
      const response = await initializationService.fabriText({
        tags: localGraphExtract.tags,
        llm_config: llmConfig,
      });
      const updated = { ...localGraphExtract, text: response.text || '' };
      setLocalGraphExtract(updated);
      onGraphExtractChange(updated);
      toast.success('文本生成成功');
    } catch (error: any) {
      console.error('Failed to generate text:', error);
      toast.error(error?.message || '文本生成失败');
    } finally {
      setTextFabring(false);
    }
  };

  // 提取实体关系
  const handleExtract = async () => {
    if (!llmConfig) {
      toast.warning('请先完成模型配置');
      return;
    }

    if (!localGraphExtract.text) {
      toast.warning('请输入示例文本');
      return;
    }

    setExtracting(true);
    try {
      const response = await initializationService.extractTextRelations({
        text: localGraphExtract.text,
        tags: localGraphExtract.tags,
        llm_config: llmConfig,
      });
      const updated = {
        ...localGraphExtract,
        nodes: response.nodes || [],
        relations: response.relations || [],
      };
      setLocalGraphExtract(updated);
      onGraphExtractChange(updated);
      toast.success('实体关系提取成功');
    } catch (error: any) {
      console.error('Failed to extract relations:', error);
      toast.error(error?.message || '实体关系提取失败');
    } finally {
      setExtracting(false);
    }
  };

  // 加载默认示例
  const defaultExtractExample = () => {
    const updated = {
      ...localGraphExtract,
      text: DEFAULT_EXAMPLE_TEXT,
      tags: DEFAULT_EXAMPLE_TAGS,
      nodes: DEFAULT_EXAMPLE_NODES,
      relations: DEFAULT_EXAMPLE_RELATIONS,
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
    toast.success('已加载示例数据');
  };

  // 清除示例
  const clearExtractExample = () => {
    const updated = {
      ...localGraphExtract,
      text: '',
      tags: [],
      nodes: [],
      relations: [],
    };
    setLocalGraphExtract(updated);
    onGraphExtractChange(updated);
    toast.success('已清除示例数据');
  };

  const graphGuideUrl =
    import.meta.env.VITE_KG_GUIDE_URL ||
    'https://github.com/aegisones/aegisrag/blob/main/docs/KnowledgeGraph.md';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">知识图谱设置</h3>
        <p className="text-sm text-muted-foreground mb-6">
          配置实体关系提取功能，从文档中提取结构化知识图谱
        </p>
        {!isGraphDatabaseEnabled && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>图数据库未启用</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              <span>请先启用图数据库才能使用知识图谱功能。</span>
              <a
                href={graphGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                查看启用指南
                <ExternalLink className="w-3 h-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {isGraphDatabaseEnabled && (
        <div className="space-y-6">
          {/* 启用开关 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex-1">
              <Label className="text-base font-semibold">启用实体关系提取</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                从文档中提取实体和关系，构建知识图谱
              </p>
            </div>
            <Switch
              checked={localGraphExtract.enabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>

          {localGraphExtract.enabled && (
            <>
              {/* 关系类型配置 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>关系类型标签</Label>
                  {!llmConfig && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      请先完成模型配置
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!llmConfig}
                    onClick={handleFabriTag}
                  >
                    {tagFabring ? '生成中...' : '生成随机标签'}
                  </Button>
                  <Input
                    value={localGraphExtract.tags.join(',')}
                    onChange={(e) => {
                      const value = e.target.value;
                      const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
                      const updated = { ...localGraphExtract, tags };
                      setLocalGraphExtract(updated);
                      onGraphExtractChange(updated);
                    }}
                    placeholder="输入标签（多个用逗号分隔）"
                    className="flex-1"
                  />
                </div>
                {localGraphExtract.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {localGraphExtract.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const tags = localGraphExtract.tags.filter((_, i) => i !== index);
                            const updated = { ...localGraphExtract, tags };
                            setLocalGraphExtract(updated);
                            onGraphExtractChange(updated);
                          }}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 示例文本 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>示例文本</Label>
                  {!llmConfig && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      请先完成模型配置
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!llmConfig}
                    onClick={handleFabriText}
                  >
                    {textFabring ? '生成中...' : '生成随机文本'}
                  </Button>
                  <Textarea
                    value={localGraphExtract.text}
                    onChange={(e) => {
                      const updated = { ...localGraphExtract, text: e.target.value };
                      setLocalGraphExtract(updated);
                      onGraphExtractChange(updated);
                    }}
                    placeholder="请输入示例文本，用于提取实体和关系"
                    rows={6}
                    maxLength={5000}
                  />
                </div>
              </div>

              {/* 实体列表 */}
              {localGraphExtract.nodes.length > 0 && (
                <div className="space-y-2">
                  <Label>实体列表</Label>
                  <div className="space-y-3">
                    {localGraphExtract.nodes.map((node, nodeIndex) => (
                      <div key={nodeIndex} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <Input
                            value={node.name}
                            onChange={(e) => updateNodeName(nodeIndex, e.target.value)}
                            placeholder="实体名称"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNode(nodeIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="pl-6 space-y-2">
                          {node.attributes.map((attr, attrIndex) => (
                            <div key={attrIndex} className="flex items-center gap-2">
                              <Input
                                value={attr}
                                onChange={(e) =>
                                  updateAttribute(nodeIndex, attrIndex, e.target.value)
                                }
                                placeholder="属性"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAttribute(nodeIndex, attrIndex)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addAttribute(nodeIndex)}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            添加属性
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 添加实体按钮 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>管理实体</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    添加实体及其属性，用于构建知识图谱
                  </p>
                </div>
                <Button onClick={addNode}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加实体
                </Button>
              </div>

              {/* 关系列表 */}
              {localGraphExtract.relations.length > 0 && (
                <div className="space-y-2">
                  <Label>关系列表</Label>
                  <div className="space-y-2">
                    {localGraphExtract.relations.map((relation, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 border rounded-lg"
                      >
                        <Select
                          value={relation.node1}
                          onValueChange={(v) => updateRelation(index, 'node1', v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="选择实体" />
                          </SelectTrigger>
                          <SelectContent>
                            {localGraphExtract.nodes.map((node) => (
                              <SelectItem key={node.name} value={node.name}>
                                {node.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Select
                          value={relation.type}
                          onValueChange={(v) => updateRelation(index, 'type', v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="选择关系类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {localGraphExtract.tags.map((tag) => (
                              <SelectItem key={tag} value={tag}>
                                {tag}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Select
                          value={relation.node2}
                          onValueChange={(v) => updateRelation(index, 'node2', v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="选择实体" />
                          </SelectTrigger>
                          <SelectContent>
                            {localGraphExtract.nodes.map((node) => (
                              <SelectItem key={node.name} value={node.name}>
                                {node.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRelation(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 添加关系按钮 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>管理关系</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    定义实体之间的关系，构建知识图谱结构
                  </p>
                </div>
                <Button onClick={addRelation}>
                  <Plus className="w-4 h-4 mr-1" />
                  添加关系
                </Button>
              </div>

              {/* 提取操作按钮 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>提取操作</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    使用 AI 从示例文本中提取实体和关系
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExtract}
                    disabled={!llmConfig || !localGraphExtract.text}
                  >
                    {extracting ? '提取中...' : '开始提取'}
                  </Button>
                  <Button variant="outline" onClick={defaultExtractExample}>
                    加载示例
                  </Button>
                  <Button variant="outline" onClick={clearExtractExample}>
                    清除
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
