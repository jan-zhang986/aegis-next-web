/**
 * 拨测 - 任务管理 / 执行器 API（spotter-task-maestro）
 * 生产环境走 getSpotterPlatformApiUrl 完整路由
 */
import { http } from '@/utils/request';
import { getSpotterPlatformApiUrl } from '@/config/routes';

const PREFIX = '/spotter-task-maestro';
const url = (path: string) => getSpotterPlatformApiUrl(path);

export interface JobListParams {
  page: number;
  size: number;
  jobName?: string;
  executorsName?: string;
}

export interface JobItem {
  id: string;
  jobName: string;
  status: 'pause' | 'run';
  statusName?: string;
  executorsName: string;
  cron?: string;
  openId?: string;
  mode?: string;
  funcArgs?: string;
  funcKwargs?: string;
  jobFeatures?: { id?: string; model?: string; funcArgs?: string; funcKwargs?: Record<string, unknown>; cron?: string };
}

export interface JobListResponse {
  data: JobItem[];
  total: number;
}

export const jobApi = {
  list: (data: JobListParams) => http.post<{ data: JobItem[]; total: number }>(url(`${PREFIX}/job/list`), data),
  add: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/job/add`), data),
  modify: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/job/modify`), data),
  execute: (params: { id: string }) => http.post(url(`${PREFIX}/job/execute`), undefined, { params }),
  stop: (params: { id: string }) => http.post(url(`${PREFIX}/job/stop`), undefined, { params }),
  resume: (params: { id: string }) => http.post(url(`${PREFIX}/job/resume`), undefined, { params }),
};

export interface ExecutorListParams {
  page: number;
  size: number;
  executorsName?: string;
  executorsCode?: string;
  service?: string;
}

export interface ExecutorItem {
  id: string;
  executorsName: string;
  executorsCode: string;
  service: string;
}

export const executorApi = {
  list: (data: ExecutorListParams) =>
    http.post<{ data: ExecutorItem[]; total: number }>(url(`${PREFIX}/execute/list`), data),
  add: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/execute/add`), data),
  modify: (data: Record<string, unknown>) => http.post(url(`${PREFIX}/execute/modify`), data),
};
