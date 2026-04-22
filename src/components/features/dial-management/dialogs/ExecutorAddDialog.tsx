/**
 * 拨测 - 新建执行器弹窗
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
import { executorApi } from '@/services/dial-management';
import { toast } from 'sonner';

interface ExecutorAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExecutorAddDialog({ open, onOpenChange, onSuccess }: ExecutorAddDialogProps) {
  const [form, setForm] = useState({ executorsName: '', service: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.executorsName?.trim() || !form.service?.trim()) {
      toast.error('请填写执行器名称和服务');
      return;
    }
    setSubmitting(true);
    try {
      await executorApi.add({
        executorsName: form.executorsName.trim(),
        service: form.service.trim(),
      });
      toast.success('执行器新建成功');
      setForm({ executorsName: '', service: '' });
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message || '新建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm({ executorsName: '', service: '' });
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>新建执行器</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>执行器名称</Label>
            <Input
              value={form.executorsName}
              onChange={(e) => setForm((f) => ({ ...f, executorsName: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>服务</Label>
            <Input
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              placeholder="请输入"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
