/**
 * 批量编辑弹窗
 * 参考 spotter-metersphere batchEditModal.vue
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
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { caseManagementService } from '@/services';
import { toast } from 'sonner';
import { CaseLevelOption } from './CaseLevelBadge';
import { CASE_LEVEL_MAP } from '../constants';
import { resolvePriorityFieldId } from '../utils/getCaseLevel';

export type TagUpdateType = 'UPDATE' | 'APPEND' | 'CLEAR';

export interface BatchEditParams {
  selectedIds: string[];
  selectAll: boolean;
  excludeIds: string[];
  projectId: string;
  activeFolder: string;
  offspringIds: string[];
  condition?: Record<string, unknown>;
}

interface CaseCustomField {
  fieldId: string;
  fieldName: string;
  type?: string;
  options?: { value: string; text: string }[];
}

interface BatchEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchParams: BatchEditParams;
  onSuccess?: () => void;
}

export function BatchEditModal({
  open,
  onOpenChange,
  batchParams,
  onSuccess,
}: BatchEditModalProps) {
  const [selectedAttrsId, setSelectedAttrsId] = useState('');
  const [tagType, setTagType] = useState<TagUpdateType>('UPDATE');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [caseLevelValue, setCaseLevelValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<CaseCustomField[]>([]);
  const [priorityFieldId, setPriorityFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (open && batchParams.projectId) {
      caseManagementService.getCaseDefaultFields(batchParams.projectId).then((res: any) => {
        const fields = res?.customFields ?? res?.data ?? [];
        const list = Array.isArray(fields) ? fields : [];
        setPriorityFieldId(resolvePriorityFieldId(res));
        setCustomFields(list);
      }).catch(() => {
        setCustomFields([]);
        setPriorityFieldId(null);
      });
    }
  }, [open, batchParams.projectId]);


  const handleSubmit = async () => {
    if (!selectedAttrsId) {
      toast.error('请选择要批量编辑的属性');
      return;
    }
    if (selectedAttrsId === 'systemTags' && tagType !== 'CLEAR') {
      const tagsArr = tagsInput.split(/[,，\s]+/).filter(Boolean);
      if (tagsArr.length === 0) {
        toast.error('请输入标签');
        return;
      }
      setTags(tagsArr);
    }
    if (priorityFieldId && selectedAttrsId === priorityFieldId) {
      if (!caseLevelValue) {
        toast.error('请选择用例等级');
        return;
      }
    }

    setLoading(true);
    try {
      const moduleIds =
        batchParams.activeFolder === 'all' || batchParams.activeFolder === 'all_data'
          ? []
          : [batchParams.activeFolder, ...(batchParams.offspringIds || [])];

      const params: any = {
        selectIds: batchParams.selectedIds || [],
        selectAll: !!batchParams.selectAll,
        excludeIds: batchParams.excludeIds || [],
        projectId: batchParams.projectId,
        moduleIds,
        condition: batchParams.condition,
      };

      if (selectedAttrsId === 'systemTags') {
        params.append = tagType === 'APPEND';
        params.clear = tagType === 'CLEAR';
        params.tags = tagType === 'CLEAR' ? [] : tagsInput.split(/[,，\s]+/).filter(Boolean);
        params.customField = {};
      } else {
        params.customField = {
          fieldId: selectedAttrsId,
          value: selectedAttrsId === priorityFieldId ? caseLevelValue : '',
        };
      }

      await caseManagementService.batchEditAttrs(params);
      toast.success('批量编辑成功');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('批量编辑失败:', err);
      toast.error(err?.message || '批量编辑失败');
    } finally {
      setLoading(false);
    }
  };

  const selectCount = batchParams.selectAll ? '全部' : (batchParams.selectedIds?.length ?? 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>批量编辑（已选 {selectCount} 条用例）</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>选择属性</Label>
            <Select value={selectedAttrsId} onValueChange={setSelectedAttrsId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择要批量编辑的属性" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="systemTags">标签</SelectItem>
                {customFields.map((f) => (
                  <SelectItem key={f.fieldId} value={f.fieldId}>
                    {f.fieldName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAttrsId === 'systemTags' && (
            <>
              <div className="space-y-2">
                <Label>更新方式</Label>
                <RadioGroup value={tagType} onValueChange={(v) => setTagType(v as TagUpdateType)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UPDATE" id="update" />
                    <Label htmlFor="update" className="font-normal cursor-pointer">替换</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="APPEND" id="append" />
                    <Label htmlFor="append" className="font-normal cursor-pointer">追加</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CLEAR" id="clear" />
                    <Label htmlFor="clear" className="font-normal cursor-pointer">清空</Label>
                  </div>
                </RadioGroup>
              </div>
              {tagType !== 'CLEAR' && (
                <div className="space-y-2">
                  <Label>标签</Label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="多个标签用逗号分隔"
                  />
                </div>
              )}
            </>
          )}

          {priorityFieldId && selectedAttrsId === priorityFieldId && (
            <div className="space-y-2">
              <Label>用例等级</Label>
              <Select value={caseLevelValue} onValueChange={setCaseLevelValue}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CASE_LEVEL_MAP).map(([value]) => (
                    <SelectItem key={value} value={value}>
                      <CaseLevelOption value={value} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
