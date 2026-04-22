/**
 * 批量添加需求弹窗
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { caseManagementService } from '@/services';

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

interface BatchAddDemandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchParams: {
    selectedIds: string[];
    projectId: string;
    activeFolder: string;
    offspringIds: string[];
    condition?: Record<string, unknown>;
  };
  onSuccess?: () => void;
}

export function BatchAddDemandModal({
  open,
  onOpenChange,
  batchParams,
  onSuccess,
}: BatchAddDemandModalProps) {
  const [loading, setLoading] = useState(false);
  const [demandId, setDemandId] = useState('');
  const [demandName, setDemandName] = useState('');
  const [demandUrl, setDemandUrl] = useState('');

  const validate = () => {
    if (!demandName.trim()) {
      toast.error('请输入需求标题');
      return false;
    }
    if (demandUrl && !URL_REGEX.test(demandUrl)) {
      toast.error('请输入正确的 URL 格式');
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await caseManagementService.batchAssociationDemand({
        selectIds: batchParams.selectedIds,
        selectAll: false,
        excludeIds: [],
        condition: batchParams.condition,
        projectId: batchParams.projectId,
        moduleIds: batchParams.activeFolder === 'all' ? [] : [batchParams.activeFolder, ...batchParams.offspringIds],
        demandPlatform: 'LOCAL',
        demandList: [{ demandId: demandId.trim() || '', demandName: demandName.trim(), demandUrl: demandUrl.trim() || '' }],
      });
      toast.success('批量添加需求成功');
      onOpenChange(false);
      setDemandId('');
      setDemandName('');
      setDemandUrl('');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>批量添加需求</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">将为选中的 {batchParams.selectedIds.length} 个用例添加以下需求：</p>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>需求 ID</Label>
            <Input value={demandId} onChange={(e) => setDemandId(e.target.value)} placeholder="请输入需求 ID" maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label>需求标题 <span className="text-red-500">*</span></Label>
            <Input value={demandName} onChange={(e) => setDemandName(e.target.value)} placeholder="请输入需求标题" maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label>需求地址</Label>
            <Input value={demandUrl} onChange={(e) => setDemandUrl(e.target.value)} placeholder="请输入需求 URL" maxLength={255} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm} disabled={loading}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
