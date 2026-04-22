/**
 * 拨测 - 编辑执行器弹窗
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
import { executorApi, type ExecutorItem } from '@/services/dial-management';
import { toast } from 'sonner';

interface ExecutorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ExecutorItem | null;
  onSuccess: () => void;
}

export function ExecutorEditDialog({ open, onOpenChange, row, onSuccess }: ExecutorEditDialogProps) {
  const [form, setForm] = useState({ id: '', executorsName: '', service: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (row && open) setForm({ id: row.id, executorsName: row.executorsName, service: row.service });
  }, [row, open]);

  const handleSubmit = async () => {
    if (!form.executorsName?.trim() || !form.service?.trim()) {
      toast.error('请填写执行器名称和服务');
      return;
    }
    setSubmitting(true);
    try {
      await executorApi.modify({
        id: form.id,
        executorsName: form.executorsName.trim(),
        service: form.service.trim(),
      });
      toast.success('执行器编辑成功');
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>编辑执行器</DialogTitle>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
