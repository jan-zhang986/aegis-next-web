/**
 * 拨测 - 编辑任务弹窗
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
import { jobApi, executorApi, type JobItem, type ExecutorItem } from '@/services/dial-management';
import { CronEditorDialog } from './CronEditorDialog';
import { toast } from 'sonner';

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: JobItem | null;
  onSuccess: () => void;
}

export function TaskEditDialog({ open, onOpenChange, row, onSuccess }: TaskEditDialogProps) {
  const [form, setForm] = useState({
    id: '',
    jobName: '',
    executorsCode: '',
    openId: '',
    status: 'pause',
    model: 'script',
    cron: '',
    funcArgs: '',
    funcKwargs: '{}',
    detailId: '',
  });
  const [executors, setExecutors] = useState<ExecutorItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cronDialogOpen, setCronDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      executorApi.list({ page: 1, size: 100 }).then((res) => {
        if (res && typeof res === 'object' && 'data' in res) setExecutors((res as any).data ?? []);
      });
    }
  }, [open]);

  useEffect(() => {
    if (!row || !open) return;
    const kw = row.jobFeatures?.funcKwargs;
    const fromRow = (row as any).executorsCode;
    const fromExecutors = executors.length
      ? (executors.find((e) => e.executorsName === row.executorsName)?.executorsCode ?? '')
      : '';
    const executorsCode = fromRow ?? fromExecutors ?? row.executorsName ?? '';
    setForm({
      id: row.id,
      jobName: row.jobName,
      executorsCode,
      openId: row.openId ?? '',
      status: row.status ?? 'pause',
      model: row.jobFeatures?.model ?? 'script',
      cron: row.cron ?? row.jobFeatures?.cron ?? '',
      funcArgs: row.funcArgs ?? row.jobFeatures?.funcArgs ?? '',
      funcKwargs: typeof kw === 'object' ? JSON.stringify(kw, null, 2) : (kw ?? '{}'),
      detailId: (row as any).detailId ?? row.jobFeatures?.id ?? '',
    });
  }, [row, open, executors]);

  const handleSubmit = async () => {
    if (!form.jobName?.trim() || !form.cron?.trim() || !form.funcArgs?.trim()) {
      toast.error('请填写必填项');
      return;
    }
    let funcKwargs: Record<string, unknown> = {};
    if (form.funcKwargs?.trim()) {
      try {
        funcKwargs = JSON.parse(form.funcKwargs);
      } catch {
        toast.error('额外参数必须是合法 JSON');
        return;
      }
    }
    setSubmitting(true);
    try {
      await jobApi.modify({
        id: form.id,
        jobName: form.jobName.trim(),
        executorsCode: form.executorsCode,
        status: form.status,
        openId: form.openId.trim(),
        jobFeatures: {
          id: form.detailId || undefined,
          cron: form.cron.trim(),
          model: form.model,
          funcArgs: form.funcArgs.trim(),
          funcKwargs,
        },
      });
      toast.success('任务编辑成功');
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>编辑任务</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>任务名称</Label>
              <Input
                value={form.jobName}
                onChange={(e) => setForm((f) => ({ ...f, jobName: e.target.value }))}
                placeholder="请输入"
              />
            </div>
            <div className="space-y-2">
              <Label>执行器</Label>
              <Select
                value={form.executorsCode || ''}
                onValueChange={(v) => setForm((f) => ({ ...f, executorsCode: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择执行器" />
                </SelectTrigger>
                <SelectContent>
                  {executors.map((e) => (
                    <SelectItem key={e.id} value={e.executorsCode}>
                      {e.executorsName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>openId</Label>
            <Input
              value={form.openId}
              onChange={(e) => setForm((f) => ({ ...f, openId: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cron 表达式</Label>
              <Input
                value={form.cron}
                readOnly
                onClick={() => setCronDialogOpen(true)}
                placeholder="点击配置 Cron 表达式"
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label>任务模式</Label>
              <Select
                value={form.model}
                onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="script">脚本</SelectItem>
                  <SelectItem value="curl">curl</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>任务参数</Label>
            <Input
              value={form.funcArgs}
              onChange={(e) => setForm((f) => ({ ...f, funcArgs: e.target.value }))}
              placeholder="请输入"
            />
          </div>
          <div className="space-y-2">
            <Label>额外参数（JSON）</Label>
            <Input
              value={form.funcKwargs}
              onChange={(e) => setForm((f) => ({ ...f, funcKwargs: e.target.value }))}
              placeholder='{}'
            />
          </div>

          <CronEditorDialog
            open={cronDialogOpen}
            onOpenChange={setCronDialogOpen}
            value={form.cron}
            onChange={(newCron) => setForm((f) => ({ ...f, cron: newCron }))}
          />

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
