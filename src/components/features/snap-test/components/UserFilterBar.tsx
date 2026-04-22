/**
 * UserFilterBar - 筛选栏（样式参考 FilterBar）
 * 维度切换、时间范围、项目选择 / 人员选择
 */
import React from 'react';
import { Filter, Target, User, Calendar as CalendarIcon, ChevronDown, Search, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { zhCN } from 'date-fns/locale';
import type { SnapTestTimeRangeType, SnapTestComparisonType } from '@/types/snap-test';
import type { UserOption } from '@/types/snap-test';
import type { SnapTestDimensionType } from '@/types/snap-test';

export interface UserFilterBarProps {
  dimension: SnapTestDimensionType;
  setDimension: (v: SnapTestDimensionType) => void;
  comparisonMode: SnapTestComparisonType;
  setComparisonMode: (v: SnapTestComparisonType) => void;
  timeRange: SnapTestTimeRangeType;
  setTimeRange: (v: SnapTestTimeRangeType) => void;
  customDateRange: { start: Date | null; end: Date | null };
  setCustomDateRange: (v: { start: Date | null; end: Date | null }) => void;
  showCustomDatePicker: boolean;
  setShowCustomDatePicker: (v: boolean) => void;
  selectedProject: string;
  setSelectedProject: (v: string) => void;
  projects: Array<{ id: string; name: string }>;
  projectsLoading?: boolean;
  snapTestSelectedUsers: string[];
  setSnapTestSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  showSnapTestUserPicker: boolean;
  setShowSnapTestUserPicker: (v: boolean) => void;
  availableUsers: UserOption[];
  usersLoading: boolean;
  userSearchQuery: string;
  setUserSearchQuery: (v: string) => void;
}

const timeRangeLabels: Record<SnapTestTimeRangeType, string> = {
  today: '今天',
  week: '最近7天',
  month: '最近30天',
  quarter: '本季度',
  year: '本年度',
  custom: '自定义范围',
};

export const UserFilterBar: React.FC<UserFilterBarProps> = (props) => {
  const {
    dimension,
    setDimension,
    comparisonMode,
    setComparisonMode,
    timeRange,
    setTimeRange,
    customDateRange,
    setCustomDateRange,
    showCustomDatePicker,
    setShowCustomDatePicker,
    selectedProject,
    setSelectedProject,
    projects,
    projectsLoading,
    snapTestSelectedUsers,
    setSnapTestSelectedUsers,
    showSnapTestUserPicker,
    setShowSnapTestUserPicker,
    availableUsers,
    usersLoading,
    userSearchQuery,
    setUserSearchQuery,
  } = props;

  const userLabel =
    snapTestSelectedUsers.length === 0
      ? '选择人员（可多选）'
      : (() => {
          const names = snapTestSelectedUsers
            .map((e) => availableUsers.find((u) => u.value === e)?.name || e.split('@')[0])
            .filter(Boolean);
          if (names.length === 0) return `已选择 ${snapTestSelectedUsers.length} 人`;
          return names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} +${names.length - 3}`;
        })();

  return (
    <div className="flex items-center gap-4 mb-6 bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">筛选维度：</span>
      </div>

      {/* 项目 / 个人维度切换 */}
      <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => setDimension('project')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            dimension === 'project' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Target className="w-4 h-4" />
          项目维度
        </button>
        <button
          onClick={() => setDimension('personal')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            dimension === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          个人维度
        </button>
      </div>

      {/* 同比/环比切换 */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setComparisonMode('MOM')}
          className={`px-4 py-1.5 rounded text-sm transition-all ${
            comparisonMode === 'MOM'
              ? 'bg-emerald-500 text-white font-semibold'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          环比
        </button>
        <button
          type="button"
          onClick={() => setComparisonMode('YOY')}
          className={`px-4 py-1.5 rounded text-sm transition-all ${
            comparisonMode === 'YOY'
              ? 'bg-emerald-500 text-white font-semibold'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          同比
        </button>
      </div>

      {/* 时间范围 */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        {timeRange === 'custom' ? (
          <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`flex h-10 items-center justify-start rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition-all hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 ${
                  customDateRange.start && customDateRange.end ? 'min-w-[280px] max-w-[400px]' : 'w-[240px]'
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1 text-left">
                  {customDateRange.start && customDateRange.end ? (
                    `${customDateRange.start.getFullYear()}年${(customDateRange.start.getMonth() + 1).toString().padStart(2, '0')}月${customDateRange.start.getDate().toString().padStart(2, '0')}日 - ${customDateRange.end.getFullYear()}年${(customDateRange.end.getMonth() + 1).toString().padStart(2, '0')}月${customDateRange.end.getDate().toString().padStart(2, '0')}日`
                  ) : (
                    <span className="text-gray-400">选择日期范围</span>
                  )}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start" sideOffset={4}>
              <div className="p-2 border-b border-gray-700">
                <Select
                  value={timeRange}
                  onValueChange={(value) => {
                    setTimeRange(value as SnapTestTimeRangeType);
                    setShowCustomDatePicker(false);
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 [&>svg]:hidden">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {(['today', 'week', 'month', 'quarter', 'year', 'custom'] as const).map((v) => (
                      <SelectItem key={v} value={v} className="text-white hover:bg-gray-700">
                        {timeRangeLabels[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="range"
                locale={zhCN}
                selected={{ from: customDateRange.start || undefined, to: customDateRange.end || undefined }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setCustomDateRange({ start: range.from, end: range.to });
                    setShowCustomDatePicker(false);
                  } else if (range?.from) {
                    setCustomDateRange({ start: range.from, end: null });
                  }
                }}
                numberOfMonths={2}
                className="bg-gray-800 text-white"
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Select
            value={timeRange}
            onValueChange={(value) => {
              const newRange = value as SnapTestTimeRangeType;
              if (newRange === 'custom') {
                setTimeRange('custom');
                setTimeout(() => setShowCustomDatePicker(true), 0);
              } else {
                setTimeRange(newRange);
                setShowCustomDatePicker(false);
              }
            }}
          >
            <SelectTrigger className="w-[160px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {(['today', 'week', 'month', 'quarter', 'year', 'custom'] as const).map((v) => (
                <SelectItem key={v} value={v} className="text-white hover:bg-gray-700">
                  {timeRangeLabels[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 项目选择（项目维度时显示） */}
      {dimension === 'project' && (
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" />
          <Select value={selectedProject} onValueChange={setSelectedProject} disabled={projectsLoading}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              <SelectValue placeholder="选择项目" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                全部项目
              </SelectItem>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className="text-white hover:bg-gray-700"
                  >
                    {project.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" className="text-gray-500 hover:bg-gray-700" disabled>
                  {projectsLoading ? '加载中...' : '暂无项目'}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 用户选择（个人维度时显示） */}
      {dimension === 'personal' && !usersLoading && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <Popover
            open={showSnapTestUserPicker}
            onOpenChange={(open) => {
              setShowSnapTestUserPicker(open);
              if (!open) setUserSearchQuery('');
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-[280px] items-center justify-between rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
              >
                <span className="truncate flex-1 text-left">{userLabel}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[320px] p-0 bg-gray-800 border-gray-700 shadow-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <div className="p-3 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索用户姓名或邮箱..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <button
                  onClick={() => {
                    setSnapTestSelectedUsers([]);
                    setShowSnapTestUserPicker(false);
                    setUserSearchQuery('');
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    snapTestSelectedUsers.length === 0 ? 'bg-gray-700 text-blue-400' : 'text-white'
                  }`}
                >
                  {snapTestSelectedUsers.length === 0 && <Check className="h-4 w-4" />}
                  <span className="flex-1">全部用户</span>
                </button>
                {(() => {
                  const q = userSearchQuery.toLowerCase().trim();
                  const list = q
                    ? availableUsers.filter(
                        (u) =>
                          u.name?.toLowerCase().includes(q) ||
                          u.value?.toLowerCase().includes(q)
                      )
                    : availableUsers;
                  if (list.length === 0)
                    return (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        {userSearchQuery ? '未找到匹配的用户' : '暂无用户数据'}
                      </div>
                    );
                  return list.map((user) => {
                    const checked = snapTestSelectedUsers.includes(user.value);
                    return (
                      <button
                        key={user.value}
                        onClick={() =>
                          setSnapTestSelectedUsers((p) =>
                            checked ? p.filter((e) => e !== user.value) : [...p, user.value]
                          )
                        }
                        className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                          checked ? 'bg-gray-700 text-blue-400' : 'text-white'
                        }`}
                      >
                        {checked && <Check className="h-4 w-4" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          {user.value && (
                            <div className="text-xs text-gray-400 truncate">{user.value}</div>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
              {snapTestSelectedUsers.length > 0 && (
                <div className="p-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">已选择：</div>
                  <div className="flex flex-wrap gap-1">
                    {snapTestSelectedUsers.map((email) => {
                      const u = availableUsers.find((x) => x.value === email);
                      return (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-white"
                        >
                          {u?.name || email}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSnapTestSelectedUsers((p) => p.filter((x) => x !== email));
                            }}
                            className="ml-1 hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};
