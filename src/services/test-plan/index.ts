/**
 * 测试计划服务统一导出
 * 从 MeterSphere 迁移并转换为 React 格式
 */

// 主服务保持直接导出，其他子服务通过命名空间与聚合对象暴露，避免重复命名冲突
export * from './service';
export * as testPlanFeatureCaseModule from './service-feature-case';
export * as testPlanApiCaseModule from './service-api-case';
export * as testPlanApiScenarioModule from './service-api-scenario';
export * as testPlanReportModule from './service-report';
export * from './constants/urls';
export * from './constants/reportUrls';

import * as testPlanService from './service';
import * as featureCaseService from './service-feature-case';
import * as apiCaseService from './service-api-case';
import * as apiScenarioService from './service-api-scenario';
import * as reportService from './service-report';

export const testPlanManagementService = {
  ...testPlanService,
  ...featureCaseService,
  ...apiCaseService,
  ...apiScenarioService,
  ...reportService,
};
