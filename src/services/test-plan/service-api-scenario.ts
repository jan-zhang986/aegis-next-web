/**
 * 测试计划 - 接口场景服务
 * 从 AegisOne 迁移并转换为 React 格式
 */

import { http } from '@/utils/request';
import { testPlanUrls } from './constants/urls';

// 临时类型定义
type TableQueryParams = any;
type CommonList<T> = any;
type ModuleTreeNode = any;
type PlanDetailApiScenarioItem = any;
type PlanDetailApiScenarioQueryParams = any;
type BatchApiCaseParams = any;
type BatchMoveApiCaseParams = any;
type SortApiCaseParams = any;
type DisassociateCaseParams = any;
type ReportDetail = any;
type ReportStepDetail = any;

/**
 * 获取计划详情-接口场景列表
 */
export function getPlanDetailApiScenarioList(data: PlanDetailApiScenarioQueryParams) {
  return http.post<CommonList<PlanDetailApiScenarioItem>>(testPlanUrls.GetPlanDetailApiScenarioListUrl, data);
}

/**
 * 获取计划详情-接口场景模块树
 */
export function getApiScenarioModule(data: PlanDetailApiScenarioQueryParams) {
  return http.post<ModuleTreeNode[]>(testPlanUrls.GetApiScenarioModuleUrl, data);
}

/**
 * 获取计划详情-接口场景-获取模块数量
 */
export function getApiScenarioModuleCount(data: PlanDetailApiScenarioQueryParams) {
  return http.post(testPlanUrls.GetApiScenarioModuleCountUrl, data);
}

/**
 * 计划详情-接口场景列表-拖拽排序
 */
export function sortApiScenario(data: SortApiCaseParams) {
  return http.post(testPlanUrls.SortApiScenarioUrl, data);
}

/**
 * 计划详情-接口场景列表-执行
 */
export function runApiScenario(id: string, reportId?: string) {
  const params = reportId ? { params: { reportId } } : {};
  return http.get(`${testPlanUrls.RunApiScenarioUrl}/${id}`, params);
}

/**
 * 计划详情-接口场景列表-取消关联用例
 */
export function disassociateApiScenario(data: DisassociateCaseParams) {
  return http.post(testPlanUrls.DisassociateApiScenarioUrl, data);
}

/**
 * 计划详情-接口场景列表-批量取消关联用例
 */
export function batchDisassociateApiScenario(data: BatchApiCaseParams) {
  return http.post(testPlanUrls.BatchDisassociateApiScenarioUrl, data);
}

/**
 * 计划详情-接口场景列表-批量执行
 */
export function batchRunApiScenario(data: BatchApiCaseParams) {
  return http.post(testPlanUrls.BatchRunApiScenarioUrl, data);
}

/**
 * 计划详情-接口场景列表-批量移动
 */
export function batchMoveApiScenario(data: BatchMoveApiCaseParams) {
  return http.post(testPlanUrls.BatchMoveApiScenarioUrl, data);
}

/**
 * 计划详情-接口场景列表-获取报告
 */
export function getApiScenarioReport(reportId: string) {
  return http.get<ReportDetail>(`${testPlanUrls.ApiScenarioReportDetailUrl}/${reportId}`);
}

/**
 * 计划详情-接口场景列表-获取报告-步骤详情
 */
export function getApiScenarioReportStep(reportId: string, stepId: string) {
  return http.get<ReportStepDetail[]>(`${testPlanUrls.ApiScenarioReportDetailStepUrl}/${reportId}/${stepId}`);
}

// ==================== 接口场景缺陷关联 ====================

/**
 * 测试计划-用例详情-关联缺陷到场景用例
 */
export function associatedBugToScenarioCase(data: TableQueryParams) {
  return http.post(testPlanUrls.AssociatedBugToScenarioCaseUrl, data);
}

/**
 * 测试计划-用例详情-取消关联缺陷到场景用例
 */
export function cancelBugFromScenarioCase(data: TableQueryParams) {
  return http.post(testPlanUrls.CancelBugFromScenarioCaseUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到场景用例
 */
export function batchLinkBugToScenarioCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchLinkBugToScenarioCaseUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到场景用例
 */
export function batchAssociatedBugToScenarioCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchAssociatedBugToScenarioCaseUrl, data);
}

/**
 * 测试计划-用例详情-获取未关联的缺陷列表（场景用例）
 */
export function getUnAssociatedScenarioBug(data: TableQueryParams) {
  return http.post(testPlanUrls.GetUnAssociatedScenarioBugUrl, data);
}

// ==================== 批量缺陷关联 ====================

/**
 * 测试计划-用例详情-批量关联缺陷到功能用例
 */
export function batchAssociatedBugToFunctionalCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchAssociatedBugToFunctionalCaseUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到脑图用例
 */
export function batchAssociatedBugToMinderCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchAssociatedBugToMinderCaseUrl, data);
}

/**
 * 测试计划-用例详情-批量关联缺陷到用例
 */
export function batchAssociatedBugToCase(data: TableQueryParams) {
  return http.post(testPlanUrls.BatchAssociatedBugToCaseUrl, data);
}
