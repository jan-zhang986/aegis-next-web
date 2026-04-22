import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { mockFactoryService } from '@/services/mock-factory';
import { DEFAULT_HISTORY_PAGE_SIZE } from '../constants';
import type { ExpandedJson } from '../types';

export function useMockRuleHistory() {
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyRuleId, setHistoryRuleId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(DEFAULT_HISTORY_PAGE_SIZE);
  const [expandedJson, setExpandedJson] = useState<ExpandedJson | null>(null);

  const handleViewHistory = useCallback(async (ruleId: number) => {
    try {
      setHistoryRuleId(ruleId);
      setHistoryPage(1);
      setExpandedJson(null);
      const history = await mockFactoryService.viewHistory(ruleId);
      setHistoryData(history || []);
    } catch (error: any) {
      toast.error('加载历史记录失败: ' + (error.message || '未知错误'));
    }
  }, []);

  const handleViewFullHistory = useCallback(async (ruleId: number) => {
    try {
      setHistoryRuleId(ruleId);
      setHistoryPage(1);
      setExpandedJson(null);
      setIsHistoryDialogOpen(true);
      const history = await mockFactoryService.viewHistory(ruleId);
      setHistoryData(history || []);
    } catch (error: any) {
      toast.error('加载历史记录失败: ' + (error.message || '未知错误'));
    }
  }, []);

  const formatDateTime = useCallback((dateTime: string): string => {
    try {
      const date = new Date(dateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateTime;
    }
  }, []);

  const truncateJson = useCallback((json: any, maxLength: number = 50): string => {
    const jsonStr = typeof json === 'string' ? json : JSON.stringify(json);
    if (jsonStr.length <= maxLength) {
      return jsonStr;
    }
    return jsonStr.slice(0, maxLength) + '...';
  }, []);

  return {
    isHistoryDialogOpen,
    setIsHistoryDialogOpen,
    historyRuleId,
    setHistoryRuleId,
    historyData,
    setHistoryData,
    historyPage,
    setHistoryPage,
    historyPageSize,
    expandedJson,
    setExpandedJson,
    handleViewHistory,
    handleViewFullHistory,
    formatDateTime,
    truncateJson,
  };
}
