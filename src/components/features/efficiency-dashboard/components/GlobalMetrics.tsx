/**
 * GlobalMetrics 组件
 * 全局指标卡片展示（不受需求筛选影响）
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';
import { Target, FilePlus, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumber } from '@/utils/format';
import type { GlobalMetrics as GlobalMetricsType } from '@/types/efficiency';

interface GlobalMetricsProps {
  globalMetrics: GlobalMetricsType;
}

/**
 * GlobalMetrics 组件
 */
export const GlobalMetrics = React.memo(function GlobalMetrics({
  globalMetrics,
}: GlobalMetricsProps) {
  const totalCaseCount = Number(globalMetrics.totalCaseCount) || 0;
  const effectiveCaseCount = Number(globalMetrics.effectiveCaseCount) || 0;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-lg border border-blue-500/30 p-6 hover:border-blue-400 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-blue-400 shrink-0" />
              <span className="text-gray-300 text-sm">总用例数</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {formatNumber(totalCaseCount)}
            </div>
          </div>
          <div className="h-12 w-px bg-blue-500/30 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FilePlus className="w-6 h-6 text-cyan-400 shrink-0" />
              <span className="text-gray-300 text-sm">有效用例数</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatNumber(effectiveCaseCount)}
            </div>
          </div>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-lg border border-green-500/30 p-6 cursor-help hover:border-green-400 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <span className="text-gray-300 text-sm">平均UQS评分</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {(globalMetrics.avgUQS || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-400 mt-2">综合质量指标</div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-gray-800 border border-gray-700 text-white max-w-md p-4 shadow-xl"
          sideOffset={8}
          hideArrow={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">
                平均UQS评分（全局）
              </div>
              <div className="text-xs text-gray-400 mb-2">
                统计全局用例质量综合评分，不受下方需求筛选影响
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="text-xs text-gray-300">
                当前值:{' '}
                <span className="text-white font-mono">
                  {(globalMetrics.avgUQS || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm rounded-lg border border-yellow-500/30 p-6 cursor-help hover:border-yellow-400 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <span className="text-gray-300 text-sm">绝对节约时间</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {(globalMetrics.absoluteTimeSavings || 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-400 mt-2">小时</div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-gray-800 border border-gray-700 text-white max-w-md p-4 shadow-xl"
          sideOffset={8}
          hideArrow={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-yellow-400 mb-1">
                绝对节约时间（全局）
              </div>
              <div className="text-xs text-gray-400 mb-2">
                统计全局复用用例节约的总工时，不受下方需求筛选影响
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="text-xs text-gray-300">
                当前值:{' '}
                <span className="text-white font-mono">
                  {(globalMetrics.absoluteTimeSavings || 0).toFixed(1)}小时
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-lg border border-purple-500/30 p-6 cursor-help hover:border-purple-400 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-gray-300 text-sm">用例修改率</span>
            </div>
            <div className="text-4xl font-bold text-white">
              {globalMetrics.caseChangeHeat || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">变更热度指标</div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-gray-800 border border-gray-700 text-white max-w-md p-4 shadow-xl"
          sideOffset={8}
          hideArrow={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-purple-400 mb-1">
                用例变更热度（全局）
              </div>
              <div className="text-xs text-gray-400 mb-2">
                统计全局用例变更热度，不受下方需求筛选影响
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="text-xs text-gray-300">
                当前值:{' '}
                <span className="text-white font-mono">
                  {globalMetrics.caseChangeHeat || 0}
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
});
