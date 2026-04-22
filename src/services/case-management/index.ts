/**
 * 用例管理服务统一导出
 * 从 MeterSphere 迁移并转换为 React 格式
 */

// 导出功能用例服务
export * from './service-feature-case';
// 导出用例评审服务
export * from './service-case-review';
// 导出用例效能指标服务
export * from './service-case-metrics';
// 导出 URL 常量
export * from './constants/urls';

// 统一导出为 service 对象（可选，保持向后兼容）
import * as featureCaseService from './service-feature-case';
import * as caseReviewService from './service-case-review';
import * as caseMetricsService from './service-case-metrics';

export const caseManagementService = {
  ...featureCaseService,
  ...caseReviewService,
  ...caseMetricsService,
};
