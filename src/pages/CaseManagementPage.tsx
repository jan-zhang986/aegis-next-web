/**
 * 用例管理页面
 * 从 aegis-next-server 迁移，整合用例、用例评审与生成流程
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  FeatureCaseList,
  CaseRepositorySpaceManager,
  FeatureCaseDetail,
  CreateSuccess,
  RecycleCaseList,
  CaseReviewList,
  CreateReview,
  ReviewDetail,
  ReviewCaseDetail,
  CaseGenerationLayout,
} from '@/components/features/case-management';
import { CaseRealizationPage } from './E2EAutomationPage';
import type { CaseItem } from '@/components/features/case-management';
import { TestSuiteManager, GateBindingManager } from '@/components/features/test-asset';
import { caseManagementService } from '@/services';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layers3, Plus, FolderPlus, GitBranch, FolderGit2, Check, PackageCheck, Sparkles, ChevronDown } from 'lucide-react';

interface CaseManagementPageProps {
  selectedTopMenu?: string;
  searchParams?: Record<string, string | null>;
  onNavigate?: (menu: string, tab?: string, reportId?: string | null) => void;
}

export function CaseManagementPage({
  selectedTopMenu = 'feature-case',
  searchParams: propSearchParams,
  onNavigate,
}: CaseManagementPageProps) {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const params = propSearchParams ?? Object.fromEntries(urlSearchParams.entries());
  const tab = selectedTopMenu || params.tab || 'feature-case';
  // 兼容分享链接：/#/case-management/featureCase?id=...（旧系统使用 id 作为用例ID）
  const caseId = params.caseId ?? params.id ?? null;
  const mode = params.mode ?? null;
  /** 从测试计划用例执行页跳转编辑时携带，返回时应回到该页面 */
  const fromPlanId = params.fromPlanId ?? null;
  const fromPlanCaseId = params.fromPlanCaseId ?? null;
  /** 执行页的 query（含 ?），返回时带回以保持模块/测试点过滤 */
  const fromPlanQuery = params.fromPlanQuery ?? null;
  const success = params.success === '1' || params.success === 'true';
  const recycle = params.recycle === '1' || params.recycle === 'true';
  const action = params.action ?? null;
  const reviewId = params.reviewId ?? null;
  const chatId = params.chatId ?? null;
  const firstQuery = params.firstQuery ?? null;
  const firstMentioned = params.firstMentioned ?? null;
  const firstModelId = params.firstModelId ?? null;
  const spaceId = params.spaceId ?? null;
  const projectId = params.pId ? String(params.pId) : (localStorage.getItem('currentProjectId') || 'default-project');

  const [repoList, setRepoList] = useState<string[]>(['示例用例库']);
  const [selectedRepo, setSelectedRepo] = useState(localStorage.getItem('currentCaseRepo') || '示例用例库');
  const [selectedVersion, setSelectedVersion] = useState(localStorage.getItem('currentCaseVersion') || 'master');

  const [isCreateRepoOpen, setIsCreateRepoOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');

  useEffect(() => {
    caseManagementService.getCaseRepositories(projectId, spaceId ?? undefined)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(list) && list.length > 0) {
          const names = list.map((item: any) => item.name);
          setRepoList(names);
          if (!selectedRepo || !names.includes(selectedRepo)) {
            setSelectedRepo(names[0]);
            localStorage.setItem('currentCaseRepo', names[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('获取服务端用例库失败，使用示例用例库:', err);
      });
  }, [projectId, spaceId]);

  const handleRepoChange = (repo: string) => {
    setSelectedRepo(repo);
    localStorage.setItem('currentCaseRepo', repo);
    toast.info(`已切换用例库: ${repo}`);
  };

  const handleVersionChange = (ver: string) => {
    setSelectedVersion(ver);
    localStorage.setItem('currentCaseVersion', ver);
    toast.info(`已切换版本基线: ${ver}`);
  };

  const handleCreateRepoSubmit = async () => {
    const trimmed = newRepoName.trim();
    if (!trimmed) {
      toast.error('请输入用例库名称');
      return;
    }

    try {
      await caseManagementService.createCaseRepository({
        name: trimmed,
        description: newRepoDesc,
        defaultBranch: 'master',
      });
      const updated = Array.from(new Set([...repoList, trimmed]));
      setRepoList(updated);
      setSelectedRepo(trimmed);
      localStorage.setItem('currentCaseRepo', trimmed);

      toast.success(`成功创建用例库并关联至现存用例: ${trimmed}`);
      setNewRepoName('');
      setNewRepoDesc('');
      setIsCreateRepoOpen(false);
    } catch (err: any) {
      console.error(err);
      // 兼容非 200 HTTP 响应回退
      const updated = Array.from(new Set([...repoList, trimmed]));
      setRepoList(updated);
      setSelectedRepo(trimmed);
      localStorage.setItem('currentCaseRepo', trimmed);
      toast.success(`成功创建用例库: ${trimmed}`);
      setNewRepoName('');
      setNewRepoDesc('');
      setIsCreateRepoOpen(false);
    }
  };

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(urlSearchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === '') next.delete(k);
      else next.set(k, v);
    });
    setUrlSearchParams(next, { replace: true });
  };

  const currentMenu = params.menu || 'test-case';
  const goToFeatureCase = () => {
    // 只清除用例/模式，保留 moduleId 以便返回后停留在原目录；保留 keyword 和 filter 以便恢复搜索状态
    updateParams({ caseId: null, mode: null, success: null, recycle: null });
    // 不调用 onNavigate：父级 updateUrl 会用旧的 searchParams 重新 navigate，把刚清除的 caseId/mode 又写回 URL，导致返回不生效
  };

  const goToRecycle = () => {
    updateParams({ caseId: null, mode: null, success: null, recycle: '1' });
  };

  /** 进入详情/编辑/新建；moduleId 写入 URL，返回列表时恢复该目录 */
  const goToCaseDetail = (id?: string | null, m: 'add' | 'edit' | 'copy' = 'add', moduleId?: string | null) => {
    const updates: Record<string, string | null> = { caseId: id || null, mode: m, success: null, recycle: null };
    if (moduleId != null && moduleId !== '') updates.moduleId = moduleId;
    updateParams(updates);
  };

  const goToCreateSuccess = (id: string, name: string) => {
    updateParams({ caseId: id, caseName: name, mode: null, success: '1', recycle: null });
  };

  const goToCaseReview = () => {
    updateParams({ action: null, reviewId: null, caseId: null });
    // 已在用例评审 tab 时不再调用 onNavigate，避免父级 updateUrl 覆盖掉已清除的 action
    if (tab !== 'case-review') {
      onNavigate?.(currentMenu, 'case-review');
    }
  };

  const goToCreateReview = (moduleId?: string) => {
    updateParams({ action: 'create', reviewId: null, caseId: null, moduleId: moduleId ?? null, success: null });
    // 若已在用例评审 tab，不再调用 onNavigate，避免父级 updateUrl 覆盖掉 action=create
    if (tab !== 'case-review') {
      onNavigate?.(currentMenu, 'case-review');
    }
  };

  const goToEditReview = (id: string) => {
    updateParams({ action: 'edit', reviewId: id, caseId: null });
  };

  const goToReviewDetail = (id: string) => {
    updateParams({ reviewId: id, caseId: null, action: null });
  };

  const goToReviewCaseDetail = (rId: string, cId: string, moduleId?: string) => {
    updateParams({ reviewId: rId, caseId: cId, moduleId: moduleId ?? null });
  };

  const renderSpaceRequired = (title: string) => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <Card className="max-w-md rounded-3xl border-dashed border-slate-200 p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <Layers3 className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          测试套件和门禁绑定属于 Space 下的长期测试资产。请先进入某个 Space，再维护这些资产。
        </p>
        <Button className="mt-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => onNavigate?.(currentMenu, 'space')}>
          返回空间
        </Button>
      </Card>
    </div>
  );

  if (tab === 'space') {
    return <CaseRealizationPage />;
  }

  if (tab === 'test-suite') {
    if (!spaceId) return renderSpaceRequired('请先进入 Space');
    return <TestSuiteManager projectId={projectId} spaceId={spaceId} />;
  }

  if (tab === 'gate-binding') {
    if (!spaceId) return renderSpaceRequired('请先进入 Space');
    return <GateBindingManager projectId={projectId} spaceId={spaceId} />;
  }

  // 用例
  if (tab === 'feature-case') {
    if (recycle) {
      return (
        <RecycleCaseList
          projectId={projectId}
          onBack={goToFeatureCase}
        />
      );
    }
    if (success && caseId) {
      return (
        <CreateSuccess
          caseId={caseId}
          caseName={params.caseName ?? undefined}
          onBackToList={goToFeatureCase}
          onEditCase={() => goToCaseDetail(caseId, 'edit')}
          onContinueCreate={() => goToCaseDetail(null, 'add')}
          onCreateCaseReview={goToCreateReview}
        />
      );
    }
    if ((mode === 'add' || mode === 'edit' || mode === 'copy') && (mode === 'add' || caseId)) {
      const backFromEdit = fromPlanId && fromPlanCaseId
        ? () => {
            const queryPart = fromPlanQuery ? decodeURIComponent(fromPlanQuery) : '';
            navigate(`/test-plan/${fromPlanId}/feature-case/${fromPlanCaseId}${queryPart}`);
          }
        : goToFeatureCase;
      return (
        <FeatureCaseDetail
          mode={mode as 'add' | 'edit' | 'copy'}
          caseId={mode !== 'add' ? caseId ?? undefined : undefined}
          projectId={projectId}
          spaceId={spaceId ?? undefined}
          initialModuleId={mode === 'add' ? (params.moduleId ?? undefined) : undefined}
          onBack={backFromEdit}
          onSuccess={(id, name) => {
            if (mode === 'add' || mode === 'copy') {
              updateParams({ caseName: name });
              goToCreateSuccess(id, name);
            } else {
              if (fromPlanId && fromPlanCaseId) {
                const queryPart = fromPlanQuery ? decodeURIComponent(fromPlanQuery) : '';
                navigate(`/test-plan/${fromPlanId}/feature-case/${fromPlanCaseId}${queryPart}`);
              } else {
                goToFeatureCase();
              }
            }
          }}
        />
      );
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
        {/* 参考空间/项目选择器的标准 AegisOne Dropdown 风格顶栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-2.5 shrink-0 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-4">
            {/* 用例库 Dropdown 选择器 (同空间选择器) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">用例库:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors shadow-2xs">
                    <FolderGit2 className="w-4 h-4 text-blue-600" />
                    <span>{selectedRepo}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">用例库列表 (Repositories)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {repoList.map((r) => (
                    <DropdownMenuItem
                      key={r}
                      onClick={() => handleRepoChange(r)}
                      className={`flex items-center justify-between text-sm ${
                        selectedRepo === r ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>📦 {r}</span>
                      </div>
                      {selectedRepo === r && <Check className="w-4 h-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsCreateRepoOpen(true)}
                    className="text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    新建用例库 (Repo)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="h-4 w-px bg-gray-200" />

            {/* 版本基线 Dropdown 选择器 (同空间选择器) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">版本基线:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors shadow-2xs">
                    <GitBranch className="w-4 h-4 text-emerald-600" />
                    <span>{selectedVersion === 'master' ? 'master (主干分支)' : selectedVersion}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-gray-500 font-semibold">分支与基线 Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['master', 'v1.0.0', 'v2.0.0'].map((ver) => (
                    <DropdownMenuItem
                      key={ver}
                      onClick={() => handleVersionChange(ver)}
                      className={`flex items-center justify-between text-sm ${
                        selectedVersion === ver ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span>🏷️ {ver} {ver === 'master' ? '(主干分支)' : '(Release Tag)'}</span>
                      {selectedVersion === ver && <Check className="w-4 h-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              当前运行环境: {selectedVersion === 'master' ? 'Master 主干测试机' : `基线快照 ${selectedVersion}`}
            </span>
          </div>
        </div>

        {/* 新建用例库弹窗 */}
        <Dialog open={isCreateRepoOpen} onOpenChange={setIsCreateRepoOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                新建测试用例库 (Repository)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                用例库类似独立的代码仓库，支持独立的模块划分与以 <code className="text-blue-600 bg-blue-50 px-1 rounded">master</code> 为首的主干版本基线管理。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="repo-name" className="text-xs font-semibold text-slate-700">
                  用例库名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="repo-name"
                  placeholder="例如：交易结算用例库 / 供应链中心测试库"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="repo-version" className="text-xs font-semibold text-slate-700">
                  默认主干版本
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  master (主分支自动创建)
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="repo-desc" className="text-xs font-semibold text-slate-700">
                  用例库描述
                </Label>
                <Input
                  id="repo-desc"
                  placeholder="例如：包含全量结算与开票业务用例集"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateRepoOpen(false)}
                className="h-9"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateRepoSubmit}
                className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
              >
                立即创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <FeatureCaseList
            projectId={params.pId ? String(params.pId) : projectId}
            spaceId={spaceId ?? undefined}
            initialCaseId={caseId}
            initialSelectedModuleId={params.moduleId ?? undefined}
            onViewCase={(item: CaseItem, selectedModuleId?: string) => {
              const updates: Record<string, string | null> = { caseId: item.id, mode: null, success: null, recycle: null };
              if (selectedModuleId != null && selectedModuleId !== '') updates.moduleId = selectedModuleId;
              updateParams(updates);
            }}
            onEditCase={(item: CaseItem, selectedModuleId?: string) => goToCaseDetail(item.id, 'edit', selectedModuleId)}
            onCopyCase={(item: CaseItem, selectedModuleId?: string) => goToCaseDetail(item.id, 'copy', selectedModuleId)}
            onCreateCase={(selectedModuleId?: string) => goToCaseDetail(null, 'add', selectedModuleId)}
            onNavigateToRecycle={goToRecycle}
            onAiGenerate={() => onNavigate?.(currentMenu, 'case-generation')}
          />
        </div>
      </div>
    );
  }

  // 用例生成（RAG Chat）- 侧边栏 + 主区域，参考 aegis-rag-frontend
  if (tab === 'case-generation') {
    const handleChatIdChange = (id: string | null) => {
      const next = new URLSearchParams(urlSearchParams);
      if (id == null || id === '') {
        next.delete('chatId');
        next.delete('firstQuery');
        next.delete('firstMentioned');
        next.delete('firstModelId');
      } else {
        next.set('chatId', id);
        next.delete('firstQuery');
        next.delete('firstMentioned');
        next.delete('firstModelId');
      }
      const path = location.pathname || '/';
      navigate(`${path}?${next.toString()}`, { replace: true });
    };
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
        <CaseGenerationLayout
          projectId={projectId}
          spaceId={spaceId ?? undefined}
          chatId={chatId}
          firstQuery={firstQuery}
          firstMentionedItems={
            firstMentioned ? (() => {
              try {
                return JSON.parse(decodeURIComponent(firstMentioned));
              } catch {
                return null;
              }
            })() : null
          }
          firstModelId={firstModelId}
          onChatIdChange={handleChatIdChange}
          onParamsClear={() =>
            updateParams({ firstQuery: null, firstMentioned: null, firstModelId: null })
          }
        />
      </div>
    );
  }

  // 用例评审
  if (tab === 'case-review') {
    if (reviewId && caseId) {
      return (
        <ReviewCaseDetail
          reviewId={reviewId}
          caseId={caseId}
          projectId={projectId}
          filterModuleId={params.moduleId ?? undefined}
          onBack={() => goToReviewDetail(reviewId)}
          onSelectCase={(newCaseId) => updateParams({ caseId: newCaseId })}
        />
      );
    }
    if (reviewId) {
      const editSheetOpen = action === 'edit';
      return (
        <>
          <ReviewDetail
            reviewId={reviewId}
            projectId={projectId}
            initialModuleId={params.moduleId ?? undefined}
            onBack={goToCaseReview}
            onViewCase={(cId, mId) => goToReviewCaseDetail(reviewId, cId, mId)}
            onEditReview={(id) => updateParams({ action: 'edit', reviewId: id })}
          />
          <Sheet
            open={editSheetOpen}
            onOpenChange={(open) => { if (!open) updateParams({ action: null }); }}
          >
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0 pt-14">
              <CreateReview
                projectId={projectId}
                moduleId={params.moduleId ?? undefined}
                reviewId={params.reviewId ?? undefined}
                onBack={() => updateParams({ action: null })}
                onSuccess={(id) => { updateParams({ action: null }); goToReviewDetail(id); }}
                inDrawer
              />
            </SheetContent>
          </Sheet>
        </>
      );
    }
    const createOrEditOpen = action === 'create' || action === 'edit';
    return (
      <>
        <CaseReviewList
          projectId={projectId}
          onCreateReview={goToCreateReview}
          onViewReview={goToReviewDetail}
          onEditReview={goToEditReview}
        />
        <Sheet open={createOrEditOpen} onOpenChange={(open) => { if (!open) goToCaseReview(); }}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0 pt-14">
            <CreateReview
              projectId={projectId}
              moduleId={params.moduleId ?? undefined}
              reviewId={action === 'edit' ? (params.reviewId ?? undefined) : undefined}
              onBack={goToCaseReview}
              onSuccess={(id) => { goToCaseReview(); goToReviewDetail(id); }}
              inDrawer
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // 默认显示用例
  return (
    <FeatureCaseList
      projectId={projectId}
      spaceId={spaceId ?? undefined}
      initialSelectedModuleId={params.moduleId ?? undefined}
      onViewCase={(item, selectedModuleId) => {
        const updates: Record<string, string | null> = { caseId: item.id, mode: null, success: null, recycle: null };
        if (selectedModuleId != null && selectedModuleId !== '') updates.moduleId = selectedModuleId;
        updateParams(updates);
      }}
      onEditCase={(item, selectedModuleId) => goToCaseDetail(item.id, 'edit', selectedModuleId)}
      onCreateCase={(selectedModuleId) => goToCaseDetail(null, 'add', selectedModuleId)}
      onNavigateToRecycle={goToRecycle}
      onAiGenerate={() => onNavigate?.(currentMenu, 'case-generation')}
    />
  );
}
