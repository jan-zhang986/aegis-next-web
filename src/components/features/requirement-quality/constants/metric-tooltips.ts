/**
 * 需求质量视图 - 各子指标的 hover 提示（与效能大屏口径一致）
 * 按「单个指标」展示，hover 到对应指标块再显示，而非整张卡片
 */

export interface MetricTooltip {
  title: string;
  description?: string;
  formula: string;
}

/** 按子指标 key 存储，用于包裹单个指标块 */
export const METRIC_ITEM_TOOLTIPS: Record<string, MetricTooltip> = {
  // 变更热度
  caseIncreaseRate: {
    title: '用例新增率',
    description: '新增用例数 = 第一次执行测试计划之后新创建的用例数；期初用例数 = 第一次执行测试计划时的用例总数。与效能大屏口径一致（按计划+用例行统计，不去重）。',
    formula: '用例新增率 = (新增用例数 / 期初用例数) × 100%',
  },
  caseChangeHeat: {
    title: '用例变更热度',
    description: '与效能大屏口径一致（按计划+用例行统计，不去重）',
    formula: '用例变更热度 = (修正用例数 / 总用例数) × 100%',
  },
  // 执行效率
  avgExecutionTime: {
    title: '平均用例执行时长',
    description: '与效能大屏口径一致',
    formula: '平均执行时长 = Σ执行时长 / 执行次数',
  },
  manualExecutionHeat: {
    title: '手动用例执行热度',
    description: '高频回归用例工作量占比，与效能大屏口径一致',
    formula: '高频回归工作量占比 = Σ(高频用例的CS总分) / Σ(所有用例的CS总分) × 100%',
  },
  // 其它效益
  avgUQS: {
    title: '平均UQS评分',
    description: '与效能大屏口径一致',
    formula: 'UQS = 0.4×缺陷发现率 + 0.3×可执行率 + 0.3×复用率',
  },
  firstPassRate: {
    title: '首次通过率',
    description: '从 case_execution_record 按 (plan_id, case_id) 取最早一条执行结果',
    formula: '首次通过率 = (首次执行通过用例数 / 总执行用例数) × 100%',
  },
  // 工时倾差
  writingDeviationRate: {
    title: '编写工时偏差率',
    formula: '编写工时偏差率 = |实际编写工时 - 理论编写工时| / 理论编写工时 × 100%',
  },
  executionDeviationRate: {
    title: '执行工时偏差率',
    formula: '执行工时偏差率 = |实际执行工时 - 理论执行工时| / 理论执行工时 × 100%',
  },
  // 复用
  caseReuseRate: {
    title: '用例数量复用率',
    formula: '用例数量复用率 = (复用用例数 / 总用例数) × 100%',
  },
  workloadReuseRate: {
    title: '用例工作量复用率',
    formula: '工作量复用率 = (复用用例总CS分值 / 总CS分值) × 100%',
  },
  savedHours: {
    title: '绝对节省时间',
    formula: '绝对节约时间 = Σ(复用用例的理论编写工时)',
  },
  // 工时分级
  expectedWritingTime: {
    title: '预期编写时长',
    formula: '预期编写时长 = 基于 L1～L4 复杂度等级的标准编写工时',
  },
  expectedExecutionTime: {
    title: '预期执行时长',
    formula: '预期执行时长 = 基于 L1～L4 复杂度等级的标准执行工时',
  },
  actualWritingTime: {
    title: '实际编写时长',
    formula: '实际编写时长 = 需求关联的测分编写时间（人天×8h→分钟）',
  },
  actualExecutionTime: {
    title: '实际执行时长',
    formula: '实际执行时长 = 需求下测试计划组内执行时间汇总',
  },
  // 代码质量
  overallDefectRate: {
    title: '总千行代码缺陷率',
    formula: '缺陷率(%) = (缺陷数 / 代码行数) × 1000',
  },
  codeCoverage: {
    title: '代码覆盖率',
    formula: '代码覆盖率 = 测试覆盖的代码行数占比',
  },
  frontendDefectRate: {
    title: '前端缺陷率',
    formula: '前端缺陷率(%) = (前端缺陷数 / 前端代码行数) × 1000',
  },
  backendDefectRate: {
    title: '后端缺陷率',
    formula: '后端缺陷率(%) = (后端缺陷数 / 后端代码行数) × 1000',
  },
  // 发布
  changeSuccessRate: {
    title: '变更成功率',
    formula: '变更成功率 = (成功发布数 / 总发布数) × 100%',
  },
  changeFailureRate: {
    title: '变更失败率',
    formula: '变更失败率 = (失败/回滚/热修复) / 总发布数 × 100%',
  },
};
