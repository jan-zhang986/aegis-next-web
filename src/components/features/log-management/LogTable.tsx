/**
 * LogTable Component
 * 日志表格组件
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileText, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/useResponsive';
import type { OperationLog } from '@/types/log';

interface LogTableProps {
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

export function LogTable({
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
}: LogTableProps) {
  const isMobile = useIsMobile();
  
  // 处理排序
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  };

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

  // 处理操作名称点击（非删除操作可跳转）
  const handleOperationClick = (log: OperationLog) => {
    if (log.type === 'DELETE') return;
    
    // TODO: 实现跳转逻辑
    console.log('Navigate to:', log);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full">
      {/* 表格 */}
      <div className="flex-1 overflow-auto" role="region" aria-label="操作日志表格">
        {isMobile ? (
          // 移动端卡片视图
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-64" role="status" aria-live="polite" aria-label="正在加载日志数据">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" aria-hidden="true" />
                <span className="sr-only">正在加载...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400" role="status">
                <FileText className="w-10 h-10 opacity-20" aria-hidden="true" />
                <span>暂无日志数据</span>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={log.id ?? `log-${String(log.sourceId)}-${String(log.createTime)}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{log.userName || log.operUser}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getScopeLabel(log.projectId ? 'PROJECT' : log.organizationId ? 'ORGANIZATION' : 'SYSTEM')}
                      </div>
                    </div>
                    <Badge className={`${getTypeColor(log.type)} border-0 text-xs`} aria-label={`操作类型：${getTypeLabel(log.type)}`}>
                      {getTypeLabel(log.type)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700">
                    {log.type === 'DELETE' ? (
                      <span>{log.content}</span>
                    ) : (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm"
                        onClick={() => handleOperationClick(log)}
                        aria-label={`查看操作详情：${log.content}`}
                      >
                        {log.content}
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    <time dateTime={log.createTime}>
                      {formatTime(log.createTime)}
                    </time>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // 桌面端表格视图
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[120px]" scope="col">操作人</TableHead>
                <TableHead className="w-[100px]" scope="col">操作范围</TableHead>
                <TableHead className="w-[150px]" scope="col">操作对象</TableHead>
                <TableHead className="w-[100px]" scope="col">操作类型</TableHead>
                <TableHead className="min-w-[200px]" scope="col">操作名称</TableHead>
                <TableHead className="w-[180px]" scope="col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('createTime')}
                    aria-label={`按操作时间排序，当前${sortOrder === 'asc' ? '升序' : '降序'}`}
                  >
                    操作时间
                    <ArrowUpDown className="ml-2 h-3 w-3" aria-hidden="true" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div role="status" aria-live="polite" aria-label="正在加载日志数据">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" aria-hidden="true" />
                      <span className="sr-only">正在加载...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="text-gray-400 flex flex-col items-center gap-2" role="status">
                      <FileText className="w-10 h-10 opacity-20" aria-hidden="true" />
                      <span>暂无日志数据</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow key={log.id ?? `log-${String(log.sourceId)}-${String(log.createTime)}-${index}`}>
                    <TableCell>
                      <span className="text-sm text-gray-700">{log.userName || log.operUser}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {getScopeLabel(log.projectId ? 'PROJECT' : log.organizationId ? 'ORGANIZATION' : 'SYSTEM')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700 truncate block" title={log.projectName || log.organizationName}>
                        {log.projectName || log.organizationName || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getTypeColor(log.type)} border-0 text-xs`} aria-label={`操作类型：${getTypeLabel(log.type)}`}>
                        {getTypeLabel(log.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.type === 'DELETE' ? (
                        <span className="text-sm text-gray-700">{log.content}</span>
                      ) : (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm"
                          onClick={() => handleOperationClick(log)}
                          aria-label={`查看操作详情：${log.content}`}
                        >
                          {log.content}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <time 
                        className="text-sm text-gray-500 font-mono"
                        dateTime={log.createTime}
                      >
                        {formatTime(log.createTime)}
                      </time>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
}
