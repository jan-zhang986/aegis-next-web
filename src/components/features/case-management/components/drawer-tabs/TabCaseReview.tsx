/**
 * 用例详情抽屉 - 用例评审 Tab
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

interface TabCaseReviewProps {
  caseId: string | null;
  projectId: string;
}

const REVIEW_STATUS_MAP: Record<string, string> = {
  PREPARED: '已就绪',
  UNDERWAY: '进行中',
  COMPLETED: '已完成',
};

export function TabCaseReview({ caseId, projectId }: TabCaseReviewProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    caseManagementService
      .getDetailCaseReview({ caseId, projectId, current: 1, pageSize: 20 })
      .then((res: any) => {
        const data = res?.list ?? res?.records ?? res ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [caseId, projectId]);

  if (!caseId) return null;
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="py-8 text-center text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-gray-500">暂无用例评审</div>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <Table className="text-sm text-gray-700">
            <TableHeader className="bg-gray-50/60 border-b border-gray-100">
              <TableRow className="hover:bg-transparent h-11">
                <TableHead className="px-4 py-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  评审编号
                </TableHead>
                <TableHead className="px-4 py-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  评审名称
                </TableHead>
                <TableHead className="px-4 py-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  状态
                </TableHead>
                <TableHead className="px-4 py-2 text-sm font-medium text-gray-600 whitespace-nowrap">
                  评审结果
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-gray-50/70">
                  <TableCell className="px-4 py-2 font-mono text-sm text-gray-900">{item.reviewNum ?? item.num ?? '-'}</TableCell>
                  <TableCell className="px-4 py-2 text-sm text-gray-900">{item.reviewName ?? item.name ?? '-'}</TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      {REVIEW_STATUS_MAP[item.reviewStatus] ?? item.reviewStatus ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-gray-900">{item.status ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
