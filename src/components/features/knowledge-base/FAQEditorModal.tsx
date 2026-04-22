import { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { FAQEntry, KnowledgeTag } from '@/types/knowledge-base';
import { faqService } from '@/services/knowledge-base';

interface FAQEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kbId: string;
    initialEntry: FAQEntry | null;
    tags: KnowledgeTag[];
    onSuccess: () => void;
}

export function FAQEditorModal({
    open,
    onOpenChange,
    kbId,
    initialEntry,
    tags,
    onSuccess,
}: FAQEditorModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [standardQuestion, setStandardQuestion] = useState('');
    const [tagId, setTagId] = useState<string>('');

    // Lists
    const [similarQuestions, setSimilarQuestions] = useState<string[]>([]);
    const [negativeQuestions, setNegativeQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);

    // Inputs
    const [similarInput, setSimilarInput] = useState('');
    const [negativeInput, setNegativeInput] = useState('');
    const [answerInput, setAnswerInput] = useState('');

    // Reset form when modal opens or initialEntry changes
    useEffect(() => {
        if (open) {
            if (initialEntry) {
                setStandardQuestion(initialEntry.standard_question || '');
                setTagId(initialEntry.tag_id ? String(initialEntry.tag_id) : '');
                setSimilarQuestions(initialEntry.similar_questions || []);
                setNegativeQuestions(initialEntry.negative_questions || []);
                setAnswers(initialEntry.answers || (initialEntry.answer ? [initialEntry.answer] : []));
            } else {
                setStandardQuestion('');
                setTagId('');
                setSimilarQuestions([]);
                setNegativeQuestions([]);
                setAnswers([]);
            }
            setSimilarInput('');
            setNegativeInput('');
            setAnswerInput('');
        }
    }, [open, initialEntry]);

    const handleAddSimilar = () => {
        const val = similarInput.trim();
        if (!val) return;
        if (similarQuestions.includes(val)) {
            toast.warning('该问题已存在');
            return;
        }
        if (similarQuestions.length >= 10) {
            toast.warning('最多添加 10 个相似问题');
            return;
        }
        setSimilarQuestions([...similarQuestions, val]);
        setSimilarInput('');
    };

    const handleAddNegative = () => {
        const val = negativeInput.trim();
        if (!val) return;
        if (negativeQuestions.includes(val)) {
            toast.warning('该问题已存在');
            return;
        }
        if (negativeQuestions.length >= 10) {
            toast.warning('最多添加 10 个反例问题');
            return;
        }
        setNegativeQuestions([...negativeQuestions, val]);
        setNegativeInput('');
    };

    const handleAddAnswer = () => {
        const val = answerInput.trim();
        if (!val) return;
        if (answers.includes(val)) {
            toast.warning('该答案已存在');
            return;
        }
        if (answers.length >= 5) {
            toast.warning('最多添加 5 个答案');
            return;
        }
        setAnswers([...answers, val]);
        setAnswerInput('');
    };

    const removeSimilar = (idx: number) => {
        setSimilarQuestions(similarQuestions.filter((_, i) => i !== idx));
    };

    const removeNegative = (idx: number) => {
        setNegativeQuestions(negativeQuestions.filter((_, i) => i !== idx));
    };

    const removeAnswer = (idx: number) => {
        setAnswers(answers.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        const question = standardQuestion.trim();
        if (!question) {
            toast.warning('请输入标准问题');
            return;
        }
        if (answers.length === 0) {
            toast.warning('请至少添加一个答案');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                standard_question: question,
                answers: answers, // Send array directly as backend supports new structure
                answer: answers[0], // Backward compatibility
                similar_questions: similarQuestions,
                negative_questions: negativeQuestions,
                tag_id: tagId ? Number(tagId) : null,
                is_enabled: initialEntry ? initialEntry.is_enabled : true,
            };

            if (initialEntry) {
                await faqService.updateFAQEntry(kbId, initialEntry.seq_id, payload);
                toast.success('更新成功');
            } else {
                await faqService.createFAQEntry(kbId, payload);
                toast.success('创建成功');
            }
            onSuccess();
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e?.message || (initialEntry ? '更新失败' : '创建失败'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{initialEntry ? '编辑 FAQ' : '添加 FAQ'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 px-6 py-4 overflow-y-auto scrollbar-thin">
                    <div className="space-y-6 pr-4">
                        {/* Standard Question */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-1">
                                标准问题 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="请输入标准问题"
                                value={standardQuestion}
                                onChange={(e) => setStandardQuestion(e.target.value)}
                                maxLength={200}
                            />
                            <p className="text-xs text-muted-foreground">用户提问的核心问题，建议简洁明了。</p>
                        </div>

                        {/* Similar Questions */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">相似问题 (选填)</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="输入相似问法，按回车添加"
                                    value={similarInput}
                                    onChange={(e) => setSimilarInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSimilar())}
                                />
                                <Button variant="outline" size="icon" onClick={handleAddSimilar} disabled={!similarInput.trim()}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {similarQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-md border text-sm">
                                        <span>{q}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeSimilar(i)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">同一问题的不同表述方式，有助于提高召回率。</p>
                        </div>

                        {/* Negative Questions */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">反例问题 (选填)</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="输入易混淆的问题，按回车添加"
                                    value={negativeInput}
                                    onChange={(e) => setNegativeInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNegative())}
                                />
                                <Button variant="outline" size="icon" onClick={handleAddNegative} disabled={!negativeInput.trim()}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {negativeQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-amber-50/50 border border-amber-100 rounded-md text-sm text-amber-900">
                                        <span>{q}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-700 hover:text-amber-900" onClick={() => removeNegative(i)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">容易被误判为该问题的其他问题，用于排除错误匹配。</p>
                        </div>

                        {/* Answers */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-1">
                                答案 <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex gap-2 items-start">
                                <Textarea
                                    placeholder="输入答案内容，按 Ctrl+Enter 添加"
                                    value={answerInput}
                                    onChange={(e) => setAnswerInput(e.target.value)}
                                    onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && (e.preventDefault(), handleAddAnswer())}
                                    className="min-h-[80px]"
                                />
                                <Button variant="outline" size="icon" className="mt-1" onClick={handleAddAnswer} disabled={!answerInput.trim()}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {answers.map((a, i) => (
                                    <div key={i} className="flex items-start justify-between p-3 bg-green-50/50 border border-green-100 rounded-md text-sm text-green-900 group">
                                        <p className="whitespace-pre-wrap flex-1 mr-2 text-xs leading-relaxed">{a}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-green-700 hover:text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAnswer(i)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">针对该问题的回答，支持添加多个（随机回复或特定条件下回复）。</p>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">分类</Label>
                            {tags.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-2 px-3 border rounded-md bg-muted/30">
                                    暂无分类
                                </div>
                            ) : (
                                <Select value={tagId || undefined} onValueChange={setTagId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择分类（可选）" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[100]" sideOffset={4}>
                                        {tags.map((tag) => (
                                            <SelectItem key={tag.id} value={String(tag.id)}>
                                                {tag.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/5">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]">
                        {loading ? '保存中...' : '保存'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
