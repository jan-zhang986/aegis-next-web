/**
 * FilterBar 组件
 * 顶部筛选器栏，包含维度切换、时间范围选择、项目/用户选择
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';
import {
  Filter,
  Target,
  User,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { zhCN } from 'date-fns/locale';
import type { DimensionType, TimeRangeType, CustomDateRange } from '@/types/efficiency';

interface FilterBarProps {
  dimension: DimensionType;
  setDimension: (dim: DimensionType) => void;
  timeRange: TimeRangeType;
  setTimeRange: (range: TimeRangeType) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: (range: CustomDateRange) => void;
  showCustomDatePicker: boolean;
  setShowCustomDatePicker: (show: boolean) => void;
  selectedProjects: string[];
  setSelectedProjects: (projects: string[] | ((prev: string[]) => string[])) => void;
  projects: Array<{ id: string; name: string }>;
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  users: Array<{ id: string; name: string; email?: string }>;
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  isUserSelectOpen: boolean;
  setIsUserSelectOpen: (open: boolean) => void;
}

/**
 * FilterBar 组件
 */
export const FilterBar = React.memo(function FilterBar({
  dimension,
  setDimension,
  timeRange,
  setTimeRange,
  customDateRange,
  setCustomDateRange,
  showCustomDatePicker,
  setShowCustomDatePicker,
  selectedProjects,
  setSelectedProjects,
  projects,
  selectedUser,
  setSelectedUser,
  users,
  userSearchQuery,
  setUserSearchQuery,
  isUserSelectOpen,
  setIsUserSelectOpen,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-4 mb-6 bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300">筛选维度：</span>
      </div>

      {/* 个人/项目维度切换 */}
      <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => setDimension('project')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            dimension === 'project'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Target className="w-4 h-4" />
          项目维度
        </button>
        <button
          onClick={() => setDimension('personal')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            dimension === 'personal'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          个人维度
        </button>
      </div>

      {/* 时间范围选择 */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-gray-400" />
        {timeRange === 'custom' ? (
          <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`flex h-10 items-center justify-start rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition-all hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 ${
                  customDateRange.start && customDateRange.end
                    ? 'min-w-[320px] max-w-[400px]'
                    : 'w-[240px]'
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
            <PopoverContent
              className="w-auto p-0 bg-gray-800 border-gray-700"
              align="start"
              sideOffset={4}
            >
              <div className="p-2 border-b border-gray-700">
                <Select
                  value={timeRange}
                  onValueChange={(value) => {
                    const newRange = value as TimeRangeType;
                    setTimeRange(newRange);
                    setShowCustomDatePicker(false);
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 [&>svg]:hidden">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="today" className="text-white hover:bg-gray-700">
                      今天
                    </SelectItem>
                    <SelectItem value="week" className="text-white hover:bg-gray-700">
                      最近7天
                    </SelectItem>
                    <SelectItem value="month" className="text-white hover:bg-gray-700">
                      最近30天
                    </SelectItem>
                    <SelectItem value="quarter" className="text-white hover:bg-gray-700">
                      本季度
                    </SelectItem>
                    <SelectItem value="year" className="text-white hover:bg-gray-700">
                      本年度
                    </SelectItem>
                    <SelectItem value="custom" className="text-white hover:bg-gray-700">
                      自定义
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                mode="range"
                locale={zhCN}
                selected={{
                  from: customDateRange.start || undefined,
                  to: customDateRange.end || undefined,
                }}
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
              const newRange = value as TimeRangeType;
              if (newRange === 'custom') {
                setTimeRange('custom');
                // 使用 setTimeout 确保状态更新后再打开 Popover
                setTimeout(() => {
                  setShowCustomDatePicker(true);
                }, 0);
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
              <SelectItem value="today" className="text-white hover:bg-gray-700">
                今天
              </SelectItem>
              <SelectItem value="week" className="text-white hover:bg-gray-700">
                最近7天
              </SelectItem>
              <SelectItem value="month" className="text-white hover:bg-gray-700">
                最近30天
              </SelectItem>
              <SelectItem value="quarter" className="text-white hover:bg-gray-700">
                本季度
              </SelectItem>
              <SelectItem value="year" className="text-white hover:bg-gray-700">
                本年度
              </SelectItem>
              <SelectItem value="custom" className="text-white hover:bg-gray-700">
                自定义
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 项目选择（项目维度时显示，多选） */}
      {dimension === 'project' && (
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" />
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-[240px] h-10 px-3 py-2 justify-between items-center flex rounded-md border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <span className="truncate text-sm">
                  {selectedProjects.length === 0 || selectedProjects.includes('all')
                    ? '全部项目'
                    : selectedProjects.length === 1
                      ? projects.find((p) => p.id === selectedProjects[0])?.name ?? selectedProjects[0]
                      : `已选 ${selectedProjects.length} 个项目`}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="z-40 w-[320px] p-0 bg-gray-800 border-gray-700 shadow-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <button
                  onClick={() => setSelectedProjects(['all'])}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-gray-700"
                >
                  <Checkbox
                    checked={selectedProjects.length === 0 || selectedProjects.includes('all')}
                    onCheckedChange={(checked) => setSelectedProjects(checked ? ['all'] : [])}
                    onClick={(e) => e.stopPropagation()}
                    className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-sm text-white">全部项目</span>
                </button>
                {projects.length > 0 &&
                  projects.map((project) => {
                    const checked = selectedProjects.includes(project.id);
                    return (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjects((prev) => {
                            const next = prev.filter((x) => x !== 'all');
                            if (checked) {
                              const newIds = next.filter((id) => id !== project.id);
                              return newIds.length === 0 ? ['all'] : newIds;
                            }
                            return [...next, project.id];
                          });
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checked) => {
                            setSelectedProjects((prev) => {
                              const next = prev.filter((x) => x !== 'all');
                              if (checked) return [...next, project.id];
                              const newIds = next.filter((id) => id !== project.id);
                              return newIds.length === 0 ? ['all'] : newIds;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className="text-sm text-white truncate">{project.name}</span>
                      </button>
                    );
                  })}
                {projects.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">暂无项目</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 用户选择（个人维度时显示） */}
      {dimension === 'personal' && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <Popover
            open={isUserSelectOpen}
            onOpenChange={(open) => {
              setIsUserSelectOpen(open);
              if (!open) {
                setUserSearchQuery(''); // 关闭时清空搜索
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-[280px] h-10 px-3 py-2 justify-between items-center flex rounded-md border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <span className="truncate text-sm">
                  {selectedUser === 'all'
                    ? '所有用户'
                    : users.find((u) => u.id === selectedUser)?.name || '选择用户'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="z-40 w-[320px] p-0 bg-gray-800 border-gray-700 shadow-lg"
              align="start"
              side="bottom"
              sideOffset={4}
              alignOffset={0}
              collisionPadding={8}
            >
              {/* 搜索框 */}
              <div className="p-3 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索用户姓名或邮箱..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-8 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* 用户列表 */}
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
                {/* "所有用户"选项 */}
                <button
                  onClick={() => {
                    setSelectedUser('all');
                    setIsUserSelectOpen(false);
                    setUserSearchQuery('');
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    selectedUser === 'all' ? 'bg-gray-700 text-blue-400' : 'text-white'
                  }`}
                >
                  {selectedUser === 'all' && <Check className="h-4 w-4" />}
                  <span className="flex-1">所有用户</span>
                </button>

                {/* 过滤后的用户列表 */}
                {(() => {
                  const filteredUsers = users.filter((user) => {
                    if (!userSearchQuery) return true;
                    const query = userSearchQuery.toLowerCase();
                    return (
                      user.name?.toLowerCase().includes(query) ||
                      user.email?.toLowerCase().includes(query)
                    );
                  });

                  return filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user.id);
                          setIsUserSelectOpen(false);
                          setUserSearchQuery('');
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                          selectedUser === user.id ? 'bg-gray-700 text-blue-400' : 'text-white'
                        }`}
                      >
                        {selectedUser === user.id && <Check className="h-4 w-4" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          {user.email && (
                            <div className="text-xs text-gray-400 truncate">{user.email}</div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      未找到匹配的用户
                    </div>
                  );
                })()}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
});
