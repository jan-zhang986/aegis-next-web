/**
 * 测试计划通过率进度条组件
 * 显示执行进度和各状态用例数量
 */

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PassRateCountDetail } from '@/types/testPlan';

interface StatusProgressProps {
    statusDetail?: PassRateCountDetail | null;
    height?: string;
    showTooltip?: boolean;
    className?: string;
}

// 默认统计数据
const defaultDetail: PassRateCountDetail = {
    id: '',
    passThreshold: 0,
    passRate: 0,
    executeRate: 0,
    successCount: 0,
    errorCount: 0,
    fakeErrorCount: 0,
    blockCount: 0,
    pendingCount: 0,
    caseTotal: 0,
    functionalCaseCount: 0,
    apiCaseCount: 0,
    apiScenarioCount: 0,
    status: 'PREPARED',
    pass: false,
};

// MeterSphere 标准颜色
const COLORS = {
    SUCCESS: '#00b42a',    // 成功（绿）
    FAILURE: '#f53f3f',    // 失败（红）
    BLOCK: '#722ed1',      // 阻塞（紫）
    FAKE_ERROR: '#ff7d00', // 误报（橙）
    PENDING: '#f2f3f5',    // 未执行（灰白）
};

/** 测试计划通过率悬浮提示内容（可单独用于包裹整格触发） */
export function StatusProgressTooltipContent({ statusDetail }: { statusDetail?: PassRateCountDetail | null }) {
    const detail = { ...defaultDetail, ...statusDetail };
    const { caseTotal, successCount, errorCount, fakeErrorCount, blockCount, pendingCount } = detail;
    const executeRate = Number(detail.executeRate || 0);
    return (
        <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
                <span className="text-gray-500">执行进度</span>
                <span className="font-semibold text-gray-900 tabular-nums">{executeRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500">通过阈值</span>
                <span className="font-semibold text-gray-900 tabular-nums">{detail.passThreshold || 0}%</span>
            </div>
            <div className="border-t border-gray-100 my-1" />
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS.SUCCESS }} />
                    <span className="text-gray-600">成功</span>
                    <span className="ml-auto font-medium">{successCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS.FAILURE }} />
                    <span className="text-gray-600">失败</span>
                    <span className="ml-auto font-medium">{errorCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS.BLOCK }} />
                    <span className="text-gray-600">阻塞</span>
                    <span className="ml-auto font-medium">{blockCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS.FAKE_ERROR }} />
                    <span className="text-gray-600">误报</span>
                    <span className="ml-auto font-medium">{fakeErrorCount}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS.PENDING }} />
                    <span className="text-gray-600">未执行</span>
                    <span className="ml-auto font-medium">{pendingCount}</span>
                </div>
            </div>
        </div>
    );
}

export function StatusProgress({
    statusDetail,
    height = '8px',
    showTooltip = true,
    className = ''
}: StatusProgressProps) {
    const detail = { ...defaultDetail, ...statusDetail };
    const { caseTotal, successCount, errorCount, fakeErrorCount, blockCount, pendingCount, passRate } = detail;

    // 计算各状态百分比（比例图：绿/红/紫/橙/灰）
    const getPercentages = () => {
        if (caseTotal <= 0) {
            // 仅有通过率时展示简化比例：通过率% 绿 + 剩余 灰
            const rate = Number(passRate ?? 0);
            if (rate > 0 && rate <= 100) {
                return [
                    { percentage: rate, color: COLORS.SUCCESS, label: '通过' },
                    { percentage: 100 - rate, color: COLORS.PENDING, label: '未执行' },
                ];
            }
            return [{ percentage: 100, color: COLORS.PENDING }];
        }

        return [
            { percentage: (successCount / caseTotal) * 100, color: COLORS.SUCCESS, label: '成功' },
            { percentage: (errorCount / caseTotal) * 100, color: COLORS.FAILURE, label: '失败' },
            { percentage: (blockCount / caseTotal) * 100, color: COLORS.BLOCK, label: '阻塞' },
            { percentage: (fakeErrorCount / caseTotal) * 100, color: COLORS.FAKE_ERROR, label: '误报' },
            { percentage: (pendingCount / caseTotal) * 100, color: COLORS.PENDING, label: '未执行' },
        ].filter(item => item.percentage > 0);
    };

    const percentages = getPercentages();
    const executeRate = Number(detail.executeRate || 0);

    const ProgressBar = () => (
        <div
            className={`relative w-full min-w-[80px] rounded-full overflow-hidden flex bg-gray-100 ${className}`}
            style={{ height, minHeight: height }}
        >
            {percentages.map((item, index) => (
                <div
                    key={index}
                    className="first:rounded-l-full last:rounded-r-full"
                    style={{
                        width: `${item.percentage}%`,
                        minWidth: item.percentage > 0 ? '2px' : undefined,
                        backgroundColor: item.color,
                        transition: 'width 0.3s ease',
                    }}
                />
            ))}
            {/* 阈值标记线 */}
            {detail.passThreshold > 0 && detail.passThreshold < 100 && (
                <div
                    className="absolute top-0 bottom-0 w-[1.5px] bg-white/60 z-10"
                    style={{ left: `${detail.passThreshold}%` }}
                />
            )}
        </div>
    );

    if (!showTooltip) {
        return <ProgressBar />;
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                        <ProgressBar />
                    </div>
                </TooltipTrigger>
                <TooltipContent className="p-3 shadow-xl border border-gray-200 bg-white text-gray-900 min-w-[160px]" hideArrow>
                    <StatusProgressTooltipContent statusDetail={statusDetail} />
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
