/**
 * 测试计划 - 自定义配置报告
 * 参考 metersphere-frontend report/detail/configReport.vue + component/config.vue
 * 双栏布局：左侧基础字段（点击添加）+ 自定义，右侧已选模块（拖拽排序），自定义模块支持富文本
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, RotateCcw, HelpCircle, GripVertical, X, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';
import { ReportCardTypeEnum } from '@/constants/testPlanEnums';
import { cn } from '@/utils/cn';

const MAX_CUSTOM_CARDS = 10;

interface ConfigCardItem {
  id: string;
  value: string;
  label: string;
  type: string;
  /** 自定义富文本模块的内容（仅 CUSTOM_CARD 使用） */
  content?: string;
}

function createCustomCard(index: number): ConfigCardItem {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    value: ReportCardTypeEnum.CUSTOM_CARD,
    label: `自定义模块 ${index}`,
    type: 'RICH_TEXT',
    content: '',
  };
}

const SINGLE_CARDS: ConfigCardItem[] = [
  { id: ReportCardTypeEnum.SUMMARY, value: ReportCardTypeEnum.SUMMARY, label: '报告总结', type: 'SYSTEM' },
  { id: ReportCardTypeEnum.BUG_DETAIL, value: ReportCardTypeEnum.BUG_DETAIL, label: '缺陷明细', type: 'SYSTEM' },
  { id: ReportCardTypeEnum.FUNCTIONAL_DETAIL, value: ReportCardTypeEnum.FUNCTIONAL_DETAIL, label: '功能用例明细', type: 'SYSTEM' },
  { id: ReportCardTypeEnum.API_CASE_DETAIL, value: ReportCardTypeEnum.API_CASE_DETAIL, label: '接口用例明细', type: 'SYSTEM' },
  { id: ReportCardTypeEnum.SCENARIO_CASE_DETAIL, value: ReportCardTypeEnum.SCENARIO_CASE_DETAIL, label: '自动化用例明细', type: 'SYSTEM' },
];

const GROUP_EXTRA_CARDS: ConfigCardItem[] = [
  { id: ReportCardTypeEnum.SUB_PLAN_DETAIL, value: ReportCardTypeEnum.SUB_PLAN_DETAIL, label: '子计划明细', type: 'SYSTEM' },
];

/** 默认已选顺序：单计划 = SINGLE_CARDS；计划组 = 子计划 + SINGLE_CARDS */
function getDefaultCardOrder(isGroup: boolean): ConfigCardItem[] {
  const base = [...SINGLE_CARDS];
  return isGroup ? [...GROUP_EXTRA_CARDS, ...base] : base;
}

/** 仅比较系统模块顺序（用于 hasChange：有自定义或顺序不同则为 true） */
function sameSystemOrder(selected: ConfigCardItem[], defaultOrder: ConfigCardItem[]): boolean {
  const systemIds = selected.filter((c) => c.value !== ReportCardTypeEnum.CUSTOM_CARD).map((c) => c.id);
  const defaultIds = defaultOrder.map((c) => c.id);
  if (systemIds.length !== defaultIds.length) return false;
  return systemIds.every((id, i) => id === defaultIds[i]);
}

/** 报告预览 - 表格占位（配置页无 reportId，仅展示样式） */
function PreviewTablePlaceholder({
  label,
  headers,
  placeholderText,
}: {
  label: string;
  headers: string[];
  placeholderText: string;
}) {
  return (
    <div className="w-full min-w-0">
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {headers.map((h) => (
                <TableHead key={h} className="text-xs font-medium text-gray-600">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={headers.length} className="text-sm text-gray-400 py-8 text-center">
                {placeholderText}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** 右侧可拖拽的已选模块 - 系统模块（报告预览样式） */
function SortableSystemCardRow({
  item,
  onRemove,
}: {
  item: ConfigCardItem;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const previewBody = (() => {
    switch (item.value) {
      case ReportCardTypeEnum.SUMMARY:
        return (
          <div className="min-h-[100px] rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <p className="text-sm text-gray-400">生成报告后可在此编辑报告总结，支持富文本。</p>
          </div>
        );
      case ReportCardTypeEnum.BUG_DETAIL:
        return (
          <PreviewTablePlaceholder
            label={item.label}
            headers={['缺陷名称', '状态', '处理人', '关联用例数']}
            placeholderText="生成后将展示缺陷列表"
          />
        );
      case ReportCardTypeEnum.FUNCTIONAL_DETAIL:
        return (
          <PreviewTablePlaceholder
            label={item.label}
            headers={['用例名称', '所属模块', '优先级', '执行结果', '缺陷数']}
            placeholderText="生成后将展示功能用例明细"
          />
        );
      case ReportCardTypeEnum.API_CASE_DETAIL:
        return (
          <PreviewTablePlaceholder
            label={item.label}
            headers={['用例名称', '所属模块', '优先级', '执行结果', '缺陷数']}
            placeholderText="生成后将展示接口用例明细"
          />
        );
      case ReportCardTypeEnum.SCENARIO_CASE_DETAIL:
        return (
          <PreviewTablePlaceholder
            label={item.label}
            headers={['场景名称', '所属模块', '优先级', '执行结果', '缺陷数']}
            placeholderText="生成后将展示自动化用例明细"
          />
        );
      case ReportCardTypeEnum.SUB_PLAN_DETAIL:
        return (
          <PreviewTablePlaceholder
            label={item.label}
            headers={['计划名称', '通过率', '执行完成率', '缺陷数']}
            placeholderText="生成后将展示子计划明细"
          />
        );
      default:
        return (
          <div className="min-h-[60px] rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm text-gray-400">
            {item.label}
          </div>
        );
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border bg-white overflow-hidden transition-colors shadow-sm',
        isDragging ? 'border-blue-200 border-dashed' : 'border-gray-200'
      )}
    >
      <div className="flex items-center gap-2 py-2.5 px-4 border-b border-gray-100 bg-gray-50/80">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded touch-none"
          {...attributes}
          {...listeners}
          aria-label="拖拽排序"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onRemove(item.id)}
          aria-label="移除"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-5">{previewBody}</div>
    </div>
  );
}

/** 右侧可拖拽的自定义富文本模块行 */
function SortableCustomCardRow({
  item,
  onRemove,
  onContentChange,
  uploadImage,
}: {
  item: ConfigCardItem;
  onRemove: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  uploadImage: (file: File) => Promise<string>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border bg-white overflow-hidden transition-colors shadow-sm',
        isDragging ? 'border-blue-200 border-dashed' : 'border-gray-200'
      )}
    >
      <div className="flex items-center gap-2 py-2.5 px-4 border-b border-gray-100 bg-gray-50/80">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 p-0.5 rounded touch-none"
          {...attributes}
          {...listeners}
          aria-label="拖拽排序"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onRemove(item.id)}
          aria-label="移除"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-5">
        <RichTextEditor
          value={item.content ?? ''}
          onChange={(html) => onContentChange(item.id, html)}
          placeholder="请输入自定义内容，支持富文本…"
          minHeight="120px"
          className="rounded-md border border-gray-200"
          uploadImage={uploadImage}
        />
      </div>
    </div>
  );
}

export function TestPlanReportConfigPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('planId') ?? '';
  const typeParam = searchParams.get('type');
  const isGroup = typeParam === 'GROUP';

  const [planName, setPlanName] = useState('');
  const [reportName, setReportName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** 左侧可选列表（与是否计划组相关） */
  const configList = useMemo(
    () => (isGroup ? [...GROUP_EXTRA_CARDS, ...SINGLE_CARDS] : SINGLE_CARDS),
    [isGroup]
  );
  /** 右侧已选模块（有序），用于生成报告 */
  const [cardItemList, setCardItemList] = useState<ConfigCardItem[]>(() => getDefaultCardOrder(isGroup));

  const defaultOrder = useMemo(() => getDefaultCardOrder(isGroup), [isGroup]);
  const hasCustomCards = cardItemList.some((c) => c.value === ReportCardTypeEnum.CUSTOM_CARD);
  const hasChange = hasCustomCards || !sameSystemOrder(cardItemList, defaultOrder);
  const customCardCount = cardItemList.filter((c) => c.value === ReportCardTypeEnum.CUSTOM_CARD).length;
  const canAddCustom = customCardCount < MAX_CUSTOM_CARDS;

  const projectId = localStorage.getItem('currentProjectId') || '';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const fetchPlan = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const detail = await testPlanManagementService.getTestPlanDetail(planId);
      const name = (detail as any)?.name ?? '';
      setPlanName(name);
      if (!reportName) setReportName(name ? `${name}-报告` : '');
    } catch (e) {
      console.error(e);
      toast.error('获取计划信息失败');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  /** 计划类型切换时重置为默认顺序 */
  useEffect(() => {
    setCardItemList(getDefaultCardOrder(isGroup));
  }, [isGroup]);

  /** 左侧：点击添加（若未在右侧） */
  const addField = (card: ConfigCardItem) => {
    const exists = cardItemList.some((c) => c.id === card.id);
    if (exists) return;
    setCardItemList((prev) => [...prev, card]);
  };

  /** 右侧：移除 */
  const removeField = (id: string) => {
    setCardItemList((prev) => prev.filter((c) => c.id !== id));
  };

  /** 左侧：添加自定义富文本模块 */
  const addCustomField = () => {
    if (!canAddCustom) {
      toast.error(`最多添加 ${MAX_CUSTOM_CARDS} 个自定义模块`);
      return;
    }
    const index = customCardCount + 1;
    setCardItemList((prev) => [...prev, createCustomCard(index)]);
  };

  /** 右侧：更新自定义模块内容 */
  const updateCustomContent = (id: string, content: string) => {
    setCardItemList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content } : c))
    );
  };

  /** 富文本图片上传（与报告详情页一致） */
  const handleUploadImage = useCallback(async (file: File): Promise<string> => {
    const res: any = await testPlanManagementService.editorUploadFile({ fileList: [file] });
    const url = res?.data ?? res?.url ?? (typeof res === 'string' ? res : null);
    if (url && typeof url === 'string') return url;
    const fileId = res?.id ?? res?.fileId;
    const projectId = localStorage.getItem('currentProjectId') || '';
    if (fileId) return `/api/test-plan/report/preview/md/${projectId}/${fileId}`;
    throw new Error('上传失败：无法获取文件地址');
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCardItemList((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleReset = () => {
    setCardItemList(getDefaultCardOrder(isGroup));
    setReportName(planName ? `${planName}-报告` : '');
    toast.success('已恢复默认');
  };

  const handleSave = async () => {
    const name = reportName.trim();
    if (!name) {
      toast.error('请输入报告名称');
      return;
    }
    if (!planId || !projectId) {
      toast.error('缺少计划或项目信息');
      return;
    }
    if (cardItemList.length === 0) {
      toast.error('请至少选择一项报告内容');
      return;
    }
    setSaving(true);
    try {
      const components = cardItemList.map((item, index) => ({
        name: item.value,
        label: item.label,
        type: item.value === ReportCardTypeEnum.CUSTOM_CARD ? 'RICH_TEXT' : item.type,
        value: item.value === ReportCardTypeEnum.CUSTOM_CARD ? (item.content ?? '') : '',
        pos: index + 1,
      }));
      const res = await testPlanManagementService.manualReportGen({
        projectId,
        testPlanId: planId,
        triggerMode: 'MANUAL',
        reportName: name,
        components,
      });
      const reportId = typeof res === 'object' && res != null && 'id' in res ? (res as any).id : res;
      if (reportId) {
        toast.success('报告生成成功');
        navigate(`/test-plan?menu=test-plan&tab=test-report&reportId=${reportId}`);
      } else {
        toast.error('生成失败：未返回报告 ID');
      }
    } catch (e) {
      console.error(e);
      toast.error('生成报告失败');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/test-plan?menu=test-plan&tab=plan');
  };

  const isInSelected = (id: string) => cardItemList.some((c) => c.id === id);

  if (!planId) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center text-gray-500">
        <p>缺少计划 ID，请从测试计划列表进入。</p>
        <Button variant="outline" className="mt-4" onClick={handleBack}>
          返回列表
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center text-gray-500">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部：报告名称 + 取消 / 保存（与 metersphere 配置头一致） */}
      <div className="flex items-center justify-between shrink-0 h-14 px-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="h-8 gap-1 shrink-0" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <h1 className="text-base font-medium text-gray-900 flex items-center gap-2 shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
            生成报告
          </h1>
          {planName && (
            <TruncateWithTooltip className="text-sm text-gray-500 hidden sm:inline">计划：{planName}</TruncateWithTooltip>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="max-w-[420px] sm:max-w-[520px]">
            <Input
              className="h-9"
              placeholder="请输入报告名称"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              maxLength={255}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={handleBack}>
            取消
          </Button>
          <Button size="sm" className="h-9" disabled={saving} onClick={handleSave}>
            {saving ? '生成中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 双栏：左侧基础字段，右侧已选报告模块 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧：基础字段（参考 metersphere config-left-container） */}
        <div className="w-[300px] shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">
          <div className="p-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-medium text-gray-900">基础字段</span>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-blue-600 rounded p-0.5" aria-label="说明">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px]">
                    选择要包含在报告中的模块，点击添加到右侧；右侧可拖拽调整顺序。
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              disabled={!hasChange}
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              恢复默认
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
            {configList.map((card) => {
              const added = isInSelected(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => addField(card)}
                  className={cn(
                    'w-full text-left py-2 px-3 rounded-md text-sm transition-colors border',
                    added
                      ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-default'
                      : 'bg-gray-50/80 border-transparent text-gray-700 hover:bg-blue-50/80 hover:text-blue-700 hover:border-blue-100'
                  )}
                >
                  {card.label}
                </button>
              );
            })}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-9 mt-2 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    disabled={!canAddCustom}
                    onClick={addCustomField}
                  >
                    <Plus className="w-4 h-4" />
                    自定义
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {canAddCustom
                    ? '添加自定义富文本模块，可在右侧编辑内容'
                    : `最多添加 ${MAX_CUSTOM_CARDS} 个自定义模块`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* 右侧：报告预览（可拖拽排序） */}
        <div className="flex-1 min-w-0 flex flex-col bg-gray-100/80 overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
            <div className="text-base font-medium text-gray-900">报告预览</div>
            <p className="text-xs text-gray-500 mt-0.5">按此顺序生成报告，可拖拽调整顺序；样式与生成后的报告一致</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cardItemList.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="max-w-3xl space-y-6">
                  {cardItemList.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
                      请在左侧点击添加报告模块，或点击「自定义」添加富文本模块；右侧将显示报告预览样式
                    </div>
                  ) : (
                    cardItemList.map((item) =>
                      item.value === ReportCardTypeEnum.CUSTOM_CARD ? (
                        <SortableCustomCardRow
                          key={item.id}
                          item={item}
                          onRemove={removeField}
                          onContentChange={updateCustomContent}
                          uploadImage={handleUploadImage}
                        />
                      ) : (
                        <SortableSystemCardRow
                          key={item.id}
                          item={item}
                          onRemove={removeField}
                        />
                      )
                    )
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}
