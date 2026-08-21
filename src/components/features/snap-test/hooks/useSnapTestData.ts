/**
 * useSnapTestData - 造数/活跃度等数据加载
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AEGIS_API_BASE_URL } from '@/config/routes';
import type {
  SnapTestMetrics, SnapTestApiRequest, SnapTestComparisonType, SnapTestDimensionType, UserOption,
  UserActivityApiResponse, CallCountItem, ComplexityDetailItem,
  UserActivitySeries, UserActivityTopUser, AegisEfficiencyOverviewResponse,
  AegisEfficiencyActivityResponse, UserFunctionActivityItem, PortActivityItem, OnlineUserDetailItem,
} from '@/types/snap-test';

const emptyMetrics: SnapTestMetrics = {
  dataGenerationEfficiencyTime: null, dataGenerationEfficiencyRatio: null, mqUsageCount: null,
  toolAdoptionRate: null, dataFactoryExecutionCount: null, automationEfficiency: null,
  leftShiftAutomationRate: null, dataCostReductionRate: null, userActivity: null,
  automationBugDiscoveryRate: null, automationCriticalBugRate: null, automationCaseWritingDuration: null,
};

export type { SnapTestDimensionType };

export function useSnapTestData(
  getDateRange: () => { startDate: string | null; endDate: string | null },
  dimension: SnapTestDimensionType,
  selectedProject: string,
  snapTestSelectedUsers: string[],
  comparisonType: SnapTestComparisonType,
  availableUsers: UserOption[]
) {
  const [metrics, setMetrics] = useState<SnapTestMetrics>(emptyMetrics);
  const [dataGenerationEfficiencyDetail, setDataGenerationEfficiencyDetail] = useState<Array<{ name: string; value: number; ratio: number }>>([]);
  const [dataGenerationEfficiencyCallCount, setDataGenerationEfficiencyCallCount] = useState<Array<{ related_id: string; biz_name: string; call_count: number }>>([]);
  const [toolAdoptionRateDetail, setToolAdoptionRateDetail] = useState<{ activeUserCount?: number; targetUserCount?: number } | null>(null);
  const [onlineUserCount, setOnlineUserCount] = useState<number | null>(null);
  const [onlineUserDetails, setOnlineUserDetails] = useState<OnlineUserDetailItem[]>([]);
  const [complexityDetail, setComplexityDetail] = useState<ComplexityDetailItem[]>([]);
  const [dataGenerationEfficiencyStats, setDataGenerationEfficiencyStats] = useState<{ total_estimated_time: number | null; total_save_execution_time: number | null }>({ total_estimated_time: null, total_save_execution_time: null });
  type OverviewData = NonNullable<AegisEfficiencyOverviewResponse['data']>;
  const [dataFactoryStats, setDataFactoryStats] = useState<OverviewData['dataFactoryStats'] | null>(null);
  const [mqStats, setMqStats] = useState<OverviewData['mqStats'] | null>(null);
  const [mockFactoryStats, setMockFactoryStats] = useState<OverviewData['mockFactoryStats'] | null>(null);
  const [testPlanStats, setTestPlanStats] = useState<OverviewData['testPlanStats'] | null>(null);
  const [automationStats, setAutomationStats] = useState<OverviewData['automationStats'] | null>(null);
  const [automationRunStats, setAutomationRunStats] = useState<OverviewData['automationRunStats'] | null>(null);
  const [functionalCaseExecutionStats, setFunctionalCaseExecutionStats] = useState<OverviewData['functionalCaseExecutionStats'] | null>(null);
  const [aiCaseStats, setAiCaseStats] = useState<OverviewData['aiCaseStats'] | null>(null);
  const [userActivityData, setUserActivityData] = useState<{ dates: string[]; series: UserActivitySeries[]; top_users?: UserActivityTopUser[]; total_activity?: number } | null>(null);
  const [userFunctionActivityData, setUserFunctionActivityData] = useState<UserFunctionActivityItem[]>([]);
  const [portActivityData, setPortActivityData] = useState<PortActivityItem[]>([]);
  const [snapTestLoading, setSnapTestLoading] = useState(false);
  const [userActivityLoading, setUserActivityLoading] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const t = localStorage.getItem('sessionId'); if (t) h['X-AUTH-TOKEN'] = t;
    const c = localStorage.getItem('csrfToken'); if (c) h['CSRF-TOKEN'] = c;
    return h;
  }, []);

  const buildParams = useCallback((): SnapTestApiRequest => {
    const { startDate, endDate } = getDateRange();
    const p: SnapTestApiRequest = {};
    p.comparisonType = comparisonType ?? 'MOM';
    if (startDate && endDate) {
      p.startDate = startDate;
      p.endDate = endDate;
    }
    if (dimension === 'personal' && snapTestSelectedUsers.length > 0) {
      p.personal = [...snapTestSelectedUsers];
      const userIds = snapTestSelectedUsers
        .map((email) => availableUsers.find((u) => u.value === email)?.id)
        .filter((id): id is string => id != null && id !== '');
      if (userIds.length > 0) p.userId = userIds;
    }
    if (dimension === 'project' && selectedProject !== 'all') {
      p.projectIds = [selectedProject];
    }
    const has = !!(p.startDate && p.endDate) || (p.personal?.length ?? 0) > 0 || (p.projectIds?.length ?? 0) > 0;
    return has ? p : { comparisonType: p.comparisonType };
  }, [getDateRange, dimension, selectedProject, snapTestSelectedUsers, comparisonType, availableUsers]);

  useEffect(() => {
    setSnapTestLoading(true);
    axios.post<AegisEfficiencyOverviewResponse>(`${AEGIS_API_BASE_URL}/metrics/efficiency/overview`, buildParams(), { headers: getAuthHeaders() })
      .then((r) => {
        const res = r.data;
        const ok = res?.code === 100200 || res?.code === 200;
        const d = res?.data;
        if (ok && d) {
          const eff = d.dataGenerationEfficiency;
          setDataGenerationEfficiencyStats({
            total_estimated_time: eff?.totalEstimatedTime ?? null,
            total_save_execution_time: eff?.totalSaveExecutionTime ?? null,
          });
          setDataFactoryStats(d.dataFactoryStats ?? null);
          setMqStats(d.mqStats ?? null);
          setMockFactoryStats(d.mockFactoryStats ?? null);
          setTestPlanStats(d.testPlanStats ?? null);
          setAutomationStats(d.automationStats ?? null);
          setAutomationRunStats(d.automationRunStats ?? null);
          setFunctionalCaseExecutionStats(d.functionalCaseExecutionStats ?? null);
          setAiCaseStats(d.aiCaseStats ?? null);
          const mqVal = d.mqStats?.usageCount ?? d.mqUsageCount ?? null;
          const dfVal = d.dataFactoryStats?.executionCount ?? d.dataFactoryExecutionCount ?? null;
          const runTotal = d.automationRunStats?.total ?? null;
          setMetrics((prev) => ({
            ...prev,
            dataGenerationEfficiencyTime: eff?.totalSaveTime ?? null,
            dataGenerationEfficiencyRatio: eff?.totalSaveRatio ?? null,
            mqUsageCount: mqVal,
            // 用户采纳度以 activity 为准，overview 有 toolAdoptionRate 时才覆盖，避免切换筛选时被清成 0%
            toolAdoptionRate: d.toolAdoptionRate != null ? (d.toolAdoptionRate.adoptionRate ?? prev.toolAdoptionRate ?? null) : prev.toolAdoptionRate ?? null,
            dataFactoryExecutionCount: dfVal,
            automationEfficiency: runTotal,
            leftShiftAutomationRate: null,
            dataCostReductionRate: null,
            automationBugDiscoveryRate: null,
            automationCriticalBugRate: null,
            automationCaseWritingDuration: null,
          }));
          if (d.toolAdoptionRate) setToolAdoptionRateDetail({ activeUserCount: d.toolAdoptionRate.activeUserCount, targetUserCount: d.toolAdoptionRate.targetUserCount });
          const sd = eff?.saveDetail;
          setDataGenerationEfficiencyDetail(sd ? Object.entries(sd).map(([name, v]) => ({ name, value: Number(v?.totalSaveTime) || 0, ratio: Number(v?.totalSaveRatio) || 0 })) : []);
          const cc = eff?.callCount;
          setDataGenerationEfficiencyCallCount(Array.isArray(cc) ? cc.map((i) => ({ related_id: i.relatedId ?? '', biz_name: i.bizName ?? '', call_count: Number(i.callCount) || 0 })).sort((a, b) => b.call_count - a.call_count) : []);
          const cd = eff?.complexityDetail;
          setComplexityDetail(Array.isArray(cd) ? cd.map((i) => ({
            biz_name: i.bizName ?? '',
            related_id: i.relatedId ?? '',
            scores: {
              base: i.scores?.base ?? 0,
              api: i.scores?.api ?? 0,
              db: i.scores?.db ?? 0,
              sql: i.scores?.sql ?? 0,
              logic: i.scores?.logic ?? 0,
              mq: i.scores?.mq ?? 0,
              risk: i.scores?.risk ?? 0,
              chain: i.scores?.chain ?? 0,
              functions: i.scores?.functions ?? 0,
            },
            total_cs: i.totalCs ?? 0,
            level: i.level ?? '',
          })) : []);
        } else {
          const reset = { dataGenerationEfficiencyTime: null, dataGenerationEfficiencyRatio: null, mqUsageCount: null, toolAdoptionRate: null, dataFactoryExecutionCount: null, automationEfficiency: null, leftShiftAutomationRate: null, dataCostReductionRate: null, automationBugDiscoveryRate: null, automationCriticalBugRate: null, automationCaseWritingDuration: null };
          setMetrics((p) => ({ ...p, ...reset }));
          setDataGenerationEfficiencyDetail([]);
          setDataGenerationEfficiencyCallCount([]);
          setToolAdoptionRateDetail(null);
          setComplexityDetail([]);
          setDataGenerationEfficiencyStats({ total_estimated_time: null, total_save_execution_time: null });
          setDataFactoryStats(null);
          setMqStats(null);
          setMockFactoryStats(null);
          setTestPlanStats(null);
          setAutomationStats(null);
          setAutomationRunStats(null);
        }
      })
      .catch(() => {
        const reset = { dataGenerationEfficiencyTime: null, dataGenerationEfficiencyRatio: null, mqUsageCount: null, toolAdoptionRate: null, dataFactoryExecutionCount: null, automationEfficiency: null, leftShiftAutomationRate: null, dataCostReductionRate: null, automationBugDiscoveryRate: null, automationCriticalBugRate: null, automationCaseWritingDuration: null };
        setMetrics((p) => ({ ...p, ...reset }));
        setDataGenerationEfficiencyDetail([]);
        setDataGenerationEfficiencyCallCount([]);
        setToolAdoptionRateDetail(null);
        setComplexityDetail([]);
        setDataGenerationEfficiencyStats({ total_estimated_time: null, total_save_execution_time: null });
        setDataFactoryStats(null);
        setMqStats(null);
        setMockFactoryStats(null);
        setTestPlanStats(null);
        setAutomationStats(null);
        setAutomationRunStats(null);
      })
      .finally(() => setSnapTestLoading(false));
  }, [buildParams, getAuthHeaders]);

  useEffect(() => {
    setUserActivityLoading(true);
    axios.post<UserActivityApiResponse | AegisEfficiencyActivityResponse>(`${AEGIS_API_BASE_URL}/metrics/efficiency/activity`, buildParams(), { headers: getAuthHeaders() })
      .then((r) => {
        const res = r.data as AegisEfficiencyActivityResponse | UserActivityApiResponse;
        const ok = res?.code === 100200 || res?.code === 200;
        const d = res?.data as AegisEfficiencyActivityResponse['data'] | UserActivityApiResponse['data'] | undefined;
        if (!ok || !d) {
          setUserActivityData(null);
          setUserFunctionActivityData([]);
          setPortActivityData([]);
          setOnlineUserCount(null);
          setOnlineUserDetails([]);
          setMetrics((p) => ({ ...p, userActivity: null }));
          return;
        }
        const totalActivity = (d as AegisEfficiencyActivityResponse['data'])?.totalActivity ?? (d as UserActivityApiResponse['data'])?.total_activity ?? null;
        if (totalActivity != null) setMetrics((p) => ({ ...p, userActivity: totalActivity }));

        const aegisData = d as AegisEfficiencyActivityResponse['data'];
        // activity 返回的 toolAdoptionRate 优先展示（与 series 无关，有则更新）
        if (aegisData?.toolAdoptionRate) {
          setToolAdoptionRateDetail({ activeUserCount: aegisData.toolAdoptionRate.activeUserCount, targetUserCount: aegisData.toolAdoptionRate.targetUserCount });
          setMetrics((p) => ({ ...p, toolAdoptionRate: aegisData.toolAdoptionRate?.adoptionRate ?? p.toolAdoptionRate ?? null }));
        }
        if (aegisData?.onlineUserStats != null) {
          setOnlineUserCount(aegisData.onlineUserStats.count ?? null);
          setOnlineUserDetails(aegisData.onlineUserStats.details ?? []);
        }
        if (aegisData?.series?.length && 'dimension' in (aegisData.series[0] ?? {})) {
          setUserActivityData({ dates: [], series: [], total_activity: totalActivity ?? undefined });
          const moduleTypeSeries = aegisData.series.find((s: { dimension?: string }) => s.dimension === 'moduleType');
          const bizTypeSeries = aegisData.series.find((s: { dimension?: string }) => s.dimension === 'bizType');

          /** breakdown 现已为直接总数据 Record<string, number>，兼容旧格式 number[] */
          const toNumber = (v: number | number[] | undefined): number =>
            typeof v === 'number' ? v : Array.isArray(v) ? v.reduce((a, b) => a + b, 0) : 0;

          const moduleKeyToCol: Record<string, keyof Omit<UserFunctionActivityItem, 'name' | 'rank'>> = {
            MOCK: 'mockFactory', Automation: 'automation', 'Case Execution': 'caseExecution',
            SCRIPT: 'dataFactory', SQL: 'dbTool', HTTP: 'httpTest',
            DUBBO: 'dubboTest', TOOL: 'tool', ROCKETMQ: 'rocketmq',
          };
          if (moduleTypeSeries?.items) {
            const items = moduleTypeSeries.items as Array<{ user: string; totalActivity: number; breakdown: Record<string, number | number[]> }>;
            const list: UserFunctionActivityItem[] = items.map((item) => {
              const row: UserFunctionActivityItem = { name: item.user, rank: 0, mockFactory: 0, automation: 0, caseExecution: 0, dataFactory: 0, dbTool: 0, httpTest: 0, dubboTest: 0, tool: 0, rocketmq: 0 };
              Object.entries(item.breakdown || {}).forEach(([key, val]) => {
                const sum = toNumber(val as number | number[]);
                const col = moduleKeyToCol[key];
                if (col && col in row && typeof (row as any)[col] === 'number') (row as any)[col] = ((row as any)[col] as number) + sum;
              });
              return row;
            });
            const total = (u: UserFunctionActivityItem) => u.mockFactory + u.automation + u.caseExecution + u.dataFactory + u.dbTool + u.httpTest + u.dubboTest + u.tool + u.rocketmq;
            list.sort((a, b) => total(b) - total(a));
            list.forEach((u, i) => { u.rank = i < 3 ? i + 1 : 0; });
            setUserFunctionActivityData(list);
          } else {
            setUserFunctionActivityData([]);
          }

          if (bizTypeSeries?.items) {
            const items = bizTypeSeries.items as Array<{ user: string; totalActivity: number; breakdown: Record<string, number | number[]> }>;
            const list: PortActivityItem[] = items.map((item) => ({
              name: item.user,
              rank: 0,
              ports: {
                web: { total: toNumber(item.breakdown?.Web as number | number[]) },
                plugin: { total: toNumber(item.breakdown?.Plugin as number | number[]) },
                client: { total: toNumber(item.breakdown?.Electron as number | number[]) },
              },
            }));
            list.sort((a, b) => {
              const ta = a.ports.web.total + a.ports.plugin.total + a.ports.client.total;
              const tb = b.ports.web.total + b.ports.plugin.total + b.ports.client.total;
              return tb - ta;
            });
            list.forEach((u, i) => { u.rank = i < 3 ? i + 1 : 0; });
            setPortActivityData(list);
          } else {
            setPortActivityData([]);
          }
        } else {
          setUserActivityData(d as UserActivityApiResponse['data']);
          setUserFunctionActivityData([]);
          setPortActivityData([]);
        }
      })
      .catch(() => {
        setUserActivityData(null);
        setUserFunctionActivityData([]);
        setPortActivityData([]);
        setOnlineUserCount(null);
        setOnlineUserDetails([]);
        setMetrics((p) => ({ ...p, userActivity: null }));
      })
      .finally(() => setUserActivityLoading(false));
  }, [buildParams, getAuthHeaders]);

  return {
    metrics, setMetrics, dataGenerationEfficiencyDetail, dataGenerationEfficiencyCallCount,
    toolAdoptionRateDetail, onlineUserCount, onlineUserDetails, complexityDetail, dataGenerationEfficiencyStats,
    dataFactoryStats, mqStats, mockFactoryStats,
    testPlanStats, automationStats, automationRunStats, functionalCaseExecutionStats,
    aiCaseStats,
    userActivityData, userFunctionActivityData, portActivityData,
    snapTestLoading, userActivityLoading,
  };
}
