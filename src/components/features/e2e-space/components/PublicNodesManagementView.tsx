/**
 * PublicNodesManagementView Component
 * 公共节点统一管理视图：列表、搜索、分类筛选、分页、编辑、删除
 * 编辑时复用画布侧 NodeFormPanel，与画布内节点编辑体验一致
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Search, Star, Pencil, Trash2, Eye, ChevronDown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { projectService, type ProjectSimple } from '@/services/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  NODE_META_REGISTRY,
  NodeFormPanel,
  NodeType,
  type WorkflowNodeData,
  type NodeConfig,
  type HttpConfig,
} from '@/components/workflow';
import { workflowService } from '@/services/workflow';
import { toast } from 'sonner';
import { formatTimestampBeijing } from '@/utils/date';
import { usePublicNodesManagement, PUBLIC_NODE_CATEGORY_OPTIONS, type PublicNodeItem } from '../hooks/usePublicNodesManagement';
import { ExecutionEnvironmentDialog } from '@/components/features/workflow-designer/components/ExecutionEnvironmentDialog';
import { convertHttpConfigToRequestConfig } from '@/components/features/workflow-designer/utils/nodeConverter';
import { ExecutionLogDrawer } from '@/components/features/workflow/ExecutionLogDrawer';
import type { ExecutionLog } from '@/components/features/workflow/types';

interface PublicNodesManagementViewProps {
  onBack: () => void;
}

function getTypeDisplayName(type: string): string {
  const meta = NODE_META_REGISTRY[type as NodeType];
  return meta?.name ?? type;
}

function publicItemToNodeData(item: PublicNodeItem): WorkflowNodeData {
  return {
    id: item.id,
    type: item.type as NodeType,
    name: item.name,
    description: item.description,
    config: (item.config as NodeConfig) ?? {},
    x: 0,
    y: 0,
  };
}

export function PublicNodesManagementView({ onBack }: PublicNodesManagementViewProps) {
  const { user } = useUser();
  const currentProjectId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
  const orgId = user?.lastOrganizationId ?? (typeof window !== 'undefined' ? localStorage.getItem('currentOrgId') : null);

  const [projectOptions, setProjectOptions] = useState<ProjectSimple[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() =>
    currentProjectId ? [currentProjectId] : []
  );

  const {
    loading,
    list,
    total,
    current,
    pageSize,
    keyword,
    category,
    setKeyword,
    setCategory,
    setCurrent,
    editingItem,
    isEditDialogOpen,
    openEdit,
    closeEdit,
    editName,
    editDescription,
    setEditName,
    setEditDescription,
    saveEdit,
    deleteTargetId,
    isDeleteDialogOpen,
    openDelete,
    closeDelete,
    confirmDelete,
    detailItem,
    isDetailOpen,
    openDetail,
    closeDetail,
    loadList,
  } = usePublicNodesManagement({
    selectedProjectIds,
  });

  const [editingNodeData, setEditingNodeData] = useState<WorkflowNodeData | null>(null);
  const projectId = currentProjectId;

  useEffect(() => {
    if (!orgId) return;
    projectService
      .getProjectListByOrg(orgId)
      .then((list) => setProjectOptions(Array.isArray(list) ? list : []))
      .catch(() => setProjectOptions([]));
  }, [orgId]);

  // 调试节点：环境选择弹窗状态
  const [isDebugEnvDialogOpen, setIsDebugEnvDialogOpen] = useState(false);
  const [debugExecutionEnvironmentId, setDebugExecutionEnvironmentId] = useState('');
  const [loadingEngineProfiles, setLoadingEngineProfiles] = useState(false);
  const [engineProfiles, setEngineProfiles] = useState<any[]>([]);
  const [debugUserVariableXTagHeader, setDebugUserVariableXTagHeader] = useState('');
  const [debugUserVariableXSiteTenant, setDebugUserVariableXSiteTenant] = useState('');
  const [debugUserVariableXTenantId, setDebugUserVariableXTenantId] = useState('');
  const [debugUserVariableXApp, setDebugUserVariableXApp] = useState('');

  // 调试日志抽屉（与工作流画布一致）
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecutionDrawerOpen, setIsExecutionDrawerOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const debugPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (debugPollIntervalRef.current) {
        clearInterval(debugPollIntervalRef.current);
        debugPollIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (detailItem) {
      setEditingNodeData(publicItemToNodeData(detailItem));
    } else {
      setEditingNodeData(null);
    }
  }, [detailItem]);

  // 打开调试环境弹窗时加载环境列表
  useEffect(() => {
    if (!isDebugEnvDialogOpen || !projectId) return;
    setLoadingEngineProfiles(true);
    workflowService
      .getEngineProfileList(projectId)
      .then((records: any[]) => {
        setEngineProfiles(Array.isArray(records) ? records : []);
        const lastEnvId = localStorage.getItem(`lastExecutionEnvironment_${projectId}`);
        if (lastEnvId) setDebugExecutionEnvironmentId(lastEnvId);
      })
      .catch(() => setEngineProfiles([]))
      .finally(() => setLoadingEngineProfiles(false));
  }, [isDebugEnvDialogOpen, projectId]);

  const handleDebugNode = useCallback(() => {
    if (!editingNodeData) {
      toast.error('节点数据不存在');
      return;
    }
    if (editingNodeData.type === NodeType.HTTP_REQUEST) {
      const config = editingNodeData.config as HttpConfig;
      if (!config?.url?.trim() && !config?.path?.trim()) {
        toast.error('请先填写请求 URL 或路径');
        return;
      }
    }
    setIsDebugEnvDialogOpen(true);
  }, [editingNodeData]);

  const handleConfirmDebug = useCallback(async () => {
    if (!editingNodeData || !projectId || !debugExecutionEnvironmentId) {
      toast.error('请选择执行环境');
      return;
    }
    if (projectId) {
      localStorage.setItem(`lastExecutionEnvironment_${projectId}`, debugExecutionEnvironmentId);
    }
    setIsDebugEnvDialogOpen(false);

    const node = editingNodeData;
    let nodeConfigToSend: any = node.config;
    if (node.type === NodeType.HTTP_REQUEST) {
      nodeConfigToSend = convertHttpConfigToRequestConfig(node.config as HttpConfig);
    }
    if (nodeConfigToSend) {
      nodeConfigToSend = {
        ...nodeConfigToSend,
        environmentId: debugExecutionEnvironmentId,
      };
    }
    const userVariables: Record<string, string> = {};
    if (debugUserVariableXTagHeader.trim()) userVariables['x-tag-header'] = debugUserVariableXTagHeader.trim();
    if (debugUserVariableXSiteTenant.trim()) userVariables['x-site-tenant'] = debugUserVariableXSiteTenant.trim();
    if (debugUserVariableXTenantId.trim()) userVariables['x-tenant-id'] = debugUserVariableXTenantId.trim();
    if (debugUserVariableXApp.trim()) userVariables['x-app'] = debugUserVariableXApp.trim();
    if (nodeConfigToSend && Object.keys(userVariables).length > 0) {
      nodeConfigToSend = {
        ...nodeConfigToSend,
        headers: { ...(nodeConfigToSend.headers || {}), ...userVariables },
      };
    }

    const debugLog: ExecutionLog = {
      id: Date.now().toString(),
      nodeId: node.id,
      name: node.name,
      status: 'running',
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      description: `正在调试 ${node.type.toUpperCase()} 节点...`,
    };
    setIsExecuting(true);
    setIsExecutionDrawerOpen(true);
    setExecutionLogs([debugLog]);

    try {
      const response = await workflowService.debugPublicNode(projectId, node.id, nodeConfigToSend, {
        userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
        nodeType: node.type,
        nodeName: node.name,
      });
      const runId = response?.runId ?? response?.data?.runId;
      if (response?.success === false || !runId) {
        setExecutionLogs([{
          ...debugLog,
          status: 'failed',
          description: response?.message ?? '调试节点失败：无法获取运行ID',
          duration: 0,
        }]);
        toast.error(response?.message ?? '调试节点失败');
        setIsExecuting(false);
        return;
      }

      setExecutionLogs([{
        ...debugLog,
        status: 'pending',
        description: '任务已提交，等待执行机执行...',
        runId,
      }]);

      if (debugPollIntervalRef.current) clearInterval(debugPollIntervalRef.current);
      const statusMap: Record<string, ExecutionLog['status']> = {
        PENDING: 'pending', RUNNING: 'running', SUCCESS: 'success', SUCCEED: 'success',
        FAILED: 'failed', FAIL: 'failed', SKIPPED: 'skipped',
      };
      const pollInterval = setInterval(async () => {
        try {
          const detail = await workflowService.getRunDetail(runId);
          if (!detail) return;
          if (detail.steps?.length > 0) {
            const step = detail.steps.find((s: any) => s.stepId === node.id);
            if (step) {
              const stepStatus = statusMap[step.status] ?? 'pending';
              const stepDetail: ExecutionLog['stepDetail'] = {
                requestData: step.requestData,
                responseData: step.responseData,
                assertion: step.assertion,
                extractVars: step.extractVars,
                errorMsg: step.errorMsg,
                errorStack: step.errorStack,
              };
              setExecutionLogs([{
                ...debugLog,
                status: stepStatus,
                description: step.errorMsg || step.description ||
                  (stepStatus === 'success' ? `${node.type.toUpperCase()} 节点调试成功` :
                    stepStatus === 'failed' ? `${node.type.toUpperCase()} 节点调试失败` : `${node.type.toUpperCase()} 节点执行中...`),
                duration: step.durationMs ?? 0,
                runId,
                runStepId: step.runStepId,
                stepDetail,
              }]);
              if (stepStatus === 'success' || stepStatus === 'failed') {
                clearInterval(pollInterval);
                debugPollIntervalRef.current = null;
                setIsExecuting(false);
              }
            }
          }
          if (detail.status === 'SUCCESS' || detail.status === 'SUCCEED' || detail.status === 'FAILED' || detail.status === 'FAIL') {
            clearInterval(pollInterval);
            debugPollIntervalRef.current = null;
            setIsExecuting(false);
          }
        } catch (_) {}
      }, 1000);
      debugPollIntervalRef.current = pollInterval;
      setTimeout(() => {
        if (debugPollIntervalRef.current === pollInterval) {
          clearInterval(pollInterval);
          debugPollIntervalRef.current = null;
        }
        setIsExecuting(false);
      }, 60000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (e as { message?: string })?.message
        ?? '调试节点失败';
      setExecutionLogs([{
        ...debugLog,
        status: 'failed',
        description: `调试失败: ${msg}`,
        duration: 0,
      }]);
      toast.error(msg);
      setIsExecuting(false);
    }
  }, [editingNodeData, projectId, debugExecutionEnvironmentId, debugUserVariableXTagHeader, debugUserVariableXSiteTenant, debugUserVariableXTenantId, debugUserVariableXApp]);

  const handlePanelConfigChange = useCallback((_nodeId: string, config: NodeConfig) => {
    setEditingNodeData((prev) => (prev ? { ...prev, config } : null));
  }, []);

  const handlePanelNameChange = useCallback((_nodeId: string, name: string) => {
    setEditingNodeData((prev) => (prev ? { ...prev, name } : null));
  }, []);

  const handlePanelSave = useCallback(async () => {
    if (!editingNodeData || !projectId) return;
    const meta = NODE_META_REGISTRY[editingNodeData.type];
    try {
      await workflowService.savePublicNode({
        id: editingNodeData.id,
        projectId,
        name: editingNodeData.name,
        description: editingNodeData.description,
        type: editingNodeData.type,
        category: meta?.category ?? 'other',
        config: editingNodeData.config ?? {},
      });
      toast.success('保存成功');
      closeDetail();
      loadList();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (e as { message?: string })?.message
        ?? '保存失败';
      toast.error(msg);
    }
  }, [editingNodeData, projectId, closeDetail, loadList]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const deleteTargetName = deleteTargetId ? list.find((n) => n.id === deleteTargetId)?.name ?? '' : '';

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-gray-50 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">公共节点管理</h1>
              <p className="text-sm text-gray-500 mt-0.5">查看、编辑、删除项目内公共节点</p>
            </div>
          </div>
        </div>

        {/* 搜索与筛选：表单区域更醒目 */}
        <div className="mt-4 rounded-lg border-2 border-gray-200 bg-gray-50/80 px-4 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="搜索名称或描述..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-10 pl-10 border-2 border-gray-200 bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">项目</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 min-w-[180px] justify-between border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <span className="truncate">
                      {selectedProjectIds.length === 0
                        ? '请选择项目'
                        : selectedProjectIds.length === 1
                          ? (projectOptions.find((p) => p.id === selectedProjectIds[0])?.name ?? selectedProjectIds[0])
                          : `已选 ${selectedProjectIds.length} 项`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="start">
                  <ScrollArea className="h-[280px]">
                    <div className="p-2 space-y-1">
                      {projectOptions.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedProjectIds.includes(p.id)}
                            onCheckedChange={(checked) => {
                              setSelectedProjectIds((prev) =>
                                checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                              );
                            }}
                          />
                          <span className="text-sm truncate">{p.name}</span>
                        </label>
                      ))}
                      {projectOptions.length === 0 && (
                        <p className="text-sm text-gray-500 py-4 text-center">暂无项目</p>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">分类</span>
              <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[160px] h-10 border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  {PUBLIC_NODE_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto bg-white mx-6 mt-4 rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[120px]">类型</TableHead>
              <TableHead className="w-[100px]">分类</TableHead>
              <TableHead className="w-[180px]">更新时间</TableHead>
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  加载中...
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Star className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-500">暂无公共节点</p>
                    <p className="text-sm text-gray-400">在工作流画布中将节点保存为公共节点后，会在此展示</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item: PublicNodeItem) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="text-left text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      onClick={() => openDetail(item)}
                    >
                      {item.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-600 max-w-[280px] truncate" title={item.description}>
                    {item.description || '—'}
                  </TableCell>
                  <TableCell className="text-gray-600">{getTypeDisplayName(item.type)}</TableCell>
                  <TableCell className="text-gray-600">{item.category ?? '—'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatTimestampBeijing(item.updateTime ?? item.createTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openDetail(item)}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openDetail(item)}
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDelete(item.id)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              共 {total} 条，第 {current} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={current <= 1}
                onClick={() => setCurrent((c) => Math.max(1, c - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={current >= totalPages}
                onClick={() => setCurrent((c) => Math.min(totalPages, c + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>编辑公共节点</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">名称 *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="节点名称"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">描述</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="可选"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              取消
            </Button>
            <Button onClick={saveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && closeDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除公共节点「{deleteTargetName}」吗？此操作不可恢复。已引用该节点的工作流中的节点不会受影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 节点编辑侧滑：与画布内一致的完整配置面板（Sheet 基于 Dialog，需提供 Title/Description 以满足无障碍） */}
      <Sheet open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden" showCloseButton={false} aria-describedby={undefined}>
          <SheetTitle className="sr-only">节点详情</SheetTitle>
          {editingNodeData ? (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                <NodeFormPanel
                  node={editingNodeData}
                  onClose={closeDetail}
                  onChange={handlePanelConfigChange}
                  onNameChange={handlePanelNameChange}
                  onSave={handlePanelSave}
                  projectId={projectId ?? undefined}
                  onDebugNode={handleDebugNode}
                />
              </div>
              {detailItem && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      closeDetail();
                      openDelete(detailItem.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除此公共节点
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ExecutionEnvironmentDialog
        open={isDebugEnvDialogOpen}
        onOpenChange={(open) => {
          setIsDebugEnvDialogOpen(open);
          if (!open) setDebugExecutionEnvironmentId('');
        }}
        pendingExecutionType="debug"
        executionEnvironmentId={debugExecutionEnvironmentId}
        setExecutionEnvironmentId={setDebugExecutionEnvironmentId}
        loadingProfiles={loadingEngineProfiles}
        engineProfiles={engineProfiles}
        userVariableXTagHeader={debugUserVariableXTagHeader}
        setUserVariableXTagHeader={setDebugUserVariableXTagHeader}
        userVariableXSiteTenant={debugUserVariableXSiteTenant}
        setUserVariableXSiteTenant={setDebugUserVariableXSiteTenant}
        userVariableXTenantId={debugUserVariableXTenantId}
        setUserVariableXTenantId={setDebugUserVariableXTenantId}
        userVariableXApp={debugUserVariableXApp}
        setUserVariableXApp={setDebugUserVariableXApp}
        onConfirm={handleConfirmDebug}
      />

      <ExecutionLogDrawer
        open={isExecutionDrawerOpen}
        onOpenChange={setIsExecutionDrawerOpen}
        logs={executionLogs}
        isExecuting={isExecuting}
        debugMode="single"
        debugNodeId={editingNodeData?.id ?? null}
        onClearLogs={() => setExecutionLogs([])}
        onUpdateLogs={(updater) => setExecutionLogs(updater)}
      />
    </div>
  );
}
