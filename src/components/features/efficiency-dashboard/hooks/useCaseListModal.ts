/**
 * Case List Modal Hook
 * 管理用例列表弹窗的状态和逻辑
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useCallback, useEffect } from 'react';
import { getCaseListByMetric } from '@/services/case-management/service-case-metrics';
import { calculateTimeRange } from '../utils/timeRange';
import type {
  DimensionType,
  TimeRangeType,
  CustomDateRange,
} from '@/types/efficiency';

interface UseCaseListModalParams {
  dimension: DimensionType;
  selectedProject: string;
  selectedUser: string;
  timeRange: TimeRangeType;
  customDateRange: CustomDateRange;
}

interface UseCaseListModalReturn {
  // 状态
  showModal: boolean;
  selectedMetricKey: string | null;
  caseList: any[];
  loading: boolean;
  page: number;
  total: number;
  drawerWidth: number;
  pageInput: string;

  // 方法
  setShowModal: (show: boolean) => void;
  setSelectedMetricKey: (key: string | null) => void;
  setPage: (page: number) => void;
  setPageInput: (input: string) => void;
  setDrawerWidth: (width: number) => void;
  loadCaseList: (metricKey: string) => Promise<void>;
  handleMetricClick: (metricKey: string) => void;
  handlePageChange: (newPage: number) => void;
  handlePageJump: () => void;
}

/**
 * 判断指标是否为测试计划维度
 */
function isPlanMetric(metricKey: string): boolean {
  const planMetrics = ['firstPassRate'];
  return planMetrics.includes(metricKey);
}

/**
 * Case List Modal Hook
 */
export function useCaseListModal({
  dimension,
  selectedProject,
  selectedUser,
  timeRange,
  customDateRange,
}: UseCaseListModalParams): UseCaseListModalReturn {
  const [showModal, setShowModal] = useState(false);
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const [caseList, setCaseList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [drawerWidth, setDrawerWidth] = useState(50);
  const [pageInput, setPageInput] = useState('');

  /**
   * 加载用例列表（内部函数，接受 page 参数）
   */
  const loadCaseListInternal = useCallback(
    async (metricKey: string, pageNum: number) => {
      setLoading(true);
      try {
        const { startTime, endTime } = calculateTimeRange(timeRange, customDateRange);

        const isAllProjects = selectedProject === 'all' || selectedProject === 'ALL';
        const queryParams = {
          metricType: metricKey,
          projectId: isAllProjects ? undefined : selectedProject,
          dimension: dimension,
          dimensionValue:
            dimension === 'personal'
              ? selectedUser === 'all'
                ? 'all'
                : selectedUser
              : isAllProjects
              ? 'all'
              : selectedProject,
          pageNum: pageNum,
          pageSize: 20,
          startTime,
          endTime,
        };

        const response = await getCaseListByMetric(queryParams);
        setCaseList(response?.caseList || []);
        setTotal(response?.total || 0);
      } catch (err) {
        console.error('加载用例列表失败:', err);
        setCaseList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [dimension, selectedProject, selectedUser, timeRange, customDateRange]
  );

  /**
   * 加载用例列表（公开接口，使用当前 page）
   */
  const loadCaseList = useCallback(
    (metricKey: string) => {
      return loadCaseListInternal(metricKey, page);
    },
    [loadCaseListInternal, page]
  );

  /**
   * 处理指标卡片点击
   */
  const handleMetricClick = useCallback(
    (metricKey: string) => {
      if (isPlanMetric(metricKey)) {
        // 测试计划维度：不在这里处理，由 usePlanListModal 处理
        return;
      }

      // 用例维度：显示用例列表
      setSelectedMetricKey(metricKey);
      setPage(1);
      setDrawerWidth(50);
      setShowModal(true);
      // 加载第一页数据
      loadCaseListInternal(metricKey, 1);
    },
    [loadCaseListInternal]
  );

  /**
   * 处理分页变化
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    []
  );

  // 当 page 或 selectedMetricKey 变化时，重新加载数据
  useEffect(() => {
    if (selectedMetricKey && showModal) {
      loadCaseListInternal(selectedMetricKey, page);
    }
  }, [page, selectedMetricKey, showModal, loadCaseListInternal]);

  /**
   * 处理页码跳转
   */
  const handlePageJump = useCallback(() => {
    const totalPages = Math.ceil(total / 20);
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setPageInput('');
    }
  }, [pageInput, total, handlePageChange]);

  return {
    showModal,
    selectedMetricKey,
    caseList,
    loading,
    page,
    total,
    drawerWidth,
    pageInput,
    setShowModal,
    setSelectedMetricKey,
    setPage,
    setPageInput,
    setDrawerWidth,
    loadCaseList,
    handleMetricClick,
    handlePageChange,
    handlePageJump,
  };
}
