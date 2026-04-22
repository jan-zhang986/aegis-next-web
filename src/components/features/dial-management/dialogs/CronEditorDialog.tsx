import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Clock } from 'lucide-react';
import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue';
import 'cronstrue/locales/zh_CN';

export interface CronEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onChange: (value: string) => void;
}

const PRESETS = [
    { label: '每分钟', value: '* * * * *' },
    { label: '每5分钟', value: '*/5 * * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天上午9点', value: '0 9 * * *' },
    { label: '每天中午12点', value: '0 12 * * *' },
    { label: '每天午夜0点', value: '0 0 * * *' },
    { label: '工作日上午9点', value: '0 9 * * 1-5' },
    { label: '每周一上午9点', value: '0 9 * * 1' },
    { label: '每周五下午5点', value: '0 17 * * 5' },
    { label: '每月1号凌晨2点', value: '0 2 1 * *' },
    { label: '每月15号', value: '0 0 15 * *' },
];

export function CronEditorDialog({ open, onOpenChange, value, onChange }: CronEditorDialogProps) {
    const [cron, setCron] = useState(value || '* * * * *');
    const parts = cron.split(' ');
    // Handle invalid parts slightly gracefully
    const minute = parts[0] || '*';
    const hour = parts[1] || '*';
    const day = parts[2] || '*';
    const month = parts[3] || '*';
    const week = parts[4] || '*';

    const updatePart = (index: number, val: string) => {
        const newParts = [...parts];
        while (newParts.length < 5) newParts.push('*');
        newParts[index] = val || '*';
        setCron(newParts.slice(0, 5).join(' '));
    };

    useEffect(() => {
        if (open) {
            setCron(value || '* * * * *');
        }
    }, [open, value]);

    // Parse cron to get explanation and next runs
    const { explanation, nextRuns } = useMemo(() => {
        let exp = '';
        let runs: string[] = [];
        try {
            exp = cronstrue.toString(cron, { locale: 'zh_CN' });
            const interval = CronExpressionParser.parse(cron);
            for (let i = 0; i < 5; i++) {
                runs.push(interval.next().toDate().toLocaleString('zh-CN', { hour12: false }));
            }
        } catch {
            exp = 'Cron 表达式格式无效';
            runs = [];
        }
        return { explanation: exp, nextRuns: runs };
    }, [cron]);

    const handleConfirm = () => {
        onChange(cron);
        onOpenChange(false);
    };

    const handleReset = () => {
        setCron('* * * * *');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Cron表达式配置</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                    {/* 快捷预设 */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">快捷预设</h4>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((p) => (
                                <Button
                                    key={p.label}
                                    variant={cron === p.value ? "default" : "outline"}
                                    size="sm"
                                    className="rounded-full px-4"
                                    onClick={() => setCron(p.value)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* 自定义配置 */}
                    <section className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">自定义配置</h4>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="flex items-center gap-3">
                                <Label className="text-gray-600 w-8">分钟</Label>
                                <Select value={minute} onValueChange={(v) => updatePart(0, v)}>
                                    <SelectTrigger className="flex-1 bg-white">
                                        <SelectValue placeholder="未设置 (*)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="*">未设置 (*)</SelectItem>
                                        <SelectItem value="*/5">每5分钟</SelectItem>
                                        <SelectItem value="*/10">每10分钟</SelectItem>
                                        <SelectItem value="*/15">每15分钟</SelectItem>
                                        <SelectItem value="*/30">每30分钟</SelectItem>
                                        {Array.from({ length: 60 }).map((_, i) => (
                                            <SelectItem key={i} value={String(i)}>{i} ({String(i).padStart(2, '0')})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                <Label className="text-gray-600 w-8">小时</Label>
                                <Select value={hour} onValueChange={(v) => updatePart(1, v)}>
                                    <SelectTrigger className="flex-1 bg-white">
                                        <SelectValue placeholder="未设置 (*)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="*">未设置 (*)</SelectItem>
                                        <SelectItem value="*/2">每2小时</SelectItem>
                                        <SelectItem value="*/6">每6小时</SelectItem>
                                        <SelectItem value="*/12">每12小时</SelectItem>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <SelectItem key={i} value={String(i)}>{i} ({String(i).padStart(2, '0')})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                <Label className="text-gray-600 w-8">日</Label>
                                <Select value={day} onValueChange={(v) => updatePart(2, v)}>
                                    <SelectTrigger className="flex-1 bg-white">
                                        <SelectValue placeholder="未设置 (*)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="*">未设置 (*)</SelectItem>
                                        {Array.from({ length: 31 }).map((_, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}号</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                <Label className="text-gray-600 w-8">月</Label>
                                <Select value={month} onValueChange={(v) => updatePart(3, v)}>
                                    <SelectTrigger className="flex-1 bg-white">
                                        <SelectValue placeholder="未设置 (*)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="*">未设置 (*)</SelectItem>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3">
                                <Label className="text-gray-600 w-8">星期</Label>
                                <Select value={week} onValueChange={(v) => updatePart(4, v)}>
                                    <SelectTrigger className="flex-1 bg-white">
                                        <SelectValue placeholder="未设置 (*)" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="*">未设置 (*)</SelectItem>
                                        <SelectItem value="1-5">工作日 (周一至周五)</SelectItem>
                                        <SelectItem value="6,0">周末 (周六和周日)</SelectItem>
                                        <SelectItem value="1">周一</SelectItem>
                                        <SelectItem value="2">周二</SelectItem>
                                        <SelectItem value="3">周三</SelectItem>
                                        <SelectItem value="4">周四</SelectItem>
                                        <SelectItem value="5">周五</SelectItem>
                                        <SelectItem value="6">周六</SelectItem>
                                        <SelectItem value="0">周日</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* 生成结果 */}
                    <section className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">生成结果</h4>
                        <div className="flex items-center gap-2">
                            <Label className="text-red-500 font-medium shrink-0">* Cron表达式 *</Label>
                            <div className="flex items-center">
                                <Input
                                    className="font-mono text-blue-500 w-[200px] rounded-r-none focus-visible:ring-0 border-r-0"
                                    value={cron}
                                    onChange={(e) => setCron(e.target.value)}
                                />
                                <Button variant="outline" className="rounded-l-none bg-gray-50 px-3 cursor-pointer" onClick={handleReset}>
                                    重置
                                </Button>
                            </div>
                        </div>

                        {/* 中文解析 */}
                        <div className="bg-sky-50 rounded-lg p-4 flex gap-3 border border-sky-100 text-sky-900 leading-relaxed text-sm">
                            <Info className="size-5 shrink-0 text-sky-500" />
                            <div>
                                <p className="font-medium mb-1">{explanation}</p>
                                <p className="text-xs text-sky-600/80">格式：分钟(0-59) 小时(0-23) 日(1-31) 月(1-12) 星期(0-6, 0=周日)</p>
                            </div>
                        </div>

                        {/* 最近运行时间 */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                            <div className="flex items-center gap-2 font-medium text-gray-700 text-sm">
                                <Clock className="size-4 text-green-500" />
                                <p>最近运行时间：</p>
                            </div>
                            <div className="space-y-2">
                                {nextRuns.length > 0 ? (
                                    nextRuns.map((time, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 rounded-md px-4 py-2 text-sm text-gray-600 font-mono shadow-sm">
                                            {time}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-md border border-red-100">
                                        无法计算未来时间，请检查表达式。
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleConfirm}>确定</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
