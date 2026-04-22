/**
 * 网络搜索设置
 * 从 aegis-rag-frontend WebSearchSettings.vue 迁移
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  webSearchService,
  type WebSearchProviderConfig,
  type WebSearchConfig,
} from '@/services/agent-settings';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Globe, Key, Sliders, FileText, Ban, Eye, EyeOff } from 'lucide-react';

export function AgentWebSearchSettings() {
  const [providers, setProviders] = useState<WebSearchProviderConfig[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [provider, setProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const [includeDate, setIncludeDate] = useState(true);
  const [compressionMethod, setCompressionMethod] = useState('none');
  const [blacklistText, setBlacklistText] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isInitializing = useRef(true);

  const selectedProvider = providers.find((p) => p.id === provider);

  const loadProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const res = await webSearchService.getProviders();
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setProviders(list);
    } catch (e: any) {
      toast.error(e?.message || '加载提供商失败');
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const res = await webSearchService.getTenantConfig();
      const data = (res as any)?.data ?? res;
      const cfg = data?.data ?? data;
      if (cfg) {
        setProvider(cfg.provider || '');
        setApiKey(cfg.api_key === '***' ? '' : cfg.api_key || '');
        setMaxResults(cfg.max_results ?? 5);
        setIncludeDate(cfg.include_date !== undefined ? cfg.include_date : true);
        setCompressionMethod(cfg.compression_method || 'none');
        setBlacklistText((cfg.blacklist || []).join('\n'));
      }
    } catch {
      // 无配置时使用默认
    } finally {
      isInitializing.current = false;
    }
  }, []);

  const saveConfig = useCallback(async () => {
    if (isInitializing.current) return;
    try {
      const blacklist = blacklistText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      await webSearchService.updateTenantConfig({
        provider,
        api_key: apiKey || undefined,
        max_results: maxResults,
        include_date: includeDate,
        compression_method: compressionMethod,
        blacklist,
      });
      toast.success('保存成功');
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    }
  }, [provider, apiKey, maxResults, includeDate, compressionMethod, blacklistText]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveConfig, 500);
  }, [saveConfig]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (isInitializing.current) return;
    debouncedSave();
  }, [provider, apiKey, maxResults, includeDate, compressionMethod, blacklistText]);

  return (
    <Card className="max-w-4xl border-border/60 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          网络搜索配置
        </CardTitle>
        <CardDescription>配置网络搜索提供商与参数，增强 Agent 的实时信息获取能力</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="grid grid-cols-[140px_1fr] gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Globe className="w-4 h-4 text-gray-500" /> 搜索引擎
          </div>
          <div>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full sm:w-80 bg-white">
                <SelectValue placeholder={loadingProviders ? '加载中...' : '选择提供商'} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              选择用于检索实时信息的搜索引擎服务商
            </p>
          </div>
        </div>

        {selectedProvider?.requires_api_key && (
          <div className="grid grid-cols-[140px_1fr] gap-6">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Key className="w-4 h-4 text-gray-500" /> API 密钥
            </div>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={debouncedSave}
                placeholder={`输入 ${selectedProvider.name} API Key`}
                className="w-full sm:w-80 bg-white pr-10"
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
          </div>
        )}

        <div className="grid grid-cols-[140px_1fr] gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Sliders className="w-4 h-4 text-gray-500" /> 搜索参数
          </div>
          <div className="space-y-6 max-w-lg">
            <div className="bg-gray-50/50 p-4 rounded-xl border border-border/50 space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs font-medium text-gray-600">最大结果数 (Top K)</Label>
                  <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 rounded">{maxResults}</span>
                </div>
                <Slider
                  value={[maxResults]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={([v]) => {
                    setMaxResults(v);
                    debouncedSave();
                  }}
                  className="w-full [&_[data-slot=slider-range]]:bg-blue-600 [&_[data-slot=slider-thumb]]:border-blue-600 [&_[data-slot=slider-thumb]]:ring-blue-600/50 [&_[data-slot=slider-thumb]]:hover:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">包含日期信息</Label>
                <Switch
                  checked={includeDate}
                  onCheckedChange={(v) => {
                    setIncludeDate(v);
                    debouncedSave();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[140px_1fr] gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4 text-gray-500" /> 内容处理
          </div>
          <div>
            <Select
              value={compressionMethod}
              onValueChange={(v) => {
                setCompressionMethod(v);
                debouncedSave();
              }}
            >
              <SelectTrigger className="w-full sm:w-80 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不压缩 (保留原文)</SelectItem>
                <SelectItem value="llm_summary">LLM 摘要 (智能总结)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              选择是否对搜索结果进行预处理，LLM 摘要可减少 Token 消耗
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[140px_1fr] gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pt-2">
            <Ban className="w-4 h-4 text-gray-500" /> 域名黑名单
          </div>
          <div>
            <Textarea
              value={blacklistText}
              onChange={(e) => setBlacklistText(e.target.value)}
              onBlur={debouncedSave}
              placeholder="输入要屏蔽的域名，每行一个。例如：&#10;example.com&#10;test.org"
              rows={4}
              className="w-full max-w-lg bg-white font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              这些站点的内容将不会出现在搜索结果中
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
