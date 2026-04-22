/**
 * 系统设置-任务中心 API（与 MeterSphere 路径一致）
 */
import { http } from '@/utils/request';
import type {
  TaskCenterListParams,
  TaskCenterListResult,
  TaskCenterTaskItem,
  TaskCenterSystemTaskItem,
  TaskCenterTaskDetailItem,
  TaskCenterBatchParams,
} from '@/types/setting/task-center';

const SYSTEM = '/system/task-center';
const ORG = '/organization/task-center';

function normalizeListResult<T>(res: any, params: TaskCenterListParams): TaskCenterListResult<T> {
  const data = res?.data ?? res?.list ?? res;
  const list = Array.isArray(data) ? data : [];
  return {
    total: res?.total ?? list.length,
    list,
    current: res?.current ?? params?.current ?? 1,
    pageSize: res?.pageSize ?? params?.pageSize ?? 10,
  };
}

export const systemTaskCenterService = {
  /** 系统-用例任务列表 */
  getExecuteTaskList: (params: TaskCenterListParams): Promise<TaskCenterListResult<TaskCenterTaskItem>> => {
    return http.post(`${SYSTEM}/exec-task/page`, params).then((res) => normalizeListResult<TaskCenterTaskItem>(res, params));
  },

  /** 系统-系统后台任务列表 */
  getScheduleList: (params: TaskCenterListParams): Promise<TaskCenterListResult<TaskCenterSystemTaskItem>> => {
    return http.post(`${SYSTEM}/schedule/page`, params).then((res) => normalizeListResult<TaskCenterSystemTaskItem>(res, params));
  },

  /** 系统-停止任务 */
  stopTask: (id: string): Promise<void> => {
    return http.get(`${SYSTEM}/exec-task/stop/${id}`);
  },

  /** 系统-删除任务 */
  deleteTask: (id: string): Promise<void> => {
    return http.get(`${SYSTEM}/exec-task/delete/${id}`);
  },

  /** 系统-重跑任务 */
  rerunTask: (id: string): Promise<void> => {
    return http.get(`${SYSTEM}/exec-task/rerun/${id}`);
  },

  /** 系统-开启/关闭后台任务 */
  scheduleSwitch: (id: string): Promise<void> => {
    return http.get(`${SYSTEM}/schedule/switch/${id}`);
  },

  /** 系统-删除后台任务 */
  deleteSchedule: (id: string): Promise<void> => {
    return http.get(`${SYSTEM}/schedule/delete/${id}`);
  },

  /** 系统-编辑 cron 表达式 */
  editCron: (id: string, cron: string): Promise<void> => {
    return http.post(`${SYSTEM}/schedule/update-cron`, { id, cron });
  },

  /** 系统-用例任务详情列表 */
  getExecuteTaskDetailList: (params: TaskCenterBatchParams): Promise<TaskCenterListResult<TaskCenterTaskDetailItem>> => {
    return http.post(`${SYSTEM}/exec-task/detail/page`, params).then((res) => normalizeListResult<TaskCenterTaskDetailItem>(res, params));
  },

  /** 系统-停止任务详情 */
  stopTaskDetail: (id: string): Promise<void> => {
    return http.get(`${SYSTEM}/exec-task/detail/stop/${id}`);
  },

  /** 系统-批量停止任务详情 */
  batchStopTaskDetail: (params: TaskCenterBatchParams): Promise<void> => {
    return http.post(`${SYSTEM}/exec-task/detail/batch-stop`, params);
  },
};

export const orgTaskCenterService = {
  /** 组织-用例任务列表 */
  getExecuteTaskList: (params: TaskCenterListParams): Promise<TaskCenterListResult<TaskCenterTaskItem>> => {
    return http.post(`${ORG}/exec-task/page`, params).then((res) => normalizeListResult<TaskCenterTaskItem>(res, params));
  },

  /** 组织-系统后台任务列表 */
  getScheduleList: (params: TaskCenterListParams): Promise<TaskCenterListResult<TaskCenterSystemTaskItem>> => {
    return http.post(`${ORG}/schedule/page`, params).then((res) => normalizeListResult<TaskCenterSystemTaskItem>(res, params));
  },

  /** 组织-停止任务 */
  stopTask: (id: string): Promise<void> => {
    return http.get(`${ORG}/exec-task/stop/${id}`);
  },

  /** 组织-删除任务 */
  deleteTask: (id: string): Promise<void> => {
    return http.get(`${ORG}/exec-task/delete/${id}`);
  },

  /** 组织-重跑任务 */
  rerunTask: (id: string): Promise<void> => {
    return http.get(`${ORG}/exec-task/rerun/${id}`);
  },

  /** 组织-开启/关闭后台任务 */
  scheduleSwitch: (id: string): Promise<void> => {
    return http.get(`${ORG}/schedule/switch/${id}`);
  },

  /** 组织-删除后台任务 */
  deleteSchedule: (id: string): Promise<void> => {
    return http.get(`${ORG}/schedule/delete/${id}`);
  },

  /** 组织-编辑 cron 表达式 */
  editCron: (id: string, cron: string): Promise<void> => {
    return http.post(`${ORG}/schedule/update-cron`, { id, cron });
  },

  /** 组织-用例任务详情列表 */
  getExecuteTaskDetailList: (params: TaskCenterBatchParams): Promise<TaskCenterListResult<TaskCenterTaskDetailItem>> => {
    return http.post(`${ORG}/exec-task/detail/page`, params).then((res) => normalizeListResult<TaskCenterTaskDetailItem>(res, params));
  },

  /** 组织-停止任务详情 */
  stopTaskDetail: (id: string): Promise<void> => {
    return http.get(`${ORG}/exec-task/detail/stop/${id}`);
  },

  /** 组织-批量停止任务详情 */
  batchStopTaskDetail: (params: TaskCenterBatchParams): Promise<void> => {
    return http.post(`${ORG}/exec-task/detail/batch-stop`, params);
  },
};
