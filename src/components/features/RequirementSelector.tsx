/**
 * 需求筛选器组件
 * 支持模糊搜索、全选、多选功能
 */

import { useState, useEffect, useMemo } from 'react';
import { Filter, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getRequirementsList, type Requirement } from '@/services/case-management/service-case-metrics';

interface RequirementSelectorProps {
  categoryKey: string;                   // 指标类别标识
  selectedRequirements: string[];        // 已选需求ID列表
  projectId?: string;                    // 项目ID
  startTime?: number;                    // 开始时间
  endTime?: number;                      // 结束时间
  onChange: (selected: string[]) => void; // 选择变化回调
}

export function RequirementSelector({
  categoryKey,
  selectedRequirements,
  projectId,
  startTime,
  endTime,
  onChange
}: RequirementSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableRequirements, setAvailableRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 本地临时选择状态（用户点击"确定"前的临时选择）
  const [tempSelected, setTempSelected] = useState<string[]>(selectedRequirements);

  // 加载需求列表（只在 Popover 打开时加载一次）
  useEffect(() => {
    if (isOpen && availableRequirements.length === 0) {
      loadRequirements();
    }
    // Popover 打开时，初始化临时选择为当前选择
    if (isOpen) {
      setTempSelected(selectedRequirements);
    }
  }, [isOpen]);
  
  // 当筛选条件变化时，如果 Popover 是打开状态，才重新加载
  useEffect(() => {
    if (isOpen && availableRequirements.length > 0) {
      loadRequirements();
    }
  }, [projectId, startTime, endTime]);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const requirements = await getRequirementsList('', projectId, startTime, endTime);
      setAvailableRequirements(requirements);
    } catch (error) {
      console.error('加载需求列表失败:', error);
      setAvailableRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  // 模糊搜索过滤
  const filteredRequirements = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableRequirements;
    }
    const query = searchQuery.toLowerCase();
    return availableRequirements.filter(req =>
      req.storyName.toLowerCase().includes(query) ||
      req.storyId.toLowerCase().includes(query)
    );
  }, [availableRequirements, searchQuery]);

  // 是否全选（基于过滤后的结果和临时选择）
  const isAllSelected = useMemo(() => {
    if (filteredRequirements.length === 0) return false;
    return filteredRequirements.every(req => tempSelected.includes(req.storyId));
  }, [filteredRequirements, tempSelected]);

  // 处理全选/取消全选（只针对当前搜索结果）
  const handleSelectAll = () => {
    if (isAllSelected) {
      // 取消全选：从临时选择中移除当前搜索结果的所有ID
      const filteredIds = filteredRequirements.map(req => req.storyId);
      setTempSelected(tempSelected.filter(id => !filteredIds.includes(id)));
    } else {
      // 全选：添加当前搜索结果的所有ID（去重）
      const filteredIds = filteredRequirements.map(req => req.storyId);
      const newSelected = [...new Set([...tempSelected, ...filteredIds])];
      setTempSelected(newSelected);
    }
  };

  // 处理单个需求切换（只修改临时状态）
  const handleToggle = (storyId: string) => {
    const newSelected = tempSelected.includes(storyId)
      ? tempSelected.filter(id => id !== storyId)
      : [...tempSelected, storyId];
    setTempSelected(newSelected);
  };

  // 清空选择（只修改临时状态）
  const handleClear = () => {
    setTempSelected([]);
  };

  // 确定（提交到父组件）
  const handleConfirm = () => {
    onChange(tempSelected);
    setIsOpen(false);
  };
  
  // 取消（恢复到之前的选择）
  const handleCancel = () => {
    setTempSelected(selectedRequirements);
    setIsOpen(false);
  };

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50 text-white"
        >
          <Filter className="w-4 h-4" />
          <span>需求筛选</span>
          {selectedRequirements.length > 0 && (
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
              {selectedRequirements.length}
            </span>
          )}
          <ChevronDown className="w-4 h-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[480px] p-0 bg-gray-900 border-gray-700 shadow-2xl" 
        align="end"
        sideOffset={8}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h4 className="text-sm font-semibold text-white">选择需求</h4>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索需求ID或名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* 全选选项 */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 rounded px-2 py-2 transition-colors"
               onClick={handleSelectAll}>
            <Checkbox
              checked={isAllSelected}
              className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <span className="text-sm font-semibold text-white">
              全选 ({filteredRequirements.length}个需求)
            </span>
          </div>
        </div>

        {/* 需求列表 */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2">加载中...</span>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Search className="w-12 h-12 mb-2 opacity-50" />
              <p>暂无需求数据</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredRequirements.map((req) => {
                const isSelected = tempSelected.includes(req.storyId);
                return (
                  <div
                    key={req.storyId}
                    className={`flex items-start gap-3 p-3 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-600/10 border border-blue-600/30' : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => handleToggle(req.storyId)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="mt-0.5 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white mb-1 line-clamp-2">
                        {req.storyName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="font-mono">{req.storyId}</span>
                        </span>
                        <span>·</span>
                        <span>{req.relatedCaseCount} 用例</span>
                        <span>·</span>
                        <span>{req.relatedTestPlanCount} 计划</span>
                        {req.defectCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-red-400">{req.defectCount} 缺陷</span>
                          </>
                        )}
                        {req.testAnalysisTime > 0 && (
                          <>
                            <span>·</span>
                            <span>{req.testAnalysisTime} 人天</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            清空
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              已选 {tempSelected.length} 个需求
            </span>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

