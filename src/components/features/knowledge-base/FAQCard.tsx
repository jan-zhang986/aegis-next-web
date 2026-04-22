import { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    HelpCircle,
    MessageSquare,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { FAQEntry } from '@/types/knowledge-base';
import { cn } from '@/utils/cn';

interface FAQCardProps {
    entry: FAQEntry;
    tagName?: string;
    onEdit: (entry: FAQEntry) => void;
    onDelete: (entry: FAQEntry) => void;
    onStatusChange: (entry: FAQEntry, enabled: boolean) => void;
}

export function FAQCard({ entry, tagName, onEdit, onDelete, onStatusChange }: FAQCardProps) {
    const [similarOpen, setSimilarOpen] = useState(false);
    const [negativeOpen, setNegativeOpen] = useState(false);
    const [answersOpen, setAnswersOpen] = useState(false);

    const hasSimilar = entry.similar_questions && entry.similar_questions.length > 0;
    const hasNegative = entry.negative_questions && entry.negative_questions.length > 0;
    // Fallback to single answer if multiple answers not present
    const answers = entry.answers && entry.answers.length > 0
        ? entry.answers
        : (entry.answer ? [entry.answer] : []);
    const hasAnswers = answers.length > 0;

    return (
        <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow group relative">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium leading-relaxed text-foreground pr-8">
                        {entry.standard_question}
                    </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center">
                                    <Switch
                                        checked={entry.is_enabled !== false}
                                        onCheckedChange={(checked) => onStatusChange(entry, checked)}
                                        className="scale-75 data-[state=checked]:bg-green-500"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{entry.is_enabled !== false ? '已启用' : '已禁用'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(entry)}>
                                <Edit className="w-4 h-4 mr-2" />
                                编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(entry)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Body Sections */}
            <div className="space-y-2">
                {/* Similar Questions */}
                {hasSimilar && (
                    <div className="text-sm">
                        <button
                            onClick={() => setSimilarOpen(!similarOpen)}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
                        >
                            {similarOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>相似问题</span>
                            <span className="text-xs bg-muted px-1.5 rounded-full ml-1">{entry.similar_questions?.length}</span>
                        </button>

                        {similarOpen && (
                            <div className="pl-6 pt-1 flex flex-wrap gap-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                {entry.similar_questions?.map((q, i) => (
                                    <Badge key={i} variant="secondary" className="font-normal text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-transparent">
                                        {q}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Negative Questions */}
                {hasNegative && (
                    <div className="text-sm">
                        <button
                            onClick={() => setNegativeOpen(!negativeOpen)}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
                        >
                            {negativeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>反例问题</span>
                            <span className="text-xs bg-muted px-1.5 rounded-full ml-1">{entry.negative_questions?.length}</span>
                        </button>

                        {negativeOpen && (
                            <div className="pl-6 pt-1 flex flex-wrap gap-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                {entry.negative_questions?.map((q, i) => (
                                    <Badge key={i} variant="outline" className="font-normal text-xs text-amber-600 border-amber-200 bg-amber-50">
                                        {q}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Answers */}
                {hasAnswers && (
                    <div className="text-sm">
                        <button
                            onClick={() => setAnswersOpen(!answersOpen)}
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
                        >
                            {answersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>答案</span>
                            <span className="text-xs bg-muted px-1.5 rounded-full ml-1">{answers.length}</span>
                        </button>

                        {answersOpen && (
                            <div className="pl-6 pt-1 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                {answers.map((a, i) => (
                                    <div key={i} className="bg-green-50/50 text-green-900 border border-green-100 rounded-md p-2 text-xs leading-relaxed break-all">
                                        {a}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer / Tags */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {tagName ? (
                        <Badge variant="outline" className="font-normal text-xs text-muted-foreground border-border bg-muted/30">
                            {tagName}
                        </Badge>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">未分类</span>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">
                    {/* Can put creation time or other meta/stats here */}
                </div>
            </div>
        </div>
    );
}
