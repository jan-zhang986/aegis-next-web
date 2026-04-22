/**
 * 测试计划详情 - 测试规划
 * 使用树形列表展示测试规划结构（不再使用思维导图）
 */

import { PlanDetailPlanTree } from './PlanDetailPlanTree';

interface PlanDetailMinderProps {
    planId: string;
    projectId: string;
    status: string;
    canEdit: boolean;
    onRefresh?: () => void;
    /** 测试计划下关联用例总数，在测试规划标题旁展示 */
    totalCaseCount?: number | null;
}

export function PlanDetailMinder({ planId, projectId, status, canEdit, onRefresh, totalCaseCount }: PlanDetailMinderProps) {
    return (
        <PlanDetailPlanTree
            planId={planId}
            projectId={projectId}
            status={status}
            canEdit={canEdit}
            onRefresh={onRefresh}
            totalCaseCount={totalCaseCount}
        />
    );
}
