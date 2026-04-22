/**
 * Requirement Chart Data Utils
 * 生成需求堆叠柱状图数据的工具函数
 * 从 EfficiencyDashboard.tsx 提取
 */

import type { Requirement } from '@/services/case-management/service-case-metrics';

/**
 * 需求图表数据项类型
 */
export interface RequirementChartDataItem {
  chartData: any[];
  requirementIds: string[];
  requirementIdToColor: Record<string, string>;
  requirementIdToName: Record<string, string>;
}

/**
 * 用例复用趋势数据项类型
 */
export interface CaseReuseTrendDataItem {
  month: string;
  rate: number;
  savedTime: number;
  requirements: Requirement[];
}

/**
 * 用例管理趋势数据项类型
 */
export interface CaseManagementTrendDataItem {
  date: string;
  expectedWritingDuration: number;
  actualWritingDuration: number;
  expectedExecutionTime: number;
  actualExecutionTime: number;
  passRate: number;
  requirementCount: number;
  requirements: Requirement[];
}

/**
 * 生成复用指标趋势图的需求堆叠柱状图数据
 */
export function generateReuseRequirementChartData(
  caseReuseTrendData: CaseReuseTrendDataItem[]
): RequirementChartDataItem {
  // 收集所有唯一的需求ID
  const allRequirementIds = new Set<string>();
  caseReuseTrendData.forEach(data => {
    data.requirements?.forEach(req => {
      if (req.storyId) {
        allRequirementIds.add(req.storyId);
      }
    });
  });

  // 生成颜色数组（使用柔和的颜色）
  const colors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#14B8A6', '#6366F1', '#A78BFA', '#F472B6',
    '#FB7185', '#FB923C', '#34D399', '#60A5FA', '#FBBF24',
    '#22D3EE', '#A855F7', '#06B6D4', '#84CC16', '#F97316'
  ];
  
  const requirementIdToColor: Record<string, string> = {};
  const requirementIdToName: Record<string, string> = {};
  Array.from(allRequirementIds).forEach((id, index) => {
    requirementIdToColor[id] = colors[index % colors.length];
    // 找到对应的需求名称
    for (const data of caseReuseTrendData) {
      const req = data.requirements?.find(r => r.storyId === id);
      if (req) {
        requirementIdToName[id] = req.storyName || '未命名需求';
        break;
      }
    }
  });

  // 转换数据格式为堆叠柱状图
  const chartData = caseReuseTrendData.map(data => {
    const item: any = {
      month: data.month,
      rate: data.rate,
      savedTime: data.savedTime,
    };

    // 为每个需求创建一个数据字段
    Array.from(allRequirementIds).forEach(id => {
      const req = data.requirements?.find(r => r.storyId === id);
      item[`req_${id}`] = req ? 1 : 0; // 每个需求占1个单位高度
    });

    return item;
  });

  return {
    chartData,
    requirementIdToColor,
    requirementIdToName,
    requirementIds: Array.from(allRequirementIds)
  };
}

/**
 * 生成需求堆叠柱状图数据
 */
export function generateRequirementChartData(
  caseManagementTrendData: CaseManagementTrendDataItem[]
): RequirementChartDataItem {
  // 收集所有唯一的需求ID
  const allRequirementIds = new Set<string>();
  caseManagementTrendData.forEach(data => {
    data.requirements?.forEach(req => {
      if (req.storyId) {
        allRequirementIds.add(req.storyId);
      }
    });
  });

  // 生成颜色数组（使用柔和的颜色）
  const colors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#14B8A6', '#6366F1', '#A78BFA', '#F472B6',
    '#FB7185', '#FB923C', '#34D399', '#60A5FA', '#FBBF24',
    '#22D3EE', '#A855F7', '#06B6D4', '#84CC16', '#F97316'
  ];
  
  const requirementIdToColor: Record<string, string> = {};
  const requirementIdToName: Record<string, string> = {};
  Array.from(allRequirementIds).forEach((id, index) => {
    requirementIdToColor[id] = colors[index % colors.length];
    // 找到对应的需求名称
    for (const data of caseManagementTrendData) {
      const req = data.requirements?.find(r => r.storyId === id);
      if (req) {
        requirementIdToName[id] = req.storyName || '未命名需求';
        break;
      }
    }
  });

  // 转换数据格式为堆叠柱状图
  const chartData = caseManagementTrendData.map(data => {
    const item: any = {
      date: data.date,
      expectedWritingDuration: data.expectedWritingDuration,
      actualWritingDuration: data.actualWritingDuration,
      expectedExecutionTime: data.expectedExecutionTime,
      actualExecutionTime: data.actualExecutionTime,
      passRate: data.passRate,
    };

    // 为每个需求创建一个数据字段
    Array.from(allRequirementIds).forEach(id => {
      const req = data.requirements?.find(r => r.storyId === id);
      item[`req_${id}`] = req ? 1 : 0; // 每个需求占1个单位高度
    });

    return item;
  });

  return {
    chartData,
    requirementIdToColor,
    requirementIdToName,
    requirementIds: Array.from(allRequirementIds)
  };
}
