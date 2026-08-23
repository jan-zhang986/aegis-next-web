/**
 * 系统组织/项目 - 成员列表侧滑（参考 AegisOne UserDrawer）
 * 查看当前成员、添加成员、移除成员
 */
import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { organizationProjectService } from '@/services/setting/organization-project';
import { AddMemberModal } from './AddMemberModal';
import type { CurrentMemberItem } from '@/types/setting/organization-project';

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

export interface MemberDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'org' | 'project';
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
}

export function MemberDrawer({
  open,
  onOpenChange,
  type,
  targetId,
  targetName,
  onSuccess,
}: MemberDrawerProps) {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<CurrentMemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<CurrentMemberItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const loadList = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await organizationProjectService.getCurrentMemberList({
        type,
        targetId,
        current: page,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
      });
      setList(res.list ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast.error('加载成员列表失败');
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [type, targetId, page, keyword]);

  useEffect(() => {
    if (open && targetId) {
      setPage(1);
      loadList();
    }
  }, [open, targetId, loadList]);

  useEffect(() => {
    if (!open) return;
    loadList();
  }, [open, page, keyword, loadList]);

  const handleRemove = async () => {
    if (!removeConfirm) return;
    const item = removeConfirm;
    setRemoveConfirm(null);
    try {
      if (type === 'org') {
        await organizationProjectService.removeOrgMember(targetId, item.id);
      } else {
        await organizationProjectService.removeProjectMember(targetId, item.id);
      }
      toast.success('已移除');
      loadList();
      onSuccess?.();
    } catch {
      toast.error('移除失败');
    }
  };

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    loadList();
    onSuccess?.();
  };

  const label = type === 'org' ? '组织' : '项目';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] flex flex-col p-0 gap-0">
          {/* 顶部 Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900 leading-tight">
                    {targetName}
                  </SheetTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {label}成员管理 · 共 <span className="font-semibold text-blue-600">{total}</span> 人
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shrink-0 h-8 text-xs font-bold"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" /> 添加成员
              </Button>
            </div>
          </SheetHeader>

          {/* 搜索栏 */}
          <div className="px-6 py-3 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索姓名或邮箱"
                className="pl-9 h-9 rounded-lg border-gray-200 text-sm bg-gray-50"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), loadList())}
              />
            </div>
          </div>

          {/* 成员列表 */}
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-100">
                <TableRow className="hover:bg-transparent border-none h-10">
                  <TableHead className="pl-6 font-medium text-gray-500 text-xs">姓名</TableHead>
                  <TableHead className="font-medium text-gray-500 text-xs">用户组</TableHead>
                  <TableHead className="w-16 text-right pr-6 font-medium text-gray-500 text-xs">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-16 text-gray-400 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                        <span>加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-16 text-gray-400 text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 text-gray-200" />
                        <span>暂无成员</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group border-b border-gray-50 h-14 [&_td]:transition-colors [&_td]:group-hover:bg-[#f7f8ff]"
                    >
                      {/* 姓名 + 头像 + 邮箱 */}
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(row.name ?? 'U')}`}
                          >
                            {(row.name ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{row.name}</div>
                            <div className="text-xs text-gray-400 truncate">{row.email ?? '-'}</div>
                          </div>
                        </div>
                      </TableCell>
                      {/* 用户组 */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.userRoleIdNameMap?.length
                            ? row.userRoleIdNameMap.map((r, i) => (
                              <Badge
                                key={r.id || i}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-0 font-medium"
                              >
                                {r.name}
                              </Badge>
                            ))
                            : <span className="text-xs text-gray-300">—</span>}
                        </div>
                      </TableCell>
                      {/* 操作 */}
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          onClick={() => setRemoveConfirm(row)}
                          title="移除成员"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {total > PAGE_SIZE && (
            <div className="shrink-0 border-t border-gray-100 bg-gray-50/50">
              <UnifiedPagination
                currentPage={page}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                hideWhenEmpty={false}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              确定将成员「{removeConfirm?.name}」从该{label}中移除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700 rounded-xl">
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMemberModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type={type}
        targetId={targetId}
        targetName={targetName}
        onSuccess={handleAddSuccess}
      />
    </>
  );
}
