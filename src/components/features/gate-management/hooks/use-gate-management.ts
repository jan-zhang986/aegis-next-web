/**
 * 门禁管理 - 列表、筛选、分页与补全弹窗状态
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { gateManagementService } from '@/services/gate-management';
import { requirementQualityService } from '@/services/requirement-quality';
import { projectService } from '@/services/project';
import { http } from '@/utils/request';
import type {
  PipelineRecordListItem,
  PipelineRecordListRequest,
  PipelineRecordUpdateRequest,
  PipelineRecordCreateRequest,
} from '@/services/gate-management';
import { PAGE_SIZE } from '../constants/filter-options';

export interface GateManagementFilters {
  deployResult: string;
  projectId: string;
  repoName: string;
}

export interface UseGateManagementResult {
  list: PipelineRecordListItem[];
  total: number;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  loading: boolean;
  filters: GateManagementFilters;
  setDeployResult: (v: string) => void;
  setProjectId: (v: string) => void;
  setRepoName: (v: string) => void;
  resetFilters: () => void;
  refetch: () => void;
  handleSearch: () => void;
  projectOptions: { id: string; name: string }[];
  requirementOptions: { id: string; name: string }[];
  userOptions: { id: string; name: string }[];
  editRow: PipelineRecordListItem | null;
  editForm: PipelineRecordUpdateRequest | null;
  openEdit: (row: PipelineRecordListItem) => void;
  closeEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  saving: boolean;
  storyPopoverOpen: boolean;
  setStoryPopoverOpen: (v: boolean) => void;
  storyFuzzySearch: string;
  setStoryFuzzySearch: (v: string) => void;
  setEditForm: React.Dispatch<React.SetStateAction<PipelineRecordUpdateRequest | null>>;
  filteredRequirements: { id: string; name: string }[];
  storySearchLoading: boolean;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  handleCreate: (form: PipelineRecordCreateRequest) => Promise<void>;
  creating: boolean;
}

export function useGateManagement(): UseGateManagementResult {
  const [list, setList] = useState<PipelineRecordListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);
  const [requirementOptions, setRequirementOptions] = useState<{ id: string; name: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);

  const [deployResult, setDeployResult] = useState('');
  const [projectId, setProjectId] = useState('');
  const [repoName, setRepoName] = useState('');

  const [editRow, setEditRow] = useState<PipelineRecordListItem | null>(null);
  const [editForm, setEditForm] = useState<PipelineRecordUpdateRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [storyPopoverOpen, setStoryPopoverOpen] = useState(false);
  const [storyFuzzySearch, setStoryFuzzySearch] = useState('');
  const [storySearchResults, setStorySearchResults] = useState<{ id: string; name: string }[]>([]);
  const [storySearchLoading, setStorySearchLoading] = useState(false);
  const storySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const request: PipelineRecordListRequest = {
        current: page,
        pageSize: PAGE_SIZE,
        projectId: projectId || undefined,
        repoName: repoName.trim() || undefined,
        deployResult: deployResult || undefined,
      };
      const res = await gateManagementService.list(request);
      setList((res.list as PipelineRecordListItem[]) || []);
      setTotal(res.total ?? 0);
    } catch (e) {
      console.error('门禁管理列表加载失败', e);
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, projectId, repoName, deployResult]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 需求选项来自需求质量 filter-options；打开「手动创建」弹窗时重新拉取，避免刚关联测试计划后列表过期
  useEffect(() => {
    requirementQualityService
      .filterOptions()
      .then((opts) => {
        setRequirementOptions(opts.requirementOptions || []);
      })
      .catch(() => {
        setRequirementOptions([]);
      });
  }, []);

  useEffect(() => {
    if (createOpen) {
      requirementQualityService
        .filterOptions()
        .then((opts) => {
          setRequirementOptions(opts.requirementOptions || []);
        })
        .catch(() => {
          setRequirementOptions([]);
        });
    }
  }, [createOpen]);

  // 项目列表取自系统项目接口（当前组织下全部项目），与需求质量一致，避免缺失项目
  useEffect(() => {
    const orgId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentOrgId') : null;
    if (!orgId) {
      setProjectOptions([]);
      return;
    }
    projectService
      .getProjectListByOrg(orgId)
      .then((list) => {
        const options = Array.isArray(list) ? list.map((p) => ({ id: p.id, name: p.name ?? p.id })) : [];
        setProjectOptions(options);
      })
      .catch(() => setProjectOptions([]));
  }, []);

  useEffect(() => {
    const loadUserList = async () => {
      try {
        const response = await http.get('/system/user/list/public');
        let userList: { id: string; name: string }[] = [];
        if (Array.isArray(response) && response.length > 0) {
          userList = response.map((u: { id?: string; name?: string; email?: string }) => ({
            id: u.id ?? '',
            name: (u.name || u.email || u.id) ?? '',
          }));
        } else if (response && typeof response === 'object' && 'code' in response) {
          const res = response as { code?: number; data?: { id?: string; name?: string; email?: string }[] };
          if (res.code === 100200 && Array.isArray(res.data)) {
            userList = res.data.map((u) => ({
              id: u.id ?? '',
              name: (u.name || u.email || u.id) ?? '',
            }));
          }
        }
        setUserOptions(userList);
      } catch (error) {
        console.error('加载用户列表失败:', error);
        setUserOptions([]);
      }
    };
    loadUserList();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 编辑弹窗：输入关键词时从完整需求库做服务端模糊搜索
  useEffect(() => {
    const kw = storyFuzzySearch.trim();
    if (!kw) {
      if (storySearchDebounceRef.current) {
        clearTimeout(storySearchDebounceRef.current);
        storySearchDebounceRef.current = null;
      }
      setStorySearchResults([]);
      return;
    }
    if (storySearchDebounceRef.current) {
      clearTimeout(storySearchDebounceRef.current);
      storySearchDebounceRef.current = null;
    }
    storySearchDebounceRef.current = setTimeout(() => {
      storySearchDebounceRef.current = null;
      setStorySearchLoading(true);
      requirementQualityService
        .storySearch(kw)
        .then((list) => setStorySearchResults(Array.isArray(list) ? list : []))
        .catch(() => setStorySearchResults([]))
        .finally(() => setStorySearchLoading(false));
    }, 300);
    return () => {
      if (storySearchDebounceRef.current) clearTimeout(storySearchDebounceRef.current);
    };
  }, [storyFuzzySearch]);

  const filteredRequirements = useMemo(() => {
    const kw = storyFuzzySearch.trim();
    if (kw) return storySearchResults;
    return requirementOptions;
  }, [requirementOptions, storyFuzzySearch, storySearchResults]);

  const handleSearch = useCallback(() => {
    setPage(1);
    fetchList();
  }, [fetchList]);

  const resetFilters = useCallback(() => {
    setDeployResult('');
    setProjectId('');
    setRepoName('');
    setPage(1);
  }, []);

  const openEdit = useCallback((row: PipelineRecordListItem) => {
    setEditRow(row);
    setEditForm({
      id: row.id,
      storyId: row.storyId ?? '',
      storyName: row.storyName ?? undefined,
      projectId: row.projectId ?? '',
      projectName: row.projectName ?? undefined,
      env: row.env ?? '',
      deployResult: row.deployResult === 'PENDING' ? '' : row.deployResult,
      isRollback: row.isRollback ?? 0,
      isHotfix: row.isHotfix ?? 0,
      remark: row.remark ?? '',
      frontend: row.frontend ?? '',
      backend: row.backend ?? '',
      pipelineUrl: row.pipelineUrl ?? '',
    });
    setStoryFuzzySearch('');
    setStorySearchResults([]);
    setStoryPopoverOpen(false);
    requirementQualityService
      .filterOptions()
      .then((opts) => setRequirementOptions(opts.requirementOptions || []))
      .catch(() => setRequirementOptions([]));
  }, []);

  const closeEdit = useCallback(() => {
    setEditRow(null);
    setEditForm(null);
    setStoryPopoverOpen(false);
    setStoryFuzzySearch('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      await gateManagementService.update({
        id: editForm.id,
        storyId: editForm.storyId ?? undefined,
        projectId: editForm.projectId ?? undefined,
        env: editForm.env ?? undefined,
        deployResult: editForm.deployResult || undefined,
        isRollback: editForm.isRollback,
        isHotfix: editForm.isHotfix,
        remark: editForm.remark ?? undefined,
        frontend: editForm.frontend ?? undefined,
        backend: editForm.backend ?? undefined,
        pipelineUrl: editForm.pipelineUrl?.trim() || undefined,
      });
      closeEdit();
      fetchList();
    } catch (e) {
      console.error('补全保存失败', e);
    } finally {
      setSaving(false);
    }
  }, [editForm, closeEdit, fetchList]);

  const handleCreate = useCallback(async (form: PipelineRecordCreateRequest) => {
    setCreating(true);
    try {
      await gateManagementService.create({
        pipelineId: form.pipelineId.trim(),
        pipelineName: form.pipelineName?.trim() || undefined,
        repoName: form.repoName.trim(),
        endpointType: form.endpointType,
        deployTime: form.deployTime,
        deployer: form.deployer?.trim() || undefined,
        deployResult: form.deployResult,
        locAdd: form.locAdd ?? 0,
        locDelete: form.locDelete ?? 0,
        storyId: form.storyId?.trim() || undefined,
        storyName: form.storyName?.trim() || undefined,
        projectId: form.projectId?.trim() || undefined,
        projectName: form.projectName?.trim() || undefined,
        env: form.env?.trim() || undefined,
        isRollback: form.isRollback,
        isHotfix: form.isHotfix,
        remark: form.remark?.trim() || undefined,
        frontend: form.frontend?.trim() || undefined,
        backend: form.backend?.trim() || undefined,
        pipelineUrl: form.pipelineUrl?.trim() ?? '',
      });
      setCreateOpen(false);
      fetchList();
    } catch (e) {
      console.error('手动创建流水线失败', e);
      throw e;
    } finally {
      setCreating(false);
    }
  }, [fetchList]);

  return {
    list,
    total,
    page,
    setPage,
    totalPages,
    loading,
    filters: { deployResult, projectId, repoName },
    setDeployResult,
    setProjectId,
    setRepoName,
    resetFilters,
    refetch: fetchList,
    handleSearch,
    projectOptions,
    requirementOptions,
    userOptions,
    editRow,
    editForm,
    openEdit,
    closeEdit,
    handleSaveEdit,
    saving,
    storyPopoverOpen,
    setStoryPopoverOpen,
    storyFuzzySearch,
    setStoryFuzzySearch,
    setEditForm,
    filteredRequirements,
    storySearchLoading,
    createOpen,
    setCreateOpen,
    handleCreate,
    creating,
  };
}
