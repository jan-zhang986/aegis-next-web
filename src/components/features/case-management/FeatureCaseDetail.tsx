/**
 * 用例详情（创建/编辑）
 * 参考 aegis-next-server caseDetail.vue 与 MsCard 布局
 * 埋点：创建/复制时统计编写时长（UserActivityTracker），复用用例编辑时统计修改时长（ModificationTracker）
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import { caseManagementService } from '@/services';
import { getGlobalUserActivityTracker, modificationTracker } from '@/utils/tracking';
import { CaseDetailForm, type CaseDetailFormRef } from './components';
import type { CaseDetail, CreateOrUpdateCaseRequest } from './types';

interface FeatureCaseDetailProps {
  mode: 'add' | 'edit' | 'copy';
  caseId?: string;
  projectId?: string;
  /** 当前 Space。新建/复制 Case 必须来自 Space 入口。 */
  spaceId?: string;
  /** 新建时从指定模块进入，预填所属模块 */
  initialModuleId?: string;
  onBack?: () => void;
  onSuccess?: (caseId: string, caseName: string) => void;
}


function mapUnifiedCaseDetailToLegacyShape(detail: any): CaseDetail {
  const manualRealization = Array.isArray(detail?.realizations)
    ? detail.realizations.find((item: any) => String(item?.realizationType || '').toUpperCase() === 'MANUAL')
    : null;
  const manualImplementation = Array.isArray(detail?.implementations)
    ? detail.implementations.find((item: any) => String(item?.type || '').toUpperCase() === 'MANUAL')
    : null;
  const manualDefinition =
    manualRealization?.workflowDefinition ||
    manualImplementation?.definition ||
    {};
  const metadata = detail?.metadata || {};
  const resolvedCaseEditType =
    metadata.caseEditType ||
    manualDefinition.caseEditType ||
    (manualDefinition.textDescription ? 'TEXT' : 'STEP');

  return {
    ...detail,
    id: detail?.caseId || detail?.id,
    caseId: detail?.caseId || detail?.id,
    num: detail?.caseKey || detail?.num,
    name: detail?.title || detail?.name || '',
    prerequisite: detail?.precondition || detail?.prerequisite || '',
    caseEditType: resolvedCaseEditType,
    steps: manualDefinition.steps || detail?.steps || '',
    textDescription: manualDefinition.textDescription || detail?.textDescription || '',
    expectedResult: detail?.expectedResult || manualDefinition.expectedResult || '',
    description: detail?.description || '',
    reviewStatus: detail?.lifecycleStatus || detail?.reviewStatus,
    customFields: Array.isArray(detail?.customFields) ? detail.customFields : [],
    functionalPriority: detail?.functionalPriority || detail?.priority,
    attachments: Array.isArray(detail?.attachments) ? detail.attachments : [],
    tags: Array.isArray(detail?.tags) ? detail.tags : [],
  } as CaseDetail;
}

function resolveUploadedFileId(res: any): string {
  if (typeof res === 'string') return res;
  if (typeof res?.data === 'string') return res.data;
  const fileId = res?.data?.id ?? res?.data?.fileId ?? res?.id ?? res?.fileId;
  if (!fileId || typeof fileId !== 'string') {
    throw new Error('上传失败：无法获取文件 ID');
  }
  return fileId;
}

async function uploadCaseAttachments(fileList: File[] = []): Promise<string[]> {
  const fileIds: string[] = [];
  for (const file of fileList) {
    const res = await caseManagementService.editorUploadFile({ fileList: [file] });
    fileIds.push(resolveUploadedFileId(res));
  }
  return fileIds;
}

function buildUnifiedCasePayload(
  req: CreateOrUpdateCaseRequest & { fileList?: File[] },
  options: {
    caseId?: string;
    spaceId?: string;
    sourceType?: string;
    lifecycleStatus?: string;
    ownerId?: string;
    uploadFileIds?: string[];
  }
) {
  const manualDefinition: Record<string, any> = {
    caseEditType: req.caseEditType,
    expectedResult: req.expectedResult,
  };
  if (req.caseEditType === 'STEP') {
    manualDefinition.steps = req.steps;
  } else {
    manualDefinition.textDescription = req.textDescription;
  }

  return {
    caseId: options.caseId,
    projectId: req.projectId,
    spaceId: options.spaceId,
    moduleId: req.moduleId,
    title: req.name,
    description: req.description,
    precondition: req.prerequisite,
    expectedResult: req.expectedResult,
    sourceType: options.sourceType,
    lifecycleStatus: options.lifecycleStatus,
    ownerId: options.ownerId,
    tags: req.tags,
    workflowId: req.workflowId,
    uploadFileIds: options.uploadFileIds || req.uploadFileIds,
    relateFileMetaIds: req.relateFileMetaIds,
    deleteFileMetaIds: req.deleteFileMetaIds,
    unLinkFilesIds: req.unLinkFilesIds,
    metadata: {
      templateId: req.templateId,
      caseEditType: req.caseEditType,
    },
    realizations: [
      {
        realizationType: 'MANUAL',
        name: `${req.name} [MANUAL]`,
        workflowDefinition: manualDefinition,
        status: 'ACTIVE',
        enabled: true,
      },
    ],
    // @deprecated compatibility payload for legacy backend write path; product-facing clients should prefer realizations
    implementations: [
      {
        type: 'MANUAL',
        name: `${req.name} [MANUAL]`,
        definition: manualDefinition,
      },
    ],
  };
}

export function FeatureCaseDetail({
  mode,
  caseId,
  projectId = localStorage.getItem('currentProjectId') || 'default-project',
  spaceId,
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

  const [executing, setExecuting] = useState(false);
  const handleExecute = async () => {
    if (!caseId) return;
    setExecuting(true);
    try {
      const res: any = await caseManagementService.executeCaseWorkflow(caseId);
      if (res?.success !== false) {
        toast.success('自动化已触发执行');
      } else {
        toast.error(res?.message || '执行触发失败');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || '执行触发失败，请检查是否已绑定自动化');
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    if ((mode === 'edit' || mode === 'copy') && caseId) {
      caseManagementService
        .getUnifiedCaseDetail(caseId)
        .then((res: any) => mapUnifiedCaseDetailToLegacyShape(res))
        .catch(async () => {
          const legacyRes = await caseManagementService.getCaseDetail(caseId);
          return legacyRes;
        })
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
        spaceId,
      };
      if (caseId && mode === 'edit') {
        request.id = caseId;
      }

      if (mode === 'add' || mode === 'copy') {
        // 埋点：保存前停止追踪并取编写时长，创建成功后用真实 caseId 上报
        const trackedDuration = userActivityTracker.stopAndGetDuration();
        let id = '';
        if (!spaceId) {
          const { fileList: fl, ...reqBody } = req;
          const res: any = await caseManagementService.createCaseRequest({
            request: reqBody,
            fileList: fl || [],
          });
          id = res?.id ?? res?.data?.id ?? '';
        } else {
          const uploadFileIds = await uploadCaseAttachments(req.fileList || []);
          id = await caseManagementService.saveUnifiedCase(
            buildUnifiedCasePayload(req, {
              spaceId,
              sourceType: defaultCaseInfo?.aiCreate ? 'AI' : undefined,
              uploadFileIds,
            })
          );
        }
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
        const resolvedSpaceId = spaceId || defaultCaseInfo?.spaceId;
        if (!resolvedSpaceId) {
          const updatePayload: Record<string, any> = {
            ...request,
            id: caseId,
          };
          updatePayload.fileList = req.fileList;
          await caseManagementService.updateCaseRequest(updatePayload);
        } else {
          const uploadFileIds = await uploadCaseAttachments(req.fileList || []);
          await caseManagementService.saveUnifiedCase(
            buildUnifiedCasePayload(req, {
              caseId,
              spaceId: resolvedSpaceId,
              sourceType: defaultCaseInfo?.aiCreate ? 'AI' : undefined,
              lifecycleStatus: defaultCaseInfo?.reviewStatus,
              ownerId: defaultCaseInfo?.createUser,
              uploadFileIds,
            })
          );
        }
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
  }, [mode, caseId, projectId, spaceId, defaultCaseInfo, onSuccess]);

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
                用例
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
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-end items-center gap-4">
          <div className="flex-1">
            {mode === 'edit' && defaultCaseInfo?.workflowId && (
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                onClick={handleExecute}
                disabled={executing || loading}
              >
                <Play className="w-4 h-4 mr-2" />
                {executing ? '启动中...' : '执行自动化'}
              </Button>
            )}
          </div>
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
