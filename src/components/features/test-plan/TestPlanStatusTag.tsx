/**
 * 测试计划状态标签组件
 * 显示测试计划的状态（未开始、进行中、已完成、已归档）
 */

import { Badge } from '@/components/ui/badge';
import { planStatusMap, PlanStatusType } from '@/constants/testPlanEnums';

interface TestPlanStatusTagProps {
    status: PlanStatusType | string;
    className?: string;
}

export function TestPlanStatusTag({ status, className = '' }: TestPlanStatusTagProps) {
    const normalizedStatus = status === 'NOT_ARCHIVED' ? 'UNDERWAY' : status;
    const statusConfig = planStatusMap[normalizedStatus as PlanStatusType] || planStatusMap.PREPARED;

    return (
        <Badge
            className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 font-medium ${className}`}
            variant="secondary"
        >
            {statusConfig.label}
        </Badge>
    );
}
