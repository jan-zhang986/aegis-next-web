/**
 * 精准测试/覆盖率 spotter-jacoco 后端 API
 * 本地：http://localhost:8898，线上：http://jacoco.tst.spotter.ink/
 * 请求走 /cov，由 vite/nginx 代理
 */

import { http } from '@/utils/request';
import { JACOCO_COVERAGE_API_BASE_URL } from '@/config/routes';
import type {
  CoverageReportListItem,
  AggregateReportListParams,
  AggregateReportParams,
  TriggerUnitCoverParams,
  CoverageReportListResult,
  ServiceExcludeCreateParams,
  ServiceExcludeListParams,
  ServiceExcludeListItem,
  ServiceExcludeListResult,
} from '@/types/coverageJacoco';

const BASE = JACOCO_COVERAGE_API_BASE_URL || '';

/**
 * 报告列表
 * - 老接口：返回 CoverageReportListItem[] 或 { data: CoverageReportListItem[] }
 * - 新接口：返回 { data: { list: CoverageReportListItem[]; total: number } }
 */
export async function aggregateReportList(
  params: AggregateReportListParams & { currentPage?: number; pageSize?: number }
): Promise<CoverageReportListResult> {
  const res = await http.post<
    CoverageReportListItem[] | { data?: CoverageReportListItem[] | { list?: CoverageReportListItem[]; total?: number } }
  >(`${BASE}/cov/aggregateReportList`, params);

  if (Array.isArray(res)) {
    return { list: res, total: res.length };
  }

  // 新拦截器场景：直接返回 { list, total }
  if (res && typeof res === 'object' && 'list' in (res as Record<string, unknown>)) {
    const obj = res as { list?: CoverageReportListItem[]; total?: number };
    const list = Array.isArray(obj.list) ? obj.list : [];
    const total = typeof obj.total === 'number' ? obj.total : list.length;
    return { list, total };
  }

  const rawData = (res as { data?: unknown })?.data;

  if (Array.isArray(rawData)) {
    return { list: rawData as CoverageReportListItem[], total: (rawData as CoverageReportListItem[]).length };
  }

  const obj = (rawData || {}) as { list?: CoverageReportListItem[]; total?: number };
  const list = Array.isArray(obj.list) ? obj.list : [];
  const total = typeof obj.total === 'number' ? obj.total : list.length;
  return { list, total };
}

/**
 * 生成/获取报告（迭代测试）
 */
export async function aggregateReport(
  params: AggregateReportParams
): Promise<{ reportId?: string; [key: string]: unknown }> {
  const res = await http.post<{ reportId?: string; [key: string]: unknown }>(
    `${BASE}/cov/aggregateReport`,
    params
  );
  return res ?? {};
}

/**
 * 触发单元测试覆盖率（/cov/triggerUnitCover）
 */
export async function triggerUnitCover(
  params: TriggerUnitCoverParams
): Promise<Record<string, unknown>> {
  const res = await http.post<Record<string, unknown>>(
    `${BASE}/cov/triggerUnitCover`,
    params
  );
  return res ?? {};
}

/**
 * 新建服务排除规则（/cov/serviceExclude/create）
 */
export async function createServiceExclude(
  params: ServiceExcludeCreateParams
): Promise<Record<string, unknown>> {
  const res = await http.post<Record<string, unknown>>(
    `${BASE}/cov/serviceExclude/create`,
    params
  );
  return res ?? {};
}

/**
 * 服务排除规则列表（/cov/serviceExclude/list）
 */
export async function serviceExcludeList(
  params: ServiceExcludeListParams
): Promise<ServiceExcludeListResult> {
  const res = await http.post<
    ServiceExcludeListResult | { list?: ServiceExcludeListItem[]; total?: number }
  >(`${BASE}/cov/serviceExclude/list`, params);

  if (res && typeof res === 'object' && 'list' in res) {
    const list = Array.isArray((res as any).list) ? (res as any).list : [];
    const total = typeof (res as any).total === 'number' ? (res as any).total : list.length;
    return { list, total };
  }
  return { list: [], total: 0 };
}
