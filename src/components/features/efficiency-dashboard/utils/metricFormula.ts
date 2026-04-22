/**
 * 指标公式工具函数
 * 从 EfficiencyDashboard.tsx 提取
 */

import type { CaseManagementMetrics } from '@/types/efficiency';
import type { MetricFormula } from '../components/MetricCard';

/**
 * 获取指标公式
 * @param metricKey - 指标键名
 * @param m - 用例管理指标数据
 * @returns 指标公式信息
 */
export function getMetricFormula(
  metricKey: string,
  m: CaseManagementMetrics
): MetricFormula | undefined {
  // 如果 m 为空或未定义，返回 undefined
  if (!m) {
    return undefined;
  }
  switch (metricKey) {
    // ========== UQS质量指标 ==========
    case 'avgUQS':
      return {
        formula: 'UQS = 0.4×缺陷发现率 + 0.3×可执行率 + 0.3×复用率',
        description: 'UQS综合质量评分：缺陷发现率(40%) + 可执行率(30%) + 复用率(30%)',
        params: [
          { name: 'UQS评分', value: (m.avgUQS || 0).toFixed(2), description: '0-100分' },
        ],
      };

    case 'firstPassRate':
      return {
        formula: '首次通过率 = (首次执行通过用例数 / 总执行用例数) × 100%',
        description: '首次通过率：反映研发质量，首次执行即通过的用例比例',
        params: [
          {
            name: '首次通过率',
            value: (m.firstPassRate || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };

    // ========== 复杂度指标 ==========
    case 'totalWriteComplexity':
      return {
        formula: '用例编写总复杂分 = Σ(所有用例的编写复杂度)',
        description: '用例编写总复杂分：所有用例编写复杂度的总和，反映编写工作量',
        params: [
          {
            name: '总复杂分',
            value: (m.totalWriteComplexity || 0).toLocaleString(),
            description: '计算结果',
          },
        ],
      };
    case 'totalExecComplexity':
      return {
        formula: '用例执行总复杂分 = Σ(所有用例的执行复杂度)',
        description: '用例执行总复杂分：所有用例执行复杂度的总和，反映执行工作量',
        params: [
          {
            name: '总复杂分',
            value: (m.totalExecComplexity || 0).toLocaleString(),
            description: '计算结果',
          },
        ],
      };
    case 'avgComplexity':
      return {
        formula: '用例平均复杂度 = 总复杂分 / 总用例数',
        description: '用例平均复杂度：反映用例库的整体复杂度水平',
        params: [
          {
            name: '平均复杂度',
            value: (m.avgComplexity || 0).toFixed(2),
            description: '计算结果',
          },
        ],
      };
    case 'complexityVariance':
      return {
        formula: '用例复杂度方差 = Σ(CS分值 - 平均CS分值)² / 用例数量',
        description:
          '用例复杂度方差：反映用例复杂度的离散程度，值越大说明复杂度差异越大',
        params: [
          { name: '方差', value: (m.complexityVariance || 0).toFixed(2), description: '计算结果' },
          {
            name: '用例数量',
            value: (m.totalCaseCount || 0).toLocaleString(),
            description: '周期内的总用例数（N）',
          },
        ],
      };

    // ========== 工时偏差指标 ==========
    case 'avgWriteTimeDeviation':
      return {
        formula: '编写工时偏差率 = |实际编写工时 - 理论编写工时| / 理论编写工时 × 100%',
        description: '编写工时偏差率：衡量用例编写工时估算准确度',
        params: [
          {
            name: '偏差率',
            value: (m.avgWriteTimeDeviation || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };

    case 'avgExecTimeDeviation':
      return {
        formula: '执行工时偏差率 = |实际执行工时 - 理论执行工时| / 理论执行工时 × 100%',
        description: '执行工时偏差率：衡量用例执行工时估算准确度',
        params: [
          {
            name: '偏差率',
            value: (m.avgExecTimeDeviation || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };

    // ========== 按复杂度分级的工时指标 ==========
    case 'expectedWriteTime':
      return {
        formula: '预期编写时长 = 基于复杂度等级的标准工时',
        description: '预期用例编写时长：按L1、L2、L3、L4复杂度等级的标准编写工时',
        params: [
          {
            name: 'L1复杂度',
            value: ((m.expectedWriteTime?.l1 || 0) * 60).toFixed(1) + ' 分钟',
            description: '预期',
          },
          {
            name: 'L2复杂度',
            value: ((m.expectedWriteTime?.l2 || 0) * 60).toFixed(1) + ' 分钟',
            description: '预期',
          },
          {
            name: 'L3复杂度',
            value: ((m.expectedWriteTime?.l3 || 0) * 60).toFixed(1) + ' 分钟',
            description: '预期',
          },
          {
            name: 'L4复杂度',
            value: ((m.expectedWriteTime?.l4 || 0) * 60).toFixed(1) + ' 分钟',
            description: '预期',
          },
        ],
      };

    case 'actualWriteTime':
      return {
        formula: '实际编写时长 = 周期内测试计划组关联需求的测分编写时间汇总',
        description: '实际用例编写时长：按测试计划组维度统计，同一需求只计算一次',
        params: [
          {
            name: '实际编写时长',
            value: ((m.actualWriteDurationHours || 0) * 60).toFixed(1) + ' 分钟',
            description: '总计',
          },
        ],
      };

    case 'expectedExecTime':
      return {
        formula: '预期执行时长 = 基于复杂度等级的标准执行时间',
        description: '预期用例执行时长：按L1、L2、L3、L4复杂度等级的标准执行时间',
        params: [
          {
            name: 'L1复杂度',
            value: (m.expectedExecTime?.l1 || 0).toFixed(1) + ' 分钟',
            description: '预期',
          },
          {
            name: 'L2复杂度',
            value: (m.expectedExecTime?.l2 || 0).toFixed(1) + ' 分钟',
            description: '预期',
          },
          {
            name: 'L3复杂度',
            value: (m.expectedExecTime?.l3 || 0).toFixed(1) + ' 分钟',
            description: '预期',
          },
          {
            name: 'L4复杂度',
            value: (m.expectedExecTime?.l4 || 0).toFixed(1) + ' 分钟',
            description: '预期',
          },
        ],
      };

    case 'actualExecTime':
      return {
        formula: '实际执行时长 = 周期内测试计划组下所有测试计划的执行时间汇总',
        description: '实际用例执行时长：按测试计划组维度统计，汇总所有测试计划的执行工时',
        params: [
          {
            name: '实际执行时长',
            value: (m.actualExecDurationMinutes || 0).toFixed(1) + ' 分钟',
            description: '总计',
          },
        ],
      };

    case 'writeTimeDeviationByLevel':
      return {
        formula: '编写偏差率 = |实际 - 预期| / 预期 × 100%',
        description: '用例编写时长偏差率：按复杂度等级统计的编写工时偏差',
        params: [
          {
            name: 'L1复杂度',
            value: (m.writeTimeDeviationByLevel?.l1 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
          {
            name: 'L2复杂度',
            value: (m.writeTimeDeviationByLevel?.l2 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
          {
            name: 'L3复杂度',
            value: (m.writeTimeDeviationByLevel?.l3 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
          {
            name: 'L4复杂度',
            value: (m.writeTimeDeviationByLevel?.l4 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
        ],
      };

    case 'execTimeDeviationByLevel':
      return {
        formula: '执行偏差率 = |实际 - 预期| / 预期 × 100%',
        description: '用例执行时长偏差率：按复杂度等级统计的执行时间偏差',
        params: [
          {
            name: 'L1复杂度',
            value: (m.execTimeDeviationByLevel?.l1 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
          {
            name: 'L2复杂度',
            value: (m.execTimeDeviationByLevel?.l2 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
          {
            name: 'L3复杂度',
            value: (m.execTimeDeviationByLevel?.l3 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
          {
            name: 'L4复杂度',
            value: (m.execTimeDeviationByLevel?.l4 || 0).toFixed(1) + '%',
            description: '偏差率',
          },
        ],
      };

    // ========== 复用指标 ==========
    case 'reuseRateByCount':
      return {
        formula: '用例数量复用率 = (复用用例数 / 总用例数) × 100%，总用例数 = 用例模板库+回归用例库+最近2周新增',
        description: '用例数量复用率：衡量用例资产复用程度（按数量统计）；分母为两库及最近2周新增用例总数',
        params: [
          {
            name: '复用率',
            value: (m.reuseRateByCount || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };
    case 'reuseRateByWorkload':
      return {
        formula: '用例工作量复用率 = (复用用例的总CS分值 / 总CS分值) × 100%',
        description: '用例工作量复用率：从工作量角度衡量复用程度',
        params: [
          {
            name: '复用率',
            value: (m.reuseRateByWorkload || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };

    case 'absoluteTimeSavings':
      return {
        formula: '绝对节约时间 = Σ(复用用例的理论编写工时)',
        description: '绝对节约时间：通过复用用例节省的总工时（小时）',
        params: [
          {
            name: '节约时间',
            value: (m.absoluteTimeSavings || 0).toFixed(1) + ' 小时',
            description: '计算结果',
          },
        ],
      };

    // ========== 变更热度指标 ==========
    case 'caseGrowthRate':
      return {
        formula: '用例新增率 = (新增用例数 / 期初用例数) × 100%',
        description: '用例新增率（用例维度）：分子=无引用无执行的新增用例数，分母=两库总用例+最近2周新增',
        params: [
          {
            name: '新增率',
            value: (m.caseGrowthRate || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };

    case 'caseChangeHeat':
      return {
        formula: '用例变更热度 = (修改用例数 / 总用例数) × 100%',
        description: '用例变更热度（用例维度）：分子=变更原因非 COPY 的用例数，分母=当前项目下所有未删除用例（不随时间变动）',
        params: [
          {
            name: '变更热度',
            value: (m.caseChangeHeat || 0).toFixed(2) + '%',
            description: '计算结果',
          },
          {
            name: '修改用例数',
            value: (m.modifiedCaseCount || 0).toString(),
            description: '分子：变更原因非 COPY 的用例数量',
          },
          {
            name: '总用例数',
            value: (m.totalCaseCountInPeriod || 0).toString(),
            description: '分母：当前项目下所有未删除用例，不随时间变动',
          },
        ],
      };

    // ========== 执行效率指标 ==========
    case 'avgCaseExecDuration':
      return {
        formula: '平均执行时长 = Σ执行时长 / 执行次数',
        description: '平均用例执行时长：衡量用例执行效率',
        params: [
          {
            name: '平均时长',
            value: (m.avgCaseExecDuration || 0).toFixed(1) + ' 分钟',
            description: '计算结果',
          },
        ],
      };
    case 'manualCaseExecHeat':
      return {
        formula:
          '高频回归用例工作量占比 = (Σ(高频回归用例的执行 CS 总分) / Σ(所有用例的执行 CS 总分)) × 100%',
        description: '高频回归用例工作量占比：反映高频回归用例在所有用例执行工作量中的占比',
        params: [
          {
            name: '工作量占比',
            value: (m.manualCaseExecHeat || 0).toFixed(2) + '%',
            description: '计算结果',
          },
        ],
      };

    // ========== 统计数据 ==========
    case 'totalCaseCount':
      return {
        formula: '总用例数 = 当前筛选条件下的用例总数',
        description: '总用例数：反映用例资产规模',
        params: [
          {
            name: '总数',
            value: (m.totalCaseCount || 0).toLocaleString(),
            description: '计算结果',
          },
        ],
      };

    default:
      return undefined;
  }
}
