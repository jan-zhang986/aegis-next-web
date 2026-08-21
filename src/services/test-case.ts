/**
 * 统一 Case 服务
 * 用户视角只有一个 Case，API/UI/Flow/自动化 都通过 realization 挂在 Case 下。
 */

import { http } from '@/utils/request';

export interface TestCasePageParams {
  current?: number;
  pageSize?: number;
  projectId?: string;
  spaceId?: string;
  moduleIds?: string[];
  keyword?: string;
  realizationTypes?: string[];
  lifecycleStatuses?: string[];
  ownerId?: string;
  tags?: string[];
  [key: string]: any;
}

export interface TestCaseRealizationSavePayload {
  realizationType: string;
  workflowDefinitionId?: string;
  workflowName?: string;
  description?: string;
  category?: string;
  environmentId?: string;
  enabled?: boolean;
  workflowStatus?: string;
  globalVars?: Record<string, any>;
  nodes?: any[];
  connections?: any[];
}

export const testCaseService = {
  getTestCaseList: async (params: TestCasePageParams) => {
    return http.post('/api/testcase/page', params);
  },

  getTestCaseDetail: async (id: string) => {
    return http.get(`/api/testcase/${id}`);
  },

  saveTestCase: async (data: any) => {
    return http.post('/api/testcase/save', data);
  },

  getTestCaseWorkflow: async (id: string) => {
    return http.get(`/api/testcase/${id}/workflow`);
  },

  transitionTestCase: async (id: string, data: { targetStatus: string; reason?: string }) => {
    return http.post(`/api/testcase/${id}/transition`, data);
  },

  getCaseRealizationList: async (caseId: string) => {
    return http.get(`/api/testcase/${caseId}/realization/list`);
  },

  getCaseRealizationDetail: async (caseId: string, realizationType: string) => {
    return http.get(`/api/testcase/${caseId}/realization/${realizationType}`);
  },

  getCaseRealizationSummary: async (caseId: string) => {
    return http.get(`/api/testcase/${caseId}/realization/summary`);
  },

  saveCaseRealization: async (caseId: string, data: TestCaseRealizationSavePayload) => {
    return http.post(`/api/testcase/${caseId}/realization/save`, data);
  },

  publishCaseRealization: async (caseId: string, realizationType: string) => {
    return http.post(`/api/testcase/${caseId}/realization/${realizationType}/publish`);
  },

  enableCaseRealization: async (caseId: string, realizationType: string) => {
    return http.post(`/api/testcase/${caseId}/realization/${realizationType}/enable`);
  },

  disableCaseRealization: async (caseId: string, realizationType: string) => {
    return http.post(`/api/testcase/${caseId}/realization/${realizationType}/disable`);
  },

  deleteCaseRealization: async (caseId: string, realizationType: string) => {
    return http.post(`/api/testcase/${caseId}/realization/${realizationType}/delete`);
  },

  getCaseProposalList: async (id: string) => {
    return http.get(`/api/testcase/${id}/proposal/list`);
  },

  getCaseChangeLogList: async (id: string) => {
    return http.get(`/api/testcase/${id}/change-log/list`);
  },

  getCaseUsageList: async (id: string) => {
    return http.get(`/api/testcase/${id}/usage/list`);
  },
};
