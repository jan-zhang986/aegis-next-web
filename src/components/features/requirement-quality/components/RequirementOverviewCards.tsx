/**
 * 需求质量视图 - 顶部概览卡（5 张列表 / 7 张详情：原 5 张 + 平均执行时长、节省时间）
 */

import { Target, CheckCircle2, Activity, Zap, BarChart3, Clock, Timer } from 'lucide-react';
import { formatRate } from '../utils/format-rate';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function fmtVal(v: number | undefined | null, suffix: string): string {
  if (v == null || (typeof v === 'number' && Number.isNaN(v))) return '-';
  return `${v}${suffix}`;
}

export interface RequirementOverviewCardsProps {
  totalCases: number;
  executedCases: number;
  executionRate: number;
  /** 通过率（保留兼容） */
  passRate: number;
  /** 首次通过率(%)，与列表/详情一致，展示用此值 */
  firstPassRate?: number | null;
  /** 千行代码缺陷率平均值（有该率的需求的 totalDefectRatePer1k 取平均），空时卡片显示 - */
  avgDefectRatePer1k?: number | null;
  /** 平均执行时长（分钟），详情页传入时顶部增加该卡 */
  avgExecutionTime?: number | null;
  /** 节省时间（小时），详情页传入时顶部增加该卡 */
  savedHours?: number | null;
  /** 列表页可显示副文案（如「本计划包含」「+5.3%」）；详情抽屉可省略 */
  showSubText?: boolean;
}

export function RequirementOverviewCards({
  totalCases,
  executedCases,
  executionRate,
  passRate,
  firstPassRate,
  avgDefectRatePer1k = null,
  avgExecutionTime = null,
  savedHours = null,
  showSubText = true,
}: RequirementOverviewCardsProps) {
  const hasFirstPassMetric = firstPassRate != null;
  const isDetailView = !showSubText;
  /** 详情页顶部 7 张卡（原 5 + 平均执行时长、节省时间），列表页 5 张 */
  const cardCount = isDetailView ? 7 : 5;
  const totalCasesTooltip = isDetailView
    ? '该需求关联的测试计划组下所有测试计划下面的用例数量之和'
    : '需求关联的测试计划组下所有测试计划下面的用例数量之和';
  const executedCasesTooltip = isDetailView
    ? '该需求关联的测试计划组下已经执行了的用例数量之和'
    : '需求关联的测试计划组下已经执行了的用例数量之和';

  return (
    <div className={`grid gap-4 ${cardCount === 7 ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7' : 'grid-cols-2 md:grid-cols-5'}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Card className="rounded-2xl border border-blue-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#2a3f6d,#1c2e5b)] cursor-default">
              <div className="flex items-center gap-2 text-xs text-white mb-2">
                <Target className="w-4 h-4 flex-shrink-0" />
                <span>需求总用例数量</span>
              </div>
              <div className="text-2xl font-bold text-white">{totalCases}</div>
              {showSubText && <div className="text-xs text-white/90 mt-1">本需求包含</div>}
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {totalCasesTooltip}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Card className="rounded-2xl border border-emerald-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#23615f,#1a4f4e)] cursor-default">
              <div className="flex items-center gap-2 text-xs text-white mb-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>需求执行用例数</span>
              </div>
              <div className="text-2xl font-bold text-white">{executedCases}</div>
              {showSubText && <div className="text-xs text-white/90 mt-1">执行完成</div>}
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {executedCasesTooltip}
        </TooltipContent>
      </Tooltip>

      <Card className="rounded-2xl border border-violet-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#4d3580,#3b2866)]">
        <div className="flex items-center gap-2 text-xs text-white mb-2">
          <Activity className="w-4 h-4" />
          <span>执行率</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {formatRate(executionRate)}<span className="text-base">%</span>
        </div>
        {showSubText && (
          <div className="flex items-center gap-1 text-[10px] text-white/90 mt-1">
            <Zap className="w-4 h-4" />
            +5.3%
          </div>
        )}
      </Card>

      <Card className="rounded-2xl border border-cyan-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#284a6e,#1d375c)]">
        <div className="flex items-center gap-2 text-xs text-white mb-2">
          <Zap className="w-4 h-4" />
          <span>首次通过率</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {hasFirstPassMetric ? `${formatRate(firstPassRate!)}%` : '-'}
        </div>
        {showSubText && (
          <div className="text-xs text-white/90 mt-1">有该指标需求的平均值</div>
        )}
      </Card>

      <Card className="rounded-2xl border border-amber-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#5c4a2a,#3d321c)]">
        <div className="flex items-center gap-2 text-xs text-white mb-2">
          <BarChart3 className="w-4 h-4" />
          <span>千行代码缺陷率</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {avgDefectRatePer1k != null ? avgDefectRatePer1k.toFixed(2) : '-'}
        </div>
        {showSubText && (
          <div className="text-xs text-white/90 mt-1">有该率需求的平均值</div>
        )}
      </Card>

      {cardCount === 7 && (
        <>
          <Card className="rounded-2xl border border-yellow-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#5a5238,#3d3820)]">
            <div className="flex items-center gap-2 text-xs text-white mb-2">
              <Clock className="w-4 h-4" />
              <span>平均执行时长</span>
            </div>
            <div className="text-2xl font-bold text-white">{fmtVal(avgExecutionTime, 'min')}</div>
          </Card>
          <Card className="rounded-2xl border border-teal-400/20 p-5 [background:radial-gradient(ellipse_80%_80%_at_50%_50%,#2d4a48,#1e3534)]">
            <div className="flex items-center gap-2 text-xs text-white mb-2">
              <Timer className="w-4 h-4" />
              <span>节省时间</span>
            </div>
            <div className="text-2xl font-bold text-white">{fmtVal(savedHours, 'h')}</div>
          </Card>
        </>
      )}
    </div>
  );
}
