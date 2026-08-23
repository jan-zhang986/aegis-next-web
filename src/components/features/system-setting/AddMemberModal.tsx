/**
 * 组织/项目 - 添加成员弹窗
 * 与 aegis-next-server addUserModal 对齐：搜索用户、多选、确认添加
 */
import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { organizationProjectService } from '@/services/setting/organization-project';
import type { OrgProjectMemberOption } from '@/types/setting/organization-project';

const PAGE_SIZE = 10;

/** 根据名字生成头像背景色 */
function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'org' | 'project';
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
}

export function AddMemberModal({
  open,
  onOpenChange,
  type,
  targetId,
  targetName,
  onSuccess,
}: AddMemberModalProps) {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<OrgProjectMemberOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const params = {
        current: page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        organizationId: type === 'org' ? targetId : undefined,
        projectId: type === 'project' ? targetId : undefined,
      };
      const res = await organizationProjectService.getMemberListPage(params);
      setList(res.list ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error('加载用户列表失败');
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [targetId, type, page, keyword]);

  useEffect(() => {
    if (open && targetId) {
      setPage(1);
      setSelectedIds([]);
      loadList();
    }
  }, [open, targetId, loadList]);

  useEffect(() => {
    if (open && targetId) loadList();
  }, [open, targetId, page, keyword, loadList]);

  useEffect(() => {
    if (open && keyword) setPage(1);
  }, [keyword]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.filter((u) => !u.memberFlag).map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      toast.error('请至少选择一名用户');
      return;
    }
    setSubmitting(true);
    try {
      if (type === 'org') {
        await organizationProjectService.addOrgMember({
          organizationId: targetId,
          userIds: selectedIds,
        });
      } else {
        await organizationProjectService.addProjectMember({
          projectId: targetId,
          userIds: selectedIds,
        });
      }
      toast.success('添加成功');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const selectableList = list.filter((u) => !u.memberFlag);
  const isAllSelected = selectableList.length > 0 && selectedIds.length === selectableList.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl flex flex-col max-h-[80vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>添加成员</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            为「{targetName}」选择要添加的用户
          </p>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0 gap-3 py-2">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="按姓名或邮箱搜索"
              className="pl-9 h-10 rounded-xl border-gray-200"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setPage(1), loadList())}
            />
          </div>
          <div className="border border-gray-100 rounded-xl overflow-auto flex-1 min-h-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow className="hover:bg-transparent border-b-gray-100">
                  <TableHead className="w-10 pl-4 py-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(c) => handleSelectAll(!!c)}
                      className="rounded-md border-gray-300 data-[state=checked]:bg-blue-600"
                    />
                  </TableHead>
                  <TableHead className="py-3 text-xs font-medium text-gray-500">成员</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-400 text-sm">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-400 text-sm">
                      暂无可选用户
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((row) => (
                    <TableRow key={row.id} className="border-b-gray-50">
                      <TableCell className="pl-4 py-2">
                        {row.memberFlag ? (
                          <span className="text-gray-300 text-xs">已加入</span>
                        ) : (
                          <Checkbox
                            checked={selectedIds.includes(row.id)}
                            onCheckedChange={(c) => handleSelectOne(row.id, !!c)}
                            className="rounded-md border-gray-300 data-[state=checked]:bg-blue-600"
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(row.name ?? 'U')}`}>
                            {(row.name ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{row.name}</div>
                            <div className="text-xs text-gray-400 truncate">{row.email ?? '-'}</div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {total > PAGE_SIZE && (
            <div className="shrink-0">
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
        <DialogFooter className="shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={selectedIds.length === 0 || submitting}
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                添加中...
              </span>
            ) : (
              `添加（${selectedIds.length}）`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
