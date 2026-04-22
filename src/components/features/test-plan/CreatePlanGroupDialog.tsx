/**
 * 新建/编辑测试计划组弹窗
 * 与老前端 createAndUpdatePlanGroup 一致：计划组编辑走此弹窗，与「编辑测试计划」抽屉区分
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { testPlanManagementService } from '@/services';
import { requirementQualityService } from '@/services/requirement-quality';
import { toast } from 'sonner';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import type { ModuleTreeNode } from '@/types/testPlan';
import { testPlanTypeEnum } from '@/constants/testPlanEnums';

export interface CreatePlanGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  moduleTree: ModuleTreeNode[];
  moduleId?: string;
  /** 编辑时传入计划组 id，不传则为新建 */
  planGroupId?: string;
  onSuccess?: () => void;
}

export function CreatePlanGroupDialog(props: CreatePlanGroupDialogProps) {
  const {
    open,
    onOpenChange,
    projectId,
    moduleTree,
    moduleId: initialModuleId,
    planGroupId,
    onSuccess,
  } = props;
  const isEdit = !!planGroupId;
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState(initialModuleId || 'root');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [feishuStoryId, setFeishuStoryId] = useState('');
  const [feishuStoryKeyword, setFeishuStoryKeyword] = useState('');
  const [storyOptions, setStoryOptions] = useState<{ id: string; name: string }[]>([]);
  const [storySearching, setStorySearching] = useState(false);
  const [storyDropdownOpen, setStoryDropdownOpen] = useState(false);
  const storySearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 编辑时缓存的计划组详情，提交更新时与表单合并后发送（与 createAndUpdatePlanGroup.vue 一致） */
  const detailRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const loadDetail = useCallback(async () => {
    if (!planGroupId) return;
    setDetailLoading(true);
    try {
      const detail = await testPlanManagementService.getTestPlanDetail(planGroupId);
      detailRef.current = detail;
      setName(detail.name ?? '');
      setModuleId(detail.moduleId && detail.moduleId !== 'all' ? detail.moduleId : 'root');
      setTags(Array.isArray(detail.tags) ? detail.tags : []);
      const fid = detail.feishuStoryId ?? '';
      setFeishuStoryId(fid);
      if (fid) {
        const results = await requirementQualityService.storySearch(fid);
        const found = results?.find((r: { id: string }) => r.id === fid);
        setFeishuStoryKeyword(found ? `${fid} - ${found.name}` : fid);
      } else {
        setFeishuStoryKeyword('');
      }
    } catch (e) {
      console.error('加载计划组详情失败:', e);
      toast.error('加载计划组详情失败');
      detailRef.current = null;
    } finally {
      setDetailLoading(false);
    }
  }, [planGroupId]);

  useEffect(() => {
    if (open) {
      if (planGroupId) {
        loadDetail();
      } else {
        detailRef.current = null;
        setName('');
        setModuleId(initialModuleId && initialModuleId !== 'all' ? initialModuleId : 'root');
        setTags([]);
        setTagInput('');
        setFeishuStoryId('');
        setFeishuStoryKeyword('');
      }
    }
  }, [open, planGroupId, initialModuleId, loadDetail]);

  const searchFeishu = useCallback((keyword: string) => {
    if (storySearchRef.current) clearTimeout(storySearchRef.current);
    if (!keyword.trim()) {
      setStoryOptions([]);
      return;
    }
    storySearchRef.current = setTimeout(() => {
      storySearchRef.current = null;
      setStorySearching(true);
      requirementQualityService.storySearch(keyword.trim()).then((res) => {
        setStoryOptions(Array.isArray(res) ? res : []);
      }).finally(() => setStorySearching(false));
    }, 300);
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const renderTreeNode = (node: ModuleTreeNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = moduleId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="mb-0.5" style={{ paddingLeft: `${level * 12}px` }}>
        <div
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            setModuleId(node.id);
          }}
          className={`group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 text-[#165DFF] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-[#165DFF]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              )
            ) : (
              <div className="w-3.5 flex-shrink-0" />
            )}
            <span className="truncate text-sm">{node.name}</span>
          </div>
        </div>
        {hasChildren && isExpanded && Array.isArray(node.children) && (
          <div className="mt-0.5">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  /** 与 createAndUpdatePlanGroup.vue 对齐：计划组固定 groupId:'NONE', type:GROUP，feishuStoryId 传空字符串 */
  const buildPlanGroupPayload = () => ({
    projectId,
    name: name.trim(),
    type: testPlanTypeEnum.GROUP,
    groupId: 'NONE',
    moduleId: moduleId === 'root' || !moduleId ? 'root' : moduleId,
    tags,
    description: '',
    passThreshold: 100,
    repeatCase: false,
    automaticStatusUpdate: true,
    testPlanning: false,
    cycle: [] as number[],
    baseAssociateCaseRequest: { selectIds: [] as string[], selectAll: false, condition: {} },
    feishuStoryId: feishuStoryId || '',
  });

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('请输入计划组名称');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && planGroupId) {
        const base = buildPlanGroupPayload();
        const params = detailRef.current
          ? { ...detailRef.current, ...base, id: planGroupId, groupId: 'NONE', type: testPlanTypeEnum.GROUP, projectId }
          : { ...base, id: planGroupId };
        await testPlanManagementService.updateTestPlan(params as any);
        toast.success('计划组更新成功');
      } else {
        await testPlanManagementService.addTestPlan(buildPlanGroupPayload() as any);
        toast.success('计划组创建成功');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(isEdit ? '更新计划组失败' : '创建计划组失败', err);
      toast.error(err?.message || (isEdit ? '更新失败' : '创建失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base font-normal">
            {isEdit ? '更新计划组' : '新建计划组'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {detailLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">加载中...</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  计划组名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="请输入计划组名称"
                  className="h-9"
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">所属模块</Label>
                <div className="border border-gray-200 rounded-md max-h-[200px] overflow-y-auto p-2 bg-gray-50/50">
                  <div
                    onClick={() => setModuleId('NONE')}
                    className={`px-3 py-1.5 rounded cursor-pointer text-sm ${
                      moduleId === 'NONE' ? 'bg-blue-50 text-[#165DFF] font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    未规划计划
                  </div>
                  {moduleTree.length === 0 ? null : moduleTree.map(node => renderTreeNode(node))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">标签</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-md bg-gray-50/50 min-h-[36px]">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(i)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="添加标签, 回车结束"
                    className="flex-1 min-w-[120px] h-7 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">关联飞书需求</Label>
                <div className="relative">
                  <Input
                    value={feishuStoryKeyword || feishuStoryId}
                    onChange={e => {
                      const v = e.target.value;
                      setFeishuStoryKeyword(v);
                      setFeishuStoryId('');
                      searchFeishu(v);
                      setStoryDropdownOpen(!!v.trim());
                    }}
                    onFocus={() => feishuStoryKeyword && setStoryDropdownOpen(true)}
                    placeholder="请选择飞书需求 (可选)"
                    className="h-9"
                  />
                  {storyDropdownOpen && (feishuStoryKeyword || storyOptions.length > 0) && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                      {storySearching ? (
                        <div className="p-2 text-sm text-gray-500">搜索中...</div>
                      ) : storyOptions.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">无匹配需求</div>
                      ) : (
                        storyOptions.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => {
                              setFeishuStoryId(opt.id);
                              setFeishuStoryKeyword(`${opt.id} - ${opt.name}`);
                              setStoryDropdownOpen(false);
                            }}
                          >
                            {opt.id} - {opt.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || detailLoading}>
            取消
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading || detailLoading}
          >
            {loading ? (isEdit ? '更新中...' : '创建中...') : isEdit ? '更新' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
