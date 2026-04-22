/**
 * 用例详情抽屉 - 测试计划 Tab
 */

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { caseManagementService } from '@/services';
import { planStatusMap, type PlanStatusType } from '@/constants/testPlanEnums';

interface TabTestPlanProps {
  caseId: string | null;
  projectId: string;
}

/** 计划状态展示文案，与老前端 caseReview locale + test-plan config 一致；后端可能返回 NOT_ARCHIVED */
const PLAN_STATUS_LABEL: Record<string, string> = {
  PREPARED: '未开始',
  UNDERWAY: '进行中',
  COMPLETED: '已完成',
  ARCHIVED: '已归档',
  NOT_ARCHIVED: '未归档',
};

const EXECUTE_RESULT_MAP: Record<string, string> = {
  PENDING: '未执行',
  SUCCESS: '通过',
  ERROR: '失败',
  BLOCKED: '阻塞',
};

export function TabTestPlan({ caseId, projectId }: TabTestPlanProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    caseManagementService
      .getAssociatedTestPlan({ caseId, projectId, current: 1, pageSize: 20 })
      .then((res: any) => {
        const data = res?.list ?? res?.records ?? res?.data ?? (Array.isArray(res) ? res : []);
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [caseId, projectId]);

  if (!caseId) return null;
  return (
    <div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-gray-500">暂无关联测试计划</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>计划编号</TableHead>
              <TableHead>计划名称</TableHead>
              <TableHead>计划状态</TableHead>
              <TableHead>执行结果</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.testPlanNum ?? item.num ?? '-'}</TableCell>
                <TableCell>{item.testPlanName ?? item.name ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={planStatusMap[item.planStatus as PlanStatusType]?.textColor ?? (item.planStatus === 'NOT_ARCHIVED' ? planStatusMap.UNDERWAY.textColor : '')}>
                    {PLAN_STATUS_LABEL[item.planStatus] ?? item.planStatus ?? '-'}
                  </Badge>
                </TableCell>
                <TableCell>{EXECUTE_RESULT_MAP[item.lastExecResult] ?? item.lastExecResult ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
