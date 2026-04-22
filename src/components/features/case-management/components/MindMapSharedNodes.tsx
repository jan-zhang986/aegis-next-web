import React from 'react';
import { Handle, Position, type NodeProps, Node } from '@xyflow/react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { getCaseLevel } from '../utils';
import { RichTextContent } from './RichTextContent';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { CASE_LEVEL_MAP, REVIEW_STATUS_MAP } from '../constants';
import { MindMapNodeData } from '../FeatureCaseMinderView';

/** 选中态画在圆角卡片上，避免外层 .react-flow__node 与内容尺寸不一致产生缝隙 */
const minderSelectedRing = 'ring-2 ring-slate-400 ring-offset-0';

/** 脑图悬浮层：不用主题 primary 蓝底，避免刺眼、富文本对比度不足 */
function minderTooltipClass(maxWidthClass: string) {
    return cn(
        'border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-md',
        '[&_a]:text-emerald-700 [&_a]:underline',
        maxWidthClass
    );
}

function extractPlainText(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

/** 共用模块节点 */
export function MindMapModuleNode({ data, selected }: NodeProps<Node<MindMapNodeData>>) {
    const { label, count, hasChildren, expanded, isLoading } = data;
    const displayLabel = label.length > 18 ? label.slice(0, 18) + '…' : label;
    const showTooltip = label.length > 18;

    const content = (
        <div
            className={cn(
                'min-w-[180px] px-2 py-1.5 rounded-lg border border-slate-300/90 bg-gradient-to-b from-white to-slate-50/90 text-slate-800 shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:border-slate-400 hover:shadow-md active:scale-[0.98]',
                selected ? minderSelectedRing : 'hover:ring-1 hover:ring-slate-200/80'
            )}
        >
            <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-600 text-white shrink-0 font-medium">
                模块
            </span>
            <span className="flex-1 truncate text-[13px]">{displayLabel}</span>
            {count != null && count > 0 && !isLoading && (
                <span className="text-xs text-slate-500 shrink-0">({count})</span>
            )}
            {hasChildren && (
                <span
                    data-action="expand"
                    className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-300/90 transition-colors"
                >
                    {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : expanded ? (
                        <Minus className="w-3 h-3" />
                    ) : (
                        <Plus className="w-3 h-3" />
                    )}
                </span>
            )}
            <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
        </div>
    );

    if (showTooltip) {
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent
                        side="top"
                        sideOffset={6}
                        hideArrow
                        className={minderTooltipClass('max-w-[280px]')}
                    >
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    return content;
}

/** 共用测试用例节点 (兼容功能用例与用例评审视角) */
export function MindMapCaseNode({ data, selected }: NodeProps<Node<MindMapNodeData>>) {
    const { label, count, rawNode, hasChildren, expanded, isLoading } = data;
    const plainText = extractPlainText(label);
    /** 卡片内最多 2 行，由 line-clamp 省略；约超过两行宽度时或富文本时用悬浮查看全文 */
    const displayText = plainText;
    const showTooltip =
        label !== plainText ||
        plainText.length > 32 ||
        /\n/.test(plainText.trim());

    const rawLevel = getCaseLevel(rawNode?.data as any);
    const level = rawLevel && rawLevel !== '-' ? rawLevel : 'P0';
    const levelKey = level.toUpperCase();
    const levelStyle = CASE_LEVEL_MAP[levelKey as keyof typeof CASE_LEVEL_MAP] ?? {
        label: level,
        className: 'text-gray-600',
        circleClass: 'border-gray-400',
        minderSolidClass: 'bg-slate-400 text-white',
    };

    const reviewStatus = (rawNode?.data as any)?.status;
    const statusLabel = reviewStatus && REVIEW_STATUS_MAP[reviewStatus as keyof typeof REVIEW_STATUS_MAP]?.label;

    const content = (
        <div
            className={cn(
                'min-w-[180px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm flex items-start gap-2 transition-all cursor-pointer hover:border-slate-300 hover:shadow-md active:scale-[0.98]',
                selected ? minderSelectedRing : 'hover:ring-1 hover:ring-slate-100'
            )}
        >
            <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
            <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold shadow-sm ring-1 ring-black/5 ${levelStyle.minderSolidClass}`}
            >
                {levelStyle.label}
            </span>
            <span className="min-w-0 flex-1 break-words text-left text-[13px] leading-snug line-clamp-2">
                {displayText}
            </span>

            <div className="flex shrink-0 items-center gap-1 self-center">
                {/* For feature case view (shows count of steps) */}
                {count != null && count > 0 && !hasChildren && (
                    <span className="text-xs text-slate-500">({count})</span>
                )}

                {/* For review case view (shows review status) */}
                {statusLabel && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-700">
                        {statusLabel}
                    </span>
                )}

                {hasChildren && (
                    <span
                        data-action="expand"
                        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                    >
                        {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : expanded ? (
                            <Minus className="w-3 h-3" />
                        ) : (
                            <Plus className="w-3 h-3" />
                        )}
                    </span>
                )}
            </div>
            <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
        </div>
    );

    if (showTooltip) {
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent
                        side="top"
                        sideOffset={6}
                        hideArrow
                        className={minderTooltipClass('max-w-[400px]')}
                    >
                        <p className="mb-1.5 text-xs leading-snug text-slate-500">
                            单击/双击查看详情 · 点击展开图标查看前置/步骤/预期结果
                        </p>
                        <div>
                            <RichTextContent
                                content={label}
                                className="text-sm text-slate-800 [&_ul]:my-1 [&_li]:my-0.5 [&_p]:my-0.5"
                            />
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    return content;
}

/** 共用测试用例详情节点 (前置/步骤/预期结果) */
export function MindMapContentNode({ data, selected }: NodeProps<Node<MindMapNodeData>>) {
    const { label, resourceType, hasChildren, expanded, rawNode } = data;
    const plainText = extractPlainText(label);
    const displayText = plainText.length > 24 ? plainText.slice(0, 24) + '…' : plainText;
    const showTooltip = plainText.length > 24 || label !== plainText;
    const tag = resourceType || (rawNode?.resourceType as string) || '';

    const content = (
        <div
            className={cn(
                'min-w-[160px] px-2 py-1.5 rounded-lg border border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white text-emerald-950 flex items-center gap-2 transition-all cursor-pointer hover:border-emerald-300 hover:shadow-sm active:scale-[0.98]',
                selected ? minderSelectedRing : 'hover:ring-1 hover:ring-emerald-100'
            )}
        >
            <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
            {tag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 font-medium">
                    {tag}
                </span>
            )}
            <span className="flex-1 truncate text-[12px]">{displayText || '-'}</span>
            {hasChildren && (
                <span
                    data-action="expand"
                    className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 cursor-pointer hover:bg-emerald-200 transition-colors"
                >
                    {expanded ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                </span>
            )}
            <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
        </div>
    );

    if (showTooltip) {
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent
                        side="top"
                        sideOffset={6}
                        hideArrow
                        className={minderTooltipClass('max-w-[400px]')}
                    >
                        <RichTextContent
                            content={label}
                            className="text-sm text-slate-800 [&_ul]:my-1 [&_li]:my-0.5 [&_p]:my-0.5"
                        />
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    return content;
}

/** 共用加载更多节点 */
export function MindMapMoreNode({ data, selected }: NodeProps<Node<MindMapNodeData>>) {
    const { label } = data;
    return (
        <div
            className={cn(
                'min-w-[140px] px-2 py-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/90 text-slate-600 flex items-center gap-2 transition-all cursor-pointer hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98]',
                selected && minderSelectedRing
            )}
        >
            <Handle type="target" position={Position.Left} className="!border-0 !w-1 !h-1" />
            <span className="flex-1 truncate text-xs italic">{label}</span>
            <span className="text-[10px] shrink-0">点击加载</span>
            <Handle type="source" position={Position.Right} className="!border-0 !w-1 !h-1" />
        </div>
    );
}
