/**
 * useLogFilters Hook
 * 日志筛选条件状态管理
 */

import { useState, useCallback } from 'react';
import type { LogFilters, OperationScope, OperationType } from '@/types/log';

export interface UseLogFiltersResult {
  filters: LogFilters;
  setOperator: (operator: string | undefined) => void;
  setTimeRange: (startTime: Date | undefined, endTime: Date | undefined) => void;
  setScope: (scope: OperationScope | undefined) => void;
  setType: (type: OperationType | undefined) => void;
  setModule: (module: string | undefined) => void;
  setContent: (content: string | undefined) => void;
  resetFilters: () => void;
  validateTimeRange: (startTime: Date, endTime: Date) => { valid: boolean; message?: string };
}

const MAX_RANGE_MONTHS = 6;

export function useLogFilters(): UseLogFiltersResult {
  const [filters, setFilters] = useState<LogFilters>({});

  // 设置操作人
  const setOperator = useCallback((operator: string | undefined) => {
    setFilters(prev => ({ ...prev, operator }));
  }, []);

  // 设置时间范围
  const setTimeRange = useCallback((startTime: Date | undefined, endTime: Date | undefined) => {
    setFilters(prev => ({ ...prev, startTime, endTime }));
  }, []);

  // 设置操作范围
  const setScope = useCallback((scope: OperationScope | undefined) => {
    setFilters(prev => ({ ...prev, scope }));
  }, []);

  // 设置操作类型
  const setType = useCallback((type: OperationType | undefined) => {
    setFilters(prev => ({ ...prev, type }));
  }, []);

  // 设置模块
  const setModule = useCallback((module: string | undefined) => {
    setFilters(prev => ({ ...prev, module }));
  }, []);

  // 设置操作名称
  const setContent = useCallback((content: string | undefined) => {
    setFilters(prev => ({ ...prev, content }));
  }, []);

  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // 验证时间范围（不超过6个月）
  const validateTimeRange = useCallback((startTime: Date, endTime: Date): { valid: boolean; message?: string } => {
    if (!startTime || !endTime) {
      return { valid: false, message: '请选择时间范围' };
    }

    if (startTime > endTime) {
      return { valid: false, message: '开始时间不能晚于结束时间' };
    }

    // 计算月份差
    const monthsDiff = (endTime.getFullYear() - startTime.getFullYear()) * 12 + 
                       (endTime.getMonth() - startTime.getMonth());

    if (monthsDiff > MAX_RANGE_MONTHS) {
      return { valid: false, message: `时间范围不能超过${MAX_RANGE_MONTHS}个月` };
    }

    return { valid: true };
  }, []);

  return {
    filters,
    setOperator,
    setTimeRange,
    setScope,
    setType,
    setModule,
    setContent,
    resetFilters,
    validateTimeRange,
  };
}
