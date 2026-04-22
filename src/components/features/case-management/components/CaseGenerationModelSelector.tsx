import { useState, useRef } from 'react';
import { Check, Sparkles, MessageCircle, Bot, ChevronDown, Zap } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { ModelConfig } from '@/services/knowledge-base';

interface Props {
    models: ModelConfig[];
    currentModelId: string;
    onSelect: (modelId: string) => void;
    showPrefix?: boolean;
}

export function CaseGenerationModelSelector({ models, currentModelId, onSelect, showPrefix }: Props) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    // 根据模型名称或类型选择合适的图标
    const getModelIcon = (model: ModelConfig, className?: string) => {
        const name = model.name.toLowerCase();
        if (name.includes('gemini') || name.includes('gpt-4') || name.includes('claude-3') || name.includes(' reasoning') || name.includes('r1')) {
            return <Sparkles className={className} />;
        }
        if (name.includes('flash') || name.includes('fast')) {
            return <Zap className={className} />;
        }
        if (model.type === 'KnowledgeQA') {
            return <Bot className={className} />;
        }
        return <MessageCircle className={className} />;
    };

    const currentModel = models.find((m) => (m.id ?? m.name) === currentModelId) || models[0];

    if (!models.length) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="flex">
                    <button
                        className={`group flex items-center gap-2 transition-all focus:outline-none ${showPrefix
                            ? 'px-1.5 py-1.5 hover:bg-muted/40 rounded-full border border-transparent'
                            : `px-3 py-1.5 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-primary/20 bg-background/50 hover:bg-background/80 ${open ? 'border-primary/30 shadow-sm' : 'border-transparent hover:border-border/60'}`
                            }`}
                    >
                        {showPrefix ? (
                            <>
                                <div className="flex items-center justify-center gap-1.5 px-2.5 py-[3px] rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                    Online
                                </div>
                                <span className="text-[14px] font-medium text-foreground pr-2 tracking-wide opacity-90 transition-opacity group-hover:opacity-100">Try {currentModel?.name || '选择模型'}</span>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center justify-center w-4 h-4 rounded text-emerald-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                </div>
                                <span className="truncate max-w-[140px] text-foreground/90">{currentModel?.name || '选择模型'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-muted-foreground/70 ${open ? 'rotate-180 text-foreground' : ''}`} />
                            </>
                        )}
                    </button>
                </div>
            </PopoverTrigger>
            <PopoverContent
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="w-[260px] p-1.5 rounded-xl border-border/40 shadow-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
                align="start"
                sideOffset={8}
            >
                <div className="flex flex-col">
                    {models.map((model) => {
                        const id = model.id ?? model.name;
                        const isSelected = id === currentModelId;
                        return (
                            <button
                                key={id}
                                onClick={() => {
                                    onSelect(id);
                                    setOpen(false);
                                }}
                                className={`group flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-all duration-200 ${isSelected
                                    ? 'bg-primary/5 text-primary'
                                    : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground'
                                    }`}
                            >
                                <div className={`flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors ${isSelected
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-muted/80 text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:shadow-sm border border-transparent group-hover:border-border/50'
                                    }`}>
                                    {getModelIcon(model, "w-3.5 h-3.5")}
                                </div>
                                <div className="flex items-center justify-between flex-1 min-w-0">
                                    <span className={`text-[13px] font-medium truncate tracking-tight`}>
                                        {model.name}
                                    </span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
