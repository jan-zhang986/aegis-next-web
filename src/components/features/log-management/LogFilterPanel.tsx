/**
 * LogFilterPanel Component
 * 日志筛选面板组件
 */

import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, RotateCcw, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { useIsMobile } from '@/hooks/useResponsive';
import { systemUserService } from '@/services/setting/user';
import type { LogFilters, OperationScope, OperationType } from '@/types/log';
import type { UserListItem } from '@/types/setting/user';

interface LogFilterPanelProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  onSearch: () => void;
}

// 操作模块选项
const MODULE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'SYSTEM_USER', label: '系统用户' },
  { value: 'SYSTEM_ORGANIZATION', label: '系统组织' },
  { value: 'SYSTEM_PROJECT', label: '系统项目' },
  { value: 'PROJECT_MANAGEMENT', label: '项目管理' },
  { value: 'CASE_MANAGEMENT', label: '用例管理' },
  { value: 'API_TEST', label: 'API测试' },
  { value: 'TEST_PLAN', label: '测试计划' },
  { value: 'BUG_MANAGEMENT', label: '缺陷管理' },
];

export const LogFilterPanel = memo(function LogFilterPanel({ filters, onFiltersChange, onSearch }: LogFilterPanelProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(filters.startTime);
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endTime);
  
  // 响应式检测
  const isMobile = useIsMobile();
  
  // 用户搜索相关状态
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserListItem[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  
  // 防抖定时器
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 验证时间范围
  const validateTimeRange = (start: Date | undefined, end: Date | undefined): boolean => {
    if (!start || !end) return true;

    if (start > end) {
      toast.error('开始时间不能晚于结束时间');
      return false;
    }

    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                       (end.getMonth() - start.getMonth());

    if (monthsDiff > 6) {
      toast.error('时间范围不能超过6个月');
      return false;
    }

    return true;
  };

  // 处理时间范围变更
  const handleTimeRangeChange = (start: Date | undefined, end: Date | undefined) => {
    if (validateTimeRange(start, end)) {
      setStartDate(start);
      setEndDate(end);
      onFiltersChange({ ...filters, startTime: start, endTime: end });
    }
  };

  // 远程搜索用户（带防抖）
  const searchUsers = useCallback(async (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) {
      setUserSearchResults([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      const result = await systemUserService.getUserList({
        keyword: keyword.trim(),
        current: 1,
        pageSize: 20,
      });
      setUserSearchResults(result.list || []);
    } catch (error) {
      console.error('搜索用户失败:', error);
      setUserSearchResults([]);
      toast.error('搜索用户失败');
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  // 防抖搜索
  const debouncedSearchUsers = useCallback((keyword: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      searchUsers(keyword);
    }, 300);
  }, [searchUsers]);

  // 处理用户搜索输入
  const handleUserSearchChange = (value: string) => {
    setUserSearchQuery(value);
    debouncedSearchUsers(value);
  };

  // 选择用户
  const handleUserSelect = (user: UserListItem) => {
    setSelectedUser(user);
    onFiltersChange({ ...filters, operator: user.id });
    setUserSearchOpen(false);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // 重置筛选条件
  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedUser(null);
    setUserSearchQuery('');
    setUserSearchResults([]);
    onFiltersChange({});
  };

  return (
    <section
      className="rounded-lg bg-white p-4 shadow-sm"
      role="search"
      aria-label="日志筛选"
    >
      <form
        className={cn(
          'grid gap-4',
          isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        {/* 操作人（支持远程搜索） */}
        <div className="space-y-2">
          <Label htmlFor="user-search">操作人</Label>
          <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                id="user-search"
                variant="outline"
                role="combobox"
                aria-expanded={userSearchOpen}
                aria-label="选择操作人"
                aria-haspopup="listbox"
                className="w-full justify-between"
              >
                {selectedUser ? selectedUser.name : '选择操作人'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="搜索用户（姓名/邮箱）"
                  value={userSearchQuery}
                  onValueChange={handleUserSearchChange}
                  aria-label="搜索用户"
                />
                <CommandList role="listbox">
                  {userSearchLoading ? (
                    <CommandEmpty role="status" aria-live="polite">搜索中...</CommandEmpty>
                  ) : userSearchResults.length === 0 ? (
                    <CommandEmpty role="status">
                      {userSearchQuery ? '未找到用户' : '请输入关键词搜索'}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {userSearchResults.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={() => handleUserSelect(user)}
                          role="option"
                          aria-selected={selectedUser?.id === user.id}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedUser?.id === user.id ? 'opacity-100' : 'opacity-0'
                            )}
                            aria-hidden="true"
                          />
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* 开始时间 */}
        <div className="space-y-2">
          <Label htmlFor="start-date">开始时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                id="start-date"
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                aria-label={startDate ? `开始时间：${format(startDate, 'yyyy-MM-dd')}` : '选择开始日期'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {startDate ? format(startDate, 'yyyy-MM-dd') : '选择日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => handleTimeRangeChange(date, endDate)}
                aria-label="选择开始日期"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 结束时间 */}
        <div className="space-y-2">
          <Label htmlFor="end-date">结束时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                id="end-date"
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                aria-label={endDate ? `结束时间：${format(endDate, 'yyyy-MM-dd')}` : '选择结束日期'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {endDate ? format(endDate, 'yyyy-MM-dd') : '选择日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => handleTimeRangeChange(startDate, date)}
                aria-label="选择结束日期"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 操作范围 */}
        <div className="space-y-2">
          <Label htmlFor="scope-select">操作范围</Label>
          <Select
            value={filters.scope || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, scope: value === 'all' ? undefined : value as OperationScope })
            }
          >
            <SelectTrigger id="scope-select" aria-label="选择操作范围">
              <SelectValue placeholder="选择操作范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="SYSTEM">系统</SelectItem>
              <SelectItem value="ORGANIZATION">组织</SelectItem>
              <SelectItem value="PROJECT">项目</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 操作类型 */}
        <div className="space-y-2">
          <Label htmlFor="type-select">操作类型</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, type: value === 'all' ? undefined : value as OperationType })
            }
          >
            <SelectTrigger id="type-select" aria-label="选择操作类型">
              <SelectValue placeholder="选择操作类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="ADD">添加</SelectItem>
              <SelectItem value="DELETE">删除</SelectItem>
              <SelectItem value="UPDATE">更新</SelectItem>
              <SelectItem value="DEBUG">调试</SelectItem>
              <SelectItem value="REVIEW">评审</SelectItem>
              <SelectItem value="EXECUTE">执行</SelectItem>
              <SelectItem value="IMPORT">导入</SelectItem>
              <SelectItem value="EXPORT">导出</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 操作对象（模块） */}
        <div className="space-y-2">
          <Label htmlFor="module-select">操作对象</Label>
          <Select
            value={filters.module || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, module: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="module-select" aria-label="选择操作对象">
              <SelectValue placeholder="选择操作对象" />
            </SelectTrigger>
            <SelectContent>
              {MODULE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 操作名称 */}
        <div className="space-y-2">
          <Label htmlFor="operation-name">操作名称</Label>
          <Input
            id="operation-name"
            placeholder="搜索操作名称"
            value={filters.content || ''}
            onChange={(e) => onFiltersChange({ ...filters, content: e.target.value })}
            aria-label="搜索操作名称"
          />
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2 flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1"
            aria-label="重置筛选条件"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            重置
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600"
            aria-label="查询日志"
          >
            <Search className="w-4 h-4 mr-2" aria-hidden="true" />
            查询
          </Button>
        </div>
      </form>
    </section>
  );
});
