/**
 * 拨测 - 新建账号弹窗
 */
import { useState } from 'react';
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
import { accountApi } from '@/services/dial-management';
import { toast } from 'sonner';
import { APP_OPTIONS } from '../constants';

const defaultForm = {
  accountTitle: '',
  appCode: '',
  baseUrl: '',
  user: '',
  password: '',
  callbackUrl: '',
  defaultRouterPath: '',
  apiAuthenticationPath: '',
  webAuthenticationPath: '',
  apiUrl: '',
};

interface AccountAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AccountAddDialog({ open, onOpenChange, onSuccess }: AccountAddDialogProps) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !form.accountTitle?.trim() ||
      !form.appCode ||
      !form.baseUrl?.trim() ||
      !form.user?.trim() ||
      !form.password?.trim() ||
      !form.callbackUrl?.trim() ||
      !form.apiAuthenticationPath?.trim() ||
      !form.apiUrl?.trim()
    ) {
      toast.error('请填写必填项');
      return;
    }
    setSubmitting(true);
    try {
      await accountApi.add({
        accountTitle: form.accountTitle.trim(),
        appCode: form.appCode,
        baseUrl: form.baseUrl.trim(),
        isActive: 1,
        accountFeatures: {
          user: form.user.trim(),
          password: form.password,
          callbackUrl: form.callbackUrl.trim(),
          defaultRouterPath: form.defaultRouterPath?.trim() || '',
          webAuthenticationPath: form.webAuthenticationPath?.trim() || '',
          apiAuthenticationPath: form.apiAuthenticationPath.trim(),
          apiUrl: form.apiUrl.trim(),
          features: {},
        },
      });
      toast.success('账号新建成功');
      setForm(defaultForm);
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message || '新建失败');
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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建账号</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>账号名称</Label>
              <Input
                value={form.accountTitle}
                onChange={(e) => setForm((f) => ({ ...f, accountTitle: e.target.value }))}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>账号</Label>
              <Input
                value={form.user}
                onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))}
                placeholder="请输入"
              />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="请输入"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>平台地址</Label>
            <Input
              value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>网关地址</Label>
            <Input
              value={form.apiUrl}
              onChange={(e) => setForm((f) => ({ ...f, apiUrl: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>应用地址</Label>
            <Input
              value={form.callbackUrl}
              onChange={(e) => setForm((f) => ({ ...f, callbackUrl: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>默认路由</Label>
            <Input
              value={form.defaultRouterPath}
              onChange={(e) => setForm((f) => ({ ...f, defaultRouterPath: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>接口鉴权路由</Label>
            <Input
              value={form.apiAuthenticationPath}
              onChange={(e) => setForm((f) => ({ ...f, apiAuthenticationPath: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>鉴权路由</Label>
            <Input
              value={form.webAuthenticationPath}
              onChange={(e) => setForm((f) => ({ ...f, webAuthenticationPath: e.target.value }))}
              placeholder="请输入"
            />
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
