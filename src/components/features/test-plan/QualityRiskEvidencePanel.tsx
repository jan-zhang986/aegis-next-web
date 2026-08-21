import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bug, CircleDashed, Loader2, Paperclip, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { qualityWorkspaceService, type QualityTask, type QualityWorkItem } from '@/services/quality-workspace';
import { cn } from '@/utils/cn';
import { QualityWorkItemDrawer } from './QualityWorkItemDrawer';

interface QualityRiskEvidencePanelProps {
  workspaceId: string;
  projectId: string;
  canEdit?: boolean;
  onChanged?: () => void;
}

function unwrap<T>(res: any): T {
  return (res?.data ?? res) as T;
}

function extractRecords(res: any): any[] {
  const data = unwrap<any>(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function isFailed(item: QualityWorkItem) {
  return ['FAIL', 'FAILED', 'ERROR'].includes(item.result || '') || ['FAIL', 'FAILED'].includes(item.status || '');
}

function isBlocked(item: QualityWorkItem) {
  return item.result === 'BLOCKED' || item.status === 'BLOCKED' || item.runtimeSnapshot?.isBlocked === true;
}

function isUnexecuted(item: QualityWorkItem) {
  return !item.result || ['TODO', 'PENDING', 'READY'].includes(item.status || '');
}

function evidenceCount(item: QualityWorkItem) {
  return item.evidenceCount ?? item.runtimeSnapshot?.commentFileIds?.length ?? item.runtimeSnapshot?.uploadFileIds?.length ?? 0;
}

export function QualityRiskEvidencePanel({ workspaceId, projectId, canEdit = true, onChanged }: QualityRiskEvidencePanelProps) {
  const [tasks, setTasks] = useState<QualityTask[]>([]);
  const [items, setItems] = useState<QualityWorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<QualityWorkItem | null>(null);

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const taskList = unwrap<QualityTask[]>(await qualityWorkspaceService.getTaskList(workspaceId)) || [];
      setTasks(taskList);
      const pages = await Promise.all(
        taskList.map(async (task) => {
          const res = await qualityWorkspaceService.getWorkItemPage({
            workspaceId,
            taskId: task.taskId,
            projectId,
            current: 1,
            pageSize: 200,
          });
          return extractRecords(res).map((item) => ({
            ...item,
            taskId: item.taskId || task.taskId,
            taskTitle: task.title || task.name,
            taskType: task.taskType,
          }));
        })
      );
      setItems(pages.flat());
    } catch (error) {
      console.error(error);
      toast.error('加载风险证据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const failed = useMemo(() => items.filter(isFailed), [items]);
  const blocked = useMemo(() => items.filter(isBlocked), [items]);
  const unexecuted = useMemo(() => items.filter(isUnexecuted), [items]);
  const evidenceTotal = useMemo(() => items.reduce((sum, item) => sum + evidenceCount(item), 0), [items]);
  const riskItems = useMemo(() => {
    const seen = new Set<string>();
    return [...blocked, ...failed].filter((item) => {
      const id = item.workItemId || item.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [blocked, failed]);

  const openItem = (item: QualityWorkItem) => {
    setActiveItem(item);
    setDrawerOpen(true);
  };

  const handleChanged = async () => {
    await load();
    onChanged?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/60 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Risk & Evidence</div>
          <h3 className="mt-1 text-2xl font-black text-slate-900">风险证据</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            这里从质量任务的 WorkItem 聚合失败、阻塞和未执行项。证据第一版复用评论附件，不新增独立 evidence 表。
          </p>
        </div>
        <Button variant="outline" className="rounded-xl bg-white" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          刷新
        </Button>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Card className="rounded-3xl border-rose-100 bg-rose-50/70 p-5">
          <Bug className="mb-3 h-5 w-5 text-rose-500" />
          <div className="text-3xl font-black text-rose-700">{failed.length}</div>
          <div className="mt-1 text-xs font-bold text-rose-500">失败执行项</div>
        </Card>
        <Card className="rounded-3xl border-amber-100 bg-amber-50/70 p-5">
          <ShieldAlert className="mb-3 h-5 w-5 text-amber-500" />
          <div className="text-3xl font-black text-amber-700">{blocked.length}</div>
          <div className="mt-1 text-xs font-bold text-amber-500">阻塞执行项</div>
        </Card>
        <Card className="rounded-3xl border-slate-200 bg-white p-5">
          <CircleDashed className="mb-3 h-5 w-5 text-slate-400" />
          <div className="text-3xl font-black text-slate-800">{unexecuted.length}</div>
          <div className="mt-1 text-xs font-bold text-slate-400">未执行项</div>
        </Card>
        <Card className="rounded-3xl border-blue-100 bg-blue-50/70 p-5">
          <Paperclip className="mb-3 h-5 w-5 text-blue-500" />
          <div className="text-3xl font-black text-blue-700">{evidenceTotal}</div>
          <div className="mt-1 text-xs font-bold text-blue-500">证据附件</div>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="min-h-0 rounded-3xl border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-black text-slate-900">失败 / 阻塞风险项</div>
            <Badge variant="outline" className="rounded-lg bg-slate-50 font-bold">{riskItems.length}</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-470px)] pr-2">
            <div className="space-y-3">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在聚合风险
                </div>
              ) : riskItems.length ? (
                riskItems.map((item) => (
                  <button
                    key={item.workItemId || item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      'w-full rounded-3xl border p-4 text-left transition-all hover:shadow-md',
                      isBlocked(item) ? 'border-amber-200 bg-amber-50/70' : 'border-rose-200 bg-rose-50/70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-black text-slate-900">{item.title || '未命名执行项'}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                          <span>{item.taskTitle || item.taskType || '测试任务'}</span>
                          <span>执行人：{item.assigneeName || item.assigneeId || '未分派'}</span>
                          <span>证据：{evidenceCount(item)}</span>
                        </div>
                        {(item.runtimeSnapshot?.blockReason || item.runtimeSnapshot?.content) && (
                          <div className="mt-3 line-clamp-2 text-xs font-bold text-amber-700">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            {item.runtimeSnapshot.blockReason || item.runtimeSnapshot.content}
                          </div>
                        )}
                      </div>
                      <Badge className={cn('rounded-lg font-bold', isBlocked(item) ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')}>
                        {isBlocked(item) ? 'BLOCKED' : item.result || 'FAIL'}
                      </Badge>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                  <div className="text-lg font-black text-slate-900">暂无高风险项</div>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    当 WorkItem 执行失败或阻塞时，会自动聚合到这里，方便准出前集中处理。
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="rounded-3xl border-dashed border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-black text-slate-900">门禁结果预留区</div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            门禁绑定属于测试资产服务，工作台只消费运行结果。后续这里会展示 Suite / Realization / Workflow 的门禁运行摘要，而不会在工作台里配置门禁规则。
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500">
            当前任务数：{tasks.length}
            <br />
            当前执行项：{items.length}
            <br />
            风险项：{riskItems.length}
          </div>
        </Card>
      </div>

      <QualityWorkItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        workspaceId={workspaceId}
        taskId={activeItem?.taskId || ''}
        projectId={projectId}
        workItem={activeItem}
        canEdit={canEdit}
        onChanged={handleChanged}
      />
    </div>
  );
}
