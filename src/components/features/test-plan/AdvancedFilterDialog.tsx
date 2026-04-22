/**
 * 高级筛选对话框
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

export interface FilterValues {
    status?: string[];
    executeResult?: string[];
    createUser?: string[];
    startDate?: Date;
    endDate?: Date;
}

interface AdvancedFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApply: (filters: FilterValues) => void;
    initialFilters?: FilterValues;
    userList?: Array<{ id: string; name: string }>;
    /** 当前视图名称，与老前端一致显示在标题 */
    viewName?: string;
    /** 筛选 | 新建视图（新建时显示视图名输入，底部为保存） */
    mode?: 'filter' | 'newView';
    /** 新建视图时保存回调，传入视图名 + 筛选条件 */
    onSaveNewView?: (payload: { viewName: string } & FilterValues) => void | Promise<void>;
}

export function AdvancedFilterDialog({
    open,
    onOpenChange,
    onApply,
    initialFilters = {},
    userList = [],
    viewName = '全部数据',
    mode = 'filter',
    onSaveNewView,
}: AdvancedFilterDialogProps) {
    const [filters, setFilters] = useState<FilterValues>(initialFilters);
    const [bannerVisible, setBannerVisible] = useState(true);
    const [newViewName, setNewViewName] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setFilters(initialFilters);
            setBannerVisible(true);
            if (mode === 'newView') {
                setNewViewName('未命名视图001');
            }
        }
    }, [open, initialFilters, mode]);

    const statusOptions = [
        { value: 'PREPARED', label: '未开始' },
        { value: 'UNDERWAY', label: '进行中' },
        { value: 'COMPLETED', label: '已完成' },
        { value: 'ARCHIVED', label: '已归档' },
    ];

    const executeResultOptions = [
        { value: 'PENDING', label: '未执行' },
        { value: 'PASSED', label: '通过' },
        { value: 'FAILED', label: '失败' },
        { value: 'BLOCKED', label: '阻塞' },
        { value: 'SKIPPED', label: '跳过' },
    ];

    const handleStatusChange = (value: string, checked: boolean) => {
        const current = filters.status || [];
        if (checked) {
            setFilters({ ...filters, status: [...current, value] });
        } else {
            setFilters({ ...filters, status: current.filter(v => v !== value) });
        }
    };

    const handleExecuteResultChange = (value: string, checked: boolean) => {
        const current = filters.executeResult || [];
        if (checked) {
            setFilters({ ...filters, executeResult: [...current, value] });
        } else {
            setFilters({ ...filters, executeResult: current.filter(v => v !== value) });
        }
    };

    const handleUserChange = (value: string, checked: boolean) => {
        const current = filters.createUser || [];
        if (checked) {
            setFilters({ ...filters, createUser: [...current, value] });
        } else {
            setFilters({ ...filters, createUser: current.filter(v => v !== value) });
        }
    };

    const handleReset = () => {
        setFilters({});
    };

    const handleApply = () => {
        onApply(filters);
        onOpenChange(false);
    };

    const hasFilters = Object.keys(filters).some(key => {
        const value = filters[key as keyof FilterValues];
        return Array.isArray(value) ? value.length > 0 : value !== undefined;
    });

    const handleSaveNewView = async () => {
        const name = newViewName?.trim() || '未命名视图001';
        if (!name.trim()) return;
        setSaveLoading(true);
        try {
            await onSaveNewView?.({ viewName: name.trim(), ...filters });
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto px-6 py-4" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-base font-normal">{viewName}</DialogTitle>
                </DialogHeader>

                {mode === 'newView' && (
                    <div className="space-y-2 mb-4">
                        <Label className="text-sm font-medium text-gray-700">视图名称</Label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="未命名视图001"
                        />
                    </div>
                )}

                {bannerVisible && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-start gap-2 text-sm text-blue-800 mb-4 relative">
                        <span className="inline-flex shrink-0 mt-0.5">ℹ</span>
                        <span className="flex-1">筛选模式，模块过滤仅可在当前过滤器中操作</span>
                        <button type="button" onClick={() => setBannerVisible(false)} className="shrink-0 p-0.5 rounded hover:bg-blue-100/50 text-blue-600" aria-label="关闭">
                            ×
                        </button>
                    </div>
                )}

                <div className="space-y-6 py-4">
                    {/* 状态筛选 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">状态</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {statusOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`status-${option.value}`}
                                        checked={filters.status?.includes(option.value)}
                                        onCheckedChange={(checked) => handleStatusChange(option.value, checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`status-${option.value}`}
                                        className="text-sm text-gray-700 cursor-pointer"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 执行结果筛选 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">执行结果</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {executeResultOptions.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`result-${option.value}`}
                                        checked={filters.executeResult?.includes(option.value)}
                                        onCheckedChange={(checked) => handleExecuteResultChange(option.value, checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`result-${option.value}`}
                                        className="text-sm text-gray-700 cursor-pointer"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 创建人筛选 */}
                    {userList.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">创建人</Label>
                            <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto border border-gray-200 rounded-md p-3">
                                {userList.map((user) => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`user-${user.id}`}
                                            checked={filters.createUser?.includes(user.id)}
                                            onCheckedChange={(checked) => handleUserChange(user.id, checked as boolean)}
                                        />
                                        <label
                                            htmlFor={`user-${user.id}`}
                                            className="text-sm text-gray-700 cursor-pointer truncate"
                                        >
                                            {user.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 时间范围筛选 */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">创建时间</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">开始日期</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal h-9"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.startDate ? (
                                                format(filters.startDate, 'PPP', { locale: zhCN })
                                            ) : (
                                                <span className="text-gray-400">选择日期</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.startDate}
                                            onSelect={(date) => setFilters({ ...filters, startDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">结束日期</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal h-9"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.endDate ? (
                                                format(filters.endDate, 'PPP', { locale: zhCN })
                                            ) : (
                                                <span className="text-gray-400">选择日期</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.endDate}
                                            onSelect={(date) => setFilters({ ...filters, endDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 justify-start mt-6 mb-1">
                    {mode === 'newView' ? (
                        <>
                            <Button
                                className="bg-[#165DFF] hover:bg-[#165DFF]/90"
                                onClick={handleSaveNewView}
                                disabled={saveLoading}
                            >
                                {saveLoading ? '保存中…' : '保存'}
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-gray-700 hover:text-gray-900"
                                onClick={() => onOpenChange(false)}
                            >
                                取消
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                className="bg-[#165DFF] hover:bg-[#165DFF]/90"
                                onClick={handleApply}
                            >
                                筛选
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={!hasFilters}
                            >
                                重置
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-gray-700 hover:text-gray-900"
                                onClick={() => onOpenChange(false)}
                            >
                                另存为视图
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
