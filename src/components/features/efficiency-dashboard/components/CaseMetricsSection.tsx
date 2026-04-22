/**
 * CaseMetricsSection 组件
 * 用例管理指标分组组件，包含所有用例管理相关的指标卡片和图表
 * 从 EfficiencyDashboard.tsx 提取（行1595-2620）
 */

import React from 'react';
import {
  Activity,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  Target,
  AlertCircle,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MetricCard } from './MetricCard';
import { formatNumber } from '@/utils/format';
import { getMetricFormula } from '../utils/metricFormula';
import type { CaseManagementMetrics } from '@/types/efficiency';
import type { Requirement } from '@/services/case-management/service-case-metrics';

/**
 * CaseMetricsSection 组件 Props
 */
export interface CaseMetricsSectionProps {
  // 指标数据
  metrics: {
    caseManagement: CaseManagementMetrics;
  };
  // 项目选择
  selectedProject: string;
  // 时间范围
  cachedTimeRange: {
    startTime: number | undefined;
    endTime: number | undefined;
  };
  // 指标点击处理
  handleMetricClick: (metricKey: string) => void;
  // 图表数据
  reuseRequirementChartData: {
    chartData: any[];
    requirementIds: string[];
    requirementIdToColor: Record<string, string>;
    requirementIdToName: Record<string, string>;
  };
  caseReuseTrendData: Array<{
    month: string;
    rate: number;
    savedTime: number;
    requirements: Requirement[];
  }>;
  requirementChartData: {
    chartData: any[];
    requirementIds: string[];
    requirementIdToColor: Record<string, string>;
    requirementIdToName: Record<string, string>;
  };
  caseManagementTrendData: Array<{
    date: string;
    expectedWritingDuration: number;
    actualWritingDuration: number;
    expectedExecutionTime: number;
    actualExecutionTime: number;
    passRate: number;
    requirementCount: number;
    requirements: Requirement[];
  }>;
  // Hover 状态
  hoveredRequirement: {
    reqId: string;
    reqName: string;
    x: number;
    y: number;
    chartType: 'reuse' | 'workload';
  } | null;
  setHoveredRequirement: React.Dispatch<React.SetStateAction<{
    reqId: string;
    reqName: string;
    x: number;
    y: number;
    chartType: 'reuse' | 'workload';
  } | null>>;
  // 需求列表弹窗
  openRequirementListModal: (date: string, requirements: Requirement[]) => void;
}

/**
 * CaseMetricsSection 组件
 */
export const CaseMetricsSection = React.memo<CaseMetricsSectionProps>(function CaseMetricsSection({
  metrics,
  selectedProject,
  cachedTimeRange,
  handleMetricClick,
  reuseRequirementChartData,
  caseReuseTrendData,
  requirementChartData,
  caseManagementTrendData,
  hoveredRequirement,
  setHoveredRequirement,
    openRequirementListModal,
}: CaseMetricsSectionProps) {
  return (
    <>
      {/* 复杂度指标 (4个) */}
      <div className="mb-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            复杂度指标
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="用例编写总复杂分"
            value={formatNumber(metrics.caseManagement.totalWriteComplexity || 0)}
            icon={BarChart3}
            color="text-purple-400"
            formula={getMetricFormula('totalWriteComplexity', metrics.caseManagement)}
            metricKey="totalWriteComplexity"
            onClick={() => handleMetricClick('totalWriteComplexity')}
          />
          <MetricCard
            title="用例执行总复杂分"
            value={formatNumber(metrics.caseManagement.totalExecComplexity || 0)}
            icon={BarChart3}
            color="text-blue-400"
            formula={getMetricFormula('totalExecComplexity', metrics.caseManagement)}
            metricKey="totalExecComplexity"
            onClick={() => handleMetricClick('totalExecComplexity')}
          />
          <MetricCard
            title="用例平均复杂度"
            value={(metrics.caseManagement.avgComplexity || 0).toFixed(1)}
            icon={Target}
            color="text-cyan-400"
            formula={getMetricFormula('avgComplexity', metrics.caseManagement)}
            metricKey="avgComplexity"
            onClick={() => handleMetricClick('avgComplexity')}
            rightSideInfo={[
              { label: '总复杂分', value: (metrics.caseManagement.totalWriteComplexity || 0).toLocaleString() },
              { label: '总用例数', value: metrics.caseManagement.totalCaseCount || '--' }
            ]}
          />
          <MetricCard
            title="用例复杂度方差"
            value={(metrics.caseManagement.complexityVariance || 0).toFixed(1)}
            icon={Activity}
            color="text-orange-400"
            formula={getMetricFormula('complexityVariance', metrics.caseManagement)}
            metricKey="complexityVariance"
            onClick={() => handleMetricClick('complexityVariance')}
            rightSideInfo={[
              { label: '总复杂度', value: (metrics.caseManagement.totalWriteComplexity || 0).toLocaleString() },
              { label: '平均复杂度', value: (metrics.caseManagement.avgComplexity || 0).toFixed(1) },
              { label: '用例数量', value: (metrics.caseManagement.totalCaseCount || 0).toLocaleString() }
            ]}
          />
        </div>
      </div>

      {/* 变更热度指标 (2个) */}
      <div className="mb-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            变更热度指标
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="用例新增率"
            value={(metrics.caseManagement.caseGrowthRate || 0).toFixed(1)}
            unit="%"
            icon={TrendingUp}
            color="text-purple-400"
            formula={getMetricFormula('caseGrowthRate', metrics.caseManagement)}
            metricKey="caseGrowthRate"
            onClick={() => handleMetricClick('caseGrowthRate')}
            rightSideInfo={[
              { label: '新增用例数', value: metrics.caseManagement.newCaseCount ?? '--' },
              { label: '期初用例数', value: metrics.caseManagement.periodStartCaseCount ?? '--' }
            ]}
          />
          <MetricCard
            title="用例变更热度"
            value={(metrics.caseManagement.caseChangeHeat || 0).toFixed(1)}
            unit="%"
            icon={Activity}
            color="text-orange-400"
            formula={getMetricFormula('caseChangeHeat', metrics.caseManagement)}
            metricKey="caseChangeHeat"
            onClick={() => handleMetricClick('caseChangeHeat')}
            rightSideInfo={[
              { label: '修改用例数', value: metrics.caseManagement.modifiedCaseCount ?? '--' },
              { label: '总用例数', value: metrics.caseManagement.totalCaseCountInPeriod ?? '--' }
            ]}
          />
        </div>
      </div>

      {/* 执行效率指标 (2个) */}
      <div className="mb-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            执行效率指标
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="平均用例执行时长"
            value={(metrics.caseManagement.avgCaseExecDuration || 0).toFixed(1)}
            unit="分钟"
            icon={Clock}
            color="text-yellow-400"
            formula={getMetricFormula('avgCaseExecDuration', metrics.caseManagement)}
            metricKey="avgCaseExecDuration"
            onClick={() => handleMetricClick('avgCaseExecDuration')}
            rightSideInfo={[
              { 
                label: '执行时长总和', 
                value: metrics.caseManagement.totalExecDurationMs !== undefined 
                  ? ((metrics.caseManagement.totalExecDurationMs / 60000).toFixed(1) + 'min')
                  : '--' 
              },
              { label: '执行次数', value: metrics.caseManagement.totalExecCount ?? '--' }
            ]}
          />
          <MetricCard
            title="手动用例执行热度"
            value={(metrics.caseManagement.manualCaseExecHeat || 0).toFixed(1)}
            unit="%"
            icon={Activity}
            color="text-red-400"
            formula={getMetricFormula('manualCaseExecHeat', metrics.caseManagement)}
            metricKey="manualCaseExecHeat"
            onClick={() => handleMetricClick('manualCaseExecHeat')}
            rightSideInfo={[
              { label: '高频回归用例CS总分', value: metrics.caseManagement.highFreqCsTotal?.toFixed(1) ?? '--' },
              { label: '所有用例CS总分', value: metrics.caseManagement.allExecCsTotal?.toFixed(1) ?? '--' }
            ]}
          />
        </div>
      </div>

      {/* UQS质量指标 (2个) */}
      <div className="mb-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            UQS质量指标
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="平均UQS评分"
            value={(metrics.caseManagement.avgUQS || 0).toFixed(1)}
            unit="分"
            icon={Target}
            color="text-green-400"
            formula={getMetricFormula('avgUQS', metrics.caseManagement)}
            metricKey="avgUQS"
            onClick={() => handleMetricClick('avgUQS')}
            rightSideInfo={[
              { 
                label: '缺陷发现率', 
                value: metrics.caseManagement.defectDiscoveryRate !== undefined 
                  ? metrics.caseManagement.defectDiscoveryRate 
                  : '--'
              },
              { 
                label: '可执行率', 
                value: metrics.caseManagement.executableRate !== undefined 
                  ? metrics.caseManagement.executableRate 
                  : '--'
              },
              { 
                label: '复用率', 
                value: metrics.caseManagement.reuseExecutionRate !== undefined 
                  ? metrics.caseManagement.reuseExecutionRate 
                  : '--'
              }
            ]}
          />
          <MetricCard
            title="首次通过率"
            value={(metrics.caseManagement.firstPassRate || 0).toFixed(1)}
            unit="%"
            icon={CheckCircle2}
            color="text-blue-400"
            formula={getMetricFormula('firstPassRate', metrics.caseManagement)}
            metricKey="firstPassRate"
            onClick={() => handleMetricClick('firstPassRate')}
            rightSideInfo={[
              { label: '首次执行通过用例数', value: metrics.caseManagement.firstPassCount ?? '--' },
              { label: '总执行用例数', value: metrics.caseManagement.firstExecCount ?? '--' }
            ]}
          />
        </div>
      </div>

      {/* 工时指标 - 整体偏差 (2个) */}
      <div className="mb-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            工时偏差指标（整体）
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="编写工时偏差率"
            value={(metrics.caseManagement.avgWriteTimeDeviation || 0).toFixed(1)}
            unit="%"
            icon={Clock}
            color="text-blue-400"
            formula={getMetricFormula('avgWriteTimeDeviation', metrics.caseManagement)}
            metricKey="avgWriteTimeDeviation"
            onClick={() => handleMetricClick('avgWriteTimeDeviation')}
            rightSideInfo={[
              { label: '实际编写工时', value: metrics.caseManagement.actualWriteDurationHours !== undefined ? (metrics.caseManagement.actualWriteDurationHours.toFixed(2) + 'h') : '--' },
              { label: '理论编写工时', value: metrics.caseManagement.expectedWriteDurationHours !== undefined ? (metrics.caseManagement.expectedWriteDurationHours.toFixed(2) + 'h') : '--' }
            ]}
          />
          <MetricCard
            title="执行工时偏差率"
            value={(metrics.caseManagement.avgExecTimeDeviation || 0).toFixed(1)}
            unit="%"
            icon={Clock}
            color="text-cyan-400"
            formula={getMetricFormula('avgExecTimeDeviation', metrics.caseManagement)}
            metricKey="avgExecTimeDeviation"
            onClick={() => handleMetricClick('avgExecTimeDeviation')}
            rightSideInfo={[
              { label: '实际执行工时', value: metrics.caseManagement.actualExecDurationMinutes !== undefined ? (metrics.caseManagement.actualExecDurationMinutes.toFixed(2) + 'min') : '--' },
              { label: '理论执行工时', value: metrics.caseManagement.expectedExecDurationMinutes !== undefined ? (metrics.caseManagement.expectedExecDurationMinutes.toFixed(2) + 'min') : '--' }
            ]}
          />
        </div>
      </div>

      {/* 复用指标 (3个) */}
      <div>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            复用指标
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="用例数量复用率"
            value={(metrics.caseManagement.reuseRateByCount || 0).toFixed(1)}
            unit="%"
            icon={TrendingUp}
            color="text-green-400"
            formula={getMetricFormula('reuseRateByCount', metrics.caseManagement)}
            metricKey="reuseRateByCount"
            onClick={() => handleMetricClick('reuseRateByCount')}
            rightSideInfo={[
              { label: '复用用例数（总数）', value: metrics.caseManagement.reusedCaseCount ?? '--' },
              { label: '直接复用数', value: metrics.caseManagement.directReuseCount ?? '--' },
              { label: '适配复用数', value: metrics.caseManagement.adaptReuseCount ?? '--' },
              { label: '总用例数（两库+最近2周新增）', value: metrics.caseManagement.totalCaseCountForReuse ?? metrics.caseManagement.totalCaseCount ?? '--' }
            ]}
          />
          <MetricCard
            title="用例工作量复用率"
            value={(metrics.caseManagement.reuseRateByWorkload || 0).toFixed(1)}
            unit="%"
            icon={TrendingUp}
            color="text-emerald-400"
            formula={getMetricFormula('reuseRateByWorkload', metrics.caseManagement)}
            metricKey="reuseRateByWorkload"
            onClick={() => handleMetricClick('reuseRateByWorkload')}
            rightSideInfo={[
              { label: '复用用例总CS分值', value: metrics.caseManagement.reusedCsTotal?.toFixed(1) ?? '--' },
              { label: '总CS分值', value: metrics.caseManagement.totalCsScore?.toFixed(1) ?? '--' }
            ]}
          />
          <MetricCard
            title="绝对节约时间"
            value={(metrics.caseManagement.absoluteTimeSavings || 0).toFixed(1)}
            unit="小时"
            icon={Zap}
            color="text-yellow-400"
            formula={getMetricFormula('absoluteTimeSavings', metrics.caseManagement)}
            metricKey="absoluteTimeSavings"
            onClick={() => handleMetricClick('absoluteTimeSavings')}
          />
        </div>
        
        {/* 复用指标趋势图 - 跟随复用指标卡片的筛选 */}
        <div className="mt-6">
          <div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6" 
            style={{ width: '100%' }}
            onMouseLeave={() => {
              // 当鼠标离开图表容器时，清除hover状态
              if (hoveredRequirement?.chartType === 'reuse') {
                setHoveredRequirement(null);
              }
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">复用指标趋势</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart 
                data={reuseRequirementChartData.chartData}
                onMouseLeave={() => {
                  // 当鼠标离开图表时，清除hover状态
                  if (hoveredRequirement?.chartType === 'reuse') {
                    setHoveredRequirement(null);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ value: '复用率(%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' } }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#9CA3AF" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#9CA3AF' }}
                  label={{ value: '节省时长(h)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' } }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#fff', marginBottom: '4px' }}
                  itemStyle={{ padding: '2px 0' }}
                  formatter={(value: any, name: string, props: any) => {
                    // 如果是需求，不在 Tooltip 中显示（需求名称已显示在柱状图上）
                    if (name.startsWith('req_')) {
                      return null;
                    }
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="line"
                  formatter={(value) => {
                    // 如果是需求，不显示在图例中
                    if (value.startsWith('req_')) {
                      return null;
                    }
                    return <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{value}</span>;
                  }}
                />
                {/* 需求数量 - 堆叠柱状图，每个需求一个颜色 */}
                {reuseRequirementChartData.requirementIds.map((reqId) => (
                  <Bar
                    key={reqId}
                    yAxisId="requirement"
                    dataKey={`req_${reqId}`}
                    stackId="requirements"
                    fill={reuseRequirementChartData.requirementIdToColor[reqId]}
                    name={`req_${reqId}`}
                    legendType="none"
                    radius={reuseRequirementChartData.requirementIds.indexOf(reqId) === reuseRequirementChartData.requirementIds.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    label={(props: any) => {
                      const { x, y, width, value, height } = props;
                      // 只有当值大于0且height存在时才显示标签（确保标签在柱子内部）
                      if (value === 0 || value === undefined || !height || height < 10) return null;
                      const reqName = reuseRequirementChartData.requirementIdToName[reqId] || '未命名需求';
                      // 如果名称太长，截断并添加省略号
                      const displayName = reqName.length > 8 ? reqName.substring(0, 8) + '...' : reqName;
                      
                      // 在 SVG 坐标系中，y 是当前段的顶部，height 是当前段的高度（像素）
                      // 中间位置 = y + height / 2
                      const centerY = y + height / 2;
                      
                      return (
                        <text
                          x={x + width / 2}
                          y={centerY}
                          fill="#fff"
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight="600"
                          dominantBaseline="middle"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                        >
                          {displayName}
                        </text>
                      );
                    }}
                    onMouseEnter={(data: any, index: number, e: any) => {
                      const reqName = reuseRequirementChartData.requirementIdToName[reqId] || '未命名需求';
                      // 只有当名称被截断时才显示hover提示
                      if (reqName.length > 8) {
                        const mouseEvent = e as MouseEvent;
                        setHoveredRequirement({
                          reqId,
                          reqName,
                          x: mouseEvent.clientX,
                          y: mouseEvent.clientY,
                          chartType: 'reuse'
                        });
                      }
                    }}
                    onMouseMove={(data: any, index: number, e: any) => {
                      const reqName = reuseRequirementChartData.requirementIdToName[reqId] || '未命名需求';
                      // 只有当名称被截断时才更新hover提示位置
                      if (reqName.length > 8 && hoveredRequirement?.reqId === reqId) {
                        const mouseEvent = e as MouseEvent;
                        setHoveredRequirement({
                          reqId,
                          reqName,
                          x: mouseEvent.clientX,
                          y: mouseEvent.clientY,
                          chartType: 'reuse'
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredRequirement(null);
                    }}
                    onClick={(data: any, index: number, e: any) => {
                      // 找到对应的需求
                      const dataPoint = caseReuseTrendData[index];
                      if (dataPoint && dataPoint.requirements) {
                        const clickedReq = dataPoint.requirements.find(r => r.storyId === reqId);
                        if (clickedReq) {
                          openRequirementListModal(dataPoint.month, [clickedReq]);
                        }
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
                <Line yAxisId="left" type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} name="复用率(%)" />
                <Line yAxisId="right" type="monotone" dataKey="savedTime" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} activeDot={{ r: 6 }} name="节省时长(h)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 工时指标 - 按复杂度分级 (6个) */}
      <div>
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              工时指标（按复杂度分级）
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                  <AlertCircle className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                className="bg-gray-800 border border-gray-700 text-white w-80 p-4 shadow-xl"
                sideOffset={8}
              >
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-indigo-400 mb-3">复杂度等级 (Level)</div>
                  <div className="space-y-3 text-xs">
                    <div className="border-b border-gray-700 pb-2">
                      <div className="font-semibold text-white mb-1">L1 基础 (Simple)</div>
                      <div className="text-gray-300">CS ≤ 15分</div>
                    </div>
                    <div className="border-b border-gray-700 pb-2">
                      <div className="font-semibold text-white mb-1">L2 中等 (Medium)</div>
                      <div className="text-gray-300">15 &lt; CS ≤ 30分</div>
                    </div>
                    <div className="border-b border-gray-700 pb-2">
                      <div className="font-semibold text-white mb-1">L3 复杂 (Complex)</div>
                      <div className="text-gray-300">30 &lt; CS ≤ 45分</div>
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">L4 高难度 (Advanced)</div>
                      <div className="text-gray-300">CS &gt; 45分</div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MetricCard
            title={
              <div className="flex items-center justify-between w-full gap-4">
                <span className="flex-shrink-0">预期编写时长</span>
                <span className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="font-bold text-lg text-indigo-400">
                    {(((metrics.caseManagement.expectedWriteTime?.l1 || 0) +
                      (metrics.caseManagement.expectedWriteTime?.l2 || 0) +
                      (metrics.caseManagement.expectedWriteTime?.l3 || 0) +
                      (metrics.caseManagement.expectedWriteTime?.l4 || 0)) * 60).toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">min</span>
                </span>
              </div>
            }
            value={
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">基础:</span>
                  <span className="font-bold text-sm">{((metrics.caseManagement.expectedWriteTime?.l1 || 0) * 60).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">中等:</span>
                  <span className="font-bold text-sm">{((metrics.caseManagement.expectedWriteTime?.l2 || 0) * 60).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">复杂:</span>
                  <span className="font-bold text-sm">{((metrics.caseManagement.expectedWriteTime?.l3 || 0) * 60).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">高难度:</span>
                  <span className="font-bold text-sm">{((metrics.caseManagement.expectedWriteTime?.l4 || 0) * 60).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
              </div>
            }
            icon={Clock}
            color="text-indigo-400"
            formula={getMetricFormula('expectedWriteTime', metrics.caseManagement)}
            metricKey="expectedWriteTime"
            onClick={() => handleMetricClick('expectedWriteTime')}
          />
          <MetricCard
            title={
              <div className="flex items-center justify-between w-full gap-4">
                <span className="flex-shrink-0">预期执行时长</span>
                <span className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="font-bold text-lg text-teal-400">
                    {((metrics.caseManagement.expectedExecTime?.l1 || 0) +
                      (metrics.caseManagement.expectedExecTime?.l2 || 0) +
                      (metrics.caseManagement.expectedExecTime?.l3 || 0) +
                      (metrics.caseManagement.expectedExecTime?.l4 || 0)).toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">min</span>
                </span>
              </div>
            }
            value={
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">基础:</span>
                  <span className="font-bold text-sm">{(metrics.caseManagement.expectedExecTime?.l1 || 0).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">中等:</span>
                  <span className="font-bold text-sm">{(metrics.caseManagement.expectedExecTime?.l2 || 0).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">复杂:</span>
                  <span className="font-bold text-sm">{(metrics.caseManagement.expectedExecTime?.l3 || 0).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-300">高难度:</span>
                  <span className="font-bold text-sm">{(metrics.caseManagement.expectedExecTime?.l4 || 0).toFixed(1)}</span>
                  <span className="text-xs text-gray-400">min</span>
                </div>
              </div>
            }
            icon={Clock}
            color="text-teal-400"
            formula={getMetricFormula('expectedExecTime', metrics.caseManagement)}
            metricKey="expectedExecTime"
            onClick={() => handleMetricClick('expectedExecTime')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="实际编写时长"
            value={
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-2xl text-blue-400">
                  {metrics.caseManagement.actualWriteDurationHours !== undefined 
                    ? (metrics.caseManagement.actualWriteDurationHours * 60).toFixed(1)
                    : '0.0'}
                </span>
                <span className="text-sm text-gray-400">min</span>
              </div>
            }
            icon={Clock}
            color="text-blue-400"
            formula={getMetricFormula('actualWriteTime', metrics.caseManagement)}
            metricKey="actualWriteTime"
            onClick={() => handleMetricClick('actualWriteTime')}
          />
          <MetricCard
            title="实际执行时长"
            value={
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-2xl text-cyan-400">
                  {metrics.caseManagement.actualExecDurationMinutes !== undefined 
                    ? metrics.caseManagement.actualExecDurationMinutes.toFixed(1)
                    : '0.0'}
                </span>
                <span className="text-sm text-gray-400">min</span>
              </div>
            }
            icon={Clock}
            color="text-cyan-400"
            formula={getMetricFormula('actualExecTime', metrics.caseManagement)}
            metricKey="actualExecTime"
            onClick={() => handleMetricClick('actualExecTime')}
          />
        </div>
      </div>
    </>
  );
});
