/**
 * 发布管理 - 手动创建云效流水线记录弹窗（用户填写信息落库）
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { PipelineRecordCreateRequest } from '@/services/gate-management';
import { requirementQualityService } from '@/services/requirement-quality';
import {
  DEPLOY_RESULT_EDIT_OPTIONS,
  ENDPOINT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from '../constants/filter-options';
import { FormFieldBox } from './FormFieldBox';
import { cn } from '@/utils/cn';

const defaultForm = (): PipelineRecordCreateRequest => ({
  pipelineId: '',
  pipelineName: '',
  repoName: '',
  endpointType: 'FRONTEND',
  deployTime: Date.now(),
  deployer: '',
  deployResult: '',
  locAdd: undefined as number | undefined,
  locDelete: undefined as number | undefined,
  storyId: '',
  storyName: '',
  projectId: '',
  projectName: '',
  isRollback: 0,
  isHotfix: 0,
  remark: '',
  frontend: '',
  backend: '',
  pipelineUrl: '',
});

export interface PipelineRecordCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectOptions: { id: string; name: string }[];
  requirementOptions: { id: string; name: string }[];
  userOptions: { id: string; name: string }[];
  onCreate: (form: PipelineRecordCreateRequest) => Promise<void>;
  saving: boolean;
}

export function PipelineRecordCreateDialog({
  open,
  onOpenChange,
  projectOptions,
  requirementOptions,
  userOptions,
  onCreate,
  saving,
}: PipelineRecordCreateDialogProps) {
  const [form, setForm] = useState<PipelineRecordCreateRequest>(defaultForm());
  const [storyPopoverOpen, setStoryPopoverOpen] = useState(false);
  const [storyFuzzySearch, setStoryFuzzySearch] = useState('');
  const [storySearchResults, setStorySearchResults] = useState<{ id: string; name: string }[]>([]);
  const [storySearchLoading, setStorySearchLoading] = useState(false);
  const storySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deployerSearch, setDeployerSearch] = useState('');
  const [frontendSearch, setFrontendSearch] = useState('');
  const [backendSearch, setBackendSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(defaultForm());
      setStoryFuzzySearch('');
      setStorySearchResults([]);
      setStoryPopoverOpen(false);
      setDeployerSearch('');
      setFrontendSearch('');
      setBackendSearch('');
      setErrors({});
    }
  }, [open]);

  // 输入关键词时从完整需求库做服务端模糊搜索，避免仅依赖「已关联测试计划组」列表
  useEffect(() => {
    const kw = storyFuzzySearch.trim();
    if (!kw) {
      if (storySearchDebounceRef.current) {
        clearTimeout(storySearchDebounceRef.current);
        storySearchDebounceRef.current = null;
      }
      setStorySearchResults([]);
      return;
    }
    if (storySearchDebounceRef.current) {
      clearTimeout(storySearchDebounceRef.current);
      storySearchDebounceRef.current = null;
    }
    storySearchDebounceRef.current = setTimeout(() => {
      storySearchDebounceRef.current = null;
      setStorySearchLoading(true);
      requirementQualityService
        .storySearch(kw)
        .then((list) => {
          setStorySearchResults(Array.isArray(list) ? list : []);
        })
        .catch(() => setStorySearchResults([]))
        .finally(() => setStorySearchLoading(false));
    }, 300);
    return () => {
      if (storySearchDebounceRef.current) {
        clearTimeout(storySearchDebounceRef.current);
      }
    };
  }, [storyFuzzySearch]);

  const filteredRequirements = useMemo(() => {
    const kw = storyFuzzySearch.trim();
    if (kw) return storySearchResults;
    return requirementOptions;
  }, [requirementOptions, storyFuzzySearch, storySearchResults]);

  const filteredDeployerUsers = useMemo(() => {
    const kw = deployerSearch.trim().toLowerCase();
    if (!kw) return userOptions;
    return userOptions.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(kw)) ||
        (u.id && u.id.toLowerCase().includes(kw))
    );
  }, [deployerSearch, userOptions]);

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

  const projectOptionsForDisplay = useMemo(() => {
    if (!form.projectId?.trim()) return projectOptions;
    const exists = projectOptions.some((p) => p.id === form.projectId);
    if (exists) return projectOptions;
    const name = form.projectName?.trim() || form.projectId;
    return [{ id: form.projectId, name }, ...projectOptions];
  }, [projectOptions, form.projectId, form.projectName]);

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!form.pipelineId?.trim()) next.pipelineId = '请填写流水线ID';
    if (!form.pipelineName?.trim()) next.pipelineName = '请填写流水线名称';
    if (!form.repoName?.trim()) next.repoName = '请填写代码仓库名称';
    if (!form.deployResult?.trim()) next.deployResult = '请选择发布结果';
    if (!form.projectId?.trim()) next.projectId = '请选择项目';
    if (!form.deployTime || Number.isNaN(form.deployTime)) next.deployTime = '请选择发布时间';
    if (!form.deployer?.trim()) next.deployer = '请选择发布人';
    if (form.locAdd === undefined || form.locAdd === null) next.locAdd = '请填写代码新增行数';
    if (form.locDelete === undefined || form.locDelete === null) next.locDelete = '请填写代码删除行数';
    if (!form.storyId?.trim()) next.storyId = '请选择需求';
    if (!form.pipelineUrl?.trim()) next.pipelineUrl = '流水线链接';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onCreate(form);
  };

  const deployTimeDisplay = (() => {
    if (!form.deployTime || Number.isNaN(form.deployTime)) return '';
    const d = new Date(form.deployTime);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>手动创建云效流水线</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 flex-1 min-h-0 overflow-y-auto pr-1">
          <FormFieldBox label="流水线ID" required error={errors.pipelineId}>
            <Input
              value={form.pipelineId}
              onChange={(e) => {
                setErrors((err) => ({ ...err, pipelineId: '' }));
                setForm((f) => ({ ...f, pipelineId: e.target.value }));
              }}
              placeholder="云效流水线运行 ID"
              className="border-gray-200 bg-white font-mono text-sm"
            />
          </FormFieldBox>
          <FormFieldBox label="流水线名称" required error={errors.pipelineName}>
            <Input
              value={form.pipelineName ?? ''}
              onChange={(e) => {
                setErrors((err) => ({ ...err, pipelineName: '' }));
                setForm((f) => ({ ...f, pipelineName: e.target.value }));
              }}
              placeholder="请填写流水线名称"
              className="border-gray-200 bg-white"
            />
          </FormFieldBox>
          <FormFieldBox label="流水线链接" required error={errors.pipelineUrl}>
            <Input
              value={form.pipelineUrl ?? ''}
              onChange={(e) => {
                setErrors((err) => ({ ...err, pipelineUrl: '' }));
                setForm((f) => ({ ...f, pipelineUrl: e.target.value.trim() || '' }));
              }}
              className="border-gray-200 bg-white font-mono text-sm"
            />
          </FormFieldBox>
          <FormFieldBox label="代码仓库名称" required error={errors.repoName}>
            <Input
              value={form.repoName}
              onChange={(e) => {
                setErrors((err) => ({ ...err, repoName: '' }));
                setForm((f) => ({ ...f, repoName: e.target.value }));
              }}
              placeholder="与云效中代码仓库名称一致"
              className="border-gray-200 bg-white"
            />
          </FormFieldBox>
          <FormFieldBox label="类型">
            <Select
              value={form.endpointType}
              onValueChange={(v) => setForm((f) => ({ ...f, endpointType: v }))}
            >
              <SelectTrigger className="border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENDPOINT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldBox>
          <FormFieldBox label="发布时间" required error={errors.deployTime}>
            <Input
              type="datetime-local"
              value={deployTimeDisplay}
              onChange={(e) => {
                setErrors((err) => ({ ...err, deployTime: '' }));
                const v = e.target.value;
                const ts = v ? new Date(v).getTime() : NaN;
                setForm((f) => ({ ...f, deployTime: Number.isNaN(ts) ? 0 : ts }));
              }}
              className="border-gray-200 bg-white"
            />
          </FormFieldBox>
          <FormFieldBox label="发布人" required error={errors.deployer}>
            <Select
              value={form.deployer ?? ''}
              onValueChange={(v) => {
                setErrors((err) => ({ ...err, deployer: '' }));
                setForm((f) => ({ ...f, deployer: v }));
              }}
            >
              <SelectTrigger className="border-gray-200 bg-white relative pr-10">
                <SelectValue placeholder="请选择" />
                {form.deployer && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm(f => ({ ...f, deployer: '' }));
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
                    value={deployerSearch}
                    onChange={(e) => setDeployerSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-9"
                    autoFocus
                  />
                </div>
                <div className="p-1">
                  {filteredDeployerUsers.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">无匹配</div>
                  ) : (
                    filteredDeployerUsers.map((opt) => (
                      <SelectItem key={opt.id} value={opt.name}>
                        {opt.name}
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </FormFieldBox>
          <FormFieldBox label="代码新增行数" required error={errors.locAdd}>
            <Input
              type="text"
              value={form.locAdd === undefined ? '' : String(form.locAdd)}
              onChange={(e) => {
                setErrors((err) => ({ ...err, locAdd: '' }));
                const v = e.target.value.trim();
                setForm((f) => ({ ...f, locAdd: v === '' ? undefined : Math.max(0, Number(v) || 0) }));
              }}
              placeholder="0"
              className="border-gray-200 bg-white"
            />
          </FormFieldBox>
          <FormFieldBox label="代码删除行数" required error={errors.locDelete}>
            <Input
              type="text"
              value={form.locDelete === undefined ? '' : String(form.locDelete)}
              onChange={(e) => {
                setErrors((err) => ({ ...err, locDelete: '' }));
                const v = e.target.value.trim();
                setForm((f) => ({ ...f, locDelete: v === '' ? undefined : Math.max(0, Number(v) || 0) }));
              }}
              placeholder="0"
              className="border-gray-200 bg-white"
            />
          </FormFieldBox>
          <FormFieldBox label="发布结果" required error={errors.deployResult}>
            <Select
              value={form.deployResult}
              onValueChange={(v) => {
                setErrors((err) => ({ ...err, deployResult: '' }));
                setForm((f) => ({ ...f, deployResult: v }));
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
                  title={form.storyName ?? form.storyId ?? '请选择需求'}
                >
                  <span className="truncate">
                    {form.storyName ?? form.storyId ?? '请选择需求'}
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
                    <div className="py-6 text-center text-sm text-muted-foreground">搜索中…</div>
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
                          form.storyId === opt.id && 'bg-accent'
                        )}
                        onClick={() => {
                          setErrors((e) => ({ ...e, storyId: '' }));
                          setForm((f) => ({ ...f, storyId: opt.id, storyName: opt.name }));
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
              value={form.projectId ?? ''}
              onValueChange={(v) => {
                setErrors((e) => ({ ...e, projectId: '' }));
                const opt = projectOptionsForDisplay.find((p) => p.id === v);
                setForm((f) => ({ ...f, projectId: v, projectName: opt?.name ?? '' }));
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
          <FormFieldBox label="是否回滚">
            <Select
              value={String(form.isRollback ?? 0)}
              onValueChange={(v) => setForm((f) => ({ ...f, isRollback: Number(v) }))}
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
              value={String(form.isHotfix ?? 0)}
              onValueChange={(v) => setForm((f) => ({ ...f, isHotfix: Number(v) }))}
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
              value={form.remark ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
              placeholder="可选"
              className="border-gray-200 bg-white"
            />
          </FormFieldBox>
          <FormFieldBox label="前端负责人/开发">
            <Select
              value={form.frontend ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, frontend: v }))}
            >
              <SelectTrigger className="border-gray-200 bg-white relative pr-10">
                <SelectValue placeholder="请选择" />
                {form.frontend && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm(f => ({ ...f, frontend: '' }));
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
              value={form.backend ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, backend: v }))}
            >
              <SelectTrigger className="border-gray-200 bg-white relative pr-10">
                <SelectValue placeholder="请选择" />
                {form.backend && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm(f => ({ ...f, backend: '' }));
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
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '提交中...' : '创建并落库'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
