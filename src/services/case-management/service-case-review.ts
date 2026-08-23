/**
 * 用例管理 - 用例评审服务
 * 从 AegisOne 迁移并转换为 React 格式
 */

import { http } from '@/utils/request';
import { caseManagementUrls } from './constants/urls';

// 临时类型定义（后续会迁移类型定义文件）
type TableQueryParams = any;
type CommonList<T> = any;
type ReviewModule = any;
type UpdateReviewModuleParams = any;
type MoveModules = any;
type ReviewListQueryParams = any;
type Review = any;
type AssociateReviewCaseParams = any;
type CopyReviewParams = any;
type UpdateReviewParams = any;
type FollowReviewParams = any;
type BatchMoveReviewParams = any;
type SortReviewParams = any;
type ReviewDetailCaseListQueryParams = any;
type SortReviewCaseParams = any;
type BatchReviewCaseParams = any;
type BatchChangeReviewerParams = any;
type BatchCancelReviewCaseParams = any;
type CaseReviewMinderParams = any;

/** 评审详情-提交评审入参，与后端 ReviewFunctionalCaseRequest 字段一致（projectId/reviewId/caseId/reviewPassRule/status 必填） */
export interface CommitReviewResultParams {
  projectId: string;
  caseId: string;
  reviewId: string;
  status: 'PASS' | 'UN_PASS' | 'RE_REVIEWED' | 'UNDER_REVIEWED';
  reviewPassRule: 'SINGLE' | 'MULTIPLE';
  content: string;
  notifier: string;
  reviewCommentFileIds?: string[];
}
type CasePlanMinderParams = any;

// ==================== 评审模块管理 ====================

/**
 * 新增评审模块
 */
export function addReviewModule(data: ReviewModule) {
  return http.post(caseManagementUrls.AddReviewModuleUrl, data);
}

/**
 * 更新评审模块
 */
export function updateReviewModule(data: UpdateReviewModuleParams) {
  return http.post(caseManagementUrls.UpdateReviewModuleUrl, data);
}

/**
 * 移动评审模块
 */
export function moveReviewModule(data: MoveModules) {
  return http.post(caseManagementUrls.MoveReviewModuleUrl, data);
}

/**
 * 获取评审模块树
 */
export function getReviewModules(projectId: string) {
  return http.get<any[]>(`${caseManagementUrls.GetReviewModulesUrl}/${projectId}`);
}

/**
 * 删除评审模块
 */
export function deleteReviewModule(id: string) {
  return http.get(`${caseManagementUrls.DeleteReviewModuleUrl}/${id}`);
}

/**
 * 评审模块树-统计用例数量
 * 后端要求：projectId 必填，current > 0，pageSize >= 5
 */
export function reviewModuleCount(data: ReviewListQueryParams) {
  return http.post(caseManagementUrls.ReviewModuleCountUrl, data);
}

// ==================== 评审管理 ====================

/**
 * 新增评审
 */
export function addReview(data: Review) {
  return http.post(caseManagementUrls.AddReviewUrl, data);
}

/**
 * 关联用例
 */
export function associateReviewCase(data: AssociateReviewCaseParams) {
  return http.post(caseManagementUrls.AssociateReviewUrl, data);
}

/**
 * 复制评审
 */
export function copyReview(data: CopyReviewParams) {
  return http.post(caseManagementUrls.CopyReviewUrl, data);
}

/**
 * 编辑评审
 */
export function editReview(data: UpdateReviewParams) {
  return http.post(caseManagementUrls.EditReviewUrl, data);
}

/**
 * 关注/取消关注评审
 */
export function followReview(data: FollowReviewParams) {
  return http.post(caseManagementUrls.FollowReviewUrl, data);
}

/**
 * 移动评审
 */
export function moveReview(data: BatchMoveReviewParams) {
  return http.post(caseManagementUrls.MoveReviewUrl, data);
}

/**
 * 评审拖拽排序
 */
export function sortReview(data: SortReviewParams) {
  return http.post(caseManagementUrls.SortReviewUrl, data);
}

/**
 * 获取评审列表
 */
export function getReviewList(data: ReviewListQueryParams) {
  return http.post<CommonList<any>>(caseManagementUrls.GetReviewListUrl, data);
}

/**
 * 获取评审详情
 */
export function getReviewDetail(id: string) {
  return http.get(`${caseManagementUrls.GetReviewDetailUrl}/${id}`);
}

/**
 * 获取评审人员列表（与 aegis-next-web 一致：keyword 作为 query 参数）
 */
export function getReviewUsers(projectId: string, keyword: string) {
  return http.get(`${caseManagementUrls.GetReviewUsersUrl}/${projectId}`, { params: { keyword } });
}

/**
 * 取消关联用例
 */
export function disassociateReviewCase(reviewId: string, caseId: string) {
  return http.get(`${caseManagementUrls.DisassociateReviewCaseUrl}/${reviewId}/${caseId}`);
}

/**
 * 删除用例评审
 */
export function deleteReview(reviewId: string, projectId: string) {
  return http.get(`${caseManagementUrls.DeleteReviewUrl}/${reviewId}/${projectId}`);
}

// ==================== 评审详情 ====================

/**
 * 评审详情-获取已关联用例列表
 */
export function getReviewDetailCasePage(data: ReviewDetailCaseListQueryParams) {
  return http.post<CommonList<any>>(caseManagementUrls.GetReviewDetailCasePageUrl, data);
}

/**
 * 评审详情-已关联用例拖拽排序
 */
export function sortReviewDetailCase(data: SortReviewCaseParams) {
  return http.post(caseManagementUrls.SortReviewDetailCaseUrl, data);
}

/**
 * 评审详情-批量评审
 */
export function batchReview(data: BatchReviewCaseParams) {
  return http.post(caseManagementUrls.BatchReviewUrl, data);
}

/**
 * 评审详情-批量修改评审人
 */
export function batchChangeReviewer(data: BatchChangeReviewerParams) {
  return http.post(caseManagementUrls.BatchChangeReviewerUrl, data);
}

/**
 * 评审详情-批量取消关联用例
 */
export function batchDisassociateReviewCase(data: BatchCancelReviewCaseParams) {
  return http.post(caseManagementUrls.BatchDisassociateReviewCaseUrl, data);
}

/**
 * 获取已关联用例id集合
 */
export function getAssociatedIds(reviewId: string) {
  return http.get<string[]>(`${caseManagementUrls.GetAssociatedIdsUrl}/${reviewId}`);
}

/**
 * 评审详情-模块下用例数量统计
 */
export function getReviewDetailModuleCount(data: ReviewDetailCaseListQueryParams) {
  return http.post(caseManagementUrls.GetReviewDetailModuleCountUrl, data);
}

/**
 * 评审详情-已关联用例模块树
 */
export function getReviewDetailModuleTree(reviewId: string) {
  return http.get(`${caseManagementUrls.GetReviewDetailModuleTreeUrl}/${reviewId}`);
}

/**
 * 评审详情-获取用例评审历史
 */
export function getCaseReviewHistoryList(reviewId: string, caseId: string) {
  return http.get(`${caseManagementUrls.GetCaseReviewHistoryListUrl}/${reviewId}/${caseId}`);
}

/**
 * 评审详情-提交评审（与 aegis-next-web saveCaseReviewResult 请求体一致）
 */
export function saveCaseReviewResult(data: CommitReviewResultParams) {
  return http.post(caseManagementUrls.SaveCaseReviewResultUrl, data);
}

/**
 * 评审详情-获取用例的评审人
 */
export function getCaseReviewerList(reviewId: string, caseId: string) {
  return http.get(`${caseManagementUrls.getCaseReviewerListUrl}/${reviewId}/${caseId}`);
}

// ==================== 评审脑图 ====================

/**
 * 获取评审脑图数据
 */
export function getCaseReviewMinder(data: CaseReviewMinderParams) {
  return http.post(caseManagementUrls.GetCaseReviewMinderUrl, data);
}

/**
 * 脑图-获取用例评审最终结果和每个评审人最终的评审结果
 */
export function getReviewerAndStatus(reviewId: string) {
  return http.get(`${caseManagementUrls.GetReviewerAndStatusUrl}/${reviewId}`);
}

/**
 * 获取测试计划用例脑图
 */
export function getCasePlanMinder(data: CasePlanMinderParams) {
  return http.post(caseManagementUrls.GetCasePlanMinderUrl, data);
}

/**
 * 获取测试计划用例脑图-测试点
 */
export function getCasePlanCollectionMinder(data: CasePlanMinderParams) {
  return http.post(caseManagementUrls.GetCasePlanCollectionMinderUrl, data);
}

/**
 * 评审详情-脑图评审用例
 */
export function minderReviewCase(data: any) {
  return http.post(caseManagementUrls.MinderReviewCaseUrl, data);
}
