/**
 * 组织模板-工作流设置（状态列表的增删改、初始/结束态）
 */
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getOrgWorkFlowList,
  createOrgWorkFlowStatus,
  updateOrgWorkFlowStatus,
  deleteOrgWorkFlowStatus,
  setOrgWorkFlowState,
  updateOrgWorkFlowStateFlow,
  getProjectWorkFlowList,
  createProjectWorkFlowStatus,
  updateProjectWorkFlowStatus,
  deleteProjectWorkFlowStatus,
  setProjectWorkFlowState,
  updateProjectWorkFlowStateFlow,
} from '@/services/setting/template';
import type { WorkFlowStatusItem, OrdWorkStatusParams, SceneType } from '@/types/setting/template';

const SCENE_LABELS: Record<string, string> = {
  FUNCTIONAL: '用例',
  BUG: '缺陷',
  API: 'API',
};

export type TemplateScope = 'organization' | 'project';

interface TemplateWorkflowViewProps {
  organizationId?: string;
  scopeId?: string;
  scope?: TemplateScope;
  scene: SceneType;
  onBack: () => void;
}

export function TemplateWorkflowView({ organizationId, scopeId, scope = 'organization', scene, onBack }: TemplateWorkflowViewProps) {
  const effectiveScopeId = scopeId ?? organizationId ?? '';
  const [list, setList] = useState<WorkFlowStatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkFlowStatusItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formRemark, setFormRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkFlowStatusItem | null>(null);
  const [flowUpdating, setFlowUpdating] = useState<string | null>(null); // 'fromId-toId' when updating

  const loadList = useCallback(async () => {
    if (!effectiveScopeId) return;
    setLoading(true);
    try {
      const data = scope === 'project'
        ? await getProjectWorkFlowList(effectiveScopeId, scene)
        : await getOrgWorkFlowList(effectiveScopeId, scene);
      setList(Array.isArray(data) ? data : []);
    } catch {
      toast.error('加载工作流状态失败');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveScopeId, scope, scene]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormRemark('');
    setModalOpen(true);
  };

  const handleOpenEdit = (row: WorkFlowStatusItem) => {
    if (row.internal) return;
    setEditingItem(row);
    setFormName(row.name || '');
    setFormRemark(row.remark || '');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('请输入状态名称');
      return;
    }
    setSubmitting(true);
    try {
      const payload: OrdWorkStatusParams = {
        name: formName.trim(),
        remark: formRemark.trim(),
        scopeId: effectiveScopeId,
        scene,
      };
      if (editingItem?.id) payload.id = editingItem.id;
      if (editingItem?.id) {
        if (scope === 'project') {
          await updateProjectWorkFlowStatus(payload);
        } else {
          await updateOrgWorkFlowStatus(payload);
        }
        toast.success('更新成功');
      } else {
        if (scope === 'project') {
          await createProjectWorkFlowStatus(payload);
        } else {
          await createOrgWorkFlowStatus(payload);
        }
        toast.success('添加成功');
      }
      setModalOpen(false);
      loadList();
    } catch {
      toast.error(editingItem ? '更新失败' : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row: WorkFlowStatusItem) => {
    if (row.internal) return;
    try {
      if (scope === 'project') {
        await deleteProjectWorkFlowStatus(row.id);
      } else {
        await deleteOrgWorkFlowStatus(row.id);
      }
      toast.success('删除成功');
      setDeleteTarget(null);
      loadList();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleSetInitial = async (row: WorkFlowStatusItem) => {
    try {
      const setState = scope === 'project' ? setProjectWorkFlowState : setOrgWorkFlowState;
      await setState({
        statusId: row.id,
        definitionId: 'INITIAL',
        enable: true,
      });
      toast.success('已设为初始状态');
      loadList();
    } catch {
      toast.error('设置失败');
    }
  };

  const handleSetEnd = async (row: WorkFlowStatusItem) => {
    try {
      const setState = scope === 'project' ? setProjectWorkFlowState : setOrgWorkFlowState;
      await setState({
        statusId: row.id,
        definitionId: 'END',
        enable: true,
      });
      toast.success('已设为结束状态');
      loadList();
    } catch {
      toast.error('设置失败');
    }
  };

  const canFlowTo = (fromItem: WorkFlowStatusItem, toId: string): boolean => {
    const targets = (fromItem.statusFlowTargets || []) as string[];
    return targets.includes(toId);
  };

  const onFlowToggle = async (fromId: string, toId: string, enable: boolean) => {
    const key = `${fromId}-${toId}`;
    setFlowUpdating(key);
    try {
      if (scope === 'project') {
        await updateProjectWorkFlowStateFlow({ fromId, toId, enable });
      } else {
        await updateOrgWorkFlowStateFlow({ fromId, toId, enable });
      }
      await loadList();
    } catch {
      toast.error('更新流转失败');
    } finally {
      setFlowUpdating(null);
    }
  };

  const sceneLabel = SCENE_LABELS[scene] || scene;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center border-b border-gray-200 bg-white px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
          <ArrowLeft className="mr-1 h-4 w-4" /> 返回
        </Button>
      </div>
      <Card className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg">{sceneLabel} - 工作流设置</CardTitle>
          <CardDescription>管理该场景下的状态及流转</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> 添加状态
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>状态名称</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>排序</TableHead>
                <TableHead className="w-[220px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">暂无状态</TableCell>
                </TableRow>
              ) : (
                list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.name}
                      {row.internal && (
                        <span className="ml-2 text-xs text-muted-foreground">(内置)</span>
                      )}
                    </TableCell>
                    <TableCell>{row.remark || '-'}</TableCell>
                    <TableCell>{row.pos ?? '-'}</TableCell>
                    <TableCell>
                      {!row.internal && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>编辑</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSetInitial(row)}>设为首态</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSetEnd(row)}>设为终态</Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {list.length > 0 && (
        <Card className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base">流转配置</CardTitle>
            <CardDescription>勾选表示可从左侧状态流转至上方状态</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">从 → 到</TableHead>
                  {list.map((col) => (
                    <TableHead key={col.id} className="text-center min-w-[80px]">{col.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    {list.map((col) => {
                      const key = `${row.id}-${col.id}`;
                      const checked = canFlowTo(row, col.id);
                      const busy = flowUpdating === key;
                      return (
                        <TableCell key={col.id} className="text-center">
                          {row.id === col.id ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <Checkbox
                              checked={checked}
                              disabled={busy}
                              onCheckedChange={(v) => onFlowToggle(row.id, col.id, v === true)}
                            />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑状态' : '添加状态'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>状态名称 *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="请输入" />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input value={formRemark} onChange={(e) => setFormRemark(e.target.value)} placeholder="选填" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '提交中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除状态「{deleteTarget?.name}」吗？删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
