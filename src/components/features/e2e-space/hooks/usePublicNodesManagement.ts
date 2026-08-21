/**
 * usePublicNodesManagement Hook
 * 公共节点管理页：列表分页、搜索筛选、编辑、删除
 */

import { useState, useCallback, useEffect } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflow';

/** 公共节点列表项（与后端 WorkflowPublicNodeDTO 对齐：createTime/updateTime 为毫秒时间戳） */
export interface PublicNodeItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  config?: Record<string, unknown>;
  createTime?: number | string;
  updateTime?: number | string;
}

const DEFAULT_PAGE_SIZE = 20;

/** 分类筛选选项（与 workflow-designer 分类一致），value 为空表示全部分类 */
export const PUBLIC_NODE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: 'api', label: 'API 请求' },
  { value: 'data', label: '数据操作' },
  { value: 'logic', label: '逻辑控制' },
  { value: 'script', label: '脚本执行' },
  { value: 'other', label: '其他节点' },
];

interface UsePublicNodesManagementParams {
  /** 项目 ID，为空时从 localStorage 读取（用于单项目回退与编辑/删除） */
  projectId?: string | null;
  /** 选中的项目 ID 列表（多选筛选项，优先于 projectId 用于列表查询） */
  selectedProjectIds?: string[];
}

interface UsePublicNodesManagementReturn {
  loading: boolean;
  list: PublicNodeItem[];
  total: number;
  current: number;
  pageSize: number;
  keyword: string;
  category: string;
  setKeyword: (v: string) => void;
  setCategory: (v: string) => void;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  loadList: () => Promise<void>;
  editingItem: PublicNodeItem | null;
  isEditDialogOpen: boolean;
  openEdit: (item: PublicNodeItem) => void;
  closeEdit: () => void;
  editName: string;
  editDescription: string;
  setEditName: (v: string) => void;
  setEditDescription: (v: string) => void;
  saveEdit: () => Promise<void>;
  deleteTargetId: string | null;
  isDeleteDialogOpen: boolean;
  openDelete: (id: string) => void;
  closeDelete: () => void;
  confirmDelete: () => Promise<void>;
  detailItem: PublicNodeItem | null;
  isDetailOpen: boolean;
  openDetail: (item: PublicNodeItem) => void;
  closeDetail: () => void;
}

export function usePublicNodesManagement(
  params: UsePublicNodesManagementParams = {}
): UsePublicNodesManagementReturn {
  const projectId = params.projectId ?? localStorage.getItem('currentProjectId');
  const selectedProjectIds = params.selectedProjectIds ?? (projectId ? [projectId] : []);

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<PublicNodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  const [editingItem, setEditingItem] = useState<PublicNodeItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [detailItem, setDetailItem] = useState<PublicNodeItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadList = useCallback(async () => {
    const hasProjectIds = selectedProjectIds.length > 0;
    if (!hasProjectIds && !projectId) {
      setList([]);
      setTotal(0);
      return;
    }
    try {
      setLoading(true);
      const res = await workflowService.getPublicNodePage({
        ...(hasProjectIds ? { projectIds: selectedProjectIds } : { projectId: projectId! }),
        current,
        pageSize,
        keyword: keyword.trim() || undefined,
        category: category === 'all' ? undefined : category || undefined,
      });
      const data = res?.data ?? res;
      const records = data?.records ?? data?.list ?? data ?? [];
      const totalCount = typeof data?.total === 'number' ? data.total : (Array.isArray(records) ? records.length : 0);
      setList(Array.isArray(records) ? records : []);
      setTotal(totalCount);
    } catch (e) {
      console.error('加载公共节点列表失败:', e);
      toast.error('加载公共节点列表失败');
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedProjectIds, current, pageSize, keyword, category]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openEdit = useCallback((item: PublicNodeItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setIsEditDialogOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
    setEditName('');
    setEditDescription('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingItem || !projectId) return;
    const name = editName.trim();
    if (!name) {
      toast.error('请输入节点名称');
      return;
    }
    try {
      await workflowService.savePublicNode({
        id: editingItem.id,
        projectId,
        name,
        description: editDescription.trim() || undefined,
        type: editingItem.type,
        category: editingItem.category ?? 'other',
        config: editingItem.config ?? {},
      });
      toast.success('保存成功');
      closeEdit();
      loadList();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (e as { message?: string })?.message
        ?? '保存失败';
      toast.error(msg);
    }
  }, [editingItem, projectId, editName, editDescription, closeEdit, loadList]);

  const openDelete = useCallback((id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeleteTargetId(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId || !projectId) return;
    try {
      await workflowService.deletePublicNode(deleteTargetId, projectId);
      toast.success('已删除');
      closeDelete();
      loadList();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (e as { message?: string })?.message
        ?? '删除失败';
      toast.error(msg);
    }
  }, [deleteTargetId, projectId, closeDelete, loadList]);

  const openDetail = useCallback((item: PublicNodeItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setDetailItem(null);
  }, []);

  return {
    loading,
    list,
    total,
    current,
    pageSize,
    keyword,
    category,
    setKeyword,
    setCategory,
    setCurrent,
    loadList,
    editingItem,
    isEditDialogOpen,
    openEdit,
    closeEdit,
    editName,
    editDescription,
    setEditName,
    setEditDescription,
    saveEdit,
    deleteTargetId,
    isDeleteDialogOpen,
    openDelete,
    closeDelete,
    confirmDelete,
    detailItem,
    isDetailOpen,
    openDetail,
    closeDetail,
  };
}
