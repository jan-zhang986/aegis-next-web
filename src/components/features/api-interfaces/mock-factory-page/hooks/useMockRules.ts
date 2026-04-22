import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { mockFactoryService, type MockRule } from '@/services/mock-factory';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_DELAY } from '../constants';

export function useMockRules(selectedSceneCode: string) {
  const [mockRules, setMockRules] = useState<MockRule[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadRules = useCallback(async (serviceCode?: string) => {
    try {
      setLoading(true);
      const response = await mockFactoryService.getMockList({
        sceneCode: selectedSceneCode || undefined,
        serviceCode: serviceCode || undefined,
        page: currentPage,
        size: pageSize,
      });
      const dataList = response.data || [];
      const totalCount = response.total || 0;
      setMockRules(dataList);
      setTotal(totalCount);
    } catch (error: any) {
      console.error('[MockFactoryPage] 加载规则列表失败:', error);
      toast.error('加载规则列表失败: ' + (error.message || '未知错误'));
      setMockRules([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedSceneCode, currentPage, pageSize]);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      loadRules();
    }
  }, [selectedSceneCode, currentPage, loadRules, searchKeyword]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!selectedSceneCode) {
      return;
    }

    if (!searchKeyword.trim()) {
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      loadRules(searchKeyword.trim() || undefined);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchKeyword, selectedSceneCode, loadRules]);

  const handleToggleStatus = useCallback(async (id: number, currentStatus: number, onUpdate?: (rule: MockRule) => void) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await mockFactoryService.updateMockStatus(id, newStatus);
      toast.success(newStatus === 1 ? '已启用' : '已停用');
      loadRules(searchKeyword.trim() || undefined);
      if (onUpdate) {
        const updatedRule = mockRules.find(r => r.id === id);
        if (updatedRule) {
          onUpdate({ ...updatedRule, status: newStatus });
        }
      }
    } catch (error: any) {
      toast.error('状态更新失败: ' + (error.message || '未知错误'));
    }
  }, [mockRules, searchKeyword, loadRules]);

  const handleDeleteRule = useCallback(async (id: number) => {
    if (!id) return;
    try {
      await mockFactoryService.delMock(id);
      toast.success('删除成功');
      loadRules(searchKeyword.trim() || undefined);
    } catch (error: any) {
      toast.error('删除失败: ' + (error.message || '未知错误'));
    }
  }, [searchKeyword, loadRules]);

  return {
    mockRules,
    setMockRules,
    total,
    currentPage,
    setCurrentPage,
    pageSize,
    searchKeyword,
    setSearchKeyword,
    loading,
    loadRules,
    handleToggleStatus,
    handleDeleteRule,
  };
}
