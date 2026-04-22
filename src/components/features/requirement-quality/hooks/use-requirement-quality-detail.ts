/**
 * 需求质量视图 - 详情数据（对接后端 detail）
 */

import { useState, useCallback, useEffect } from 'react';
import { requirementQualityService } from '@/services/requirement-quality';
import type { RequirementQualityDetailDTO } from '@/services/requirement-quality';
import type { RequirementItem } from '../constants/requirement-list';

/** 执行周期：仅日期范围，与列表一致 */
function formatPeriod(start?: number | null, end?: number | null): string {
  if (start == null && end == null) return '-';
  const s = start != null ? new Date(start).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '';
  const e = end != null ? new Date(end).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '';
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} — `;
  if (e) return `— ${e}`;
  return '-';
}

/** 状态展示：与列表 formatStatusDisplay 一致（PREPARED→未开始，UNDERWAY→进行中，COMPLETED→已完成等） */
const STATUS_DISPLAY: Record<string, string> = {
  PREPARED: '未开始',
  UNDERWAY: '进行中',
  COMPLETED: '已完成',
  NOT_ARCHIVED: '未归档',
  ARCHIVED: '已归档',
};
function formatStatusDisplay(status: string): string {
  if (!status) return '-';
  return STATUS_DISPLAY[status] ?? status;
}

function dtoToRequirementItem(dto: RequirementQualityDetailDTO): RequirementItem {
  const total = dto.caseTotalCount ?? 0;
  const passed = total > 0 ? Math.round(((dto.passRate ?? 0) / 100) * total) : 0;
  const periodStr = formatPeriod(dto.executionPeriodStart, dto.executionPeriodEnd);
  return {
    id: dto.storyId ?? '',
    name: dto.storyName ?? '-',
    owner: dto.owner ?? '-',
    status: formatStatusDisplay(dto.status ?? ''),
    period: periodStr,
    periodRange: periodStr === '-' ? undefined : periodStr,
    totalCases: total,
    executedCases: dto.caseExecutedCount ?? 0,
    passedCases: passed,
    executionRate: dto.executionRate ?? 0,
    passRate: dto.passRate ?? 0,
    defectCount: dto.defectCount ?? 0,
    reopenRate: dto.reopenRate ?? null,
    reopenCount: 0,
    codeCoverageRate: dto.codeCoverage != null ? Number(dto.codeCoverage) : 0,
    totalDefectRatePer1k: dto.totalDefectRatePer1k ?? null,
    newCases: 0,
    reusedCases: 0,
  };
}

export interface UseRequirementQualityDetailResult {
  requirement: RequirementItem | null;
  /** 完整详情（含 caseExecutionList 等） */
  detail: RequirementQualityDetailDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRequirementQualityDetail(storyId: string | null): UseRequirementQualityDetailResult {
  const [requirement, setRequirement] = useState<RequirementItem | null>(null);
  const [detail, setDetail] = useState<RequirementQualityDetailDTO | null>(null);
  const [loading, setLoading] = useState(!!storyId);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!storyId) {
      setRequirement(null);
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requirementQualityService.detail(storyId);
      setDetail(res);
      setRequirement(dtoToRequirementItem(res));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载详情失败';
      setError(msg);
      setRequirement(null);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { requirement, detail, loading, error, refetch: fetch };
}
