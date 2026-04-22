/**
 * 测试计划 - 接口用例服务
 * 从 MeterSphere 迁移并转换为 React 格式
 */

import { http } from '@/utils/request';
import { testPlanUrls } from './constants/urls';

// 临时类型定义
type TableQueryParams = any;
type CommonList<T> = any;
type ModuleTreeNode = any;
type PlanDetailApiCaseItem = any;
type PlanDetailApiCaseQueryParams = any;
type PlanDetailApiCaseTreeParams = any;
type BatchApiCaseParams = any;
type BatchMoveApiCaseParams = any;
type SortApiCaseParams = any;
type DisassociateCaseParams = any;
type ReportDetail = any;
type ReportStepDetail = any;

/**
 * 获取计划详情-接口用例列表
 */
export function getPlanDetailApiCaseList(data: PlanDetailApiCaseQueryParams) {
  return http.post<CommonList<PlanDetailApiCaseItem>>(testPlanUrls.GetPlanDetailApiCaseListUrl, data);
}

/**
 * 获取计划详情-接口用例模块树
 */
export function getApiCaseModule(data: PlanDetailApiCaseTreeParams) {
  return http.post<ModuleTreeNode[]>(testPlanUrls.GetApiCaseModuleUrl, data);
}

/**
 * 获取计划详情-接口用例-获取模块数量
 */
export function getApiCaseModuleCount(data: PlanDetailApiCaseQueryParams) {
  return http.post(testPlanUrls.GetApiCaseModuleCountUrl, data);
}

/**
 * 计划详情-接口用例列表-拖拽排序
 */
export function sortApiCase(data: SortApiCaseParams) {
  return http.post(testPlanUrls.SortApiCaseUrl, data);
}

/**
 * 计划详情-接口用例列表-执行
 */
export function runApiCase(id: string, reportId?: string) {
  const params = reportId ? { params: { reportId } } : {};
  return http.get(`${testPlanUrls.RunApiCaseUrl}/${id}`, params);
}

/**
 * 计划详情-接口用例列表-取消关联用例
 */
export function disassociateApiCase(data: DisassociateCaseParams) {
  return http.post(testPlanUrls.DisassociateApiCaseUrl, data);
}

/**
 * 计划详情-接口用例列表-批量取消关联用例
 */
export function batchDisassociateApiCase(data: BatchApiCaseParams) {
  return http.post(testPlanUrls.BatchDisassociateApiCaseUrl, data);
}

/**
 * 计划详情-接口用例列表-批量执行
 */
export function batchRunApiCase(data: BatchApiCaseParams) {
  return http.post(testPlanUrls.BatchRunApiCaseUrl, data);
}

/**
 * 计划详情-接口用例列表-批量移动
 */
export function batchMoveApiCase(data: BatchMoveApiCaseParams) {
  return http.post(testPlanUrls.BatchMoveApiCaseUrl, data);
}

/**
 * 计划详情-接口用例列表-获取报告
 */
export function getApiCaseReport(reportId: string) {
  return http.get<ReportDetail>(`${testPlanUrls.ApiCaseReportDetailUrl}/${reportId}`);
}

/**
 * 计划详情-接口用例列表-获取报告-步骤详情
 */
export function getApiCaseReportStep(reportId: string, stepId: string) {
  return http.get<ReportStepDetail[]>(`${testPlanUrls.ApiCaseReportDetailStepUrl}/${reportId}/${stepId}`);
}

// ==================== 接口用例缺陷关联 ====================

/**
 * 测试计划-用例详情-关联缺陷到接口用例
 */
export function associatedBugToApiCase(data: TableQueryParams) {
  return http.post(testPlanUrls.AssociatedBugToApiCaseUrl, data);
}

/**
 * 测试计划-用例详情-取消关联缺陷到接口用例
 */
export function cancelBugFromApiCase(data: TableQueryParams) {
  return http.post(testPlanUrls.CancelBugFromApiCaseUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到接口用例
 */
export function batchLinkBugToApiCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchLinkBugToApiCaseUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到接口用例
 */
export function batchAssociatedBugToApiCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchAssociatedBugToApiCaseUrl, data);
}

/**
 * 测试计划-用例详情-获取未关联的缺陷列表（接口用例）
 */
export function getUnAssociatedApiBug(data: TableQueryParams) {
  return http.post(testPlanUrls.GetUnAssociatedApiBugUrl, data);
}

/**
 * 测试计划-用例详情-获取关联用例列表（接口用例）
 */
export function getUnAssociatedList(data: TableQueryParams) {
  return http.post(testPlanUrls.GetUnAssociatedListUrl, data);
}
