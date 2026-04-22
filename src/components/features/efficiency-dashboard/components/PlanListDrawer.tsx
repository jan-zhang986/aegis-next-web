/**
 * PlanListDrawer 组件
 * 测试计划列表抽屉组件
 * 从 EfficiencyDashboard.tsx 提取（行2024-2278）
 */

import React from 'react';
import { XCircle, ChevronLeft, ChevronRight, ChevronsDown, ChevronsRight, FolderOpen, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMetricFormula } from '../utils/metricFormula';
import type { CaseManagementMetrics } from '@/types/efficiency';

/**
 * 测试计划项类型
 */
export interface PlanItem {
  id: string;
  num?: string;
  name: string;
  passRate?: number;
  createUser?: string;
  createTime?: number;
}

/**
 * 用例项类型
 */
export interface PlanCaseItem {
  id?: string;
  caseId?: string;
  num?: string;
  caseNum?: string;
  name?: string;
  caseName?: string;
  csScore?: number | string;
  moduleName?: string;
  createUserName?: string;
}

/**
 * PlanListDrawer 组件 Props
 */
export interface PlanListDrawerProps {
  // 是否显示
  isOpen: boolean;
  // 关闭回调
  onClose: () => void;
  // 抽屉宽度（百分比）
  drawerWidth: number;
  // 开始调整宽度
  onResizeStart: (e: React.MouseEvent) => void;
  // 选中的指标键
  selectedPlanMetricKey: string | null;
  // 指标数据
  metrics: {
    caseManagement: CaseManagementMetrics;
  };
  // 测试计划列表
  planList: PlanItem[];
  // 加载状态
  planListLoading: boolean;
  // 当前页码
  planListPage: number;
  // 总记录数
  planListTotal: number;
  // 展开的测试计划ID集合
  expandedPlans: Set<string>;
  // 测试计划ID -> 用例列表
  planCaseMap: Map<string, PlanCaseItem[]>;
  // 正在加载用例的测试计划ID集合
  loadingCases: Set<string>;
  // 切换测试计划展开/折叠
  togglePlanExpand: (planId: string) => void;
  // 处理页码变化
  handlePlanPageChange: (page: number) => void;
}

/**
 * PlanListDrawer 组件
 */
export const PlanListDrawer = React.memo<PlanListDrawerProps>(function PlanListDrawer({
  isOpen,
  onClose,
  drawerWidth,
  onResizeStart,
  selectedPlanMetricKey,
  metrics,
  planList,
  planListLoading,
  planListPage,
  planListTotal,
  expandedPlans,
  planCaseMap,
  loadingCases,
  togglePlanExpand,
  handlePlanPageChange,
}: PlanListDrawerProps) {
  if (!isOpen) return null;

  const totalPages = Math.ceil(planListTotal / 20);

  // 计算显示的页码
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    const start = Math.max(2, planListPage - 2);
    const end = Math.min(totalPages - 1, planListPage + 2);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* 抽屉内容 */}
      <div
        className="fixed right-0 bottom-0 bg-gray-900 border-l border-gray-700 rounded-l-lg flex flex-col overflow-hidden z-50 transition-transform duration-300 shadow-2xl"
        style={{
          width: `${drawerWidth}vw`,
          top: '70px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* 可拖拽的调整条 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gray-600 hover:bg-blue-500 cursor-col-resize z-10 transition-colors group"
          onMouseDown={onResizeStart}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
        >
          <XCircle className="w-6 h-6" />
        </button>

        {/* 头部 */}
        <div className="flex-shrink-0 border-b border-gray-700 p-4">
          <h2 className="text-white text-xl font-semibold mb-1">
            {selectedPlanMetricKey === 'firstPassRate' ? '测试计划首次通过率' : '测试计划列表'}
          </h2>
          {selectedPlanMetricKey && getMetricFormula(selectedPlanMetricKey, metrics.caseManagement)?.description && (
            <p className="text-gray-400 text-sm">
              {getMetricFormula(selectedPlanMetricKey, metrics.caseManagement)?.description}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {planListLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : planList.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">暂无测试计划数据</div>
            </div>
          ) : (
            <div className="space-y-3">
              {planList.map((plan) => {
                const isExpanded = expandedPlans.has(plan.id);
                const cases = planCaseMap.get(plan.id) || [];
                const isLoadingCases = loadingCases.has(plan.id);

                return (
                  <div
                    key={plan.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* 测试计划信息 */}
                    <div
                      className="p-4 hover:bg-gray-800/70 transition-all cursor-pointer"
                      onClick={() => togglePlanExpand(plan.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {isExpanded ? (
                            <ChevronsDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronsRight className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              {isExpanded ? (
                                <FolderOpen className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Folder className="w-5 h-5 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-400">#{plan.num || plan.id}</span>
                              <h4 className="text-white font-semibold text-lg">{plan.name}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 ml-8 flex-wrap">
                              {plan.passRate !== undefined && (
                                <span>通过率: {plan.passRate?.toFixed(1) || 0}%</span>
                              )}
                              {plan.createUser && (
                                <span>创建人: {plan.createUser}</span>
                              )}
                              {plan.createTime && (
                                <span>创建时间: {new Date(plan.createTime).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 用例列表（展开时显示） */}
                    {isExpanded && (
                      <div className="border-t border-gray-700 bg-gray-850/30 p-4">
                        {isLoadingCases ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-400 text-sm">加载用例中...</div>
                          </div>
                        ) : cases.length === 0 ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-gray-400 text-sm">该测试计划暂无用例</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {cases.map((caseItem) => (
                              <div
                                key={caseItem.id || caseItem.caseId}
                                className="bg-gray-750/50 border border-gray-600 rounded p-3 hover:bg-gray-750/70 transition-all"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">#{caseItem.num || caseItem.caseNum || caseItem.id}</span>
                                    <h5 className="text-white font-medium text-sm">{caseItem.name || caseItem.caseName}</h5>
                                  </div>
                                  {caseItem.csScore !== undefined && (
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-blue-400">
                                        {typeof caseItem.csScore === 'number' ? caseItem.csScore.toFixed(1) : caseItem.csScore}
                                      </div>
                                      <div className="text-xs text-gray-400">CS分值</div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                                  {caseItem.moduleName && (
                                    <span>模块: {caseItem.moduleName}</span>
                                  )}
                                  {caseItem.createUserName && (
                                    <span>创建人: {caseItem.createUserName}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 分页控件 */}
        {!planListLoading && planList.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-t border-gray-700 bg-gray-900">
            <div className="text-sm text-gray-400">
              共 {planListTotal} 条
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlanPageChange(planListPage - 1)}
                disabled={planListPage <= 1}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <Button
                        key={`ellipsis-${index}`}
                        variant="outline"
                        size="sm"
                        disabled
                        className="bg-gray-800 border-gray-600 text-gray-400 cursor-default"
                      >
                        ...
                      </Button>
                    );
                  }
                  const pageNum = page as number;
                  return (
                    <Button
                      key={pageNum}
                      variant={planListPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePlanPageChange(pageNum)}
                      className={
                        planListPage === pageNum
                          ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                          : "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlanPageChange(planListPage + 1)}
                disabled={planListPage >= totalPages}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
