import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { JobItem } from '@/services/dial-management';
import { CalendarClock, FileJson, Info, Settings2, UserCog, Webhook, Clock } from 'lucide-react';
import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue';
import 'cronstrue/locales/zh_CN';
import { useMemo } from 'react';

export interface TaskDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: JobItem | null;
}

export function TaskDetailDrawer({ open, onOpenChange, row }: TaskDetailDrawerProps) {
    if (!row) return null;

    const modeName = row.jobFeatures?.model === 'script' ? '脚本模式' : 'curl模式';
    const statusName = row.status === 'pause' ? '已暂停' : '执行中';
    const isPause = row.status === 'pause';
    const cron = row.jobFeatures?.cron || '';

    const { explanation, nextRuns } = useMemo(() => {
        if (!cron) return { explanation: '', nextRuns: [] };
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[580px] sm:max-w-none p-0 flex flex-col hidden-close">
                <SheetHeader className="px-6 py-5 border-b bg-gray-50/50 relative">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 pr-6">
                            <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                                <span className="truncate max-w-[320px]" title={row.jobName}>{row.jobName}</span>
                                <Badge variant={isPause ? "secondary" : "default"} className={isPause ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}>
                                    {statusName}
                                </Badge>
                            </SheetTitle>
                            <SheetDescription className="text-sm">
                                ID: <span className="font-mono text-gray-600">{row.id}</span>
                            </SheetDescription>
                        </div>
                        <SheetClose className="absolute top-5 right-5" />
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8 pb-12">

                        {/* 基础信息（横向布局，包含任务参数与额外配置） */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-800 font-medium">
                                <Info className="w-4 h-4 text-blue-500" />
                                <h3>基础信息</h3>
                            </div>
                            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm space-y-3">
                                <div className="flex flex-wrap items-start gap-x-8 gap-y-2 text-sm">
                                    <div className="space-y-0.5">
                                        <span className="text-xs text-gray-500">执行器</span>
                                        <p className="font-medium">{row.executorsName || '-'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-xs text-gray-500">任务模式</span>
                                        <div className="text-sm font-medium pt-0.5">
                                            <Badge variant="outline" className="font-normal px-2 py-0.5">
                                                {modeName}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500">任务参数</span>
                                    <p className="text-sm font-mono break-all bg-gray-50 p-2 rounded-md border border-gray-100">
                                        {row.jobFeatures?.funcArgs || '-'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500">额外参数 (JSON)</span>
                                    {row.jobFeatures?.funcKwargs ? (
                                        <pre className="text-xs font-mono bg-gray-50 p-2 rounded-md border border-gray-100 mt-1 overflow-x-auto">
                                            {JSON.stringify(row.jobFeatures.funcKwargs, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">暂无额外功能参数</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 调度配置 */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-800 font-medium">
                                <Settings2 className="w-4 h-4 text-purple-500" />
                                <h3>调度配置</h3>
                            </div>
                            <div className="rounded-lg border bg-white p-4 space-y-4 shadow-sm">
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <CalendarClock className="w-3 h-3" /> Cron 表达式
                                    </span>
                                    <div className="bg-gray-50 font-mono text-sm p-2 rounded-md border border-gray-100 mt-1">
                                        {cron || '-'}
                                    </div>
                                </div>

                                {cron && explanation && (
                                    <div className="bg-sky-50 rounded-lg p-3 flex gap-3 border border-sky-100 text-sky-900 leading-relaxed text-sm">
                                        <Info className="size-5 shrink-0 text-sky-500" />
                                        <div>
                                            <p className="font-medium mb-1">{explanation}</p>
                                            <p className="text-xs text-sky-600/80">格式：分钟(0-59) 小时(0-23) 日(1-31) 月(1-12) 星期(0-6, 0=周日)</p>
                                        </div>
                                    </div>
                                )}

                                {cron && (
                                    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-3">
                                        <div className="flex items-center gap-2 font-medium text-gray-700 text-sm">
                                            <Clock className="size-4 text-green-500" />
                                            <p>最近运行时间：</p>
                                        </div>
                                        <div className="space-y-2">
                                            {nextRuns.length > 0 ? (
                                                nextRuns.map((time, idx) => (
                                                    <div key={idx} className="bg-white border border-gray-100 rounded-md px-3 py-1.5 text-sm text-gray-600 font-mono shadow-sm">
                                                        {time}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-sm text-red-500 bg-red-50 px-3 py-1.5 rounded-md border border-red-100">
                                                    无法计算未来时间，请检查表达式。
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 告警与通知 */}
                        <section className="space-y-3 pb-6">
                            <div className="flex items-center gap-2 text-gray-800 font-medium">
                                <UserCog className="w-4 h-4 text-green-500" />
                                <h3>告警与通知</h3>
                            </div>
                            <div className="rounded-lg border bg-white p-4 space-y-4 shadow-sm">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <div className="space-y-1 col-span-2">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Webhook className="w-3 h-3" /> openId (WebHook)
                                            </span>
                                            <p className="text-sm break-all">{row.openId || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
