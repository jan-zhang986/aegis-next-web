/**
 * 拨测管理 - 菜单管理
 * 表格按树形展示父子菜单，支持展开/折叠 & 状态开关
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { menuApi, type MenuItem } from '@/services/dial-management';
import { MenuAddDialog, MenuEditDialog } from './dialogs';
import { toast } from 'sonner';
import { APP_OPTIONS } from './constants';

/** 带层级的展示行（用于树形表格） */
interface MenuRow { item: MenuItem; depth: number }

/** 根据展开状态将树拍平为带 depth 的列表 */
function buildVisibleRows(items: MenuItem[], expandedIds: Set<string>, depth: number): MenuRow[] {
  const result: MenuRow[] = [];
  for (const item of items) {
    result.push({ item, depth });
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren && expandedIds.has(item.id)) {
      result.push(...buildVisibleRows(item.children || [], expandedIds, depth + 1));
    }
  }
  return result;
}

export function MenuView() {
  const [filters, setFilters] = useState({ name: '', path: '', appCode: 'Gmesh' });
  const [treeList, setTreeList] = useState<MenuItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<MenuItem | null>(null);

  const loadList = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await menuApi.page({
        currentPage: 1,
        pageSize: 9999,
        appCode: filters.appCode ?? '',
        name: filters.name || undefined,
        path: filters.path || undefined,
      });
      if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
        const data = (res as any).data as MenuItem[];
        setTreeList(data || []);
        // 默认收起，不展开任何节点
        setExpandedIds(new Set());
      }
    } catch (e) {
      toast.error((e as Error).message || '加载菜单列表失败');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters.name, filters.path, filters.appCode]);

  const visibleRows = useMemo(
    () => buildVisibleRows(treeList, expandedIds, 0),
    [treeList, expandedIds]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleToggleActive = async (row: MenuItem, checked: boolean) => {
    const newIsActive = checked ? 1 : 0;
    const oldTreeList = [...treeList];
    const updateNode = (nodes: MenuItem[]): MenuItem[] =>
      nodes.map((node) => {
        if (node.id === row.id) {
          return { ...node, isActive: newIsActive };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    setTreeList(updateNode(treeList));

    try {
      await menuApi.modify({
        id: row.id,
        name: row.name,
        path: row.path,
        isActive: newIsActive,
        appCode: (row as any).appCode ?? filters.appCode,
        sortOrder: row.sortOrder ?? 0,
        component: row.path ?? '',
        createdAt: (row as any).createdAt,
        updatedAt: (row as any).updatedAt,
      });
      toast.success(checked ? '已启用' : '已禁用');
      loadList(true);
    } catch {
      toast.error('操作失败');
      setTreeList(oldTreeList);
    }
  };

  const handleDelete = async (row: MenuItem) => {
    if (!confirm('确定删除该菜单？')) return;
    try {
      await menuApi.delete(row.id);
      toast.success('删除成功');
      loadList();
    } catch {
      toast.error('删除失败');
    }
  };

  const selectApp = (appCode: string) => {
    setFilters((f) => ({ ...f, appCode }));
  };

  return (
    <div className="flex gap-5">
      {/* 左侧应用导航 */}
      <aside className="w-44 shrink-0 rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2.5 py-2">应用</div>
        <nav className="flex flex-col gap-0.5">
          {APP_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => selectApp(opt)}
              className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${filters.appCode === opt
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {opt}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 space-y-5 min-w-0">
        <form
          className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); loadList(); }}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-gray-500 font-medium">菜单名称</span>
            <Input
              className="h-9 w-[180px]"
              placeholder="请输入"
              value={filters.name}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-gray-500 font-medium">路径</span>
            <Input
              className="h-9 w-[200px]"
              placeholder="请输入"
              value={filters.path}
              onChange={(e) => setFilters((f) => ({ ...f, path: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-gray-500 font-medium">应用</span>
            <Select
              value={filters.appCode}
              onValueChange={(v) => setFilters((f) => ({ ...f, appCode: v }))}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {APP_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit" size="default">
              查询
            </Button>
            <Button type="button" variant="outline" size="default" onClick={() => setFilters({ name: '', path: '', appCode: filters.appCode })}>
              重置
            </Button>
          </div>
          <Button
            type="button"
            className="ml-auto"
            size="default"
            onClick={() => {
              setAddParentId(undefined);
              setAddOpen(true);
            }}
          >
            新增菜单
          </Button>
        </form>

        <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-200">
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-none h-11">
                <TableHead scope="col" className="font-medium text-gray-500">应用</TableHead>
                <TableHead scope="col" className="font-medium text-gray-500">菜单名称</TableHead>
                <TableHead scope="col" className="font-medium text-gray-500">排序</TableHead>
                <TableHead scope="col" className="font-medium text-gray-500">路径</TableHead>
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
              ) : visibleRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="text-center text-gray-500 py-12">暂无数据</TableCell>
                </TableRow>
              ) : (
                visibleRows.map(({ item: row, depth }) => {
                  const hasChildren = row.children && row.children.length > 0;
                  const isExpanded = expandedIds.has(row.id);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {String((row as any).appCode ?? filters.appCode ?? '-')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(row.id)}
                              className="p-0.5 rounded hover:bg-gray-100 text-gray-500"
                              aria-label={isExpanded ? '折叠' : '展开'}
                            >
                              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </button>
                          ) : (
                            <span className="w-5 inline-block" />
                          )}
                          <span>{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.sortOrder ?? '-'}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={row.path}>
                        {row.path ?? '-'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {(row as any).createdAt ? new Date((row as any).createdAt).toLocaleString('zh-CN', { hour12: false }) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {(row as any).updatedAt ? new Date((row as any).updatedAt).toLocaleString('zh-CN', { hour12: false }) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={row.isActive !== 0}
                            onCheckedChange={(checked) => handleToggleActive(row, checked)}
                          />
                          <span className={row.isActive === 0 ? 'text-red-600' : 'text-green-600'}>
                            {row.isActive === 0 ? '禁用' : '启用'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary font-medium"
                          onClick={() => {
                            setAddParentId(row.id);
                            setAddOpen(true);
                          }}
                        >
                          新增下级
                        </Button>
                        <Button variant="link" size="sm" className="h-auto p-0 text-primary font-medium" onClick={() => { setEditRow(row); setEditOpen(true); }}>
                          编辑
                        </Button>
                        <Button variant="link" size="sm" className="h-auto p-0 text-red-600 hover:text-red-700 font-medium" onClick={() => handleDelete(row)}>
                          删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <MenuAddDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSuccess={loadList}
          appCode={filters.appCode}
          parentId={addParentId}
        />
        <MenuEditDialog open={editOpen} onOpenChange={setEditOpen} row={editRow} onSuccess={loadList} />
      </div>
    </div>
  );
}
