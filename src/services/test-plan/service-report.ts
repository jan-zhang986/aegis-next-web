/**
 * 测试计划报告服务
 * 从 MeterSphere 迁移并转换为 React 格式
 */

import { http } from '@/utils/request';
import { reportUrls } from './constants/reportUrls';

// 临时类型定义
type TableQueryParams = any;
type CommonList<T> = any;
type PlanReportDetail = any;
type ReportBugItem = any;
type ApiOrScenarioCaseItem = any;
type GetShareId = any;
type manualReportGenParams = any;

/** 报告详情编辑参数（与 spotter 原项目 UpdateReportDetailParams 一致） */
export interface UpdateReportDetailParams {
  id: string;
  componentId: string;
  componentValue?: string;
  richTextTmpFileIds?: string[];
}

/**
 * 报告列表
 */
export function reportList(data: TableQueryParams) {
  return http.post(reportUrls.PlanReportListUrl, data);
}

/**
 * 删除报告
 */
export function reportDelete(id: string) {
  return http.get(`${reportUrls.PlanDeleteUrl}/${id}`);
}

/**
 * 重命名报告
 */
export function reportRename(id: string, data: string) {
  return http.post(`${reportUrls.PlanReportRenameUrl}/${id}`, data);
}

/**
 * 批量删除报告
 */
export function reportBathDelete(data: TableQueryParams) {
  return http.post(reportUrls.PlanBatchDeleteUrl, data);
}

/**
 * 测试计划-报告-详情-缺陷分页查询
 */
export function getReportBugList(data: TableQueryParams) {
  return http.post<CommonList<ReportBugItem>>(reportUrls.ReportBugListUrl, data);
}

/**
 * 测试计划-报告-详情-缺陷分页查询 (分享)
 */
export function getReportShareBugList(data: TableQueryParams) {
  return http.post<CommonList<ReportBugItem>>(reportUrls.ReportShareBugListUrl, data);
}

/**
 * 测试计划-报告-详情-功能用例分页查询
 */
export function getReportFeatureCaseList(data: TableQueryParams) {
  return http.post<CommonList<ApiOrScenarioCaseItem>>(reportUrls.ReportFeatureCaseListUrl, data);
}

/**
 * 测试计划-报告-详情-功能用例分页查询 (分享)
 */
export function getReportShareFeatureCaseList(data: TableQueryParams) {
  return http.post<CommonList<ApiOrScenarioCaseItem>>(reportUrls.ReportShareFeatureCaseListUrl, data);
}

/**
 * 测试计划-报告-详情-富文本编辑器上传图片文件
 */
export function editorUploadFile(data: { fileList: File[] }) {
  const formData = new FormData();
  data.fileList.forEach(file => {
    formData.append('fileList', file);
  });
  return http.post(reportUrls.EditorUploadFileUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 测试计划-报告-详情-报告内容更新
 * 与原项目一致：直接透传 data，不修改请求体
 */
export function updateReportDetail(data: UpdateReportDetailParams) {
  return http.post(reportUrls.UpdateReportDetailUrl, data);
}

/**
 * 测试计划-报告-详情
 */
export function getReportDetail(id: string, shareId?: string) {
  if (shareId) {
    return http.get(`${reportUrls.PlanReportShareDetailUrl}/${shareId}/${id}`);
  }
  return http.get(`${reportUrls.PlanReportDetailUrl}/${id}`);
}

/**
 * 测试计划-聚合报告-子计划报告分页列表
 */
export function getReportDetailPlanPage(data: TableQueryParams) {
  if (data.shareId) {
    return http.post(reportUrls.ReportDetailSharePageUrl, data);
  }
  return http.post(reportUrls.ReportDetailPageUrl, data);
}

/**
 * 测试计划-报告-详情-分享
 */
export function planReportShare(data: GetShareId) {
  return http.post(reportUrls.PlanReportShareUrl, data);
}

/**
 * 测试计划-报告-分享详情查看
 */
export function planReportShareDetail(shareId: string, reportId: string) {
  return http.get(`${reportUrls.PlanReportShareDetailUrl}/${shareId}/${reportId}`);
}

/**
 * 测试计划-报告-获取分享链接
 */
export function planGetShareHref(id: string) {
  return http.get(`${reportUrls.PlanGetShareHrefDetailUrl}/${id}`);
}

/**
 * 测试计划-报告-获取分享链接时效
 */
export function getShareValidity(id: string) {
  return http.get(`${reportUrls.GetShareValidityUrl}/${id}`);
}

/**
 * 测试计划-独立报告-接口用例
 */
export function getApiPage(data: TableQueryParams) {
  if (data.shareId) {
    return http.post<CommonList<ApiOrScenarioCaseItem>>(reportUrls.ReportShareApiUrl, data);
  }
  return http.post<CommonList<ApiOrScenarioCaseItem>>(reportUrls.ReportIndependentApiUrl, data);
}

/**
 * 测试计划-独立报告-场景用例
 */
export function getScenarioPage(data: TableQueryParams) {
  if (data.shareId) {
    return http.post<CommonList<ApiOrScenarioCaseItem>>(reportUrls.ReportShareScenarioUrl, data);
  }
  return http.post<CommonList<ApiOrScenarioCaseItem>>(reportUrls.ReportIndependentScenarioUrl, data);
}

// ==================== 其他报告相关功能 ====================

/**
 * 测试计划-报告-详情-手动生成报告
 */
export function manualReportGen(data: manualReportGenParams) {
  return http.post(reportUrls.ManualReportGenUrl, data);
}

/**
 * 测试计划-报告-详情-获取报告布局
 */
export function getReportLayout(id: string, shareId?: string) {
  if (shareId) {
    return http.get(`${reportUrls.getReportShareLayoutUrl}/${shareId}/${id}`);
  }
  return http.get(`${reportUrls.getReportLayoutUrl}/${id}`);
}

/**
 * 测试计划-报告-导出（请求体参数，用于批量等）
 */
export function testPlanReportExport(data: TableQueryParams) {
  return http.post<Blob>(reportUrls.TestPlanReportExportUrl, data, {
    responseType: 'blob',
  });
}

/**
 * 测试计划-报告-单报告导出 PDF（与 spotter 一致：POST /export/{reportId}）
 */
export function testPlanReportExportPdf(reportId: string) {
  return http.post<Blob>(`${reportUrls.TestPlanReportExportUrl}/${reportId}`, undefined, {
    responseType: 'blob',
  });
}

/**
 * 测试计划-报告-批量导出日志
 */
export function testPlanBatchReportExport(data: TableQueryParams) {
  return http.post<Blob>(reportUrls.TestPlanBatchReportExportUrl, data, {
    responseType: 'blob',
  });
}

/**
 * 测试计划-报告-批量导出获取报告 ID 集合
 */
export function testPlanBatchReportExportGetIds(data: TableQueryParams) {
  return http.post(reportUrls.TestPlanBatchReportExportGetIdsUrl, data);
}

/**
 * 任务中心-测试计划执行结果
 */
export function getTestPlanResult(id: string) {
  return http.get(`${reportUrls.GetTestPlanResultUrl}/${id}`);
}
