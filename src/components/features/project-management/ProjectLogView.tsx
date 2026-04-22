import { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Calendar, User, ListFilter, ClipboardCheck, History } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { projectLogService } from '@/services/setting/log';
import type { LogItem } from '@/types/setting/log';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 15;

const OPERATE_TYPE_OPTIONS = [
    { value: 'all', label: '全部类型' },
    { value: 'ADD', label: '新增' },
    { value: 'DELETE', label: '删除' },
    { value: 'UPDATE', label: '更新' },
    { value: 'EXECUTE', label: '执行' },
    { value: 'IMPORT', label: '导入' },
    { value: 'EXPORT', label: '导出' },
];

function formatLogTime(ts?: number) {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function getOperationResultLabel(row: LogItem & Record<string, unknown>): string {
  const raw = row.status ?? row.result ?? row.operationStatus ?? row.state;
  if (raw === undefined || raw === null) return '无';
  const str = String(raw).trim();
  if (str === '') return '无';
  const s = str.toUpperCase();
  if (s === 'SUCCESS' || s === '1' || s === 'TRUE') return '成功';
  if (s === 'FAILED' || s === 'FAILURE' || s === '0' || s === 'FALSE') return '失败';
  if (raw === true) return '成功';
  if (raw === false) return '失败';
  if (str.length <= 1 && /^[.\-·\s]$/.test(str)) return '无';
  return str;
}

function getDefaultTimeRange(): [number, number] {
    const end = Date.now();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return [start.getTime(), end];
}

interface ProjectLogViewProps {
    projectId: string;
}

export function ProjectLogView({ projectId }: ProjectLogViewProps) {
    const [[startTime, endTime], setTimeRange] = useState<[number, number]>(getDefaultTimeRange);
    const [operUser, setOperUser] = useState('');
    const [type, setType] = useState('');
    const [content, setContent] = useState('');
    const [list, setList] = useState<LogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userOptions, setUserOptions] = useState<{ id: string; name: string; email?: string }[]>([]);
    const [userKeyword, setUserKeyword] = useState('');

    const loadList = useCallback(async (pageNum: number = page) => {
        setLoading(true);
        try {
            const res = await projectLogService.getProjectLogList({
                current: pageNum,
                pageSize: PAGE_SIZE,
                operUser: operUser || undefined,
                type: type || undefined,
                content: content.trim() || undefined,
                startTime,
                endTime: endTime + 1000,
                projectIds: [projectId],
                level: 'PROJECT',
            });
            setList(res.list ?? []);
            setTotal(res.total ?? 0);
        } catch (e) {
            toast.error('加载日志失败');
        } finally {
            setLoading(false);
        }
    }, [projectId, page, operUser, type, content, startTime, endTime]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const loadUserOptions = useCallback(async () => {
        if (!userKeyword) {
            setUserOptions([]);
            return;
        }
        try {
            const users = await projectLogService.getProjectLogUsers(projectId, userKeyword);
            setUserOptions(users.map((u) => ({ id: u.id, name: u.name, email: u.email })));
        } catch {
            setUserOptions([]);
        }
    }, [projectId, userKeyword]);

    useEffect(() => {
        const timer = setTimeout(() => loadUserOptions(), 300);
        return () => clearTimeout(timer);
    }, [loadUserOptions]);

    const handleReset = () => {
        setOperUser('');
        setType('');
        setContent('');
        setUserKeyword('');
        setTimeRange(getDefaultTimeRange());
        setPage(1);
        setTimeout(() => loadList(1), 0);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-10">
            {/* 顶部标题与简述 */}
            <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/50 shadow-sm">
                        <History className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">操作日志</h2>
                </div>
                <p className="text-sm text-gray-400 font-medium pl-10">审计与追踪本项目的每一项关键操作记录</p>
            </div>

            {/* 筛选面板 */}
            <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="py-4 px-6 border-b border-gray-50 bg-white">
                    <div className="flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-blue-500" />
                        <CardTitle className="text-sm font-bold text-gray-700">筛选条件</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-white/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* 操作用户 */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                <User className="w-3 h-3" /> 操作用户
                            </Label>
                            <div className="space-y-2">
                                <Select value={operUser || 'all'} onValueChange={(v) => setOperUser(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="h-10 bg-white border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all">
                                        <SelectValue placeholder="所有用户" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        <SelectItem value="all">所有用户</SelectItem>
                                        {userOptions.map((u) => (
                                            <SelectItem key={u.id} value={u.id} className="rounded-lg">{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                                    <Input
                                        placeholder="搜索用户姓名..."
                                        value={userKeyword}
                                        onChange={(e) => setUserKeyword(e.target.value)}
                                        className="h-8 pl-8 text-[11px] bg-gray-50/50 border-gray-100 rounded-lg focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 操作类型 */}
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                <ListFilter className="w-3 h-3" /> 操作类型
                            </Label>
                            <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
                                <SelectTrigger className="h-10 bg-white border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                    {OPERATE_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="rounded-lg">{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 操作时间 */}
                        <div className="space-y-2.5 md:col-span-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> 时间范围
                            </Label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <Input
                                        type="datetime-local"
                                        className="h-10 bg-white border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                                        value={new Date(startTime).toISOString().slice(0, 16)}
                                        onChange={(e) => setTimeRange([new Date(e.target.value).getTime(), endTime])}
                                    />
                                </div>
                                <span className="text-gray-300 font-bold text-xs">至</span>
                                <div className="flex-1">
                                    <Input
                                        type="datetime-local"
                                        className="h-10 bg-white border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all text-xs"
                                        value={new Date(endTime).toISOString().slice(0, 16)}
                                        onChange={(e) => setTimeRange([startTime, new Date(e.target.value).getTime()])}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 mt-4 border-t border-gray-50">
                        <Button
                            onClick={() => { setPage(1); loadList(1); }}
                            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex-1 md:flex-none"
                        >
                            <Search className="h-4 w-4 mr-2" /> 执行查询
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            className="h-10 px-6 text-gray-500 font-bold rounded-xl hover:bg-gray-100/50 flex-1 md:flex-none"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" /> 重置条件
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 数据表格面板 */}
            <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden bg-white">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b-gray-100 hover:bg-transparent">
                                <TableHead className="w-56 pl-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">操作时间</TableHead>
                                <TableHead className="w-40 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">操作用户</TableHead>
                                <TableHead className="w-28 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">类型</TableHead>
                                <TableHead className="py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">操作详情</TableHead>
                                <TableHead className="w-32 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">执行结果</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                            <span className="text-sm font-medium text-gray-400">正在获取最新日志...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : list.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 text-gray-300">
                                            <div className="p-4 rounded-full bg-gray-50">
                                                <ClipboardCheck className="w-10 h-10" />
                                            </div>
                                            <p className="text-sm font-medium">在指定范围内未找到相关操作记录</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                list.map((log) => (
                                    <TableRow key={log.id} className="group border-b-gray-50 transition-colors hover:bg-gray-50/50">
                                        <TableCell className="pl-8 py-4 text-xs font-medium text-gray-500 tabular-nums">
                                            {formatLogTime(log.createTime)}
                                        </TableCell>
                                        <TableCell className="py-4 font-bold text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-black ring-1 ring-blue-100">
                                                    {log.userName?.slice(0, 1).toUpperCase() || '?'}
                                                </div>
                                                {log.userName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight ring-1 ring-inset",
                                                log.type === 'ADD' ? "bg-emerald-50 text-emerald-700 ring-emerald-100" :
                                                    log.type === 'DELETE' ? "bg-rose-50 text-rose-700 ring-rose-100" :
                                                        log.type === 'UPDATE' ? "bg-amber-50 text-amber-700 ring-amber-100" :
                                                            "bg-blue-50 text-blue-700 ring-blue-100"
                                            )}>
                                                {log.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm font-medium text-gray-600 max-w-md truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                            {log.content || '-'}
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            {(() => {
                                                const resultLabel = getOperationResultLabel(log as LogItem & Record<string, unknown>);
                                                const isSuccess = resultLabel === '成功';
                                                const isFailed = resultLabel === '失败';
                                                return (
                                                    <span
                                                        title={resultLabel}
                                                        className={cn(
                                                            'inline-flex items-center justify-center min-w-[52px] px-3 py-1 rounded-full text-[11px] font-bold shadow-sm',
                                                            isSuccess && 'bg-emerald-500 text-white',
                                                            isFailed && 'bg-red-500 text-white',
                                                            resultLabel === '无' && 'bg-gray-200 text-gray-500',
                                                            !isSuccess && !isFailed && resultLabel !== '无' && 'bg-gray-200 text-gray-700'
                                                        )}
                                                    >
                                                        {resultLabel}
                                                    </span>
                                                );
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {total > PAGE_SIZE && (
                    <div className="flex justify-between items-center px-8 py-6 border-t border-gray-100 bg-gray-50/30">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            共 <span className="text-gray-900 tabular-nums">{total}</span> 条审计记录
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => { setPage(p => p - 1); loadList(page - 1); }}
                                className="rounded-xl border-gray-200 h-9 px-4 font-bold text-xs transition-all active:scale-95"
                            >
                                上一页
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page * PAGE_SIZE >= total}
                                onClick={() => { setPage(p => p + 1); loadList(page + 1); }}
                                className="rounded-xl border-gray-100 h-9 px-4 font-bold text-xs transition-all active:scale-95"
                            >
                                下一页
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
