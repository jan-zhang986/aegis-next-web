/**
 * 用例预览与保存面板
 * 内联于右侧，表格展示用例，支持每条用例单独保存到平台
 */

import { Fragment, useEffect, useRef, useState } from 'react';
import { Save, FileText, Plus, Trash2, Loader2, Eye, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Code, Play, RefreshCw, X } from 'lucide-react';
import Editor from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { caseManagementService } from '@/services';
import { CaseModuleSelect } from './CaseModuleSelect';
import { generateId } from '../utils';
import { resolvePriorityFieldId } from '../utils/getCaseLevel';
import type { ModuleTreeNode } from '../types';
import type { StepListItem } from '../types';
import { toast } from 'sonner';

/** spotter-metersphere 用例等级 */
const CASE_LEVELS = ['P0', 'P1', 'P2', 'P3'] as const;

export interface ParsedCaseItem {
  id: string;
  name: string;
  steps: StepListItem[];
  selected: boolean;
  /** 用例等级 */
  caseLevel?: string;
  /** 步骤模式 STEP / 文本模式 TEXT，与 spotter-metersphere 一致 */
  caseEditType?: 'STEP' | 'TEXT';
  prerequisite?: string;
  textDescription?: string;
  expectedResult?: string;
  description?: string;
}

function buildStepsPayload(steps: StepListItem[]): string {
  const payload = steps
    .filter((s) => (s.step ?? '').trim())
    .map((s, i) => ({
      id: s.id,
      num: i,
      desc: (s.step ?? '').trim(),
      result: (s.expected ?? '').trim(),
    }));
  return payload.length ? JSON.stringify(payload) : '';
}

interface CasePreviewAndSavePanelProps {
  projectId: string;
  previewAction?: {
    type: 'overwrite' | 'append';
    content: string;
    timestamp: number;
    mode?: 'case' | 'code' | 'html';
    language?: string;
    /** JSON 已解析的用例，优先使用（跳过 Markdown 解析） */
    parsedCases?: ParsedCaseItem[];
  };
  onSuccess?: (savedCount: number) => void;
}

export function CasePreviewAndSavePanel({
  projectId,
  previewAction,
  onSuccess,
}: CasePreviewAndSavePanelProps) {
  const [moduleTree, setModuleTree] = useState<ModuleTreeNode[]>([]);
  const [moduleId, setModuleId] = useState('');
  const [cases, setCases] = useState<ParsedCaseItem[]>([]);

  // Playground state
  const [codeContent, setCodeContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('case');
  const [refreshKey, setRefreshKey] = useState(0); // to force iframe refresh

  /** 当前正在保存的用例 id，用于单条保存时显示 loading */
  const [savingId, setSavingId] = useState<string | null>(null);
  /** 底部「保存全部」是否正在执行 */
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    caseManagementService.getCaseModuleTree({ projectId }).then((tree: any) => {
      const t = Array.isArray(tree) ? tree : tree ?? [];
      setModuleTree(t);
    }).catch(() => setModuleTree([]));
  }, [projectId]);

  /** 记录上次处理的 previewAction timestamp，避免重复处理覆盖用户编辑 */
  const lastProcessedTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!previewAction) return;
    // 同一个 previewAction 只处理一次，防止覆盖用户已编辑的内容
    if (previewAction.timestamp <= lastProcessedTimestampRef.current) return;
    lastProcessedTimestampRef.current = previewAction.timestamp;

    if (previewAction.mode === 'code' || previewAction.mode === 'html') {
      setCodeContent(previewAction.content);
      // Map basic names to monaco languages if needed
      let lang = previewAction.language || 'javascript';
      if (previewAction.mode === 'html') lang = 'html';
      if (lang === 'js') lang = 'javascript';
      if (lang === 'ts') lang = 'typescript';
      setLanguage(lang);
      setActiveTab('playground');
    } else {
      // 仅使用已解析的 JSON 用例数据（不再解析 Markdown featureCaseStart 格式）
      const newCases = previewAction.parsedCases ?? [];
      if (previewAction.type === 'overwrite') {
        setCases(newCases);
      } else if (previewAction.type === 'append') {
        setCases((prev) => [...prev, ...newCases]);
        if (newCases.length > 0) toast.success(`已追加 ${newCases.length} 条用例`);
      }
      setActiveTab('case');
    }
  }, [previewAction]);

  // Collapsed state for cases
  const [collapsedCases, setCollapsedCases] = useState<Set<string>>(new Set());

  const toggleCaseCollapse = (id: string) => {
    setCollapsedCases(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteCase = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
  };

  const handleRunCode = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('预览已刷新');
  };

  const updateCase = (id: string, updates: Partial<ParsedCaseItem>) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const updateCaseSteps = (id: string, steps: StepListItem[]) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, steps } : c))
    );
  };

  const addStep = (caseId: string) => {
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    updateCaseSteps(caseId, [
      ...c.steps,
      { id: generateId(), step: '', expected: '' },
    ]);
  };

  const removeStep = (caseId: string, stepIndex: number) => {
    const c = cases.find((x) => x.id === caseId);
    if (!c || c.steps.length <= 1) return;
    updateCaseSteps(caseId, c.steps.filter((_, i) => i !== stepIndex));
  };

  const updateStepField = (caseId: string, stepIndex: number, field: 'step' | 'expected', value: string) => {
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    const next = c.steps.map((s, i) =>
      i === stepIndex ? { ...s, [field]: value } : s
    );
    updateCaseSteps(caseId, next);
  };

  /** 单条保存：保存指定用例到所选模块 */
  const handleSingleSave = async (item: ParsedCaseItem) => {
    if (!moduleId) {
      toast.error('请选择所属模块');
      return;
    }
    const isTextMode = item.caseEditType === 'TEXT';
    const stepsStr = buildStepsPayload(item.steps);
    const textDesc = (item.textDescription ?? '').trim();
    const expectedResult = (item.expectedResult ?? '').trim();
    const hasContent = isTextMode ? textDesc : stepsStr;
    if (!item.name.trim()) {
      toast.error('请填写用例名称');
      return;
    }
    if (!hasContent) {
      toast.error('请至少填写步骤或文本描述');
      return;
    }

    setSavingId(item.id);
    try {
      let templateId = '';
      let priorityFieldId = 'functional_priority';
      try {
        const defaultFields: any = await caseManagementService.getCaseDefaultFields(projectId);
        templateId = defaultFields?.id ?? '';
        priorityFieldId = resolvePriorityFieldId(defaultFields) || 'functional_priority';
      } catch {
        // ignore
      }

      const level = (item.caseLevel ?? 'P0').trim();
      const customFields = [{ fieldId: priorityFieldId, value: level }];

      const res: any = await caseManagementService.createCaseRequest({
        request: {
          projectId,
          templateId,
          name: item.name.trim(),
          moduleId,
          prerequisite: (item.prerequisite ?? '').trim(),
          caseEditType: isTextMode ? 'TEXT' : 'STEP',
          steps: isTextMode ? '' : stepsStr,
          textDescription: isTextMode ? textDesc : '',
          expectedResult: isTextMode ? expectedResult : '',
          description: (item.description ?? '').trim(),
          tags: [],
          customFields,
          priority: level === 'P0' ? 1 : level === 'P1' ? 2 : level === 'P2' ? 3 : 4,
          aiCreate: true, // AI 生成用例，与 metersphere-frontend caseDetail.aiCreate 一致
        },
        fileList: [],
      });
      if (res?.id ?? res?.data?.id) {
        toast.success(`「${item.name}」已保存到平台`);
        onSuccess?.(1);
      } else {
        toast.error('保存成功但未返回用例 ID');
      }
    } catch (err: any) {
      toast.error(`保存「${item.name}」失败: ${err?.message ?? '未知错误'}`);
    } finally {
      setSavingId(null);
    }
  };

  /** 底部保存全部：逐条保存所有用例 */
  const handleSaveAll = async () => {
    if (!moduleId) {
      toast.error('请选择所属模块');
      return;
    }
    const toSave = cases.filter((c) => {
      const isTextMode = c.caseEditType === 'TEXT';
      const stepsStr = buildStepsPayload(c.steps);
      const textDesc = (c.textDescription ?? '').trim();
      const expectedResult = (c.expectedResult ?? '').trim();
      const hasContent = isTextMode ? textDesc : stepsStr;
      return c.name.trim() && hasContent;
    });
    if (toSave.length === 0) {
      toast.error('请至少填写一条有效用例（名称 + 步骤或文本描述）');
      return;
    }
    setSavingAll(true);
    let successCount = 0;
    let templateId = '';
    let priorityFieldId: string | null = null;
    try {
      const defaultFields: any = await caseManagementService.getCaseDefaultFields(projectId).catch(() => ({}));
      templateId = defaultFields?.id ?? '';
      priorityFieldId = resolvePriorityFieldId(defaultFields);
    } catch {
      // ignore
    }
    for (const item of toSave) {
      const isTextMode = item.caseEditType === 'TEXT';
      const stepsStr = buildStepsPayload(item.steps);
      const textDesc = (item.textDescription ?? '').trim();
      const expectedResult = (item.expectedResult ?? '').trim();
      const level = (item.caseLevel ?? 'P0').trim();
      const customFields = [{ fieldId: priorityFieldId || 'functional_priority', value: level }];

      try {
        const res: any = await caseManagementService.createCaseRequest({
          request: {
            projectId,
            templateId,
            name: item.name.trim(),
            moduleId,
            prerequisite: (item.prerequisite ?? '').trim(),
            caseEditType: isTextMode ? 'TEXT' : 'STEP',
            steps: isTextMode ? '' : stepsStr,
            textDescription: isTextMode ? textDesc : '',
            expectedResult: isTextMode ? expectedResult : '',
            description: (item.description ?? '').trim(),
            tags: [],
            customFields,
            priority: level === 'P0' ? 1 : level === 'P1' ? 2 : level === 'P2' ? 3 : 4,
            aiCreate: true,
          },
          fileList: [],
        });
        if (res?.id ?? res?.data?.id) successCount++;
      } catch (err: any) {
        toast.error(`保存「${item.name}」失败: ${err?.message ?? '未知错误'}`);
      }
    }
    setSavingAll(false);
    if (successCount > 0) {
      toast.success(`已成功保存 ${successCount} 个用例`);
      onSuccess?.(successCount);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-l border-border bg-muted/5 dark:bg-muted/5">
      {/* Custom Header */}
      <div className="px-4 py-3 border-b border-border shrink-0 bg-background/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold tracking-tight">AI Generated</span>
          </div>
          {cases.length > 0 && <span className="text-xs text-muted-foreground">{cases.length} cases</span>}
        </div>

        <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50">
          <button
            onClick={() => setActiveTab('case')}
            className={`flex items-center justify-center w-8 h-7 rounded-md transition-all ${activeTab === 'case'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
            title="预览用例"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center justify-center w-8 h-7 rounded-md transition-all ${activeTab === 'playground'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
            title="查看代码/源码"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {/* Case Preview Content (Card List) */}
        <div className={activeTab === 'case' ? 'absolute inset-0 flex flex-col' : 'hidden'}>
          <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            {cases.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-12 px-4">
                <FileText className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">暂无测试用例</p>
                <p className="text-xs mt-1">AI 生成的用例将在此展示</p>
              </div>
            ) : (
              <>
                {/* Module Selection Toolbar */}
                <div className="px-4 py-3 border-b border-border/40 bg-muted/10 shrink-0">
                  <CaseModuleSelect
                    moduleTree={moduleTree}
                    value={moduleId}
                    onChange={setModuleId}
                    required
                    noLabel
                    placeholder="选择目标模块..."
                    className="w-full"
                  />
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {cases.map((c) => {
                    const isCollapsed = collapsedCases.has(c.id);
                    return (
                      <div key={c.id} className="group flex flex-col bg-background border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden mb-3 last:mb-0">
                        {/* Card Header */}
                        <div className="flex items-center gap-3 p-3 bg-muted/20 border-b border-border/40 group-hover:bg-muted/30 transition-colors">
                          <button
                            onClick={() => toggleCaseCollapse(c.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1 hover:bg-background rounded-md"
                          >
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {/* Level Selection - Badge Style */}
                            <Select
                              value={c.caseLevel || 'P0'}
                              onValueChange={(v) => updateCase(c.id, { caseLevel: v })}
                            >
                              <SelectTrigger
                                className={`h-6 w-[52px] text-[11px] font-medium border-0 px-0 justify-center rounded-full shadow-none shrink-0 transition-all ${(c.caseLevel === 'P0' || !c.caseLevel) ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400' :
                                  c.caseLevel === 'P1' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400' :
                                    c.caseLevel === 'P2' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400' :
                                      'bg-muted text-muted-foreground'
                                  }`}
                              >
                                <span className="flex items-center gap-0.5">
                                  {c.caseLevel || 'P0'}
                                </span>
                              </SelectTrigger>
                              <SelectContent align="start">
                                {CASE_LEVELS.map((l) => (
                                  <SelectItem key={l} value={l} className="text-xs">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${l === 'P0' ? 'bg-red-500' : l === 'P1' ? 'bg-orange-500' : l === 'P2' ? 'bg-blue-500' : 'bg-gray-500'
                                      }`} />
                                    {l}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Name Input - Ghost Style with Title Typography */}
                            <Input
                              value={c.name}
                              onChange={(e) => updateCase(c.id, { name: e.target.value })}
                              className="h-8 text-sm font-semibold border-transparent bg-transparent hover:bg-background/50 focus:bg-background focus:border-input focus-visible:ring-1 px-2 rounded-md transition-all flex-1 min-w-0 shadow-none"
                              placeholder="用例名称"
                            />
                          </div>

                          {/* Actions - Subtle */}
                          <div className="flex items-center gap-1 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-4 w-[1px] bg-border/60 mx-1" />

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-full"
                              onClick={() => handleSingleSave(c)}
                              disabled={savingId !== null || savingAll}
                              title="保存到平台"
                            >
                              {savingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => deleteCase(c.id)}
                              title="删除此用例"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Card Body */}
                        {!isCollapsed && (
                          <div className="p-3 space-y-4">
                            {/* Prerequisite */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">前置条件</label>
                              <Textarea
                                value={c.prerequisite ?? ''}
                                onChange={(e) => {
                                  updateCase(c.id, { prerequisite: e.target.value });
                                  // auto-resize
                                  const el = e.target;
                                  el.style.height = 'auto';
                                  el.style.height = `${el.scrollHeight}px`;
                                }}
                                ref={(el) => {
                                  if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
                                }}
                                className="min-h-[36px] text-xs resize-none bg-muted/10 focus:bg-background px-2 py-1.5 rounded-md border-border/40 overflow-hidden"
                                placeholder="无前置条件..."
                              />
                            </div>

                            {/* Steps */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">执行步骤</label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addStep(c.id)}
                                  className="h-5 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10 -mr-1"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  添加步骤
                                </Button>
                              </div>

                              <div className="space-y-2">
                                {c.steps.map((s, idx) => (
                                  <div key={s.id} className="group/step relative grid grid-cols-[20px_1fr_1fr] gap-3 items-start p-2 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-border/30">
                                    <span className="text-[10px] text-muted-foreground font-mono pt-2.5 text-center bg-muted/50 w-5 h-5 rounded-full flex items-center justify-center">{idx + 1}</span>
                                    <div className="relative">
                                      <Textarea
                                        value={s.step}
                                        onChange={(e) => {
                                          updateStepField(c.id, idx, 'step', e.target.value);
                                          const el = e.target;
                                          el.style.height = 'auto';
                                          el.style.height = `${el.scrollHeight}px`;
                                        }}
                                        ref={(el) => {
                                          if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
                                        }}
                                        className="min-h-[50px] text-xs resize-none bg-transparent hover:bg-background focus:bg-background px-2 py-1.5 rounded-md border-transparent hover:border-border/40 focus:border-input transition-all placeholder:text-muted-foreground/40 overflow-hidden"
                                        placeholder="步骤描述"
                                      />
                                    </div>
                                    <div className="relative">
                                      <Textarea
                                        value={s.expected}
                                        onChange={(e) => {
                                          updateStepField(c.id, idx, 'expected', e.target.value);
                                          const el = e.target;
                                          el.style.height = 'auto';
                                          el.style.height = `${el.scrollHeight}px`;
                                        }}
                                        ref={(el) => {
                                          if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
                                        }}
                                        className="min-h-[50px] text-xs resize-none bg-transparent hover:bg-background focus:bg-background px-2 py-1.5 rounded-md border-transparent hover:border-border/40 focus:border-input transition-all placeholder:text-muted-foreground/40 overflow-hidden"
                                        placeholder="预期结果"
                                      />
                                      {c.steps.length > 1 && (
                                        <button
                                          onClick={() => removeStep(c.id, idx)}
                                          className="absolute -right-2 -top-2 p-1 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover/step:opacity-100 hover:text-destructive transition-all"
                                          title="删除步骤"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Bottom Spacer */}
                  <div className="h-12" />
                </div>

                {/* Save All Footer */}
                <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm z-10">
                  <Button
                    onClick={handleSaveAll}
                    disabled={savingAll || savingId !== null}
                    className="w-full h-9 text-xs font-medium shadow-sm bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    {savingAll ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-2" />
                        保存所有 ({cases.length} 条)
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Unified Playground Content */}
        <div className={activeTab === 'playground' ? 'absolute inset-0 flex flex-col' : 'hidden'}>
          {language === 'html' ? (
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50} minSize={20} className="relative group">
                {/* Editor Toolbar - Overlay style */}
                <div className="absolute top-2 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRunCode}
                    title="运行代码 (Cmd/Ctrl + Enter)"
                  >
                    <Play className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                </div>
                <div className="flex flex-col h-full border-b border-border/50 bg-[#1e1e1e]">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    language="html"
                    value={codeContent}
                    onChange={(val) => setCodeContent(val || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      padding: { top: 12 }, // Reduced padding
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                    }}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-border/40 hover:bg-blue-500/50 transition-colors" />

              <ResizablePanel defaultSize={50} minSize={20} className="relative group/preview bg-white dark:bg-black">
                <div className="flex flex-col h-full w-full">
                  {/* Preview Toolbar - Overlay */}
                  <div className="absolute top-2 right-4 z-10 flex items-center gap-2 opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm pointer-events-auto">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRunCode} title="刷新预览">
                        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {/* Minimal Label */}
                  <div className="absolute top-0 left-0 px-3 py-1 z-10 pointer-events-none">
                    <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Preview</span>
                  </div>
                  <iframe
                    key={refreshKey}
                    srcDoc={codeContent}
                    className="w-full h-full border-0 bg-white"
                    title="HTML Preview"
                    sandbox="allow-scripts allow-modals allow-popups"
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex flex-col h-full bg-[#1e1e1e]">
              <div className="flex-1 relative group">
                <Editor
                  height="100%"
                  language={language}
                  value={codeContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    padding: { top: 12 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
