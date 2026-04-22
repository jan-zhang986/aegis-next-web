/**
 * 拨测 - 拨测管理 / 计划 API（spotter-aegis-web）
 * 生产环境走 getSpotterPlatformApiUrl 完整路由
 */
import { http } from '@/utils/request';
import { getSpotterPlatformApiUrl } from '@/config/routes';

const PREFIX = '/spotter-aegis-web';
const url = (path: string) => getSpotterPlatformApiUrl(path);

export interface DialListParams {
  currentPage: number;
  pageSize: number;
  description: string;
  priority: number | null;
  appCode: string;
  dialingType: string;
  userName: string;
  isActive?: number | null;
}

export interface DialPlanListParams {
  currentPage?: number;
  pageSize?: number;
  dialingType?: string;
  planName?: string;
  appCode?: string;
  planStatus?: number | null;
  [key: string]: unknown;
}

/** DUBBO 立即测试（与 spotter-aegislm invokeDubbo 一致，POST /rpc/invoke-async） */
export const invokeDubbo = (data: Record<string, unknown>) =>
  http.post('/rpc/invoke-async', data);

export const dialApi = {
  page: (data: DialListParams) => http.post<{ data: unknown[]; total: number }>(url(`${PREFIX}/dialing/page`), data),
  add: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/dialing/add`), data),
  modify: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/dialing/modify`), data),
  delete: (id: string) => http.delete(url(`${PREFIX}/dialing/delete/${id}`)),
  /** 拨测执行日志（拨测详情用） */
  planLog: (data: { currentPage?: number; pageSize?: number; id?: number; dialingTestId?: number; dialingPlanId?: number }) =>
    http.post<{ data?: { data?: Record<string, unknown>[] }; code?: number }>(url(`${PREFIX}/dialing/plan/log`), data),
  planPage: (data: DialPlanListParams) =>
    http.post<{ data: unknown[]; total: number }>(url(`${PREFIX}/dialing/plan/page`), data),
  remote: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/dialing/remote`), data),
};
