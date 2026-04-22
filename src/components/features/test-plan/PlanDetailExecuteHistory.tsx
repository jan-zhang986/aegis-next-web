/**
 * 测试计划详情 - 执行历史
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, Filter, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';
import { UnifiedPagination } from '@/components/ui/unified-pagination';

interface PlanDetailExecuteHistoryProps {
    planId: string;
    projectId: string;
}

export function PlanDetailExecuteHistory({ planId, projectId }: PlanDetailExecuteHistoryProps) {
    const [loading, setLoading] = useState(false);
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 获取执行历史列表
    const fetchHistoryList = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                testPlanId: planId,
                projectId,
                current: currentPage,
                pageSize,
                keyword: searchKeyword,
            };
            const res = await testPlanManagementService.getPlanDetailExecuteHistory(params);
            setHistoryList(res.list || []);
            setTotal(res.total || 0);
        } catch (error) {
            console.error('获取执行历史失败:', error);
            toast.error('获取执行历史失败');
        } finally {
            setLoading(false);
        }
    }, [planId, projectId, currentPage, pageSize, searchKeyword]);

    useEffect(() => {
        fetchHistoryList();
    }, [fetchHistoryList]);

    const getResultIcon = (result: string) => {
        switch (result) {
            case 'SUCCESS':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'ERROR':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'PENDING':
                return <Clock className="w-4 h-4 text-blue-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getResultColor = (result: string) => {
        switch (result) {
            case 'SUCCESS': return 'text-green-600 bg-green-50';
            case 'ERROR': return 'text-red-600 bg-red-50';
            case 'PENDING': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getResultText = (result: string) => {
        switch (result) {
            case 'SUCCESS': return '成功';
            case 'ERROR': return '失败';
            case 'PENDING': return '执行中';
            default: return '未知';
        }
    };

    return (
        <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white w-full">
            <div className="flex flex-col h-full overflow-hidden bg-white">
                <div className="p-2.5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 flex-1 max-w-[360px] pl-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <Input
                                placeholder="搜索执行记录"
                                className="h-7 pl-8 text-[11px] border-gray-200 bg-gray-50/30 focus:bg-white transition-all rounded-sm"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchHistoryList()}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-[11px] border-gray-200 text-gray-600 gap-1.5">
                            <Filter className="w-3.5 h-3.5" /> 筛选
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={fetchHistoryList}>
                            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <Table className="text-sm">
                        <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-100">
                            <TableRow className="hover:bg-transparent border-none h-9">
                                <TableHead className="w-[40px] px-2 text-center">
                                    <Checkbox className="rounded-[2px] opacity-60" />
                                </TableHead>
                                <TableHead className="w-[100px] font-medium text-gray-500 text-xs">执行ID</TableHead>
                                <TableHead className="w-[120px] font-medium text-gray-500 text-xs">执行模式</TableHead>
                                <TableHead className="w-[100px] font-medium text-gray-500 text-xs">执行结果</TableHead>
                                <TableHead className="w-[120px] font-medium text-gray-500 text-xs">执行人</TableHead>
                                <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">用例总数</TableHead>
                                <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">成功数</TableHead>
                                <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">失败数</TableHead>
                                <TableHead className="w-[140px] font-medium text-gray-500 text-xs text-center">开始时间</TableHead>
                                <TableHead className="w-[140px] font-medium text-gray-500 text-xs text-center">结束时间</TableHead>
                                <TableHead className="w-[100px] font-medium text-gray-500 text-xs text-center">耗时</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-64 text-center">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                                    </TableCell>
                                </TableRow>
                            ) : historyList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-64 text-center">
                                        <div className="text-gray-400 flex flex-col items-center gap-2">
                                            <Clock className="w-10 h-10 opacity-20" />
                                            <span>暂无执行历史</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                historyList.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-[#f2f3f5]/50 group transition-colors border-b border-gray-50 h-11">
                                        <TableCell className="px-2 text-center">
                                            <Checkbox className="rounded-[2px] border-gray-300" />
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-blue-600 font-normal cursor-pointer hover:underline decoration-blue-600/30 text-xs">
                                                {item.id?.slice(0, 8) || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-xs">
                                            {item.runMode === 'SERIAL' ? '串行' : item.runMode === 'PARALLEL' ? '并行' : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {getResultIcon(item.result)}
                                                <Badge className={`${getResultColor(item.result)} border-0 text-xs font-normal`}>
                                                    {getResultText(item.result)}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-xs">
                                            {item.executeUser || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-xs text-center">
                                            {item.caseTotal || 0}
                                        </TableCell>
                                        <TableCell className="text-green-600 text-xs text-center font-medium">
                                            {item.successCount || 0}
                                        </TableCell>
                                        <TableCell className="text-red-600 text-xs text-center font-medium">
                                            {item.errorCount || 0}
                                        </TableCell>
                                        <TableCell className="text-gray-500 tabular-nums font-mono text-xs">
                                            {item.startTime || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-500 tabular-nums font-mono text-xs">
                                            {item.endTime || '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-xs">
                                            {item.duration ? `${item.duration}s` : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <UnifiedPagination
                    total={total}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    unitLabel="条记录"
                    className="p-3 border-t border-gray-100 bg-gray-50/30"
                />
            </div>
        </div>
    );
}
