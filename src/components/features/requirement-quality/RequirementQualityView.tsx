/**
 * 需求质量看板 - 组合入口（筛选 + 需求列表；详情在新标签页通过 URL detailId 打开）
 * 数据对接后端 /metrics/requirement-quality
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCurrentTime } from './hooks/use-current-time';
import { useRequirementQuality } from './hooks/use-requirement-quality';
import { useRequirementQualityDetail } from './hooks/use-requirement-quality-detail';
import { formatDateTime } from './utils/format-date-time';
import { RequirementQualityHeader } from './components/RequirementQualityHeader';
import { RequirementOverviewCards } from './components/RequirementOverviewCards';
import { RequirementQualityFilter } from './components/RequirementQualityFilter';
import { RequirementTable } from './components/RequirementTable';
import { RequirementDetailView } from './components/RequirementDetailView';

const WORKSPACE_DETAIL_URL_PARAMS = 'menu=workspace&tab=requirement-quality';

export function RequirementQualityView() {
  const currentTime = useCurrentTime();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailIdFromUrl = searchParams.get('detailId');

  const {
    list,
    overview,
    totalCount,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    refetch,
    setPage,
    filters,
    setFilters,
    sortBy,
    sortOrder,
    setSort,
    filterOptions,
    projectOptions,
  } = useRequirementQuality();

  const { requirement: detailRequirement, detail: detailData, loading: detailLoading, error: detailError } =
    useRequirementQualityDetail(detailIdFromUrl);

  const [selectedId, setSelectedId] = useState('');
  const effectiveSelectedId = selectedId || list[0]?.id || '';

  /** 新标签页打开详情页的 URL（用于「查看详情」） */
  const openDetailInNewTab = (id: string) => {
    const url = `${window.location.pathname}?${WORKSPACE_DETAIL_URL_PARAMS}&detailId=${encodeURIComponent(id)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const dateTimeText = formatDateTime(currentTime);

  if (detailIdFromUrl) {
    if (detailLoading) {
      return (
        <div className="h-full flex flex-col min-h-0 bg-[#0B1437] text-white items-center justify-center gap-4">
          <div className="animate-pulse text-gray-400">加载详情中...</div>
        </div>
      );
    }
    if (detailError || !detailRequirement) {
      return (
        <div className="h-full flex flex-col min-h-0 bg-[#0B1437] text-white items-center justify-center gap-4">
          <p className="text-red-400">{detailError ?? '未找到该需求'}</p>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('detailId');
              setSearchParams(next, { replace: true });
            }}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            返回列表
          </button>
        </div>
      );
    }
    return (
      <RequirementDetailView
        requirement={detailRequirement}
        detail={detailData}
        onBack={() => {
          const next = new URLSearchParams(searchParams);
          next.delete('detailId');
          setSearchParams(next, { replace: true });
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0B1437] text-white">
      <RequirementQualityHeader dateTimeText={dateTimeText} />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-theme-dark-blue">
        <div className="p-6 mb-0">
          <RequirementOverviewCards {...overview} showSubText />
        </div>

        <div className="px-6 pb-4">
          <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-white">近期需求列表</h2>
              <p className="text-sm text-gray-400 mt-1">查看所有需求测试的执行情况与质量指标</p>
            </div>
            <RequirementQualityFilter
              projectIds={filters.projectIds ?? []}
              requirementListValue={filters.requirementListValue}
              statusValue={filters.status}
              executionPeriodStart={filters.executionPeriodStart}
              executionPeriodEnd={filters.executionPeriodEnd}
              projectOptions={projectOptions}
              requirementOptions={filterOptions?.requirementOptions ?? []}
              statusOptions={(filterOptions?.statusOptions ?? []).filter(
                (opt) =>
                  opt.name !== '未开始' &&
                  opt.name !== '已归档' &&
                  opt.id !== 'PREPARED' &&
                  opt.id !== 'ARCHIVED'
              )}
              onProjectIdsChange={(ids) => setFilters({ projectIds: ids })}
              onRequirementListChange={(v) => setFilters({ requirementListValue: v })}
              onStatusChange={(v) => setFilters({ status: v })}
              onExecutionPeriodChange={(range) =>
                setFilters({
                  executionPeriodStart: range?.start ?? undefined,
                  executionPeriodEnd: range?.end ?? undefined,
                })
              }
            />
          </div>
          {error && (
            <div className="mb-3 py-2 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 underline hover:no-underline"
              >
                重试
              </button>
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : (
            <RequirementTable
              requirements={list}
              totalCount={totalCount}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={setPage}
              selectedId={effectiveSelectedId}
              onSelect={setSelectedId}
              onViewDetail={openDetailInNewTab}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(key) =>
                setSort(key, sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc')
              }
            />
          )}
        </div>

        <footer className="border-t border-white/10 bg-[#0D1740] px-6 py-4 text-center text-xs text-gray-400 mt-6">
          <p>Powered by AegisOne | 需求质量看板 | {dateTimeText}</p>
        </footer>
      </div>
    </div>
  );
}
