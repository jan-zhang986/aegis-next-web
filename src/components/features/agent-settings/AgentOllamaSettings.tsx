/**
 * Ollama 设置
 * 从 aegis-rag-frontend OllamaSettings.vue 迁移
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, HelpCircle, Server, Download, HardDrive } from 'lucide-react';
import { ollamaService, type OllamaModelInfo } from '@/services/agent-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '未知';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export function AgentOllamaSettings() {
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [models, setModels] = useState<OllamaModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [downloadName, setDownloadName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await ollamaService.checkStatus();
      const data = (res as any)?.data ?? res;
      const available = data?.available ?? false;
      setConnectionStatus(available);
      if (data?.baseUrl) setBaseUrl(data.baseUrl);
      if (available) {
        toast.success('Ollama 连接成功');
        loadModels();
      } else {
        toast.error(data?.error || 'Ollama 连接失败');
      }
    } catch (e: any) {
      setConnectionStatus(false);
      toast.error(e?.message || '连接失败');
    } finally {
      setTesting(false);
    }
  }, []);

  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const res = await ollamaService.listModels();
      const data = (res as any)?.data ?? res;
      const list = data?.models ?? (Array.isArray(data) ? data : []);
      setModels(list);
    } catch {
      toast.error('获取模型列表失败');
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const downloadModel = useCallback(async () => {
    const name = downloadName.trim();
    if (!name) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const res = await ollamaService.downloadModel(name);
      const data = (res as any)?.data ?? res;
      const taskId = data?.taskId;
      if (data?.status === 'failed' || !taskId) {
        toast.error('下载启动失败');
        setDownloading(false);
        return;
      }
      toast.success(`开始下载 ${name}`);

      const interval = setInterval(async () => {
        try {
          const prog = await ollamaService.getDownloadProgress(taskId);
          const task = (prog as any)?.data ?? prog;
          setDownloadProgress(task?.progress ?? 0);
          if (task?.status === 'completed') {
            clearInterval(interval);
            toast.success(`下载完成: ${name}`);
            setDownloadName('');
            setDownloadProgress(0);
            setDownloading(false);
            loadModels();
          } else if (task?.status === 'failed') {
            clearInterval(interval);
            toast.error(task?.message || '下载失败');
            setDownloading(false);
            setDownloadProgress(0);
          }
        } catch {
          clearInterval(interval);
          setDownloading(false);
        }
      }, 1000);
    } catch (e: any) {
      toast.error(e?.message || '下载失败');
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [downloadName, loadModels]);

  useEffect(() => {
    // testConnection();
  }, []);

  return (
    <Card className="max-w-4xl border-border/60 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          Ollama 设置
        </CardTitle>
        <CardDescription>配置本地 Ollama 服务连接与模型管理</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
          <Label className="text-sm font-medium text-gray-700">服务状态</Label>
          <div className="flex items-center gap-3">
            {testing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 检测中...
              </span>
            ) : connectionStatus === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" /> 服务可用
              </span>
            ) : connectionStatus === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                <XCircle className="w-3.5 h-3.5" /> 服务不可用
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                <HelpCircle className="w-3.5 h-3.5" /> 未检测
              </span>
            )}
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testing} className="h-8">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
              重新检测
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
          <Label className="text-sm font-medium text-gray-700">服务地址</Label>
          <div className="max-w-md">
            <Input value={baseUrl} disabled className="bg-gray-50 font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1.5">默认地址为 http://localhost:11434</p>
          </div>
        </div>

        {connectionStatus === true && (
          <div className="space-y-6 pt-2">
            <div className="rounded-xl border border-border/60 bg-gray-50/50 p-5">
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                下载新模型
              </h4>
              <div className="flex gap-2">
                <Input
                  value={downloadName}
                  onChange={(e) => setDownloadName(e.target.value)}
                  placeholder="输入模型名称，如 llama3, mistral, qwen..."
                  className="flex-1 max-w-sm bg-white"
                />
                <Button
                  onClick={downloadModel}
                  disabled={!downloadName.trim() || downloading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {downloading ? '下载中...' : '开始下载'}
                </Button>
              </div>
              {downloadProgress > 0 && (
                <div className="mt-4 bg-white p-3 rounded-lg border border-border shadow-sm">
                  <div className="flex justify-between text-xs font-medium mb-2 text-gray-700">
                    <span>正在下载: {downloadName}</span>
                    <span>{downloadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={downloadProgress} className="h-2" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  已安装模型
                </h4>
                <Button variant="ghost" size="sm" onClick={loadModels} disabled={loadingModels} className="h-8 text-xs">
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingModels ? 'animate-spin' : ''}`} />
                  刷新列表
                </Button>
              </div>

              {loadingModels ? (
                <div className="flex justify-center py-8 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 加载中...
                </div>
              ) : models.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
                  暂无已安装的模型
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {models.map((m) => (
                    <div
                      key={m.name}
                      className="p-3 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="font-semibold text-sm text-gray-900 truncate" title={m.name}>{m.name}</div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{formatSize(m.size)}</span>
                        <span>·</span>
                        <span>{formatDate(m.modified_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
