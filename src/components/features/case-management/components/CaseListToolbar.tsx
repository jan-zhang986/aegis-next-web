/**
 * 用例列表工具栏
 * 完全对齐老前端：左侧「新建 / 导入 / AI 生成」，右侧「搜索 / 视图 / 筛选 / 列表-思维导图切换 / 刷新 / 列设置」
 */

import { Search, RefreshCw, Plus, Upload, List, Network, Filter, X, Columns3 } from 'lucide-react';
import { CaseViewSelect } from './CaseViewSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export interface CaseListToolbarProps {
  searchInput: string;
  searchKeyword: string;
  loading: boolean;
  showType: 'list' | 'minder';
  viewId?: string;
  customViews?: { id: string; name: string }[];
  hasActiveFilter?: boolean;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onRefresh: () => void;
  onShowTypeChange: (type: 'list' | 'minder') => void;
  onViewChange?: (id: string) => void;
  onFilterClick?: () => void;
  onClearFilter?: () => void;
  onCreateCase?: () => void;
  onImportOpen: () => void;
  onColumnSettingsClick?: () => void;
  onAiGenerate?: () => void;
}

export function CaseListToolbar({
  searchInput,
  searchKeyword,
  loading,
  showType,
  viewId = 'all_data',
  customViews = [],
  hasActiveFilter = false,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  onRefresh,
  onShowTypeChange,
  onViewChange,
  onFilterClick,
  onClearFilter,
  onCreateCase,
  onImportOpen,
  onColumnSettingsClick,
  onAiGenerate,
}: CaseListToolbarProps) {
  // 大屏正常尺寸，小屏随视口等比例缩小；整条占满容器宽，搜索区可收缩，保证右侧按钮不被裁切
  const barCls = 'flex items-center justify-between border-b border-gray-100 flex-shrink-0 w-full min-w-0 text-sm font-medium text-gray-700';
  const tabCls =
    'data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center';
  const btnCls = 'border-gray-200 text-sm font-medium';
  const iconCls = 'shrink-0';

  return (
    <div
      className={barCls}
      style={{
        padding: 'clamp(6px, 0.9vw, 14px) clamp(12px, 1.2vw, 20px)',
        gap: 'clamp(6px, 0.6vw, 12px)',
      } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{ fontSize: 'clamp(11px, 1vw, 14px)' } as React.CSSProperties}
      >
        {/* 左侧：新建 / 导入 / AI 生成（顺序与老前端一致） */}
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onCreateCase}
          style={{
            height: 'clamp(26px, 2.5vw, 34px)',
            fontSize: 'clamp(11px, 1vw, 14px)',
            gap: 'clamp(4px, 0.4vw, 8px)',
            paddingLeft: 'clamp(8px, 0.7vw, 12px)',
            paddingRight: 'clamp(8px, 0.7vw, 12px)',
          } as React.CSSProperties}
        >
          <Plus className={iconCls} style={{ width: 'clamp(12px, 1.1vw, 16px)', height: 'clamp(12px, 1.1vw, 16px)' }} />
          新建
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={btnCls}
          onClick={onImportOpen}
          style={{
            height: 'clamp(26px, 2.5vw, 34px)',
            fontSize: 'clamp(11px, 1vw, 14px)',
            gap: 'clamp(4px, 0.4vw, 8px)',
            paddingLeft: 'clamp(8px, 0.7vw, 12px)',
            paddingRight: 'clamp(8px, 0.7vw, 12px)',
          } as React.CSSProperties}
        >
          <Upload className={iconCls} style={{ width: 'clamp(12px, 1.1vw, 16px)', height: 'clamp(12px, 1.1vw, 16px)' }} />
          导入
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={btnCls}
          onClick={onAiGenerate || (() => toast.info('AI 生成功能正在开发中，敬请期待'))}
          style={{
            height: 'clamp(26px, 2.5vw, 34px)',
            fontSize: 'clamp(11px, 1vw, 14px)',
            gap: 'clamp(4px, 0.4vw, 8px)',
            paddingLeft: 'clamp(8px, 0.7vw, 12px)',
            paddingRight: 'clamp(8px, 0.7vw, 12px)',
          } as React.CSSProperties}
        >
          AI 生成
        </Button>
      </div>

      <div
        className="flex items-center flex-1 min-w-0 justify-end"
        style={{ gap: 'clamp(6px, 0.55vw, 10px)' } as React.CSSProperties}
      >
        <div
          className="relative flex-1 min-w-0 max-w-[260px]"
          style={{ minWidth: '80px' }}
        >
          <Search
            className="absolute top-1/2 -translate-y-1/2 text-gray-400"
            style={{
              left: 'clamp(8px, 0.7vw, 12px)',
              width: 'clamp(12px, 1.1vw, 16px)',
              height: 'clamp(12px, 1.1vw, 16px)',
            } as React.CSSProperties}
          />
          <Input
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            placeholder="通过 ID/名称/标签搜索"
            className="border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-400 text-[13px] placeholder:text-gray-400"
            style={{
              height: 'clamp(26px, 2.5vw, 34px)',
              paddingLeft: 'clamp(24px, 2vw, 34px)',
              paddingRight: 'clamp(24px, 2vw, 34px)',
            } as React.CSSProperties}
          />
          {searchInput && (
            <button
              type="button"
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={onClearSearch}
              aria-label="清空搜索"
              style={{
                right: 'clamp(8px, 0.7vw, 12px)',
                width: 'clamp(12px, 1.1vw, 16px)',
                height: 'clamp(12px, 1.1vw, 16px)',
              } as React.CSSProperties}
            >
              <X className="w-full h-full" />
            </button>
          )}
        </div>

        <div className="flex-shrink-0" style={{ fontSize: 'clamp(11px, 1vw, 14px)' }}>
          <CaseViewSelect
            value={viewId}
            customViews={customViews}
            onValueChange={(id) => onViewChange?.(id)}
            onNewView={onFilterClick}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className={btnCls + (hasActiveFilter ? ' text-blue-600 border-blue-200' : ' text-gray-600') + ' flex-shrink-0'}
          onClick={onFilterClick}
          style={{
            height: 'clamp(26px, 2.5vw, 34px)',
            fontSize: 'clamp(11px, 1vw, 14px)',
            gap: 'clamp(4px, 0.4vw, 8px)',
            paddingLeft: 'clamp(8px, 0.7vw, 12px)',
            paddingRight: 'clamp(8px, 0.7vw, 12px)',
          } as React.CSSProperties}
        >
          <Filter className={iconCls + (hasActiveFilter ? ' text-blue-500' : ' text-gray-400')} style={{ width: 'clamp(12px, 1.1vw, 16px)', height: 'clamp(12px, 1.1vw, 16px)' }} />
          筛选
        </Button>

        {hasActiveFilter && onClearFilter && (
          <Button variant="ghost" size="sm" className="text-blue-600 flex-shrink-0" onClick={onClearFilter} style={{ height: 'clamp(26px, 2.5vw, 34px)', fontSize: 'clamp(11px, 1vw, 14px)' } as React.CSSProperties}>
            清空筛选
          </Button>
        )}

        {/* 列表 / 思维导图切换：老前端右侧的两个图标按钮 */}
        <Tabs
          value={showType}
          onValueChange={(v) => v && onShowTypeChange(v as 'list' | 'minder')}
          className="bg-gray-50 rounded-md flex-shrink-0"
          style={{ padding: 'clamp(2px, 0.2vw, 4px)' } as React.CSSProperties}
        >
          <TabsList
            className="bg-transparent p-0 flex"
            style={{ gap: 'clamp(2px, 0.2vw, 6px)', height: 'clamp(26px, 2.5vw, 34px)' } as React.CSSProperties}
          >
            <TabsTrigger
              value="list"
              className={tabCls + ' px-0 justify-center'}
              style={{
                height: 'clamp(26px, 2.5vw, 34px)',
                width: 'clamp(26px, 2.5vw, 34px)',
              } as React.CSSProperties}
            >
              <List style={{ width: 'clamp(12px, 1.1vw, 16px)', height: 'clamp(12px, 1.1vw, 16px)' }} />
            </TabsTrigger>
            <TabsTrigger
              value="minder"
              className={tabCls + ' px-0 justify-center'}
              style={{
                height: 'clamp(26px, 2.5vw, 34px)',
                width: 'clamp(26px, 2.5vw, 34px)',
              } as React.CSSProperties}
            >
              <Network style={{ width: 'clamp(12px, 1.1vw, 16px)', height: 'clamp(12px, 1.1vw, 16px)' }} />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="icon"
          className="text-gray-400 border-gray-200 flex-shrink-0"
          style={{ height: 'clamp(26px, 2.5vw, 34px)', width: 'clamp(26px, 2.5vw, 34px)' } as React.CSSProperties}
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={iconCls + (loading ? ' animate-spin' : '')} style={{ width: 'clamp(12px, 1.1vw, 16px)', height: 'clamp(12px, 1.1vw, 16px)' }} />
        </Button>

        {/* 老前端工具栏右侧只有 3 个小按钮：列表 / 思维导图 / 刷新；列设置入口保留在表头齿轮，不在这里展示 */}
      </div>
    </div>
  );
}
