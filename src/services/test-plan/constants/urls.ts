/**
 * 测试计划 API URL 常量
 * 从 MeterSphere 迁移
 */

// ==================== 测试计划基础 ====================

// 测试计划模块树
export const GetTestPlanModuleUrl = '/test-plan/module/tree';
// 添加测试计划模块树
export const addTestPlanModuleUrl = '/test-plan/module/add';
// 更新计划测试模块树
export const updateTestPlanModuleUrl = '/test-plan/module/update';
// 移动计划测试模块树
export const MoveTestPlanModuleUrl = '/test-plan/module/move';
// 删除计划测试模块树
export const DeleteTestPlanModuleUrl = '/test-plan/module/delete';
// 测试计划模块树数量
export const GetTestPlanModuleCountUrl = '/test-plan/module/count';
// 测试计划列表
export const GetTestPlanListUrl = '/test-plan/page';
// 测试计划列表 (无分页)
export const GetTestPlanListWithoutPageUrl = '/test-plan/test-plan-list';
// 创建测试计划
export const AddTestPlanUrl = '/test-plan/add';
// 功能用例列表
export const GetTestPlanCaseListUrl = '/test-plan/association/page';
// 获取测试计划详情
export const GetTestPlanDetailUrl = '/test-plan';
// 更新测试计划
export const UpdateTestPlanUrl = '/test-plan/update';
// 批量删除测试计划
export const batchDeletePlanUrl = '/test-plan/batch-delete';
// 删除测试计划
export const deletePlanUrl = '/test-plan/delete';
// 测试计划批量编辑
export const BatchEditTestPlanUrl = '/test-plan/batch-edit';
// 获取统计数量
export const getStatisticalCountUrl = '/test-plan/getCount';
// 归档
export const archivedPlanUrl = '/test-plan/archived';
// 批量复制
export const batchCopyPlanUrl = '/test-plan/batch-copy';
// 批量移动
export const batchMovePlanUrl = '/test-plan/batch-move';
// 批量归档
export const batchArchivedPlanUrl = '/test-plan/batch-archived';
// 计划详情缺陷管理列表
export const planDetailBugPageUrl = '/test-plan/bug/page';
// 关注测试计划
export const followPlanUrl = '/test-plan/edit/follower';
// 生成报告
export const GenerateReportUrl = '/test-plan/report/auto-gen';
// 复制测试计划
export const copyTestPlanUrl = '/test-plan/copy';
// 测试计划通过率执行进度
export const planPassRateUrl = '/test-plan/statistics';
// 测试计划-计划组下拉
export const TestPlanGroupOptionsUrl = '/test-plan/group-list';
// 测试计划-拖拽测试计划
export const dragPlanOnGroupUrl = '/test-plan/sort';
// 测试计划-创建定时任务
export const ConfigScheduleUrl = '/test-plan/schedule-config';
// 测试计划-批量配置定时任务
export const BatchConfigScheduleUrl = '/test-plan/batch-schedule-config';
// 测试计划-计划&计划组-执行
export const ExecuteSinglePlanUrl = '/test-plan-execute/single';
// 测试计划-计划&计划组-执行&批量执行
export const BatchExecutePlanUrl = '/test-plan-execute/batch';
// 测试计划-删除定时任务
export const DeleteScheduleTaskUrl = '/test-plan/schedule-config-delete';
// 计划详情-执行历史
export const PlanDetailExecuteHistoryUrl = '/test-plan/his/page';
// 测试计划-复制
export const TestPlanAndGroupCopyUrl = '/test-plan/copy';
// 测试计划-计划详情-获取执行人选项
export const GetTestPlanExecutorOptionsUrl = '/test-plan/functional/case/user-option';
// 测试计划-计划详情-获取用户列表
export const GetTestPlanUsersUrl = '/test-plan/functional/case/user-option';

// ==================== 功能用例相关 ====================

// 计划详情-功能用例列表
export const GetPlanDetailFeatureCaseListUrl = '/test-plan/functional/case/page';
// 计划详情-功能用例-获取模块数量
export const GetFeatureCaseModuleCountUrl = '/test-plan/functional/case/module/count';
// 计划详情-功能用例模块树
export const GetFeatureCaseModuleUrl = '/test-plan/functional/case/tree';
// 计划详情-功能用例列表-拖拽排序
export const SortFeatureCaseUrl = '/test-plan/functional/case/sort';
// 计划详情-功能用例-取消关联用例
export const DisassociateCaseUrl = '/test-plan/functional/case/disassociate';
// 计划详情-功能用例-批量取消关联用例
export const BatchDisassociateCaseUrl = '/test-plan/functional/case/batch/disassociate';
// 计划详情-功能用例-执行
export const RunFeatureCaseUrl = '/test-plan/functional/case/run';
// 计划详情-功能用例列表-批量移动
export const BatchMoveFeatureCaseUrl = '/test-plan/functional/case/batch/move';
// 测试计划-用例详情-缺陷列表
export const GetAssociatedBugUrl = '/test-plan/functional/case/has/associate/bug/page';
// 测试计划-用例详情
export const TestPlanCaseDetailUrl = '/test-plan/functional/case/detail';
// 测试计划-用例详情-关联缺陷
export const TestPlanAssociateBugUrl = '/test-plan/functional/case/associate/bug';
// 测试计划-用例详情-取消关联缺陷
export const TestPlanCancelBugUrl = '/test-plan/functional/case/disassociate/bug';
// 计划详情-功能用例-批量执行
export const BatchRunCaseUrl = '/test-plan/functional/case/batch/run';
// 计划详情-功能用例-批量更新执行人
export const BatchUpdateCaseExecutorUrl = '/test-plan/functional/case/batch/update/executor';
// 计划详情-功能用例-执行历史
export const ExecuteHistoryUrl = '/test-plan/functional/case/exec/history';
// 功能用例-关联用例-接口用例-API
export const TestPlanApiAssociatedPageUrl = '/test-plan/association/api/page';
// 功能用例-关联用例-接口用例-CASE
export const TestPlanCaseAssociatedPageUrl = '/test-plan/association/api/case/page';
// 功能用例-关联用例-接口用例-CASE
export const TestPlanScenarioAssociatedPageUrl = '/test-plan/association/api/scenario/page';

// ==================== 接口用例相关 ====================

// 计划详情-接口用例列表
export const GetPlanDetailApiCaseListUrl = '/test-plan/api/case/page';
// 计划详情-接口用例模块树
export const GetApiCaseModuleUrl = '/test-plan/api/case/tree';
// 计划详情-接口用例-获取模块数量
export const GetApiCaseModuleCountUrl = '/test-plan/api/case/module/count';
// 计划详情-接口用例列表-拖拽排序
export const SortApiCaseUrl = '/test-plan/api/case/sort';
// 计划详情-接口用例列表-执行
export const RunApiCaseUrl = '/test-plan/api/case/run';
// 计划详情-接口用例列表-取消关联用例
export const DisassociateApiCaseUrl = '/test-plan/api/case/disassociate';
// 计划详情-接口用例列表-批量取消关联用例
export const BatchDisassociateApiCaseUrl = '/test-plan/api/case/batch/disassociate';
// 计划详情-接口用例列表-批量执行
export const BatchRunApiCaseUrl = '/test-plan/api/case/batch/run';
// 计划详情-接口用例列表-批量移动
export const BatchMoveApiCaseUrl = '/test-plan/api/case/batch/move';
// 计划详情-接口用例列表-报告详情
export const ApiCaseReportDetailUrl = '/test-plan/api/case/report/get';
// 计划详情-接口用例列表-步骤详情
export const ApiCaseReportDetailStepUrl = '/test-plan/api/case/report/get/detail';
// 测试计划-用例详情-关联缺陷到接口用例
export const AssociatedBugToApiCaseUrl = '/test-plan/api/case/associate/bug';
// 测试计划-用例详情-取消关联缺陷到接口用例
export const CancelBugFromApiCaseUrl = '/test-plan/api/case/disassociate/bug';
// 测试计划-用例详情-批量关联缺陷到接口用例
export const BatchLinkBugToApiCaseUrl = '/test-plan/api/case/batch/associate/bug';
// 测试计划-用例详情-批量关联缺陷到接口用例
export const BatchAssociatedBugToApiCaseUrl = '/test-plan/api/case/batch/associate/bug';
// 测试计划-用例详情-获取未关联的缺陷列表（接口用例）
export const GetUnAssociatedApiBugUrl = '/test-plan/api/case/un-associate/bug/page';
// 测试计划-用例详情-获取关联用例列表（接口用例）
export const GetUnAssociatedListUrl = '/test-plan/association/page';

// ==================== 接口场景相关 ====================

// 计划详情-接口场景列表
export const GetPlanDetailApiScenarioListUrl = '/test-plan/api/scenario/page';
// 计划详情-接口场景模块树
export const GetApiScenarioModuleUrl = '/test-plan/api/scenario/tree';
// 计划详情-接口场景-获取模块数量
export const GetApiScenarioModuleCountUrl = '/test-plan/api/scenario/module/count';
// 计划详情-接口场景列表-拖拽排序
export const SortApiScenarioUrl = '/test-plan/api/scenario/sort';
// 计划详情-接口场景列表-执行
export const RunApiScenarioUrl = '/test-plan/api/scenario/run';
// 计划详情-接口场景列表-取消关联用例
export const DisassociateApiScenarioUrl = '/test-plan/api/scenario/disassociate';
// 计划详情-接口场景列表-批量取消关联用例
export const BatchDisassociateApiScenarioUrl = '/test-plan/api/scenario/batch/disassociate';
// 计划详情-接口场景列表-批量执行
export const BatchRunApiScenarioUrl = '/test-plan/api/scenario/batch/run';
// 计划详情-接口场景列表-批量移动
export const BatchMoveApiScenarioUrl = '/test-plan/api/scenario/batch/move';
// 计划详情-接口场景列表-报告详情
export const ApiScenarioReportDetailUrl = '/test-plan/api/scenario/report/get';
// 计划详情-接口场景列表-步骤详情
export const ApiScenarioReportDetailStepUrl = '/test-plan/api/scenario/report/get/detail';
// 测试计划-用例详情-关联缺陷到场景用例
export const AssociatedBugToScenarioCaseUrl = '/test-plan/api/scenario/associate/bug';
// 测试计划-用例详情-取消关联缺陷到场景用例
export const CancelBugFromScenarioCaseUrl = '/test-plan/api/scenario/disassociate/bug';
// 测试计划-用例详情-批量关联缺陷到场景用例
export const BatchLinkBugToScenarioCaseUrl = '/test-plan/api/scenario/batch/associate/bug';
// 测试计划-用例详情-批量关联缺陷到场景用例
export const BatchAssociatedBugToScenarioCaseUrl = '/test-plan/api/scenario/batch/associate/bug';
// 测试计划-用例详情-获取未关联的缺陷列表（场景用例）
export const GetUnAssociatedScenarioBugUrl = '/test-plan/api/scenario/un-associate/bug/page';
// 测试计划-用例详情-批量关联缺陷到功能用例
export const BatchAssociatedBugToFunctionalCaseUrl = '/test-plan/functional/case/batch/associate/bug';
// 测试计划-用例详情-批量关联缺陷到脑图用例
export const BatchAssociatedBugToMinderCaseUrl = '/test-plan/minder/case/batch/associate/bug';
// 测试计划-用例详情-批量关联缺陷到用例
export const BatchAssociatedBugToCaseUrl = '/test-plan/functional/case/batch/associate/bug';

// ==================== 测试计划脑图 ====================

// 获取测试计划脑图（与 spotter-metersphere-frontend 一致：/test-plan/mind/data/:id 路径参数）
export const GetPlanMindDataUrl = '/test-plan/mind/data';
// 兼容旧路径（部分后端仍用 /test-plan/minder/get/:id）
export const GetTestPlanMinderUrl = '/test-plan/minder/get';
// 编辑测试计划脑图（与 spotter-metersphere 后端一致：POST /test-plan/mind/data/edit）
export const EditPlanMinderUrl = '/test-plan/mind/data/edit';
// 测试计划-任务结果
export const TaskResultUrl = '/test-plan-execute/task-result';

// ==================== 报告相关 URL（在 reportUrls 中定义） ====================

export const testPlanUrls = {
  // 基础
  GetTestPlanModuleUrl,
  addTestPlanModuleUrl,
  updateTestPlanModuleUrl,
  MoveTestPlanModuleUrl,
  DeleteTestPlanModuleUrl,
  GetTestPlanModuleCountUrl,
  GetTestPlanListUrl,
  GetTestPlanListWithoutPageUrl,
  AddTestPlanUrl,
  GetTestPlanCaseListUrl,
  GetTestPlanDetailUrl,
  UpdateTestPlanUrl,
  batchDeletePlanUrl,
  deletePlanUrl,
  BatchEditTestPlanUrl,
  getStatisticalCountUrl,
  archivedPlanUrl,
  batchCopyPlanUrl,
  batchMovePlanUrl,
  batchArchivedPlanUrl,
  planDetailBugPageUrl,
  followPlanUrl,
  GenerateReportUrl,
  copyTestPlanUrl,
  planPassRateUrl,
  TestPlanGroupOptionsUrl,
  dragPlanOnGroupUrl,
  ConfigScheduleUrl,
  BatchConfigScheduleUrl,
  ExecuteSinglePlanUrl,
  BatchExecutePlanUrl,
  DeleteScheduleTaskUrl,
  PlanDetailExecuteHistoryUrl,
  TestPlanAndGroupCopyUrl,
  GetTestPlanExecutorOptionsUrl,
  GetTestPlanUsersUrl,
  // 功能用例
  GetPlanDetailFeatureCaseListUrl,
  GetFeatureCaseModuleCountUrl,
  GetFeatureCaseModuleUrl,
  SortFeatureCaseUrl,
  DisassociateCaseUrl,
  BatchDisassociateCaseUrl,
  RunFeatureCaseUrl,
  BatchMoveFeatureCaseUrl,
  GetAssociatedBugUrl,
  TestPlanCaseDetailUrl,
  TestPlanAssociateBugUrl,
  TestPlanCancelBugUrl,
  BatchRunCaseUrl,
  BatchUpdateCaseExecutorUrl,
  ExecuteHistoryUrl,
  TestPlanApiAssociatedPageUrl,
  TestPlanCaseAssociatedPageUrl,
  TestPlanScenarioAssociatedPageUrl,
  // 接口用例
  GetPlanDetailApiCaseListUrl,
  GetApiCaseModuleUrl,
  GetApiCaseModuleCountUrl,
  SortApiCaseUrl,
  RunApiCaseUrl,
  DisassociateApiCaseUrl,
  BatchDisassociateApiCaseUrl,
  BatchRunApiCaseUrl,
  BatchMoveApiCaseUrl,
  ApiCaseReportDetailUrl,
  ApiCaseReportDetailStepUrl,
  AssociatedBugToApiCaseUrl,
  CancelBugFromApiCaseUrl,
  BatchLinkBugToApiCaseUrl,
  BatchAssociatedBugToApiCaseUrl,
  GetUnAssociatedApiBugUrl,
  GetUnAssociatedListUrl,
  // 接口场景
  GetPlanDetailApiScenarioListUrl,
  GetApiScenarioModuleUrl,
  GetApiScenarioModuleCountUrl,
  SortApiScenarioUrl,
  RunApiScenarioUrl,
  DisassociateApiScenarioUrl,
  BatchDisassociateApiScenarioUrl,
  BatchRunApiScenarioUrl,
  BatchMoveApiScenarioUrl,
  ApiScenarioReportDetailUrl,
  ApiScenarioReportDetailStepUrl,
  AssociatedBugToScenarioCaseUrl,
  CancelBugFromScenarioCaseUrl,
  BatchLinkBugToScenarioCaseUrl,
  BatchAssociatedBugToScenarioCaseUrl,
  GetUnAssociatedScenarioBugUrl,
  BatchAssociatedBugToFunctionalCaseUrl,
  BatchAssociatedBugToMinderCaseUrl,
  BatchAssociatedBugToCaseUrl,
  // 脑图
  GetPlanMindDataUrl,
  GetTestPlanMinderUrl,
  EditPlanMinderUrl,
  TaskResultUrl,
} as const;
