/**
 * 关联缺陷抽屉
 * 迁移自 spotter-metersphere linkDefectDrawer.vue
 */

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { caseManagementService } from '@/services';

interface LinkDefectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  projectId: string;
  onSuccess?: () => void;
}

interface BugItem {
  id: string;
  num?: string;
  name?: string;
  title?: string;
  statusName?: string;
}

export function LinkDefectDrawer({
  open,
  onOpenChange,
  caseId,
  projectId,
  onSuccess,
}: LinkDefectDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<BugItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState('');
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchList = async () => {
    setLoading(true);
    try {
      const result: any = await caseManagementService.getDebugDrawerPage({
        projectId,
        caseId,
        keyword: keyword.trim() || undefined,
        current,
        pageSize,
      });
      const data = result?.list ?? result?.data ?? result?.records ?? [];
      setList(Array.isArray(data) ? data : []);
      setTotal(result?.total ?? result?.totalCount ?? 0);
    } catch (err) {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchList();
  }, [open, current, keyword]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(list.map((b) => b.id)));
    else setSelected(new Set());
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      toast.error('请至少选择一个缺陷');
      return;
    }
    setLoading(true);
    try {
      await caseManagementService.associatedDebugger({
        projectId,
        caseId,
        sourceId: caseId,
        selectIds: [...selected],
        selectAll: false,
        excludeIds: [],
      });
      toast.success('关联成功');
      onOpenChange(false);
      setSelected(new Set());
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || '关联失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[900px] sm:max-w-[900px] flex flex-col">
        <SheetHeader>
          <SheetTitle>关联缺陷</SheetTitle>
        </SheetHeader>
        <div className="flex items-center justify-between py-4">
          <span className="text-sm text-gray-500">缺陷列表 共 {total} 条</span>
          <Input
            className="w-60"
            placeholder="通过 ID/名称搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList()}
          />
          <Button variant="outline" size="sm" onClick={fetchList}>搜索</Button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={list.length > 0 && selected.size === list.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>缺陷 ID</TableHead>
                <TableHead>缺陷名称</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">加载中...</TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">暂无数据</TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer [&_td]:group-hover:bg-gray-50" onClick={() => toggleSelect(item.id)}>
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                    </TableCell>
                    <TableCell className="font-mono">{item.num ?? item.id ?? '-'}</TableCell>
                    <TableCell>{item.name ?? item.title ?? '-'}</TableCell>
                    <TableCell>{item.statusName ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0 || loading}>
            {loading ? '处理中...' : '关联'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
