
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, Plus, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/utils/cn';

import {
    checkOllamaStatus,
    listOllamaModels,
    checkRemoteModel,
    testEmbeddingModel,
    checkRerankModel,
    listModelProviders,
    ModelProviderOption,
    OllamaModelInfo,
} from '@/services/initialization';
import { ModelConfig } from '@/services/knowledge-base';

// --- Types & Schemas ---

const modelFormSchema = z.object({
    source: z.enum(['local', 'remote']),
    provider: z.string().optional(),
    modelName: z.string().min(1, '请输入模型名称'),
    baseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    dimension: z.number().optional(),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

interface ModelEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modelType: 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM';
    modelData?: ModelConfig | null;
    onConfirm: (data: ModelConfig) => Promise<void>;
}

// --- Constants ---
// Fallback provider options if API fails
// --- Constants ---
// Fallback provider options if API fails
const FALLBACK_PROVIDERS = [
    {
        value: 'openai',
        label: 'OpenAI Compatibility',
        defaultUrls: {
            chat: 'https://api.openai.com/v1',
            embedding: 'https://api.openai.com/v1',
            rerank: 'https://api.openai.com/v1',
            vllm: 'https://api.openai.com/v1'
        },
        modelTypes: ['KnowledgeQA', 'Embedding', 'VLLM']
    },
    {
        value: 'aliyun',
        label: 'Aliyun DashScope',
        defaultUrls: {
            chat: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            embedding: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            rerank: 'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank',
            vllm: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        },
        modelTypes: ['KnowledgeQA', 'Embedding', 'Rerank', 'VLLM']
    },
    {
        value: 'zhipu',
        label: 'Zhipu AI',
        defaultUrls: {
            chat: 'https://open.bigmodel.cn/api/paas/v4',
            embedding: 'https://open.bigmodel.cn/api/paas/v4/embeddings',
            vllm: 'https://open.bigmodel.cn/api/paas/v4'
        },
        modelTypes: ['KnowledgeQA', 'Embedding', 'VLLM']
    },
    {
        value: 'siliconflow',
        label: 'SiliconFlow',
        defaultUrls: {
            chat: 'https://api.siliconflow.cn/v1',
            embedding: 'https://api.siliconflow.cn/v1',
            rerank: 'https://api.siliconflow.cn/v1'
        },
        modelTypes: ['KnowledgeQA', 'Embedding', 'Rerank']
    },
    { value: 'generic', label: 'Generic', defaultUrls: {}, modelTypes: ['KnowledgeQA', 'Embedding', 'Rerank', 'VLLM'] },
];

export function ModelEditorDialog({
    open,
    onOpenChange,
    modelType,
    modelData,
    onConfirm,
}: ModelEditorDialogProps) {
    const isEdit = !!modelData;
    const [saving, setSaving] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<{ success?: boolean; message?: string }>({});
    const [showApiKey, setShowApiKey] = useState(false);

    // Ollama State
    const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
    const [ollamaModels, setOllamaModels] = useState<OllamaModelInfo[]>([]);
    const [loadingOllamaModels, setLoadingOllamaModels] = useState(false);

    // Provider State
    const [providers, setProviders] = useState<ModelProviderOption[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);

    // Form
    const form = useForm<ModelFormValues>({
        resolver: zodResolver(modelFormSchema),
        defaultValues: {
            source: 'local',
            provider: 'openai',
            modelName: '',
            baseUrl: '',
            apiKey: '',
            dimension: undefined,
        },
    });

    const source = form.watch('source');
    const provider = form.watch('provider');
    const modelName = form.watch('modelName');
    const baseUrl = form.watch('baseUrl');

    // --- Computed ---
    const providerOptions = useMemo(() => {
        if (providers.length > 0) return providers;
        return FALLBACK_PROVIDERS.filter(p => p.modelTypes.includes(modelType));
    }, [providers, modelData, modelType]);

    // --- Effects ---

    // Initialize form when opening
    useEffect(() => {
        if (open) {
            // 1. Check Ollama Status
            checkOllamaStatus().then((res: any) => setOllamaAvailable(res.available)).catch(() => setOllamaAvailable(false));

            // 2. Load Providers
            setLoadingProviders(true);
            listModelProviders(modelType === 'KnowledgeQA' ? 'chat' : modelType.toLowerCase())
                .then(data => setProviders(data.length ? data : []))
                .catch(() => setProviders([])) // Fallback handled in render
                .finally(() => setLoadingProviders(false));

            // 3. Reset or Set Form Data
            if (modelData) {
                form.reset({
                    source: modelData.source === 'local' ? 'local' : 'remote',
                    provider: (modelData.parameters?.provider as string) || 'generic',
                    modelName: modelData.name,
                    baseUrl: (modelData.parameters?.base_url as string) || '',
                    apiKey: (modelData.parameters?.api_key as string) || '',
                    dimension: (modelData.parameters?.embedding_parameters as any)?.dimension,
                });
            } else {
                form.reset({
                    source: 'local',
                    provider: 'openai',
                    modelName: '',
                    baseUrl: '',
                    apiKey: '',
                    dimension: undefined,
                });

                // If Rerank, default to remote as Ollama doesn't support it well usually
                if (modelType === 'Rerank') {
                    form.setValue('source', 'remote');
                }
            }

            setCheckResult({});
        }
    }, [open, modelData, modelType, form]);

    // Load Ollama models when source is local
    useEffect(() => {
        if (open && source === 'local' && ollamaAvailable) {
            setLoadingOllamaModels(true);
            listOllamaModels()
                .then(setOllamaModels)
                .catch(() => toast.error('获取 Ollama 模型列表失败'))
                .finally(() => setLoadingOllamaModels(false));
        }
    }, [open, source, ollamaAvailable]);

    // Auto-fill Base URL when provider changes
    useEffect(() => {
        if (source === 'remote' && provider) {
            const selectedProvider = providerOptions.find(p => p.value === provider);

            if (selectedProvider && (selectedProvider as any).defaultUrls) {
                // Map modelType to key used in defaultUrls
                let typeKey = 'chat';
                if (modelType === 'Embedding') typeKey = 'embedding';
                if (modelType === 'Rerank') typeKey = 'rerank';
                if (modelType === 'VLLM') typeKey = 'vllm';

                const url = (selectedProvider as any).defaultUrls?.[typeKey];
                if (url && !isEdit) {
                    form.setValue('baseUrl', url);
                }
            }
        }
    }, [provider, source, modelType, providerOptions, isEdit, form]);

    // --- Handlers ---

    const handleTestConnection = async () => {
        const values = form.getValues();
        if (values.source === 'remote' && (!values.baseUrl || !values.modelName)) {
            toast.warning('请填写模型名称和 Base URL');
            return;
        }
        if (values.source === 'local' && !values.modelName) {
            toast.warning('请选择模型');
            return;
        }

        setChecking(true);
        setCheckResult({});

        try {
            let res: { available: boolean; message?: string; dimension?: number };

            if (modelType === 'Embedding') {
                res = await testEmbeddingModel({
                    source: values.source,
                    modelName: values.modelName,
                    baseUrl: values.baseUrl,
                    apiKey: values.apiKey,
                    dimension: values.dimension,
                    provider: values.provider,
                }) as any;
                if (res.available && (res as any).dimension) {
                    form.setValue('dimension', (res as any).dimension);
                    toast.success(`连接成功，自动检测到维度: ${(res as any).dimension}`);
                }
            } else if (modelType === 'Rerank') {
                res = await checkRerankModel({
                    modelName: values.modelName,
                    baseUrl: values.baseUrl || '',
                    apiKey: values.apiKey,
                }) as any;
            } else {
                // Chat or VLLM
                // For local chat, we might use checkOllamaModels if needed, but checkRemoteModel is for remote
                if (values.source === 'remote') {
                    res = await checkRemoteModel({
                        modelName: values.modelName,
                        baseUrl: values.baseUrl!,
                        apiKey: values.apiKey,
                    }) as any;
                } else {
                    // Local check logic could be simpler (check if in list)
                    // But let's assume we trust the selection for now or use a check API if exists
                    // Reference uses checkOllamaModels([name])
                    // For simplicity, if it's in ollamaModels list, it's available.
                    // Or use checkRemoteModel for OpenAI compatible local? No.
                    // Let's implement a simple check for local
                    const exists = ollamaModels.some(m => m.name === values.modelName);
                    res = { available: exists, message: exists ? '模型可用' : '模型未找到' };
                }
            }

            setCheckResult({
                success: res.available,
                message: res.available ? '连接测试成功' : (res.message || '连接测试失败'),
            });

            if (!res.available) {
                toast.error(res.message || '连接测试失败');
            }

        } catch (error: any) {
            setCheckResult({ success: false, message: error.message || '连接错误' });
            toast.error('连接测试失败');
        } finally {
            setChecking(false);
        }
    };

    const onSubmit = async (values: ModelFormValues) => {
        // Validate required fields for remote
        if (values.source === 'remote' && !values.baseUrl) {
            form.setError('baseUrl', { message: 'Base URL 不能为空' });
            return;
        }

        if (modelType === 'Embedding' && !values.dimension) {
            form.setError('dimension', { message: '请输入或检测维度' });
            return;
        }

        setSaving(true);
        try {
            const config: ModelConfig = {
                ...(modelData || {}),
                name: values.modelName,
                type: modelType,
                source: values.source,
                parameters: {
                    base_url: values.baseUrl,
                    api_key: values.apiKey,
                    provider: values.provider,
                    model_name: values.modelName, // Required by backend for mapping
                    ...(modelType === 'Embedding' ? {
                        embedding_parameters: {
                            dimension: values.dimension,
                            truncate_prompt_tokens: 0
                        }
                    } : {})
                }
            };

            await onConfirm(config);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    // --- Render Helpers ---

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!w-[800px] !max-w-[800px] sm:!max-w-[800px] h-[600px] max-h-[95vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle>{isEdit ? '编辑模型' : '添加模型'} - {modelType}</DialogTitle>
                    <DialogDescription>
                        配置 {modelType === 'KnowledgeQA' ? '对话' : modelType} 模型参数
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6">
                <Form {...form}>
                    <form id="model-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

                        {/* Source Selection */}
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>模型来源</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex gap-4"
                                            disabled={isEdit && modelData?.is_builtin}
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem 
                                                        value="local" 
                                                        disabled={modelType === 'Rerank' || (!ollamaAvailable && !isEdit)}
                                                        className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal cursor-pointer">
                                                    Local (Ollama)
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem 
                                                        value="remote"
                                                        className="border-blue-600 text-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50"
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal cursor-pointer">
                                                    Remote (OpenAI API)
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    {field.value === 'local' && !ollamaAvailable && (
                                        <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Ollama 服务不可用，请检查本地服务状态</span>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Local: Model Name Select */}
                        {source === 'local' && (
                            <FormField
                                control={form.control}
                                name="modelName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>选择模型</FormLabel>
                                        <div className="flex gap-2">
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingOllamaModels}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择已安装的 Ollama 模型" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ollamaModels.map(model => (
                                                        <SelectItem key={model.name} value={model.name}>
                                                            {model.name} ({Math.round(model.size / 1024 / 1024 / 1024 * 10) / 10}GB)
                                                        </SelectItem>
                                                    ))}
                                                    {ollamaModels.length === 0 && (
                                                        <div className="p-2 text-sm text-center text-gray-500">暂无已安装模型</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button" variant="outline" size="icon"
                                                onClick={() => checkOllamaStatus().then((res: any) => {
                                                    if (res.available) listOllamaModels().then(setOllamaModels);
                                                })}
                                            >
                                                <RefreshCw className={cn("w-4 h-4", loadingOllamaModels && "animate-spin")} />
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            如需下载新模型，请前往 <Button variant="link" className="p-0 h-auto" onClick={() => window.open('https://ollama.com/library', '_blank')}>Ollama Library</Button>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Remote: Provider & Settings */}
                        {source === 'remote' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="provider"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>服务厂商</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择厂商" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {providerOptions.map((opt: any) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="modelName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>模型名称</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如: gpt-4, qwen-max" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="baseUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base URL <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://api.openai.com/v1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        type={showApiKey ? "text" : "password"} 
                                                        placeholder="sk-..." 
                                                        {...field} 
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    >
                                                        {showApiKey ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Embedding Dimension */}
                        {modelType === 'Embedding' && (
                            <FormField
                                control={form.control}
                                name="dimension"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Embedding 维度</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="例如: 1536"
                                                    {...field}
                                                    onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                                                />
                                            </FormControl>
                                            {/* Optional: Add check logic specifically for dimension if needed, 
                             but test connection covers it mostly */}
                                        </div>
                                        <FormDescription>
                                            请确保维度与模型实际参数一致
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Test Connection Result */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 text-sm">
                                {checkResult.success === true && (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> {checkResult.message}
                                    </span>
                                )}
                                {checkResult.success === false && (
                                    <span className="text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> {checkResult.message}
                                    </span>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleTestConnection}
                                disabled={checking}
                            >
                                {checking ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                测试连接
                            </Button>
                        </div>

                    </form>
                </Form>
                </div>
                
                <DialogFooter className="px-6 py-4 border-t shrink-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button type="submit" form="model-form" disabled={saving || checking} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
