/**
 * WebTestSection 组件
 * WebTest（拨测平台）模块组件
 * 从 EfficiencyDashboard.tsx 提取（行1830-1921）
 */

import React from 'react';
import { Calendar as CalendarIcon, Target, Activity, BarChart3, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from './MetricCard';
import { formatNumber } from '@/utils/format';
import type { WebTestMetrics } from '@/types/efficiency';

/**
 * WebTestSection 组件 Props
 */
export interface WebTestSectionProps {
  // WebTest 指标数据
  metrics: {
    webTest: WebTestMetrics;
  };
  // 时间范围状态
  webTestTimeRange: '全部' | '本周' | '上周' | '本月' | '上月';
  setWebTestTimeRange: (value: '全部' | '本周' | '上周' | '本月' | '上月') => void;
  // 应用代码状态
  webTestAppCode: string;
  setWebTestAppCode: (value: string) => void;
}

/**
 * WebTestSection 组件
 */
export const WebTestSection = React.memo<WebTestSectionProps>(function WebTestSection({
  metrics,
  webTestTimeRange,
  setWebTestTimeRange,
  webTestAppCode,
  setWebTestAppCode,
}: WebTestSectionProps) {
  // 防御性检查：确保 metrics 和 metrics.webTest 存在
  if (!metrics || !metrics.webTest) {
    return null;
  }

  const webTest = metrics.webTest;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-purple-500 rounded"></div>
          <h2 className="text-xl font-bold text-white">webTest（拨测平台）模块</h2>
        </div>
        {/* webTest 筛选器 */}
        <div className="flex items-center gap-4">
          {/* 时间范围选择 */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <Select value={webTestTimeRange} onValueChange={(value) => setWebTestTimeRange(value as '全部' | '本周' | '上周' | '本月' | '上月')}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="全部" className="text-white hover:bg-gray-700">全部</SelectItem>
                <SelectItem value="本周" className="text-white hover:bg-gray-700">本周</SelectItem>
                <SelectItem value="上周" className="text-white hover:bg-gray-700">上周</SelectItem>
                <SelectItem value="本月" className="text-white hover:bg-gray-700">本月</SelectItem>
                <SelectItem value="上月" className="text-white hover:bg-gray-700">上月</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* 应用选择 */}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-400" />
            <Select value={webTestAppCode} onValueChange={setWebTestAppCode}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="全部" className="text-white hover:bg-gray-700">全部</SelectItem>
                <SelectItem value="Gmesh" className="text-white hover:bg-gray-700">Gmesh</SelectItem>
                <SelectItem value="SEVC" className="text-white hover:bg-gray-700">SEVC</SelectItem>
                <SelectItem value="Developer" className="text-white hover:bg-gray-700">Developer</SelectItem>
                <SelectItem value="CRM" className="text-white hover:bg-gray-700">CRM</SelectItem>
                <SelectItem value="WMS" className="text-white hover:bg-gray-700">WMS</SelectItem>
                <SelectItem value="DataVerse" className="text-white hover:bg-gray-700">DataVerse</SelectItem>
                <SelectItem value="Risk" className="text-white hover:bg-gray-700">Risk</SelectItem>
                <SelectItem value="CSM" className="text-white hover:bg-gray-700">CSM</SelectItem>
                <SelectItem value="GDS" className="text-white hover:bg-gray-700">GDS</SelectItem>
                <SelectItem value="PLUT" className="text-white hover:bg-gray-700">PLUT</SelectItem>
                <SelectItem value="OPENAPI" className="text-white hover:bg-gray-700">OPENAPI</SelectItem>
                <SelectItem value="Corin" className="text-white hover:bg-gray-700">Corin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          title="拨测任务数"
          value={formatNumber(webTest.monitoringTaskCount || 0)}
          icon={Activity}
          color="text-purple-400"
          // trend={{ value: 3.5, isPositive: true }}
        />
        <MetricCard
          title="拨测任务执行数"
          value={formatNumber(webTest.monitoringTaskExecutionCount || 0)}
          icon={BarChart3}
          color="text-purple-400"
          // trend={{ value: 8.2, isPositive: true }}
        />
        <MetricCard
          title="平均拨测执行时间"
          value={(webTest.avgMonitoringExecutionTime || 0).toFixed(1)}
          unit="s"
          icon={Clock}
          color="text-purple-400"
          // trend={{ value: 5.3, isPositive: false }}
        />
        {/* <MetricCard
          title="发现异常数"
          value={metrics.webTest.anomalyDiscoveryCount}
          icon={XCircle}
          color="text-red-400"
          trend={{ value: 2.1, isPositive: false }}
        />
        <MetricCard
          title="用户体验分数"
          value={metrics.webTest.userExperience.toFixed(1)}
          unit="分"
          icon={Target}
          color="text-green-400"
          trend={{ value: 1.2, isPositive: true }}
        /> */}
      </div>
    </div>
  );
});
