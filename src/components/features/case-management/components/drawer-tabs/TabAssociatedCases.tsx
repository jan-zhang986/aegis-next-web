/**
 * 用例详情抽屉 - 关联用例 Tab
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
import { caseManagementService } from '@/services';

interface TabAssociatedCasesProps {
  caseId: string | null;
  projectId: string;
}

export function TabAssociatedCases({ caseId, projectId }: TabAssociatedCasesProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    caseManagementService
      .getAssociatedDrawerCase({ caseId, projectId, current: 1, pageSize: 20 })
      .then((res: any) => {
        const data = res?.list ?? res?.records ?? res ?? [];
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
        <div className="py-8 text-center text-gray-500">暂无关联用例</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用例编号</TableHead>
              <TableHead>用例名称</TableHead>
              <TableHead>来源</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.num ?? item.id ?? '-'}</TableCell>
                <TableCell>{item.name ?? '-'}</TableCell>
                <TableCell>{item.sourceType ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
