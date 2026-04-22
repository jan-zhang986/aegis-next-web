/**
 * 用例详情抽屉 - 前后置依赖 Tab
 * 支持：搜索、添加、取消依赖
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { caseManagementService } from '@/services';

type RelationType = 'preposition' | 'postPosition';

interface TabDependencyProps {
  caseId: string | null;
  projectId: string;
  onRefresh?: () => void;
  /** 点击「新建用例」时回调，关闭抽屉并跳转新建页 */
  onCreate?: () => void;
}

export function TabDependency({ caseId, projectId, onRefresh, onCreate }: TabDependencyProps) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [showType, setShowType] = useState<RelationType>('preposition');
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addList, setAddList] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    if (!caseId) return;
    setLoading(true);
    const params: any = {
      id: caseId,
      projectId,
      type: showType === 'preposition' ? 'PRE' : 'POST',
      current: 1,
      pageSize: 50,
    };
    if (searchKeyword.trim()) params.keyword = searchKeyword.trim();
    caseManagementService
      .getDependOnPage(params)
      .then((res: any) => {
        const data = res?.list ?? res?.records ?? res ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [caseId, projectId, showType, searchKeyword]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = () => {
    setSearchKeyword(keyword);
  };

  const handleAddOpen = () => {
    setAddOpen(true);
    setSelectedIds(new Set());
    if (!caseId) return;
    setAddLoading(true);
    caseManagementService
      .getAssociatedCaseIds(caseId)
      .then((excludeIds: string[]) => {
        const exclude = excludeIds ?? [];
        return caseManagementService.getDependOnRelation({
          projectId,
          id: caseId,
          type: showType === 'preposition' ? 'PRE' : 'POST',
          moduleIds: [],
          excludeIds: exclude,
          keyword: '',
          current: 1,
          pageSize: 50,
        });
      })
      .then((res: any) => {
        const data = res?.list ?? res?.records ?? res ?? [];
        setAddList(Array.isArray(data) ? data : []);
      })
      .catch(() => setAddList([]))
      .finally(() => setAddLoading(false));
  };

  const handleAddConfirm = () => {
    if (!caseId || selectedIds.size === 0) {
      setAddOpen(false);
      return;
    }
    setAddLoading(true);
    caseManagementService
      .addDependOnRelation({
        id: caseId,
        projectId,
        type: showType === 'preposition' ? 'PRE' : 'POST',
        selectIds: Array.from(selectedIds),
        excludeIds: [],
        selectAll: false,
      } as any)
      .then(() => {
        setAddOpen(false);
        fetchList();
        onRefresh?.();
      })
      .catch((e) => console.error(e))
      .finally(() => setAddLoading(false));
  };

  const handleCancelDependency = (record: any) => {
    if (!caseId) return;
    setCancelLoading(record.id);
    caseManagementService
      .cancelPreAndPostCase({
        id: record.id,
        caseId,
        type: showType === 'preposition' ? 'PRE' : 'POST',
      } as any)
      .then(() => {
        fetchList();
        onRefresh?.();
      })
      .catch((e) => console.error(e))
      .finally(() => setCancelLoading(null));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!caseId) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 items-center">
          <Button
            variant={showType === 'preposition' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowType('preposition')}
          >
            前置用例
          </Button>
          <Button
            variant={showType === 'postPosition' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowType('postPosition')}
          >
            后置用例
          </Button>
          <Button size="sm" onClick={handleAddOpen}>
            添加{showType === 'preposition' ? '前置' : '后置'}用例
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            className="w-48 h-8 text-sm"
            placeholder="按名称搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" size="sm" onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">加载中...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          暂无{showType === 'preposition' ? '前置' : '后置'}用例
          <Button variant="link" size="sm" className="ml-2" onClick={handleAddOpen}>
            添加
          </Button>
          {onCreate && (
            <Button variant="link" size="sm" className="ml-2" onClick={() => { setAddOpen(false); onCreate(); }}>
              新建用例
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用例编号</TableHead>
              <TableHead>用例名称</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.num ?? item.id ?? '-'}</TableCell>
                <TableCell>{item.name ?? '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={!!cancelLoading}
                    onClick={() => handleCancelDependency(item)}
                  >
                    {cancelLoading === item.id ? '取消中...' : '取消依赖'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>添加{showType === 'preposition' ? '前置' : '后置'}用例</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0">
            {addLoading ? (
              <div className="py-8 text-center text-gray-500">加载中...</div>
            ) : addList.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                无可添加的用例
                {onCreate && (
                  <Button variant="link" size="sm" className="ml-2 mt-2" onClick={() => { setAddOpen(false); onCreate(); }}>
                    新建用例
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {addList.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                    <span className="font-mono text-sm">{item.num ?? item.id ?? '-'}</span>
                    <span className="text-sm flex-1 truncate">{item.name ?? '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex-1 flex justify-start">
              {onCreate && (
                <Button variant="ghost" size="sm" onClick={() => { setAddOpen(false); onCreate(); }}>
                  新建用例
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddConfirm} disabled={selectedIds.size === 0 || addLoading}>
                确定添加 ({selectedIds.size})
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
