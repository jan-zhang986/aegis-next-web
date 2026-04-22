/**
 * Agent 模型管理
 * 从 aegis-rag-frontend ModelSettings.vue 迁移
 */

import { useState, useEffect } from 'react';
import { modelService, type ModelConfig } from '@/services/knowledge-base';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cpu,
  Database,
  Layers,
  Image as ImageIcon,
  Box,
  Server,
  ShieldCheck,
  Zap,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ModelEditorDialog } from './ModelEditorDialog';

const MODEL_TYPES = [
  { key: 'KnowledgeQA', label: '对话模型 (LLM)', icon: Box, description: '用于对话生成与逻辑推理', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'Embedding', label: 'Embedding 模型', icon: Database, description: '用于文本向量化', color: 'text-purple-500', bg: 'bg-purple-50' },
  { key: 'Rerank', label: 'Rerank 模型', icon: Layers, description: '用于搜索结果重排序', color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'VLLM', label: 'VLLM 视觉模型', icon: ImageIcon, description: '用于图像理解与生成', color: 'text-pink-500', bg: 'bg-pink-50' },
] as const;

export function AgentModelSettings() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [activeType, setActiveType] = useState<'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM'>('KnowledgeQA');

  const loadModels = () => {
    setLoading(true);
    modelService
      .listModels()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setModels(list);
      })
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleAdd = (type: string) => {
    setActiveType(type as any);
    setEditingModel(null);
    setDialogOpen(true);
  };

  const handleEdit = (model: ModelConfig) => {
    if (model.is_builtin) {
      toast.warning('内置模型不可编辑');
      return;
    }
    setActiveType(model.type);
    setEditingModel(model);
    setDialogOpen(true);
  };

  const handleDelete = async (model: ModelConfig) => {
    if (model.is_builtin) {
      toast.warning('内置模型不可删除');
      return;
    }
    if (!confirm(`确定要删除模型 "${model.name}" 吗？`)) return;

    try {
      if (model.id) {
        await modelService.deleteModel(model.id);
        toast.success('删除成功');
        loadModels();
      }
    } catch (error: any) {
      toast.error('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleSave = async (data: ModelConfig) => {
    try {
      if (editingModel?.id) {
        await modelService.updateModel(editingModel.id, data);
        toast.success('更新成功');
      } else {
        await modelService.createModel(data);
        toast.success('创建成功');
      }
      loadModels();
    } catch (error: any) {
      console.error(error);
      throw error; // Re-throw to let dialog handle loading state or error display if needed, 
      // but dialog currently catches error. 
      // Ideally dialog should just call this and handle UI.
      // My Dialog component catches error, so I should throw here.
    }
  };

  const byType = (type: string) => models.filter((m) => m.type === type);

  const stats = [
    { label: '总模型数', value: models.length, icon: Cpu },
    { label: '本地模型', value: models.filter(m => m.source === 'local').length, icon: Server },
    { label: '在线模型', value: models.filter(m => m.source !== 'local').length, icon: Zap },
  ];

  if (loading) {
    return (
      <Card className="max-w-4xl border-border/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/40">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl border-border/60 shadow-sm">
      <CardHeader className="pb-6 border-b border-border/40">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              模型管理
            </CardTitle>
          </div>

          <div className="flex gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500 font-medium mb-0.5">{stat.label}</span>
                <div className="flex items-center gap-1.5">
                  <stat.icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-8 space-y-10">
        {MODEL_TYPES.map(({ key, label, icon: Icon, description, color, bg }) => {
          const list = byType(key);
          if (list.length === 0) return null;

          return (
            <div key={key} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-1.5 rounded-md ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{label}</h3>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    {list.length} 个模型
                  </Badge>
                  <Button size="sm" className="h-7 px-2 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => handleAdd(key)}>
                    <Plus className="w-3.5 h-3.5" /> 添加
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {list.map((m) => (
                  <div
                    key={m.id}
                    className="group relative flex flex-col p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 shadow-sm
                                ${m.source === 'local' ? 'bg-orange-50' : 'bg-blue-50'}
                            `}>
                          <span className={`text-sm font-bold ${m.source === 'local' ? 'text-orange-600' : 'text-blue-600'}`}>
                            {m.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm truncate max-w-[180px]" title={m.name}>
                            {m.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`
                                        text-[10px] px-1.5 py-0 h-5 font-medium border-0
                                        ${m.source === 'local'
                                ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-100'
                                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}
                                    `}>
                              {m.source === 'local' ? 'Ollama' : 'Cloud API'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {(m.is_builtin || m.is_default) && (
                        <div className="flex flex-col gap-1.5 items-end">
                          {m.is_default && (
                            <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 text-[10px] px-1.5 py-0.5 shadow-none">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              默认
                            </Badge>
                          )}
                          {m.is_builtin && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 hover:bg-gray-200 text-[10px] px-1.5 py-0.5">
                              内置
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                      <span className="font-mono opacity-80">ID: {m.id?.slice(0, 8)}...</span>

                      {!m.is_builtin && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(m)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> 编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(m)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> 删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {models.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Box className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">暂无模型</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              当前未检测到任何可用模型。您可以点击上方按钮手动添加模型。
            </p>
          </div>
        )}
      </CardContent>

      <ModelEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        modelType={activeType}
        modelData={editingModel}
        onConfirm={handleSave}
      />
    </Card>
  );
}

