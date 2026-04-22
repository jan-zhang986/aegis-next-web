/**
 * useUserFilter - 项目/个人维度、时间、项目与用户筛选
 */
import { useState, useEffect, useCallback } from 'react';
import { http } from '@/utils/request';
import type { SnapTestTimeRangeType, SnapTestDimensionType, SnapTestComparisonType } from '@/types/snap-test';
import type { UserOption } from '@/types/snap-test';

export type { SnapTestDimensionType };

export function useUserFilter(initial: {
  timeRange?: SnapTestTimeRangeType;
  customDateRange?: { start: Date | null; end: Date | null };
  dimension?: SnapTestDimensionType;
}) {
  const [dimension, setDimension] = useState<SnapTestDimensionType>(initial.dimension ?? 'project');
  const [timeRange, setTimeRange] = useState<SnapTestTimeRangeType>(initial.timeRange ?? 'week');
  const [customDateRange, setCustomDateRange] = useState(initial.customDateRange ?? { start: null, end: null });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<SnapTestComparisonType>('MOM');
  // 默认使用右上角当前项目（localStorage currentProjectId）
  const [selectedProject, setSelectedProject] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    const id = localStorage.getItem('currentProjectId');
    return id && id !== 'no_such_project' ? id : 'all';
  });
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [snapTestSelectedUsers, setSnapTestSelectedUsers] = useState<string[]>([]);
  const [showSnapTestUserPicker, setShowSnapTestUserPicker] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const formatDate = useCallback((date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const getDateRange = useCallback((): { startDate: string | null; endDate: string | null } => {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;
    switch (timeRange) {
      case 'today': start = end = new Date(today); break;
      case 'week': start = new Date(today); start.setDate(today.getDate() - 6); end = new Date(today); break;
      case 'month': start = new Date(today); start.setDate(today.getDate() - 29); end = new Date(today); break;
      case 'quarter': start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); end = new Date(today); break;
      case 'year': start = new Date(today.getFullYear(), 0, 1); end = new Date(today); break;
      case 'custom': if (customDateRange.start && customDateRange.end) { start = customDateRange.start; end = customDateRange.end; } break;
    }
    return { startDate: start ? formatDate(start) : null, endDate: end ? formatDate(end) : null };
  }, [timeRange, customDateRange, formatDate]);

  // 项目列表（与 FilterBar / 效能大屏一致）
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    http.get<Array<{ id: string; name: string }> | { code: number; data?: Array<{ id: string; name: string }> }>('/project/list/public')
      .then((response: any) => {
        if (cancelled) return;
        const list = Array.isArray(response)
          ? response
          : (response?.data ?? []);
        const projectList = (list || []).map((p: any) => ({ id: p.id, name: p.name || p.id }));
        setProjects(projectList);
        const currentId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
        const hasValidCurrent = currentId && currentId !== 'no_such_project' && projectList.some((p: any) => p.id === currentId);
        setSelectedProject((prev) => {
          if (hasValidCurrent && prev === 'all') return currentId;
          if (prev !== 'all' && !projectList.find((p: any) => p.id === prev)) return 'all';
          return prev;
        });
      })
      .catch(() => { if (!cancelled) setProjects([]); })
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // 用户列表（与用例管理 / 效能大屏一致：/system/user/list/public），传参仍用 personal: [邮箱]
  useEffect(() => {
    let cancelled = false;
    setUsersLoading(true);
    http.get<Array<{ id: string; name: string; email?: string }> | { code: number; data?: Array<{ id: string; name: string; email?: string }> }>('/system/user/list/public')
      .then((response: any) => {
        if (cancelled) return;
        const list = Array.isArray(response) ? response : (response?.data ?? []);
        const userList = (list || [])
          .filter((u: any) => u.email)
          .map((u: any) => ({
            value: u.email,
            label: `${u.name || u.email} ${u.email}`,
            name: u.name || u.email || '',
            id: u.id != null ? String(u.id) : undefined,
          })) as UserOption[];
        setAvailableUsers(userList);
      })
      .catch(() => { if (!cancelled) setAvailableUsers([]); })
      .finally(() => { if (!cancelled) setUsersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return {
    dimension, setDimension,
    comparisonMode, setComparisonMode,
    selectedProject, setSelectedProject, projects, projectsLoading,
    timeRange, setTimeRange, customDateRange, setCustomDateRange,
    showCustomDatePicker, setShowCustomDatePicker,
    snapTestSelectedUsers, setSnapTestSelectedUsers, showSnapTestUserPicker, setShowSnapTestUserPicker,
    availableUsers, usersLoading, userSearchQuery, setUserSearchQuery,
    formatDate, getDateRange,
  };
}
