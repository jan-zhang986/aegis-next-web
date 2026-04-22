/**
 * WorkflowDesignerEmbed Component
 * 工作流设计器嵌入组件
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Save, Play, History, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/utils/cn';
import WorkflowDesignPageV2, { WorkflowDesignPageV2Ref } from '@/components/features/WorkflowDesignPageV2';
import { RequestHeadersPopover } from '@/components/features/workflow-designer/components';
import { useEngineProfiles } from '@/components/features/workflow-designer/hooks';
import type { E2ESpace } from '@/services/e2e-space';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount: number;
  duration?: number;
  status: 'success' | 'failed' | 'not-run';
  lastRun?: string;
  creator: string;
}

interface WorkflowDesignerEmbedProps {
  space: E2ESpace;
  selectedTestCase: TestCase;
  selectedModule: string | null;
  viewMode: 'canvas' | 'steps';
  setViewMode: (mode: 'canvas' | 'steps') => void;
  isFullscreen: boolean;
  fullscreenContainerRef: React.RefObject<HTMLDivElement>;
  onToggleFullscreen: () => Promise<void>;
  onBack: () => void;
  onReturnToList: () => void;
  loadTestCases: (moduleId?: string) => Promise<void>;
  loading: boolean;
  workflowDesignRef: React.RefObject<WorkflowDesignPageV2Ref>;
}

const STORAGE_KEY_PREFIX = 'lastExecutionEnvironment_';
const USER_VARS_PREFIX = 'workflow_user_variables_';

function getUserVarsFromStorage(projectId: string) {
  const p = `${USER_VARS_PREFIX}${projectId}_`;
  return {
    xTagHeader: localStorage.getItem(`${p}x-tag-header`) || '',
    xSiteTenant: localStorage.getItem(`${p}x-site-tenant`) || '',
    xTenantId: localStorage.getItem(`${p}x-tenant-id`) || '',
    xApp: localStorage.getItem(`${p}x-app`) || '',
  };
}

function saveUserVarToStorage(projectId: string, key: 'x-tag-header' | 'x-site-tenant' | 'x-tenant-id' | 'x-app', value: string) {
  if (!projectId) return;
  const vars = getUserVarsFromStorage(projectId);
  const next = { ...vars };
  if (key === 'x-tag-header') next.xTagHeader = value;
  else if (key === 'x-site-tenant') next.xSiteTenant = value;
  else if (key === 'x-tenant-id') next.xTenantId = value;
  else if (key === 'x-app') next.xApp = value;
  const p = `${USER_VARS_PREFIX}${projectId}_`;
  localStorage.setItem(`${p}x-tag-header`, next.xTagHeader);
  localStorage.setItem(`${p}x-site-tenant`, next.xSiteTenant);
  localStorage.setItem(`${p}x-tenant-id`, next.xTenantId);
  localStorage.setItem(`${p}x-app`, next.xApp);
}

export const WorkflowDesignerEmbed: React.FC<WorkflowDesignerEmbedProps> = ({
  space,
  selectedTestCase,
  selectedModule,
  viewMode,
  setViewMode,
  isFullscreen,
  fullscreenContainerRef,
  onToggleFullscreen,
  onBack,
  onReturnToList,
  loadTestCases,
  loading,
  workflowDesignRef,
}) => {
  const projectId = space.projectId || '';

  const { engineProfiles, loadingProfiles } = useEngineProfiles({
    projectId,
    selectedGlobalEnvironmentId: null,
  });

  const [executionEnvironmentId, setExecutionEnvironmentIdState] = useState<string>(() =>
    projectId ? (localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`) || '') : ''
  );

  const setExecutionEnvironmentIdWithSave = useCallback(
    (id: string) => {
      setExecutionEnvironmentIdState(id);
      if (projectId) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, id);
      }
    },
    [projectId]
  );

  const [userVarXTagHeader, setUserVarXTagHeader] = useState(() => getUserVarsFromStorage(projectId).xTagHeader);
  const [userVarXSiteTenant, setUserVarXSiteTenant] = useState(() => getUserVarsFromStorage(projectId).xSiteTenant);
  const [userVarXTenantId, setUserVarXTenantId] = useState(() => getUserVarsFromStorage(projectId).xTenantId);
  const [userVarXApp, setUserVarXApp] = useState(() => getUserVarsFromStorage(projectId).xApp);

  const setUserVarXTagHeaderWithSave = useCallback(
    (v: string) => {
      setUserVarXTagHeader(v);
      saveUserVarToStorage(projectId, 'x-tag-header', v);
    },
    [projectId]
  );
  const setUserVarXSiteTenantWithSave = useCallback(
    (v: string) => {
      setUserVarXSiteTenant(v);
      saveUserVarToStorage(projectId, 'x-site-tenant', v);
    },
    [projectId]
  );
  const setUserVarXTenantIdWithSave = useCallback(
    (v: string) => {
      setUserVarXTenantId(v);
      saveUserVarToStorage(projectId, 'x-tenant-id', v);
    },
    [projectId]
  );
  const setUserVarXAppWithSave = useCallback(
    (v: string) => {
      setUserVarXApp(v);
      saveUserVarToStorage(projectId, 'x-app', v);
    },
    [projectId]
  );

  // 将嵌入页工具栏的请求头同步到设计页，使「调试节点」和「运行测试」都能使用当前设置的 userVariables
  useEffect(() => {
    const ref = workflowDesignRef.current;
    if (!ref?.setUserVariableXTagHeader) return;
    ref.setUserVariableXTagHeader(userVarXTagHeader);
    ref.setUserVariableXSiteTenant?.(userVarXSiteTenant);
    ref.setUserVariableXTenantId?.(userVarXTenantId);
    ref.setUserVariableXApp?.(userVarXApp);
  }, [workflowDesignRef, selectedTestCase?.id, userVarXTagHeader, userVarXSiteTenant, userVarXTenantId, userVarXApp]);

  return (
    <div 
      ref={fullscreenContainerRef}
      className={cn(
        "flex-1 w-full h-full flex flex-col bg-gray-50 min-w-0 overflow-hidden",
        isFullscreen && "fixed inset-0 z-[9999] bg-gray-50 h-screen w-screen"
      )}
    >
      {/* Header with breadcrumb and actions */}
      {!isFullscreen && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToList}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回测试用例列表
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={(e) => {
                        e.preventDefault();
                        onBack();
                      }}
                      className="cursor-pointer hover:text-gray-900"
                    >
                      自动化用例
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={(e) => {
                        e.preventDefault();
                        onReturnToList();
                      }}
                      className="cursor-pointer hover:text-gray-900"
                    >
                      {space.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedTestCase.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'canvas' | 'steps')} className="h-9">
                <TabsList className="h-9">
                  <TabsTrigger value="canvas" className="text-xs">
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    画布
                  </TabsTrigger>
                  <TabsTrigger value="steps" className="text-xs">
                    <List className="w-4 h-4 mr-1" />
                    步骤
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="h-6 w-px bg-gray-200" />
              
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={async () => {
                  if (workflowDesignRef.current?.handleShowDebugHistory) {
                    await workflowDesignRef.current.handleShowDebugHistory();
                  }
                }}
                disabled={loading || !selectedTestCase?.id}
              >
                <History className="w-4 h-4" />
                调试历史
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={async () => {
                  if (workflowDesignRef.current) {
                    await workflowDesignRef.current.handleSave();
                  }
                }}
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                保存
              </Button>

              {/* 请求头设置：始终显示，用本地 state 控制，输入即生效并写入 localStorage */}
              <RequestHeadersPopover
                projectId={projectId || ''}
                userVariableXTagHeader={userVarXTagHeader}
                setUserVariableXTagHeader={setUserVarXTagHeaderWithSave}
                userVariableXSiteTenant={userVarXSiteTenant}
                setUserVariableXSiteTenant={setUserVarXSiteTenantWithSave}
                userVariableXTenantId={userVarXTenantId}
                setUserVariableXTenantId={setUserVarXTenantIdWithSave}
                userVariableXApp={userVarXApp}
                setUserVariableXApp={setUserVarXAppWithSave}
              />

              {/* 执行环境选择器：始终显示，无数据时显示占位；选择即生效 */}
              <Select
                value={executionEnvironmentId || ''}
                onValueChange={setExecutionEnvironmentIdWithSave}
                disabled={loadingProfiles}
              >
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder={loadingProfiles ? '加载中...' : engineProfiles.length === 0 ? '暂无环境' : '选择执行环境'} />
                </SelectTrigger>
                <SelectContent>
                  {engineProfiles.length === 0 && !loadingProfiles ? (
                    <div className="py-2 px-2 text-xs text-gray-500">暂无执行环境</div>
                  ) : (
                    engineProfiles.map((profile: any) => {
                      const envId = profile.environmentId || profile.id;
                      const name = profile.environmentName || profile.name || '';
                      return (
                        <SelectItem key={envId} value={envId || ''}>
                          {name}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              
              <Button 
                size="sm" 
                className="gap-1 bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  if (workflowDesignRef.current) {
                    const userVariables: Record<string, string> = {};
                    if (userVarXTagHeader.trim()) userVariables['x-tag-header'] = userVarXTagHeader.trim();
                    if (userVarXSiteTenant.trim()) userVariables['x-site-tenant'] = userVarXSiteTenant.trim();
                    if (userVarXTenantId.trim()) userVariables['x-tenant-id'] = userVarXTenantId.trim();
                    if (userVarXApp.trim()) userVariables['x-app'] = userVarXApp.trim();
                    await workflowDesignRef.current.handleRunWorkflow({
                      userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
                    });
                  }
                }}
              >
                <Play className="w-4 h-4" />
                运行测试
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* 全屏时显示简化的顶部操作栏 */}
      {isFullscreen && (
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-2">
          <div className="flex items-center justify-end gap-3">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'canvas' | 'steps')} className="h-9">
              <TabsList className="h-9">
                <TabsTrigger value="canvas" className="text-xs">
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  画布
                </TabsTrigger>
                <TabsTrigger value="steps" className="text-xs">
                  <List className="w-4 h-4 mr-1" />
                  步骤
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="h-6 w-px bg-gray-200" />
            
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={async () => {
                if (workflowDesignRef.current?.handleShowDebugHistory) {
                  await workflowDesignRef.current.handleShowDebugHistory();
                }
              }}
              disabled={loading || !selectedTestCase?.id}
            >
              <History className="w-4 h-4" />
              调试历史
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={async () => {
                if (workflowDesignRef.current) {
                  await workflowDesignRef.current.handleSave();
                }
              }}
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              保存
            </Button>

            {/* 请求头设置：始终显示 */}
            <RequestHeadersPopover
              projectId={projectId || ''}
              userVariableXTagHeader={userVarXTagHeader}
              setUserVariableXTagHeader={setUserVarXTagHeaderWithSave}
              userVariableXSiteTenant={userVarXSiteTenant}
              setUserVariableXSiteTenant={setUserVarXSiteTenantWithSave}
              userVariableXTenantId={userVarXTenantId}
              setUserVariableXTenantId={setUserVarXTenantIdWithSave}
              userVariableXApp={userVarXApp}
              setUserVariableXApp={setUserVarXAppWithSave}
            />

            {/* 执行环境选择器：始终显示 */}
            <Select
              value={executionEnvironmentId || ''}
              onValueChange={setExecutionEnvironmentIdWithSave}
              disabled={loadingProfiles}
            >
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder={loadingProfiles ? '加载中...' : engineProfiles.length === 0 ? '暂无环境' : '选择执行环境'} />
              </SelectTrigger>
              <SelectContent>
                {engineProfiles.length === 0 && !loadingProfiles ? (
                  <div className="py-2 px-2 text-xs text-gray-500">暂无执行环境</div>
                ) : (
                  engineProfiles.map((profile: any) => {
                    const envId = profile.environmentId || profile.id;
                    const name = profile.environmentName || profile.name || '';
                    return (
                      <SelectItem key={envId} value={envId || ''}>
                        {name}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            
            <Button 
              size="sm" 
              className="gap-1 bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                if (workflowDesignRef.current) {
                  const userVariables: Record<string, string> = {};
                  if (userVarXTagHeader.trim()) userVariables['x-tag-header'] = userVarXTagHeader.trim();
                  if (userVarXSiteTenant.trim()) userVariables['x-site-tenant'] = userVarXSiteTenant.trim();
                  if (userVarXTenantId.trim()) userVariables['x-tenant-id'] = userVarXTenantId.trim();
                  if (userVarXApp.trim()) userVariables['x-app'] = userVarXApp.trim();
                  await workflowDesignRef.current.handleRunWorkflow({
                    userVariables: Object.keys(userVariables).length > 0 ? userVariables : undefined,
                  });
                }
              }}
            >
              <Play className="w-4 h-4" />
              运行测试
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={onToggleFullscreen}
            >
              退出全屏
            </Button>
          </div>
        </div>
      )}
      
      {/* Workflow Design Canvas */}
      <div className="flex-1 overflow-hidden">
        <WorkflowDesignPageV2 
          ref={workflowDesignRef}
          viewMode={viewMode}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          workflowId={selectedTestCase?.id}
          moduleId={selectedModule || undefined}
          projectId={space.projectId}
          executionEnvironmentId={executionEnvironmentId}
          setExecutionEnvironmentId={setExecutionEnvironmentIdWithSave}
          onSave={async () => {
            if (selectedModule) {
              await loadTestCases(selectedModule);
            }
          }}
        />
      </div>
    </div>
  );
};
