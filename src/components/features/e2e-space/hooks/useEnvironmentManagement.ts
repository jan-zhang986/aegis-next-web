/**
 * useEnvironmentManagement Hook
 * 环境管理逻辑
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';
import type { Environment, EngineType, EnvCode } from '@/services/environment';
import type { CaseRealizationSpace } from '@/services/e2e-space';

interface UseEnvironmentManagementParams {
  space: CaseRealizationSpace;
}

interface UseEnvironmentManagementReturn {
  // 状态
  environments: Environment[];
  setEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>;
  selectedEnvironmentId: string;
  setSelectedEnvironmentId: (id: string) => void;
  loadingEnvironments: boolean;
  setLoadingEnvironments: React.Dispatch<React.SetStateAction<boolean>>;
  isEnvironmentDialogOpen: boolean;
  setIsEnvironmentDialogOpen: (open: boolean) => void;
  // 用户变量
  userVariableXTagHeader: string;
  setUserVariableXTagHeader: (value: string) => void;
  userVariableXSiteTenant: string;
  setUserVariableXSiteTenant: (value: string) => void;
  userVariableXTenantId: string;
  setUserVariableXTenantId: (value: string) => void;
  userVariableXApp: string;
  setUserVariableXApp: (value: string) => void;
  // 操作函数
  loadEnvironments: () => Promise<void>;
  handleOpenEnvironmentDialog: () => Promise<void>;
}

/**
 * useEnvironmentManagement Hook
 * 管理执行环境
 */
export function useEnvironmentManagement({
  space,
}: UseEnvironmentManagementParams): UseEnvironmentManagementReturn {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>('');
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);
  const [isEnvironmentDialogOpen, setIsEnvironmentDialogOpen] = useState(false);
  
  // 用户变量
  const [userVariableXTagHeader, setUserVariableXTagHeader] = useState<string>('');
  const [userVariableXSiteTenant, setUserVariableXSiteTenant] = useState<string>('');
  const [userVariableXTenantId, setUserVariableXTenantId] = useState<string>('');
  const [userVariableXApp, setUserVariableXApp] = useState<string>('');

  // 加载环境列表（从执行机环境配置中获取）
  const loadEnvironments = useCallback(async () => {
    try {
      setLoadingEnvironments(true);
      const projectId = space.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        toast.error('项目ID不存在');
        return;
      }
      
      const response = await workflowService.getEngineProfileList(projectId);
      
      let profiles: any[] = [];
      if (response && 'records' in response) {
        profiles = response.records || [];
      } else if (response && 'list' in response) {
        profiles = response.list || [];
      } else if (Array.isArray(response)) {
        profiles = response;
      }
      
      const envList: Environment[] = profiles.map((profile: any) => ({
        id: profile.environmentId || profile.id,
        projectId: profile.projectId || projectId,
        name: profile.environmentName || profile.name || '',
        engineType: (profile.engineType || 'API') as EngineType,
        envCode: (profile.envCode || 'DEV') as EnvCode,
        domain: profile.domain || profile.dataEndpoint?.data_host || '',
      }));
      
      setEnvironments(envList);
      if (envList && envList.length > 0 && !selectedEnvironmentId) {
        setSelectedEnvironmentId(envList[0].id || '');
      }
    } catch (error: any) {
      console.error('加载环境列表失败:', error);
      toast.error('加载环境列表失败');
      setEnvironments([]);
    } finally {
      setLoadingEnvironments(false);
    }
  }, [space.projectId, selectedEnvironmentId]);

  // 打开环境选择弹窗
  const handleOpenEnvironmentDialog = useCallback(async () => {
    await loadEnvironments();
    setIsEnvironmentDialogOpen(true);
  }, [loadEnvironments]);

  return {
    environments,
    setEnvironments,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
    loadingEnvironments,
    setLoadingEnvironments,
    isEnvironmentDialogOpen,
    setIsEnvironmentDialogOpen,
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    loadEnvironments,
    handleOpenEnvironmentDialog,
  };
}
