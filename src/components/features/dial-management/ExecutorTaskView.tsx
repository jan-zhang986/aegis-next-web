/**
 * 拨测管理 - 任务管理（整合页）
 * 左侧执行器列表，右侧该执行器下的任务列表；新建执行器/新建任务均在本页完成，类似菜单管理
 */
import { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { jobApi, executorApi, type JobItem, type ExecutorItem } from '@/services/dial-management';
import { ExecutorAddDialog, ExecutorEditDialog, TaskAddDialog, TaskEditDialog, TaskDetailDrawer } from './dialogs';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { Plus, Pencil } from 'lucide-react';

const TASK_PAGE_SIZE = 20;

export function ExecutorTaskView() {
  const [executors, setExecutors] = useState<ExecutorItem[]>([]);
  const [executorsLoading, setExecutorsLoading] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useState<ExecutorItem | null>(null);

  const [taskFilters, setTaskFilters] = useState({ jobName: '' });
  const [taskList, setTaskList] = useState<JobItem[]>([]);
  const [taskTotal, setTaskTotal] = useState(0);
  const [taskPage, setTaskPage] = useState(1);
  const [taskLoading, setTaskLoading] = useState(false);

  const [executorAddOpen, setExecutorAddOpen] = useState(false);
  const [executorEditOpen, setExecutorEditOpen] = useState(false);
  const [executorEditRow, setExecutorEditRow] = useState<ExecutorItem | null>(null);
  const [taskAddOpen, setTaskAddOpen] = useState(false);
  const [taskEditOpen, setTaskEditOpen] = useState(false);
  const [taskEditRow, setTaskEditRow] = useState<JobItem | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [taskDetailRow, setTaskDetailRow] = useState<JobItem | null>(null);

  const loadExecutors = useCallback(async () => {
    setExecutorsLoading(true);
    try {
      const res = await executorApi.list({ page: 1, size: 500 });
      if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
        setExecutors((res as any).data ?? []);
      }
    } catch {
      toast.error('获取执行器列表失败');
    } finally {
      setExecutorsLoading(false);
    }
  }, []);

  const loadTasks = useCallback(
    async (p = 1, silent = false) => {
      if (!silent) setTaskLoading(true);
      try {
        const res = await jobApi.list({
          page: p,
          size: TASK_PAGE_SIZE,
          jobName: taskFilters.jobName || undefined,
          executorsName: selectedExecutor?.executorsName ?? undefined,
        });
        if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
          const data = (res as any).data as JobItem[];
          const totalCount = (res as any).total ?? data.length;
          setTaskList(
            data.map((item) => ({
              ...item,
              statusName: item.status === 'pause' ? '暂停' : '启用',
              mode: item.jobFeatures?.model === 'script' ? '脚本' : 'curl',
              funcArgs: item.jobFeatures?.funcArgs,
              funcKwargs: item.jobFeatures?.funcKwargs
                ? JSON.stringify(item.jobFeatures.funcKwargs)
                : '',
              cron: item.jobFeatures?.cron,
              detailId: item.jobFeatures?.id,
            }))
          );
          setTaskTotal(totalCount);
          setTaskPage(p);
        }
      } catch (e) {
        toast.error((e as Error).message || '加载任务列表失败');
      } finally {
        if (!silent) setTaskLoading(false);
      }
    },
    [selectedExecutor, taskFilters.jobName]
  );

  useEffect(() => {
    loadExecutors();
  }, [loadExecutors]);

  // 执行器列表刷新后同步选中的执行器（避免编辑后名称不更新）
  useEffect(() => {
    if (selectedExecutor && executors.length) {
      const next = executors.find((e) => e.id === selectedExecutor.id);
      if (next) setSelectedExecutor(next);
    }
  }, [executors]);

  useEffect(() => {
    loadTasks(1);
  }, [loadTasks]);

  const handleRun = async (row: JobItem) => {
    try {
      await jobApi.execute({ id: row.id });
      toast.success('执行成功');
      loadTasks(taskPage);
    } catch {
      toast.error('执行失败');
    }
  };

  const toggleTaskStatus = async (row: JobItem) => {
    const action = row.status === 'pause' ? '启用' : '暂停';
    const newStatus = row.status === 'pause' ? 'run' : 'pause';
    const newStatusName = action;
    const oldTaskList = [...taskList];

    // Optimistic Update
    setTaskList((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: newStatus, statusName: newStatusName } : r
      )
    );

    try {
      if (row.status === 'pause') await jobApi.resume({ id: row.id });
      else await jobApi.stop({ id: row.id });
      toast.success(`${action}成功`);
      loadTasks(taskPage, true);
    } catch {
      toast.error(`${action}失败`);
      setTaskList(oldTaskList);
    }
  };

  const refreshTasks = () => loadTasks(taskPage);

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* 左侧：执行器列表（高度与右侧表格区域一致，列表内部滚动） */}
      <aside className="w-60 shrink-0 min-h-0 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">执行器</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-gray-200 text-gray-600 hover:bg-white"
            onClick={() => setExecutorAddOpen(true)}
          >
            <Plus className="size-3.5" />
            新建
          </Button>
        </div>
        <div className="flex-1 overflow-auto min-h-0 py-2">
          {executorsLoading ? (
            <div className="py-8 text-center text-sm text-gray-400">加载中...</div>
          ) : executors.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">暂无执行器</div>
          ) : (
            <nav className="px-2 space-y-0.5">
              {executors.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150',
                    selectedExecutor?.id === e.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 truncate text-left font-medium"
                    onClick={() => setSelectedExecutor(e)}
                  >
                    {e.executorsName}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 w-7 p-0 shrink-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
                      selectedExecutor?.id === e.id ? 'text-primary-foreground hover:bg-white/20' : 'hover:bg-gray-200/80'
                    )}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setExecutorEditRow(e);
                      setExecutorEditOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              ))}
            </nav>
          )}
        </div>
      </aside>

      {/* 右侧：任务列表（未选执行器时显示全部，选中时按执行器筛选） */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-5">
        <>
          <form
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
            onSubmit={(e) => { e.preventDefault(); loadTasks(1); }}
          >
            <Button
              type="button"
              variant={selectedExecutor ? 'outline' : 'secondary'}
              size="sm"
              className="rounded-lg h-9 shrink-0"
              onClick={() => {
                setSelectedExecutor(null);
                setTaskFilters((f) => ({ ...f, jobName: '' }));
              }}
            >
              全部任务
            </Button>
            {selectedExecutor && (
              <span className="text-sm text-gray-500 shrink-0">
                当前：<span className="font-medium text-gray-800">{selectedExecutor.executorsName}</span>
              </span>
            )}
            <div className="h-8 w-px bg-gray-200 shrink-0" aria-hidden />
            <Input
              className="h-9 w-[200px] rounded-lg border-gray-200"
              placeholder="任务名称"
              value={taskFilters.jobName}
              onChange={(e) => setTaskFilters((f) => ({ ...f, jobName: e.target.value }))}
            />
            <Button type="submit" size="sm" className="rounded-lg h-9">
              查询
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg h-9"
              onClick={() => {
                setTaskFilters((f) => ({ ...f, jobName: '' }));
                loadTasks(1);
              }}
            >
              重置
            </Button>
            <Button type="button" size="sm" className="ml-auto rounded-lg h-9" onClick={() => setTaskAddOpen(true)}>
              + 新建任务
            </Button>
          </form>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60 border-b border-gray-100">
                    <TableHead className="w-[100px]">任务ID</TableHead>
                    <TableHead>任务名称</TableHead>
                    {!selectedExecutor && <TableHead>执行器</TableHead>}
                    <TableHead>openId</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>Cron</TableHead>
                    <TableHead>任务模式</TableHead>
                    <TableHead>任务参数</TableHead>
                    <TableHead>额外参数</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskLoading ? (
                    <TableRow>
                      <TableCell colSpan={selectedExecutor ? 9 : 10} className="text-center text-gray-500 py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : taskList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedExecutor ? 9 : 10} className="text-center text-gray-500 py-8">
                        暂无任务
                      </TableCell>
                    </TableRow>
                  ) : (
                    taskList.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => { setTaskDetailRow(row); setTaskDetailOpen(true); }}
                      >
                        <TableCell className="font-mono text-xs text-gray-600">{row.id}</TableCell>
                        <TableCell>{row.jobName}</TableCell>
                        {!selectedExecutor && (
                          <TableCell className="text-gray-600">{row.executorsName ?? '-'}</TableCell>
                        )}
                        <TableCell className="text-gray-600">{row.openId ?? '-'}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={row.status !== 'pause'}
                            onCheckedChange={() => toggleTaskStatus(row)}
                            aria-label="切换状态"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[140px] truncate" title={row.cron}>
                          {row.cron ?? '-'}</TableCell>
                        <TableCell>
                          {(row as any).mode ? (
                            <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                              {(row as any).mode}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={row.funcArgs}>
                          {row.funcArgs || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={row.funcKwargs}>
                          {row.funcKwargs || '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary font-medium"
                            onClick={() => handleRun(row)}
                          >
                            执行
                          </Button>
                          {row.status === 'pause' && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary font-medium"
                              onClick={() => {
                                setTaskEditRow(row);
                                setTaskEditOpen(true);
                              }}
                            >
                              编辑
                            </Button>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary font-medium"
                            onClick={() => {
                              setTaskDetailRow(row);
                              setTaskDetailOpen(true);
                            }}
                          >
                            详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {taskTotal > TASK_PAGE_SIZE && (
              <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-100 bg-gray-50/30">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={taskPage <= 1}
                  onClick={() => loadTasks(taskPage - 1)}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600 min-w-[80px] text-center">
                  {taskPage} / {Math.ceil(taskTotal / TASK_PAGE_SIZE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={taskPage >= Math.ceil(taskTotal / TASK_PAGE_SIZE)}
                  onClick={() => loadTasks(taskPage + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        </>
      </div>

      <ExecutorAddDialog
        open={executorAddOpen}
        onOpenChange={setExecutorAddOpen}
        onSuccess={() => {
          loadExecutors();
        }}
      />
      <ExecutorEditDialog
        open={executorEditOpen}
        onOpenChange={setExecutorEditOpen}
        row={executorEditRow}
        onSuccess={() => loadExecutors()}
      />
      <TaskAddDialog
        open={taskAddOpen}
        onOpenChange={setTaskAddOpen}
        onSuccess={refreshTasks}
        defaultExecutorsCode={selectedExecutor?.executorsCode}
      />
      <TaskEditDialog
        open={taskEditOpen}
        onOpenChange={setTaskEditOpen}
        row={taskEditRow}
        onSuccess={refreshTasks}
      />
      <TaskDetailDrawer
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        row={taskDetailRow}
      />
    </div>
  );
}
