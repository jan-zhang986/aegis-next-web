/**
 * 执行日志抽屉组件
 * 用于显示工作流执行过程中的日志信息
 */
import React, { useCallback } from 'react';
import { toast } from 'sonner';
import {
  Activity,
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  RefreshCw,
  Copy,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { JsonViewer } from '@/components/ui/json-viewer';
import type { ExecutionLog, DebugMode } from '@/components/features/workflow/types';
import { useExecutionLogDrawer, useExecutionLogCalculations } from './execution-log-drawer';

interface ExecutionLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: ExecutionLog[];
  isExecuting: boolean;
  debugMode: DebugMode;
  debugNodeId: string | null;
  onClearLogs: () => void;
  onUpdateLogs: (updater: (prev: ExecutionLog[]) => ExecutionLog[]) => void;
}

export const ExecutionLogDrawer: React.FC<ExecutionLogDrawerProps> = ({
  open,
  onOpenChange,
  logs,
  isExecuting,
  debugMode,
  debugNodeId,
  onClearLogs,
  onUpdateLogs,
}) => {
  // 使用 hooks 管理状态和逻辑
  const drawer = useExecutionLogDrawer(logs, onUpdateLogs);
  const {
    expandedLogIds,
    expandedConsoleLogIds,
    expandedParentIds,
    setExpandedParentIds,
    loadingConsoleLogs,
    scrollContainerRef,
    logCardRefs,
    handleToggleDetail,
    handleToggleConsoleLogs,
  } = drawer;

  const calculations = useExecutionLogCalculations(logs, debugMode, debugNodeId);
  const {
    progressValue,
    hasFailed,
    filteredLogs,
    treeStructure,
  } = calculations;

  const { parentLogs, childLogsMap } = treeStructure;

  // 切换父节点展开/收起
  const handleToggleParent = useCallback((parentId: string) => {
    setExpandedParentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  }, [setExpandedParentIds]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <DrawerTitle className="text-lg font-semibold">执行日志</DrawerTitle>
              {isExecuting && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Circle className="w-2 h-2 animate-pulse fill-blue-600" />
                  执行中
                </span>
              )}
            </div>
            {/* 执行进度 */}
            {logs.length > 0 && (
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">执行进度</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {debugMode === 'single'
                      ? (logs[0]?.status === 'success' || logs[0]?.status === 'failed' ? '100%' : '0%')
                      : `${Math.round(progressValue)}%`
                    }
                  </span>
                </div>
                <div className="w-32">
                  <Progress
                    value={progressValue}
                    className={`h-2 ${progressValue === 100 ? '[&>div]:bg-green-500' : (hasFailed ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500')}`}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {debugMode === 'single'
                    ? `节点调试: ${logs[0]?.name || ''}`
                    : (() => {
                        const stepLogs = filteredLogs.filter(log => log.parentId);
                        const completedStepLogs = stepLogs.filter(log => log.status === 'success' || log.status === 'failed');
                        const skippedStepLogs = stepLogs.filter(log => log.status === 'skipped');
                        if (skippedStepLogs.length > 0) {
                          return `已完成 ${completedStepLogs.length} / ${stepLogs.length} 个节点，跳过 ${skippedStepLogs.length} 个节点`;
                        } else {
                          return `已完成 ${completedStepLogs.length} / ${stepLogs.length} 个节点`;
                        }
                      })()
                  }
                </div>
              </div>
            )}
          </div>
          <DrawerDescription className="text-sm text-gray-500">
            实时查看工作流执行情况和详细日志
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* 执行日志列表 */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="space-y-3" style={{ minHeight: '100%' }}>
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mb-3" />
                  <p className="text-sm">暂无执行记录</p>
                  <p className="text-xs mt-1">
                    {debugMode === 'single'
                      ? '点击节点上的"调试节点"按钮开始调试'
                      : '点击"运行测试"开始执行工作流'}
                  </p>
                </div>
              ) : (
                parentLogs.map((log) => {
                  const childLogs = childLogsMap.get(log.id) || [];
                  const isParentExpanded = expandedParentIds.has(log.id);
                  const isExpanded = expandedLogIds.has(log.id);
                  
                  // 如果是工作流执行节点，检查所有子节点是否都完成了
                  // 只要所有步骤节点都完成了（不管成功还是失败），工作流执行就显示为成功
                  const allChildrenCompleted = childLogs.length > 0 && childLogs.every(child => child.status === 'success' || child.status === 'failed');
                  const displayStatus = (log.nodeId === 'workflow' && allChildrenCompleted) ? 'success' : log.status;
                  let displayDescription = (log.nodeId === 'workflow' && allChildrenCompleted) 
                    ? '工作流执行成功' 
                    : log.description;
                  
                  // 如果是pending状态且description包含"步骤执行PENDING 0"这样的格式，去掉末尾的数字
                  if (displayStatus === 'pending' && displayDescription && /步骤执行PENDING\s+\d+$/.test(displayDescription)) {
                    displayDescription = displayDescription.replace(/\s+\d+$/, '');
                  }
                  
                  const hasDetail = (displayStatus === 'success' || displayStatus === 'failed') && log.stepDetail;
                  const canLoadDetail = log.runId && (displayStatus === 'success' || displayStatus === 'failed') && !log.stepDetail;

                  return (
                    <React.Fragment key={log.id}>
                    <div
                      ref={(el) => {
                        if (el) {
                          logCardRefs.current.set(log.id, el);
                        } else {
                          logCardRefs.current.delete(log.id);
                        }
                      }}
                      className={`bg-white rounded-lg border p-4 transition-all ${
                        (log.nodeId !== 'workflow' && (hasDetail || canLoadDetail)) ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-sm'
                      }`}
                      onClick={(log.nodeId !== 'workflow' && (hasDetail || canLoadDetail)) ? () => handleToggleDetail(log) : undefined}
                    >
                      <div className="flex items-start gap-3">
                        {/* 状态图标 */}
                        <div className="mt-0.5 flex-shrink-0">
                          {displayStatus === 'pending' && (
                            <Clock className="w-5 h-5 text-blue-500" />
                          )}
                          {displayStatus === 'running' && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                              <Activity className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {displayStatus === 'success' && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                          {displayStatus === 'failed' && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          {displayStatus === 'skipped' && (
                            <Minus className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* 日志内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {childLogs.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleParent(log.id);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  {isParentExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            <span className="text-sm font-medium text-gray-900">{log.name}</span>
                            </div>
                            <span className="text-xs text-gray-400">{log.timestamp}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">{displayDescription}</div>

                          {/* 状态标签 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {displayStatus === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                步骤执行PENDING
                              </span>
                            )}
                            {displayStatus === 'running' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <Circle className="w-2 h-2 animate-pulse fill-blue-600" />
                                执行中
                              </span>
                            )}
                            {displayStatus === 'success' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                Passed
                              </span>
                            )}
                            {displayStatus === 'failed' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                <XCircle className="w-3 h-3" />
                                Failed
                              </span>
                            )}
                            {displayStatus === 'skipped' && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                <Minus className="w-3 h-3" />
                                步骤执行SKIPPED
                              </span>
                            )}
                            {log.duration && (
                              <span className="text-xs text-gray-500">
                                耗时: {log.duration}ms
                              </span>
                            )}
                            {/* 工作流执行节点不显示查看详情和执行日志按钮 */}
                            {log.nodeId !== 'workflow' && (hasDetail || canLoadDetail) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleDetail(log, e);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="w-3 h-3 rotate-180" />
                                    收起详情
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    查看详情
                                  </>
                                )}
                              </button>
                            )}
                            {/* 执行日志按钮 */}
                            {/* 注意：日志入库时 run_step_id 存储的是 nodeId，所以只要有 runId 和 nodeId 就可以查询日志 */}
                            {/* 工作流执行节点不显示执行日志按钮 */}
                            {log.nodeId !== 'workflow' && log.runId && log.nodeId && (log.status === 'success' || log.status === 'failed') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleConsoleLogs(log);
                                }}
                                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                                disabled={loadingConsoleLogs.has(log.id)}
                              >
                                {loadingConsoleLogs.has(log.id) ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    加载中...
                                  </>
                                ) : expandedConsoleLogIds.has(log.id) ? (
                                  <>
                                    <FileText className="w-3 h-3" />
                                    收起日志
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-3 h-3" />
                                    执行日志
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* 展开的详情 */}
                          {/* 工作流执行节点不显示详情 */}
                          {isExpanded && log.stepDetail && log.nodeId !== 'workflow' && (
                            <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-0 border rounded-lg overflow-hidden">
                                {/* URL */}
                                {log.stepDetail.requestData && typeof log.stepDetail.requestData === 'object' && (() => {
                                  const requestData = log.stepDetail.requestData as any;
                                  const url = requestData?.url || requestData?.path || null;
                                  return url ? (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                        <span>URL</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="overflow-hidden pl-4 relative group">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                await navigator.clipboard.writeText(url);
                                                toast.success('已复制到剪贴板');
                                              } catch (err) {
                                                toast.error('复制失败');
                                              }
                                            }}
                                          >
                                            <Copy className="h-3.5 w-3.5" />
                                          </Button>
                                          <div className="bg-white border border-gray-200 text-blue-600 p-3 font-mono text-xs break-all select-text">
                                            {url}
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ) : null;
                                })()}

                                {/* 请求头 */}
                                {log.stepDetail.requestData && typeof log.stepDetail.requestData === 'object' && (() => {
                                  const requestData = log.stepDetail.requestData as any;
                                  const headers = requestData?.headers;
                                  return headers && Object.keys(headers).length > 0 ? (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                        <span>请求头</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="overflow-hidden pl-4">
                                          <JsonViewer data={headers} />
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ) : null;
                                })()}

                                {/* 请求体 */}
                                {log.stepDetail.requestData && typeof log.stepDetail.requestData === 'object' && (() => {
                                  const requestData = log.stepDetail.requestData as any;
                                  // 只显示实际的请求体内容（json 或 data 字段）
                                  const body = requestData?.json || requestData?.data || requestData?.body;
                                  return body ? (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                        <span>请求体</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="overflow-hidden pl-4">
                                          <JsonViewer data={body} />
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ) : null;
                                })()}

                                {/* 执行SQL（SQL 节点） */}
                                {log.stepDetail.requestData && typeof log.stepDetail.requestData === 'object' && (() => {
                                  const requestData = log.stepDetail.requestData as any;
                                  const sql = requestData?.executed_sql || requestData?.sql;
                                  return sql ? (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                        <span>执行SQL</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="overflow-hidden pl-4 relative group">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                if (navigator.clipboard && window.isSecureContext) {
                                                  await navigator.clipboard.writeText(sql);
                                                } else {
                                                  const textarea = document.createElement('textarea');
                                                  textarea.value = sql;
                                                  textarea.style.position = 'fixed';
                                                  textarea.style.left = '-9999px';
                                                  textarea.style.top = '0';
                                                  document.body.appendChild(textarea);
                                                  textarea.focus();
                                                  textarea.select();
                                                  const successful = document.execCommand('copy');
                                                  document.body.removeChild(textarea);
                                                  if (!successful) {
                                                    throw new Error('execCommand copy failed');
                                                  }
                                                }
                                                toast.success('已复制到剪贴板');
                                              } catch (err) {
                                                toast.error('复制失败');
                                              }
                                            }}
                                          >
                                            <Copy className="h-3.5 w-3.5" />
                                          </Button>
                                          <div className="bg-white border border-gray-200 text-gray-800 p-3 font-mono text-xs break-all select-text">
                                            {sql}
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ) : null;
                                })()}

                                {/* 返回体 */}
                                {log.stepDetail.responseData && (
                                  <Collapsible defaultOpen={false}>
                                    <CollapsibleTrigger
                                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                      <span>返回体</span>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="overflow-hidden pl-4">
                                        <JsonViewer data={log.stepDetail.responseData} />
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}

                                {/* 校验结果 */}
                                {log.stepDetail.assertion != null &&
                                  Array.isArray(log.stepDetail.assertion) && (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                        <span>校验结果</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="overflow-hidden pl-4">
                                          <JsonViewer data={log.stepDetail.assertion} />
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}

                                {/* 参数提取 */}
                                {log.stepDetail.extractVars != null &&
                                  !Array.isArray(log.stepDetail.extractVars) &&
                                  typeof log.stepDetail.extractVars === 'object' && (
                                    <Collapsible defaultOpen={false}>
                                      <CollapsibleTrigger
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                        <span>参数提取</span>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="overflow-hidden pl-4">
                                          <JsonViewer data={log.stepDetail.extractVars} />
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )}

                                {/* 错误信息 */}
                                {(log.stepDetail.errorMsg || log.stepDetail.errorStack) && (
                                  <Collapsible defaultOpen={false}>
                                    <CollapsibleTrigger
                                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors border-b last:border-b-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ChevronRight className="w-4 h-4 text-red-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                      <span>错误信息</span>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="space-y-0 pl-4">
                                        {log.stepDetail.errorMsg && (
                                          <div className="text-xs text-red-600 bg-red-50 p-3 break-words">
                                            {log.stepDetail.errorMsg}
                                          </div>
                                        )}
                                        {log.stepDetail.errorStack && (
                                          <div className="bg-red-50 overflow-hidden">
                                            <pre className="text-xs text-red-600 p-3 overflow-x-auto whitespace-pre-wrap break-words">
                                              {log.stepDetail.errorStack}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 执行日志 */}
                          {expandedConsoleLogIds.has(log.id) && (
                            <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-0 border rounded-lg overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">执行日志</span>
                                </div>
                                <div className="bg-gray-900 font-mono text-xs max-h-96 overflow-y-auto select-text scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                  {loadingConsoleLogs.has(log.id) ? (
                                    <div className="flex items-center gap-2 text-gray-400 p-4">
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                      <span>加载中...</span>
                                    </div>
                                  ) : log.consoleLogs && log.consoleLogs.length > 0 ? (
                                    <div className="space-y-2 p-4">
                                      {log.consoleLogs.map((consoleLog: any, index: number) => {
                                        const logTime = consoleLog.logTime
                                          ? new Date(consoleLog.logTime).toLocaleString('zh-CN', {
                                              year: 'numeric',
                                              month: '2-digit',
                                              day: '2-digit',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              second: '2-digit',
                                              hour12: false
                                            })
                                          : '';

                                        const levelColor = {
                                          DEBUG: 'text-gray-400',
                                          INFO: 'text-green-400',
                                          WARN: 'text-yellow-400',
                                          ERROR: 'text-red-400',
                                        }[consoleLog.level] || 'text-gray-400';

                                        const levelBgColor = {
                                          DEBUG: 'bg-gray-800',
                                          INFO: 'bg-green-900/30',
                                          WARN: 'bg-yellow-900/30',
                                          ERROR: 'bg-red-900/30',
                                        }[consoleLog.level] || 'bg-gray-800';

                                        // 尝试解析和格式化日志内容
                                        const formatLogContent = (content: string) => {
                                          // 尝试提取 JSON 部分
                                          const jsonMatch = content.match(/\{[\s\S]*\}/);
                                          if (jsonMatch) {
                                            try {
                                              const jsonObj = JSON.parse(jsonMatch[0]);
                                              const formattedJson = JSON.stringify(jsonObj, null, 2);
                                              // 替换原始 JSON 为格式化后的 JSON
                                              return content.replace(jsonMatch[0], formattedJson);
                                            } catch (e) {
                                              // JSON 解析失败，返回原内容
                                            }
                                          }
                                          return content;
                                        };

                                        const formattedContent = formatLogContent(consoleLog.content);

                                        // 检查是否包含多行内容
                                        const isMultiLine = formattedContent.includes('\n');
                                        const lines = isMultiLine ? formattedContent.split('\n') : [formattedContent];

                                        return (
                                          <div 
                                            key={consoleLog.logId || index} 
                                            className={`${levelBgColor} rounded border border-gray-700/50 overflow-hidden relative`}
                                          >
                                            {/* 日志头部：时间戳和级别 */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-700/50">
                                              <span className="text-gray-500 text-[10px] font-medium">{logTime}</span>
                                              <span className={`${levelColor} font-semibold text-[10px] px-1.5 py-0.5 rounded`}>
                                                {consoleLog.level}
                                              </span>
                                            </div>
                                            {/* 日志内容 */}
                                            <div className="px-3 py-2 select-text">
                                              {isMultiLine ? (
                                                <pre className="text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                                  {lines.map((line, lineIndex) => {
                                                    // 尝试识别并高亮 JSON 键值对
                                                    const jsonKeyMatch = line.match(/^(\s*)("[^"]+"\s*:\s*)/);
                                                    if (jsonKeyMatch) {
                                                      return (
                                                        <div key={lineIndex} className="flex">
                                                          <span className="text-gray-500">{jsonKeyMatch[1]}</span>
                                                          <span className="text-blue-400">{jsonKeyMatch[2]}</span>
                                                          <span className="text-gray-300">{line.substring(jsonKeyMatch[0].length)}</span>
                                                        </div>
                                                      );
                                                    }
                                                    // 尝试识别特殊标记
                                                    if (line.includes('HTTP Request') || line.includes('HTTP Response') || line.includes('==================')) {
                                                      return (
                                                        <div key={lineIndex} className="text-cyan-400 font-semibold my-1">
                                                          {line}
                                                        </div>
                                                      );
                                                    }
                                                    // 尝试识别状态码
                                                    if (line.match(/status_code|statusCode|✅|❌/)) {
                                                      return (
                                                        <div key={lineIndex} className="text-green-400">
                                                          {line}
                                                        </div>
                                                      );
                                                    }
                                                    return (
                                                      <div key={lineIndex} className="text-gray-300">
                                                        {line}
                                                      </div>
                                                    );
                                                  })}
                                                </pre>
                                              ) : (
                                                <div className="text-gray-300 whitespace-pre-wrap break-words">
                                                  {formattedContent}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 p-4">暂无执行日志</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 子节点列表 */}
                    {childLogs.length > 0 && isParentExpanded && (
                      <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                        {childLogs.map((childLog) => {
                          const childIsExpanded = expandedLogIds.has(childLog.id);
                          const childHasDetail = childLog.stepDetail && (childLog.status === 'success' || childLog.status === 'failed');
                          const childCanLoadDetail = childLog.runId && (childLog.status === 'success' || childLog.status === 'failed') && !childLog.stepDetail;

                          return (
                            <div
                              key={childLog.id}
                              ref={(el) => {
                                if (el) {
                                  logCardRefs.current.set(childLog.id, el);
                                } else {
                                  logCardRefs.current.delete(childLog.id);
                                }
                              }}
                              className={`bg-white rounded-lg border p-4 transition-all ${
                                (childHasDetail || childCanLoadDetail) ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-sm'
                              }`}
                              onClick={(childHasDetail || childCanLoadDetail) ? () => handleToggleDetail(childLog) : undefined}
                            >
                              <div className="flex items-start gap-3">
                                {/* 状态图标 */}
                                <div className="mt-0.5 flex-shrink-0">
                                  {childLog.status === 'pending' && (
                                    <Clock className="w-5 h-5 text-blue-500" />
                                  )}
                                  {childLog.status === 'running' && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                                      <Activity className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  {childLog.status === 'success' && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  )}
                                  {childLog.status === 'failed' && (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                  )}
                                  {childLog.status === 'skipped' && (
                                    <Minus className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>

                                {/* 日志内容 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">{childLog.name}</span>
                                    <span className="text-xs text-gray-400">{childLog.timestamp}</span>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">{childLog.description}</div>

                                  {/* 状态标签 */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {childLog.status === 'pending' && (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        <Clock className="w-3 h-3" />
                                        步骤执行PENDING
                                      </span>
                                    )}
                                    {childLog.status === 'running' && (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        <Circle className="w-2 h-2 animate-pulse fill-blue-600" />
                                        执行中
                                      </span>
                                    )}
                                    {childLog.status === 'success' && (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Passed
                                      </span>
                                    )}
                                    {childLog.status === 'failed' && (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                        <XCircle className="w-3 h-3" />
                                        Failed
                                      </span>
                                    )}
                                    {childLog.status === 'skipped' && (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                        <Minus className="w-3 h-3" />
                                        步骤执行SKIPPED
                                      </span>
                                    )}
                                    {childLog.duration && (
                                      <span className="text-xs text-gray-500">
                                        耗时: {childLog.duration}ms
                                      </span>
                                    )}
                                    {(childHasDetail || childCanLoadDetail) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleDetail(childLog, e);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                                      >
                                        {childIsExpanded ? (
                                          <>
                                            <ChevronDown className="w-3 h-3 rotate-180" />
                                            收起详情
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-3 h-3" />
                                            查看详情
                                          </>
                                        )}
                                      </button>
                                    )}
                                    {childLog.runId && childLog.nodeId && (childLog.status === 'success' || childLog.status === 'failed') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleConsoleLogs(childLog);
                                        }}
                                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                                        disabled={loadingConsoleLogs.has(childLog.id)}
                                      >
                                        {loadingConsoleLogs.has(childLog.id) ? (
                                          <>
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            加载中...
                                          </>
                                        ) : expandedConsoleLogIds.has(childLog.id) ? (
                                          <>
                                            <FileText className="w-3 h-3" />
                                            收起日志
                                          </>
                                        ) : (
                                          <>
                                            <FileText className="w-3 h-3" />
                                            执行日志
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* 展开的详情 - 复用父节点的详情渲染逻辑 */}
                                  {childIsExpanded && childLog.stepDetail && (
                                    <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-0 border rounded-lg overflow-hidden">
                                        {/* URL */}
                                        {childLog.stepDetail.requestData && typeof childLog.stepDetail.requestData === 'object' && (() => {
                                          const requestData = childLog.stepDetail.requestData as any;
                                          const url = requestData?.url || requestData?.path || null;
                                          return url ? (
                                            <Collapsible defaultOpen={false}>
                                              <CollapsibleTrigger
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                                <span>URL</span>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="overflow-hidden pl-4 relative group">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      try {
                                                        await navigator.clipboard.writeText(url);
                                                        toast.success('已复制到剪贴板');
                                                      } catch (err) {
                                                        toast.error('复制失败');
                                                      }
                                                    }}
                                                  >
                                                    <Copy className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <div className="bg-white border border-gray-200 text-blue-600 p-3 font-mono text-xs break-all select-text">
                                                    {url}
                                                  </div>
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ) : null;
                                        })()}

                                        {/* 请求头 */}
                                        {childLog.stepDetail.requestData && typeof childLog.stepDetail.requestData === 'object' && (() => {
                                          const requestData = childLog.stepDetail.requestData as any;
                                          const headers = requestData?.headers;
                                          return headers && Object.keys(headers).length > 0 ? (
                                            <Collapsible defaultOpen={false}>
                                              <CollapsibleTrigger
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                                <span>请求头</span>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="overflow-hidden pl-4">
                                                  <JsonViewer data={headers} />
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ) : null;
                                        })()}

                                        {/* 请求体 */}
                                        {childLog.stepDetail.requestData && typeof childLog.stepDetail.requestData === 'object' && (() => {
                                          const requestData = childLog.stepDetail.requestData as any;
                                          // 只显示实际的请求体内容（json 或 data 字段）
                                          const body = requestData?.json || requestData?.data || requestData?.body;
                                          return body ? (
                                            <Collapsible defaultOpen={false}>
                                              <CollapsibleTrigger
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                                <span>请求体</span>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="overflow-hidden pl-4">
                                                  <JsonViewer data={body} />
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ) : null;
                                        })()}

                                        {/* 执行SQL（SQL 节点） */}
                                        {childLog.stepDetail.requestData && typeof childLog.stepDetail.requestData === 'object' && (() => {
                                          const requestData = childLog.stepDetail.requestData as any;
                                          const sql = requestData?.executed_sql || requestData?.sql;
                                          return sql ? (
                                            <Collapsible defaultOpen={false}>
                                              <CollapsibleTrigger
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                                <span>执行SQL</span>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="overflow-hidden pl-4 relative group">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2 z-10 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      try {
                                                        await navigator.clipboard.writeText(sql);
                                                        toast.success('已复制到剪贴板');
                                                      } catch (err) {
                                                        toast.error('复制失败');
                                                      }
                                                    }}
                                                  >
                                                    <Copy className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <div className="bg-white border border-gray-200 text-gray-800 p-3 font-mono text-xs break-all select-text">
                                                    {sql}
                                                  </div>
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          ) : null;
                                        })()}

                                        {/* 返回体 */}
                                        {childLog.stepDetail.responseData && (
                                          <Collapsible defaultOpen={false}>
                                            <CollapsibleTrigger
                                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                              <span>返回体</span>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                              <div className="overflow-hidden pl-4">
                                                <JsonViewer data={childLog.stepDetail.responseData} />
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}

                                        {/* 校验结果 */}
                                        {childLog.stepDetail.assertion != null &&
                                          Array.isArray(childLog.stepDetail.assertion) && (
                                            <Collapsible defaultOpen={false}>
                                              <CollapsibleTrigger
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                                <span>校验结果</span>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="overflow-hidden pl-4">
                                                  <JsonViewer data={childLog.stepDetail.assertion} />
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          )}

                                        {/* 参数提取 */}
                                        {childLog.stepDetail.extractVars != null &&
                                          !Array.isArray(childLog.stepDetail.extractVars) &&
                                          typeof childLog.stepDetail.extractVars === 'object' && (
                                            <Collapsible defaultOpen={false}>
                                              <CollapsibleTrigger
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <ChevronRight className="w-4 h-4 text-gray-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                                <span>参数提取</span>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="overflow-hidden pl-4">
                                                  <JsonViewer data={childLog.stepDetail.extractVars} />
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          )}

                                        {/* 错误信息 */}
                                        {(childLog.stepDetail.errorMsg || childLog.stepDetail.errorStack) && (
                                          <Collapsible defaultOpen={false}>
                                            <CollapsibleTrigger
                                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors border-b last:border-b-0"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ChevronRight className="w-4 h-4 text-red-500 transition-transform duration-200 data-[state=open]:rotate-90" />
                                              <span>错误信息</span>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                              <div className="space-y-0 pl-4">
                                                {childLog.stepDetail.errorMsg && (
                                                  <div className="text-xs text-red-600 bg-red-50 p-3 break-words">
                                                    {childLog.stepDetail.errorMsg}
                                                  </div>
                                                )}
                                                {childLog.stepDetail.errorStack && (
                                                  <div className="bg-red-50 overflow-hidden">
                                                    <pre className="text-xs text-red-600 p-3 overflow-x-auto whitespace-pre-wrap break-words">
                                                      {childLog.stepDetail.errorStack}
                                                    </pre>
                                                  </div>
                                                )}
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* 执行日志 */}
                                  {expandedConsoleLogIds.has(childLog.id) && (
                                    <div className="mt-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-0 border rounded-lg overflow-hidden">
                                        <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-gray-600" />
                                          <span className="text-sm font-medium text-gray-700">执行日志</span>
                                        </div>
                                        <div className="bg-gray-900 font-mono text-xs max-h-96 overflow-y-auto select-text scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                          {loadingConsoleLogs.has(childLog.id) ? (
                                            <div className="flex items-center gap-2 text-gray-400 p-4">
                                              <RefreshCw className="w-4 h-4 animate-spin" />
                                              <span>加载中...</span>
                                            </div>
                                          ) : childLog.consoleLogs && childLog.consoleLogs.length > 0 ? (
                                            <div className="space-y-2 p-4">
                                              {childLog.consoleLogs.map((consoleLog: any, index: number) => {
                                                const logTime = consoleLog.logTime
                                                  ? new Date(consoleLog.logTime).toLocaleString('zh-CN', {
                                                      year: 'numeric',
                                                      month: '2-digit',
                                                      day: '2-digit',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                      second: '2-digit',
                                                      hour12: false
                                                    })
                                                  : '';

                                                const levelColor = {
                                                  DEBUG: 'text-gray-400',
                                                  INFO: 'text-green-400',
                                                  WARN: 'text-yellow-400',
                                                  ERROR: 'text-red-400',
                                                }[consoleLog.level] || 'text-gray-400';

                                                const levelBgColor = {
                                                  DEBUG: 'bg-gray-800',
                                                  INFO: 'bg-green-900/30',
                                                  WARN: 'bg-yellow-900/30',
                                                  ERROR: 'bg-red-900/30',
                                                }[consoleLog.level] || 'bg-gray-800';

                                                const formatLogContent = (content: string) => {
                                                  const jsonMatch = content.match(/\{[\s\S]*\}/);
                                                  if (jsonMatch) {
                                                    try {
                                                      const jsonObj = JSON.parse(jsonMatch[0]);
                                                      const formattedJson = JSON.stringify(jsonObj, null, 2);
                                                      return content.replace(jsonMatch[0], formattedJson);
                                                    } catch (e) {
                                                    }
                                                  }
                                                  return content;
                                                };

                                                const formattedContent = formatLogContent(consoleLog.content);
                                                const isMultiLine = formattedContent.includes('\n');
                                                const lines = isMultiLine ? formattedContent.split('\n') : [formattedContent];

                                                return (
                                                  <div 
                                                    key={consoleLog.logId || index} 
                                                    className={`${levelBgColor} rounded border border-gray-700/50 overflow-hidden relative`}
                                                  >
                                                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-700/50">
                                                      <span className="text-gray-500 text-[10px] font-medium">{logTime}</span>
                                                      <span className={`${levelColor} font-semibold text-[10px] px-1.5 py-0.5 rounded`}>
                                                        {consoleLog.level}
                                                      </span>
                                                    </div>
                                                    <div className="px-3 py-2 select-text">
                                                      {isMultiLine ? (
                                                        <pre className="text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                                          {lines.map((line, lineIndex) => (
                                                            <div key={lineIndex} className="text-gray-300">
                                                              {line}
                                                            </div>
                                                          ))}
                                                        </pre>
                                                      ) : (
                                                        <div className="text-gray-300 whitespace-pre-wrap break-words">
                                                          {formattedContent}
                                                        </div>
                                                      )}
                      </div>
                    </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="text-gray-400 p-4">暂无执行日志</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="mt-6 flex gap-2 border-t pt-4 flex-shrink-0 px-6 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClearLogs}
              disabled={isExecuting}
            >
              清空日志
            </Button>
            <Button
              className="flex-1 bg-black hover:bg-gray-800"
              onClick={() => onOpenChange(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

