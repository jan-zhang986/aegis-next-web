/**
 * 业务线选择器：四级结构（一级 -> 二级 -> 分组 -> 选项）
 * 一级：商家&运营、效率协同、供应链等；二级：客户关系、营销中心、业务中台等
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    BUG_BUSINESS_LINE_TOP_LEVEL,
    getBusinessLineLabelByValue,
    type BusinessLineTopLevel,
    type BusinessLineSecondLevel,
} from '@/services/bug-management/constants/bug-business-line';
import { cn } from '@/utils/cn';

function secondLevelKey(topGroup: string, secGroup: string): string {
    return `${topGroup}\0${secGroup}`;
}

function thirdLevelKey(topGroup: string, secGroup: string, grpGroup: string): string {
    return `${topGroup}\0${secGroup}\0${grpGroup}`;
}

/** 按关键词过滤：匹配任意层级 */
function filterTopLevel(
    topLevel: BusinessLineTopLevel[],
    kw: string
): BusinessLineTopLevel[] {
    if (!kw) return topLevel;
    const lower = kw.toLowerCase();
    return topLevel
        .map((top) => {
            const matchTop = top.group.toLowerCase().includes(lower);
            const children: BusinessLineSecondLevel[] = top.children
                .map((sec) => {
                    const matchSec = sec.group.toLowerCase().includes(lower);
                    const grps = sec.children
                        .map((grp) => {
                            const matchGrp = grp.group.toLowerCase().includes(lower);
                            const options = matchGrp
                                ? grp.options
                                : grp.options.filter((o) => o.label.toLowerCase().includes(lower));
                            if (options.length === 0) return null;
                            return { ...grp, options };
                        })
                        .filter(Boolean) as typeof sec.children;
                    if (matchSec || grps.length > 0) return { ...sec, children: grps };
                    return null;
                })
                .filter(Boolean) as BusinessLineSecondLevel[];
            if (matchTop || children.length > 0) return { ...top, children };
            return null;
        })
        .filter(Boolean) as BusinessLineTopLevel[];
}

/** 扁平选项（如来自飞书接口：value=id，label=中文；path 有值时按树形展示：6+DTC 一级，逐级展开） */
export type BusinessLineFlatOption = { value: string; label: string; path?: string; level?: string };

/** 由 path 构建的树节点（与飞书一致：顶层 6 项 + DTC，一级一级展开） */
export interface BusinessLineTreeNode {
    path: string;
    name: string;
    id?: string;
    children: BusinessLineTreeNode[];
}

/**
 * 从带 path 的扁平列表构建树，严格保持接口（JSON）顺序与目录结构：
 * - 根节点顺序 = 扁平列表中首次出现的无 " > " 的 path 顺序
 * - 子节点顺序 = 扁平列表中首次出现的、该父 path 的直接子 path 顺序
 * 不做任何字母排序，避免出现“多余项”和“每个都有其他”。
 */
function buildTreeFromFlatOptions(options: BusinessLineFlatOption[]): BusinessLineTreeNode[] {
    const optionsWithPath = options.filter((o): o is BusinessLineFlatOption & { path: string } => Boolean(o.path));
    if (optionsWithPath.length === 0) return [];

    const byPath = new Map<string, { value: string; label: string }>();
    optionsWithPath.forEach((o) => byPath.set(o.path, { value: o.value, label: o.label }));

    const parentDepth = (p: string) => p.split(' > ').length;
    const isDirectChildOf = (childPath: string, parentPath: string) => {
        if (!parentPath) return parentDepth(childPath) === 1;
        const prefix = parentPath + ' > ';
        if (!childPath.startsWith(prefix)) return false;
        return parentDepth(childPath) === parentDepth(parentPath) + 1;
    };

    function directChildrenOrdered(parentPath: string): string[] {
        const out: string[] = [];
        const seen = new Set<string>();
        for (const o of optionsWithPath) {
            const p = o.path;
            if (!isDirectChildOf(p, parentPath) || seen.has(p)) continue;
            seen.add(p);
            out.push(p);
        }
        return out;
    }

    function nodeFromPath(path: string): BusinessLineTreeNode {
        const childrenPaths = directChildrenOrdered(path);
        const opt = byPath.get(path);
        return {
            path,
            name: opt?.label ?? path.split(' > ').pop() ?? path,
            id: opt?.value,
            children: childrenPaths.map(nodeFromPath),
        };
    }

    const rootPathsOrdered: string[] = [];
    const seenRoot = new Set<string>();
    for (const o of optionsWithPath) {
        const p = o.path;
        if (p.includes(' > ') || seenRoot.has(p)) continue;
        seenRoot.add(p);
        rootPathsOrdered.push(p);
    }
    return rootPathsOrdered.map(nodeFromPath);
}

/** 过滤树：保留名称或任意子节点匹配关键词的节点 */
function filterTree(nodes: BusinessLineTreeNode[], keyword: string): BusinessLineTreeNode[] {
    if (!keyword.trim()) return nodes;
    const kw = keyword.trim().toLowerCase();
    return nodes
        .map((n) => {
            const matchSelf = n.name.toLowerCase().includes(kw);
            const filteredChildren = filterTree(n.children, keyword);
            if (matchSelf || filteredChildren.length > 0) {
                return { ...n, children: matchSelf ? n.children : filteredChildren };
            }
            return null;
        })
        .filter(Boolean) as BusinessLineTreeNode[];
}

/** 收集树中所有有子节点的 path（搜索时用于自动展开） */
function collectExpandablePaths(nodes: BusinessLineTreeNode[]): string[] {
    const out: string[] = [];
    nodes.forEach((n) => {
        if (n.children.length > 0) {
            out.push(n.path);
            out.push(...collectExpandablePaths(n.children));
        }
    });
    return out;
}

interface BusinessLineSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** 若传入则使用扁平列表（与飞书接口一致），只展示 label；不传则用本地树形枚举 */
    options?: BusinessLineFlatOption[];
}

export function BusinessLineSelect({
    value,
    onChange,
    placeholder = '待填',
    disabled,
    className,
    options: flatOptions,
}: BusinessLineSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [expandedTop, setExpandedTop] = useState<Set<string>>(new Set());
    const [expandedSecond, setExpandedSecond] = useState<Set<string>>(new Set());
    const [expandedThird, setExpandedThird] = useState<Set<string>>(new Set());
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const triggerInputRef = useRef<HTMLInputElement>(null);

    const hasPathOptions = flatOptions?.length && flatOptions.some((o) => o.path);

    const businessLineTree = useMemo(() => {
        if (!hasPathOptions || !flatOptions) return [];
        return buildTreeFromFlatOptions(flatOptions);
    }, [flatOptions, hasPathOptions]);

    const filteredBusinessLineTree = useMemo(() => {
        return filterTree(businessLineTree, searchKeyword.trim());
    }, [businessLineTree, searchKeyword]);

    const expandedForRender = useMemo(() => {
        if (!searchKeyword.trim()) return expandedPaths;
        const autoExpand = new Set(collectExpandablePaths(filteredBusinessLineTree));
        return new Set([...expandedPaths, ...autoExpand]);
    }, [expandedPaths, searchKeyword, filteredBusinessLineTree]);

    const selectedLabel = flatOptions
        ? (value ? (() => {
            const found = flatOptions.find((o) => o.value === value);
            if (!found) return value;
            return found.path ? found.path.replace(/ > /g, ' / ') : found.label;
          })() : '')
        : value
          ? getBusinessLineLabelByValue(value)
          : '';

    const filteredFlatOptions = useMemo(() => {
        if (!flatOptions) return [];
        const kw = searchKeyword.trim().toLowerCase();
        if (!kw) return flatOptions;
        return flatOptions.filter((o) => o.label.toLowerCase().includes(kw));
    }, [flatOptions, searchKeyword]);

    const filteredTopLevel = useMemo(
        () => filterTopLevel(BUG_BUSINESS_LINE_TOP_LEVEL, searchKeyword.trim()),
        [searchKeyword]
    );

    const togglePath = (path: string) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const isSelectedUnderPath = (node: BusinessLineTreeNode): boolean => {
        if (node.id && node.id === value) return true;
        return node.children.some(isSelectedUnderPath);
    };

    /** 递归渲染树节点：与飞书一致，一级一级展开，可选中带 id 的节点 */
    const renderTreeNode = (node: BusinessLineTreeNode, depth: number): React.ReactNode => {
        const isExpanded = expandedForRender.has(node.path);
        const hasChildren = node.children.length > 0;
        const indent = depth * 16;

        if (!hasChildren) {
            return (
                <button
                    key={node.path}
                    type="button"
                    onClick={() => node.id && handleSelect(node.id)}
                    className={cn(
                        'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                        value === node.id && 'bg-muted ring-2 ring-primary ring-offset-1'
                    )}
                    style={{ paddingLeft: 8 + indent }}
                >
                    <span className="w-4 shrink-0" />
                    <span className="truncate">{node.name}</span>
                </button>
            );
        }

        return (
            <Collapsible
                key={node.path}
                open={isExpanded}
                onOpenChange={() => togglePath(node.path)}
            >
                <div className="flex items-center gap-0.5" style={{ paddingLeft: 8 + indent }}>
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded hover:bg-muted text-muted-foreground"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    </CollapsibleTrigger>
                    <button
                        type="button"
                        onClick={() => node.id && handleSelect(node.id)}
                        className={cn(
                            'flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-sm font-medium transition-colors hover:bg-muted min-w-0',
                            value === node.id && 'bg-muted ring-2 ring-primary ring-offset-1'
                        )}
                    >
                        <span className="truncate">{node.name}</span>
                        {isSelectedUnderPath(node) && <span className="text-primary shrink-0">✓</span>}
                    </button>
                </div>
                <CollapsibleContent>
                    <div className="pl-0">
                        {node.children.map((child) => renderTreeNode(child, depth + 1))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    };

    useEffect(() => {
        if (open) {
            setSearchKeyword('');
            setTimeout(() => triggerInputRef.current?.focus(), 0);
        }
    }, [open]);

    const toggleTop = (key: string) => {
        setExpandedTop((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleSecond = (key: string) => {
        setExpandedSecond((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleThird = (key: string) => {
        setExpandedThird((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSelect = (v: string) => {
        onChange(v);
        setOpen(false);
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background',
                        'focus-within:outline-none focus-within:border-blue-400',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        open && 'border-blue-400',
                        className
                    )}
                >
                    <input
                        ref={triggerInputRef}
                        type="text"
                        value={open ? searchKeyword : selectedLabel}
                        onChange={(e) => open && setSearchKeyword(e.target.value)}
                        onFocus={() => !open && setOpen(true)}
                        readOnly={!open}
                        disabled={disabled}
                        placeholder={placeholder}
                        className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                        {selectedLabel && !open && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={handleClearAll}
                                onKeyDown={(e) => e.key === 'Enter' && handleClearAll(e as unknown as React.MouseEvent)}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </span>
                        )}
                        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0', open && 'rotate-180')} />
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-h-[360px] overflow-hidden flex flex-col p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div
                    className="overflow-y-auto overflow-x-hidden p-1 flex-1 min-h-0 overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                >
                    {flatOptions !== undefined ? (
                        hasPathOptions ? (
                            filteredBusinessLineTree.length === 0 ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    {businessLineTree.length === 0 ? '加载中或暂无数据' : '无匹配项'}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5 py-1">
                                    {filteredBusinessLineTree.map((node) => renderTreeNode(node, 0))}
                                </div>
                            )
                        ) : filteredFlatOptions.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                {flatOptions.length === 0 ? '加载中或暂无数据' : '无匹配项'}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 py-1">
                                {filteredFlatOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={cn(
                                            'rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors text-left hover:bg-muted',
                                            value === opt.value ? 'bg-muted ring-2 ring-primary ring-offset-1' : ''
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )
                    ) : filteredTopLevel.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">无匹配项</div>
                    ) : (
                        filteredTopLevel.map((top) => (
                            <Collapsible
                                key={top.group}
                                open={expandedTop.has(top.group)}
                                onOpenChange={() => toggleTop(top.group)}
                            >
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-muted/60 cursor-pointer text-sm font-medium">
                                        <div className="flex items-center gap-1.5">
                                            {expandedTop.has(top.group) ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            <span>{top.group}</span>
                                        </div>
                                        {value &&
                                            top.children.some((sec) =>
                                                sec.children.some((grp) =>
                                                    grp.options.some((o) => o.value === value)
                                                )
                                            ) && <span className="text-primary">✓</span>}
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="pl-4">
                                        {top.children.length === 0 ? (
                                            <div className="py-2 text-sm text-muted-foreground">暂无子项</div>
                                        ) : (
                                            top.children.map((sec) => {
                                                const sk = secondLevelKey(top.group, sec.group);
                                                return (
                                                    <Collapsible
                                                        key={sk}
                                                        open={expandedSecond.has(sk)}
                                                        onOpenChange={() => toggleSecond(sk)}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <div className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-muted/60 cursor-pointer text-sm font-medium">
                                                                <div className="flex items-center gap-1.5">
                                                                    {expandedSecond.has(sk) ? (
                                                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                    ) : (
                                                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                    )}
                                                                    <span>{sec.group}</span>
                                                                </div>
                                                                {value &&
                                                                    sec.children.some((grp) =>
                                                                        grp.options.some((o) => o.value === value)
                                                                    ) && (
                                                                        <span className="text-primary">✓</span>
                                                                    )}
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <div className="pl-4">
                                                                {sec.children.length === 0 ? (
                                                                    <div className="py-1.5 text-sm text-muted-foreground">
                                                                        暂无子项
                                                                    </div>
                                                                ) : (
                                                                    sec.children.map((grp) => {
                                                                        const tk = thirdLevelKey(
                                                                            top.group,
                                                                            sec.group,
                                                                            grp.group
                                                                        );
                                                                        return (
                                                                            <Collapsible
                                                                                key={tk}
                                                                                open={expandedThird.has(tk)}
                                                                                onOpenChange={() => toggleThird(tk)}
                                                                            >
                                                                                <CollapsibleTrigger asChild>
                                                                                    <div className="flex items-center justify-between gap-2 py-1 px-2 rounded-md hover:bg-muted/60 cursor-pointer text-sm">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {expandedThird.has(tk) ? (
                                                                                                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                                            ) : (
                                                                                                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                                            )}
                                                                                            <span>{grp.group}</span>
                                                                                        </div>
                                                                                        {value &&
                                                                                            grp.options.some(
                                                                                                (o) => o.value === value
                                                                                            ) && (
                                                                                                <span className="text-primary">
                                                                                                    ✓
                                                                                                </span>
                                                                                            )}
                                                                                    </div>
                                                                                </CollapsibleTrigger>
                                                                                <CollapsibleContent>
                                                                                    <div className="flex flex-col gap-1.5 pl-6 pb-2">
                                                                                        {grp.options.map((opt) => (
                                                                                            <button
                                                                                                key={opt.value}
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleSelect(
                                                                                                        opt.value
                                                                                                    )
                                                                                                }
                                                                                                className={cn(
                                                                                                    'rounded-md px-2.5 py-1 text-sm text-foreground transition-colors text-left hover:bg-muted',
                                                                                                    value === opt.value
                                                                                                        ? 'bg-muted ring-2 ring-primary ring-offset-1'
                                                                                                        : ''
                                                                                                )}
                                                                                            >
                                                                                                {opt.label}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </CollapsibleContent>
                                                                            </Collapsible>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                );
                                            })
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
