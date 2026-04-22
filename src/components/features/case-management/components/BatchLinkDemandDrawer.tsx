/**
 * 批量关联需求抽屉
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
import { caseManagementService, projectManagementService } from '@/services';

function getPlatName(key?: string) {
  const map: Record<string, string> = { ZENTAO: '禅道', JIRA: 'Jira', TAPD: 'TAPD', LOCAL: '本地' };
  return key ? map[key] || key : '需求平台';
}

interface BatchLinkDemandDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchParams: {
    selectedIds: string[];
    projectId: string;
    activeFolder: string;
    offspringIds: string[];
    condition?: Record<string, unknown>;
  };
  onSuccess?: () => void;
}

interface DemandItem {
  demandId: string;
  demandName: string;
  demandUrl?: string;
}

export function BatchLinkDemandDrawer({
  open,
  onOpenChange,
  batchParams,
  onSuccess,
}: BatchLinkDemandDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<DemandItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState('');
  const [platformInfo, setPlatformInfo] = useState<Record<string, any>>({});

  const platName = getPlatName(platformInfo?.platform_key);
  const config = platformInfo?.demand_platform_config
    ? (typeof platformInfo.demand_platform_config === 'string'
        ? JSON.parse(platformInfo.demand_platform_config)
        : platformInfo.demand_platform_config)
    : {};

  const fetchList = async () => {
    setLoading(true);
    try {
      const result: any = await caseManagementService.getThirdDemand({
        projectId: batchParams.projectId,
        keyword: keyword.trim() || undefined,
        current: 1,
        pageSize: 50,
      });
      const data = result?.list ?? result?.data ?? result?.records ?? [];
      const flat = (items: any[]): DemandItem[] => {
        const out: DemandItem[] = [];
        for (const it of items) {
          out.push({ demandId: it.demandId ?? it.id, demandName: it.demandName ?? it.name, demandUrl: it.demandUrl });
          if (it.children?.length) out.push(...flat(it.children));
        }
        return out;
      };
      setList(Array.isArray(data) ? flat(data) : []);
    } catch (err) {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      projectManagementService.getCaseRelatedInfo(batchParams.projectId).then((r: any) => setPlatformInfo(r || {})).catch(() => setPlatformInfo({}));
      fetchList();
    }
  }, [open, keyword]);

  const toggleSelect = (demandId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(demandId)) next.delete(demandId);
      else next.add(demandId);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      toast.error('请至少选择一条需求');
      return;
    }
    setLoading(true);
    try {
      const demandList = list.filter((d) => selected.has(d.demandId)).map((d) => ({
        demandId: d.demandId,
        demandName: d.demandName,
        demandUrl: d.demandUrl,
      }));
      const payload: any = {
        selectIds: batchParams.selectedIds,
        selectAll: false,
        excludeIds: [],
        condition: batchParams.condition,
        projectId: batchParams.projectId,
        moduleIds: batchParams.activeFolder === 'all' ? [] : [batchParams.activeFolder, ...batchParams.offspringIds],
        demandPlatform: config?.platform ?? platformInfo?.platform_key ?? 'LOCAL',
        demandList,
      };
      const id = config?.zentaoId ?? config?.id;
      if (id) payload.id = id;
      await caseManagementService.batchAssociationDemand(payload);
      toast.success('批量关联需求成功');
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
      <SheetContent side="right" className="w-[960px] sm:max-w-[960px] flex flex-col">
        <SheetHeader>
          <SheetTitle>批量关联需求 - {platName}</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-gray-500 py-2">已选择 {batchParams.selectedIds.length} 个用例，选择要关联的需求：</p>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-500">共 {list.length} 条</span>
          <Input className="w-60" placeholder="通过 ID/名称搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchList()} />
        </div>
        <div className="flex-1 min-h-0 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>需求 ID</TableHead>
                <TableHead>需求名称</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">加载中...</TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">暂无数据</TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.demandId} className="cursor-pointer [&_td]:group-hover:bg-gray-50" onClick={() => toggleSelect(item.demandId)}>
                    <TableCell className="w-12">
                      <Checkbox checked={selected.has(item.demandId)} onCheckedChange={() => toggleSelect(item.demandId)} />
                    </TableCell>
                    <TableCell className="font-mono">{item.demandId}</TableCell>
                    <TableCell className="text-blue-600">{item.demandName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0 || loading}>{loading ? '处理中...' : '关联'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
