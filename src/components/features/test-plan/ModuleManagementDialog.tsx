/**
 * 模块管理对话框
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { testPlanManagementService } from '@/services';
import { toast } from 'sonner';

type OperationType = 'create' | 'edit' | 'move';

interface ModuleManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    operationType: OperationType;
    moduleId?: string;
    moduleName?: string;
    parentId?: string;
    projectId: string;
    moduleTree: any[];
    onSuccess?: () => void;
}

export function ModuleManagementDialog({
    open,
    onOpenChange,
    operationType,
    moduleId,
    moduleName = '',
    parentId,
    projectId,
    moduleTree,
    onSuccess
}: ModuleManagementDialogProps) {
    const [name, setName] = useState(moduleName);
    const [selectedParentId, setSelectedParentId] = useState(parentId || 'NONE');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setName(moduleName);
            setSelectedParentId(parentId || 'NONE');
        }
    }, [open, moduleName, parentId]);

    const getTitle = () => {
        switch (operationType) {
            case 'create': return '新建模块';
            case 'edit': return '编辑模块';
            case 'move': return '移动模块';
            default: return '模块管理';
        }
    };

    const flattenModuleTree = (nodes: any[], level = 0, excludeId?: string): any[] => {
        let result: any[] = [];
        nodes.forEach(node => {
            if (node.id !== excludeId) {
                result.push({ ...node, level });
                if (node.children && node.children.length > 0) {
                    result = result.concat(flattenModuleTree(node.children, level + 1, excludeId));
                }
            }
        });
        return result;
    };

    const flatModules = flattenModuleTree(moduleTree, 0, moduleId);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('请输入模块名称');
            return;
        }

        setLoading(true);
        const toastId = toast.loading(`正在${getTitle()}...`);

        try {
            switch (operationType) {
                case 'create':
                    await testPlanManagementService.addTestPlanModule({
                        projectId,
                        name: name.trim(),
                        parentId: selectedParentId === 'NONE' ? undefined : selectedParentId
                    });
                    break;
                case 'edit':
                    if (!moduleId) throw new Error('模块ID不能为空');
                    await testPlanManagementService.updateTestPlanModule({
                        id: moduleId,
                        name: name.trim()
                    });
                    break;
                case 'move':
                    if (!moduleId) throw new Error('模块ID不能为空');
                    await testPlanManagementService.moveTestPlanModule({
                        dragNodeIds: [moduleId],
                        dropNodeId: selectedParentId === 'NONE' ? undefined : selectedParentId,
                        dropPosition: 0
                    });
                    break;
            }

            toast.success(`${getTitle()}成功`, { id: toastId });
            onSuccess?.();
            onOpenChange(false);
            setName('');
            setSelectedParentId('NONE');
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
                    <DialogTitle className="text-base font-normal">{getTitle()}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {operationType !== 'move' && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                模块名称 <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="请输入模块名称"
                                className="h-9"
                                maxLength={50}
                            />
                            <div className="text-xs text-gray-400 text-right">
                                {name.length}/50
                            </div>
                        </div>
                    )}

                    {(operationType === 'create' || operationType === 'move') && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                父级模块
                            </Label>
                            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="选择父级模块（可选）" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="NONE">
                                        <span className="text-gray-500">无（根模块）</span>
                                    </SelectItem>
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
