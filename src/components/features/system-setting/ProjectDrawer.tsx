/**
 * 系统组织 - 该项目列表侧滑（参考 MeterSphere ProjectDrawer）
 * 只读展示该组织下的项目列表
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { organizationProjectService } from '@/services/setting/organization-project';
import type { OrgProjectTableItem } from '@/types/setting/organization-project';

const PAGE_SIZE = 10;

export interface ProjectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export function ProjectDrawer({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: ProjectDrawerProps) {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<OrgProjectTableItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadList = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await organizationProjectService.getProjectListByOrgId(organizationId, {
        current: page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
      });
      setList(res.list ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error('加载项目列表失败');
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, keyword]);

  useEffect(() => {
    if (open && organizationId) {
      setPage(1);
      loadList();
    }
  }, [open, organizationId, loadList]);

  useEffect(() => {
    if (!open) return;
    loadList();
  }, [open, page, keyword, loadList]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-blue-600" />
            「{organizationName}」下的项目
          </SheetTitle>
          <p className="text-sm text-gray-500">仅展示，如需管理请进入组织后使用「项目管理」</p>
        </SheetHeader>
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索项目名称"
              className="pl-9 h-9 rounded-lg border-gray-200 text-sm"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setPage(1), loadList())}
            />
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-gray-100 bg-gray-50/50">
                  <TableHead className="py-3 text-xs font-bold text-gray-500">序号</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-gray-500">项目名称</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-gray-500">状态</TableHead>
                  <TableHead className="py-3 text-xs font-bold text-gray-500">成员数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      该组织下暂无项目
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((row) => (
                    <TableRow key={row.id} className="border-b-gray-50">
                      <TableCell className="py-2 text-gray-500 text-sm tabular-nums">{row.num ?? '-'}</TableCell>
                      <TableCell className="py-2 font-medium text-gray-900">{row.name}</TableCell>
                      <TableCell className="py-2">
                        <span
                          className={
                            row.deleted
                              ? 'text-red-600 text-xs'
                              : row.enable
                                ? 'text-emerald-600 text-xs'
                                : 'text-gray-500 text-xs'
                          }
                        >
                          {row.deleted ? '已删除' : row.enable ? '运行中' : '已禁用'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-gray-500 text-sm tabular-nums">{row.memberCount ?? 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {total > PAGE_SIZE && (
            <div className="pt-3 border-t border-gray-100">
              <UnifiedPagination
                currentPage={page}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                hideWhenEmpty={false}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
