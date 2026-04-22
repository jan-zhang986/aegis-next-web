/**
 * MetricCard 组件
 * 指标卡片，支持 hover 提示与副标题
 * 从 SnapTestModule.tsx 提取
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SnapTestMetricCardProps, SnapTestMetricCardTrend } from '@/types/snap-test';

function isNewTrend(t: SnapTestMetricCardTrend): t is { changeType: 'up' | 'down' | 'flat'; changeRate?: number } {
  return 'changeType' in t;
}

export const MetricCard = ({
  title,
  value,
  unit = '',
  icon: Icon,
  color = 'text-blue-400',
  trend,
  valueColor,
  hoverContent,
  subtitle,
}: SnapTestMetricCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverContentHovered, setIsHoverContentHovered] = useState(false);

  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      return val.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
    }
    return String(val);
  };

  const showHoverContent = isHovered || isHoverContentHovered;
  const valueCls = valueColor ?? 'text-white';

  const trendNode = trend != null ? (
    isNewTrend(trend) ? (
      trend.changeType === 'flat' ? (
        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
          <Minus className="w-3.5 h-3.5" />
          <span className="text-xs font-bold uppercase tracking-wider">持平</span>
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg",
          trend.changeType === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
        )}>
          {trend.changeType === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span className="text-xs font-bold tabular-nums">{trend.changeRate != null ? `${trend.changeRate.toLocaleString('zh-CN', { maximumFractionDigits: 1 })}%` : ''}</span>
        </div>
      )
    ) : (
      <div className={cn(
        "flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg",
        trend.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
      )}>
        {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span className="text-xs font-bold tabular-nums">{Math.abs(trend.value)}%</span>
      </div>
    )
  ) : null;

  return (
    <div className="relative">
      <div
        className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-7 hover:bg-white/10 transition-all duration-500 relative shadow-2xl hover:-translate-y-1 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className={cn(
              "p-3 rounded-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm",
              color.replace('text-', 'bg-').replace('-400', '-500/20').replace('-600', '-500/20'),
              color
            )}>
              <Icon className="w-7 h-7" />
            </div>
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">{title}</span>
          </div>
          {trendNode}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <span className={cn("text-4xl font-black tracking-tight tabular-nums text-white", valueCls)}>{formatValue(value)}</span>
            {unit && <span className="text-gray-500 text-base font-medium">{unit}</span>}
          </div>
        </div>
        {subtitle && (
          <div className="absolute bottom-3 right-6 text-right max-w-[calc(100%-3rem)]">
            {subtitle}
          </div>
        )}
      </div>

      {hoverContent && showHoverContent && (
        <div
          className="absolute bottom-full left-0 mb-2 w-[400px] bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl z-50 backdrop-blur-xl"
          onMouseEnter={() => setIsHoverContentHovered(true)}
          onMouseLeave={() => setIsHoverContentHovered(false)}
        >
          {hoverContent}
        </div>
      )}
    </div>
  );
};
