/**
 * 拨测 - 编辑菜单弹窗
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { menuApi, type MenuItem } from '@/services/dial-management';
import { toast } from 'sonner';
import { APP_OPTIONS } from '../constants';

function flattenMenus(items: MenuItem[], level = 0): { id: string; name: string; path?: string }[] {
  const result: { id: string; name: string; path?: string }[] = [];
  for (const item of items) {
    result.push({ id: item.id, name: (level ? '　'.repeat(level) : '') + item.name, path: item.path });
    if (item.children?.length) result.push(...flattenMenus(item.children, level + 1));
  }
  return result;
}

interface MenuEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: MenuItem | null;
  onSuccess: () => void;
}

export function MenuEditDialog({ open, onOpenChange, row, onSuccess }: MenuEditDialogProps) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    path: '',
    appCode: '',
    sortOrder: '0',
    parentId: '',
    isActive: 1,
    createdAt: '',
    updatedAt: '',
  });
  const [parentOptions, setParentOptions] = useState<{ id: string; name: string; path?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (row && open) {
      setForm({
        id: row.id,
        name: row.name ?? '',
        path: row.path ?? '',
        appCode: (row as any).appCode ?? 'Gmesh',
        sortOrder: String(row.sortOrder ?? 0),
        parentId: (row as any).parentId != null ? String((row as any).parentId) : '',
        isActive: row.isActive ?? 1,
        createdAt: (row as any).createdAt ?? '',
        updatedAt: (row as any).updatedAt ?? '',
      });
      const code = (row as any).appCode ?? 'Gmesh';
      menuApi.page({ appCode: code, pageSize: 9999, currentPage: 1 }).then((res) => {
        if (res && typeof res === 'object' && 'data' in res) {
          const data = (res as any).data as MenuItem[];
          setParentOptions(flattenMenus(data || []).map((m) => ({ id: m.id, name: m.name, path: m.path })));
        }
      });
    }
  }, [row, open]);

  const handleParentIdChange = (newParentId: string) => {
    setForm(prev => {
      let newPath = prev.path;
      const oldParent = parentOptions.find(opt => opt.id === prev.parentId);
      let oldPrefix = oldParent?.path ? (oldParent.path.endsWith('/') ? oldParent.path : oldParent.path + '/') : '';

      const newParent = parentOptions.find(opt => opt.id === newParentId);
      let newPrefix = newParent?.path ? (newParent.path.endsWith('/') ? newParent.path : newParent.path + '/') : '';

      if (!newPath || (oldPrefix && newPath.startsWith(oldPrefix))) {
        newPath = newPrefix + (newPath.slice(oldPrefix.length));
      } else if (!oldPrefix && !newPath.startsWith(newPrefix)) {
        const relativePath = newPath.startsWith('/') ? newPath.slice(1) : newPath;
        newPath = newPrefix + relativePath;
      }

      return { ...prev, parentId: newParentId, path: newPath };
    });
  };

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.path?.trim() || !form.appCode) {
      toast.error('请填写菜单名称、路径');
      return;
    }
    setSubmitting(true);
    try {
      await menuApi.modify({
        id: form.id,
        name: form.name.trim(),
        path: form.path.trim(),
        isActive: form.isActive,
        appCode: form.appCode,
        ...(form.parentId && { parentId: form.parentId }),
        sortOrder: Number(form.sortOrder) || 0,
        component: form.path.trim(),
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      });
      toast.success('菜单编辑成功');
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message || '编辑失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>编辑菜单</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>菜单名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="请输入"
              />
            </div>
            <div className="space-y-2">
              <Label>应用</Label>
              <Select value={form.appCode} onValueChange={(v) => setForm((f) => ({ ...f, appCode: v }))}>
                <SelectTrigger>
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
            </div>
          </div>
          <div className="space-y-2">
            <Label>路径</Label>
            <Input
              value={form.path}
              onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>排序</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>父级菜单</Label>
              <Select value={form.parentId || 'none'} onValueChange={(v) => handleParentIdChange(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="无" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {parentOptions.filter((o) => o.id !== row?.id).map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
