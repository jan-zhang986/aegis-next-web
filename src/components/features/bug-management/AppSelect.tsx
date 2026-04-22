/**
 * 所属应用选择器：单选必填，输入框内搜索，选项样式跟随字体/主题
 * 交互同缺陷原因（搜索在触发区输入框，无单独搜索框）
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils/cn';

interface OptionItem {
    value: string;
    label: string;
}

interface AppSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: OptionItem[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** 是否允许清空，默认 true，用于所属应用等；处理人等必填场景可设为 false */
    allowClear?: boolean;
}

export function AppSelect({
    value,
    onChange,
    options,
    placeholder = '待填',
    disabled,
    className,
    allowClear,
}: AppSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const triggerInputRef = useRef<HTMLInputElement>(null);

    const selectedLabel = value ? options.find((o) => o.value === value)?.label ?? value : '';

    const filteredOptions = useMemo(() => {
        const kw = searchKeyword.trim().toLowerCase();
        if (!kw) return options;
        return options.filter((o) => o.label.toLowerCase().includes(kw));
    }, [options, searchKeyword]);

    useEffect(() => {
        if (open) {
            setSearchKeyword('');
            setTimeout(() => triggerInputRef.current?.focus(), 0);
        }
    }, [open]);

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
                        'flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-[0_1px_2px_0_rgb(0_0_0_/0.05)]',
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
                        {allowClear !== false && selectedLabel && !open && (
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
                className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-h-[320px] overflow-hidden flex flex-col p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                    // 防止点击外部时立即关闭，给一点延迟
                    const target = e.target as HTMLElement;
                    if (target.closest('[role="combobox"]')) {
                        e.preventDefault();
                    }
                }}
            >
                <div
                    className="overflow-y-auto overflow-x-hidden p-2 flex-1 min-h-0 overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">无匹配项</div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {filteredOptions.map((opt, idx) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(opt.value);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className={cn(
                                        'rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors text-left hover:bg-muted',
                                        value === opt.value
                                            ? 'bg-muted ring-2 ring-primary ring-offset-1'
                                            : ''
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
