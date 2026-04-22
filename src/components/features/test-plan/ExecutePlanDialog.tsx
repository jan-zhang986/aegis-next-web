/**
 * 测试计划执行弹窗（单条计划组 / 批量执行）
 * 与老前端 planTable 执行弹窗逻辑一致：选择串行/并行后确认执行
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';
import { Play } from 'lucide-react';

export interface ExecutePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executeIds: string[];
  projectId: string;
  onSuccess?: () => void;
}

export function ExecutePlanDialog({
  open,
  onOpenChange,
  executeIds,
  projectId,
  onSuccess,
}: ExecutePlanDialogProps) {
  const [runMode, setRunMode] = useState<'SERIAL' | 'PARALLEL'>('SERIAL');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (executeIds.length === 0) {
      toast.error('请选择要执行的计划');
      return;
    }
    setLoading(true);
    const toastId = toast.loading(executeIds.length === 1 ? '正在执行...' : `正在批量执行 ${executeIds.length} 个计划...`);
    try {
      if (executeIds.length === 1) {
        await testPlanManagementService.executeSinglePlan({
          executeId: executeIds[0],
          projectId,
          runMode,
          executionSource: 'MANUAL',
        });
      } else {
        await testPlanManagementService.batchExecutePlan({
          selectIds: executeIds,
          projectId,
          runMode,
          executionSource: 'MANUAL',
        });
      }
      toast.success('执行任务已下发', { id: toastId });
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('执行失败:', err);
      toast.error(err?.message || '执行失败', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base font-normal flex items-center gap-2">
            <Play className="w-4 h-4" />
            批量执行
            {executeIds.length > 0 && (
              <span className="text-sm text-gray-400 font-normal">
                共 {executeIds.length} 项
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">执行方式</Label>
            <RadioGroup
              value={runMode}
              onValueChange={(v) => setRunMode(v as 'SERIAL' | 'PARALLEL')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SERIAL" id="run-serial" />
                <Label htmlFor="run-serial" className="text-sm font-normal cursor-pointer">串行</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PARALLEL" id="run-parallel" />
                <Label htmlFor="run-parallel" className="text-sm font-normal cursor-pointer">并行</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExecute} disabled={loading}>
            {loading ? '执行中...' : '执行'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
