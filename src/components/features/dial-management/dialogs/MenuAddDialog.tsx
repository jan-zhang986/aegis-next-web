/**
 * 拨测 - 新增菜单弹窗
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

function flattenMenus(items: MenuItem[], level = 0): { id: string; name: string; level: number; path?: string }[] {
  const result: { id: string; name: string; level: number; path?: string }[] = [];
  for (const item of items) {
    result.push({ id: item.id, name: (level ? '　'.repeat(level) : '') + item.name, level, path: item.path });
    if (item.children?.length) result.push(...flattenMenus(item.children, level + 1));
  }
  return result;
}

interface MenuAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  appCode?: string;
  /** 默认父级菜单 ID（用于“新增下级菜单”入口） */
  parentId?: string;
}

const defaultForm = { name: '', path: '', appCode: 'Gmesh', sortOrder: '0', parentId: '' };

export function MenuAddDialog({
  open,
  onOpenChange,
  onSuccess,
  appCode: propAppCode,
  parentId: propParentId,
}: MenuAddDialogProps) {
  const [form, setForm] = useState(defaultForm);
  const [parentOptions, setParentOptions] = useState<{ id: string; name: string; path?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const nextAppCode = propAppCode || form.appCode || defaultForm.appCode;
      const nextParentId = propParentId ?? '';
      setForm((f) => ({
        ...defaultForm,
        ...f,
        appCode: nextAppCode,
        parentId: nextParentId,
      }));
      const code = nextAppCode;
      if (code) {
        menuApi.page({ appCode: code, pageSize: 9999, currentPage: 1 }).then((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            const data = (res as any).data as MenuItem[];
            const flattened = flattenMenus(data || []);
            setParentOptions(flattened.map((m) => ({ id: m.id, name: m.name, path: m.path })));

            // 如果初始传入了 parentId，自动根据父级拼接 path
            if (nextParentId && !form.path) {
              const parentInfo = flattened.find(m => m.id === nextParentId);
              if (parentInfo?.path) {
                setForm(prev => ({ ...prev, path: parentInfo.path!.endsWith('/') ? parentInfo.path! : parentInfo.path + '/' }));
              }
            }
          }
        });
      }
    }
  }, [open, propAppCode, propParentId]);

  const handleParentIdChange = (newParentId: string) => {
    setForm(prev => {
      let newPath = prev.path;
      // 找到旧的 parent path
      const oldParent = parentOptions.find(opt => opt.id === prev.parentId);
      let oldPrefix = oldParent?.path ? (oldParent.path.endsWith('/') ? oldParent.path : oldParent.path + '/') : '';

      // 找到新的 parent path
      const newParent = parentOptions.find(opt => opt.id === newParentId);
      let newPrefix = newParent?.path ? (newParent.path.endsWith('/') ? newParent.path : newParent.path + '/') : '';

      // 这里有更简单的做法：如果当前的 path 空的或者是旧前缀开头，则直接替换前缀
      if (!newPath || (oldPrefix && newPath.startsWith(oldPrefix))) {
        newPath = newPrefix + (newPath.slice(oldPrefix.length));
      } else if (!oldPrefix && !newPath.startsWith(newPrefix)) {
        // 如果之前没有父级，那么把原来的当作相对路径拼接到新前缀后面
        // 但是为了安全，如果原来是以 '/' 开头，可以去掉
        const relativePath = newPath.startsWith('/') ? newPath.slice(1) : newPath;
        newPath = newPrefix + relativePath;
      }

      return { ...prev, parentId: newParentId, path: newPath };
    });
  };

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.path?.trim() || !form.appCode) {
      toast.error('请填写菜单名称、路径、应用');
      return;
    }
    setSubmitting(true);
    try {
      await menuApi.add({
        name: form.name.trim(),
        path: form.path.trim(),
        isActive: 1,
        appCode: form.appCode,
        ...(form.parentId && { parentId: form.parentId }),
        sortOrder: Number(form.sortOrder) || 0,
        component: form.path.trim(),
      });
      toast.success('菜单新增成功');
      setForm(defaultForm);
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message || '新增失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm(defaultForm);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>新增菜单</DialogTitle>
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
                  {parentOptions.map((opt) => (
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
