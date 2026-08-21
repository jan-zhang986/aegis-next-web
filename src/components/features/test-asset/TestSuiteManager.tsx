import { useEffect, useMemo, useState } from 'react';
import { Layers3, Link2, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { testAssetService, type TestSuite, type TestSuiteItem } from '@/services/test-asset';
import { testCaseService } from '@/services/test-case';
import { cn } from '@/utils/cn';

interface TestSuiteManagerProps {
  projectId: string;
  spaceId?: string;
}

const SUITE_TYPES = [
  { value: 'SMOKE', label: '冒烟套件' },
  { value: 'REGRESSION', label: '回归套件' },
  { value: 'ACCEPTANCE', label: '验收套件' },
  { value: 'SPECIAL', label: '专项套件' },
];

const TARGET_TYPES = [
  { value: 'CASE', label: 'Case' },
  { value: 'REALIZATION', label: 'Realization' },
  { value: 'WORKFLOW', label: 'Workflow' },
];

function unwrap<T>(res: any): T {
  return (res?.data ?? res) as T;
}

function extractRecords(res: any): any[] {
  const data = unwrap<any>(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function TestSuiteManager({ projectId, spaceId }: TestSuiteManagerProps) {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState('');
  const [items, setItems] = useState<TestSuiteItem[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [savingSuite, setSavingSuite] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [suiteForm, setSuiteForm] = useState({ name: '', type: 'SMOKE', description: '', status: 'ACTIVE' });
  const [itemForm, setItemForm] = useState({ targetType: 'CASE', targetId: '', realizationType: '', title: '' });

  const selectedSuite = useMemo(
    () => suites.find((suite) => suite.suiteId === selectedSuiteId) || suites[0],
    [suites, selectedSuiteId]
  );

  const loadSuites = async () => {
    setLoading(true);
    try {
      const res = await testAssetService.getSuitePage({ projectId, spaceId });
      const list = extractRecords(res);
      setSuites(list);
      setSelectedSuiteId((prev) => prev || list[0]?.suiteId || '');
    } catch (error) {
      console.error(error);
      toast.error('加载测试套件失败');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (suiteId: string) => {
    if (!suiteId) {
      setItems([]);
      return;
    }
    setItemLoading(true);
    try {
      setItems(unwrap<TestSuiteItem[]>(await testAssetService.getSuiteItems(suiteId)) || []);
    } catch (error) {
      console.error(error);
      toast.error('加载套件项失败');
    } finally {
      setItemLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const res = await testCaseService.getTestCaseList({ projectId, spaceId, current: 1, pageSize: 100 });
      setCases(extractRecords(res));
    } catch (error) {
      console.error(error);
      setCases([]);
    }
  };

  const createSuite = async () => {
    if (!spaceId) {
      toast.error('请先进入 Space 后再创建测试套件');
      return;
    }
    if (!suiteForm.name.trim()) {
      toast.error('请输入套件名称');
      return;
    }
    setSavingSuite(true);
    try {
      const suiteId = unwrap<string>(await testAssetService.saveSuite({
        projectId,
        spaceId,
        name: suiteForm.name.trim(),
        type: suiteForm.type,
        description: suiteForm.description,
        status: suiteForm.status,
      }));
      toast.success('测试套件已保存');
      setSuiteForm({ name: '', type: 'SMOKE', description: '', status: 'ACTIVE' });
      await loadSuites();
      if (suiteId) setSelectedSuiteId(suiteId);
    } catch (error) {
      console.error(error);
      toast.error('保存测试套件失败');
    } finally {
      setSavingSuite(false);
    }
  };

  const addItem = async () => {
    if (!selectedSuite?.suiteId) return;
    if (!itemForm.targetId.trim()) {
      toast.error('请选择或输入资产 ID');
      return;
    }
    setSavingItem(true);
    try {
      const caseOption = cases.find((item) => (item.caseId || item.id) === itemForm.targetId);
      await testAssetService.saveSuiteItem(selectedSuite.suiteId, {
        projectId,
        spaceId,
        targetType: itemForm.targetType,
        targetId: itemForm.targetId.trim(),
        realizationType: itemForm.realizationType || undefined,
        title: itemForm.title || caseOption?.title || caseOption?.name || itemForm.targetId,
        sort: items.length + 1,
      });
      toast.success('套件项已添加');
      setItemForm({ targetType: 'CASE', targetId: '', realizationType: '', title: '' });
      await loadItems(selectedSuite.suiteId);
    } catch (error) {
      console.error(error);
      toast.error('添加套件项失败');
    } finally {
      setSavingItem(false);
    }
  };

  const removeItem = async (item: TestSuiteItem) => {
    if (!selectedSuite?.suiteId || !item.itemId) return;
    try {
      await testAssetService.removeSuiteItem(selectedSuite.suiteId, item.itemId);
      toast.success('套件项已移除');
      await loadItems(selectedSuite.suiteId);
    } catch (error) {
      console.error(error);
      toast.error('移除套件项失败');
    }
  };

  useEffect(() => {
    loadSuites();
    loadCases();
  }, [projectId, spaceId]);

  useEffect(() => {
    if (selectedSuite?.suiteId) loadItems(selectedSuite.suiteId);
  }, [selectedSuite?.suiteId]);

  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      <aside className="w-[380px] shrink-0 border-r border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Test Asset</div>
            <h2 className="mt-1 text-xl font-black text-slate-900">测试套件</h2>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={loadSuites} disabled={loading}>
            <RefreshCw className={cn('mr-1 h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
        </div>

        <Card className="mb-5 rounded-3xl border-slate-200 p-4 shadow-sm">
          <div className="mb-3 text-sm font-black text-slate-900">创建套件</div>
          <div className="space-y-3">
            <Input placeholder="套件名称，例如：支付链路冒烟" value={suiteForm.name} onChange={(e) => setSuiteForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Select value={suiteForm.type} onValueChange={(value) => setSuiteForm((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger><SelectValue placeholder="套件类型" /></SelectTrigger>
              <SelectContent>{SUITE_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea className="min-h-20" placeholder="说明：这个套件服务哪个质量场景" value={suiteForm.description} onChange={(e) => setSuiteForm((prev) => ({ ...prev, description: e.target.value }))} />
            <Button className="w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-slate-800" onClick={createSuite} disabled={savingSuite}>
              {savingSuite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              保存套件
            </Button>
          </div>
        </Card>

        <ScrollArea className="h-[calc(100vh-430px)] pr-2">
          <div className="space-y-3">
            {suites.map((suite) => (
              <button
                key={suite.suiteId}
                type="button"
                onClick={() => setSelectedSuiteId(suite.suiteId || '')}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition-all',
                  selectedSuite?.suiteId === suite.suiteId ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-black text-slate-900">{suite.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{suite.description || '暂无说明'}</div>
                  </div>
                  <Badge className="rounded-lg bg-slate-900 text-white">{suite.type}</Badge>
                </div>
              </button>
            ))}
            {!suites.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                当前 Space 还没有测试套件。
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Suite Items</div>
            <h3 className="mt-1 text-2xl font-black text-slate-900">{selectedSuite?.name || '选择一个测试套件'}</h3>
            <p className="mt-2 text-sm text-slate-500">Suite 是长期测试资产，质量工作台只引用它，不在任务里配置门禁。</p>
          </div>
          {selectedSuite && <Badge variant="outline" className="rounded-xl bg-white px-3 py-1 font-bold">{items.length} 项</Badge>}
        </div>

        {selectedSuite ? (
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit rounded-3xl border-slate-200 p-5 shadow-sm">
              <div className="mb-4 text-sm font-black text-slate-900">添加资产</div>
              <div className="space-y-3">
                <Label>资产类型</Label>
                <Select value={itemForm.targetType} onValueChange={(value) => setItemForm((prev) => ({ ...prev, targetType: value, targetId: '', realizationType: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TARGET_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                </Select>
                {itemForm.targetType === 'CASE' ? (
                  <Select value={itemForm.targetId} onValueChange={(value) => {
                    const option = cases.find((item) => (item.caseId || item.id) === value);
                    setItemForm((prev) => ({ ...prev, targetId: value, title: option?.title || option?.name || '' }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="选择当前 Space 的 Case" /></SelectTrigger>
                    <SelectContent>
                      {cases.filter((item) => item.caseId || item.id).map((item) => (
                        <SelectItem key={item.caseId || item.id} value={item.caseId || item.id}>{item.title || item.name || item.caseId || item.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="输入 Realization / Workflow ID" value={itemForm.targetId} onChange={(e) => setItemForm((prev) => ({ ...prev, targetId: e.target.value }))} />
                )}
                {itemForm.targetType === 'REALIZATION' && (
                  <Input placeholder="Realization 类型，例如 API / WORKFLOW / MANUAL" value={itemForm.realizationType} onChange={(e) => setItemForm((prev) => ({ ...prev, realizationType: e.target.value }))} />
                )}
                <Input placeholder="展示标题，可选" value={itemForm.title} onChange={(e) => setItemForm((prev) => ({ ...prev, title: e.target.value }))} />
                <Button className="w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-slate-800" onClick={addItem} disabled={savingItem}>
                  {savingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  加入套件
                </Button>
              </div>
            </Card>

            <ScrollArea className="min-h-0 pr-2">
              <div className="space-y-3">
                {itemLoading ? (
                  <Card className="flex h-44 items-center justify-center rounded-3xl text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    加载套件项
                  </Card>
                ) : items.length ? (
                  items.map((item) => (
                    <Card key={item.itemId || item.targetId} className="rounded-3xl border-slate-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-blue-500" />
                            <div className="truncate font-black text-slate-900">{item.title || item.targetId}</div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>类型：{item.targetType}</span>
                            <span>ID：{item.targetId}</span>
                            {item.realizationType && <span>Realization：{item.realizationType}</span>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl text-rose-600 hover:bg-rose-50" onClick={() => removeItem(item)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          移除
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="rounded-3xl border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                    还没有套件项。把 Case、Realization 或 Workflow 加进来后，质量任务就能引用这个 Suite。
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
            先创建一个 Suite。
          </Card>
        )}
      </main>
    </div>
  );
}
