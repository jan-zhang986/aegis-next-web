/**
 * useEngineProfiles Hook
 * 管理执行环境配置相关逻辑
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { useState, useCallback, useEffect } from 'react';
import { workflowService } from '@/services/workflow';

export interface EngineProfile extends Record<string, unknown> {
  id?: string | number;
  name?: string;
}

interface UseEngineProfilesParams {
  projectId: string;
  selectedGlobalEnvironmentId?: string | null;
}

interface UseEngineProfilesReturn {
  // 状态
  engineProfiles: EngineProfile[];
  loadingProfiles: boolean;
  globalEnvironment: any;
  setGlobalEnvironment: React.Dispatch<React.SetStateAction<any>>;
  // 函数
  loadEngineProfiles: () => Promise<void>;
  handleGlobalEnvironmentChange: (environmentId: string | null) => void;
}

/**
 * useEngineProfiles Hook
 * 管理执行环境配置相关逻辑
 */
export function useEngineProfiles({
  projectId,
  selectedGlobalEnvironmentId,
}: UseEngineProfilesParams): UseEngineProfilesReturn {
  const [engineProfiles, setEngineProfiles] = useState<EngineProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [globalEnvironment, setGlobalEnvironment] = useState<any>(null);

  // 加载环境配置列表
  const loadEngineProfiles = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoadingProfiles(true);
      const profiles = await workflowService.getEngineProfileList(projectId);
      setEngineProfiles(profiles || []);
    } catch (error) {
      console.error('加载环境配置失败:', error);
      setEngineProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  }, [projectId]);

  // 组件加载时自动加载环境配置列表
  useEffect(() => {
    if (projectId) {
      loadEngineProfiles();
    }
  }, [projectId, loadEngineProfiles]);

  // 当环境列表加载完成后，如果已有选中的环境ID，设置globalEnvironment
  useEffect(() => {
    if (selectedGlobalEnvironmentId && engineProfiles.length > 0) {
      const env = engineProfiles.find((p: any) => p.id === selectedGlobalEnvironmentId || p.environmentId === selectedGlobalEnvironmentId);
      if (env) {
        setGlobalEnvironment(env);
      }
    }
  }, [selectedGlobalEnvironmentId, engineProfiles]);

  // 处理全局环境切换
  const handleGlobalEnvironmentChange = useCallback((environmentId: string | null) => {
    if (environmentId && engineProfiles.length > 0) {
      const env = engineProfiles.find((p: any) => p.id === environmentId || p.environmentId === environmentId);
      setGlobalEnvironment(env || null);
    } else {
      setGlobalEnvironment(null);
    }
  }, [engineProfiles]);

  return {
    engineProfiles,
    loadingProfiles,
    globalEnvironment,
    setGlobalEnvironment,
    loadEngineProfiles,
    handleGlobalEnvironmentChange,
  };
}
