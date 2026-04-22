/**
 * 拨测 - 菜单管理 API（spotter-aegis-web）
 * 生产环境走 getSpotterPlatformApiUrl 完整路由
 */
import { http } from '@/utils/request';
import { getSpotterPlatformApiUrl } from '@/config/routes';

const PREFIX = '/spotter-aegis-web';
const url = (path: string) => getSpotterPlatformApiUrl(path);

export interface MenuListParams {
  currentPage: number;
  pageSize: number;
  appCode: string;
  name?: string;
  path?: string;
  isActive?: number | null;
}

export interface MenuItem {
  id: string;
  name: string;
  sortOrder?: number;
  path?: string;
  isActive?: number;
  createdAt?: string;
  updatedAt?: string;
  children?: MenuItem[];
}

export const menuApi = {
  page: (data: MenuListParams) =>
    http.post<{ data: MenuItem[]; total: number }>(url(`${PREFIX}/e2e/menu/page`), data),
  add: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/menu/add`), data),
  modify: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/menu/modify`), data),
  delete: (id: string) => http.delete(url(`${PREFIX}/menu/delete/${id}`)),
};
