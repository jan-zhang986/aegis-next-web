/**
 * MCP 服务设置
 * 从 aegis-rag-frontend McpSettings.vue 迁移
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Play, Loader2, Wrench, Globe, Server, ChevronDown, ChevronUp, File, Link, CheckCircle2, XCircle } from 'lucide-react';
import { mcpService, type MCPService, type MCPTestResult } from '@/services/agent-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { McpServiceDialog } from './McpServiceDialog';
import { toast } from 'sonner';

function McpTestResultDialog({
  open,
  onOpenChange,
  serviceName,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  result: MCPTestResult | null;
}) {
  const [expandedToolIndex, setExpandedToolIndex] = useState<number | null>(null);

  // 当对话框关闭时重置展开状态
  useEffect(() => {
    if (!open) {
      setExpandedToolIndex(null);
    }
  }, [open]);

  const toggleTool = (index: number) => {
    setExpandedToolIndex(expandedToolIndex === index ? null : index);
  };

  const formatSchema = (schema: any): string => {
    if (!schema) return '';
    try {
      return JSON.stringify(schema, null, 2);
    } catch {
      return String(schema);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>测试结果: {serviceName}</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-6 py-4">
            {/* 状态显示 */}
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">连接成功</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 font-medium">连接失败</span>
                  </>
                )}
              </div>
              {result.message && (
                <p className="px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                  {result.message}
                </p>
              )}
            </div>

            {/* 详细信息 */}
            {result.success && (
              <div className="space-y-6">
                {/* 工具列表 */}
                {result.tools && result.tools.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">工具</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {result.tools.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {result.tools.map((tool, index) => (
                        <div
                          key={tool.name}
                          className={`border rounded-lg transition-all ${
                            expandedToolIndex === index
                              ? 'border-blue-400 shadow-md'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleTool(index)}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Wrench className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 mb-1">
                                  {tool.name}
                                </div>
                                {tool.description && (
                                  <div className="text-sm text-gray-600 line-clamp-2">
                                    {tool.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {expandedToolIndex === index ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {expandedToolIndex === index && (
                            <div className="px-3 pb-3 pt-2 border-t border-gray-100 space-y-3 animate-in slide-in-from-top-2">
                              {tool.description && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    描述
                                  </div>
                                  <div className="text-sm text-gray-700">{tool.description}</div>
                                </div>
                              )}
                              {tool.inputSchema && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    输入 Schema
                                  </div>
                                  <div className="bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
                                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                                      {formatSchema(tool.inputSchema)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 资源列表 */}
                {result.resources && result.resources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">资源</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {result.resources.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {result.resources.map((resource) => (
                        <div
                          key={resource.uri}
                          className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                              <File className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-1">
                                {resource.name || resource.uri}
                              </div>
                              {resource.description && (
                                <div className="text-sm text-gray-600 mb-2">
                                  {resource.description}
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                                  <Link className="w-3 h-3 shrink-0" />
                                  <span className="truncate font-mono">{resource.uri}</span>
                                </div>
                                {resource.mimeType && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 shrink-0">
                                    {resource.mimeType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 空状态 */}
                {(!result.tools || result.tools.length === 0) &&
                  (!result.resources || result.resources.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">该服务未提供工具或资源</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>暂无结果</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AgentMcpSettings() {
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MCPService | null>(null);
  const [testResultOpen, setTestResultOpen] = useState(false);
  const [testResult, setTestResult] = useState<MCPTestResult | null>(null);
  const [testServiceName, setTestServiceName] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<MCPService | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mcpService.list();
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setServices(list);
    } catch (e: any) {
      toast.error(e?.message || '加载失败');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (s: MCPService) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (data: Partial<MCPService>) => {
    try {
      if (editing) {
        await mcpService.update(editing.id, data);
        toast.success('更新成功');
      } else {
        await mcpService.create(data);
        toast.success('添加成功');
      }
      load();
      setDialogOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
      throw e;
    }
  };

  const handleDelete = (s: MCPService) => {
    setServiceToDelete(s);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await mcpService.delete(serviceToDelete.id);
      toast.success('已删除');
      load();
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const handleToggleEnabled = async (s: MCPService) => {
    try {
      await mcpService.update(s.id, { enabled: !s.enabled });
      toast.success(s.enabled ? '已禁用' : '已启用');
      load();
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleTest = async (s: MCPService) => {
    setTestingId(s.id);
    setTestResult(null);
    setTestServiceName(s.name);
    setTestResultOpen(true);
    
    // 显示测试开始提示
    toast.info(`正在测试 "${s.name}"...`, {
      duration: 0, // 不自动关闭
    });
    
    try {
      const res = await mcpService.test(s.id);
      const data = (res as any)?.data ?? res;
      
      // 关闭所有提示
      toast.dismiss();
      
      // 检查结果是否存在
      if (!data) {
        setTestResult({
          success: false,
          message: '未收到测试响应',
        });
        return;
      }
      
      setTestResult(data);
      
      // 显示成功或失败提示
      if (data.success) {
        toast.success(`测试成功: ${s.name}`);
      } else {
        toast.error(`测试失败: ${data.message || '未知错误'}`);
      }
    } catch (e: any) {
      // 关闭所有提示
      toast.dismiss();
      
      const errorMessage = e?.response?.data?.error?.message || e?.message || '测试失败';
      setTestResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`测试失败: ${errorMessage}`);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Card className="max-w-4xl border-border/60 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            MCP 服务
          </CardTitle>
          <CardDescription>配置 Model Context Protocol 服务，扩展 Agent 的工具能力</CardDescription>
        </div>
        <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          添加服务
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            加载 MCP 服务...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-border/60">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium">暂无 MCP 服务</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              添加 MCP 服务可以让您的 Agent 访问外部数据和工具，例如文件系统、数据库与 API。
            </p>
            <Button onClick={handleAdd} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              立即添加
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className={`
                    flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                    ${s.enabled ? 'bg-white border-border shadow-sm hover:shadow-md' : 'bg-gray-50 border-border/50 opacity-80'}
                `}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                         w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                         ${s.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}
                     `}>
                      {s.transport_type === 'stdio' ? <Server className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{s.name}</span>
                        {!s.enabled && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{s.transport_type}</span>
                        {s.url && <span className="truncate max-w-[200px]">{s.url}</span>}
                        {s.transport_type === 'stdio' && s.stdio_config?.command && (
                          <span className="truncate max-w-[300px] font-mono" title={`${s.stdio_config.command} ${s.stdio_config.args?.join(' ') || ''}`}>
                            {s.stdio_config.command} {s.stdio_config.args?.join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-sm text-gray-500 mt-2 pl-[52px] truncate">{s.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 border-l border-border pl-4">
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-gray-500">{s.enabled ? '启用' : '禁用'}</span>
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={() => handleToggleEnabled(s)}
                    />
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTest(s)}
                      disabled={testingId === s.id}
                      className="h-8 w-8 text-gray-500 hover:text-blue-600"
                      title="测试连接"
                    >
                      {testingId === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(s)}
                      className="h-8 w-8 text-gray-500 hover:text-gray-900"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(s)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <McpServiceDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        onSubmit={handleDialogSubmit}
      />

      <McpTestResultDialog
        open={testResultOpen}
        onOpenChange={(open) => {
          setTestResultOpen(open);
          if (!open) {
            setTestResult(null);
            setTestServiceName('');
          }
        }}
        serviceName={testServiceName}
        result={testResult}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 MCP 服务 "{serviceToDelete?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
