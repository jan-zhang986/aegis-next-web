/**
 * MetricCard 组件
 * 指标卡片组件，用于展示各种效能指标
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * 指标公式类型
 */
export interface MetricFormula {
  formula: string;
  description?: string;
  params?: Array<{
    name: string;
    value: string | number;
    description?: string;
  }>;
}

/**
 * MetricCard 组件 Props
 */
export interface MetricCardProps {
  title: string | React.ReactNode;
  value: number | string | React.ReactNode;
  unit?: string;
  trend?: { value: number; isPositive: boolean };
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  formula?: MetricFormula;
  metricKey?: string;
  onClick?: () => void;
  numeratorDenominator?: Array<{ label: string; value: string | number }>;
  rightSideInfo?: Array<{ label: string; value: string | number }>;
}

/**
 * MetricCard 组件
 */
export const MetricCard = React.memo(function MetricCard({
  title,
  value,
  unit = '',
  trend,
  icon: Icon,
  color = 'text-blue-400',
  formula,
  metricKey,
  onClick,
  numeratorDenominator,
  rightSideInfo,
}: MetricCardProps) {
  const cardContent = (
    <div
      className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 hover:bg-gray-800/70 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* 左侧内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg bg-gray-700/50 ${color} flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              {typeof title === 'string' ? (
                <span className="text-gray-400 text-sm">{title}</span>
              ) : (
                <div className="text-gray-400 text-sm flex-1 min-w-0">{title}</div>
              )}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-1 flex-shrink-0 ${
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-gray-400 text-lg">{unit}</span>}
          </div>
          {/* 分子分母信息（左侧） */}
          {numeratorDenominator && numeratorDenominator.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {numeratorDenominator.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{item.label}:</span>
                  <span className="text-gray-300 font-medium">
                    {typeof item.value === 'number'
                      ? item.value.toLocaleString()
                      : item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* 右侧信息（如UQS的子指标） */}
        {rightSideInfo && rightSideInfo.length > 0 && (
          <div className="flex-shrink-0 border-l border-gray-700 pl-4">
            <div className="space-y-2">
              {rightSideInfo.map((item, index) => {
                // 格式化数值：整数不显示小数，小数显示一位小数
                const formatValue = (val: string | number): string => {
                  if (typeof val === 'number') {
                    return Number.isInteger(val) ? val.toString() : val.toFixed(1);
                  }
                  return val.toString();
                };
                return (
                  <div key={index} className="text-right">
                    <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                    <div className="text-sm font-semibold text-white">
                      {formatValue(item.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (formula) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-gray-800 border border-gray-700 text-white max-w-md p-4 shadow-xl"
          sideOffset={8}
          hideArrow={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-blue-400 mb-1">{title}</div>
              {formula.description && (
                <div className="text-xs text-gray-400 mb-2">{formula.description}</div>
              )}
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="text-xs font-semibold text-gray-300 mb-2">计算公式：</div>
              <div className="text-sm font-mono text-blue-300 bg-gray-900/50 p-2 rounded border border-gray-700">
                {formula.formula}
              </div>
            </div>
            {formula.params && formula.params.length > 0 && (
              <div className="border-t border-gray-700 pt-2">
                <div className="text-xs font-semibold text-gray-300 mb-2">参数值：</div>
                <div className="space-y-1">
                  {formula.params.map((param, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {param.name}
                        {param.description && (
                          <span className="text-gray-500 ml-1">({param.description})</span>
                        )}
                        :
                      </span>
                      <span className="text-white font-mono ml-2">
                        {typeof param.value === 'number'
                          ? param.value.toLocaleString()
                          : param.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
});
