/**
 * 批量修改执行人弹窗
 * 参考原项目 spotter-metersphere batchUpdateExecutorModal.vue
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface BatchUpdateExecutorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  projectId: string;
  /** 计划用例 id 列表（test_plan_functional_case.id） */
  selectIds: string[];
  /** 已选数量展示用 */
  count?: number;
  onSuccess?: () => void;
}

export function BatchUpdateExecutorModal({
  open,
  onOpenChange,
  planId,
  projectId,
  selectIds,
  count = 0,
  onSuccess,
}: BatchUpdateExecutorModalProps) {
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [executorOptions, setExecutorOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (open && projectId) {
      setOptionsLoading(true);
      testPlanManagementService
        .getTestPlanExecutorOptions(projectId)
        .then((res: any) => {
          const list = Array.isArray(res) ? res : res?.list ?? [];
          setExecutorOptions(list.map((e: any) => ({ id: e.id ?? e.value, name: e.name ?? e.label ?? e.id ?? '' })));
          if (!userId && list.length > 0) setUserId(list[0].id ?? list[0].value);
        })
        .catch(() => toast.error('获取执行人列表失败'))
        .finally(() => setOptionsLoading(false));
    }
  }, [open, projectId]);

  useEffect(() => {
    if (!open) {
      setUserId('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!userId?.trim()) {
      toast.error('请选择执行人');
      return;
    }
    if (selectIds.length === 0) {
      toast.error('请选择要修改的用例');
      return;
    }
    setLoading(true);
    const toastId = toast.loading(`正在更新 ${selectIds.length} 个用例执行人...`);
    try {
      await testPlanManagementService.batchUpdateCaseExecutor({
        testPlanId: planId,
        projectId,
        selectIds,
        userId: userId.trim(),
      });
      toast.success('修改执行人成功', { id: toastId });
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? '修改执行人失败', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            批量修改执行人
            {count > 0 && <span className="text-sm font-normal text-gray-400 ml-2">已选 {count} 个用例</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              执行人 <span className="text-red-500">*</span>
            </Label>
            <Select value={userId} onValueChange={setUserId} disabled={optionsLoading}>
              <SelectTrigger className="h-9">
                {optionsLoading ? (
                  <span className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
                  </span>
                ) : (
                  <SelectValue placeholder="请选择执行人" />
                )}
              </SelectTrigger>
              <SelectContent>
                {executorOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name || opt.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading || !userId || selectIds.length === 0}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
