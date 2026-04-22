/**
 * 拨测管理 - 鉴权账号（来自 spotter-aegislm account）
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { accountApi, type AccountItem } from '@/services/dial-management';
import { AccountAddDialog, AccountEditDialog } from './dialogs';
import { toast } from 'sonner';
import { APP_OPTIONS } from './constants';

const PAGE_SIZE = 20;

export function AccountView() {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<AccountItem | null>(null);
  const [filters, setFilters] = useState<{
    accountTitle: string;
    baseUrl: string;
    appCode: string;
    isActive: number | null;
  }>({ accountTitle: '', baseUrl: '', appCode: '', isActive: null });
  const [list, setList] = useState<AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params: any = {
        currentPage: p,
        pageSize: PAGE_SIZE,
        accountTitle: filters.accountTitle ?? '',
        appCode: filters.appCode ?? '',
      };
      if (filters.baseUrl) params.baseUrl = filters.baseUrl;
      if (filters.isActive !== null) params.isActive = filters.isActive;
      const res = await accountApi.page(params);
      if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
        const data = (res as any).data as AccountItem[];
        setList(
          data.map((item) => ({
            ...item,
            status: item.isActive === 0 ? '禁用' : '启用',
            ...item.accountFeatures,
          }))
        );
        setTotal((res as any).total ?? 0);
        setPage(p);
      }
    } catch (e) {
      toast.error((e as Error).message || '加载账号列表失败');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters.accountTitle, filters.baseUrl, filters.appCode, filters.isActive]);

  useEffect(() => {
    loadList(1);
  }, [filters.accountTitle, filters.baseUrl, filters.appCode, filters.isActive]);

  const onSearch = () => loadList(1);
  const onReset = () => {
    setFilters({ accountTitle: '', baseUrl: '', appCode: '', isActive: null });
    setPage(1);
    setTimeout(() => loadList(1), 0);
  };

  const toggleStatus = async (row: AccountItem) => {
    const newIsActive = row.isActive === 1 ? 0 : 1;
    const oldList = [...list];
    setList(prev => prev.map(r => r.id === row.id ? { ...r, isActive: newIsActive, status: newIsActive === 1 ? '启用' : '禁用' } : r));

    try {
      await accountApi.modify({
        id: row.id,
        accountTitle: row.accountTitle,
        accountFeatures: {
          user: row.user,
          password: row.password,
          callbackUrl: row.callbackUrl,
          features: {},
          defaultRouterPath: row.defaultRouterPath,
          webAuthenticationPath: row.webAuthenticationPath,
          apiAuthenticationPath: row.apiAuthenticationPath,
          apiUrl: row.apiUrl,
        },
        baseUrl: row.baseUrl,
        appCode: row.appCode,
        isActive: newIsActive,
      });
      toast.success(newIsActive === 1 ? '启用成功' : '停用成功');
      loadList(page, true);
    } catch {
      toast.error('操作失败');
      setList(oldList);
    }
  };

  const handleDelete = async (row: AccountItem) => {
    if (!confirm('确定删除该账号？')) return;
    try {
      await accountApi.delete(row.id);
      toast.success('删除成功');
      loadList(page);
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); onSearch(); }}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">账号名称</span>
          <Input
            className="h-9 w-[180px]"
            placeholder="请输入"
            value={filters.accountTitle}
            onChange={(e) => setFilters((f) => ({ ...f, accountTitle: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">平台地址</span>
          <Input
            className="h-9 w-[200px]"
            placeholder="请输入"
            value={filters.baseUrl}
            onChange={(e) => setFilters((f) => ({ ...f, baseUrl: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">应用</span>
          <Select
            value={filters.appCode || 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, appCode: v === 'all' ? '' : v }))}
          >
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {APP_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-500 font-medium">状态</span>
          <Select
            value={filters.isActive === null ? 'all' : String(filters.isActive)}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, isActive: v === 'all' ? null : Number(v) }))
            }
          >
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="1">启用</SelectItem>
              <SelectItem value="0">禁用</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="flex items-center gap-2">
          <Button type="submit">查询</Button>
          <Button type="button" variant="outline" onClick={onReset}>重置</Button>
        </div>
        <Button type="button" className="ml-auto" onClick={() => setAddOpen(true)}>新建账号</Button>
      </form>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-200">
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-none h-11">
              <TableHead scope="col" className="font-medium text-gray-500">账号名称</TableHead>
              <TableHead scope="col" className="font-medium text-gray-500">应用</TableHead>
              <TableHead scope="col" className="font-medium text-gray-500">平台地址</TableHead>
              <TableHead scope="col" className="font-medium text-gray-500">账号</TableHead>
              <TableHead scope="col" className="font-medium text-gray-500">创建时间</TableHead>
              <TableHead scope="col" className="font-medium text-gray-500">更新时间</TableHead>
              <TableHead scope="col" className="font-medium text-gray-500">状态</TableHead>
              <TableHead scope="col" className="text-right font-medium text-gray-500">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                  <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 加载中...</span>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center text-gray-500 py-12">暂无数据</TableCell>
              </TableRow>
            ) : (
              list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.accountTitle}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {row.appCode || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={row.baseUrl}>
                    {row.baseUrl}
                  </TableCell>
                  <TableCell>{row.user ?? '-'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN', { hour12: false }) : '-'}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleString('zh-CN', { hour12: false }) : '-'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.status === '启用'}
                      onCheckedChange={() => toggleStatus(row)}
                      aria-label="切换状态"
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary font-medium" onClick={() => { setEditRow(row); setEditOpen(true); }}>
                      编辑
                    </Button>
                    <Button variant="link" size="sm" className="h-auto p-0 text-red-600 hover:text-red-700 font-medium" onClick={() => handleDelete(row)}>
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <UnifiedPagination
        total={total}
        currentPage={page}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => loadList(p)}
        unitLabel="条"
        hideWhenEmpty={false}
        className="border-t border-gray-100 rounded-b-xl"
      />
      <AccountAddDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={() => loadList(page)} />
      <AccountEditDialog open={editOpen} onOpenChange={setEditOpen} row={editRow} onSuccess={() => loadList(page)} />
    </div>
  );
}
