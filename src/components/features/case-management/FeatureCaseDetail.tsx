/**
 * 用例详情（创建/编辑）
 * 参考 spotter-metersphere caseDetail.vue 与 MsCard 布局
 * 埋点：创建/复制时统计编写时长（UserActivityTracker），复用用例编辑时统计修改时长（ModificationTracker）
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { caseManagementService } from '@/services';
import { getGlobalUserActivityTracker, modificationTracker } from '@/utils/tracking';
import { CaseDetailForm, type CaseDetailFormRef } from './components';
import type { CaseDetail } from './types';

interface FeatureCaseDetailProps {
  mode: 'add' | 'edit' | 'copy';
  caseId?: string;
  projectId?: string;
  /** 新建时从指定模块进入，预填所属模块 */
  initialModuleId?: string;
  onBack?: () => void;
  onSuccess?: (caseId: string, caseName: string) => void;
}

export function FeatureCaseDetail({
  mode,
  caseId,
  projectId = localStorage.getItem('currentProjectId') || 'default-project',
  initialModuleId,
  onBack,
  onSuccess,
}: FeatureCaseDetailProps) {
  const [loading, setLoading] = useState(false);
  const [defaultCaseInfo, setDefaultCaseInfo] = useState<CaseDetail | null>(null);
  const formRef = useRef<CaseDetailFormRef>(null);

  const title = mode === 'edit' ? '编辑用例' : mode === 'copy' ? '复制用例' : '创建用例';
  const okText = mode === 'edit' ? '更新' : '确定';
  const isEdit = mode === 'edit';
  const userActivityTracker = getGlobalUserActivityTracker();
  /** 复用用例：编辑时来自复用的用例需统计修改耗时 */
  const isReusedCase = Boolean(isEdit && defaultCaseInfo?.caseSourceType === 'REUSE');

  useEffect(() => {
    if ((mode === 'edit' || mode === 'copy') && caseId) {
      caseManagementService
        .getCaseDetail(caseId)
        .then((res: any) => {
          setDefaultCaseInfo(res);
          if (mode === 'copy' && res?.name) {
            setDefaultCaseInfo({
              ...res,
              name: `copy_${res.name}`.slice(0, 255),
              id: '',
            });
          }
        })
        .catch(() => setDefaultCaseInfo(null));
    } else {
      setDefaultCaseInfo(null);
    }
  }, [mode, caseId]);

  const handleSave = useCallback(async (isContinue = false) => {
    const form = formRef.current;
    if (!form) return;
    const valid = await form.validate();
    if (!valid) {
      toast.error('请完善必填项：用例名称、所属模块、前置条件、步骤/文本描述');
      return;
    }
    setLoading(true);
    try {
      const req = form.getRequest();
      const request: Record<string, any> = {
        projectId: req.projectId,
        templateId: req.templateId,
        name: req.name,
        prerequisite: req.prerequisite,
        caseEditType: req.caseEditType,
        steps: req.steps,
        textDescription: req.textDescription,
        expectedResult: req.expectedResult,
        description: req.description,
        moduleId: req.moduleId,
        tags: req.tags,
        customFields: req.customFields,
      };
      if (caseId && mode === 'edit') {
        request.id = caseId;
      }

      if (mode === 'add' || mode === 'copy') {
        // 埋点：保存前停止追踪并取编写时长，创建成功后用真实 caseId 上报
        const trackedDuration = userActivityTracker.stopAndGetDuration();
        const { fileList: fl, ...reqBody } = req;
        const res: any = await caseManagementService.createCaseRequest({
          request: reqBody,
          fileList: fl || [],
        });
        const id = res?.id ?? res?.data?.id ?? '';
        if (id && trackedDuration > 0) {
          await userActivityTracker.reportWithCaseId(id, trackedDuration);
        }
        if (isContinue) {
          toast.success('保存成功');
          form.resetForm();
          userActivityTracker.stop();
          userActivityTracker.start(`temp-${Date.now()}`);
          return;
        }
        onSuccess?.(id, req.name);
      } else if (mode === 'edit' && caseId) {
        userActivityTracker.stop();
        const modificationDuration = modificationTracker.stopAndGetDuration();
        const updatePayload: Record<string, any> = {
          ...request,
          id: caseId,
        };
        if (req.fileList?.length) updatePayload.fileList = req.fileList;
        await caseManagementService.updateCaseRequest(updatePayload);
        if (modificationDuration > 0) {
          await modificationTracker.reportModificationTime(modificationDuration);
        }
        onSuccess?.(caseId, req.name);
      }
    } catch (err: any) {
      console.error('保存失败:', err);
      toast.error(err?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [mode, caseId, projectId, onSuccess]);

  // 快捷键 Ctrl+S 保存（参考 spotter useShortcutSave）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  // 埋点：创建/复制时启动编写时长追踪；编辑且为复用用例时启动修改耗时追踪
  useEffect(() => {
    if (mode === 'add' || mode === 'copy') {
      userActivityTracker.start(`temp-${Date.now()}`);
    } else if (isReusedCase && caseId) {
      modificationTracker.start(caseId);
      modificationTracker.markAsModified(); // 进入复用用例编辑即视为可能修改，保存时上报时长
    }
    return () => {
      userActivityTracker.stop();
      modificationTracker.stop();
    };
  }, [mode, caseId, isReusedCase]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-0 overflow-hidden">
      <Card className="flex-1 m-4 min-h-0 flex flex-col overflow-hidden">
        {/* 头部：面包屑 + 标题 */}
        <div className="px-6 pt-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="hover:text-gray-800 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                功能用例
              </button>
            )}
            {onBack && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <span className="text-gray-800 font-medium">{title}</span>
          </div>
          <div className="h-px bg-gray-200 -mx-6" />
        </div>

        {/* 内容区：可滚动 */}
        <CardContent className="flex-1 p-6 min-h-0 overflow-auto">
          <div className="relative min-w-[1000px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-lg">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <CaseDetailForm
              ref={formRef}
              caseId={mode === 'edit' ? caseId : undefined}
              projectId={projectId}
              defaultCaseInfo={defaultCaseInfo}
              initialModuleId={mode === 'add' ? initialModuleId : undefined}
            />
          </div>
        </CardContent>

        {/* 底部：操作按钮（参考 MsCard footerRight） */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-end gap-4">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            取消
          </Button>
          {!isEdit && (
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              保存并继续
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={loading}>
            {loading ? '保存中...' : okText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
