/**
 * 门禁管理 - 运维补全弹窗（需求单选模糊、项目、发布结果、是否回滚/热修、备注、负责人）
 * 使用统一 FormFieldBox 表单项框，展示更明显
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PipelineRecordUpdateRequest } from '@/services/gate-management';
import { DEPLOY_RESULT_EDIT_OPTIONS, YES_NO_OPTIONS } from '../constants/filter-options';
import { FormFieldBox } from './FormFieldBox';
import { cn } from '@/utils/cn';

export interface PipelineRecordEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: PipelineRecordUpdateRequest | null;
  setEditForm: React.Dispatch<React.SetStateAction<PipelineRecordUpdateRequest | null>>;
  projectOptions: { id: string; name: string }[];
  requirementOptions: { id: string; name: string }[];
  userOptions: { id: string; name: string }[];
  filteredRequirements: { id: string; name: string }[];
  storySearchLoading?: boolean;
  storyPopoverOpen: boolean;
  setStoryPopoverOpen: (v: boolean) => void;
  storyFuzzySearch: string;
  setStoryFuzzySearch: (v: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function PipelineRecordEditDialog({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  projectOptions,
  requirementOptions,
  userOptions,
  filteredRequirements,
  storySearchLoading = false,
  storyPopoverOpen,
  setStoryPopoverOpen,
  storyFuzzySearch,
  setStoryFuzzySearch,
  onSave,
  onClose,
  saving,
}: PipelineRecordEditDialogProps) {
  const [frontendSearch, setFrontendSearch] = useState('');
  const [backendSearch, setBackendSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFrontendSearch('');
      setBackendSearch('');
      setErrors({});
    }
  }, [open]);

  const handleSave = async () => {
    if (!editForm) return;
    const next: Record<string, string> = {};
    if (!editForm.storyId?.trim()) next.storyId = '请选择需求';
    if (!editForm.projectId?.trim()) next.projectId = '请选择项目';
    if (!editForm.deployResult?.trim()) next.deployResult = '请选择发布结果';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSave();
  };

  const filteredFrontendUsers = useMemo(() => {
    const kw = frontendSearch.trim().toLowerCase();
    if (!kw) return userOptions;
    return userOptions.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(kw)) ||
        (u.id && u.id.toLowerCase().includes(kw))
    );
  }, [frontendSearch, userOptions]);

  const filteredBackendUsers = useMemo(() => {
    const kw = backendSearch.trim().toLowerCase();
    if (!kw) return userOptions;
    return userOptions.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(kw)) ||
        (u.id && u.id.toLowerCase().includes(kw))
    );
  }, [backendSearch, userOptions]);

  /** 项目下拉选项：若当前已选项目不在列表中（如来自其他筛选），则加入一项以便回显名称 */
  const projectOptionsForDisplay = useMemo(() => {
    if (!editForm?.projectId?.trim()) return projectOptions;
    const exists = projectOptions.some((p) => p.id === editForm.projectId);
    if (exists) return projectOptions;
    const name = editForm.projectName?.trim() || editForm.projectId;
    return [{ id: editForm.projectId, name }, ...projectOptions];
  }, [projectOptions, editForm?.projectId, editForm?.projectName]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="sr-only">编辑流水线记录</DialogTitle>
        </DialogHeader>
        {editForm && (
          <div className="grid gap-4 py-2 flex-1 min-h-0 overflow-y-auto pr-1">
            <FormFieldBox label="需求（Story）" required error={errors.storyId}>
              <Popover open={storyPopoverOpen} onOpenChange={setStoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 py-2 text-sm transition-colors hover:bg-accent/50',
                      'overflow-hidden [&>span]:min-w-0 [&>span]:truncate text-left'
                    )}
                    aria-label="选择需求"
                    title={
                      editForm.storyName ??
                      requirementOptions.find((r) => r.id === editForm.storyId)?.name ??
                      editForm.storyId ??
                      '请选择需求'
                    }
                  >
                    <span className="truncate">
                      {editForm.storyName ??
                        requirementOptions.find((r) => r.id === editForm.storyId)?.name ??
                        editForm.storyId ??
                        '请选择需求'}
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="输入关键词模糊筛选"
                      value={storyFuzzySearch}
                      onChange={(e) => setStoryFuzzySearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <div
                    className="max-h-[240px] overflow-y-auto overflow-x-hidden p-1"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {storySearchLoading ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">搜索中...</div>
                    ) : filteredRequirements.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {storyFuzzySearch.trim() ? '无匹配需求' : '输入关键词搜索需求库'}
                      </div>
                    ) : (
                      filteredRequirements.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={cn(
                            'flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 px-2 text-left text-sm outline-none hover:bg-accent',
                            editForm.storyId === opt.id && 'bg-accent'
                          )}
                          onClick={() => {
                            setErrors((e) => {
                              const next = { ...e };
                              delete next.storyId;
                              return next;
                            });
                            setEditForm((f) => (f ? { ...f, storyId: opt.id, storyName: opt.name } : f));
                            setStoryPopoverOpen(false);
                            setStoryFuzzySearch('');
                          }}
                        >
                          <span className="truncate">{opt.name}</span>
                          {opt.id && (
                            <span className="text-xs text-muted-foreground shrink-0">{opt.id}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </FormFieldBox>
            <FormFieldBox label="项目" required error={errors.projectId}>
              <Select
                value={editForm.projectId ?? ''}
                onValueChange={(v) => {
                  setErrors((e) => {
                    const next = { ...e };
                    delete next.projectId;
                    return next;
                  });
                  const opt = projectOptionsForDisplay.find((p) => p.id === v);
                  setEditForm((f) => (f ? { ...f, projectId: v, projectName: opt?.name ?? f.projectName } : f));
                }}
              >
                <SelectTrigger className="border-gray-200 bg-white">
                  <SelectValue placeholder="请选择项目" />
                </SelectTrigger>
                <SelectContent
                  className="max-h-[280px] overflow-y-scroll overflow-x-hidden"
                  onWheel={(e) => e.stopPropagation()}
                  position="popper"
                >
                  {projectOptionsForDisplay.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldBox>
            <FormFieldBox label="发布结果" required error={errors.deployResult}>
              <Select
                value={editForm.deployResult || ''}
                onValueChange={(v) => {
                  setErrors((e) => {
                    const next = { ...e };
                    delete next.deployResult;
                    return next;
                  });
                  setEditForm((f) => (f ? { ...f, deployResult: v } : f));
                }}
              >
                <SelectTrigger className="border-gray-200 bg-white">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {DEPLOY_RESULT_EDIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldBox>
            <FormFieldBox label="流水线链接">
              <Input
                value={editForm.pipelineUrl ?? ''}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, pipelineUrl: e.target.value } : f))
                }
                placeholder="可选，填写后可在列表中点击跳转"
                className="border-gray-200 bg-white font-mono text-sm"
              />
            </FormFieldBox>
            <FormFieldBox label="是否回滚">
              <Select
                value={String(editForm.isRollback ?? 0)}
                onValueChange={(v) => setEditForm((f) => (f ? { ...f, isRollback: Number(v) as 0 | 1 } : f))}
              >
                <SelectTrigger className="border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldBox>
            <FormFieldBox label="是否热修">
              <Select
                value={String(editForm.isHotfix ?? 0)}
                onValueChange={(v) => setEditForm((f) => (f ? { ...f, isHotfix: Number(v) as 0 | 1 } : f))}
              >
                <SelectTrigger className="border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldBox>
            <FormFieldBox label="备注">
              <Input
                value={editForm.remark ?? ''}
                onChange={(e) => setEditForm((f) => (f ? { ...f, remark: e.target.value } : f))}
                placeholder="可选"
                className="border-gray-200 bg-white"
              />
            </FormFieldBox>
            <FormFieldBox label="前端负责人/开发">
              <Select
                value={editForm.frontend ?? ''}
                onValueChange={(v) => setEditForm((f) => (f ? { ...f, frontend: v } : f))}
              >
                <SelectTrigger className="border-gray-200 bg-white relative pr-10">
                  <SelectValue placeholder="请选择" />
                  {editForm.frontend && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditForm(f => f ? { ...f, frontend: '' } : f);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-[260px] overflow-y-auto p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="输入姓名或ID模糊搜索"
                      value={frontendSearch}
                      onChange={(e) => setFrontendSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <div className="p-1">
                    {filteredFrontendUsers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">无匹配负责人</div>
                    ) : (
                      filteredFrontendUsers.map((opt) => (
                        <SelectItem key={opt.id} value={opt.name}>
                          {opt.name}
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
            </FormFieldBox>
            <FormFieldBox label="后端负责人/开发">
              <Select
                value={editForm.backend ?? ''}
                onValueChange={(v) => setEditForm((f) => (f ? { ...f, backend: v } : f))}
              >
                <SelectTrigger className="border-gray-200 bg-white relative pr-10">
                  <SelectValue placeholder="请选择" />
                  {editForm.backend && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditForm(f => f ? { ...f, backend: '' } : f);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-[260px] overflow-y-auto p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="输入姓名或ID模糊搜索"
                      value={backendSearch}
                      onChange={(e) => setBackendSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <div className="p-1">
                    {filteredBackendUsers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">无匹配负责人</div>
                    ) : (
                      filteredBackendUsers.map((opt) => (
                        <SelectItem key={opt.id} value={opt.name}>
                          {opt.name}
                        </SelectItem>
                      ))
                    )}
                  </div>
                </SelectContent>
              </Select>
            </FormFieldBox>
          </div>
        )}
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
