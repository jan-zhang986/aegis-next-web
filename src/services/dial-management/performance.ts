/**
 * 拨测 - 性能大盘/配置/报告/分析 API（spotter-aegis-perf）
 * 生产环境走 getSpotterPlatformApiUrl 完整路由
 */
import { http } from '@/utils/request';
import { getSpotterPlatformApiUrl } from '@/config/routes';

const PREFIX = '/spotter-aegis-perf';
const url = (path: string) => getSpotterPlatformApiUrl(path);

export const performanceApi = {
  configList: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/config/list`), data),
  configCreate: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/config/create`), data),
  configEdit: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/config/edit`), data),
  configDelete: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/config/delete`), data),
  accountList: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/account/list`), data),
  menuList: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/menu/list`), data),
  reportList: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/performance/report/list`), data),
  latest: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/performance/latest`), data),
  diagnosis: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/performance/diagnosis`), data),
  createTask: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/performance/create/task`), data),
  createBatch: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/performance/create/batch`), data),
};
