/**
 * 批量执行用例对话框
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';

interface BatchExecuteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planId: string;
    selectedCaseIds: string[];
    onSuccess?: () => void;
}

export function BatchExecuteDialog({
    open,
    onOpenChange,
    planId,
    selectedCaseIds,
    onSuccess
}: BatchExecuteDialogProps) {
    // 与原项目 spotter-metersphere 保持一致：默认执行结果为 SUCCESS，后端字段为 lastExecResult
    const [executeResult, setExecuteResult] = useState<string>('SUCCESS');
    const [executeRemark, setExecuteRemark] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!executeResult) {
            toast.error('请选择执行结果');
            return;
        }

        if (selectedCaseIds.length === 0) {
            toast.error('请选择要执行的用例');
            return;
        }

        setLoading(true);
        const toastId = toast.loading(`正在批量执行 ${selectedCaseIds.length} 个用例...`);
        try {
            await testPlanManagementService.batchRunCase({
                testPlanId: planId,
                lastExecResult: executeResult,
                content: executeRemark,
                selectIds: selectedCaseIds,
                selectAll: false,
                excludeIds: []
            });

            toast.success('批量执行成功', { id: toastId });
            onSuccess?.();
            onOpenChange(false);
            setExecuteResult('SUCCESS');
            setExecuteRemark('');
        } catch (error) {
            console.error(error);
            toast.error('批量执行失败', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-base font-normal">
                        批量执行用例
                        <span className="text-sm text-gray-400 ml-2">
                            已选择 {selectedCaseIds.length} 个用例
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            执行结果 <span className="text-red-500">*</span>
                        </label>
                        <Select value={executeResult} onValueChange={setExecuteResult}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="请选择执行结果" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SUCCESS">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>通过</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="ERROR">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span>失败</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="FAKE_ERROR">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                        <span>造假失败</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="BLOCKED">
                                    <div className="flex items-center gap-2">
                                        <MinusCircle className="w-4 h-4 text-orange-500" />
                                        <span>阻塞</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="SKIPPED">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-gray-400" />
                                        <span>跳过</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">执行备注</label>
                        <Textarea
                            placeholder="请输入执行备注（选填）"
                            className="min-h-[100px] resize-none text-sm"
                            value={executeRemark}
                            onChange={(e) => setExecuteRemark(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        取消
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? '执行中...' : '确定'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
