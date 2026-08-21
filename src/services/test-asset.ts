import { http } from '@/utils/request';

export interface TestSuite {
  suiteId?: string;
  projectId: string;
  spaceId?: string;
  name: string;
  type: 'SMOKE' | 'REGRESSION' | 'ACCEPTANCE' | 'SPECIAL' | string;
  description?: string;
  status?: string;
  ownerId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface TestSuiteItem {
  itemId?: string;
  suiteId?: string;
  projectId?: string;
  spaceId?: string;
  targetType: 'CASE' | 'REALIZATION' | 'WORKFLOW' | string;
  targetId: string;
  realizationType?: string;
  title?: string;
  sort?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface TestAssetGateBinding {
  bindingId?: string;
  projectId: string;
  spaceId?: string;
  gateKey: string;
  gateName: string;
  targetType: 'SUITE' | 'REALIZATION' | 'WORKFLOW' | string;
  targetId: string;
  ruleConfig?: Record<string, any>;
  status?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export const testAssetService = {
  getSuitePage: async (params: Partial<TestSuite>) => {
    return http.post('/api/test-suite/page', params);
  },

  getSuiteDetail: async (suiteId: string) => {
    return http.get(`/api/test-suite/${suiteId}`);
  },

  saveSuite: async (data: TestSuite) => {
    return http.post('/api/test-suite/save', data);
  },

  getSuiteItems: async (suiteId: string) => {
    return http.get(`/api/test-suite/${suiteId}/item/list`);
  },

  saveSuiteItem: async (suiteId: string, data: TestSuiteItem) => {
    return http.post(`/api/test-suite/${suiteId}/item/save`, data);
  },

  removeSuiteItem: async (suiteId: string, itemId: string) => {
    return http.post(`/api/test-suite/${suiteId}/item/${itemId}/remove`);
  },

  getGateBindings: async (params: Partial<TestAssetGateBinding>) => {
    return http.get('/api/test-asset/gate-binding/list', { params });
  },

  saveGateBinding: async (data: TestAssetGateBinding) => {
    return http.post('/api/test-asset/gate-binding/save', data);
  },
};
