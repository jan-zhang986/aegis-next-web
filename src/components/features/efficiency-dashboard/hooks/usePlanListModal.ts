/**
 * Plan List Modal Hook
 * 管理测试计划列表弹窗的状态和逻辑
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useCallback, useEffect } from 'react';
import { testPlanManagementService } from '@/services';

interface UsePlanListModalParams {
  selectedProject: string;
}

interface UsePlanListModalReturn {
  // 状态
  showModal: boolean;
  selectedPlanMetricKey: string | null;
  planList: any[];
  loading: boolean;
  page: number;
  total: number;
  expandedPlans: Set<string>;
  planCaseMap: Map<string, any[]>;
  loadingCases: Set<string>;
  drawerWidth: number;

  // 方法
  setShowModal: (show: boolean) => void;
  setSelectedPlanMetricKey: (key: string | null) => void;
  setPage: (page: number) => void;
  setDrawerWidth: (width: number) => void;
  loadPlanList: (metricKey: string) => Promise<void>;
  loadPlanCases: (planId: string) => Promise<void>;
  togglePlanExpand: (planId: string) => void;
  handlePlanPageChange: (newPage: number) => void;
  handlePlanMetricClick: (metricKey: string) => void;
}

/**
 * Plan List Modal Hook
 */
export function usePlanListModal({
  selectedProject,
}: UsePlanListModalParams): UsePlanListModalReturn {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanMetricKey, setSelectedPlanMetricKey] = useState<string | null>(null);
  const [planList, setPlanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [planCaseMap, setPlanCaseMap] = useState<Map<string, any[]>>(new Map());
  const [loadingCases, setLoadingCases] = useState<Set<string>>(new Set());
  const [drawerWidth, setDrawerWidth] = useState(50);

  /**
   * 加载测试计划列表（内部函数，接受 page 参数）
   */
  const loadPlanListInternal = useCallback(
    async (metricKey: string, pageNum: number) => {
      setLoading(true);
      try {
        const projectId = (selectedProject === 'all' || selectedProject === 'ALL') ? null : selectedProject;

        const queryParams: any = {
          projectId: projectId,
          page: pageNum,
          pageSize: 20,
        };

        const response: any = await testPlanManagementService.getTestPlanList(queryParams);
        const responseData = response?.list || response?.data || response || [];
        setPlanList(Array.isArray(responseData) ? responseData : []);
        setTotal(response?.total || responseData.length || 0);
      } catch (err) {
        console.error('加载测试计划列表失败:', err);
        setPlanList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [selectedProject]
  );

  /**
   * 加载测试计划列表（公开接口，使用当前 page）
   */
  const loadPlanList = useCallback(
    (metricKey: string) => {
      return loadPlanListInternal(metricKey, page);
    },
    [loadPlanListInternal, page]
  );

  /**
   * 加载测试计划下的用例列表
   */
  const loadPlanCases = useCallback(async (planId: string) => {
    if (planCaseMap.has(planId)) {
      return;
    }

    setLoadingCases((prev) => new Set(prev).add(planId));
    try {
      const response: any = await testPlanManagementService.getPlanDetailFeatureCaseList({
        testPlanId: planId,
        page: 1,
        pageSize: 100,
      });

      const caseList = response?.list || response?.data || [];
      setPlanCaseMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(planId, caseList);
        return newMap;
      });
    } catch (err) {
      console.error('加载测试计划用例列表失败:', err);
      setPlanCaseMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(planId, []);
        return newMap;
      });
    } finally {
      setLoadingCases((prev) => {
        const newSet = new Set(prev);
        newSet.delete(planId);
        return newSet;
      });
    }
  }, [planCaseMap]);

  /**
   * 切换测试计划展开/折叠
   */
  const togglePlanExpand = useCallback(
    (planId: string) => {
      setExpandedPlans((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(planId)) {
          newSet.delete(planId);
        } else {
          newSet.add(planId);
          loadPlanCases(planId);
        }
        return newSet;
      });
    },
    [loadPlanCases]
  );

  /**
   * 处理测试计划列表分页变化
   */
  const handlePlanPageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    []
  );

  /**
   * 处理测试计划指标卡片点击
   */
  const handlePlanMetricClick = useCallback(
    (metricKey: string) => {
      setSelectedPlanMetricKey(metricKey);
      setPage(1);
      setDrawerWidth(50);
      setShowModal(true);
      // 加载第一页数据
      loadPlanListInternal(metricKey, 1);
    },
    [loadPlanListInternal]
  );

  // 当 page 或 selectedPlanMetricKey 变化时，重新加载数据
  useEffect(() => {
    if (selectedPlanMetricKey && showModal) {
      loadPlanListInternal(selectedPlanMetricKey, page);
    }
  }, [page, selectedPlanMetricKey, showModal, loadPlanListInternal]);

  return {
    showModal,
    selectedPlanMetricKey,
    planList,
    loading,
    page,
    total,
    expandedPlans,
    planCaseMap,
    loadingCases,
    drawerWidth,
    setShowModal,
    setSelectedPlanMetricKey,
    setPage,
    setDrawerWidth,
    loadPlanList,
    loadPlanCases,
    togglePlanExpand,
    handlePlanPageChange,
    handlePlanMetricClick,
  };
}
