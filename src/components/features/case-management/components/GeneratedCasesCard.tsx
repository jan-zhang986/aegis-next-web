/**
 * AI 生成用例结果卡片
 * 拦截 JSON 代码块中的 test_cases，渲染为交互式卡片
 */

import { useState } from 'react';
import { CheckCircle2, LayoutPanelLeft, Plus, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ParsedCaseItem } from './CasePreviewAndSavePanel';
import { generateId } from '../utils';
import type { StepListItem } from '../types';

import { parseJsonCasesToParsedItems } from '../utils/case-extractor';
import type { JsonTestCase } from '../utils/case-extractor';

interface GeneratedCasesCardProps {
    /** AI 返回的 JSON 中的 test_cases 数组 */
    cases: JsonTestCase[];
    /** 同步到预览（覆盖） */
    onPreview?: (cases: ParsedCaseItem[]) => void;
    /** 追加到预览 */
    onAppend?: (cases: ParsedCaseItem[]) => void;
}

export function GeneratedCasesCard({ cases, onPreview, onAppend }: GeneratedCasesCardProps) {
    const [expanded, setExpanded] = useState(false);
    const COLLAPSED_MAX = 5;
    const showToggle = cases.length > COLLAPSED_MAX;
    const displayCases = expanded ? cases : cases.slice(0, COLLAPSED_MAX);

    const parsedItems = parseJsonCasesToParsedItems(cases);

    return (
        <div className="my-3 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-emerald-500/10">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                        成功生成 {cases.length} 条测试用例
                    </p>
                </div>
            </div>

            {/* Case List */}
            <div className="px-4 py-2.5">
                <div className="space-y-1">
                    {displayCases.map((tc, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2.5 py-1.5 text-sm text-foreground/80"
                        >
                            <div className="flex items-center justify-center w-5 h-5 rounded bg-muted/60 text-muted-foreground shrink-0">
                                <FileText className="w-3 h-3" />
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 tabular-nums w-6">
                                {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="truncate text-[13px]">{tc.name}</span>
                            {tc.level && (
                                <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tc.level === 'P0' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                    tc.level === 'P1' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                        tc.level === 'P2' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                            'bg-muted text-muted-foreground'
                                    }`}>
                                    {tc.level}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {showToggle && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                收起
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                还有 {cases.length - COLLAPSED_MAX} 条...
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-emerald-500/10 bg-muted/10">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 rounded-lg text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:text-emerald-300"
                    onClick={() => onPreview?.(parsedItems)}
                >
                    <LayoutPanelLeft className="w-3.5 h-3.5 mr-1.5" />
                    同步到预览
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 rounded-lg text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:text-emerald-300"
                    onClick={() => onAppend?.(parsedItems)}
                >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    追加到预览
                </Button>
            </div>
        </div>
    );
}
