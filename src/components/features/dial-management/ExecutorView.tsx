/**
 * 拨测管理 - 执行器管理（来自 spotter-aegislm control）
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { executorApi, type ExecutorItem } from '@/services/dial-management';
import { ExecutorAddDialog, ExecutorEditDialog } from './dialogs';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function ExecutorView() {
  const [filters, setFilters] = useState({
    executorsName: '',
    executorsCode: '',
    service: '',
  });
  const [list, setList] = useState<ExecutorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<ExecutorItem | null>(null);

  const loadList = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await executorApi.list({
        page: p,
        size: PAGE_SIZE,
        ...filters,
      });
      if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
        setList((res as any).data);
        setTotal((res as any).total ?? 0);
        setPage(p);
      }
    } catch (e) {
      toast.error((e as Error).message || '加载执行器列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters.executorsName, filters.executorsCode, filters.service]);

  useEffect(() => {
    loadList(1);
  }, [filters.executorsName, filters.executorsCode, filters.service]);

  const onSearch = () => loadList(1);
  const onReset = () => {
    setFilters({ executorsName: '', executorsCode: '', service: '' });
    setPage(1);
    setTimeout(() => loadList(1), 0);
  };

  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); onSearch(); }}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">执行器名称</span>
          <Input
            className="h-9 w-[180px]"
            placeholder="请输入"
            value={filters.executorsName}
            onChange={(e) => setFilters((f) => ({ ...f, executorsName: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">执行器编码</span>
          <Input
            className="h-9 w-[180px]"
            placeholder="请输入"
            value={filters.executorsCode}
            onChange={(e) => setFilters((f) => ({ ...f, executorsCode: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">服务</span>
          <Input
            className="h-9 w-[180px]"
            placeholder="请输入"
            value={filters.service}
            onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))}
          />
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
              <TableHead className="w-[120px]">执行器ID</TableHead>
              <TableHead>执行器名称</TableHead>
              <TableHead>执行器编码</TableHead>
              <TableHead>服务</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell>{row.executorsName}</TableCell>
                  <TableCell>{row.executorsCode}</TableCell>
                  <TableCell>{row.service}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary font-medium" onClick={() => { setEditRow(row); setEditOpen(true); }}>
                      编辑
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total > PAGE_SIZE && (
          <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-200/80 bg-gray-50/50">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadList(page - 1)}>上一页</Button>
            <span className="text-sm text-gray-600 min-w-[80px] text-center">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => loadList(page + 1)}>下一页</Button>
          </div>
        )}
      </div>
      <ExecutorAddDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => loadList(1)} />
      <ExecutorEditDialog open={editOpen} onOpenChange={setEditOpen} row={editRow} onSuccess={() => loadList(page)} />
    </div>
  );
}
