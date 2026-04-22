/**
 * 拨测 - 新建任务弹窗
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { jobApi, executorApi, type ExecutorItem } from '@/services/dial-management';
import { CronEditorDialog } from './CronEditorDialog';
import { toast } from 'sonner';

interface TaskAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** 整合页传入当前选中的执行器编码，新建时默认选中该执行器 */
  defaultExecutorsCode?: string;
}

const defaultForm = {
  name: '',
  executorsCode: '',
  openId: '',
  mode: '',
  cron: '',
  params: '',
  extraParams: '',
};

export function TaskAddDialog({ open, onOpenChange, onSuccess, defaultExecutorsCode }: TaskAddDialogProps) {
  const [form, setForm] = useState(defaultForm);
  const [executors, setExecutors] = useState<ExecutorItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cronDialogOpen, setCronDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        executorsCode: defaultExecutorsCode ?? defaultForm.executorsCode,
      });
      executorApi.list({ page: 1, size: 100 }).then((res) => {
        if (res && typeof res === 'object' && 'data' in res) setExecutors((res as any).data ?? []);
      });
    }
  }, [open, defaultExecutorsCode]);

  const validateCron = (value: string): { ok: boolean; message?: string } => {
    const v = value?.trim() ?? '';
    if (!v) return { ok: false, message: '请配置Cron表达式' };
    const parts = v.split(/\s+/);
    if (parts.length !== 5) return { ok: false, message: 'Cron表达式格式错误，必须包含5个字段' };
    return { ok: true };
  };

  const openCronDialog = () => {
    setCronDialogOpen(true);
  };

  const handleCronChange = (newCron: string) => {
    setForm((f) => ({ ...f, cron: newCron }));
  };

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.executorsCode || !form.openId?.trim() || !form.cron?.trim() || !form.mode || !form.params?.trim()) {
      toast.error('请填写必填项：任务名称、执行器、openId、Cron 表达式、任务模式、任务参数');
      return;
    }
    const cronValid = validateCron(form.cron);
    if (!cronValid.ok) {
      toast.error(cronValid.message || 'Cron表达式格式错误');
      return;
    }
    let funcKwargs: Record<string, unknown> = {};
    if (form.extraParams?.trim()) {
      try {
        funcKwargs = JSON.parse(form.extraParams);
      } catch {
        toast.error('额外参数必须是合法 JSON');
        return;
      }
    }
    setSubmitting(true);
    try {
      await jobApi.add({
        jobName: form.name.trim(),
        executorsCode: form.executorsCode,
        status: 'pause',
        openId: form.openId.trim(),
        jobFeatures: {
          cron: form.cron.trim(),
          model: form.mode,
          funcArgs: form.params.trim(),
          funcKwargs,
        },
      });
      toast.success('任务新建成功');
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message || '新建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>新建任务</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 基础信息 */}
          <div className="space-y-3">
            <h5 className="text-base font-semibold text-gray-600">基础信息</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>任务名称 <span className="text-red-500">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="请输入"
                />
              </div>
              <div className="space-y-2">
                <Label>执行器 <span className="text-red-500">*</span></Label>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>openId <span className="text-red-500">*</span></Label>
                <Input
                  value={form.openId}
                  onChange={(e) => setForm((f) => ({ ...f, openId: e.target.value }))}
                  placeholder="请输入"
                />
              </div>
              <div />
            </div>
          </div>

          {/* 调度配置 */}
          <div className="space-y-3 pt-2">
            <h5 className="text-base font-semibold text-gray-600">调度配置</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cron表达式 <span className="text-red-500">*</span></Label>
                <Input
                  value={form.cron}
                  readOnly
                  onClick={openCronDialog}
                  placeholder="点击配置 Cron 表达式"
                  className="cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label>任务模式 <span className="text-red-500">*</span></Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="script">脚本</SelectItem>
                    <SelectItem value="curl">curl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>任务参数 <span className="text-red-500">*</span></Label>
              <Input
                value={form.params}
                onChange={(e) => setForm((f) => ({ ...f, params: e.target.value }))}
                placeholder="请输入"
              />
            </div>
            <div className="space-y-2">
              <Label>额外参数</Label>
              <Textarea
                value={form.extraParams}
                onChange={(e) => setForm((f) => ({ ...f, extraParams: e.target.value }))}
                placeholder="可选，必须是合法 JSON，如 {&quot;key&quot;:&quot;value&quot;}"
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Cron 配置弹窗 */}
          <CronEditorDialog
            open={cronDialogOpen}
            onOpenChange={setCronDialogOpen}
            value={form.cron}
            onChange={handleCronChange}
          />
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
