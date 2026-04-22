/**
 * 关联缺陷对话框
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Search, RefreshCw } from 'lucide-react';
import { testPlanManagementService, bugManagementService } from '@/services';
import { getPriorityLabel, getPriorityColor } from '@/services/bug-management/constants/bug-priority';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssociateBugDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planId: string;
    projectId: string;
    /** 功能用例 id，从用例详情进入时传入 */
    caseId?: string;
    /** 测试计划关联用例 id（test_plan_functional_case.id），从用例详情进入时传入 */
    testPlanCaseId?: string;
    /** 批量模式：计划用例 id 列表，传入时使用批量关联接口 */
    selectCaseIds?: string[];
    onSuccess?: () => void;
}

export function AssociateBugDialog({
    open,
    onOpenChange,
    planId,
    projectId,
    caseId,
    testPlanCaseId,
    selectCaseIds,
    onSuccess
}: AssociateBugDialogProps) {
    const [loading, setLoading] = useState(false);
    const [bugList, setBugList] = useState<any[]>([]);
    const [selectedBugIds, setSelectedBugIds] = useState<string[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    /** 处理人 ID -> 名称，用于列表展示 */
    const [handleUserNameMap, setHandleUserNameMap] = useState<Record<string, string>>({});

    /** 是否批量关联模式：selectCaseIds 有值则认为是批量 */
    const isBatch = Array.isArray(selectCaseIds) && selectCaseIds.length > 0;

    const effectiveProjectId = projectId || (typeof localStorage !== 'undefined' ? localStorage.getItem('currentProjectId') : null) || '';

    useEffect(() => {
        if (!open || !effectiveProjectId) return;
        bugManagementService.getCustomOptionHeader(effectiveProjectId).then((res: any) => {
            const raw = res?.handleUserOption || [];
            const map: Record<string, string> = {};
            raw.forEach((o: { value?: string; text?: string; id?: string; name?: string }) => {
                const id = o.value ?? o.id;
                const name = o.text ?? o.name;
                if (id != null && name != null) map[id] = name;
            });
            setHandleUserNameMap(map);
        }).catch(() => setHandleUserNameMap({}));
    }, [open, effectiveProjectId]);

    // 弹窗展示「可关联」的缺陷：用项目缺陷分页接口，这样能看到已创建但未关联的缺陷；已关联列表用 getPlanDetailBugPage
    const fetchBugList = useCallback(async () => {
        if (!effectiveProjectId) {
            toast.error('缺少项目信息，无法加载可关联缺陷列表');
            return;
        }
        setLoading(true);
        try {
            const res = await bugManagementService.getBugList({
                projectId: effectiveProjectId,
                current: currentPage,
                pageSize,
                keyword: searchKeyword,
            });
            setBugList(res.list || []);
            setTotal(res.total || 0);
        } catch (error) {
            console.error('获取缺陷列表失败:', error);
            toast.error('获取缺陷列表失败');
        } finally {
            setLoading(false);
        }
    }, [effectiveProjectId, currentPage, pageSize, searchKeyword]);

    useEffect(() => {
        if (open) {
            fetchBugList();
        }
    }, [open, fetchBugList]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedBugIds(bugList.map(bug => bug.id));
        } else {
            setSelectedBugIds([]);
        }
    };

    const handleSelectBug = (bugId: string, checked: boolean) => {
        if (checked) {
            setSelectedBugIds([...selectedBugIds, bugId]);
        } else {
            setSelectedBugIds(selectedBugIds.filter(id => id !== bugId));
        }
    };

    /** 优先级取值：severity / priority / customFields.severity */
    const getSeverity = (bug: any) =>
        bug?.severity ?? bug?.priority ?? bug?.customFields?.find((f: any) => f.id === 'severity')?.value;

    const handleSubmit = async () => {
        if (selectedBugIds.length === 0) {
            toast.error('请选择要关联的缺陷');
            return;
        }

        const toastId = toast.loading(isBatch
            ? `正在将 ${selectedBugIds.length} 个缺陷关联到 ${selectCaseIds!.length} 个用例...`
            : `正在关联 ${selectedBugIds.length} 个缺陷...`);
        try {
            if (isBatch && selectCaseIds && selectCaseIds.length > 0) {
                // 批量模式：直接调用批量接口
                await testPlanManagementService.testPlanBatchAssociateBug({
                    testPlanId: planId,
                    projectId: effectiveProjectId,
                    testPlanCaseIds: selectCaseIds,
                    bugIds: selectedBugIds,
                } as any);
            } else {
                // 单个用例模式：保证 caseId / testPlanCaseId 有值
                let caseIdToUse = caseId;
                let testPlanCaseIdToUse = testPlanCaseId;

                if (!caseIdToUse || !testPlanCaseIdToUse) {
                    const planCases = await testPlanManagementService.getPlanDetailFeatureCaseList({
                        testPlanId: planId,
                        projectId: effectiveProjectId,
                        current: 1,
                        pageSize: 10,
                    });
                    const first = planCases?.list?.[0];
                    if (!first) {
                        toast.error('计划下暂无功能用例，请先关联用例后再关联缺陷', { id: toastId });
                        return;
                    }
                    caseIdToUse = caseIdToUse || first.caseId;
                    testPlanCaseIdToUse = testPlanCaseIdToUse || first.id;
                }

                await testPlanManagementService.testPlanAssociateBug({
                    testPlanId: planId,
                    projectId: effectiveProjectId,
                    caseId: caseIdToUse!,
                    testPlanCaseId: testPlanCaseIdToUse!,
                    selectIds: selectedBugIds,
                });
            }
            toast.success('关联成功', { id: toastId });
            onOpenChange(false);
            setSelectedBugIds([]);
            // 延迟刷新列表，确保后端已提交且查询能读到新关联
            setTimeout(() => onSuccess?.(), 300);
        } catch (error) {
            console.error(error);
            toast.error('关联失败', { id: toastId });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[90vw] sm:w-auto sm:max-w-[800px] max-h-[80vh] p-0 flex flex-col"
                aria-describedby={undefined}
            >
                <DialogHeader className="px-6 py-4 border-b border-gray-100">
                    <DialogTitle className="text-base font-normal">
                        关联缺陷
                        {isBatch && <span className="text-gray-400 font-normal ml-2">已选 {selectCaseIds!.length} 个用例</span>}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-[360px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <Input
                                placeholder="通过 ID 或名称搜索"
                                className="h-8 pl-8 text-xs"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchBugList()}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={fetchBugList}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* 固定列表区域高度，数据多时内部滚动，避免弹窗整体被撑得过高 */}
                <ScrollArea className="h-[360px]">
                    <Table className="text-xs">
                        <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none h-9">
                                <TableHead className="w-[40px] px-2 text-center">
                                    <Checkbox
                                        className="rounded-[2px]"
                                        checked={selectedBugIds.length === bugList.length && bugList.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="w-[100px] font-normal text-gray-500 text-xs">ID</TableHead>
                                <TableHead className="min-w-[200px] font-normal text-gray-500 text-xs">缺陷名称</TableHead>
                                <TableHead className="w-[100px] font-normal text-gray-500 text-xs">优先级</TableHead>
                                <TableHead className="w-[100px] font-normal text-gray-500 text-xs">状态</TableHead>
                                <TableHead className="w-[120px] font-normal text-gray-500 text-xs">处理人</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400" />
                                    </TableCell>
                                </TableRow>
                            ) : bugList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="text-gray-400 text-sm">暂无可关联的缺陷</div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bugList.map((bug) => (
                                    <TableRow key={bug.id} className="hover:bg-blue-50/20 border-b border-gray-50 h-10">
                                        <TableCell className="px-2 text-center">
                                            <Checkbox
                                                className="rounded-[2px]"
                                                checked={selectedBugIds.includes(bug.id)}
                                                onCheckedChange={(checked) => handleSelectBug(bug.id, checked as boolean)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-blue-600 font-mono text-xs">{bug.num}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-gray-700 truncate max-w-[280px]" title={bug.name || bug.title}>
                                                {bug.name || bug.title || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getPriorityColor(getSeverity(bug))} border-0 text-xs font-normal`}>
                                                {getPriorityLabel(getSeverity(bug))}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-gray-600 text-xs">{bug.statusName || bug.status || '-'}</span>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-xs">
                                            {bug.handleUserName || (bug.handleUser && handleUserNameMap[bug.handleUser]) || bug.handleUser || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                    <div className="text-center sm:text-left">
                        已选择 <span className="text-blue-600 font-medium">{selectedBugIds.length}</span> 个缺陷
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                        >
                            上一页
                        </Button>
                        <span className="px-1 tabular-nums">
                            第 {currentPage} / {Math.ceil(total / pageSize) || 1} 页
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            disabled={currentPage >= Math.ceil(total / pageSize)}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                        >
                            下一页
                        </Button>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-gray-100">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        取消
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={selectedBugIds.length === 0}
                    >
                        确定关联 ({selectedBugIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
