/**
 * 测试计划服务统一导出
 * 从 MeterSphere 迁移并转换为 React 格式
 */

// 导出主服务
export * from './service';
// 导出功能用例服务
export * from './service-feature-case';
// 导出接口用例服务
export * from './service-api-case';
// 导出接口场景服务
export * from './service-api-scenario';
// 导出报告服务
export * from './service-report';
// 导出 URL 常量
export * from './constants/urls';
export * from './constants/reportUrls';

// 统一导出为 service 对象（可选，保持向后兼容）
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
