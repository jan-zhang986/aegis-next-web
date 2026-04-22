/**
 * 批量操作对话框
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
import { Label } from '@/components/ui/label';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';
import { Copy, Move, Archive, Play, Edit } from 'lucide-react';

type OperationType = 'copy' | 'move' | 'archive' | 'execute' | 'edit';

interface BatchOperationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    operationType: OperationType;
    selectedPlanIds: string[];
    projectId: string;
    moduleTree: any[];
    onSuccess?: () => void;
}

export function BatchOperationDialog({
    open,
    onOpenChange,
    operationType,
    selectedPlanIds,
    projectId,
    moduleTree,
    onSuccess
}: BatchOperationDialogProps) {
    const [targetModuleId, setTargetModuleId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const getTitle = () => {
        switch (operationType) {
            case 'copy': return '批量复制';
            case 'move': return '批量移动';
            case 'archive': return '批量归档';
            case 'execute': return '批量执行';
            case 'edit': return '批量编辑';
            default: return '批量操作';
        }
    };

    const getIcon = () => {
        switch (operationType) {
            case 'copy': return <Copy className="w-4 h-4" />;
            case 'move': return <Move className="w-4 h-4" />;
            case 'archive': return <Archive className="w-4 h-4" />;
            case 'execute': return <Play className="w-4 h-4" />;
            case 'edit': return <Edit className="w-4 h-4" />;
            default: return null;
        }
    };

    const flattenModuleTree = (nodes: any[], level = 0): any[] => {
        let result: any[] = [];
        nodes.forEach(node => {
            result.push({ ...node, level });
            if (node.children && node.children.length > 0) {
                result = result.concat(flattenModuleTree(node.children, level + 1));
            }
        });
        return result;
    };

    const flatModules = flattenModuleTree(moduleTree);

    const handleSubmit = async () => {
        if ((operationType === 'copy' || operationType === 'move') && !targetModuleId) {
            toast.error('请选择目标模块');
            return;
        }

        setLoading(true);
        const toastId = toast.loading(`正在${getTitle()}...`);

        try {
            switch (operationType) {
                case 'copy':
                    await testPlanManagementService.batchCopyPlan({
                        selectIds: selectedPlanIds,
                        projectId,
                        moduleIds: [targetModuleId],
                        moduleId: targetModuleId,
                        targetId: targetModuleId,
                        moveType: 'MODULE',
                    });
                    break;
                case 'move':
                    await testPlanManagementService.batchMovePlan({
                        selectIds: selectedPlanIds,
                        projectId,
                        moduleIds: [targetModuleId],
                        moduleId: targetModuleId,
                        targetId: targetModuleId,
                        moveType: 'MODULE',
                    });
                    break;
                case 'archive':
                    await testPlanManagementService.batchArchivedPlan({
                        selectIds: selectedPlanIds,
                        projectId
                    });
                    break;
                case 'execute':
                    await testPlanManagementService.batchExecutePlan({
                        selectIds: selectedPlanIds,
                        projectId,
                        runMode: 'SERIAL',
                        executionSource: 'MANUAL'
                    });
                    break;
                case 'edit':
                    // 批量编辑需要更多参数，这里先预留
                    toast.info('批量编辑功能开发中');
                    break;
            }

            toast.success(`${getTitle()}成功`, { id: toastId });
            onSuccess?.();
            onOpenChange(false);
            setTargetModuleId('');
        } catch (error) {
            console.error(error);
            toast.error(`${getTitle()}失败`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-base font-normal flex items-center gap-2">
                        {getIcon()}
                        {getTitle()}
                        <span className="text-sm text-gray-400 ml-2">
                            已选择 {selectedPlanIds.length} 个测试计划
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {(operationType === 'copy' || operationType === 'move') && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                目标模块 <span className="text-red-500">*</span>
                            </Label>
                            <Select value={targetModuleId} onValueChange={setTargetModuleId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="请选择目标模块" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {flatModules.map((module) => (
                                        <SelectItem key={module.id} value={module.id}>
                                            <div className="flex items-center gap-2">
                                                <span style={{ marginLeft: `${module.level * 16}px` }}>
                                                    {module.name}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {operationType === 'archive' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                            <p className="text-sm text-amber-800">
                                归档后的测试计划将移至归档列表，不会显示在当前列表中。
                            </p>
                        </div>
                    )}

                    {operationType === 'execute' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                                将按顺序执行选中的 {selectedPlanIds.length} 个测试计划。
                            </p>
                        </div>
                    )}
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
                        {loading ? '处理中...' : '确定'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
