import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { testAssetService, type TestAssetGateBinding, type TestSuite } from '@/services/test-asset';
import { cn } from '@/utils/cn';

interface GateBindingManagerProps {
  projectId: string;
  spaceId?: string;
}

const TARGET_TYPES = [
  { value: 'SUITE', label: 'Suite' },
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

export function GateBindingManager({ projectId, spaceId }: GateBindingManagerProps) {
  const [bindings, setBindings] = useState<TestAssetGateBinding[]>([]);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gateKey: '',
    gateName: '',
    targetType: 'SUITE',
    targetId: '',
    status: 'ACTIVE',
    ruleConfigText: '{}',
  });

  const selectedSuite = useMemo(() => suites.find((suite) => suite.suiteId === form.targetId), [suites, form.targetId]);

  const load = async () => {
    setLoading(true);
    try {
      const [bindingRes, suiteRes] = await Promise.all([
        testAssetService.getGateBindings({ projectId, spaceId }),
        testAssetService.getSuitePage({ projectId, spaceId }),
      ]);
      setBindings(unwrap<TestAssetGateBinding[]>(bindingRes) || []);
      setSuites(extractRecords(suiteRes));
    } catch (error) {
      console.error(error);
      toast.error('加载门禁绑定失败');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!spaceId) {
      toast.error('请先进入 Space 后再维护门禁绑定');
      return;
    }
    if (!form.gateKey.trim() || !form.gateName.trim() || !form.targetId.trim()) {
      toast.error('请补齐门禁 Key、名称和绑定目标');
      return;
    }
    let ruleConfig: Record<string, any> = {};
    try {
      ruleConfig = form.ruleConfigText.trim() ? JSON.parse(form.ruleConfigText) : {};
    } catch {
      toast.error('ruleConfig 必须是合法 JSON');
      return;
    }
    setSaving(true);
    try {
      await testAssetService.saveGateBinding({
        projectId,
        spaceId,
        gateKey: form.gateKey.trim(),
        gateName: form.gateName.trim(),
        targetType: form.targetType,
        targetId: form.targetId.trim(),
        status: form.status,
        ruleConfig,
        metadata: selectedSuite ? { targetName: selectedSuite.name, suiteType: selectedSuite.type } : undefined,
      });
      toast.success('门禁绑定已保存');
      setForm({ gateKey: '', gateName: '', targetType: 'SUITE', targetId: '', status: 'ACTIVE', ruleConfigText: '{}' });
      await load();
    } catch (error) {
      console.error(error);
      toast.error('保存门禁绑定失败');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId, spaceId]);

  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      <aside className="w-[390px] shrink-0 border-r border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Asset Gate</div>
            <h2 className="mt-1 text-xl font-black text-slate-900">门禁绑定</h2>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={load} disabled={loading}>
            <RefreshCw className={cn('mr-1 h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
        </div>

        <Card className="rounded-3xl border-slate-200 p-4 shadow-sm">
          <div className="mb-3 text-sm font-black text-slate-900">绑定资产到门禁</div>
          <div className="space-y-3">
            <Input placeholder="gateKey，例如 smoke.pre-release" value={form.gateKey} onChange={(e) => setForm((prev) => ({ ...prev, gateKey: e.target.value }))} />
            <Input placeholder="gateName，例如 上线前冒烟门禁" value={form.gateName} onChange={(e) => setForm((prev) => ({ ...prev, gateName: e.target.value }))} />
            <Label>绑定目标类型</Label>
            <Select value={form.targetType} onValueChange={(value) => setForm((prev) => ({ ...prev, targetType: value, targetId: '' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TARGET_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.targetType === 'SUITE' ? (
              <Select value={form.targetId} onValueChange={(value) => setForm((prev) => ({ ...prev, targetId: value }))}>
                <SelectTrigger><SelectValue placeholder="选择 Suite" /></SelectTrigger>
                <SelectContent>
                  {suites.filter((suite) => suite.suiteId).map((suite) => (
                    <SelectItem key={suite.suiteId} value={suite.suiteId || '__missing__'}>{suite.name} / {suite.type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input placeholder="输入 Realization / Workflow ID" value={form.targetId} onChange={(e) => setForm((prev) => ({ ...prev, targetId: e.target.value }))} />
            )}
            <Textarea className="min-h-28 font-mono text-xs" value={form.ruleConfigText} onChange={(e) => setForm((prev) => ({ ...prev, ruleConfigText: e.target.value }))} placeholder='{"passRate": 1, "blockOnFail": true}' />
            <Button className="w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-slate-800" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              保存绑定
            </Button>
          </div>
        </Card>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col p-6">
        <div className="mb-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Gate Bindings</div>
          <h3 className="mt-1 text-2xl font-black text-slate-900">资产门禁绑定</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            门禁绑定属于测试资产服务。质量工作台只消费这些绑定的运行结果，不在工作台里配置规则。
          </p>
        </div>

        <ScrollArea className="min-h-0 flex-1 pr-2">
          <div className="grid gap-3">
            {loading ? (
              <Card className="flex h-44 items-center justify-center rounded-3xl text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载门禁绑定
              </Card>
            ) : bindings.length ? (
              bindings.map((binding) => (
                <Card key={binding.bindingId || `${binding.gateKey}-${binding.targetId}`} className="rounded-3xl border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <div className="truncate font-black text-slate-900">{binding.gateName}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Key：{binding.gateKey}</span>
                        <span>目标：{binding.targetType}</span>
                        <span>ID：{binding.targetId}</span>
                      </div>
                      {binding.ruleConfig && (
                        <pre className="mt-3 max-h-28 overflow-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          {JSON.stringify(binding.ruleConfig, null, 2)}
                        </pre>
                      )}
                    </div>
                    <Badge className={cn('rounded-lg', binding.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {binding.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-3xl border-dashed border-slate-200 p-10 text-center">
                <div className="text-lg font-black text-slate-900">还没有门禁绑定</div>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  建议先把冒烟 Suite 绑定到上线前门禁。后续质量工作台会消费这里的运行结果。
                </p>
              </Card>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
