/**
 * 添加/编辑需求弹窗
 * 迁移自 spotter-metersphere addDemandModal.vue
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { caseManagementService } from '@/services';

const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

export interface DemandFormItem {
  id?: string;
  demandId: string;
  demandName: string;
  demandUrl: string;
}

interface AddDemandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  projectId: string;
  form?: DemandFormItem | null;
  loading?: boolean;
  onSuccess?: () => void;
}

export function AddDemandModal({
  open,
  onOpenChange,
  caseId,
  projectId,
  form,
  loading: externalLoading,
  onSuccess,
}: AddDemandModalProps) {
  const [loading, setLoading] = useState(false);
  const [demandId, setDemandId] = useState('');
  const [demandName, setDemandName] = useState('');
  const [demandUrl, setDemandUrl] = useState('');

  useEffect(() => {
    if (open && form) {
      setDemandId(form.demandId || '');
      setDemandName(form.demandName || '');
      setDemandUrl(form.demandUrl || '');
    } else if (open && !form?.id) {
      setDemandId('');
      setDemandName('');
      setDemandUrl('');
    }
  }, [open, form]);

  const isUpdate = !!form?.id;

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

  const handleSave = async (isContinue: boolean) => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        caseId,
        projectId,
        demandPlatform: 'LOCAL',
        demandList: [{ demandId: demandId.trim() || '', demandName: demandName.trim(), demandUrl: demandUrl.trim() || '' }],
      };
      if (isUpdate && form?.id) {
        payload.id = form.id;
        await caseManagementService.updateDemandRequest(payload);
        toast.success('更新成功');
      } else {
        await caseManagementService.addDemandRequest(payload);
        toast.success('添加成功');
      }
      if (!isContinue) onOpenChange(false);
      else {
        setDemandId('');
        setDemandName('');
        setDemandUrl('');
      }
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
          <DialogTitle>{isUpdate ? '编辑需求' : '添加需求'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>需求 ID</Label>
            <Input
              value={demandId}
              onChange={(e) => setDemandId(e.target.value)}
              placeholder="请输入需求 ID"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label>需求标题 <span className="text-red-500">*</span></Label>
            <Input
              value={demandName}
              onChange={(e) => setDemandName(e.target.value)}
              placeholder="请输入需求标题"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label>需求地址</Label>
            <Input
              value={demandUrl}
              onChange={(e) => setDemandUrl(e.target.value)}
              placeholder="请输入需求 URL"
              maxLength={255}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          {!isUpdate && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={externalLoading || loading}>
              保存并继续添加
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={externalLoading || loading}>
            {externalLoading || loading ? '处理中...' : isUpdate ? '更新' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
