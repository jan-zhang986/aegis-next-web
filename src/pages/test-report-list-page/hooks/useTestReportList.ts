import { useState, useCallback } from 'react';
import type { TestReportStats } from '@/services/workflow-test-report';

const defaultStats: TestReportStats = {
  total: 0,
  completed: 0,
  running: 0,
  failed: 0,
  avgSuccessRate: 0,
};

export function useTestReportList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [jumpToPage, setJumpToPage] = useState<number | ''>('');
  const [reports, setReports] = useState<any[]>([]);
  const [listStats, setListStats] = useState<TestReportStats>(defaultStats);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCount,
    setTotalCount,
    isLoading,
    setIsLoading,
    jumpToPage,
    setJumpToPage,
    reports,
    setReports,
    listStats,
    setListStats,
  };
}
