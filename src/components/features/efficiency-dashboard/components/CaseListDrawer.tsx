/**
 * CaseListDrawer 组件
 * 用例列表抽屉组件
 * 从 EfficiencyDashboard.tsx 提取（行2005-2248）
 */

import React, { useState } from 'react';
import { XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { stripHtmlTags } from '@/utils/format';
import { getMetricFormula } from '../utils/metricFormula';
import type { CaseManagementMetrics } from '@/types/efficiency';

/**
 * 用例项类型
 */
export interface CaseItem {
  caseId: string;
  caseNum: string;
  caseName: string;
  csScore?: number;
  moduleName?: string;
  createUserName?: string;
  createTime?: number;
  updateTime?: number;
  description?: string;
  prerequisite?: string;
}

/**
 * CaseListDrawer 组件 Props
 */
export interface CaseListDrawerProps {
  // 是否显示
  isOpen: boolean;
  // 关闭回调
  onClose: () => void;
  // 抽屉宽度（百分比）
  drawerWidth: number;
  // 开始调整宽度
  onResizeStart: (e: React.MouseEvent) => void;
  // 选中的指标键
  selectedMetricKey: string | null;
  // 指标数据
  metrics: {
    caseManagement: CaseManagementMetrics;
  };
  // 用例列表
  caseList: CaseItem[];
  // 加载状态
  caseListLoading: boolean;
  // 当前页码
  caseListPage: number;
  // 总记录数
  caseListTotal: number;
  // 页码输入框值
  pageInput: string;
  // 设置页码输入框值
  setPageInput: (value: string) => void;
  // 处理页码变化
  handlePageChange: (page: number) => void;
  // 处理页码跳转
  handlePageJump: () => void;
}

/**
 * 获取指标标题
 */
function getMetricTitle(metricKey: string | null): string {
  if (!metricKey) return '用例列表';
  
  const titleMap: Record<string, string> = {
    avgCaseCS: '用例平均CS复杂分',
    caseOutputRate: '用例产出率',
    caseChangeHeat: '用例变更热度',
    highValueExecRate: '高价值用例执行热度',
    timeSavingRate: '测试工时节约率',
    planCaseReuseRate: '测试计划用例复用率',
    planCaseModifyRate: '测试计划用例修改率',
    planCaseNewRate: '测试计划用例新增率',
    planAvgExecDuration: '测试计划平均执行时长',
    planPassRate: '测试计划用例通过率',
    planFirstPassRate: '测试计划首次通过率',
  };
  
  return titleMap[metricKey] || '用例列表';
}

/**
 * CaseListDrawer 组件
 */
export const CaseListDrawer = React.memo<CaseListDrawerProps>(function CaseListDrawer({
  isOpen,
  onClose,
  drawerWidth,
  onResizeStart,
  selectedMetricKey,
  metrics,
  caseList,
  caseListLoading,
  caseListPage,
  caseListTotal,
  pageInput,
  setPageInput,
  handlePageChange,
  handlePageJump,
}: CaseListDrawerProps) {
  if (!isOpen) return null;

  const totalPages = Math.ceil(caseListTotal / 20);

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

    const start = Math.max(2, caseListPage - 2);
    const end = Math.min(totalPages - 1, caseListPage + 2);

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
            {getMetricTitle(selectedMetricKey)}
          </h2>
          {selectedMetricKey && getMetricFormula(selectedMetricKey, metrics.caseManagement)?.description && (
            <p className="text-gray-400 text-sm">
              {getMetricFormula(selectedMetricKey, metrics.caseManagement)?.description}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {caseListLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : caseList.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">暂无用例数据</div>
            </div>
          ) : (
            <div className="space-y-3">
              {caseList.map((caseItem) => (
                <div
                  key={caseItem.caseId}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-all"
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">#{caseItem.caseNum}</span>
                        <h4 className="text-white font-semibold text-lg">{caseItem.caseName}</h4>
                      </div>
                      {caseItem.csScore && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400">
                            {caseItem.csScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">CS分值</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2 flex-wrap">
                      {caseItem.moduleName && (
                        <span>模块: {caseItem.moduleName}</span>
                      )}
                      {caseItem.createUserName && (
                        <span>创建人: {caseItem.createUserName}</span>
                      )}
                      {caseItem.createTime && (
                        <span>创建时间: {new Date(caseItem.createTime).toLocaleString()}</span>
                      )}
                      {caseItem.updateTime && (
                        <span>更新时间: {new Date(caseItem.updateTime).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {caseItem.description && (
                    <div className="text-sm text-gray-300 mb-3">
                      <div className="text-gray-400 text-xs mb-1">步骤描述：</div>
                      <div className="whitespace-pre-wrap">{stripHtmlTags(caseItem.description)}</div>
                    </div>
                  )}

                  {caseItem.prerequisite && (
                    <div className="text-sm text-gray-300">
                      <div className="text-gray-400 text-xs mb-1">前置条件：</div>
                      <div className="whitespace-pre-wrap">{stripHtmlTags(caseItem.prerequisite)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页控件 */}
        {!caseListLoading && caseList.length > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-t border-gray-700 bg-gray-900">
            <div className="text-sm text-gray-400">
              共 {caseListTotal} 条
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(caseListPage - 1)}
                disabled={caseListPage <= 1}
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
                      variant={caseListPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={
                        caseListPage === pageNum
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
                onClick={() => handlePageChange(caseListPage + 1)}
                disabled={caseListPage >= totalPages}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* 页码输入框和跳转 */}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-gray-400">跳至</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePageJump();
                    }
                  }}
                  className="w-12 h-8 bg-gray-800 border-gray-600 text-white text-center text-sm px-2"
                  placeholder=""
                />
                <span className="text-sm text-gray-400">/{totalPages} 页</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
