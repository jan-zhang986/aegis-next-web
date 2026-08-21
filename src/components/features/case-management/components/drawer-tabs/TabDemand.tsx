/**
 * 用例详情抽屉 - 关联需求 Tab
 * 支持：添加需求、关联需求、取消关联
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { caseManagementService, projectManagementService } from '@/services';
import { AddDemandModal, type DemandFormItem } from './AddDemandModal';
import { ThirdDemandDrawer } from './ThirdDemandDrawer';

interface TabDemandProps {
  caseId: string | null;
  projectId: string;
  canEdit?: boolean;
  onRefresh?: () => void;
}

interface DemandItem {
  id: string;
  demandId: string;
  demandName: string;
  name?: string;
  demandUrl?: string;
  demandPlatform?: string;
}

export function TabDemand({ caseId, projectId, canEdit = true, onRefresh }: TabDemandProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<DemandItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<Record<string, any>>({});
  const [editForm, setEditForm] = useState<DemandFormItem | null>(null);

  const fetchList = () => {
    if (!caseId) return;
    setLoading(true);
    caseManagementService
      .getDemandList({ caseId, keyword: keyword.trim() || undefined, projectId, current: 1, pageSize: 50 })
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

  useEffect(() => {
    if (caseId && projectId) {
      projectManagementService
        .getCaseRelatedInfo(projectId)
        .then((res: any) => setPlatformInfo(res || {}))
        .catch(() => setPlatformInfo({}));
    }
  }, [caseId, projectId]);

  const handleAddSuccess = () => {
    fetchList();
    onRefresh?.();
  };

  const handleCancelLink = async (record: DemandItem) => {
    try {
      await caseManagementService.cancelAssociationDemand(record.id);
      toast.success('取消关联成功');
      fetchList();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || '取消关联失败');
    }
  };

  const handleEdit = (record: DemandItem) => {
    setEditForm({ id: record.id, demandId: record.demandId, demandName: record.demandName, demandUrl: record.demandUrl || '' });
    setAddModalOpen(true);
  };

  const handleAdd = () => {
    setEditForm(null);
    setAddModalOpen(true);
  };

  const caseEnable = platformInfo?.case_enable !== 'false';

  if (!caseId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {canEdit && (
            <>
              {caseEnable && (
                <Button variant="outline" size="sm" onClick={() => setLinkDrawerOpen(true)}>
                  关联需求
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleAdd}>
                添加需求
              </Button>
            </>
          )}
        </div>
        <Input
          placeholder="搜索需求名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchList()}
          className="max-w-xs"
        />
        <Button variant="ghost" size="sm" onClick={fetchList}>搜索</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          暂无关联需求
          {canEdit && (
            <div className="mt-2 flex gap-2 justify-center">
              {caseEnable && (
                <Button variant="outline" size="sm" onClick={() => setLinkDrawerOpen(true)}>关联需求</Button>
              )}
              <Button variant="outline" size="sm" onClick={handleAdd}>添加需求</Button>
            </div>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>需求 ID</TableHead>
              <TableHead>需求名称</TableHead>
              <TableHead>需求平台</TableHead>
              {canEdit && <TableHead className="w-32">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.demandId ?? item.id ?? '-'}</TableCell>
                <TableCell>
                  {item.demandUrl ? (
                    <a href={item.demandUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {item.demandName ?? item.name ?? '-'}
                    </a>
                  ) : (
                    item.demandName ?? item.name ?? '-'
                  )}
                </TableCell>
                <TableCell>{item.demandPlatform ?? '-'}</TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleCancelLink(item)}>
                        取消关联
                      </Button>
                      {item.demandPlatform === 'LOCAL' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleEdit(item)}>
                          编辑
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AddDemandModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        caseId={caseId}
        projectId={projectId}
        form={editForm}
        onSuccess={handleAddSuccess}
      />
      <ThirdDemandDrawer
        open={linkDrawerOpen}
        onOpenChange={setLinkDrawerOpen}
        caseId={caseId}
        projectId={projectId}
        platformInfo={platformInfo}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
