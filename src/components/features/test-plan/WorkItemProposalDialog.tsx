/**
 * 从活动执行项发起沉淀提案
 * 让临时补充和执行发现可以回流到统一 Case 资产。
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { qualityWorkspaceService } from '@/services/quality-workspace';
import { toast } from 'sonner';

interface WorkItemProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  /** @deprecated use workspaceId */
  campaignId?: string;
  workItemId: string | null;
  targetCaseId?: string | null;
  implementationId?: string | null;
  defaultTitle?: string;
  defaultReason?: string;
  defaultSummary?: string;
  runtimeSnapshot?: Record<string, any> | null;
  onSuccess?: () => void;
}

export function WorkItemProposalDialog({
  open,
  onOpenChange,
  workspaceId,
  campaignId,
  workItemId,
  targetCaseId,
  implementationId,
  defaultTitle,
  defaultReason,
  defaultSummary,
  runtimeSnapshot,
  onSuccess,
}: WorkItemProposalDialogProps) {
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [changeSummaryText, setChangeSummaryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const resolvedWorkspaceId = workspaceId || campaignId || '';

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle || '');
    setReason(defaultReason || '');
    setChangeSummaryText(defaultSummary || '');
  }, [open, defaultTitle, defaultReason, defaultSummary]);

  const handleSubmit = async () => {
    if (!resolvedWorkspaceId || !workItemId) return;
    if (!title.trim()) {
      toast.error('请输入提案标题');
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading('正在发起沉淀提案...');
    try {
      await qualityWorkspaceService.saveWorkItemProposal(resolvedWorkspaceId, workItemId, {
        title: title.trim(),
        reason: reason.trim() || undefined,
        targetCaseId: targetCaseId || undefined,
        status: 'DRAFT',
        changeSummary: {
          source: 'QUALITY_WORK_ITEM',
          title: title.trim(),
          reason: reason.trim() || undefined,
          notes: changeSummaryText.trim() || undefined,
          case: {
            title: title.trim(),
            description: reason.trim() || changeSummaryText.trim() || undefined,
          },
          manualImplementation: {
            expectedResult: changeSummaryText.trim() || undefined,
            implementationId: implementationId || undefined,
          },
        },
        metadata: {
          source: 'quality-workitem-drawer',
          runtimeSnapshot: runtimeSnapshot || undefined,
        },
      });
      toast.success('提案已创建，可继续回流到 Case', { id: toastId });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || '发起提案失败', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base font-medium">从执行项发起沉淀提案</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-slate-900 text-white hover:bg-slate-900">Proposal</Badge>
              <span>把这次执行中的补充、修正或沉淀建议回流到统一 Case 资产。</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">提案标题</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：补充删除场景的回收站校验"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">提案原因</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="说明为什么这次执行中的发现值得沉淀回长期用例资产"
              className="min-h-[90px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">变更摘要</label>
            <Textarea
              value={changeSummaryText}
              onChange={(e) => setChangeSummaryText(e.target.value)}
              placeholder="补充本次要沉淀的关键点，例如新增校验点、修正步骤、补充预期结果"
              className="min-h-[110px]"
            />
          </div>

          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-xs leading-5 text-slate-500">
            当前提案会先保存为 <span className="font-medium text-blue-600">DRAFT</span>，后续可以再进入 Proposal 流程做评审和合并。
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? '提交中...' : '发起提案'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
