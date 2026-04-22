/**
 * 需求质量视图 - 列表与概览数据（对接后端 list + overview + filter-options）
 */

import { useState, useCallback, useEffect } from 'react';
import { requirementQualityService } from '@/services/requirement-quality';
import type { RequirementQualityListItemDTO } from '@/services/requirement-quality';
import type { RequirementQualityFilterOptionsDTO } from '@/services/requirement-quality/types';
import type { RequirementItem } from '../constants/requirement-list';
import { projectService } from '@/services/project';

const PAGE_SIZE = 20;

/** 执行周期：仅日期范围，如「2025/12/11 — 2025/12/22」 */
function formatPeriod(start?: number | null, end?: number | null): string {
  if (start == null && end == null) return '-';
  const s = start != null ? new Date(start).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '';
  const e = end != null ? new Date(end).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '';
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} — `;
  if (e) return `— ${e}`;
  return '-';
}

const STATUS_DISPLAY: Record<string, string> = {
  PREPARED: '未开始',
  UNDERWAY: '进行中',
  COMPLETED: '已完成',
  NOT_ARCHIVED: '未归档',
  ARCHIVED: '已归档',
};

/** 后端状态值 -> 展示文案 */
function formatStatusDisplay(status: string): string {
  if (!status) return '-';
  return STATUS_DISPLAY[status] ?? status;
}

/** 后端列表行 -> 前端 RequirementItem（null/undefined 用默认值，避免前端 undefined 报错） */
function dtoToRequirementItem(dto: RequirementQualityListItemDTO): RequirementItem {
  const total = dto.caseTotalCount ?? 0;
  const passed = total > 0 ? Math.round(((dto.passRate ?? 0) / 100) * total) : 0;
  const periodStr = formatPeriod(dto.executionPeriodStart, dto.executionPeriodEnd);
  return {
    id: dto.storyId ?? '',
    name: dto.storyName ?? '-',
    owner: dto.owner ?? '-',
    status: formatStatusDisplay(dto.status ?? ''),
    period: periodStr,
    periodRange: periodStr === '-' ? undefined : periodStr,
    totalCases: total,
    executedCases: dto.caseExecutedCount ?? 0,
    passedCases: passed,
    executionRate: dto.executionRate ?? 0,
    passRate: dto.passRate ?? 0,
    firstPassRate: dto.firstPassRate ?? dto.passRate ?? 0,
    defectCount: dto.defectCount ?? 0,
    reopenRate: dto.reopenRate ?? null,
    reopenCount: 0,
    codeCoverageRate: dto.codeCoverage != null ? Number(dto.codeCoverage) : 0,
    totalDefectRatePer1k: dto.totalDefectRatePer1k ?? null,
    newCases: 0,
    reusedCases: 0,
  };
}

export interface RequirementQualityFilters {
  /** 项目ID，单选时使用（兼容） */
  projectId: string;
  /** 项目ID列表，多选时使用；空或未选=全部项目 */
  projectIds: string[];
  requirementListValue: string;
  status: string;
  storyIds?: string[];
  /** 执行周期：开始日期时间戳(毫秒)，仅日期部分有效 */
  executionPeriodStart?: number | null;
  /** 执行周期：结束日期时间戳(毫秒)，仅日期部分有效 */
  executionPeriodEnd?: number | null;
}

export interface UseRequirementQualityResult {
  list: RequirementItem[];
  overview: {
    totalCases: number;
    executedCases: number;
    executionRate: number;
    passRate: number;
    firstPassRate?: number;
    /** 千行代码缺陷率平均值：有该率的需求的 totalDefectRatePer1k 相加/数量，仅当前页 */
    avgDefectRatePer1k: number | null;
  };
  requirementTotal: number;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (p: number) => void;
  filters: RequirementQualityFilters;
  setFilters: (f: Partial<RequirementQualityFilters>) => void;
  /** 排序：sortBy 与 sortOrder，点击表头切换 */
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  setSort: (sortBy: string | null, sortOrder: 'asc' | 'desc') => void;
  filterOptions: RequirementQualityFilterOptionsDTO | null;
  /** 项目下拉选项：来自 /project/list/options/{orgId}，展示当前组织下全部项目 */
  projectOptions: { id: string; name: string }[];
}

export function useRequirementQuality(): UseRequirementQualityResult {
  const [filters, setFiltersState] = useState<RequirementQualityFilters>(() => {
    const currentProjectId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
    // 执行周期默认：最近 2 周（含今天共 14 天）
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return {
      projectId: currentProjectId || 'all',
      projectIds: currentProjectId ? [currentProjectId] : [],
      requirementListValue: 'all',
      status: 'all',
      executionPeriodStart: start.getTime(),
      executionPeriodEnd: end.getTime(),
    };
  });
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<RequirementItem[]>([]);
  const [pager, setPager] = useState<{ total: number }>({ total: 0 });
  const [overview, setOverview] = useState<RequirementQualityOverviewState>({
    requirementTotal: 0,
    totalCases: 0,
    executedCases: 0,
    executionRate: 0,
    passRate: 0,
    firstPassRate: null,
    avgDefectRatePer1k: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<RequirementQualityFilterOptionsDTO | null>(null);
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);

  interface RequirementQualityOverviewState {
    requirementTotal: number;
    totalCases: number;
    executedCases: number;
    executionRate: number;
    passRate: number;
    firstPassRate: number | null;
    avgDefectRatePer1k: number | null;
  }

  const setFilters = useCallback((next: Partial<RequirementQualityFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  const setSort = useCallback((nextSortBy: string | null, nextSortOrder: 'asc' | 'desc') => {
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setPage(1);
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let finalProjectIds =
        filters.projectIds?.length > 0
          ? filters.projectIds
          : filters.projectId !== 'all'
            ? [filters.projectId]
            : undefined;

      // 如果未限定特定项目，为实现“只能查看有对应项目权限的项目”
      // 强制下发当前用户有权限的所有项目ID过滤数据
      if (!finalProjectIds || finalProjectIds.length === 0) {
        if (projectOptions.length > 0) {
          finalProjectIds = projectOptions.map((p) => p.id);
        } else {
          // 避免在权限列表未加载完时暴露请求，传一个空权限标识
          finalProjectIds = ['NO_PERMISSION'];
        }
      }

      const projectIds = finalProjectIds;
      const status = filters.status === 'all' ? undefined : filters.status;
      const storyIds =
        filters.requirementListValue === 'all'
          ? undefined
          : [filters.requirementListValue];
      const executionPeriodStart = filters.executionPeriodStart ?? undefined;
      const executionPeriodEnd = filters.executionPeriodEnd ?? undefined;
      const listPayload = {
        projectIds,
        status,
        storyIds,
        executionPeriodStart: executionPeriodStart || undefined,
        executionPeriodEnd: executionPeriodEnd || undefined,
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
        current: page,
        pageSize: PAGE_SIZE,
      };

      const [listRes, overviewRes] = await Promise.all([
        requirementQualityService.list(listPayload),
        requirementQualityService.overview({
          projectIds,
          status,
          storyIds,
          executionPeriodStart: executionPeriodStart || undefined,
          executionPeriodEnd: executionPeriodEnd || undefined,
        }),
      ]);

      const rawList = (listRes?.list ?? []) as RequirementQualityListItemDTO[];
      setList(rawList.map(dtoToRequirementItem));
      setPager({ total: listRes?.total ?? 0 });

      const avgDefectRatePer1k =
        overviewRes?.avgDefectRatePer1k != null
          ? overviewRes.avgDefectRatePer1k
          : (() => {
            const withRate = rawList.filter((d) => d.totalDefectRatePer1k != null);
            return withRate.length > 0
              ? Math.round(
                (withRate.reduce((s, d) => s + (d.totalDefectRatePer1k ?? 0), 0) / withRate.length) * 100
              ) / 100
              : null;
          })();

      setOverview({
        requirementTotal: overviewRes?.requirementTotal ?? 0,
        totalCases: overviewRes?.caseTotalCount ?? 0,
        executedCases: overviewRes?.caseExecutedCount ?? 0,
        executionRate: overviewRes?.executionRate ?? 0,
        passRate: overviewRes?.passRate ?? 0,
        firstPassRate: overviewRes?.firstPassRate ?? null,
        avgDefectRatePer1k,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setError(msg);
      setList([]);
      setPager({ total: 0 });
      setOverview({
        requirementTotal: 0,
        totalCases: 0,
        executedCases: 0,
        executionRate: 0,
        passRate: 0,
        firstPassRate: null,
        avgDefectRatePer1k: null,
      });
    } finally {
      setLoading(false);
    }
  }, [filters.projectId, filters.projectIds, filters.status, filters.requirementListValue, filters.executionPeriodStart, filters.executionPeriodEnd, sortBy, sortOrder, page, projectOptions]);

  useEffect(() => {
    requirementQualityService
      .filterOptions()
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, []);

  // 项目下拉使用 /project/list/options/{orgId}，展示当前组织下全部项目（与接口返回一致）
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
    fetch();
  }, [fetch]);

  const totalCount = pager.total;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    list,
    overview: {
      totalCases: overview.totalCases,
      executedCases: overview.executedCases,
      executionRate: overview.executionRate,
      passRate: overview.passRate,
      firstPassRate: overview.firstPassRate ?? undefined,
      avgDefectRatePer1k: overview.avgDefectRatePer1k,
    },
    requirementTotal: overview.requirementTotal,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    loading,
    error,
    refetch: fetch,
    setPage,
    filters,
    setFilters,
    sortBy,
    sortOrder,
    setSort,
    filterOptions,
    projectOptions,
  };
}
