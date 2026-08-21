/**
 * 需求质量视图 
 */

/** 列表请求（系分 6.2） */
export interface RequirementQualityListRequest {
  projectId?: string;
  /** 项目ID列表，多选时传此字段；不传或空=全部项目 */
  projectIds?: string[];
  requirementListId?: string;
  storyIds?: string[];
  status?: string;
  /** 执行周期筛选：开始时间戳(毫秒) */
  executionPeriodStart?: number | null;
  /** 执行周期筛选：结束时间戳(毫秒) */
  executionPeriodEnd?: number | null;
  /** 排序字段：executionPeriodStart|executionPeriodEnd|passRate|executionRate|defectCount|reopenRate|codeCoverage|storyName|owner */
  sortBy?: string | null;
  /** 排序方向：asc|desc */
  sortOrder?: string | null;
  current: number;
  pageSize: number;
}

/** 列表行（系分 6.2 响应字段，负责人/执行周期/状态来自测试计划表） */
export interface RequirementQualityListItemDTO {
  storyId: string;
  storyName: string;
  owner?: string | null;
  /** 状态：未开始/进行中/已完成/已归档（来自 test_plan.status） */
  status?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  iterationId?: string | null;
  iterationName?: string | null;
  caseTotalCount: number;
  caseExecutedCount: number;
  executionRate: number;
  passRate: number;
  /** 首次通过率(%)，与详情一致：首次执行通过数/已执行数 */
  firstPassRate?: number | null;
  executionPeriodStart?: number | null;
  executionPeriodEnd?: number | null;
  avgWriteDeviationRate?: number | null;
  avgExecDeviationRate?: number | null;
  defectCount?: number | null;
  reopenRate?: number | null;
  codeCoverage?: number | null;
  frontendDefectRate?: number | null;
  backendDefectRate?: number | null;
  totalDefectRatePer1k?: number | null;
  changeFailureRate?: number | null;
  changeSuccessRate?: number | null;
  deployTotalCount?: number | null;
  deployFailureCount?: number | null;
}

/** 分页响应（后端 Pager） */
export interface Pager<T> {
  list: T;
  total: number;
  pageSize: number;
  current: number;
}

/** 概览响应（系分 6.3，需求→测试计划→用例 全局聚合） */
export interface RequirementQualityOverviewDTO {
  requirementTotal: number;
  caseTotalCount?: number | null;
  caseExecutedCount?: number | null;
  executionRate?: number | null;
  passRate?: number | null;
  /** 首次通过率(%)，与列表/详情一致 */
  firstPassRate?: number | null;
  avgWriteDeviationRate?: number | null;
  avgExecDeviationRate?: number | null;
  /** 千行代码缺陷率平均值（有该率的需求的 totalDefectRatePer1k 取平均），后端全局聚合 */
  avgDefectRatePer1k?: number | null;
}

/** 筛选项（项目/需求列表/状态，供下拉接入） */
export interface RequirementQualityFilterOptionsDTO {
  projectOptions: { id: string; name: string }[];
  requirementOptions: { id: string; name: string }[];
  statusOptions: { id: string; name: string }[];
}

/** 详情 - 用例执行明细行（按计划+用例不去重，排名、用例名、失败/成功次数、耗时、失败率等） */
export interface RequirementQualityCaseExecutionRowDTO {
  planId?: string | null;
  caseId?: string | null;
  name: string;
  failCount: number;
  successCount: number;
  execCount: number;
  avgTimeSeconds: number;
  maxTimeSeconds: number;
  failRate: number;
  successRate: number;
  failReason?: string | null;
}

/** 详情 - 执行人贡献度（执行人姓名及执行的用例数） */
export interface RequirementQualityExecutorContributionDTO {
  executorId?: string | null;
  executorName?: string | null;
  caseCount: number;
}

/** 详情 - 原因分布项（饼图用：名称 + 数量） */
export interface RequirementQualityReasonDistributionDTO {
  name: string;
  value: number;
}

/** 详情 - 用例执行趋势（按日：日期、通过/失败/阻塞数、通过率） */
export interface RequirementQualityExecutionTrendDTO {
  date: string;
  passed: number;
  failed: number;
  blocked: number;
  passRate: number;
}

/** 详情 - 复用指标（与效能大屏口径一致） */
export interface RequirementQualityReuseMetricsDTO {
  reuseRateByCount?: number;
  reuseRateByWorkload?: number;
  absoluteTimeSavingsHours?: number;
  reusedCaseCount?: number;
  totalCaseCount?: number;
  reusedCsTotal?: number;
  totalCsTotal?: number;
}

/** 详情 - 工时偏差指标（整体） */
export interface RequirementQualityWorkHourDeviationDTO {
  writingDeviationRate?: number;
  actualWritingHours?: number;
  theoreticalWritingHours?: number;
  executionDeviationRate?: number;
  actualExecutionMinutes?: number;
  theoreticalExecutionMinutes?: number;
}

/** 详情 - 其它效益指标（平均UQS、首次通过率等） */
export interface RequirementQualityBenefitMetricsDTO {
  avgUQSScore?: number;
  verificationDiscoveryRate?: number;
  executabilityRate?: number;
  reuseRate?: number;
  firstPassRate?: number;
  firstPassCount?: number;
  totalExecutionCount?: number;
}

/** 详情 - 变更热度指标（与效能大屏口径：用例新增率、用例变更热度及分子分母） */
export interface RequirementQualityChangeHeatDTO {
  caseIncreaseRate?: number;
  newCases?: number;
  existingCases?: number;
  caseChangeHeat?: number;
  modifiedCases?: number;
  totalCases?: number;
}

/** 详情 - 执行效率指标（与效能大屏口径：平均用例执行时长、手动用例执行热度及分子分母） */
export interface RequirementQualityExecutionEfficiencyDTO {
  avgExecutionTime?: number;
  totalExecutionTime?: number;
  executionCount?: number;
  manualExecutionHeat?: number;
  highFreqRegressionScore?: number;
  totalCaseScore?: number;
}

/** 详情 - 工时指标按复杂度分级（L1=基础/L2=中等/L3=复杂/L4=高难度，单位分钟） */
export interface RequirementQualityWorkHourByLevelDTO {
  expectedWriteMinutesL1?: number;
  expectedWriteMinutesL2?: number;
  expectedWriteMinutesL3?: number;
  expectedWriteMinutesL4?: number;
  expectedExecMinutesL1?: number;
  expectedExecMinutesL2?: number;
  expectedExecMinutesL3?: number;
  expectedExecMinutesL4?: number;
  actualWriteMinutesTotal?: number;
  actualExecMinutesTotal?: number;
}

/** 详情响应（系分 6.4.1 概览块 + 用例执行明细 + 执行人贡献度 + 阻塞/变更原因分布，周期/状态与列表一致） */
export interface RequirementQualityDetailDTO {
  storyId: string;
  storyName: string;
  owner?: string | null;
  status?: string | null;
  /** 执行周期开始时间戳(毫秒)，与列表一致 */
  executionPeriodStart?: number | null;
  /** 执行周期结束时间戳(毫秒)，与列表一致 */
  executionPeriodEnd?: number | null;
  projectId?: string | null;
  projectName?: string | null;
  iterationId?: string | null;
  iterationName?: string | null;
  caseTotalCount: number;
  caseExecutedCount: number;
  executionRate: number;
  passRate: number;
  defectCount?: number | null;
  /** 用例执行明细（排名、失败/成功次数、耗时、失败率等） */
  caseExecutionList?: RequirementQualityCaseExecutionRowDTO[] | null;
  /** 执行人贡献度（执行人姓名及执行的用例数，按用例数降序） */
  executorContributionList?: RequirementQualityExecutorContributionDTO[] | null;
  /** 测试用例执行阻塞原因分布（名称+数量） */
  blockReasonDistribution?: RequirementQualityReasonDistributionDTO[] | null;
  /** 用例变更原因分布（名称+数量） */
  changeReasonDistribution?: RequirementQualityReasonDistributionDTO[] | null;
  /** 用例执行趋势（按日：日期、通过/失败/阻塞数、通过率） */
  executionTrendList?: RequirementQualityExecutionTrendDTO[] | null;
  /** 用例优先级分布（名称+数量） */
  priorityDistribution?: RequirementQualityReasonDistributionDTO[] | null;
  /** 复用指标（用例数量/工作量复用率、绝对节省时间） */
  reuseMetrics?: RequirementQualityReuseMetricsDTO | null;
  /** 工时指标按复杂度分级（预期/实际编写与执行时长） */
  workHourByLevel?: RequirementQualityWorkHourByLevelDTO | null;
  /** 工时偏差指标（整体）：编写/执行的实际与理论工时及偏差率 */
  workHourDeviation?: RequirementQualityWorkHourDeviationDTO | null;
  /** 其它效益指标：平均UQS、首次通过率等 */
  benefitMetrics?: RequirementQualityBenefitMetricsDTO | null;
  /** 变更热度指标（用例新增率、用例变更热度及分子分母） */
  changeHeatMetrics?: RequirementQualityChangeHeatDTO | null;
  /** 执行效率指标（平均用例执行时长、手动用例执行热度及分子分母） */
  executionEfficiencyMetrics?: RequirementQualityExecutionEfficiencyDTO | null;
  codeCoverage?: number | null;
  frontendDefectRate?: number | null;
  backendDefectRate?: number | null;
  totalDefectRatePer1k?: number | null;
  frontendDefectCount?: number | null;
  backendDefectCount?: number | null;
  frontendLocChanged?: number | null;
  backendLocChanged?: number | null;
  changeFailureRate?: number | null;
  changeSuccessRate?: number | null;
  deployTotalCount?: number | null;
  deployFailureCount?: number | null;
  reopenRate?: number | null;
}
