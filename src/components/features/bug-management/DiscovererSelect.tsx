/**
 * 发现人选择器：不必填、单选、支持搜索
 * 优先使用 groups 入参（从飞书接口拉取），未传或空时回退到写死常量
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BUG_DISCOVERER_GROUPS } from '@/services/bug-management/constants/bug-discoverer';
import type { FeishuDefectReasonGroup } from '@/services/bug-management/service';
import { cn } from '@/utils/cn';

const DEFAULT_GROUPS = BUG_DISCOVERER_GROUPS;

function getLabelByValue(value: string, groups: FeishuDefectReasonGroup[]): string {
    for (const grp of groups) {
        const opt = grp.options.find((o) => o.value === value);
        if (opt) return opt.label;
    }
    return value;
}

interface DiscovererSelectProps {
    value: string;
    onChange: (value: string) => void;
    /** 从飞书接口拉取的发现人选项；未传或空时使用写死常量 */
    groups?: FeishuDefectReasonGroup[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DiscovererSelect({
    value,
    onChange,
    groups: groupsProp,
    placeholder = '待填',
    disabled,
    className,
}: DiscovererSelectProps) {
    const groups = (groupsProp && groupsProp.length > 0) ? groupsProp : DEFAULT_GROUPS;
    const [open, setOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(
        groups.map((g) => g.group)
    ));
    const triggerInputRef = useRef<HTMLInputElement>(null);

    const selectedLabel = value ? getLabelByValue(value, groups) : '';

    const filteredGroups = useMemo(() => {
        const kw = searchKeyword.trim().toLowerCase();
        if (!kw) return groups;
        return groups.map((grp) => {
            const matchGroup = grp.group.toLowerCase().includes(kw);
            const options = matchGroup
                ? grp.options
                : grp.options.filter((o) => o.label.toLowerCase().includes(kw));
            if (options.length === 0) return null;
            return { ...grp, options };
        }).filter(Boolean) as FeishuDefectReasonGroup[];
    }, [searchKeyword, groups]);

    useEffect(() => {
        if (open) {
            setSearchKeyword('');
            setTimeout(() => triggerInputRef.current?.focus(), 0);
        }
    }, [open]);

    useEffect(() => {
        setExpandedGroups(new Set(groups.map((g) => g.group)));
    }, [groups]);

    const toggleGroup = (group: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
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
                    {filteredGroups.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">无匹配项</div>
                    ) : (
                        filteredGroups.map((grp) => {
                            const isFlatGroup = grp.group === '其他' || grp.group === '系统';
                            const optionButton = (opt: { value: string; label: string }) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        'rounded-md px-2.5 py-1 text-sm text-foreground transition-colors text-left hover:bg-muted w-full',
                                        value === opt.value
                                            ? 'bg-muted ring-2 ring-primary ring-offset-1'
                                            : ''
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                            if (isFlatGroup) {
                                return (
                                    <div key={grp.group} className="flex flex-col gap-1.5 py-1 px-2">
                                        {grp.options.map((opt) => optionButton(opt))}
                                    </div>
                                );
                            }
                            return (
                                <Collapsible
                                    key={grp.group}
                                    open={expandedGroups.has(grp.group)}
                                    onOpenChange={() => toggleGroup(grp.group)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-muted/60 cursor-pointer text-sm font-medium">
                                            <div className="flex items-center gap-1.5">
                                                {expandedGroups.has(grp.group) ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                )}
                                                <span>{grp.group}</span>
                                            </div>
                                            {value && grp.options.some((o) => o.value === value) && (
                                                <span className="text-primary">✓</span>
                                            )}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="flex flex-col gap-1.5 pl-6 pb-2">
                                            {grp.options.map((opt) => optionButton(opt))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
