/**
 * VirtualizedLogTable Component
 * 日志表格组件（当前页列表 + 分页，不依赖 react-window，避免 Vite CJS 兼容问题）
 */

import { useRef, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import type { OperationLog } from '@/types/log';

interface VirtualizedLogTableProps {
  logs: OperationLog[];
  loading: boolean;
  total: number;
  current: number;
  pageSize: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (field: string, order: 'asc' | 'desc') => void;
}

// 获取操作范围标签
const getScopeLabel = (scope: string): string => {
  const scopeMap: Record<string, string> = {
    SYSTEM: '系统',
    ORGANIZATION: '组织',
    PROJECT: '项目',
  };
  return scopeMap[scope] || scope;
};

// 获取操作类型标签
const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    ADD: '添加',
    DELETE: '删除',
    UPDATE: '更新',
    DEBUG: '调试',
    EXECUTE: '执行',
    REVIEW: '评审',
    COPY: '复制',
    SHARE: '分享',
    RESTORE: '恢复',
    IMPORT: '导入',
    EXPORT: '导出',
  };
  return typeMap[type] || type;
};

// 获取操作类型颜色
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    ADD: 'bg-green-50 text-green-600',
    DELETE: 'bg-red-50 text-red-600',
    UPDATE: 'bg-blue-50 text-blue-600',
    DEBUG: 'bg-purple-50 text-purple-600',
    EXECUTE: 'bg-orange-50 text-orange-600',
  };
  return colorMap[type] || 'bg-gray-50 text-gray-600';
};

// 格式化时间
const formatTime = (time: string): string => {
  try {
    return format(new Date(time), 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return time;
  }
};

// 行组件 - 使用 memo 优化
const LogRow = memo(({
  log,
  onOperationClick,
}: {
  log: OperationLog;
  onOperationClick: (log: OperationLog) => void;
}) => (
  <div className="flex items-center border-b border-gray-100 h-14">
    <div className="flex w-full px-4">
      <div className="w-[120px] flex items-center shrink-0">
        <span className="text-sm text-gray-700 truncate">
          {log.userName || log.operUser}
        </span>
      </div>
      <div className="w-[100px] flex items-center shrink-0">
        <span className="text-sm text-gray-600">
          {getScopeLabel(log.projectId ? 'PROJECT' : log.organizationId ? 'ORGANIZATION' : 'SYSTEM')}
        </span>
      </div>
      <div className="w-[150px] flex items-center shrink-0">
        <span className="text-sm text-gray-700 truncate" title={log.projectName || log.organizationName}>
          {log.projectName || log.organizationName || '-'}
        </span>
      </div>
      <div className="w-[100px] flex items-center shrink-0">
        <Badge className={`${getTypeColor(log.type)} border-0 text-xs`}>
          {getTypeLabel(log.type)}
        </Badge>
      </div>
      <div className="min-w-[200px] flex-1 flex items-center min-w-0">
        {log.type === 'DELETE' ? (
          <span className="text-sm text-gray-700 truncate">{log.content}</span>
        ) : (
          <Button
            variant="link"
            className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm truncate"
            onClick={() => onOperationClick(log)}
          >
            {log.content}
          </Button>
        )}
      </div>
      <div className="w-[180px] flex items-center shrink-0">
        <time className="text-sm text-gray-500 font-mono" dateTime={log.createTime}>
          {formatTime(log.createTime)}
        </time>
      </div>
    </div>
  </div>
));

LogRow.displayName = 'LogRow';

export const VirtualizedLogTable = memo(function VirtualizedLogTable({
  logs,
  loading,
  total,
  current,
  pageSize,
  sortField,
  sortOrder,
  onPageChange,
  onPageSizeChange,
  onSort,
}: VirtualizedLogTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 处理排序
  const handleSort = useCallback((field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  }, [sortField, sortOrder, onSort]);

  // 处理操作名称点击（非删除操作可跳转）
  const handleOperationClick = useCallback((log: OperationLog) => {
    if (log.type === 'DELETE') return;
    
    // TODO: 实现跳转逻辑
    console.log('Navigate to:', log);
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* 表格容器 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" role="region" aria-label="操作日志表格">
        {/* 表头 */}
        <div className="bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="flex px-4 h-12 items-center">
            <div className="w-[120px] text-sm font-medium text-gray-700 shrink-0">操作人</div>
            <div className="w-[100px] text-sm font-medium text-gray-700 shrink-0">操作范围</div>
            <div className="w-[150px] text-sm font-medium text-gray-700 shrink-0">操作对象</div>
            <div className="w-[100px] text-sm font-medium text-gray-700 shrink-0">操作类型</div>
            <div className="min-w-[200px] flex-1 text-sm font-medium text-gray-700 min-w-0">操作名称</div>
            <div className="w-[180px] shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm font-medium text-gray-700"
                onClick={() => handleSort('createTime')}
                aria-label={`按操作时间排序，当前${sortOrder === 'asc' ? '升序' : '降序'}`}
              >
                操作时间
                <ArrowUpDown className="ml-2 h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* 列表区：可滚动 */}
        {loading ? (
          <div className="flex items-center justify-center flex-1 min-h-[200px]" role="status" aria-live="polite">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" aria-hidden="true" />
            <span className="sr-only">正在加载...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] text-gray-400" role="status">
            <FileText className="w-10 h-10 opacity-20" aria-hidden="true" />
            <span>暂无日志数据</span>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            {logs.map((log, index) => (
              <LogRow key={log.id ?? `log-${String(log.sourceId)}-${String(log.createTime)}-${index}`} log={log} onOperationClick={handleOperationClick} />
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      <nav 
        className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 text-xs text-gray-500"
        role="navigation"
        aria-label="日志分页导航"
      >
        <div aria-live="polite" aria-atomic="true">共 {total} 条记录</div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[10px]"
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
            aria-label="上一页"
          >
            上一页
          </Button>
          <span className="px-2" aria-current="page" aria-label={`第 ${current} 页，共 ${totalPages || 1} 页`}>
            {current} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[10px]"
            disabled={current >= totalPages}
            onClick={() => onPageChange(current + 1)}
            aria-label="下一页"
          >
            下一页
          </Button>
        </div>
      </nav>
    </div>
  );
});
