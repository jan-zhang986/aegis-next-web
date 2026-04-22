import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { environmentService, type Environment } from '@/services/environment';
import { projectManagementService } from '@/services/project-management';
import { getEnvCodeColor } from '../constants';

export function useEnvironmentListData(projectIdProp?: string) {
  const [searchParams] = useSearchParams();
  const projectId = projectIdProp || searchParams.get('projectId') || localStorage.getItem('currentProjectId');

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!projectId) {
      toast.error('项目ID不存在，请先选择项目');
    } else {
      projectManagementService.getProjectInfo(projectId).then((p) => {
        if (p?.name) setProjectName(p.name);
      }).catch(() => setProjectName(''));
    }
  }, [projectId]);

  const loadEnvironments = useCallback(async (formProjectId?: string) => {
    const pid = projectId || formProjectId;
    if (!pid) {
      toast.error('项目ID不存在，无法加载环境列表');
      return;
    }
    try {
      setLoading(true);
      const res = await environmentService.getEnvironmentList({
        projectId: pid,
        current: currentPage,
        pageSize,
      });
      if (res?.records) {
        setEnvironments(res.records);
        setTotal(res.total ?? res.records.length);
      } else if (Array.isArray(res)) {
        setEnvironments(res);
        setTotal(res.length);
      } else {
        setEnvironments([]);
        setTotal(0);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || '加载环境列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPage, pageSize]);

  useEffect(() => {
    loadEnvironments();
  }, [currentPage, projectId, loadEnvironments]);

  const filteredEnvironments = environments.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.envCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    projectId,
    projectName,
    environments,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    pageSize,
    total,
    setCurrentPage,
    filteredEnvironments,
    loadEnvironments,
    getEnvCodeColor,
  };
}
