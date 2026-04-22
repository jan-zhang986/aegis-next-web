/**
 * 需求质量视图 - 详情页图表与指标 Mock 数据
 */

/** 用例执行趋势 */
export const EXECUTION_TREND_DATA = [
  { date: '01-15', 通过: 45, 失败: 5, 阻塞: 2, 通过率: 86.5 },
  { date: '01-16', 通过: 92, 失败: 8, 阻塞: 3, 通过率: 89.3 },
  { date: '01-17', 通过: 118, 失败: 12, 阻塞: 4, 通过率: 88.1 },
  { date: '01-18', 通过: 156, 失败: 15, 阻塞: 5, 通过率: 88.6 },
  { date: '01-19', 通过: 195, 失败: 18, 阻塞: 6, 通过率: 89.0 },
  { date: '01-20', 通过: 238, 失败: 22, 阻塞: 8, 通过率: 88.8 },
];

/** 缺陷趋势 */
export const DEFECT_TREND_DATA = [
  { date: '01-15', 新增: 3, 修复: 0, 遗留: 3 },
  { date: '01-16', 新增: 5, 修复: 2, 遗留: 6 },
  { date: '01-17', 新增: 4, 修复: 3, 遗留: 7 },
  { date: '01-18', 新增: 6, 修复: 4, 遗留: 9 },
  { date: '01-19', 新增: 3, 修复: 5, 遗留: 7 },
  { date: '01-20', 新增: 2, 修复: 4, 遗留: 5 },
];

/** 用例类型分布（含 color/percent） */
export const CASE_TYPE_DATA = [
  { name: 'HTTP接口', value: 372, color: '#60A5FA', percent: 45 },
  { name: 'SQL测试', value: 207, color: '#FBBF24', percent: 25 },
  { name: 'DUBBO接口', value: 149, color: '#34D399', percent: 18 },
  { name: 'WebSocket', value: 66, color: '#A78BFA', percent: 8 },
  { name: 'TCP测试', value: 32, color: '#F87171', percent: 4 },
];

/** 用例优先级分布 */
export const CASE_PRIORITY_DATA = [
  { name: 'P0-核心流程', value: 124, color: '#EF4444', percent: 15 },
  { name: 'P1-重要功能', value: 289, color: '#F59E0B', percent: 35 },
  { name: 'P2-一般功能', value: 330, color: '#3B82F6', percent: 40 },
  { name: 'P3-次要功能', value: 83, color: '#6B7280', percent: 10 },
];

/** 缺陷严重级分布 */
export const DEFECT_SEVERITY_DATA = [
  { name: '致命', value: 2, color: '#DC2626' },
  { name: '严重', value: 5, color: '#F59E0B' },
  { name: '一般', value: 8, color: '#3B82F6' },
  { name: '轻微', value: 3, color: '#10B981' },
];

/** 缺陷状态分布 */
export const DEFECT_STATUS_DATA = [
  { name: '新建', value: 5 },
  { name: '已分配', value: 8 },
  { name: '修复中', value: 4 },
  { name: '待验证', value: 6 },
  { name: '已关闭', value: 12 },
];

/** 失败用例 Top10 */
export const FAILED_CASES_TOP10 = [
  { name: '用户登录_异常场景测试', failCount: 8, failRate: '80%', reason: '接口超时' },
  { name: '订单创建_并发压力测试', failCount: 6, failRate: '60%', reason: '数据库锁超时' },
  { name: '支付接口_异常金额校验', failCount: 5, failRate: '50%', reason: '参数校验失败' },
  { name: '库存扣减_高并发场景', failCount: 4, failRate: '40%', reason: 'Redis连接异常' },
  { name: '商品搜索_大数据量查询', failCount: 4, failRate: '40%', reason: 'ES查询超时' },
  { name: '优惠券计算_复杂规则', failCount: 3, failRate: '30%', reason: '业务逻辑错误' },
  { name: '订单取消_状态流转', failCount: 3, failRate: '30%', reason: '状态机异常' },
  { name: 'WebSocket消息推送', failCount: 2, failRate: '20%', reason: '连接中断' },
  { name: '文件上传_大文件处理', failCount: 2, failRate: '20%', reason: '内存溢出' },
  { name: '数据导出_批量操作', failCount: 2, failRate: '20%', reason: 'SQL执行超时' },
];

/** 慢用例 Top10 */
export const SLOW_CASES_TOP10 = [
  { name: '批量数据导入测试', avgTime: '35.2s', maxTime: '58.3s', execCount: 12 },
  { name: '报表生成_大数据量', avgTime: '28.7s', maxTime: '42.1s', execCount: 8 },
  { name: '数据同步_全量同步', avgTime: '24.3s', maxTime: '36.8s', execCount: 6 },
  { name: '复杂SQL查询测试', avgTime: '18.9s', maxTime: '28.5s', execCount: 15 },
  { name: '图片处理_批量压缩', avgTime: '16.4s', maxTime: '25.2s', execCount: 10 },
  { name: '订单对账_月度汇总', avgTime: '15.1s', maxTime: '22.7s', execCount: 4 },
  { name: '日志分析_全文检索', avgTime: '13.6s', maxTime: '19.8s', execCount: 9 },
  { name: '缓存预热_全量加载', avgTime: '12.3s', maxTime: '18.4s', execCount: 7 },
  { name: '数据清洗_ETL流程', avgTime: '11.8s', maxTime: '17.2s', execCount: 5 },
  { name: '接口链路_全流程', avgTime: '10.5s', maxTime: '15.6s', execCount: 11 },
];

/** 执行人贡献度 */
export const CONTRIBUTOR_DATA = [
  { name: '张三', count: 128 },
  { name: '李四', count: 95 },
  { name: '王五', count: 87 },
  { name: '赵六', count: 73 },
  { name: '孙七', count: 56 },
];

/** 用例变更原因分布 */
export const CASE_CHANGE_REASON_DATA = [
  { name: '需求变更', value: 312, percent: 37.8, color: '#60A5FA' },
  { name: '缺陷修复', value: 198, percent: 24.0, color: '#34D399' },
  { name: '代码重构', value: 124, percent: 15.0, color: '#F59E0B' },
  { name: '环境配置', value: 83, percent: 10.0, color: '#FBBF24' },
  { name: '依赖升级', value: 66, percent: 8.0, color: '#A78BFA' },
  { name: '其他', value: 43, percent: 5.2, color: '#10B981' },
];

/** 测试用例执行阻塞原因分布 */
export const CASE_EXECUTION_BLOCKING_REASON_DATA = [
  { name: '环境不可用', value: 28, percent: 35.0, color: '#F87171' },
  { name: '依赖服务超时', value: 18, percent: 22.5, color: '#FB923C' },
  { name: '数据未准备', value: 12, percent: 15.0, color: '#FBBF24' },
  { name: '权限不足', value: 10, percent: 12.5, color: '#FCD34D' },
  { name: '配置错误', value: 8, percent: 10.0, color: '#DC2626' },
  { name: '其他', value: 4, percent: 5.0, color: '#EF4444' },
];

/** 用例执行明细（合并失败/慢用例，含排名、失败次数、成功次数、耗时、失败率等，默认按执行次数倒序） */
export interface CaseExecutionRow {
  name: string;
  failCount: number;
  successCount: number;
  avgTime: string;
  maxTime: string;
  failRate: string;
  successRate: string;
  failReason: string;
  execCount: number;
}

export const CASE_EXECUTION_LIST: CaseExecutionRow[] = [
  { name: '复杂SQL查询测试', failCount: 5, successCount: 10, avgTime: '18.9s', maxTime: '28.5s', failRate: '33.3%', successRate: '66.7%', failReason: '超时', execCount: 15 },
  { name: '用户登录_异常场景测试', failCount: 8, successCount: 2, avgTime: '3.2s', maxTime: '5.1s', failRate: '80%', successRate: '20%', failReason: '接口超时', execCount: 10 },
  { name: '批量数据导入测试', failCount: 3, successCount: 9, avgTime: '35.2s', maxTime: '58.3s', failRate: '25%', successRate: '75%', failReason: '内存不足', execCount: 12 },
  { name: '订单创建_并发压力测试', failCount: 6, successCount: 4, avgTime: '8.5s', maxTime: '12.2s', failRate: '60%', successRate: '40%', failReason: '数据库锁超时', execCount: 10 },
  { name: '接口链路_全流程', failCount: 2, successCount: 9, avgTime: '10.5s', maxTime: '15.6s', failRate: '18.2%', successRate: '81.8%', failReason: '下游超时', execCount: 11 },
  { name: '报表生成_大数据量', failCount: 2, successCount: 6, avgTime: '28.7s', maxTime: '42.1s', failRate: '25%', successRate: '75%', failReason: 'ES查询超时', execCount: 8 },
  { name: '支付接口_异常金额校验', failCount: 5, successCount: 5, avgTime: '2.1s', maxTime: '3.8s', failRate: '50%', successRate: '50%', failReason: '参数校验失败', execCount: 10 },
  { name: '日志分析_全文检索', failCount: 1, successCount: 8, avgTime: '13.6s', maxTime: '19.8s', failRate: '11.1%', successRate: '88.9%', failReason: '索引缺失', execCount: 9 },
  { name: '库存扣减_高并发场景', failCount: 4, successCount: 6, avgTime: '5.2s', maxTime: '8.4s', failRate: '40%', successRate: '60%', failReason: 'Redis连接异常', execCount: 10 },
  { name: '数据同步_全量同步', failCount: 2, successCount: 4, avgTime: '24.3s', maxTime: '36.8s', failRate: '33.3%', successRate: '66.7%', failReason: '网络中断', execCount: 6 },
  { name: '商品搜索_大数据量查询', failCount: 4, successCount: 6, avgTime: '6.8s', maxTime: '11.2s', failRate: '40%', successRate: '60%', failReason: 'ES查询超时', execCount: 10 },
  { name: '缓存预热_全量加载', failCount: 1, successCount: 6, avgTime: '12.3s', maxTime: '18.4s', failRate: '14.3%', successRate: '85.7%', failReason: '缓存键冲突', execCount: 7 },
].sort((a, b) => b.execCount - a.execCount);

/** 变更热度指标 */
export const CHANGE_HEAT_METRICS = {
  caseIncreaseRate: 16.3,
  newCases: 6781,
  existingCases: 41736,
  caseChangeHeat: 21.0,
  modifiedCases: 1424,
  totalCases: 6781,
};

/** 执行效率指标 */
export const EXECUTION_EFFICIENCY_METRICS = {
  avgExecutionTime: 4.3,
  totalExecutionTime: 27007.5,
  executionCount: 6247,
  manualExecutionHeat: 1.3,
  highFreqRegressionScore: 762.5,
  totalCaseScore: 61159.0,
};

/** 效益指标 */
export const BENEFIT_METRICS = {
  avgUQSScore: 64.9,
  verificationDiscoveryRate: 49.8,
  executabilityRate: 57.9,
  reuseRate: 92.1,
  firstPassRate: 0.0,
  firstPassCount: 0,
  totalExecutionCount: 0,
};

/** 工时偏差指标 */
export const WORK_HOUR_DEVIATION_METRICS = {
  writingDeviationRate: 7.6,
  actualWritingHours: 404.0,
  theoreticalWritingHours: 375.46,
  executionDeviationRate: 51.4,
  actualExecutionMinutes: 10950.13,
  theoreticalExecutionMinutes: 22527.5,
};

/** 复用指标 */
export const REUSE_METRICS = {
  caseReuseRate: 25.9,
  reusedCases: 1753,
  totalCases: 6781,
  workloadReuseRate: 26.7,
  reusedCSScore: 13482.5,
  totalCSScore: 50473.5,
  savedHours: 147.8,
};

/** 工时指标（按复杂度分级） */
export const WORK_HOUR_METRICS = {
  expectedWritingTime: 225276,
  expectedWritingBreakdown: {
    basic: 20377.8,
    medium: 2010.0,
    complex: 139.8,
    highDifficulty: 0.0,
  },
  expectedExecutionTime: 225275,
  expectedExecutionBreakdown: {
    basic: 20377.8,
    medium: 2010.0,
    complex: 140.0,
    highDifficulty: 0.0,
  },
  actualWritingTime: 24240.0,
  actualExecutionTime: 10950.1,
};

/** 代码质量指标 */
export const CODE_QUALITY_METRICS = {
  frontendDefectRate: 2.3,
  frontendDefects: 45,
  frontendCodeLines: 19565,
  backendDefectRate: 1.8,
  backendDefects: 67,
  backendCodeLines: 37222,
  overallDefectRate: 2.0,
  totalDefects: 112,
  totalCodeLines: 56787,
  codeCoverage: 85.7,
  reopenRate: null as number | null,
};

/** 发布指标 */
export const RELEASE_METRICS = {
  changeSuccessRate: 92.5,
  successfulReleases: 37,
  totalReleases: 40,
  changeFailureRate: 7.5,
  rollbackCount: 2,
  hotfixCount: 1,
};
