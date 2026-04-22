/**
 * 拨测管理 - 任务管理（来自 spotter-aegislm manage）
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { jobApi, executorApi, type JobItem, type ExecutorItem } from '@/services/dial-management';
import { TaskAddDialog, TaskEditDialog, TaskDetailDrawer } from './dialogs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export function TaskManageView() {
  const [filters, setFilters] = useState({ jobName: '', executorsName: '' });
  const [list, setList] = useState<JobItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [executors, setExecutors] = useState<ExecutorItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<JobItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<JobItem | null>(null);

  const loadExecutors = useCallback(async () => {
    try {
      const res = await executorApi.list({ page: 1, size: 100 });
      if (res?.data) setExecutors(res.data);
    } catch {
      toast.error('获取执行器列表失败');
    }
  }, []);

  const loadList = useCallback(async (p = page, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await jobApi.list({
        page: p,
        size: PAGE_SIZE,
        jobName: filters.jobName || undefined,
        executorsName: filters.executorsName || undefined,
      });
      if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
        const data = (res as any).data as JobItem[];
        const totalCount = (res as any).total ?? data.length;
        setList(
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
        setTotal(totalCount);
        setPage(p);
      }
    } catch (e) {
      toast.error((e as Error).message || '加载任务列表失败');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, filters.jobName, filters.executorsName]);

  useEffect(() => {
    loadExecutors();
  }, [loadExecutors]);

  useEffect(() => {
    loadList(1);
  }, [filters.jobName, filters.executorsName]);

  const onSearch = () => loadList(1);
  const onReset = () => {
    setFilters({ jobName: '', executorsName: '' });
    setPage(1);
    setTimeout(() => loadList(1), 0);
  };

  const handleRun = async (row: JobItem) => {
    try {
      await jobApi.execute({ id: row.id });
      toast.success('执行成功');
      loadList(page);
    } catch {
      toast.error('执行失败');
    }
  };

  const toggleStatus = async (row: JobItem) => {
    const action = row.status === 'pause' ? '启用' : '暂停';
    const newStatus = row.status === 'pause' ? 'run' : 'pause';
    const newStatusName = action;
    const oldList = [...list];

    // Optimistic Update
    setList((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: newStatus as any, statusName: newStatusName } : r
      )
    );

    try {
      if (row.status === 'pause') await jobApi.resume({ id: row.id });
      else await jobApi.stop({ id: row.id });
      toast.success(`${action}成功`);
      loadList(page, true);
    } catch {
      toast.error(`${action}失败`);
      setList(oldList);
    }
  };

  const refreshList = () => loadList(page);

  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); onSearch(); }}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">任务名称</span>
          <Input
            className="h-9 w-[200px]"
            placeholder="请输入"
            value={filters.jobName}
            onChange={(e) => setFilters((f) => ({ ...f, jobName: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">执行器</span>
          <Select
            value={filters.executorsName || 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, executorsName: v === 'all' ? '' : v }))}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {executors.map((e) => (
                <SelectItem key={e.id} value={e.executorsName}>
                  {e.executorsName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <div className="flex items-center gap-2">
          <Button type="submit">查询</Button>
          <Button type="button" variant="outline" onClick={onReset}>重置</Button>
        </div>
        <Button type="button" className="ml-auto" onClick={() => setAddOpen(true)}>+ 新建</Button>
      </form>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="w-[100px]">任务ID</TableHead>
              <TableHead>任务名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>执行器</TableHead>
              <TableHead>Cron</TableHead>
              <TableHead>任务模式</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              list.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => { setDetailRow(row); setDetailOpen(true); }}
                >
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell>{row.jobName}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={row.status !== 'pause'}
                      onCheckedChange={() => toggleStatus(row)}
                      aria-label="切换状态"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {row.executorsName || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[140px] truncate" title={row.cron}>
                    {row.cron ?? '-'}
                  </TableCell>
                  <TableCell>{(row as any).mode ?? '-'}</TableCell>
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
                        onClick={() => { setEditRow(row); setEditOpen(true); }}
                      >
                        编辑
                      </Button>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-primary font-medium"
                      onClick={() => { setDetailRow(row); setDetailOpen(true); }}
                    >
                      详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total > PAGE_SIZE && (
          <div className="flex justify-end p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => loadList(page - 1)}
            >
              上一页
            </Button>
            <span className="mx-3 flex items-center text-sm text-gray-600">
              {page} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
              onClick={() => loadList(page + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
      <TaskAddDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={refreshList} />
      <TaskEditDialog open={editOpen} onOpenChange={setEditOpen} row={editRow} onSuccess={refreshList} />
      <TaskDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} row={detailRow} />
    </div>
  );
}
