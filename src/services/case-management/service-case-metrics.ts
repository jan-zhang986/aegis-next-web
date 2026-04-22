/**
 * 用例效能指标服务
 * 提供项目维度和用户维度的效能数据查询
 */

import axios from 'axios';
import { http } from '@/utils/request';
import { CASE_METRICS_URLS } from './constants/urls';

// ==================== 类型定义 ====================

/**
 * 项目概览指标（与后端ProjectOverviewDTO对齐）
 */
export interface ProjectOverviewMetrics {
  projectId: string;

  // ========== UQS质量指标 (2个) ==========
  avgUQS: number;                    // 用例质量综合评分（UQS）(0-100)
  firstPassRate: number;             // 测试计划首次通过率 (%)
  // UQS子指标（可选）
  defectDiscoveryRate?: number;      // 缺陷发现率 (%)
  executableRate?: number;           // 可执行率 (%)
  reuseExecutionRate?: number;        // 复用率 (%)

  // ========== 复杂度指标 (4个) ==========
  totalWriteComplexity: number;      // 用例编写总复杂分
  totalExecComplexity: number;       // 用例执行总复杂分
  avgComplexity: number;             // 用例平均复杂度
  complexityVariance: number;        // 用例复杂度方差

  // ========== 工时指标 - 整体偏差 (2个) ==========
  avgWriteTimeDeviation: number;     // 平均编写工时偏差率 (%)
  avgExecTimeDeviation: number;      // 平均执行工时偏差率 (%)

  // ========== 工时指标 - 按复杂度分级 (6个嵌套对象) ==========
  expectedWriteTime: {               // 预期用例编写时长（按复杂度等级）
    l1: number;                      // L1复杂度 (分钟)
    l2: number;                      // L2复杂度 (分钟)
    l3: number;                      // L3复杂度 (分钟)
    l4: number;                      // L4复杂度 (分钟)
  };
  actualWriteTime: {                 // 实际用例编写时长（按复杂度等级）
    l1: number;
    l2: number;
    l3: number;
    l4: number;
  };
  expectedExecTime: {                // 预期用例执行时长（按复杂度等级）
    l1: number;                      // L1复杂度 (分钟)
    l2: number;                      // L2复杂度 (分钟)
    l3: number;                      // L3复杂度 (分钟)
    l4: number;                      // L4复杂度 (分钟)
  };
  actualExecTime: {                  // 实际用例执行时长（按复杂度等级）
    l1: number;
    l2: number;
    l3: number;
    l4: number;
  };
  writeTimeDeviationByLevel: {       // 用例编写时长偏差率（按复杂度等级）(%)
    l1: number;
    l2: number;
    l3: number;
    l4: number;
  };
  execTimeDeviationByLevel: {        // 用例执行时长偏差率（按复杂度等级）(%)
    l1: number;
    l2: number;
    l3: number;
    l4: number;
  };

  // ========== 复用降本指标 (3个) ==========
  reuseRateByCount: number;          // 用例数量复用率 (%)
  reuseRateByWorkload: number;       // 用例工作量复用率 (%)
  absoluteTimeSavings: number;       // 复用绝对节约工时 (小时)

  // ========== 变更热度指标 (2个) ==========
  caseGrowthRate: number;            // 用例新增率 (%)
  caseChangeHeat: number;            // 用例变更热度（被修改用例数）

  // ========== 执行效率指标 (3个) ==========
  avgCaseExecDuration: number;       // 平均用例执行时长 (分钟)
  manualCaseExecHeat: number;        // 手动用例执行热度 (%)
  topFrequentCases: Array<{          // 手动用例高执行次数top
    caseId: string;
    caseName: string;
    execCount: number;
    complexity: number;
  }>;

  // ========== 额外统计数据 ==========
  totalCaseCount?: number;           // 总用例数
  effectiveCaseCount?: number;       // 有效用例数：单位时间内两库新增（按 create_time）
  reusedCaseCount?: number;          // 复用用例数（总数）
  directReuseCount?: number;         // 直接复用数（仅改标题）
  adaptReuseCount?: number;          // 适配复用数（改了其它）
  totalCaseCountForReuse?: number;   // 复用指标用总用例数 = 用例模板库+回归用例库+最近2周新增

  // ========== 分子分母数据（用于前端展示计算公式验证）==========
  
  // 用例新增率的分子分母
  newCaseCount?: number;             // 新增用例数（分子）
  periodStartCaseCount?: number;     // 期初用例数（分母）
  
  // 平均用例执行时长的分子分母
  totalExecDurationMs?: number;      // 执行时长总和（毫秒，分子）
  totalExecCount?: number;           // 执行次数（分母）
  
  // 手动用例执行热度的分子分母
  highFreqCsTotal?: number;          // 高频回归用例CS总分（分子）
  allExecCsTotal?: number;           // 所有执行用例CS总分（分母）
  
  // 首次通过率的分子分母
  firstPassCount?: number;           // 首次执行通过用例数（分子）
  firstExecCount?: number;           // 首次执行总用例数（分母）
  
  // 编写工时偏差率的分子分母
  actualWriteDurationHours?: number; // 实际编写工时（小时，分子）
  expectedWriteDurationHours?: number;// 理论编写工时（小时，分母）
  
  // 执行工时偏差率的分子分母
  actualExecDurationMinutes?: number;// 实际执行工时（分钟，分子）
  expectedExecDurationMinutes?: number;// 理论执行工时（分钟，分母）
  
  // 用例工作量复用率的分子分母
  reusedCsTotal?: number;            // 复用用例总CS分值（分子）
  totalCsScore?: number;             // 总CS分值（分母）
  
  // 用例变更热度的分子分母
  modifiedCaseCount?: number;        // 周期内修改的用例数量（分子）
  totalCaseCountInPeriod?: number;   // 周期内总的用例数量（分母）
}

/**
 * 用例变更原因分布
 */
export interface ChangeReasonDistribution {
  changeReason: string;         // 变更原因代码
  changeReasonName: string;     // 变更原因名称
  count: number;                // 变更次数
  percentage: number;           // 占比 %
}

/**
 * 用例阻塞原因分布
 */
export interface BlockedReasonDistribution {
  blockReason: string;          // 阻塞原因代码
  blockReasonName: string;      // 阻塞原因名称
  count: number;                // 阻塞次数
  percentage: number;           // 占比 %
}

/**
 * 需求信息（来自飞书Meego）
 */
export interface Requirement {
  storyId: string;              // 需求ID
  storyName: string;            // 需求名称
  relatedTestPlanCount: number; // 关联测试计划数
  relatedCaseCount: number;     // 关联用例数（去重）
  defectCount: number;          // 缺陷数
  testAnalysisTime: number;     // 测分时间（人天）
}

/**
 * 用例信息（含关联的需求信息）
 */
export interface CaseWithRequirement {
  caseId: string;               // 用例ID
  caseName: string;             // 用例名称
  caseNum: number;              // 用例编号
  csScore: number;              // CS复杂度分值
  complexityLevel: string;      // 复杂度等级
  storyId?: string;             // 关联的需求ID（可能为null）
  storyName?: string;           // 关联的需求名称（可能为null）
  testPlanId?: string;          // 关联的测试计划ID（可能为null）
  testPlanName?: string;        // 关联的测试计划名称（可能为null）
  changeReason?: string;        // 变更原因
  blockReason?: string;         // 阻塞原因
  createTime: number;           // 创建时间
}

/**
 * Dashboard查询请求参数
 */
export interface DashboardQueryParams {
  projectId?: string;           // 项目ID（必填）
  startTime?: number;           // 开始时间戳（毫秒）
  endTime?: number;             // 结束时间戳（毫秒）
  timeDimension?: 'DAY' | 'WEEK' | 'MONTH';  // 时间维度
}

/**
 * 用例详情及CS值（与后端CaseDetailWithCSDTO对齐）
 */
export interface CaseDetailWithCS {
  caseId: string;               // 用例ID
  caseNum: string;              // 用例编号
  caseName: string;             // 用例名称
  projectId: string;            // 项目ID
  moduleId?: string;           // 模块ID
  moduleName?: string;          // 模块名称
  createUser?: string;          // 创建人
  createUserName?: string;       // 创建人名称
  createTime?: number;          // 创建时间
  updateTime?: number;          // 更新时间
  csScore: number;              // CS总分
  cognitiveScore?: number;      // 认知复杂度得分
  preconditionScore?: number;  // 前置条件复杂度得分
  stepDetailScore?: number;     // 步骤细节复杂度得分
  csFactorC1?: number;          // C1：标题长度得分
  csFactorC2?: number;          // C2：风险等级得分
  csFactorC3?: number;          // C3：前置条件数量
  csFactorC4?: number;          // C4：复杂数据准备
  csFactorC5?: number;          // C5：操作步骤数
  csFactorC6?: number;          // C6：验证点数
  csFactorC7?: number;          // C7：逻辑分支数
  description?: string;         // 用例描述
  prerequisite?: string;         // 前置条件
}

/**
 * 用例列表查询请求参数
 */
export interface CaseListQueryParams {
  projectId?: string;           // 项目ID
  metricType: string;           // 指标类型（必填）
  dimension?: string;           // 维度类型: personal(个人) 或 project(项目)
  dimensionValue?: string;      // 维度值: 用户ID或项目ID，或'all'表示全部
  startTime?: number;           // 开始时间戳（毫秒）
  endTime?: number;             // 结束时间戳（毫秒）
  pageNum?: number;             // 页码，从1开始，默认1
  pageSize?: number;            // 每页大小，默认20
}

/**
 * 用例列表响应
 */
export interface CaseListResponse {
  caseList: CaseDetailWithCS[]; // 用例列表
  total: number;                // 总记录数
  pageNum?: number;             // 当前页码
  pageSize?: number;            // 每页大小
}

// ==================== API 方法 ====================

/**
 * 获取项目概览指标
 * 后端返回数组，前端取第一个元素
 * 
 * @param dimension 维度类型：personal(个人) 或 project(项目)
 * @param projectId 项目ID（'all'或'ALL'表示全部）
 * @param userId 用户ID（'all'表示全部）
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 项目概览指标数据
 */
export async function getProjectOverview(
  dimension?: string,
  projectId?: string,
  userId?: string,
  startTime?: number,
  endTime?: number
): Promise<ProjectOverviewMetrics> {
  const params: any = {
    module: CASE_METRICS_URLS.MODULE  // 添加模块标识：spotter_aegis
  };
  if (dimension) params.dimension = dimension;
  // 传递 projectId，即使是 'ALL' 也传递（后端需要知道是查询全部还是特定项目）
  if (projectId) {
    params.projectId = projectId === 'ALL' ? 'ALL' : projectId;
  }
  if (userId) {
    params.userId = userId;
  }
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: ProjectOverviewMetrics[] }>(
    CASE_METRICS_URLS.GET_PROJECT_OVERVIEW,
    { params }
  );

  // 处理响应数据
  if (response.data.code === 200 || response.data.code === 100200) {
    const data = response.data.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as ProjectOverviewMetrics;
    }
  }
  
  return {} as ProjectOverviewMetrics;
}

/**
 * 获取用例变更原因分布
 * 
 * @param projectId 项目ID
 * @param userId 用户ID
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 变更原因分布数据（Map格式）
 */
export async function getChangeReasonDistribution(
  projectId?: string,
  userId?: string,
  startTime?: number,
  endTime?: number
): Promise<Record<string, number>> {
  const params: any = {
    module: CASE_METRICS_URLS.MODULE
  };
  if (projectId) {
    params.projectId = projectId === 'ALL' ? 'ALL' : projectId;
  }
  if (userId) {
    params.userId = userId;
  }
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: Record<string, number> }>(
    CASE_METRICS_URLS.GET_CHANGE_REASON_DISTRIBUTION,
    { params }
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data || {};
  }
  
  return {};
}

/**
 * 获取用例阻塞原因分布
 * 
 * @param projectId 项目ID
 * @param userId 用户ID
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 阻塞原因分布数据（Map格式）
 */
export async function getBlockedReasonDistribution(
  projectId?: string,
  userId?: string,
  startTime?: number,
  endTime?: number
): Promise<Record<string, number>> {
  const params: any = {
    module: CASE_METRICS_URLS.MODULE  // 添加模块标识：spotter_aegis
  };
  // 传递 projectId，即使是 'ALL' 也传递
  if (projectId) {
    params.projectId = projectId === 'ALL' ? 'ALL' : projectId;
  }
  // 传递 userId，即使是 'all' 也传递
  if (userId) {
    params.userId = userId;
  }
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: Record<string, number> }>(
    CASE_METRICS_URLS.GET_BLOCKED_REASON_DISTRIBUTION,
    { params }
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data || {};
  }
  
  return {};
}

/**
 * 获取个人效能统计
 * 
 * @param params 查询参数（需要包含 userId）
 * @returns 个人效能统计数据
 */
export async function getPersonalStats(params: DashboardQueryParams & { userId: string }): Promise<any> {
  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: any }>(
    CASE_METRICS_URLS.GET_PERSONAL_STATS,
    { params }
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data;
  }
  
  return null;
}

/**
 * 获取需求列表（支持模糊搜索）
 * 
 * @param keyword 搜索关键词（需求ID或需求名称）
 * @param projectId 项目ID
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 需求列表
 */
export async function getRequirementsList(
  keyword?: string,
  projectId?: string,
  startTime?: number,
  endTime?: number
): Promise<Requirement[]> {
  const params: any = {
    module: CASE_METRICS_URLS.MODULE  // 添加模块标识：spotter_aegis
  };
  if (keyword) params.keyword = keyword;
  // 传递 projectId，即使是 'ALL' 也传递
  if (projectId) {
    params.projectId = projectId === 'ALL' ? 'ALL' : projectId;
  }
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: Requirement[] }>(
    CASE_METRICS_URLS.GET_REQUIREMENTS_LIST,
    { params }
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data || [];
  }
  
  return [];
}

/**
 * 根据变更原因查询用例列表
 * 
 * @param changeReason 变更原因
 * @param projectId 项目ID
 * @param userId 用户ID
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 用例列表（含需求信息）
 */
export async function getCasesByChangeReason(
  changeReason: string,
  projectId?: string,
  userId?: string,
  startTime?: number,
  endTime?: number
): Promise<CaseWithRequirement[]> {
  const params: any = {
    module: CASE_METRICS_URLS.MODULE,
    changeReason
  };
  // 传递 projectId，即使是 'ALL' 也传递
  if (projectId) {
    params.projectId = projectId === 'ALL' ? 'ALL' : projectId;
  }
  // 传递 userId，即使是 'all' 也传递
  if (userId) {
    params.userId = userId;
  }
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: CaseWithRequirement[] }>(
    CASE_METRICS_URLS.GET_CASES_BY_CHANGE_REASON,
    { params }
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data || [];
  }
  
  return [];
}

/**
 * 根据阻塞原因查询用例列表
 * 
 * @param blockReason 阻塞原因
 * @param projectId 项目ID
 * @param userId 用户ID
 * @param startTime 开始时间戳
 * @param endTime 结束时间戳
 * @returns 用例列表（含需求信息）
 */
export async function getCasesByBlockReason(
  blockReason: string,
  projectId?: string,
  userId?: string,
  startTime?: number,
  endTime?: number
): Promise<CaseWithRequirement[]> {
  const params: any = {
    module: CASE_METRICS_URLS.MODULE,
    blockReason
  };
  // 传递 projectId，即使是 'ALL' 也传递
  if (projectId) {
    params.projectId = projectId === 'ALL' ? 'ALL' : projectId;
  }
  // 传递 userId，即使是 'all' 也传递
  if (userId) {
    params.userId = userId;
  }
  if (startTime) params.startTime = startTime;
  if (endTime) params.endTime = endTime;

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.get<{ code: number; data: CaseWithRequirement[] }>(
    CASE_METRICS_URLS.GET_CASES_BY_BLOCK_REASON,
    { params }
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data || [];
  }
  
  return [];
}

/**
 * 根据指标类型查询用例列表及其CS值
 * 
 * @param params 查询参数（必须包含 metricType）
 * @returns 用例列表响应
 */
export async function getCaseListByMetric(
  params: CaseListQueryParams
): Promise<CaseListResponse> {
  // 确保必填参数存在
  if (!params.metricType) {
    throw new Error('指标类型(metricType)不能为空');
  }

  // 设置默认值
  const requestParams: CaseListQueryParams = {
    pageNum: 1,
    pageSize: 20,
    ...params,
  };

  // 直接使用 axios 请求完整 URL，参考 SnapTestModule 的配置方式
  const response = await axios.post<{ code: number; data: CaseListResponse }>(
    CASE_METRICS_URLS.GET_CASE_LIST_BY_METRIC,
    requestParams
  );
  
  if (response.data.code === 200 || response.data.code === 100200) {
    return response.data.data || { caseList: [], total: 0 };
  }
  
  return { caseList: [], total: 0 };
}

// ==================== 辅助方法 ====================

/**
 * 格式化时间范围为查询参数
 * 
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 时间戳对象
 */
export function formatTimeRange(startDate: Date, endDate: Date) {
  return {
    startTime: startDate.getTime(),
    endTime: endDate.getTime(),
  };
}

/**
 * 获取最近N天的时间范围
 * 
 * @param days 天数
 * @returns 时间范围对象
 */
export function getRecentDaysRange(days: number = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return formatTimeRange(startDate, endDate);
}

/**
 * 获取本周时间范围
 * 
 * @returns 时间范围对象
 */
export function getThisWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 周日为0，转换为7
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek + 1); // 周一
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  return formatTimeRange(startDate, endDate);
}

/**
 * 获取本月时间范围
 * 
 * @returns 时间范围对象
 */
export function getThisMonthRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  return formatTimeRange(startDate, endDate);
}

