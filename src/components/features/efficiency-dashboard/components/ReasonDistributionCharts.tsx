/**
 * ReasonDistributionCharts 组件
 * 用例变更原因分布和测试用例执行阻塞原因分布饼图
 * 从 EfficiencyDashboard.tsx 提取（行1616-1827）
 */

import React, { useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { getCasesByChangeReason, getCasesByBlockReason } from '@/services/case-management/service-case-metrics';
import { changeReasonCodeMap, blockedReasonCodeMap } from '../constants';
import type { CaseWithRequirement } from '@/services/case-management/service-case-metrics';

/**
 * 分布数据项类型
 */
export interface DistributionDataItem {
  name: string;
  value: number;
  percentage: number;
  [key: string]: string | number;
}

/**
 * ReasonDistributionCharts 组件 Props
 */
export interface ReasonDistributionChartsProps {
  // 变更原因分布数据
  changeReasonData: DistributionDataItem[];
  // 阻塞原因分布数据
  blockedReasonData: DistributionDataItem[];
  // 时间范围
  timeRange: {
    startTime: number | undefined;
    endTime: number | undefined;
  };
  // 项目选择
  selectedProject: string;
  // 维度
  dimension: 'project' | 'personal';
  // 用户选择
  selectedUser: string;
  // 设置用例列表弹窗
  setCaseListModal: (modal: {
    isOpen: boolean;
    title: string;
    cases: CaseWithRequirement[];
    type: 'change' | 'block';
  }) => void;
}

/**
 * ReasonDistributionCharts 组件
 */
export const ReasonDistributionCharts = React.memo<ReasonDistributionChartsProps>(function ReasonDistributionCharts({
  changeReasonData,
  blockedReasonData,
  timeRange,
  selectedProject,
  dimension,
  selectedUser,
  setCaseListModal,
}: ReasonDistributionChartsProps) {
  const [activeChangeIndex, setActiveChangeIndex] = useState<number | null>(null);
  const [activeBlockedIndex, setActiveBlockedIndex] = useState<number | null>(null);

  // 处理变更原因饼图点击
  const handleChangeReasonClick = async (reasonName: string) => {
    const reasonCode = changeReasonCodeMap[reasonName];
    if (!reasonCode || !timeRange.startTime || !timeRange.endTime) return;

    try {
      const projectId = (selectedProject === 'all' || selectedProject === 'ALL') ? 'ALL' : selectedProject;
      const userId = dimension === 'personal' ? (selectedUser === 'all' ? undefined : selectedUser) : undefined;

      const cases = await getCasesByChangeReason(reasonCode, projectId, userId, timeRange.startTime, timeRange.endTime);

      setCaseListModal({
        isOpen: true,
        title: reasonName,
        cases,
        type: 'change'
      });
    } catch (error) {
      console.error('查询变更用例失败:', error);
    }
  };

  // 处理阻塞原因饼图点击
  const handleBlockReasonClick = async (reasonName: string) => {
    const reasonCode = blockedReasonCodeMap[reasonName];
    if (!reasonCode || !timeRange.startTime || !timeRange.endTime) return;

    try {
      const projectId = (selectedProject === 'all' || selectedProject === 'ALL') ? 'ALL' : selectedProject;
      const userId = dimension === 'personal' ? (selectedUser === 'all' ? undefined : selectedUser) : undefined;

      const cases = await getCasesByBlockReason(reasonCode, projectId, userId, timeRange.startTime, timeRange.endTime);

      setCaseListModal({
        isOpen: true,
        title: reasonName,
        cases,
        type: 'block'
      });
    } catch (error) {
      console.error('查询阻塞用例失败:', error);
    }
  };

  if (changeReasonData.length === 0 && blockedReasonData.length === 0) {
    return null;
  }

  const changeReasonTotal = changeReasonData.reduce((sum, d) => sum + d.value, 0);
  const blockedReasonTotal = blockedReasonData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="mt-6 grid grid-cols-2 gap-6">
      {/* 用例变更原因分布 */}
      {changeReasonData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              用例变更原因分布（9种）
            </span>
            <span className="text-sm font-medium text-gray-400 ml-auto">总数：{changeReasonTotal}</span>
          </h3>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={changeReasonData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={(props: any) => {
                    const value = props.value || 0;
                    if (value === 0) return null;
                    const percent = props.percent !== undefined ? props.percent : (props.percentage || 0) / 100;
                    return `${(percent * 100).toFixed(1)}%`;
                  }}
                  outerRadius={100}
                  innerRadius={0}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                  paddingAngle={0}
                  stroke="none"
                  {...(activeChangeIndex !== null && {
                    activeIndex: activeChangeIndex,
                    activeShape: (props: any) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      return (
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius + 10}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          stroke="#fff"
                          strokeWidth={2}
                          opacity={1}
                        />
                      );
                    }
                  })}
                  onMouseEnter={(data: any, index: number) => setActiveChangeIndex(index)}
                  onMouseLeave={() => setActiveChangeIndex(null)}
                  onClick={(data: any, index: number) => {
                    if (data && data.name && data.value > 0) {
                      setActiveChangeIndex(activeChangeIndex === index ? null : index);
                      handleChangeReasonClick(data.name);
                    }
                  }}
                >
                  {changeReasonData.map((entry, index) => {
                    const colors = ['#60A5FA', '#34D399', '#FBBF24', '#FB7185', '#A78BFA', '#F472B6', '#2DD4BF', '#FB923C'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />;
                  })}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#1F2937',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '12px'
                  }}
                  itemStyle={{
                    color: '#1F2937',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#6B7280',
                    fontWeight: '400'
                  }}
                  formatter={(value: number, name: string) => [`${value}次`, name]}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px'
                  }}
                  formatter={(value: string, entry: any) => {
                    const item = changeReasonData.find(d => d.name === value);
                    if (!item) return value;
                    return item.value > 0 ? `${value} ${item.value}次 (${item.percentage.toFixed(1)}%)` : value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 测试用例执行阻塞原因分布 */}
      {blockedReasonData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              测试用例执行阻塞原因分布（6种）
            </span>
            <span className="text-sm font-medium text-gray-400 ml-auto">总数：{blockedReasonTotal}</span>
          </h3>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={blockedReasonData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={(props: any) => {
                    const value = props.value || 0;
                    if (value === 0) return null;
                    const percent = props.percent !== undefined ? props.percent : (props.percentage || 0) / 100;
                    return `${(percent * 100).toFixed(1)}%`;
                  }}
                  outerRadius={100}
                  innerRadius={0}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                  paddingAngle={0}
                  stroke="none"
                  {...(activeBlockedIndex !== null && {
                    activeIndex: activeBlockedIndex,
                    activeShape: (props: any) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      return (
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius + 10}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          stroke="#fff"
                          strokeWidth={2}
                          opacity={1}
                        />
                      );
                    }
                  })}
                  onMouseEnter={(data: any, index: number) => setActiveBlockedIndex(index)}
                  onMouseLeave={() => setActiveBlockedIndex(null)}
                  onClick={(data: any, index: number) => {
                    if (data && data.name && data.value > 0) {
                      setActiveBlockedIndex(activeBlockedIndex === index ? null : index);
                      handleBlockReasonClick(data.name);
                    }
                  }}
                >
                  {blockedReasonData.map((entry, index) => {
                    const colors = ['#FB7185', '#FB923C', '#FBBF24', '#FDE047', '#A3E635', '#34D399'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="none" />;
                  })}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#1F2937',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '12px'
                  }}
                  itemStyle={{
                    color: '#1F2937',
                    fontWeight: '500'
                  }}
                  labelStyle={{
                    color: '#6B7280',
                    fontWeight: '400'
                  }}
                  formatter={(value: number, name: string) => [`${value}次`, name]}
                />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '12px'
                  }}
                  formatter={(value: string, entry: any) => {
                    const item = blockedReasonData.find(d => d.name === value);
                    if (!item) return value;
                    return item.value > 0 ? `${value} ${item.value}次 (${item.percentage.toFixed(1)}%)` : value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
});
