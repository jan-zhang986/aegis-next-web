/**
 * 用例管理页面
 * 从 aegis-next-server 迁移，整合用例、用例评审与生成流程
 */

import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  FeatureCaseList,
  FeatureCaseDetail,
  CreateSuccess,
  RecycleCaseList,
  CaseReviewList,
  CreateReview,
  ReviewDetail,
  ReviewCaseDetail,
  CaseGenerationLayout,
} from '@/components/features/case-management';
import type { CaseItem } from '@/components/features/case-management';
import { TestSuiteManager, GateBindingManager } from '@/components/features/test-asset';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers3 } from 'lucide-react';

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

  const projectId = localStorage.getItem('currentProjectId') || 'default-project';

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
