/**
 * 用例评审通过率展示（参考设计图）
 * 分段进度条（绿/红/橙/蓝/灰）+ 右侧通过率% + 悬停弹窗（评审进度 + 各状态数量）
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const REVIEW_STATUS_COLORS: Record<string, { color: string; label: string }> = {
  PASS: { color: '#00b42a', label: '通过' },
  UN_PASS: { color: '#f53f3f', label: '不通过' },
  RE_REVIEWED: { color: '#ff7d00', label: '重新提审' },
  UNDER_REVIEWED: { color: '#165DFF', label: '评审中' },
  UN_REVIEWED: { color: '#86909c', label: '未评审' },
};

const STATUS_ORDER = ['PASS', 'UN_PASS', 'RE_REVIEWED', 'UNDER_REVIEWED', 'UN_REVIEWED'] as const;

export interface ReviewPassRateDisplayProps {
  /** 通过率 0-100 */
  passRate?: number;
  /** 用例总数 */
  caseCount?: number;
  /** 已评审数量（通过+不通过+重新提审+评审中），用于弹窗「评审进度 x/y」 */
  reviewedCount?: number;
  /** 各状态数量（后端可选返回）；不传时由 passRate/caseCount 推导 */
  passCount?: number;
  unPassCount?: number;
  reReviewCount?: number;
  underReviewCount?: number;
  unReviewCount?: number;
  /** 列表格内紧凑展示 */
  compact?: boolean;
  /** 是否显示「通过率」标题与问号 */
  showTitle?: boolean;
  className?: string;
}

function deriveCounts(props: ReviewPassRateDisplayProps) {
  const total = Math.max(0, props.caseCount ?? 0);
  const passRate = Math.min(100, Math.max(0, props.passRate ?? 0));
  const pass = props.passCount ?? (total > 0 ? Math.round((total * passRate) / 100) : 0);
  const unPass = props.unPassCount ?? 0;
  const reReview = props.reReviewCount ?? 0;
  const underReview = props.underReviewCount ?? 0;
  const unReview = Math.max(0, total - pass - unPass - reReview - underReview);
  const reviewed = pass + unPass + reReview + underReview;
  return { total, pass, unPass, reReview, underReview, unReview, reviewed };
}

export function ReviewPassRateDisplay({
  passRate = 0,
  caseCount = 0,
  reviewedCount,
  passCount,
  unPassCount,
  reReviewCount,
  underReviewCount,
  unReviewCount,
  compact = false,
  showTitle = false,
  className = '',
}: ReviewPassRateDisplayProps) {
  const { total, pass, unPass, reReview, underReview, unReview, reviewed } = deriveCounts({
    passRate,
    caseCount,
    reviewedCount,
    passCount,
    unPassCount,
    reReviewCount,
    underReviewCount,
    unReviewCount,
  });

  const segments = [
    { key: 'PASS', count: pass },
    { key: 'UN_PASS', count: unPass },
    { key: 'RE_REVIEWED', count: reReview },
    { key: 'UNDER_REVIEWED', count: underReview },
    { key: 'UN_REVIEWED', count: unReview },
  ].filter((s) => s.count > 0);

  const reviewProgressPct = total > 0 ? (reviewed / total) * 100 : 0;
  const passRateNum = Math.min(100, Math.max(0, passRate));
  const displayRate = passRate != null ? `${Number(passRateNum).toFixed(2)}%` : '0.00%';
  const height = compact ? '6px' : '8px';

  const progressBar = (
    <div
      className={`flex items-center gap-2.5 w-full min-w-0 ${compact ? '' : 'mt-1'}`}
      style={{ minHeight: height }}
    >
      <div
        className={`flex-1 min-w-[80px] rounded-full overflow-hidden flex bg-gray-100 ${className}`}
        style={{ height, minHeight: height }}
      >
        {segments.length > 0 ? (
          segments.map((seg) => {
            const pct = total > 0 ? (seg.count / total) * 100 : 0;
            const info = REVIEW_STATUS_COLORS[seg.key];
            return (
              <div
                key={seg.key}
                className="first:rounded-l-full last:rounded-r-full transition-all duration-200"
                style={{
                  width: `${pct}%`,
                  minWidth: pct > 0 ? 2 : 0,
                  backgroundColor: info?.color ?? '#e5e7eb',
                }}
              />
            );
          })
        ) : (
          <div className="w-full rounded-full bg-gray-200" style={{ height }} />
        )}
      </div>
      <span
        className={`text-gray-700 shrink-0 text-right tabular-nums ${compact ? 'text-xs w-12' : 'text-sm w-14'}`}
      >
        {displayRate}
      </span>
    </div>
  );

  const popoverContent = (
    <div className="space-y-2.5 text-xs">
      <div className="flex justify-between items-center">
        <span className="text-gray-500">评审进度</span>
        <span className="font-semibold text-gray-900 tabular-nums">
          {total > 0 ? `${reviewProgressPct.toFixed(2)}% (${reviewed}/${total})` : '0.00% (0/0)'}
        </span>
      </div>
      <div className="border-t border-gray-100 my-1" />
      <div className="grid grid-cols-1 gap-y-2">
        {STATUS_ORDER.map((key) => {
          const info = REVIEW_STATUS_COLORS[key];
          const count = key === 'PASS' ? pass : key === 'UN_PASS' ? unPass : key === 'RE_REVIEWED' ? reReview : key === 'UNDER_REVIEWED' ? underReview : unReview;
          return (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: info?.color ?? '#e5e7eb' }}
              />
              <span className="text-gray-600">{info?.label ?? key}</span>
              <span className="ml-auto font-medium tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={compact ? '' : 'w-full'}>
      {showTitle && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1.5">
          <span>通过率</span>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="cursor-help text-gray-400 hover:text-gray-500">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] bg-white text-gray-900 border border-gray-200" hideArrow>
                通过率 = 通过数 / 总用例数；进度条从左到右依次为：通过、不通过、重新提审、评审中、未评审。
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-pointer min-w-0">{progressBar}</div>
          </TooltipTrigger>
          <TooltipContent className="p-3 shadow-xl border border-gray-200 bg-white text-gray-900 min-w-[160px]" side="top" hideArrow>
            {popoverContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
