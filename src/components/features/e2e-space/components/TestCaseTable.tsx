/**
 * TestCaseTable Component
 * 测试用例表格组件
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import React from 'react';
import { Plus, Play, Copy, Trash2, Pencil, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TestCase } from '@/types/e2e-space';

interface TestCaseTableProps {
  filteredTestCases: TestCase[];
  selectedTestCaseIds: Set<string>;
  selectedTestCase: TestCase | null;
  selectedModule: string | null;
  searchTerm: string;
  columnWidths: Record<string, number>;
  resizingColumn: string | null;
  editingTestCaseId: string | null;
  editingTestCaseName: string;
  loading: boolean;
  handleToggleSelectAll: (checked: boolean) => void;
  handleToggleTestCaseSelection: (testCaseId: string) => void;
  handleResizeStart: (column: string, e: React.MouseEvent) => void;
  setSelectedTestCase: (testCase: TestCase) => void;
  handleStartEditTestCaseName: (testCase: TestCase) => void;
  setEditingTestCaseName: (name: string) => void;
  handleSaveTestCaseName: (testCase: TestCase, skipIfUnchanged?: boolean) => void;
  handleCancelEditTestCaseName: () => void;
  handleRunTestCase: (testCase: TestCase) => void;
  handleEditTestCase: (testCase: TestCase) => void;
  handleCopyTestCase: (testCase: TestCase) => void;
  setTestCaseToDelete: (testCase: TestCase) => void;
  setIsDeleteTestCaseDialogOpen: (open: boolean) => void;
  setIsCreateTestCaseDialogOpen: (open: boolean) => void;
}

const getStatusBadge = (status: TestCase['status']) => {
  switch (status) {
    case 'success':
      return (
        <div className="flex items-center justify-center gap-1 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">Passed</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center justify-center gap-1 text-red-600">
          <XCircle className="w-4 h-4" />
          <span className="text-sm">Failed</span>
        </div>
      );
    case 'not-run':
      return (
        <div className="flex items-center justify-center gap-1 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm">未运行</span>
        </div>
      );
  }
};

const ResizableTableHead: React.FC<{
  width: number;
  column: string;
  resizingColumn: string | null;
  handleResizeStart: (column: string, e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ width, column, resizingColumn, handleResizeStart, className = '', children }) => (
  <TableHead style={{ width: `${width}px` }} className={`${className} relative`}>
    {children}
    <div
      className="absolute top-0 -right-1 w-3 h-full cursor-col-resize z-20"
      style={{
        backgroundColor: resizingColumn === column
          ? 'rgba(59, 130, 246, 0.3)'
          : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (resizingColumn !== column) {
          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (resizingColumn !== column) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      onMouseDown={(e) => handleResizeStart(column, e)}
    />
  </TableHead>
);

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
  filteredTestCases,
  selectedTestCaseIds,
  selectedTestCase,
  selectedModule,
  searchTerm,
  columnWidths,
  resizingColumn,
  editingTestCaseId,
  editingTestCaseName,
  loading,
  handleToggleSelectAll,
  handleToggleTestCaseSelection,
  handleResizeStart,
  setSelectedTestCase,
  handleStartEditTestCaseName,
  setEditingTestCaseName,
  handleSaveTestCaseName,
  handleCancelEditTestCaseName,
  handleRunTestCase,
  handleEditTestCase,
  handleCopyTestCase,
  setTestCaseToDelete,
  setIsDeleteTestCaseDialogOpen,
  setIsCreateTestCaseDialogOpen,
}) => {
  return (
    <div className="flex-1 overflow-auto">
      <Table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <ResizableTableHead
              width={columnWidths.checkbox}
              column="checkbox"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="border-r border-gray-200"
            >
              <Checkbox
                checked={filteredTestCases.length > 0 && selectedTestCaseIds.size === filteredTestCases.length}
                onCheckedChange={handleToggleSelectAll}
              />
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.name}
              column="name"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="border-r border-gray-200"
            >
              测试名称
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.description}
              column="description"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="border-r border-gray-200"
            >
              描述
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.category}
              column="category"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="border-r border-gray-200"
            >
              分类
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.nodeCount}
              column="nodeCount"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="text-center border-r border-gray-200"
            >
              节点数
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.duration}
              column="duration"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="text-center border-r border-gray-200"
            >
              执行时长
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.status}
              column="status"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="text-center border-r border-gray-200"
            >
              状态
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.lastRun}
              column="lastRun"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="border-r border-gray-200"
            >
              上次运行
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.creator}
              column="creator"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="border-r border-gray-200"
            >
              创建者
            </ResizableTableHead>
            <ResizableTableHead
              width={columnWidths.actions}
              column="actions"
              resizingColumn={resizingColumn}
              handleResizeStart={handleResizeStart}
              className="text-right"
            >
              操作
            </ResizableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTestCases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {searchTerm ? '没有找到匹配的测试用例' : selectedModule ? '该模块下暂无测试用例' : '暂无测试用例'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      {searchTerm
                        ? '请尝试其他搜索关键词'
                        : selectedModule
                        ? '创建测试用例以开始自动化测试'
                        : '请先选择一个模块，或创建新的测试用例'}
                    </p>
                    {!searchTerm && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => setIsCreateTestCaseDialogOpen(true)}
                        disabled={!selectedModule}
                      >
                        <Plus className="w-4 h-4" />
                        新建测试用例
                      </Button>
                    )}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredTestCases.map((testCase) => {
              const tc = testCase as TestCase;
              const testCaseId: string = tc.id;
              const selectedId: string | null = selectedTestCase && selectedTestCase !== null ? (selectedTestCase as TestCase).id : null;
              const isSelected: boolean = selectedId === testCaseId;
              const isChecked = selectedTestCaseIds.has(testCaseId);
              return (
                <TableRow
                  key={testCaseId}
                  className={`border-b-0 border-l-2 border-l-transparent hover:bg-blue-100 hover:border-l-blue-500 cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-l-blue-500' : ''
                  } ${isChecked ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedTestCase(tc)}
                >
                  <TableCell style={{ width: `${columnWidths.checkbox}px` }} onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggleTestCaseSelection(testCaseId)}
                    />
                  </TableCell>
                  <TableCell
                    style={{ width: `${columnWidths.name}px` }}
                    className="font-medium overflow-hidden"
                    onDoubleClick={() => handleStartEditTestCaseName(tc)}
                  >
                    {editingTestCaseId === testCaseId ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTestCaseName}
                          onChange={(e) => setEditingTestCaseName(e.target.value)}
                          onBlur={() => handleSaveTestCaseName(tc, true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveTestCaseName(tc, false);
                            } else if (e.key === 'Escape') {
                              handleCancelEditTestCaseName();
                            }
                          }}
                          autoFocus
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/test-case-name min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 min-w-0 overflow-hidden text-ellipsis">
                              <span className="truncate inline-block max-w-full">
                                {tc.name}
                                <span className="text-gray-400 text-xs ml-2">({testCaseId})</span>
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs break-words">
                              {tc.name} ({testCaseId})
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover/test-case-name:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditTestCaseName(tc);
                          }}
                          title="编辑名称"
                        >
                          <Pencil className="w-3 h-3 text-blue-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.description}px` }} className="text-gray-600 overflow-hidden">
                    {tc.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate">
                            {tc.description}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs break-words">
                            {tc.description}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.category}px` }}>
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                      {tc.category}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.nodeCount}px` }} className="text-center">{tc.nodeCount}</TableCell>
                  <TableCell style={{ width: `${columnWidths.duration}px` }} className="text-center text-gray-600">
                    {tc.duration ? (tc.duration >= 1000 ? `${(tc.duration / 1000).toFixed(2)}s` : `${tc.duration}ms`) : '-'}
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.status}px` }} className="text-center">
                    {getStatusBadge(tc.status)}
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.lastRun}px` }} className="text-gray-600 overflow-hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate">
                          {tc.lastRun || '未运行'}
                        </span>
                      </TooltipTrigger>
                      {tc.lastRun && (
                        <TooltipContent>
                          <p>{tc.lastRun}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.creator}px` }} className="overflow-hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate">
                          {tc.creator}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tc.creator}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.actions}px` }} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunTestCase(tc);
                        }}
                        title="运行用例"
                        disabled={loading}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTestCase(tc);
                        }}
                        title="编辑用例"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTestCase(tc);
                        }}
                        title="复制用例"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTestCaseToDelete(tc);
                          setIsDeleteTestCaseDialogOpen(true);
                        }}
                        title="删除用例"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
