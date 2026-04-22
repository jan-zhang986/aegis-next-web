/**
 * TrendSection 组件
 * 趋势模块组件
 * 从 EfficiencyDashboard.tsx 提取（行1842-2003）
 */

import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * TrendSection 组件 Props
 */
export interface TrendSectionProps {
  // 用例复用率趋势数据
  caseReuseTrendData: Array<{
    month: string;
    rate: number;
    savedTime: number;
  }>;
}

/**
 * TrendSection 组件
 */
export const TrendSection = React.memo<TrendSectionProps>(function TrendSection({
  caseReuseTrendData,
}: TrendSectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-blue-500 rounded"></div>
        <h2 className="text-xl font-bold text-white">趋势模块</h2>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {/* 用例复用率趋势 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">用例复用率趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={caseReuseTrendData}>
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
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#9CA3AF" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#9CA3AF' }}
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
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
                formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{value}</span>}
              />
              <Line yAxisId="left" type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} name="复用率(%)" />
              <Line yAxisId="right" type="monotone" dataKey="savedTime" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} activeDot={{ r: 6 }} name="节省时长(h)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
