/**
 * 拨测 - 鉴权账号 API（spotter-aegis-web）
 * 生产环境走 getSpotterPlatformApiUrl 完整路由
 */
import { http } from '@/utils/request';
import { getSpotterPlatformApiUrl } from '@/config/routes';

const PREFIX = '/spotter-aegis-web';
const url = (path: string) => getSpotterPlatformApiUrl(path);

export interface AccountListParams {
  currentPage: number;
  pageSize: number;
  accountTitle: string;
  appCode: string;
  baseUrl?: string;
  isActive?: number | null;
}

export interface AccountItem {
  id: string;
  accountTitle: string;
  appCode: string;
  baseUrl: string;
  user?: string;
  password?: string;
  callbackUrl?: string;
  defaultRouterPath?: string;
  apiAuthenticationPath?: string;
  webAuthenticationPath?: string;
  apiUrl?: string;
  isActive?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  accountFeatures?: Record<string, unknown>;
}

export const accountApi = {
  page: (data: AccountListParams) =>
    http.post<{ data: AccountItem[]; total: number }>(url(`${PREFIX}/account/page`), data),
  add: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/account/add`), data),
  modify: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/account/modify`), data),
  delete: (id: string) => http.delete(url(`${PREFIX}/account/delete/${id}`)),
};
