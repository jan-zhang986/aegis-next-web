/**
 * 创建/编辑评审
 * 完整迁移自 spotter-metersphere caseReview/create.vue
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, User, X, CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { caseManagementService } from '@/services';
import { toast } from 'sonner';
import type { ModuleTreeNode } from './types';
import { REVIEW_PASS_RULE_MAP } from './constants';
import { AssociateCaseDrawer, type BaseAssociateCaseRequest } from './components/AssociateCaseDrawer';

function flattenTree(nodes: ModuleTreeNode[], indent = 0): { node: ModuleTreeNode; indent: number }[] {
  const result: { node: ModuleTreeNode; indent: number }[] = [];
  for (const node of nodes) {
    result.push({ node, indent });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, indent + 1));
    }
  }
  return result;
}

interface CreateReviewProps {
  projectId?: string;
  moduleId?: string;
  reviewId?: string;
  onBack?: () => void;
  onSuccess?: (reviewId: string) => void;
  /** 在抽屉内展示时为 true，隐藏返回按钮、使用紧凑布局 */
  inDrawer?: boolean;
}

export function CreateReview({
  projectId = localStorage.getItem('currentProjectId') || 'default-project',
  moduleId,
  reviewId,
  onBack,
  onSuccess,
  inDrawer = false,
}: CreateReviewProps) {
  const isEdit = !!reviewId;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(moduleId || 'root');
  const [reviewPassRule, setReviewPassRule] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [cycle, setCycle] = useState<{ from?: Date; to?: Date } | undefined>();

  const [moduleTree, setModuleTree] = useState<ModuleTreeNode[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [reviewerOptions, setReviewerOptions] = useState<{ id: string; name: string }[]>([]);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [reviewerPopoverOpen, setReviewerPopoverOpen] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [cyclePopoverOpen, setCyclePopoverOpen] = useState(false);
  const [associateDrawerOpen, setAssociateDrawerOpen] = useState(false);
  const [baseAssociateCaseRequest, setBaseAssociateCaseRequest] = useState<BaseAssociateCaseRequest>({
    excludeIds: [],
    selectIds: [],
    selectAll: false,
    condition: {},
    moduleIds: [],
    versionId: '',
    refId: '',
    projectId: '',
  });

  const fetchModules = async () => {
    setModuleLoading(true);
    try {
      const result = await caseManagementService.getReviewModules(projectId);
      setModuleTree(result || []);
    } catch (err) {
      console.error('获取评审模块失败:', err);
    } finally {
      setModuleLoading(false);
    }
  };

  const handleUploadImage = useCallback(
    async (file: File): Promise<string> => {
      const res: any = await caseManagementService.editorUploadFile({ fileList: [file] });
      let fileId: string | undefined;
      if (typeof res === 'string') fileId = res;
      else if (res?.data != null) fileId = typeof res.data === 'string' ? res.data : res.data?.id ?? res.data?.fileId;
      else if (res?.id) fileId = res.id;
      else if (res?.fileId) fileId = res.fileId;
      if (!fileId || typeof fileId !== 'string') throw new Error('上传失败：无法获取文件 ID');
      return `/attachment/download/file/${projectId}/${fileId}/true`;
    },
    [projectId]
  );

  const fetchReviewers = async () => {
    setReviewerLoading(true);
    try {
      const res: any = await caseManagementService.getReviewUsers(projectId, '');
      const list = Array.isArray(res) ? res : res?.list ?? res?.data ?? [];
      setReviewerOptions(list.map((u: any) => ({ id: u.id, name: u.name || u.userName || u.email || '-' })));
    } catch (err) {
      console.error('获取评审人失败:', err);
    } finally {
      setReviewerLoading(false);
    }
  };

  const loadReviewDetail = async () => {
    if (!reviewId) return;
    setLoading(true);
    try {
      const detail: any = await caseManagementService.getReviewDetail(reviewId);
      setName(detail.name || '');
      setDescription(detail.description || '');
      setFolderId(detail.moduleId || 'root');
      setReviewPassRule((detail.reviewPassRule as 'SINGLE' | 'MULTIPLE') || 'SINGLE');
      const reviewers = detail.reviewers || [];
      setReviewerIds(reviewers.map((r: any) => r.userId || r.id).filter(Boolean));
      setTags(detail.tags || []);
      if (detail.startTime || detail.endTime) {
        setCycle({
          from: detail.startTime ? new Date(detail.startTime) : undefined,
          to: detail.endTime ? new Date(detail.endTime) : undefined,
        });
      }
    } catch (err) {
      toast.error('加载评审详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); fetchReviewers(); }, [projectId]);
  useEffect(() => { if (isEdit) loadReviewDetail(); }, [reviewId, isEdit]);

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) {
      setTags([...tags, v]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const toggleReviewer = (id: string) => {
    setReviewerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filteredReviewers = reviewerSearch.trim()
    ? reviewerOptions.filter((r) => r.name.toLowerCase().includes(reviewerSearch.toLowerCase()))
    : reviewerOptions;

  useEffect(() => {
    setBaseAssociateCaseRequest((prev) => ({ ...prev, projectId }));
  }, [projectId]);

  const handleSubmit = async (isGoReview = false) => {
    if (!name.trim()) {
      toast.error('请输入评审名称');
      return;
    }
    if (reviewerIds.length === 0) {
      toast.error('请至少选择一位评审人');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await caseManagementService.editReview({
          id: reviewId!,
          projectId,
          name: name.trim(),
          moduleId: folderId === 'root' ? 'root' : folderId,
          reviewPassRule,
          startTime: cycle?.from ? cycle.from.getTime() : null,
          endTime: cycle?.to ? cycle.to.getTime() : null,
          tags,
          description: description.trim(),
          reviewers: reviewerIds,
        });
        toast.success('更新成功');
        onSuccess?.(reviewId);
      } else {
        const res: any = await caseManagementService.addReview({
          projectId,
          name: name.trim(),
          moduleId: folderId === 'root' ? 'root' : folderId,
          reviewPassRule,
          startTime: cycle?.from ? cycle.from.getTime() : null,
          endTime: cycle?.to ? cycle.to.getTime() : null,
          tags,
          description: description.trim(),
          reviewers: reviewerIds,
          baseAssociateCaseRequest: { ...baseAssociateCaseRequest, projectId, reviewers: reviewerIds },
        });
        const id = res?.id || res?.data?.id;
        toast.success('创建成功');
        if (isGoReview && id) {
          onSuccess?.(id);
        } else {
          onBack?.();
        }
      }
    } catch (err: any) {
      toast.error(err?.message || (isEdit ? '更新失败' : '创建失败'));
    } finally {
      setLoading(false);
    }
  };

  const flatModules = flattenTree(moduleTree);

  return (
    <div className={inDrawer ? 'flex flex-col h-full overflow-hidden' : 'flex-1 flex flex-col bg-[#f5f6f8] min-h-0 overflow-hidden'}>
      <Card className={inDrawer ? 'flex-1 min-h-0 overflow-auto border-0 shadow-none rounded-none' : 'flex-1 m-4 min-h-0 overflow-auto border-gray-200/80 shadow-sm rounded-lg max-w-3xl mx-auto w-full'}>
        <CardContent className={inDrawer ? 'p-5' : 'p-6 sm:p-8'}>
          <div className="flex items-center gap-3 mb-6">
            {!inDrawer && onBack && (
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#165DFF] -ml-2" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> 返回
              </Button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">{isEdit ? '编辑评审' : '创建评审'}</h2>
          </div>

          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">评审名称 <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入评审名称"
                className="h-10 rounded-lg border-gray-200"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">评审描述</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="请输入评审描述（支持富文本与图片）"
                minHeight="120px"
                uploadImage={handleUploadImage}
                editorClassName="text-sm rounded-lg border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">所属模块</Label>
              <Select value={folderId} onValueChange={setFolderId} disabled={moduleLoading}>
                <SelectTrigger className="h-10 rounded-lg border-gray-200 mt-0">
                  <SelectValue placeholder="请选择所属模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">根目录</SelectItem>
                  {flatModules.map(({ node, indent }) => (
                    <SelectItem key={node.id} value={node.id}>
                      <span style={{ paddingLeft: indent * 12 }}>{node.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">评审类型</Label>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <RadioGroup value={reviewPassRule} onValueChange={(v) => setReviewPassRule(v as 'SINGLE' | 'MULTIPLE')} className="flex gap-8">
                    {(['SINGLE', 'MULTIPLE'] as const).map((k) => (
                      <div key={k} className="flex items-center space-x-2">
                        <RadioGroupItem value={k} id={k} className="border-gray-300 data-[state=checked]:border-[#165DFF] data-[state=checked]:bg-[#165DFF]" />
                        <Label htmlFor={k} className="font-normal cursor-pointer text-gray-700">
                          {REVIEW_PASS_RULE_MAP[k]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">默认评审人 <span className="text-red-500">*</span></Label>
              <Popover open={reviewerPopoverOpen} onOpenChange={setReviewerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-auto min-h-10 rounded-lg border-gray-200 justify-between font-normal text-gray-700 py-2 px-3" disabled={reviewerLoading}>
                    {reviewerIds.length > 0 ? (
                      <span className="flex flex-wrap items-center gap-1.5 text-left flex-1 min-w-0">
                        {reviewerOptions
                          .filter((r) => reviewerIds.includes(r.id))
                          .slice(0, 5)
                          .map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center max-w-[120px] px-2 py-0.5 rounded-md bg-[#165DFF]/10 text-[#165DFF] text-xs font-medium truncate"
                              title={r.name}
                            >
                              {r.name}
                            </span>
                          ))}
                        {reviewerIds.length > 5 && (
                          <span className="text-xs text-gray-500">+{reviewerIds.length - 5} 人</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">请选择评审人</span>
                    )}
                    <ChevronDown className="w-4 h-4 shrink-0 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 rounded-lg border-gray-200 shadow-lg" align="start">
                  <div className="p-2 border-b border-gray-100 flex items-center justify-between gap-2">
                    <Input
                      placeholder="搜索成员"
                      value={reviewerSearch}
                      onChange={(e) => setReviewerSearch(e.target.value)}
                      className="h-9 rounded-md border-gray-200 flex-1"
                    />
                    {reviewerIds.length > 0 && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">已选 {reviewerIds.length} 人</span>
                    )}
                  </div>
                  <ScrollArea className="h-[220px]">
                    {filteredReviewers.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${reviewerIds.includes(r.id) ? 'bg-[#165DFF]/5' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleReviewer(r.id)}
                      >
                        <Checkbox checked={reviewerIds.includes(r.id)} className="rounded-[2px] border-gray-300 data-[state=checked]:bg-[#165DFF] data-[state=checked]:border-[#165DFF]" />
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="flex-1 text-sm text-gray-800 truncate">{r.name}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">标签</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-sm text-gray-700"
                  >
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-red-600 rounded p-0.5 hover:bg-red-50">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="输入标签回车添加"
                    className="w-32 h-9 rounded-lg border-gray-200 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={addTag}>
                    添加
                  </Button>
                </div>
              </div>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">选择用例</Label>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-gray-500 hover:text-[#165DFF]"
                    onClick={() => setBaseAssociateCaseRequest((p) => ({ ...p, selectIds: [], moduleIds: [] }))}
                  >
                    清空已选
                  </Button>
                </div>
                <div
                  className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 cursor-pointer hover:bg-gray-100/80 hover:border-gray-300 transition-colors"
                  onClick={() => setAssociateDrawerOpen(true)}
                >
                  <span className="text-sm text-gray-600">
                    已选 <span className="font-medium text-gray-900">{baseAssociateCaseRequest.selectIds.length}</span> 个用例
                    {baseAssociateCaseRequest.moduleIds?.length > 0 && (
                      <>，<span className="font-medium text-gray-900">{baseAssociateCaseRequest.moduleIds.length}</span> 个模块</>
                    )}
                    ，<span className="text-[#165DFF] font-medium hover:underline">点击关联用例</span>
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">评审周期</Label>
              <Popover open={cyclePopoverOpen} onOpenChange={setCyclePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-10 rounded-lg border-gray-200 justify-start text-left font-normal text-gray-700" type="button">
                    {cycle?.from && cycle?.to
                      ? `${cycle.from.toLocaleDateString('zh-CN')} 至 ${cycle.to.toLocaleDateString('zh-CN')}`
                      : '选择日期范围（可选）'}
                    <CalendarIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-lg border-gray-200 shadow-lg" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-600">选择开始与结束日期</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          setCycle(undefined);
                        }}
                      >
                        清空
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 bg-[#165DFF] hover:bg-[#165DFF]/90"
                        onClick={() => setCyclePopoverOpen(false)}
                      >
                        确定
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    mode="range"
                    selected={cycle}
                    onSelect={(r) => setCycle(r ?? undefined)}
                    numberOfMonths={2}
                    defaultMonth={cycle?.from ?? new Date()}
                    classNames={{ months: 'flex flex-col sm:flex-row gap-4' }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
              {isEdit ? (
                <>
                  <Button className="h-10 rounded-lg bg-[#165DFF] hover:bg-[#165DFF]/90 px-5" onClick={() => handleSubmit(false)} disabled={loading}>
                    {loading ? '更新中...' : '更新'}
                  </Button>
                  {onBack && (
                    <Button variant="outline" className="h-10 rounded-lg" onClick={onBack}>
                      取消
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button className="h-10 rounded-lg bg-[#165DFF] hover:bg-[#165DFF]/90 px-5" onClick={() => handleSubmit(true)} disabled={loading}>
                    {loading ? '创建中...' : '创建并评审'}
                  </Button>
                  <Button variant="outline" className="h-10 rounded-lg" onClick={() => handleSubmit(false)} disabled={loading}>
                    {loading ? '保存中...' : '保存'}
                  </Button>
                  {onBack && (
                    <Button variant="ghost" className="h-10 rounded-lg text-gray-600" onClick={onBack}>
                      取消
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <AssociateCaseDrawer
            open={associateDrawerOpen}
            onOpenChange={setAssociateDrawerOpen}
            projectId={projectId}
            reviewers={reviewerIds}
            initialSelectIds={baseAssociateCaseRequest.selectIds?.length ? baseAssociateCaseRequest.selectIds : undefined}
            initialModuleIds={baseAssociateCaseRequest.moduleIds?.length ? baseAssociateCaseRequest.moduleIds : undefined}
            onSuccess={(params) => {
              const { reviewers: _r, ...req } = params;
              setBaseAssociateCaseRequest(req);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
