/**
 * 用例详情抽屉 - 关联缺陷 Tab
 * 支持：关联缺陷、取消关联
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { caseManagementService } from '@/services';
import { getPriorityLabel } from '@/services/bug-management/constants/bug-priority';
import { LinkDefectDrawer } from './LinkDefectDrawer';

interface TabBugProps {
  caseId: string | null;
  projectId: string;
  canEdit?: boolean;
  onRefresh?: () => void;
}

interface BugItem {
  id: string;
  num?: string;
  name?: string;
  title?: string;
  status?: string;
  statusName?: string;
  severity?: string;
}

export function TabBug({ caseId, projectId, canEdit = true, onRefresh }: TabBugProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<BugItem[]>([]);
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false);

  const fetchList = () => {
    if (!caseId) return;
    setLoading(true);
    caseManagementService
      .getAssociatedDebugger({ caseId, projectId, current: 1, pageSize: 50 })
      .then((res: any) => {
        const data = res?.list ?? res?.records ?? res?.data ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [caseId, projectId]);

  const handleCancelLink = async (bugId: string) => {
    try {
      await caseManagementService.cancelAssociatedDebugger(bugId);
      toast.success('取消关联成功');
      fetchList();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || '取消关联失败');
    }
  };

  const handleLinkSuccess = () => {
    fetchList();
    onRefresh?.();
  };

  if (!caseId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setLinkDrawerOpen(true)}>
            关联缺陷
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          暂无关联缺陷
          {canEdit && (
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => setLinkDrawerOpen(true)}>关联缺陷</Button>
            </div>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>缺陷 ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>优先级</TableHead>
              {canEdit && <TableHead className="w-24">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.num ?? item.id ?? '-'}</TableCell>
                <TableCell>{item.name ?? item.title ?? '-'}</TableCell>
                <TableCell>{item.statusName ?? item.status ?? '-'}</TableCell>
                <TableCell>{getPriorityLabel(item.severity)}</TableCell>
                {canEdit && (
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleCancelLink(item.id)}>
                      取消关联
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <LinkDefectDrawer
        open={linkDrawerOpen}
        onOpenChange={setLinkDrawerOpen}
        caseId={caseId}
        projectId={projectId}
        onSuccess={handleLinkSuccess}
      />
    </div>
  );
}
