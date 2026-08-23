/**
 * 系统设置-用户组（系统 / 组织共用，迁移自 AegisOne）
 * 左侧：用户组列表、搜索、新建/重命名/删除
 * 右侧：当前选中组的「权限」与「成员」Tab
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Shield,
  Users,
  UserCog,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { cn } from '@/utils/cn';
import { systemUserGroupService, orgUserGroupService } from '@/services/setting/usergroup';
import type {
  UserGroupItem,
  UserGroupMemberItem,
  UserGroupAuthSetting,
  UserGroupPermissionItem,
} from '@/types/setting/usergroup';

/** 权限 Tab 展平后的行（便于表格展示与保存） */
interface AuthTableRow {
  id: string;
  name: string;
  enable: boolean;
  moduleName: string;
  operationName: string;
  moduleRowSpan?: number; // 功能模块需要合并的行数
  operationRowSpan?: number; // 操作对象需要合并的行数
  isFirstModuleRow?: boolean; // 是否是功能模块的第一行
  isFirstOperationRow?: boolean; // 是否是操作对象的第一行
}

/** 权限表格行（同一操作对象的所有权限在一行） */
interface AuthTableGroupedRow {
  moduleName: string;
  operationName: string;
  permissions: Array<{
    id: string;
    name: string;
    enable: boolean;
  }>;
  moduleRowSpan?: number;
  operationRowSpan?: number;
  isFirstModuleRow?: boolean;
  isFirstOperationRow?: boolean;
}

const MEMBER_PAGE_SIZE = 10;

interface SystemUserGroupViewProps {
  /** 系统 或 组织（组织需当前 organizationId） */
  scope: 'system' | 'organization';
  /** 组织 scope 时必传 */
  organizationId?: string;
}

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

export function SystemUserGroupView({ scope, organizationId }: SystemUserGroupViewProps) {
  const api = scope === 'system' ? systemUserGroupService : orgUserGroupService;
  const effectiveOrgId = scope === 'organization' ? (organizationId ?? typeof localStorage !== 'undefined' ? localStorage.getItem('currentOrgId') ?? '' : '') : '';

  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<UserGroupItem[]>([]);
  const [fullList, setFullList] = useState<UserGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserGroupItem | null>(null);
  const [rightTab, setRightTab] = useState<'auth' | 'user'>('auth');
  const [members, setMembers] = useState<UserGroupMemberItem[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [memberLoading, setMemberLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<UserGroupItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ item: UserGroupItem } | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberKeyword, setAddMemberKeyword] = useState('');
  const [addMemberOptions, setAddMemberOptions] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [addMemberSelected, setAddMemberSelected] = useState<string[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<UserGroupMemberItem | null>(null);
  const [memberSelectedIds, setMemberSelectedIds] = useState<string[]>([]);
  const [authRows, setAuthRows] = useState<AuthTableGroupedRow[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authLoadError, setAuthLoadError] = useState(false);
  const [authDirty, setAuthDirty] = useState(false);
  const [systemToggle, setSystemToggle] = useState(scope === 'system');
  const [orgToggle, setOrgToggle] = useState(scope === 'organization');
  const [projectToggle, setProjectToggle] = useState(false);

  /** 将权限配置树转换为分组表格行（同一操作对象的所有权限在一行） */
  const flattenAuthSettings = useCallback((data: UserGroupAuthSetting[]): AuthTableGroupedRow[] => {
    const groupedRows: AuthTableGroupedRow[] = [];
    const toPermList = (p: UserGroupPermissionItem) => ({
      id: p.id,
      name: p.name,
      enable: !!p.enable,
    });
    (data ?? []).forEach((top) => {
      const children = top.children ?? [];
      if (children.length > 0) {
        children.forEach((child) => {
          const perms = child.permissions ?? child.permissionList ?? [];
          if (perms.length > 0) {
            groupedRows.push({
              moduleName: top.name,
              operationName: child.name ?? '-',
              permissions: perms.map(toPermList),
            });
          }
        });
      } else {
        const perms = top.permissions ?? top.permissionList ?? [];
        if (perms.length > 0) {
          groupedRows.push({
            moduleName: top.name,
            operationName: '-',
            permissions: perms.map(toPermList),
          });
        }
      }
    });
    // 计算合并单元格的行数
    let moduleStartIdx = 0;
    let currentModule = '';
    groupedRows.forEach((row, idx) => {
      if (row.moduleName !== currentModule) {
        currentModule = row.moduleName;
        moduleStartIdx = idx;
      }
      const moduleEndIdx = groupedRows.findIndex((r, i) => i > idx && r.moduleName !== currentModule);
      const moduleRowSpan = moduleEndIdx === -1 ? groupedRows.length - moduleStartIdx : moduleEndIdx - moduleStartIdx;
      row.moduleRowSpan = idx === moduleStartIdx ? moduleRowSpan : 0;
      row.isFirstModuleRow = idx === moduleStartIdx;
      row.operationRowSpan = 1;
      row.isFirstOperationRow = true;
    });
    return groupedRows;
  }, []);

  const loadAuthSettings = useCallback(async () => {
    if (!selected?.id) {
      setAuthRows([]);
      setAuthLoadError(false);
      return;
    }
    setAuthLoading(true);
    setAuthLoadError(false);
    try {
      const data =
        scope === 'system'
          ? await systemUserGroupService.getPermissionSetting(selected.id)
          : await orgUserGroupService.getPermissionSetting(selected.id);
      const grouped = flattenAuthSettings(data);
      setAuthRows(grouped);
      setAuthDirty(false);
    } catch (e) {
      toast.error('加载权限配置失败');
      setAuthRows([]);
      setAuthLoadError(true);
    } finally {
      setAuthLoading(false);
    }
  }, [scope, selected?.id, flattenAuthSettings]);

  useEffect(() => {
    if (selected?.id && rightTab === 'auth') loadAuthSettings();
  }, [selected?.id, rightTab, loadAuthSettings]);

  const handleAuthRowToggle = useCallback((id: string, checked: boolean) => {
    setAuthRows((prev) =>
      prev.map((row) => ({
        ...row,
        permissions: row.permissions.map((p) => (p.id === id ? { ...p, enable: checked } : p)),
      }))
    );
    setAuthDirty(true);
  }, []);

  const handleAuthSave = useCallback(async () => {
    if (!selected?.id) return;
    try {
      const permissions: Array<{ id: string; enable: boolean }> = [];
      authRows.forEach((row) => {
        row.permissions.forEach((p) => {
          permissions.push({ id: p.id, enable: p.enable });
        });
      });
      if (scope === 'system') {
        await systemUserGroupService.savePermissionSetting({ userRoleId: selected.id, permissions });
      } else {
        await orgUserGroupService.savePermissionSetting({ userRoleId: selected.id, permissions });
      }
      toast.success('保存成功');
      setAuthDirty(false);
      loadAuthSettings();
    } catch (e) {
      toast.error('保存失败');
    }
  }, [scope, selected?.id, authRows, loadAuthSettings]);

  const handleAuthReset = useCallback(() => {
    loadAuthSettings();
  }, [loadAuthSettings]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      if (scope === 'system') {
        const res = await systemUserGroupService.getList();
        setFullList(res);
      } else {
        if (!effectiveOrgId) {
          setFullList([]);
          setLoading(false);
          return;
        }
        const res = await orgUserGroupService.getList(effectiveOrgId);
        setFullList(res);
      }
    } catch (e) {
      toast.error('加载用户组列表失败');
      setFullList([]);
    } finally {
      setLoading(false);
    }
  }, [scope, effectiveOrgId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // 进入页面时默认选中「系统管理员」用户组（系统 scope 下）；组织 scope 下默认选中第一项
  useEffect(() => {
    if (fullList.length === 0 || selected !== null) return;
    if (scope === 'system') {
      const systemAdmin = fullList.find((g) => g.name === '系统管理员');
      if (systemAdmin) setSelected(systemAdmin);
    } else {
      setSelected(fullList[0]);
    }
  }, [fullList, selected, scope]);

  // 左侧列表：仅用 keyword 做客户端过滤，不因 keyword 重新请求
  useEffect(() => {
    const k = (keyword || '').trim().toLowerCase();
    setList(k ? fullList.filter((i) => i.name?.toLowerCase().includes(k)) : fullList);
  }, [fullList, keyword]);

  // 根据 type 字段分类用户组
  const systemGroups = list.filter((g) => g.type === 'SYSTEM' || (!g.type && scope === 'system'));
  const orgGroups = list.filter((g) => g.type === 'ORGANIZATION' || (!g.type && scope === 'organization'));
  const projectGroups: UserGroupItem[] = []; // 项目用户组暂时为空，后续可以扩展

  const loadMembers = useCallback(async () => {
    if (!selected?.id) {
      setMembers([]);
      setMemberTotal(0);
      return;
    }
    setMemberLoading(true);
    try {
      if (scope === 'system') {
        const res = await systemUserGroupService.getMemberList({
          roleId: selected.id,
          current: memberPage,
          pageSize: MEMBER_PAGE_SIZE,
        });
        setMembers(res.list ?? []);
        setMemberTotal(res.total ?? 0);
      } else {
        const res = await orgUserGroupService.getMemberList({
          userRoleId: selected.id,
          organizationId: effectiveOrgId,
          current: memberPage,
          pageSize: MEMBER_PAGE_SIZE,
        });
        setMembers(res.list ?? []);
        setMemberTotal(res.total ?? 0);
      }
    } catch (e) {
      toast.error('加载成员列表失败');
      setMembers([]);
      setMemberTotal(0);
    } finally {
      setMemberLoading(false);
    }
  }, [scope, selected?.id, effectiveOrgId, memberPage]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleSearch = () => {
    const k = (keyword || '').trim().toLowerCase();
    setList(k ? fullList.filter((i) => i.name?.toLowerCase().includes(k)) : fullList);
  };

  const handleCreate = async () => {
    const name = formName.trim();
    if (!name) {
      toast.error('请输入用户组名称');
      return;
    }
    if (fullList.some((i) => i.name === name)) {
      toast.error('用户组名称已存在');
      return;
    }
    setFormSubmitting(true);
    try {
      if (scope === 'system') {
        await systemUserGroupService.add({ name, type: 'SYSTEM' });
      } else {
        if (!effectiveOrgId) {
          toast.error('请先选择组织');
          return;
        }
        await orgUserGroupService.add({ name, scopeId: effectiveOrgId, type: 'ORGANIZATION' });
      }
      toast.success('创建成功');
      setCreateOpen(false);
      setFormName('');
      loadList();
    } catch (e) {
      toast.error('创建失败');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRename = async () => {
    if (!renameItem) return;
    const name = formName.trim();
    if (!name) {
      toast.error('请输入用户组名称');
      return;
    }
    if (name === renameItem.name) {
      setRenameOpen(false);
      setRenameItem(null);
      setFormName('');
      return;
    }
    if (fullList.some((i) => i.name === name && i.id !== renameItem.id)) {
      toast.error('用户组名称已存在');
      return;
    }
    setFormSubmitting(true);
    try {
      if (scope === 'system') {
        await systemUserGroupService.update({ id: renameItem.id, name });
      } else {
        await orgUserGroupService.update({ id: renameItem.id, name, scopeId: effectiveOrgId });
      }
      toast.success('重命名成功');
      setRenameOpen(false);
      setRenameItem(null);
      setFormName('');
      loadList();
      if (selected?.id === renameItem.id) setSelected((p) => (p ? { ...p, name } : null));
    } catch (e) {
      toast.error('重命名失败');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm?.item) return;
    const id = deleteConfirm.item.id;
    setDeleteConfirm(null);
    try {
      if (scope === 'system') {
        await systemUserGroupService.delete(id);
      } else {
        await orgUserGroupService.delete(id);
      }
      toast.success('删除成功');
      loadList();
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleAddMemberOpen = () => {
    setAddMemberKeyword('');
    setAddMemberOptions([]);
    setAddMemberSelected([]);
    setAddMemberOpen(true);
  };

  const fetchAddMemberOptions = useCallback(async () => {
    if (!selected?.id) return;
    try {
      if (scope === 'system') {
        const res = await systemUserGroupService.getMemberOption(selected.id, addMemberKeyword);
        setAddMemberOptions(res.map((r) => ({ id: r.id, name: r.name, email: r.email })));
      } else {
        const res = await orgUserGroupService.getMemberOption(effectiveOrgId, selected.id, addMemberKeyword);
        setAddMemberOptions(res.map((r) => ({ id: r.id, name: r.name, email: r.email })));
      }
    } catch {
      setAddMemberOptions([]);
    }
  }, [scope, selected?.id, effectiveOrgId, addMemberKeyword]);

  useEffect(() => {
    if (!addMemberOpen || !selected?.id) return;
    const t = setTimeout(fetchAddMemberOptions, 200);
    return () => clearTimeout(t);
  }, [addMemberOpen, selected?.id, addMemberKeyword, fetchAddMemberOptions]);

  const handleAddMemberSubmit = async () => {
    if (!selected?.id || addMemberSelected.length === 0) return;
    setAddMemberLoading(true);
    try {
      if (scope === 'system') {
        await systemUserGroupService.addMember({ roleId: selected.id, userIds: addMemberSelected });
      } else {
        await orgUserGroupService.addMember({
          userRoleId: selected.id,
          userIds: addMemberSelected,
          organizationId: effectiveOrgId,
        });
      }
      toast.success('添加成功');
      setAddMemberOpen(false);
      loadMembers();
    } catch (e) {
      toast.error('添加失败');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeConfirm || !selected?.id) return;
    const rec = removeConfirm;
    setRemoveConfirm(null);
    const userId = rec.userId ?? rec.id;
    try {
      if (scope === 'system') {
        await systemUserGroupService.removeMember(rec.id);
      } else {
        await orgUserGroupService.removeMember({
          userRoleId: selected.id,
          userIds: [userId],
          organizationId: effectiveOrgId,
        });
      }
      toast.success('已移除');
      loadMembers();
    } catch (e) {
      toast.error('移除失败');
    }
  };

  const handleBatchRemoveMembers = async () => {
    if (!selected?.id || memberSelectedIds.length === 0) return;
    try {
      if (scope === 'system') {
        // 系统级暂无批量移除接口，通过循环调用或等待后端支持。这里先简单模拟
        for (const id of memberSelectedIds) {
          await systemUserGroupService.removeMember(id);
        }
      } else {
        await orgUserGroupService.removeMember({
          userRoleId: selected.id,
          userIds: memberSelectedIds,
          organizationId: effectiveOrgId,
        });
      }
      toast.success('批量移除成功');
      setMemberSelectedIds([]);
      loadMembers();
    } catch {
      toast.error('批量移除失败');
    }
  };

  const canEdit = (item: UserGroupItem) => !item.internal;
  const authReadOnly = selected ? ['admin', 'org_admin', 'project_admin'].includes(selected.id) : false;

  if (scope === 'organization' && !effectiveOrgId) {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
        请先在顶部选择组织
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[600px] overflow-hidden">
      <div className="p-0 flex h-full grow">
        {/* 左侧 */}
        <aside className="w-[320px] shrink-0 flex flex-col border-r border-gray-100 bg-[#fbfcfd]">
          <div className="p-6 border-b border-gray-50 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2.5 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                {scope === 'system' ? '系统用户组' : '组织用户组'}
              </h3>
            </div>
            <div className="relative group/search">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-focus-within/search:text-blue-500" />
              <Input
                placeholder="搜索用户组标识..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-11 pl-10 border-gray-100 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all rounded-xl text-xs font-bold"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* 系统用户组分类 */}
            {scope === 'system' && (
              <div className="mt-2">
                <div className="flex items-center justify-between px-4 py-2 hover:bg-muted/50">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground flex-1"
                    onClick={() => setSystemToggle(!systemToggle)}
                  >
                    {systemToggle ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>系统用户组</span>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormName('');
                      setCreateOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {systemToggle && (
                  <div className="px-2 pb-2 space-y-1">
                    {systemGroups.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground/60 italic">暂无用户组</div>
                    ) : (
                      systemGroups.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 border mb-1 mx-2',
                            selected?.id === item.id
                              ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-200 translate-x-1'
                              : 'hover:bg-white hover:border-gray-200 hover:shadow-sm text-gray-600 border-transparent'
                          )}
                          onClick={() => {
                            setSelected(item);
                            setMemberSelectedIds([]);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              selected?.id === item.id ? "bg-white/20" : "bg-gray-100 group-hover:bg-blue-50"
                            )}>
                              <Shield className={cn("w-3.5 h-3.5", selected?.id === item.id ? "text-white" : "text-gray-400 group-hover:text-blue-500")} />
                            </div>
                            <span className={cn('truncate text-sm font-semibold tracking-tight', selected?.id === item.id ? 'text-white' : 'text-gray-700')}>{item.name}</span>
                          </div>

                          {canEdit(item) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button type="button" size="icon" variant="ghost" className={cn('h-7 w-7 rounded-lg opacity-0 transition-opacity', (selected?.id === item.id || 'group-hover:opacity-100') && (selected?.id === item.id ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'))}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-2xl border-gray-100 shadow-2xl p-1.5 backdrop-blur-md bg-white">
                                <DropdownMenuItem onClick={() => { setRenameItem(item); setFormName(item.name); setRenameOpen(true); }} className="rounded-xl gap-2.5 py-2.5 font-bold focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                                  <Pencil className="h-4 w-4" /> <span className="text-sm">重命名</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="rounded-xl text-red-500 gap-2.5 py-2.5 font-bold focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                  onClick={() => setDeleteConfirm({ item })}
                                >
                                  <Trash2 className="h-4 w-4" /> <span className="text-sm">删除</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 组织用户组分类 */}
            {scope === 'organization' && (
              <div className="mt-2">
                <div className="flex items-center justify-between px-4 py-2 hover:bg-muted/50">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground flex-1"
                    onClick={() => setOrgToggle(!orgToggle)}
                  >
                    {orgToggle ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>组织用户组</span>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormName('');
                      setCreateOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {orgToggle && (
                  <div className="px-2 pb-2 space-y-1">
                    {orgGroups.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground/60 italic">暂无用户组</div>
                    ) : (
                      orgGroups.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 border mb-1 mx-2',
                            selected?.id === item.id
                              ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-200 translate-x-1'
                              : 'hover:bg-white hover:border-gray-200 hover:shadow-sm text-gray-600 border-transparent'
                          )}
                          onClick={() => {
                            setSelected(item);
                            setMemberSelectedIds([]);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              selected?.id === item.id ? "bg-white/20" : "bg-gray-100 group-hover:bg-blue-50"
                            )}>
                              <Shield className={cn("w-3.5 h-3.5", selected?.id === item.id ? "text-white" : "text-gray-400 group-hover:text-blue-500")} />
                            </div>
                            <span className={cn('truncate text-sm font-semibold tracking-tight', selected?.id === item.id ? 'text-white' : 'text-gray-700')}>{item.name}</span>
                          </div>

                          {canEdit(item) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button type="button" size="icon" variant="ghost" className={cn('h-7 w-7 rounded-lg opacity-0 transition-opacity', (selected?.id === item.id || 'group-hover:opacity-100') && (selected?.id === item.id ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'))}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-2xl border-gray-100 shadow-2xl p-1.5 backdrop-blur-md bg-white">
                                <DropdownMenuItem onClick={() => { setRenameItem(item); setFormName(item.name); setRenameOpen(true); }} className="rounded-xl gap-2.5 py-2.5 font-bold focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                                  <Pencil className="h-4 w-4" /> <span className="text-sm">重命名</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="rounded-xl text-red-500 gap-2.5 py-2.5 font-bold focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                  onClick={() => setDeleteConfirm({ item })}
                                >
                                  <Trash2 className="h-4 w-4" /> <span className="text-sm">删除</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 如果没有分类数据，显示全部列表（与系统/组织主列表同一套样式） */}
            {((scope === 'system' && systemGroups.length === 0) || (scope === 'organization' && orgGroups.length === 0)) && (
              <div className="px-2 py-2">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
                ) : list.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无用户组</div>
                ) : (
                  list.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 border mb-1 mx-2',
                        selected?.id === item.id
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-200 translate-x-1'
                          : 'hover:bg-white hover:border-gray-200 hover:shadow-sm text-gray-600 border-transparent'
                      )}
                      onClick={() => {
                        setSelected(item);
                        setMemberSelectedIds([]);
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          selected?.id === item.id ? "bg-white/20" : "bg-gray-100 group-hover:bg-blue-50"
                        )}>
                          <Shield className={cn("w-3.5 h-3.5", selected?.id === item.id ? "text-white" : "text-gray-400 group-hover:text-blue-500")} />
                        </div>
                        <span className={cn('truncate text-sm font-semibold tracking-tight', selected?.id === item.id ? 'text-white' : 'text-gray-700')}>{item.name}</span>
                      </div>
                      {canEdit(item) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button type="button" size="icon" variant="ghost" className={cn('h-7 w-7 rounded-lg opacity-0 transition-opacity', (selected?.id === item.id || 'group-hover:opacity-100') && (selected?.id === item.id ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'))}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-2xl border-gray-100 shadow-2xl p-1.5 backdrop-blur-md bg-white">
                            <DropdownMenuItem onClick={() => { setRenameItem(item); setFormName(item.name); setRenameOpen(true); }} className="rounded-xl gap-2.5 py-2.5 font-bold focus:bg-blue-50 focus:text-blue-600 cursor-pointer">
                              <Pencil className="h-4 w-4" /> <span className="text-sm">重命名</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl text-red-500 gap-2.5 py-2.5 font-bold focus:bg-red-50 focus:text-red-600 cursor-pointer"
                              onClick={() => setDeleteConfirm({ item })}
                            >
                              <Trash2 className="h-4 w-4" /> <span className="text-sm">删除</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* 右侧 */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">
              <div className="text-center">
                <UserCog className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">请选择左侧用户组</p>
              </div>
            </div>
          ) : (
            <>
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as 'auth' | 'user')} className="flex flex-col flex-1 min-h-0 bg-white">
                <div className="flex items-center justify-between px-8 py-0 bg-white border-b border-gray-50 flex-shrink-0 sticky top-0 z-20">
                  <TabsList className="bg-transparent border-b-0 h-16 p-0 gap-8 rounded-none">
                    <TabsTrigger value="auth" className="h-16 px-1 rounded-none border-0 border-b-2 border-transparent bg-transparent text-gray-500 shadow-none text-sm font-black transition-all data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none">
                      <Shield className="h-4 w-4 mr-2" /> 权限配置
                    </TabsTrigger>
                    <TabsTrigger value="user" className="h-16 px-1 rounded-none border-0 border-b-2 border-transparent bg-transparent text-gray-500 shadow-none text-sm font-black transition-all data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none">
                      <Users className="h-4 w-4 mr-2" /> 成员管理
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-3">
                    {rightTab === 'auth' && authDirty && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100/50 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">未保存更改</span>
                      </div>
                    )}
                    {rightTab === 'auth' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={handleAuthReset} disabled={authLoading} className="h-9 px-4 font-bold text-gray-400 rounded-xl hover:bg-gray-50">
                          重置
                        </Button>
                        <Button size="sm" onClick={handleAuthSave} disabled={authLoading || !authDirty} className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:shadow-none">
                          保存配置
                        </Button>
                      </>
                    )}
                    {rightTab === 'user' && memberSelectedIds.length > 0 && (
                      <Button size="sm" variant="outline" className="h-9 px-4 text-red-600 border-red-100 hover:bg-red-50 rounded-xl font-bold animate-in slide-in-from-right-4 transition-all" onClick={handleBatchRemoveMembers}>
                        批量移除 ({memberSelectedIds.length})
                      </Button>
                    )}
                    {rightTab === 'user' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 transition-all active:scale-95 px-6 h-9 rounded-xl font-bold" onClick={handleAddMemberOpen}>
                        <UserPlus className="h-4 w-4 mr-2" /> 添加成员
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <TabsContent value="auth" className="mt-0">
                    <div className="flex flex-col gap-4">
                      {authReadOnly && (
                        <p className="text-sm text-muted-foreground">内置用户组（如系统管理员）的权限不可修改。</p>
                      )}
                      {authLoading ? (
                        <div className="py-8 text-center text-muted-foreground">加载中...</div>
                      ) : authLoadError ? (
                        <div className="py-8 text-center">
                          <p className="text-muted-foreground mb-3">加载权限配置失败，请检查网络或稍后重试</p>
                          <Button variant="outline" size="sm" onClick={() => loadAuthSettings()}>重新加载</Button>
                        </div>
                      ) : authRows.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">暂无权限配置数据</div>
                      ) : (
                        <>
                          <div className="border border-gray-200 rounded-lg overflow-x-auto overflow-hidden">
                            <Table>
                              <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                <TableRow className="hover:bg-transparent border-none h-11">
                                  <TableHead className="w-[200px] font-medium text-gray-500">功能</TableHead>
                                  <TableHead className="w-[200px] font-medium text-gray-500">操作对象</TableHead>
                                  <TableHead className="font-medium text-gray-500">权限</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody key={`auth-rows-${authRows.length}`}>
                                {authRows.map((row, rowIndex) => (
                                  <TableRow key={`${row.moduleName}-${row.operationName}-${rowIndex}`} className="group transition-colors [&_td]:transition-colors [&_td]:group-hover:bg-[#f2f3f5] border-b border-gray-100 h-11">
                                    {row.isFirstModuleRow && row.moduleRowSpan ? (
                                      <TableCell
                                        className="font-medium align-top"
                                        rowSpan={row.moduleRowSpan}
                                      >
                                        {row.moduleName}
                                      </TableCell>
                                    ) : null}
                                    {row.isFirstOperationRow && row.operationRowSpan ? (
                                      <TableCell
                                        className="align-top"
                                        rowSpan={row.operationRowSpan}
                                      >
                                        {row.operationName || '-'}
                                      </TableCell>
                                    ) : null}
                                    <TableCell>
                                      <div className="flex items-center gap-4 flex-wrap">
                                        {row.permissions.map((permission) => (
                                          <div key={permission.id} className="flex items-center gap-2 whitespace-nowrap">
                                            <Checkbox
                                              checked={permission.enable}
                                              disabled={authReadOnly}
                                              onCheckedChange={(checked) =>
                                                handleAuthRowToggle(permission.id, checked === true)
                                              }
                                              className={cn(
                                                permission.enable && 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                                              )}
                                            />
                                            <span className="text-sm">{permission.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {!authReadOnly && (
                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" size="sm" onClick={handleAuthReset} disabled={!authDirty}>
                                恢复默认
                              </Button>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAuthSave} disabled={!authDirty}>
                                保存
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="user" className="mt-0">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                          <TableRow className="hover:bg-transparent border-none h-11">
                            <TableHead className="w-[50px] pl-4">
                              <Checkbox
                                checked={members.length > 0 && memberSelectedIds.length === members.length}
                                onCheckedChange={(c) => {
                                  if (c) setMemberSelectedIds(members.map(m => m.id));
                                  else setMemberSelectedIds([]);
                                }}
                              />
                            </TableHead>
                            <TableHead className="font-medium text-gray-500">成员</TableHead>
                            <TableHead className="font-medium text-gray-500">手机</TableHead>
                            <TableHead className="w-[80px] text-right pr-4 font-medium text-gray-500">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody key={`member-tbody-${members.length}-${members[0]?.id ?? ''}`}>
                          {memberLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">加载中...</TableCell>
                            </TableRow>
                          ) : members.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">暂无成员</TableCell>
                            </TableRow>
                          ) : (
                            members.map((row) => (
                              <TableRow key={row.id} className="group transition-colors [&_td]:transition-colors [&_td]:group-hover:bg-[#f2f3f5] border-b border-gray-100 h-11">
                                <TableCell className="pl-4">
                                  <Checkbox
                                    checked={memberSelectedIds.includes(row.id)}
                                    onCheckedChange={(c) => {
                                      if (c) setMemberSelectedIds(prev => [...prev, row.id]);
                                      else setMemberSelectedIds(prev => prev.filter(id => id !== row.id));
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(row.name ?? 'U')}`}>
                                      {(row.name ?? 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-gray-900 truncate">{row.name ?? '-'}</div>
                                      <div className="text-xs text-gray-400 truncate">{row.email ?? '-'}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{row.phone ?? '-'}</TableCell>
                                <TableCell className="text-right pr-4">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    onClick={() => setRemoveConfirm(row)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {memberTotal > 0 && (
                      <div className="bg-gray-50/30 border-t mt-auto">
                        <UnifiedPagination
                          currentPage={memberPage}
                          total={memberTotal}
                          pageSize={MEMBER_PAGE_SIZE}
                          onPageChange={setMemberPage}
                        />
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </main>
      </div>

      {/* 新建用户组 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建用户组</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>用户组名称</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入用户组名称"
              maxLength={255}
            />
            {scope === 'system' && (
              <p className="text-xs text-muted-foreground">该用户组将在整个系统范围内可用</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={formSubmitting}>{formSubmitting ? '创建中...' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名 */}
      <Dialog open={renameOpen} onOpenChange={(open) => { if (!open) setRenameItem(null); setRenameOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名用户组</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>用户组名称</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入用户组名称"
              maxLength={255}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>取消</Button>
            <Button onClick={handleRename} disabled={formSubmitting}>{formSubmitting ? '保存中...' : '确定'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {scope === 'system'
                ? '删除后，该用户组数据将无法恢复，请谨慎操作。'
                : '删除后，组织下用户组数据将一起删除，请谨慎操作！'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加成员 */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>搜索用户</Label>
            <Input
              value={addMemberKeyword}
              onChange={(e) => setAddMemberKeyword(e.target.value)}
              placeholder="姓名/邮箱"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto border rounded-md">
            {addMemberOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">输入关键字搜索可选用户</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addMemberOptions.map((u) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setAddMemberSelected((prev) =>
                          prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={addMemberSelected.includes(u.id)}
                          onChange={() => { }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>取消</Button>
            <Button onClick={handleAddMemberSubmit} disabled={addMemberSelected.length === 0 || addMemberLoading}>
              {addMemberLoading ? '添加中...' : `添加 (${addMemberSelected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移除成员确认 */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              移除后，该用户将失去本用户组权限。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>移除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

