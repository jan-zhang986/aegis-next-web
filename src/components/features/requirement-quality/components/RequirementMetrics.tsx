import { TrendingUp, Activity, Target, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { METRIC_ITEM_TOOLTIPS } from '../constants/metric-tooltips';

/** 单个指标块的 hover 提示（仅 hover 到该块时展示） */
function MetricBlockWithTooltip({
  tooltipKey,
  children,
}: {
  tooltipKey: keyof typeof METRIC_ITEM_TOOLTIPS;
  children: React.ReactNode;
}) {
  const tip = METRIC_ITEM_TOOLTIPS[tooltipKey];
  if (!tip) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="block cursor-help">{children}</div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-[#1a2744] border border-white/10 text-white max-w-md p-4 shadow-xl"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-blue-400 mb-1">{tip.title}</div>
            {tip.description && (
              <div className="text-xs text-gray-400 mb-2">{tip.description}</div>
            )}
          </div>
          <div className="border-t border-white/10 pt-2">
            <div className="text-xs font-semibold text-gray-300 mb-2">计算公式</div>
            <div className="text-sm font-mono text-blue-300 bg-white/5 p-2 rounded border border-white/10 whitespace-pre-line">
              {tip.formula}
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export interface RequirementMetricsProps {
  changeHeatMetrics: {
    caseIncreaseRate: number;
    newCases: number;
    existingCases: number;
    caseChangeHeat: number;
    modifiedCases: number;
    totalCases: number;
  };
  executionEfficiencyMetrics: {
    avgExecutionTime: number;
    totalExecutionTime: number;
    executionCount: number;
    manualExecutionHeat: number;
    highFreqRegressionScore: number;
    totalCaseScore: number;
  };
  benefitMetrics: {
    avgUQSScore: number;
    verificationDiscoveryRate: number;
    executabilityRate: number;
    reuseRate: number;
    firstPassRate: number;
    firstPassCount: number;
    totalExecutionCount: number;
  };
  workHourDeviationMetrics: {
    writingDeviationRate: number;
    actualWritingHours: number;
    theoreticalWritingHours: number;
    executionDeviationRate: number;
    actualExecutionMinutes: number;
    theoreticalExecutionMinutes: number;
  };
  reuseMetrics: {
    caseReuseRate: number;
    reusedCases: number;
    totalCases: number;
    workloadReuseRate: number;
    reusedCSScore: number;
    totalCSScore: number;
    savedHours: number;
  };
  workHourMetrics: {
    expectedWritingTime: number;
    expectedWritingBreakdown: {
      basic: number;
      medium: number;
      complex: number;
      highDifficulty: number;
    };
    expectedExecutionTime: number;
    expectedExecutionBreakdown: {
      basic: number;
      medium: number;
      complex: number;
      highDifficulty: number;
    };
    actualWritingTime: number;
    actualExecutionTime: number;
  };
  codeQualityMetrics: {
    frontendDefectRate: number;
    frontendDefects: number;
    frontendCodeLines: number;
    backendDefectRate: number;
    backendDefects: number;
    backendCodeLines: number;
    overallDefectRate: number;
    totalDefects: number;
    totalCodeLines: number;
    codeCoverage: number;
    /** 缺陷重开率(%)，综合质量总览展示 */
    reopenRate?: number | null;
  };
  releaseMetrics: {
    changeSuccessRate: number;
    successfulReleases: number;
    totalReleases: number;
    changeFailureRate: number;
    rollbackCount: number;
    hotfixCount: number;
  };
}

/** 数值为 null/undefined 时显示 '-'，避免前端 undefined 报错 */
function fmtNum(v: number | undefined | null, suffix = ''): string {
  if (v == null || (typeof v === 'number' && Number.isNaN(v))) return '-';
  return `${v}${suffix}`;
}

export function RequirementMetrics({
  changeHeatMetrics,
  executionEfficiencyMetrics,
  benefitMetrics,
  workHourDeviationMetrics,
  reuseMetrics,
  workHourMetrics,
  codeQualityMetrics,
  releaseMetrics,
}: RequirementMetricsProps) {
  return (
    <div className="space-y-6">
      {/* 需求质量 - 综合质量总览 */}
      <Card className="rounded-2xl bg-white/[0.08] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">综合质量总览</h3>
            <p className="text-sm text-gray-400">需求关键质量指标一览</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <MetricBlockWithTooltip tooltipKey="avgUQS">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">平均UQS评分</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtNum(benefitMetrics?.avgUQSScore)}</div>
              {/* 评级暂隐藏，区间完善后再展示 */}
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="changeSuccessRate">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">变更成功率</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtNum(releaseMetrics?.changeSuccessRate, '%')}</div>
              {/* 评级暂隐藏 */}
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="codeCoverage">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400">代码覆盖率</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtNum(codeQualityMetrics?.codeCoverage, '%')}</div>
              {/* 评级暂隐藏 */}
            </div>
          </MetricBlockWithTooltip>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">缺陷重开率</span>
            </div>
            <div className="text-2xl font-bold text-white">{fmtNum(codeQualityMetrics?.reopenRate, '%')}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <MetricBlockWithTooltip tooltipKey="frontendDefectRate">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">前端缺陷率</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtNum(codeQualityMetrics?.frontendDefectRate, '%')}</div>
              {/* 评级暂隐藏 */}
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="backendDefectRate">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">后端缺陷率</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtNum(codeQualityMetrics?.backendDefectRate, '%')}</div>
              {/* 评级暂隐藏 */}
            </div>
          </MetricBlockWithTooltip>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">缺陷数</span>
            </div>
            <div className="text-2xl font-bold text-white">{fmtNum(codeQualityMetrics?.totalDefects)}</div>
          </div>
          <MetricBlockWithTooltip tooltipKey="changeFailureRate">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">变更失败率</span>
              </div>
              <div className="text-2xl font-bold text-white">{fmtNum(releaseMetrics?.changeFailureRate, '%')}</div>
              {/* 评级暂隐藏 */}
            </div>
          </MetricBlockWithTooltip>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                <span className="text-sm font-semibold text-gray-400">综合评级: -</span>
              </div>
              <div className="text-sm text-gray-400">
                质量健康度: <span className="text-white font-semibold">-</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <div>测试覆盖: <span className="text-green-400 font-semibold">--</span></div>
              <div>自动化率: <span className="text-blue-400 font-semibold">--</span></div>
              <div>缺陷密度: <span className="text-cyan-400 font-semibold">--</span></div>
            </div>
          </div>
        </div>
      </Card>

      {/* 变更热度指标 */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">变更热度指标</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="caseIncreaseRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">用例新增率</div>
                <div className="text-3xl font-bold text-white mb-2">{changeHeatMetrics.caseIncreaseRate} <span className="text-lg">%</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>新增用例数: <span className="text-white font-semibold">{changeHeatMetrics.newCases}</span></div>
                  <div>已有用例数: <span className="text-white font-semibold">{changeHeatMetrics.existingCases}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="caseChangeHeat">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">用例变更热度</div>
                <div className="text-3xl font-bold text-white mb-2">{changeHeatMetrics.caseChangeHeat} <span className="text-lg">%</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>修正用例数: <span className="text-white font-semibold">{changeHeatMetrics.modifiedCases}</span></div>
                  <div>总用例数: <span className="text-white font-semibold">{changeHeatMetrics.totalCases}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 执行效率指标 */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">执行效率指标</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="avgExecutionTime">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">平均用例执行时长</div>
                <div className="text-3xl font-bold text-white mb-2">{executionEfficiencyMetrics.avgExecutionTime} <span className="text-lg">分钟</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>执行总长累计: <span className="text-white font-semibold">{executionEfficiencyMetrics.totalExecutionTime}min</span></div>
                  <div>执行次数: <span className="text-white font-semibold">{executionEfficiencyMetrics.executionCount}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="manualExecutionHeat">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">手动用例执行热度</div>
                <div className="text-3xl font-bold text-white mb-2">{executionEfficiencyMetrics.manualExecutionHeat} <span className="text-lg">%</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>高频回归用例总分: <span className="text-white font-semibold">{executionEfficiencyMetrics.highFreqRegressionScore}</span></div>
                  <div>所有用例总分: <span className="text-white font-semibold">{executionEfficiencyMetrics.totalCaseScore}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 其它效益指标 */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">其它效益指标</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="avgUQS">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">平均UQS评分</div>
                <div className="text-3xl font-bold text-white mb-2">{benefitMetrics.avgUQSScore} <span className="text-lg">分</span></div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div>验证发现率: <span className="text-white font-semibold">{benefitMetrics.verificationDiscoveryRate}</span></div>
                  <div>可执行率: <span className="text-white font-semibold">{benefitMetrics.executabilityRate}</span></div>
                  <div>复用率: <span className="text-white font-semibold">{benefitMetrics.reuseRate}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="firstPassRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">首次通过率</div>
                <div className="text-3xl font-bold text-white mb-2">{benefitMetrics.firstPassRate} <span className="text-lg">%</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>首次执行通过用例数: <span className="text-white font-semibold">{benefitMetrics.firstPassCount}</span></div>
                  <div>总执行用例数: <span className="text-white font-semibold">{benefitMetrics.totalExecutionCount}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 工时倾差指标（整体） */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">工时倾差指标（整体）</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="writingDeviationRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">编写工时偏差率</div>
                <div className="text-3xl font-bold text-white mb-2">{workHourDeviationMetrics.writingDeviationRate} <span className="text-lg">%</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>实际编写工时: <span className="text-white font-semibold">{workHourDeviationMetrics.actualWritingHours}h</span></div>
                  <div>理论编写工时: <span className="text-white font-semibold">{workHourDeviationMetrics.theoreticalWritingHours}h</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="executionDeviationRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">执行工时偏差率</div>
                <div className="text-3xl font-bold text-white mb-2">{workHourDeviationMetrics.executionDeviationRate} <span className="text-lg">%</span></div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>实际执行工时: <span className="text-white font-semibold">{workHourDeviationMetrics.actualExecutionMinutes}min</span></div>
                  <div>理论执行工时: <span className="text-white font-semibold">{workHourDeviationMetrics.theoreticalExecutionMinutes}min</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 复用指标 */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">复用指标</h3>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <MetricBlockWithTooltip tooltipKey="caseReuseRate">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">用例数量复用率</div>
                <div className="text-3xl font-bold text-white mb-1">{reuseMetrics.caseReuseRate} <span className="text-base">%</span></div>
                <div className="text-xs text-gray-400">
                  <div>复用用例数: <span className="text-white font-semibold">{reuseMetrics.reusedCases}</span></div>
                  <div>总用例数: <span className="text-white font-semibold">{reuseMetrics.totalCases}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="workloadReuseRate">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-teal-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">用例工作量复用率</div>
                <div className="text-3xl font-bold text-white mb-1">{reuseMetrics.workloadReuseRate} <span className="text-base">%</span></div>
                <div className="text-xs text-gray-400">
                  <div>复用用例总CS分值: <span className="text-white font-semibold">{reuseMetrics.reusedCSScore}</span></div>
                  <div>总CS分值: <span className="text-white font-semibold">{reuseMetrics.totalCSScore}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="savedHours">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">绝对节省时间</div>
                <div className="text-3xl font-bold text-white mb-1">{reuseMetrics.savedHours} <span className="text-base">小时</span></div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 工时指标（按复杂度分级） */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">工时指标（按复杂度分级）</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="expectedWritingTime">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-1">预期编写时长</div>
                  <div className="text-3xl font-bold text-white">{workHourMetrics.expectedWritingTime} <span className="text-base">min</span></div>
                </div>
              </div>
              <div className="pl-14 space-y-1 text-xs text-gray-400">
                <div className="flex justify-between"><span>基础:</span><span className="text-white font-semibold">{workHourMetrics.expectedWritingBreakdown.basic} min</span></div>
                <div className="flex justify-between"><span>中等:</span><span className="text-white font-semibold">{workHourMetrics.expectedWritingBreakdown.medium} min</span></div>
                <div className="flex justify-between"><span>复杂:</span><span className="text-white font-semibold">{workHourMetrics.expectedWritingBreakdown.complex} min</span></div>
                <div className="flex justify-between"><span>高难度:</span><span className="text-white font-semibold">{workHourMetrics.expectedWritingBreakdown.highDifficulty} min</span></div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="expectedExecutionTime">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-violet-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-1">预期执行时长</div>
                  <div className="text-3xl font-bold text-white">{workHourMetrics.expectedExecutionTime} <span className="text-base">min</span></div>
                </div>
              </div>
              <div className="pl-14 space-y-1 text-xs text-gray-400">
                <div className="flex justify-between"><span>基础:</span><span className="text-white font-semibold">{workHourMetrics.expectedExecutionBreakdown.basic} min</span></div>
                <div className="flex justify-between"><span>中等:</span><span className="text-white font-semibold">{workHourMetrics.expectedExecutionBreakdown.medium} min</span></div>
                <div className="flex justify-between"><span>复杂:</span><span className="text-white font-semibold">{workHourMetrics.expectedExecutionBreakdown.complex} min</span></div>
                <div className="flex justify-between"><span>高难度:</span><span className="text-white font-semibold">{workHourMetrics.expectedExecutionBreakdown.highDifficulty} min</span></div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="actualWritingTime">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">实际编写时长</div>
                <div className="text-3xl font-bold text-white">{workHourMetrics.actualWritingTime} <span className="text-base">min</span></div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="actualExecutionTime">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-1">实际执行时长</div>
                <div className="text-3xl font-bold text-white">{workHourMetrics.actualExecutionTime} <span className="text-base">min</span></div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 代码质量指标 */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">代码质量指标</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="overallDefectRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">总千行代码缺陷率</div>
                <div className="text-3xl font-bold text-white mb-2">{fmtNum(codeQualityMetrics?.overallDefectRate, ' %')}</div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>总缺陷数: <span className="text-white font-semibold">{fmtNum(codeQualityMetrics?.totalDefects)}</span></div>
                  <div>总代码行数: <span className="text-white font-semibold">{fmtNum(codeQualityMetrics?.totalCodeLines)}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="codeCoverage">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">代码覆盖率</div>
                <div className="text-3xl font-bold text-white mb-2">{fmtNum(codeQualityMetrics?.codeCoverage, ' %')}</div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all" style={{ width: `${Number(codeQualityMetrics?.codeCoverage ?? 0)}%` }} />
                  </div>
                  <span className="text-green-400 font-semibold">优秀</span>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="frontendDefectRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Target className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">前端缺陷率</div>
                <div className="text-3xl font-bold text-white mb-2">{fmtNum(codeQualityMetrics?.frontendDefectRate, ' %')}</div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>前端缺陷数: <span className="text-white font-semibold">{fmtNum(codeQualityMetrics?.frontendDefects)}</span></div>
                  <div>前端代码行数: <span className="text-white font-semibold">{fmtNum(codeQualityMetrics?.frontendCodeLines)}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="backendDefectRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">后端缺陷率</div>
                <div className="text-3xl font-bold text-white mb-2">{fmtNum(codeQualityMetrics?.backendDefectRate, ' %')}</div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>后端缺陷数: <span className="text-white font-semibold">{fmtNum(codeQualityMetrics?.backendDefects)}</span></div>
                  <div>后端代码行数: <span className="text-white font-semibold">{fmtNum(codeQualityMetrics?.backendCodeLines)}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>

      {/* 发布指标 */}
      <Card className="rounded-xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">发布指标</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MetricBlockWithTooltip tooltipKey="changeSuccessRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">变更成功率</div>
                <div className="text-3xl font-bold text-white mb-2">{fmtNum(releaseMetrics?.changeSuccessRate, ' %')}</div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>成功发布数: <span className="text-white font-semibold">{fmtNum(releaseMetrics?.successfulReleases)}</span></div>
                  <div>总发布数: <span className="text-white font-semibold">{fmtNum(releaseMetrics?.totalReleases)}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
          <MetricBlockWithTooltip tooltipKey="changeFailureRate">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">变更失败率</div>
                <div className="text-3xl font-bold text-white mb-2">{fmtNum(releaseMetrics?.changeFailureRate, ' %')}</div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>回滚次数: <span className="text-white font-semibold">{fmtNum(releaseMetrics?.rollbackCount)}</span></div>
                  <div>热修复次数: <span className="text-white font-semibold">{fmtNum(releaseMetrics?.hotfixCount)}</span></div>
                </div>
              </div>
            </div>
          </MetricBlockWithTooltip>
        </div>
      </Card>
    </div>
  );
}
