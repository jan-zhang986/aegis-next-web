/**
 * 系统设置-日志 API（系统级别，与 AegisOne 路径一致）
 */
import { http } from '@/utils/request';
import type { LogListParams, LogListResult, LogOptions, LogUserItem } from '@/types/setting/log';

const SYSTEM_LOG = '/operation/log';

export const systemLogService = {
  /** 系统日志列表 */
  getSystemLogList: (data: LogListParams): Promise<LogListResult> => {
    return http.post(`${SYSTEM_LOG}/list`, data).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? data.current,
      pageSize: res?.pageSize ?? data.pageSize,
    }));
  },

  /** 系统日志-操作范围选项（组织/项目级联） */
  getSystemLogOptions: (): Promise<LogOptions> => {
    return http.get(`${SYSTEM_LOG}/get/options`).then((res: any) => ({
      organizationList: res?.organizationList ?? [],
      projectList: res?.projectList ?? [],
    }));
  },

  /** 系统日志-操作用户搜索 */
  getSystemLogUsers: (keyword: string): Promise<LogUserItem[]> => {
    return http.get(`${SYSTEM_LOG}/user/list`, { params: { keyword } }).then((res: any) => {
      const arr = res?.data ?? res ?? [];
      return Array.isArray(arr) ? arr : [];
    });
  },
};

const ORG_LOG = '/organization/log';

export const orgLogService = {
  /** 组织日志列表 */
  getOrgLogList: (data: LogListParams): Promise<LogListResult> => {
    return http.post(`${ORG_LOG}/list`, data).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? data.current,
      pageSize: res?.pageSize ?? data.pageSize,
    }));
  },

  /** 组织日志-操作范围选项（项目级联） */
  getOrgLogOptions: (organizationId: string): Promise<LogOptions> => {
    return http.get(`${ORG_LOG}/get/options/${organizationId}`).then((res: any) => ({
      organizationList: res?.organizationList ?? [],
      projectList: res?.projectList ?? [],
    }));
  },

  /** 组织日志-操作用户搜索 */
  getOrgLogUsers: (organizationId: string, keyword: string): Promise<LogUserItem[]> => {
    return http.get(`${ORG_LOG}/user/list/${organizationId}`, { params: { keyword } }).then((res: any) => {
      const arr = res?.data ?? res ?? [];
      return Array.isArray(arr) ? arr : [];
    });
  },
};

const PROJECT_LOG = '/project/log';

export const projectLogService = {
  /** 项目日志列表 */
  getProjectLogList: (data: LogListParams): Promise<LogListResult> => {
    return http.post(`${PROJECT_LOG}/list`, data).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
      current: res?.current ?? data.current,
      pageSize: res?.pageSize ?? data.pageSize,
    }));
  },

  /** 项目日志-操作用户搜索 */
  getProjectLogUsers: (projectId: string, keyword: string): Promise<LogUserItem[]> => {
    return http.get(`${PROJECT_LOG}/user/list/${projectId}`, { params: { keyword } }).then((res: any) => {
      const arr = res?.data ?? res ?? [];
      return Array.isArray(arr) ? arr : [];
    });
  },
};
