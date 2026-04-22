/**
 * 用例详情抽屉
 * 1:1 迁移自 spotter-metersphere caseDetailDrawer.vue
 * 完整功能：导航、分享、关注、多 Tab、评论等
 */

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Copy, Trash2, Share2, Star, MoreVertical, ChevronLeft, ChevronRight, Maximize2, Minimize2, Sparkles, Plus, X } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableTabSettingRow } from './SortableTabSettingRow';
import { RichTextContent } from './RichTextContent';
import { StepEditor } from './StepEditor';
import { CASE_LEVEL_MAP } from '../constants';
import { caseManagementService } from '@/services';
import { getModulePath } from '../utils';
import { CaseLevelBadge, CaseLevelOption } from './CaseLevelBadge';
import { CaseModuleSelect } from './CaseModuleSelect';
import {
  TabComments,
  TabDemand,
  TabBug,
  TabDependency,
  TabAssociatedCases,
  TabCaseReview,
  TabTestPlan,
  TabChangeHistory,
} from './drawer-tabs';
import { generateId } from '../utils';
import type { CaseItem, CaseDetail, ModuleTreeNode, StepListItem } from '../types';

function parseSteps(stepsStr?: string): { step: string; expected: string }[] {
  if (!stepsStr?.trim()) return [];
  try {
    const arr = JSON.parse(stepsStr);
    return Array.isArray(arr) ? arr.map((s: any) => ({ step: s.desc ?? s.step ?? '', expected: s.result ?? s.expected ?? '' })) : [];
  } catch {
    return [];
  }
}

function parseStepsToStepList(stepsStr?: string): StepListItem[] {
  if (!stepsStr?.trim()) return [{ id: generateId(), step: '', expected: '' }];
  try {
    const arr = JSON.parse(stepsStr);
    if (!Array.isArray(arr)) return [{ id: generateId(), step: '', expected: '' }];
    return arr.map((item: any) => ({
      id: item.id || generateId(),
      step: item.desc ?? item.step ?? '',
      expected: item.result ?? item.expected ?? '',
    }));
  } catch {
    return [{ id: generateId(), step: '', expected: '' }];
  }
}

function buildStepsPayload(steps: StepListItem[]): string {
  const payload = steps
    .filter((s) => s.step?.trim())
    .map((s, i) => ({
      id: s.id,
      num: i,
      desc: s.step,
      result: s.expected,
    }));
  return payload.length ? JSON.stringify(payload) : '';
}

/**
 * 与 metersphere-frontend caseDetailDrawer getParams 一致：拼出 { request, fileList } 用于 updateCaseRequest
 * customFields 格式：{ fieldId, value: Array.isArray ? JSON.stringify : value }，value 空时传 '' 避免后端 SQL 异常
 */
function getUpdateParams(
  detail: CaseDetail,
  caseId: string,
  overrides: Record<string, unknown>,
  fileList: File[] = []
): { request: Record<string, unknown>; fileList: File[] } {
  const customFieldsArr = (detail.customFields ?? []).map((f: { fieldId?: string; value?: unknown }) => ({
    fieldId: f.fieldId ?? '',
    value: Array.isArray(f.value) ? JSON.stringify(f.value) : (f.value != null ? String(f.value) : ''),
  }));
  return {
    request: {
      ...detail,
      id: caseId,
      deleteFileMetaIds: [],
      unLinkFilesIds: [],
      newAssociateFileListIds: [],
      customFields: customFieldsArr,
      caseDetailFileIds: [],
      ...overrides,
    },
    fileList,
  };
}

interface CaseDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string | null;
  caseList: CaseItem[];
  caseIndex: number;
  moduleTree: ModuleTreeNode[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  projectId?: string;
  onEdit?: (item: CaseItem) => void;
  onCopy?: (item: CaseItem) => void;
  onCreate?: () => void;
  onSuccess?: () => void;
  /** 切换查看的用例（prev/next 时调用） */
  onCaseSelect?: (item: CaseItem) => void;
  /** 权限控制：为 false 时隐藏对应操作，不传或 true 时显示 */
  canEdit?: boolean;
  canCopy?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canFollow?: boolean;
  canComment?: boolean;
}

const TAB_LIST = [
  { value: 'basicInfo', label: '基本信息', canHide: false },
  { value: 'detail', label: '详情', canHide: false },
  { value: 'case', label: '用例', canHide: true },
  { value: 'requirement', label: '需求', canHide: true },
  { value: 'bug', label: '缺陷', canHide: true },
  { value: 'dependency', label: '依赖关系', canHide: true },
  { value: 'caseReview', label: '用例评审', canHide: true },
  { value: 'testPlan', label: '测试计划', canHide: true },
  { value: 'comments', label: '评论', canHide: true },
  { value: 'changeHistory', label: '变更历史', canHide: true },
] as const;

const DISPLAY_SETTINGS_KEY = 'case-detail-drawer-tab-settings';
const TAB_ORDER_KEY = 'case-detail-drawer-tab-order';

export function CaseDetailDrawer({
  open,
  onOpenChange,
  caseId,
  caseList,
  caseIndex,
  moduleTree,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  projectId = 'default-project',
  onEdit,
  onCopy,
  onCreate,
  onSuccess,
  onCaseSelect,
  canEdit = true,
  canCopy = true,
  canDelete = true,
  canShare = true,
  canFollow = true,
  canComment = true,
}: CaseDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState('detail');
  const [followFlag, setFollowFlag] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [caseLevel, setCaseLevel] = useState('P1');
  const [commentHtml, setCommentHtml] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [levelSaving, setLevelSaving] = useState(false);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [showSettingSheet, setShowSettingSheet] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem(DISPLAY_SETTINGS_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });
  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(TAB_ORDER_KEY);
      return s ? JSON.parse(s) : TAB_LIST.map((t) => t.value);
    } catch {
      return TAB_LIST.map((t) => t.value);
    }
  });
  const [isEditTitle, setIsEditTitle] = useState(false);
  const [titleName, setTitleName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<'prerequisite' | 'textDescription' | 'expectedResult' | 'description' | 'steps' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingSteps, setEditingSteps] = useState<StepListItem[]>([]);
  const [editingSaving, setEditingSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useUser();

  // 关闭抽屉时退出全屏
  useEffect(() => {
    if (!open) setIsFullscreen(false);
  }, [open]);
  const userId = user?.id || localStorage.getItem('currentUserId') || localStorage.getItem('userId') || '';

  const currentItem = caseId ? caseList.find((c) => c.id === caseId) : null;

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

  const loadDetail = useCallback(() => {
    if (open && caseId) {
      setLoading(true);
      caseManagementService
        .getCaseDetail(caseId)
        .then((res: any) => {
          setDetail(res);
          setTitleName(res?.name ?? '');
          setTags(Array.isArray(res?.tags) ? res.tags : res?.tags ? [res.tags] : []);
          setFollowFlag(!!res?.followFlag);
          const cf = (res?.customFields as { fieldId?: string; value?: string }[]) || [];
          const pf = cf.find((f: any) => f.fieldId === 'functional_priority' || f.internalFieldKey === 'functional_priority');
          setCaseLevel(pf?.value || res?.functionalPriority || res?.caseLevel || 'P1');
        })
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  }, [open, caseId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!open || !caseId) setIsEditTitle(false);
  }, [open, caseId]);

  const handleEdit = () => {
    if (currentItem) {
      onOpenChange(false);
      onEdit?.(currentItem);
    }
  };

  const handleCopy = () => {
    if (currentItem) {
      onOpenChange(false);
      onCopy?.(currentItem);
    }
  };

  const handleDelete = () => {
    if (!currentItem) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!currentItem) return;
    caseManagementService
      .deleteCaseRequest({ id: currentItem.id, projectId: currentItem.projectId || projectId })
      .then(() => {
        setDeleteDialogOpen(false);
        onOpenChange(false);
        onSuccess?.();
        toast.success('删除成功');
      })
      .catch((e) => {
        toast.error('删除失败');
        console.error(e);
      });
  };

  const handleShare = () => {
    if (!caseId || !projectId) {
      toast.error('无法生成分享链接');
      return;
    }
    const orgId = user?.lastOrganizationId || localStorage.getItem('currentOrgId') || '';
    // 使用当前前端部署基路径，避免把域名/路径写死在根目录
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    const base = `${window.location.origin}${baseUrl}/#/case-management/featureCase`;
    const params = new URLSearchParams();
    params.set('id', String(caseId));
    params.set('pId', String(projectId));
    if (orgId) params.set('orgId', String(orgId));
    const url = `${base}?${params.toString()}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('链接已复制到剪贴板');
      }).catch(() => toast.error('复制失败'));
    } else {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast.success('链接已复制到剪贴板');
      } catch {
        toast.error('复制失败，请手动复制链接');
      }
    }
  };

  const startEdit = (field: 'prerequisite' | 'textDescription' | 'expectedResult' | 'description' | 'steps') => {
    if (!detail) return;
    if (field === 'steps') {
      setEditingField('steps');
      setEditingSteps(parseStepsToStepList(detail.steps));
    } else {
      const val = (detail as Record<string, string | undefined>)[field] ?? '';
      setEditingField(field);
      setEditingValue(typeof val === 'string' ? val : '');
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
    setEditingSteps([]);
  };

  const saveEdit = () => {
    if (!caseId || !projectId || !editingField || !detail) return;
    setEditingSaving(true);
    const overrides =
      editingField === 'steps'
        ? { steps: buildStepsPayload(editingSteps) }
        : { [editingField]: editingValue };
    const payload = getUpdateParams(detail, caseId, overrides);
    caseManagementService
      .updateCaseRequest(payload)
      .then(() => {
        setEditingField(null);
        setEditingValue('');
        setEditingSteps([]);
        loadDetail();
        onSuccess?.();
        toast.success('保存成功');
      })
      .catch((e) => {
        toast.error('保存失败');
        console.error(e);
      })
      .finally(() => setEditingSaving(false));
  };

  const handleFollow = () => {
    if (!caseId) return;
    if (!userId) {
      toast.error('请先登录后再关注');
      return;
    }
    setFollowLoading(true);
    caseManagementService
      .followerCaseRequest({ userId, functionalCaseId: caseId })
      .then(() => {
        setFollowFlag(!followFlag);
        loadDetail();
        toast.success(followFlag ? '已取消关注' : '关注成功');
      })
      .catch((e) => {
        console.error(e);
        toast.error('操作失败，请稍后重试');
      })
      .finally(() => setFollowLoading(false));
  };

  const handlePrev = () => {
    if (caseIndex > 0) {
      const prev = caseList[caseIndex - 1];
      if (prev) onCaseSelect?.(prev);
    } else if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (caseIndex >= 0 && caseIndex < caseList.length - 1) {
      const next = caseList[caseIndex + 1];
      if (next) onCaseSelect?.(next);
    } else if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handleCommentSubmit = () => {
    const html = commentHtml.trim();
    if (!caseId || !html) return;
    const textOnly = html.replace(/<[^>]*>/g, '').trim();
    const hasImage = /<img\b[^>]*>/i.test(html);
    // 允许「只有图片」的评论；仅在既没有文字也没有图片时才视为无效
    if (!textOnly && !hasImage) return;
    const uploadFileIds = Array.from(
      html.matchAll(/\/attachment\/download\/file\/[^/]+\/([^/]+)\/true/g),
      (m) => m[1]
    );
    setCommentLoading(true);
    caseManagementService
      .createCommentItem({
        caseId,
        content: html,
        event: 'COMMENT',
        notifier: '',
        replyUser: '',
        parentId: '',
        uploadFileIds,
      })
      .then(() => {
        setCommentHtml('');
        setCommentRefreshKey((k) => k + 1);
        toast.success('评论已发送');
      })
      .catch((e) => console.error(e))
      .finally(() => setCommentLoading(false));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const v = e.currentTarget.value.trim();
      if (!tags.includes(v)) {
        const next = [...tags, v];
        setTags(next);
        saveTags(next);
      }
      e.currentTarget.value = '';
    }
  };

  const handleRemoveTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    saveTags(next);
  };

  const saveTags = (newTags: string[]) => {
    if (!caseId || !detail) return;
    setTagsSaving(true);
    const payload = getUpdateParams(detail, caseId, { tags: newTags });
    caseManagementService
      .updateCaseRequest(payload)
      .then(() => {
        loadDetail();
        onSuccess?.();
        toast.success('标签已保存');
      })
      .catch((e) => console.error(e))
      .finally(() => setTagsSaving(false));
  };

  const handleModuleChange = (moduleId: string) => {
    if (!caseId || !detail) return;
    setModuleSaving(true);
    const payload = getUpdateParams(detail, caseId, { moduleId });
    caseManagementService
      .updateCaseRequest(payload)
      .then(() => {
        loadDetail();
        onSuccess?.();
        toast.success('模块已更新');
      })
      .catch((e) => console.error(e))
      .finally(() => setModuleSaving(false));
  };

  const handleCaseLevelChange = (value: string) => {
    if (!caseId || !detail) return;
    setCaseLevel(value);
    setLevelSaving(true);
    // 与 metersphere-frontend handleStatusChange 一致：整份 customFields，仅改 functional_priority
    const customFieldsArr = (detail.customFields as { fieldId?: string; internalFieldKey?: string; value?: string }[]) ?? [];
    const hasPriority = customFieldsArr.some((f) => f.fieldId === 'functional_priority' || f.internalFieldKey === 'functional_priority');
    const customFieldsList = customFieldsArr.map((f) => ({
      fieldId: f.fieldId ?? f.internalFieldKey ?? '',
      value: f.fieldId === 'functional_priority' || f.internalFieldKey === 'functional_priority' ? value : (f.value ?? ''),
    }));
    if (!hasPriority) customFieldsList.push({ fieldId: 'functional_priority', value });
    const payload = getUpdateParams(detail, caseId, { customFields: customFieldsList });
    caseManagementService
      .updateCaseRequest(payload)
      .then(() => {
        loadDetail();
        onSuccess?.();
        toast.success('用例等级已更新');
      })
      .catch((e) => console.error(e))
      .finally(() => setLevelSaving(false));
  };

  const steps = detail?.caseEditType === 'STEP' ? parseSteps(detail?.steps) : [];

  const visibleTabList = tabOrder
    .map((v) => TAB_LIST.find((t) => t.value === v))
    .filter((t): t is (typeof TAB_LIST)[number] => !!t && visibleTabs[t.value] !== false);
  const countMap: Record<string, number> = {
    case: detail?.caseCount ?? 0,
    requirement: detail?.demandCount ?? 0,
    bug: detail?.bugCount ?? 0,
    dependency: detail?.relateEdgeCount ?? 0,
    caseReview: detail?.caseReviewCount ?? 0,
    testPlan: detail?.testPlanCount ?? 0,
    comments: detail?.commentCount ?? 0,
    changeHistory: detail?.historyCount ?? 0,
  };
  const getTabLabel = (t: (typeof TAB_LIST)[number]) => {
    const cnt = countMap[t.value as keyof typeof countMap];
    if (cnt != null && cnt > 0) return `${t.label} ${cnt > 99 ? '99+' : cnt}`;
    return t.label;
  };

  const handleTitleSave = () => {
    if (!caseId || !detail || !titleName.trim()) {
      setIsEditTitle(false);
      return;
    }
    if (titleName.trim() === detail.name) {
      setIsEditTitle(false);
      return;
    }
    const payload = getUpdateParams(detail, caseId, { name: titleName.trim() });
    caseManagementService
      .updateCaseRequest(payload)
      .then(() => {
        loadDetail();
        setIsEditTitle(false);
        onSuccess?.();
        toast.success('名称已更新');
      })
      .catch((e) => console.error(e));
  };

  const persistVisibleTabs = (v: Record<string, boolean>) => {
    setVisibleTabs(v);
    try {
      localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  };

  const persistTabOrder = (order: string[]) => {
    setTabOrder(order);
    try {
      localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order));
    } catch {
      /* ignore */
    }
  };

  const handleResetSettings = () => {
    persistVisibleTabs({});
    persistTabOrder(TAB_LIST.map((t) => t.value));
  };

  const closeableTabOrder = tabOrder.filter((v) => TAB_LIST.find((t) => t.value === v)?.canHide);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTabDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = closeableTabOrder.indexOf(active.id as string);
    const newIndex = closeableTabOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const moved = arrayMove(closeableTabOrder, oldIndex, newIndex);
    const nonCloseable = TAB_LIST.filter((t) => !t.canHide).map((t) => t.value);
    persistTabOrder([...nonCloseable, ...moved]);
  };
  const canPrev = caseIndex > 0 || (currentPage > 1 && onPageChange);
  const canNext = (caseIndex >= 0 && caseIndex < caseList.length - 1) || (currentPage < totalPages && onPageChange);

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={
          isFullscreen
            ? 'inset-0 right-0 left-0 w-full max-w-none sm:max-w-none flex flex-col p-0 gap-0 rounded-none'
            : 'w-[860px] sm:max-w-[860px] flex flex-col p-0 gap-0'
        }
      >
        {/* 头部 */}
        <SheetHeader className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canPrev} onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canNext} onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <SheetTitle className={`flex-1 pr-2 ${isEditTitle ? 'min-w-0' : 'truncate'}`}>
              <div className="flex items-center gap-2 min-w-0">
                {detail?.aiCreate && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-violet-100 text-violet-700 shrink-0" title="AI 创建">
                    <Sparkles className="h-3 w-3" /> AI
                  </span>
                )}
                {canEdit ? (
                  <Select value={caseLevel} onValueChange={handleCaseLevelChange} disabled={levelSaving}>
                    <SelectTrigger className="h-8 w-[56px] px-1.5 !border-0 !bg-transparent !shadow-none text-xs shrink-0 hover:!bg-gray-50/60 rounded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CASE_LEVEL_MAP).map(([val, { label }]) => (
                        <SelectItem key={val} value={val}>
                          <CaseLevelOption value={val} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <CaseLevelBadge level={caseLevel} />
                )}
                {isEditTitle ? (
                  <Textarea
                    className="flex-1 min-w-0 text-[15px] font-normal resize-none py-1.5 px-2 min-h-[2.5rem] max-h-24"
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTitleSave();
                      }
                    }}
                    placeholder="用例标题"
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="text-[15px] font-normal truncate cursor-pointer hover:bg-gray-50 px-2 py-1 rounded text-gray-900 block min-w-0"
                          onClick={() => setIsEditTitle(true)}
                        >
                          [ {detail?.num ?? currentItem?.num ?? '-'} ] {detail?.name ?? currentItem?.name ?? titleName ?? '加载中...'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[480px] whitespace-pre-wrap break-words">
                        [ {detail?.num ?? currentItem?.num ?? '-'} ] {detail?.name ?? currentItem?.name ?? titleName ?? '加载中...'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </SheetTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0 pr-10">
            {canEdit && (
              <Button variant="ghost" size="sm" className="h-8 text-[13px] font-normal text-gray-600" onClick={handleEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> 编辑
              </Button>
            )}
            {canShare && (
              <Button variant="ghost" size="sm" className="h-8 text-[13px] font-normal text-gray-600" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5 mr-1" /> 分享
              </Button>
            )}
            {canFollow && (
              <Button variant="ghost" size="sm" className="h-8 text-[13px] font-normal text-gray-600" disabled={followLoading} onClick={handleFollow}>
                <Star className={`h-3.5 w-3.5 mr-1 ${followFlag ? 'fill-amber-400 text-amber-500' : ''}`} /> 关注
              </Button>
            )}
            {(canCopy || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-[13px] font-normal text-gray-600">
                    <MoreVertical className="h-3.5 w-3.5 mr-1" /> 更多
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canCopy && (
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" /> 复制
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> 删除
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={isFullscreen ? '退出全屏' : '全屏'}
                onClick={() => setIsFullscreen((v) => !v)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Tab 栏 */}
        <div className="border-b border-gray-100 px-4 shrink-0 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="h-10 bg-transparent p-0 gap-0 border-0 w-auto justify-start h-auto">
              {visibleTabList.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:!bg-transparent px-3 py-2 text-[13px] font-normal data-[state=active]:font-medium text-gray-500 data-[state=active]:text-blue-600 transition-colors hover:text-gray-700 shadow-none data-[state=active]:shadow-none">
                  {getTabLabel(t)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="text-[12px] text-gray-400 cursor-pointer hover:text-gray-600 shrink-0 ml-2 font-normal" onClick={() => setShowSettingSheet(true)}>显示设置</span>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto px-4 py-3">
              <TabsContent value="basicInfo" className="mt-0 m-0">
                {loading ? (
                  <div className="py-8 text-center text-gray-500">加载中...</div>
                ) : detail ? (
                    <div className="space-y-3">
                    <div className="grid grid-cols-[88px_1fr] gap-2 text-[13px] items-center">
                      <span className="text-gray-400 font-normal">所属模块</span>
                      <CaseModuleSelect
                        moduleTree={moduleTree}
                        value={detail.moduleId || ''}
                        onChange={handleModuleChange}
                        disabled={moduleSaving}
                        noLabel
                        placeholder="选择模块"
                      />
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-2 text-[13px] items-center">
                      <span className="text-gray-400 font-normal">用例等级</span>
                      <Select value={caseLevel} onValueChange={handleCaseLevelChange} disabled={levelSaving}>
                        <SelectTrigger className="w-[56px] px-1.5 !border-0 !bg-transparent !shadow-none text-xs hover:!bg-gray-50/60 rounded">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CASE_LEVEL_MAP).map(([k]) => (
                            <SelectItem key={k} value={k}>
                              <CaseLevelOption value={k} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-2 text-[13px] items-center">
                      <span className="text-gray-400 font-normal">创建人</span>
                      <span>{detail.createUserName ?? detail.createUser ?? '-'}</span>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-2 text-[13px] items-center">
                      <span className="text-gray-400 font-normal">创建时间</span>
                      <span>{detail.createTime ? new Date(detail.createTime).toLocaleString() : '-'}</span>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-2 text-[13px] items-start">
                      <span className="text-gray-400 font-normal pt-2">标签</span>
                      <div className="flex flex-wrap gap-2 items-center min-h-[28px]">
                        {tags.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 text-xs font-normal bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 gap-1"
                          >
                            {t}
                            <button
                              type="button"
                              className="ml-0.5 rounded p-0.5 hover:bg-blue-200/60 hover:text-blue-900 disabled:opacity-50"
                              onClick={() => handleRemoveTag(t)}
                              disabled={tagsSaving}
                              aria-label={`删除标签 ${t}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        <div className="inline-flex items-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 px-2 py-1 min-w-[120px] focus-within:border-primary/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/30">
                          <Plus className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <Input
                            className="h-6 w-full min-w-0 border-0 bg-transparent px-1.5 py-0 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="添加标签，回车确认"
                            onKeyDown={handleTagKeyDown}
                          />
                        </div>
                      </div>
                    </div>
                    {/* 前置条件 / 步骤与预期结果 摘要 */}
                    <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                      <div className="text-[13px] font-normal text-gray-500 mb-2">用例内容</div>
                      <div className="rounded-md border border-gray-100 p-3 bg-gray-50/30 space-y-2 text-[13px]">
                        <div className="grid grid-cols-[72px_1fr] gap-2 items-start">
                          <span className="text-gray-400 shrink-0 font-normal">前置条件</span>
                          <div className="text-gray-600 line-clamp-2 min-w-0">
                            {detail.prerequisite?.trim() ? (
                              <RichTextContent content={detail.prerequisite} className="text-sm" />
                            ) : (
                              '无'
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-[72px_1fr] gap-2 items-start">
                          <span className="text-gray-400 shrink-0 font-normal">步骤与预期</span>
                          <span className="text-gray-600">
                            {detail.caseEditType === 'STEP'
                              ? (steps.length > 0 ? `共 ${steps.length} 步，每步含步骤描述与预期结果` : '无步骤')
                              : (detail.textDescription?.trim() ? '文本描述 + 预期结果' : '无')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('detail')}
                          className="text-primary hover:underline text-[13px] font-normal"
                        >
                          查看详情 →
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const cf = Array.isArray(detail.customFields) ? detail.customFields : [];
                      const extra = cf.filter((f: any) => f.fieldId !== 'functional_priority' && f.internalFieldKey !== 'functional_priority');
                      return extra.length ? (
                      <>
                        <div className="border-t border-gray-100 pt-4 mt-4" />
                        <div className="text-[13px] font-normal text-gray-500 mb-2">自定义字段</div>
                        <div className="space-y-2">
                          {extra.map((f: any) => (
                            <div key={f.fieldId ?? f.internalFieldKey} className="grid grid-cols-[88px_1fr] gap-2 text-[13px] items-start">
                              <span className="text-gray-400 font-normal">{f.fieldName ?? f.name ?? '-'}</span>
                              <span>{f.value ?? f.defaultValue ?? '-'}</span>
                            </div>
                          ))}
                        </div>
                      </>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">暂无数据</div>
                )}
              </TabsContent>
              <TabsContent value="detail" className="mt-0 m-0">
                {loading ? (
                  <div className="py-8 text-center text-gray-500">加载中...</div>
                ) : detail ? (
                  <div className="space-y-5">
                    {/* 前置条件 */}
                    <div className="rounded-md border border-gray-100 overflow-hidden">
                      <div className="text-[13px] font-normal text-gray-600 px-3 py-2 bg-emerald-50/60 border-b border-emerald-50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-emerald-400/80 shrink-0" />
                          前置条件
                        </div>
                        {canEdit && editingField !== 'prerequisite' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 shrink-0" onClick={() => startEdit('prerequisite')}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />内容编辑
                          </Button>
                        )}
                      </div>
                      <div className="text-[13px] p-3 bg-gray-50/30 min-h-[2.5rem] text-gray-700">
                        {editingField === 'prerequisite' ? (
                          <div className="space-y-3">
                            <RichTextEditor value={editingValue} onChange={setEditingValue} placeholder="请输入前置条件" minHeight="150px" uploadImage={handleUploadImage} />
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={editingSaving}>取消</Button>
                              <Button size="sm" onClick={saveEdit} disabled={editingSaving}>{editingSaving ? '保存中...' : '保存'}</Button>
                            </div>
                          </div>
                        ) : detail.prerequisite?.trim() ? (
                          <RichTextContent
                            content={detail.prerequisite}
                            className="[&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-64 [&_img]:object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">无</span>
                        )}
                      </div>
                    </div>
                    {/* 步骤描述 / 文本描述 */}
                    <div className="rounded-md border border-gray-100 overflow-hidden">
                      <div className="text-[13px] font-normal text-gray-600 px-3 py-2 bg-sky-50/60 border-b border-sky-50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-sky-400/80 shrink-0" />
                          {detail.caseEditType === 'STEP' ? '步骤描述' : '文本描述'}
                        </div>
                        {canEdit && editingField !== 'textDescription' && editingField !== 'steps' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 shrink-0" onClick={() => startEdit(detail.caseEditType === 'STEP' ? 'steps' : 'textDescription')}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />内容编辑
                          </Button>
                        )}
                      </div>
                      {editingField === 'steps' ? (
                        <div className="p-3 bg-gray-50/30 space-y-3">
                          <StepEditor steps={editingSteps} onChange={setEditingSteps} />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={editingSaving}>取消</Button>
                            <Button size="sm" onClick={saveEdit} disabled={editingSaving}>{editingSaving ? '保存中...' : '保存'}</Button>
                          </div>
                        </div>
                      ) : detail.caseEditType === 'STEP' && steps.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg overflow-hidden">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="bg-gray-50/30 border-b border-gray-100">
                                <th className="w-12 py-1.5 text-left px-3 font-normal text-gray-400 text-[11px] tracking-wide">序号</th>
                                <th className="py-1.5 text-left px-3 font-normal text-gray-400 text-[11px] tracking-wide">步骤描述</th>
                                <th className="py-1.5 text-left px-3 font-normal text-gray-400 text-[11px] tracking-wide">预期结果</th>
                              </tr>
                            </thead>
                            <tbody>
                              {steps.map((s, i) => (
                                <tr key={i} className="group border-b border-gray-50 last:border-0 h-8 [&_td]:group-hover:bg-sky-50/30 [&_td]:first:rounded-l-md [&_td]:last:rounded-r-md">
                                  <td className="py-1.5 px-3 text-gray-400 align-top text-[12px] transition-colors">{i + 1}</td>
                                  <td className="py-1.5 px-3 font-normal whitespace-pre-wrap align-top text-gray-600 text-[13px] transition-colors">{s.step || '-'}</td>
                                  <td className="py-1.5 px-3 font-normal whitespace-pre-wrap align-top text-gray-600 text-[13px] bg-rose-50/20 transition-colors">{s.expected || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : editingField === 'textDescription' ? (
                        <div className="text-sm p-3 bg-gray-50/50 space-y-3">
                          <RichTextEditor value={editingValue} onChange={setEditingValue} placeholder="请输入文本描述" minHeight="180px" uploadImage={handleUploadImage} />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={editingSaving}>取消</Button>
                            <Button size="sm" onClick={saveEdit} disabled={editingSaving}>{editingSaving ? '保存中...' : '保存'}</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[13px] p-3 bg-gray-50/30 min-h-[2.5rem] text-gray-700">
                          <RichTextContent
                            content={detail.textDescription}
                            className="[&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-64 [&_img]:object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {/* 预期结果（仅文本模式时单独展示） */}
                    {detail.caseEditType === 'TEXT' && (
                      <div className="rounded-md border border-gray-100 overflow-hidden">
                        <div className="text-[13px] font-normal text-gray-600 px-3 py-2 bg-rose-50/60 border-b border-rose-50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-4 rounded-full bg-rose-400/80 shrink-0" />
                            预期结果
                          </div>
                          {canEdit && editingField !== 'expectedResult' && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 shrink-0" onClick={() => startEdit('expectedResult')}>
                              <Pencil className="w-3.5 h-3.5 mr-1" />内容编辑
                            </Button>
                          )}
                        </div>
                        <div className="text-[13px] p-3 bg-rose-50/20 min-h-[2.5rem] text-gray-700">
                          {editingField === 'expectedResult' ? (
                            <div className="space-y-3">
                              <RichTextEditor value={editingValue} onChange={setEditingValue} placeholder="请输入预期结果" minHeight="150px" uploadImage={handleUploadImage} />
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={cancelEdit} disabled={editingSaving}>取消</Button>
                                <Button size="sm" onClick={saveEdit} disabled={editingSaving}>{editingSaving ? '保存中...' : '保存'}</Button>
                              </div>
                            </div>
                          ) : detail.expectedResult?.trim() ? (
                            <RichTextContent
                              content={detail.expectedResult}
                              className="[&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-64 [&_img]:object-contain"
                            />
                          ) : (
                            <span className="text-gray-400">无</span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* 备注 */}
                    <div className="rounded-md border border-gray-100 overflow-hidden">
                      <div className="text-[13px] font-normal text-gray-600 px-3 py-2 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-gray-400/80 shrink-0" />
                          备注
                        </div>
                        {canEdit && editingField !== 'description' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-600 shrink-0" onClick={() => startEdit('description')}>
                            <Pencil className="w-3.5 h-3.5 mr-1" />内容编辑
                          </Button>
                        )}
                      </div>
                      <div className="text-[13px] p-3 bg-gray-50/30 min-h-[2.5rem] text-gray-700">
                        {editingField === 'description' ? (
                          <div className="space-y-3">
                            <RichTextEditor value={editingValue} onChange={setEditingValue} placeholder="请输入备注" minHeight="150px" uploadImage={handleUploadImage} />
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={editingSaving}>取消</Button>
                              <Button size="sm" onClick={saveEdit} disabled={editingSaving}>{editingSaving ? '保存中...' : '保存'}</Button>
                            </div>
                          </div>
                        ) : detail.description?.trim() ? (
                          <RichTextContent
                            content={detail.description}
                            className="[&_img]:max-w-full [&_img]:h-auto [&_img]:max-h-64 [&_img]:object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">无</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">暂无数据</div>
                )}
              </TabsContent>
              <TabsContent value="case" className="mt-0 m-0">
                <TabAssociatedCases caseId={caseId} projectId={projectId} />
              </TabsContent>
              <TabsContent value="requirement" className="mt-0 m-0">
                <TabDemand caseId={caseId} projectId={projectId} canEdit={canEdit} onRefresh={loadDetail} />
              </TabsContent>
              <TabsContent value="bug" className="mt-0 m-0">
                <TabBug caseId={caseId} projectId={projectId} canEdit={canEdit} onRefresh={loadDetail} />
              </TabsContent>
              <TabsContent value="dependency" className="mt-0 m-0">
                <TabDependency
                  caseId={caseId}
                  projectId={projectId}
                  onRefresh={loadDetail}
                  onCreate={() => {
                    onOpenChange(false);
                    onCreate?.();
                  }}
                />
              </TabsContent>
              <TabsContent value="caseReview" className="mt-0 m-0">
                <TabCaseReview caseId={caseId} projectId={projectId} />
              </TabsContent>
              <TabsContent value="testPlan" className="mt-0 m-0">
                <TabTestPlan caseId={caseId} projectId={projectId} />
              </TabsContent>
              <TabsContent value="comments" className="mt-0 m-0">
                <TabComments caseId={caseId} projectId={projectId} refreshKey={commentRefreshKey} />
              </TabsContent>
              <TabsContent value="changeHistory" className="mt-0 m-0">
                <TabChangeHistory caseId={caseId} projectId={projectId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* 底部评论输入（受 canComment 权限控制，支持富文本与图片） */}
        {canComment && (
          <div className="border-t border-gray-100 px-4 py-2.5 shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600 shrink-0">
                {userId ? userId.slice(0, 1).toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <RichTextEditor
                  value={commentHtml}
                  onChange={setCommentHtml}
                  placeholder="请输入评论（支持图片）..."
                  minHeight="80px"
                  uploadImage={handleUploadImage}
                  editorClassName="text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleCommentSubmit}
                    disabled={
                      (!commentHtml.replace(/<[^>]*>/g, '').trim() &&
                        !/<img\b[^>]*>/i.test(commentHtml)) ||
                      commentLoading
                    }
                  >
                    {commentLoading ? '发送中...' : '发送'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>

    {/* 显示设置 */}
    <Sheet open={showSettingSheet} onOpenChange={setShowSettingSheet}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] p-0 gap-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-4 pr-12 border-b border-gray-100">
          <SheetTitle className="text-base font-medium text-gray-900">详情显示设置</SheetTitle>
          <p className="text-[13px] text-gray-500 font-normal mt-1.5">可开启或关闭 Tab 显示，拖拽可调整顺序</p>
        </SheetHeader>
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
          {/* 不可关闭的 Tab */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">固定显示</div>
            <div className="space-y-1">
              {TAB_LIST.filter((t) => !t.canHide).map((t) => (
                <div key={t.value} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50/60 border border-gray-100">
                  <span className="text-[13px] text-gray-700">{t.label}</span>
                  <span className="text-[11px] text-gray-400 font-normal">常驻</span>
                </div>
              ))}
            </div>
          </div>
          {/* 可关闭且可排序的 Tab */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">可选显示 · 拖拽排序</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
              <SortableContext
                items={closeableTabOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {closeableTabOrder.map((v) => {
                    const t = TAB_LIST.find((x) => x.value === v);
                    if (!t) return null;
                    return (
                    <SortableTabSettingRow
                      key={t.value}
                      id={t.value}
                      label={t.label}
                      checked={visibleTabs[t.value] ?? true}
                      onCheckedChange={(checked) => persistVisibleTabs({ ...visibleTabs, [t.value]: checked })}
                    />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-3 shrink-0">
          <Button variant="outline" size="sm" className="w-full text-[13px] font-normal text-gray-600 border-gray-200" onClick={handleResetSettings}>
            恢复默认
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除用例 &quot;{currentItem?.name}&quot; 吗？此操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
}

