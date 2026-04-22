/**
 * 测试计划 - 功能用例服务
 * 从 MeterSphere 迁移并转换为 React 格式
 */

import { http } from '@/utils/request';
import { testPlanUrls } from './constants/urls';

// 临时类型定义
type TableQueryParams = any;
type CommonList<T> = any;
type ModuleTreeNode = any;
type PlanDetailFeatureCaseItem = any;
type PlanDetailFeatureCaseListQueryParams = any;
type RunFeatureCaseParams = any;
type BatchFeatureCaseParams = any;
type BatchExecuteFeatureCaseParams = any;
type BatchUpdateCaseExecutorParams = any;
type ExecuteHistoryItem = any;
type ExecuteHistoryType = any;
type DisassociateCaseParams = any;
type TestPlanCaseDetail = any;

/**
 * 获取计划详情-功能用例列表
 */
export function getPlanDetailFeatureCaseList(data: PlanDetailFeatureCaseListQueryParams) {
  return http.post<CommonList<PlanDetailFeatureCaseItem>>(testPlanUrls.GetPlanDetailFeatureCaseListUrl, data);
}

/**
 * 获取计划详情-功能用例模块树
 */
export function getFeatureCaseModule(data: PlanDetailFeatureCaseListQueryParams) {
  return http.post<ModuleTreeNode[]>(testPlanUrls.GetFeatureCaseModuleUrl, data);
}

/**
 * 获取计划详情-功能用例-获取模块数量
 */
export function getFeatureCaseModuleCount(data: PlanDetailFeatureCaseListQueryParams) {
  return http.post(testPlanUrls.GetFeatureCaseModuleCountUrl, data);
}

/**
 * 计划详情-功能用例列表-拖拽排序
 */
export function sortFeatureCase(data: any) {
  return http.post(testPlanUrls.SortFeatureCaseUrl, data);
}

/**
 * 计划详情-功能用例-取消关联用例
 */
export function disassociateCase(data: DisassociateCaseParams) {
  return http.post(testPlanUrls.DisassociateCaseUrl, data);
}

/**
 * 计划详情-功能用例-批量取消关联用例
 */
export function batchDisassociateCase(data: BatchFeatureCaseParams) {
  return http.post(testPlanUrls.BatchDisassociateCaseUrl, data);
}

/**
 * 计划详情-功能用例-执行
 */
export function runFeatureCase(data: RunFeatureCaseParams) {
  return http.post(testPlanUrls.RunFeatureCaseUrl, data);
}

/**
 * 计划详情-功能用例列表-批量移动
 */
export function batchMoveFeatureCase(data: BatchFeatureCaseParams) {
  return http.post(testPlanUrls.BatchMoveFeatureCaseUrl, data);
}

/**
 * 测试计划-用例详情-缺陷列表
 */
export function getAssociatedBug(data: TableQueryParams) {
  return http.post(testPlanUrls.GetAssociatedBugUrl, data);
}

/**
 * 测试计划-用例详情
 */
export function getTestPlanCaseDetail(id: string) {
  return http.get<TestPlanCaseDetail>(`${testPlanUrls.TestPlanCaseDetailUrl}/${id}`);
}

/**
 * 测试计划-用例详情-关联缺陷
 */
export function testPlanAssociateBug(data: TableQueryParams) {
  return http.post(testPlanUrls.TestPlanAssociateBugUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到功能用例/脑图用例
 */
export function testPlanBatchAssociateBug(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchAssociatedBugToCaseUrl, data);
}

/**
 * 测试计划-用例详情-取消关联缺陷
 */
export function testPlanCancelBug(data: TableQueryParams) {
  return http.post(testPlanUrls.TestPlanCancelBugUrl, data);
}

/**
 * 计划详情-功能用例-批量执行
 */
export function batchRunCase(data: BatchExecuteFeatureCaseParams) {
  return http.post(testPlanUrls.BatchRunCaseUrl, data);
}

/**
 * 计划详情-功能用例-批量更新执行人
 */
export function batchUpdateCaseExecutor(data: BatchUpdateCaseExecutorParams) {
  return http.post(testPlanUrls.BatchUpdateCaseExecutorUrl, data);
}

/**
 * 计划详情-功能用例-执行历史（与原项目一致：POST 请求，传 id/testPlanId/caseId）
 */
export function getExecuteHistory(params: { id: string; testPlanId: string; caseId: string }) {
  return http.post<ExecuteHistoryItem[]>(testPlanUrls.ExecuteHistoryUrl, params);
}

// ==================== 关联用例 ====================

/**
 * 功能用例-关联用例-接口用例-API
 */
export function getTestPlanAssociationApiList(data: TableQueryParams) {
  return http.post<CommonList<any>>(testPlanUrls.TestPlanApiAssociatedPageUrl, data);
}

/**
 * 功能用例-关联用例-接口用例-CASE
 */
export function getTestPlanAssociationCaseList(data: TableQueryParams) {
  return http.post<CommonList<any>>(testPlanUrls.TestPlanCaseAssociatedPageUrl, data);
}

/**
 * 功能用例-关联用例-场景用例
 */
export function getPlanScenarioAssociatedList(data: TableQueryParams) {
  return http.post<CommonList<any>>(testPlanUrls.TestPlanScenarioAssociatedPageUrl, data);
}
