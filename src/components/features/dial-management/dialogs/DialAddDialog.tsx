/**
 * 拨测 - 新建拨测弹窗（1:1 还原 spotter-aegislm AddDial.vue）
 * 支持 WEB / LLM-WEB / API / DUBBO / PLAYWRIGHT 五种类型，字段与 features 结构与原项目一致
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dialApi, accountApi, menuApi, invokeDubbo } from '@/services/dial-management';
import type { AccountItem } from '@/services/dial-management';
import type { MenuItem } from '@/services/dial-management';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { APP_OPTIONS, DIAL_SUB_TO_DIALING_TYPE } from '../constants';
import { MenuTreeSelect } from '../MenuTreeSelect';

const PRIORITY_OPTIONS = [
  { value: 0, label: '低' },
  { value: 1, label: '中' },
  { value: 2, label: '高' },
];

const API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

const REGION_OPTIONS = [
  { value: 'cn-beijing', label: '国内（默认）' },
  { value: 'us-west-1', label: '美国硅谷' },
];

function flattenMenus(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children?.length) result.push(...flattenMenus(item.children));
  }
  return result;
}

function buildTreeSelectOptions(items: MenuItem[]): { id: string; name: string; children?: { id: string; name: string; children?: { id: string; name: string }[] }[] }[] {
  return items.map((item) => {
    const opt: { id: string; name: string; children?: { id: string; name: string; children?: { id: string; name: string }[] }[] } = {
      id: item.id,
      name: item.name,
    };
    if (item.children?.length) {
      opt.children = item.children.map((child) => {
        const childOpt: { id: string; name: string; children?: { id: string; name: string }[] } = {
          id: child.id,
          name: child.name,
        };
        if (child.children?.length) {
          childOpt.children = child.children.map((gc) => ({ id: gc.id, name: gc.name }));
        }
        return childOpt;
      });
    }
    return opt;
  });
}

function parseJsonField(value: string, fieldName: string): { ok: boolean; data?: unknown; err?: string } {
  if (!value?.trim()) return { ok: true, data: undefined };
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch {
    return { ok: false, err: `${fieldName} 必须是有效的JSON格式` };
  }
}

const DIAL_SUB_TITLE: Record<string, string> = {
  dialWeb: '新建 Web 拨测',
  dialApi: '新建 API 拨测',
  dialDubbo: '新建 Dubbo 拨测',
  dialScript: '新建脚本拨测',
  dialLlm: '新建 LLM 拨测',
};

interface DialAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** 当前 Tab：dialWeb / dialApi / dialDubbo / dialScript / dialLlm，不传则显示通用表单（含类型选择） */
  dialSub?: string;
}

const defaultBaseForm = {
  description: '',
  priority: 1,
  dialingType: 'WEB' as string,
  appCode: 'Gmesh',
  e2eMenuId: '',
  accountId: '',
  region: null as string | null,
  openId: '',
  userName: '',
  response: true,
  console: false,
  element_error: false,
};

export function DialAddDialog({ open, onOpenChange, onSuccess, dialSub }: DialAddDialogProps) {
  const dialingType = dialSub ? (DIAL_SUB_TO_DIALING_TYPE[dialSub] ?? 'WEB') : 'WEB';
  const [baseForm, setBaseForm] = useState(defaultBaseForm);
  const [webUrl, setWebUrl] = useState('');
  const [llmWebUrl, setLlmWebUrl] = useState('');
  const [llmTask, setLlmTask] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiMethod, setApiMethod] = useState<string>('GET');
  const [apiHeaders, setApiHeaders] = useState('');
  const [apiParams, setApiParams] = useState('');
  const [apiBody, setApiBody] = useState('');
  const [dubboApplicationName, setDubboApplicationName] = useState('');
  const [dubboInterface, setDubboInterface] = useState('');
  const [dubboMethod, setDubboMethod] = useState('');
  const [dubboParamTypes, setDubboParamTypes] = useState('');
  const [dubboParams, setDubboParams] = useState('');
  const [dubboSiteTenant, setDubboSiteTenant] = useState('');
  const [textCode, setTextCode] = useState('');
  const [menuOptions, setMenuOptions] = useState<{ id: string; name: string; children?: { id: string; name: string; children?: { id: string; name: string }[] }[] }[]>([]);
  const [menuAllList, setMenuAllList] = useState<MenuItem[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dubboTestLoading, setDubboTestLoading] = useState(false);

  const title = dialSub ? (DIAL_SUB_TITLE[dialSub] ?? '新建拨测') : '新建拨测';
  const showTypeSelect = !dialSub;
  const handleDialingTypeDisabled = !!dialSub;

  const currentType = showTypeSelect ? baseForm.dialingType : dialingType;
  const showRegion = currentType === 'WEB' || currentType === 'LLM-WEB' || currentType === 'PLAYWRIGHT';
  const showListenConfig = currentType === 'WEB' || currentType === 'LLM-WEB' || currentType === 'PLAYWRIGHT';

  /** 选择菜单后设置 URL（与原项目 AddDial.vue setUrl 一致：从 menuAllList 按 id 查找，取 path 填 WEB/LLM-WEB 的 Url） */
  const setUrlFromMenu = (menuId: string) => {
    if (!menuId) return;
    const idNum = Number(menuId);
    const menu = menuAllList.find((m) => (typeof m.id === 'number' ? m.id === idNum : String(m.id) === menuId));
    const path = menu?.path ?? (menu as MenuItem & { url?: string })?.url ?? '';
    if (path) {
      if (currentType === 'LLM-WEB') setLlmWebUrl(path);
      if (currentType === 'WEB') setWebUrl(path);
    }
  };

  useEffect(() => {
    if (open) {
      setBaseForm(defaultBaseForm);
      setWebUrl('');
      setLlmWebUrl('');
      setLlmTask('');
      setApiUrl('');
      setApiMethod('GET');
      setApiHeaders('');
      setApiParams('');
      setApiBody('');
      setDubboApplicationName('');
      setDubboInterface('');
      setDubboMethod('');
      setDubboParamTypes('');
      setDubboParams('');
      setDubboSiteTenant('');
      setTextCode('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const app = baseForm.appCode || 'Gmesh';
    menuApi.page({ appCode: app, pageSize: 9999, currentPage: 1 }).then((res) => {
      if (!res || typeof res !== 'object') {
        setMenuAllList([]);
        setMenuOptions([]);
        return;
      }
      const resAny = res as { code?: number; data?: unknown };
      if (resAny.code != null && resAny.code !== 200) {
        setMenuAllList([]);
        setMenuOptions([]);
        return;
      }
      const raw = 'data' in resAny ? resAny.data : null;
      const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && raw !== null && 'data' in raw ? (raw as { data: unknown }).data : []) ?? [];
      const menuList = Array.isArray(list) ? (list as MenuItem[]) : [];
      setMenuAllList(flattenMenus(menuList));
      setMenuOptions(buildTreeSelectOptions(menuList));
    });
    accountApi.page({ currentPage: 1, pageSize: 999, appCode: app, accountTitle: '' }).then((res) => {
      if (res && typeof res === 'object' && 'data' in res) {
        const data = (res as any).data as AccountItem[];
        setAccountOptions(Array.isArray(data) ? data : []);
      } else {
        setAccountOptions([]);
      }
    });
  }, [open, baseForm.appCode]);

  const buildFeatures = (): Record<string, unknown> => {
    const type = currentType;
    const base: Record<string, unknown> = {
      dialingType: type,
      alarmConfig: {
        openId: baseForm.openId?.trim() || '',
        userName: baseForm.userName?.trim() || '',
      },
    };
    const strategy = {
      request: false,
      response: showListenConfig ? baseForm.response : false,
      console: showListenConfig ? baseForm.console : false,
      element_error: showListenConfig ? baseForm.element_error : false,
      validation: {} as Record<string, unknown>,
    };
    if (type === 'WEB') {
      base.webActions = { url: webUrl.trim() };
      base.strategyPattern = strategy;
    } else if (type === 'LLM-WEB') {
      base.llmActions = { url: llmWebUrl.trim(), task: llmTask.trim(), actions: [] };
      base.strategyPattern = strategy;
    } else if (type === 'API') {
      base.apiActions = {
        url: apiUrl.trim(),
        method: apiMethod,
        headers: parseJsonField(apiHeaders, '请求头').data ?? {},
        params: parseJsonField(apiParams, 'Params').data ?? {},
        body: parseJsonField(apiBody, 'Body').data ?? {},
      };
      base.strategyPattern = { request: false, response: false, console: false, element_error: false, validation: {} };
    } else if (type === 'DUBBO') {
      const pt = parseJsonField(dubboParamTypes, '参数类型');
      const dp = parseJsonField(dubboParams, '参数');
      base.dubboActions = {
        environment: 'PROD',
        applicationName: dubboApplicationName.trim(),
        interfaceName: dubboInterface.trim(),
        methodName: dubboMethod.trim(),
        paramTypes: pt.ok && pt.data !== undefined ? pt.data : [],
        params: dp.ok && dp.data !== undefined ? dp.data : [],
        siteTenant: dubboSiteTenant.trim(),
      };
      base.strategyPattern = { request: false, response: false, console: false, element_error: false, validation: {} };
    } else if (type === 'PLAYWRIGHT') {
      base.scriptActions = {};
      base.strategyPattern = strategy;
    }
    return base;
  };

  const handleSubmit = async () => {
    if (!baseForm.description?.trim() || !baseForm.appCode) {
      toast.error('请填写描述、应用');
      return;
    }
    if (!baseForm.e2eMenuId || !baseForm.accountId) {
      toast.error('请选择菜单和账号');
      return;
    }
    if (!baseForm.openId?.trim() || !baseForm.userName?.trim()) {
      toast.error('请填写 openId 和通知人');
      return;
    }
    const type = currentType;
    if (type === 'WEB') {
      if (!webUrl.trim()) {
        toast.error('请填写 Url');
        return;
      }
    }
    if (type === 'LLM-WEB') {
      if (!llmWebUrl.trim() || !llmTask.trim()) {
        toast.error('请填写 Url 和任务描述');
        return;
      }
    }
    if (type === 'API') {
      if (!apiUrl.trim()) {
        toast.error('请填写路径');
        return;
      }
      const h = parseJsonField(apiHeaders, '请求头');
      if (!h.ok) {
        toast.error(h.err);
        return;
      }
      const p = parseJsonField(apiParams, 'Params');
      if (!p.ok) {
        toast.error(p.err);
        return;
      }
      const b = parseJsonField(apiBody, 'Body');
      if (!b.ok) {
        toast.error(b.err);
        return;
      }
    }
    if (type === 'DUBBO') {
      if (!dubboApplicationName.trim() || !dubboInterface.trim() || !dubboMethod.trim() || !dubboParamTypes.trim() || !dubboParams.trim() || !dubboSiteTenant.trim()) {
        toast.error('请填写 DUBBO 必填项：后端应用名称、接口名称、方法名称、参数类型、参数、站点');
        return;
      }
      const pt = parseJsonField(dubboParamTypes, '参数类型');
      const dp = parseJsonField(dubboParams, '参数');
      if (!pt.ok || !dp.ok) {
        toast.error(pt.err || dp.err);
        return;
      }
    }
    setSubmitting(true);
    try {
      const features = buildFeatures();
      await dialApi.add({
        description: baseForm.description.trim(),
        testPrompt: {},
        priority: baseForm.priority,
        textCode: currentType === 'PLAYWRIGHT' ? textCode : '',
        features,
        isActive: 1,
        appCode: baseForm.appCode,
        userId: '',
        e2eMenuId: baseForm.e2eMenuId,
        accountId: baseForm.accountId,
        region: baseForm.region ?? null,
      });
      toast.success('拨测新建成功');
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message || '新建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestDubbo = async () => {
    const pt = parseJsonField(dubboParamTypes, '参数类型');
    const dp = parseJsonField(dubboParams, '参数');
    if (!pt.ok || !dp.ok) {
      toast.error(pt.err || dp.err);
      return;
    }
    if (!dubboApplicationName.trim() || !dubboInterface.trim() || !dubboMethod.trim()) {
      toast.error('请先填写后端应用名称、接口名称、方法名称');
      return;
    }
    setDubboTestLoading(true);
    try {
      const data = {
        environment: 'PROD',
        applicationName: dubboApplicationName.trim(),
        interfaceName: dubboInterface.trim(),
        methodName: dubboMethod.trim(),
        paramTypes: pt.data ?? [],
        params: dp.data ?? [],
        siteTenant: dubboSiteTenant.trim() || '',
      };
      const response = await invokeDubbo(data);
      const text = JSON.stringify(response, null, 2);
      const status = (response as { code?: number })?.code;
      const ok = status === 200 || status === 0;
      toast.success(ok ? 'DUBBO 测试成功' : 'DUBBO 测试完成');
      alert(`测试结果\n\n${text}`);
    } catch (e) {
      toast.error((e as Error).message || 'DUBBO 测试失败');
      alert(`测试失败: ${(e as Error).message}`);
    } finally {
      setDubboTestLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setBaseForm(defaultBaseForm);
      setWebUrl('');
      setLlmWebUrl('');
      setLlmTask('');
      setApiUrl('');
      setDubboApplicationName('');
      setDubboInterface('');
      setDubboMethod('');
      setDubboParamTypes('');
      setDubboParams('');
      setDubboSiteTenant('');
      setTextCode('');
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">新建拨测</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
          {/* 基础信息 */}
          <h4 className="text-sm font-semibold text-gray-700">基础信息</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>描述 <span className="text-red-500">*</span></Label>
              <Input
                value={baseForm.description}
                onChange={(e) => setBaseForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="请输入"
              />
            </div>
            <div className="space-y-2">
              <Label>优先级 <span className="text-red-500">*</span></Label>
              <Select
                value={String(baseForm.priority)}
                onValueChange={(v) => setBaseForm((f) => ({ ...f, priority: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>拨测类型 <span className="text-red-500">*</span></Label>
              <Select
                value={currentType}
                onValueChange={(v) => setBaseForm((f) => ({ ...f, dialingType: v }))}
                disabled={handleDialingTypeDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEB">WEB</SelectItem>
                  <SelectItem value="LLM-WEB">LLM-WEB</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="PLAYWRIGHT">PLAYWRIGHT</SelectItem>
                  <SelectItem value="DUBBO">DUBBO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>应用 <span className="text-red-500">*</span></Label>
              <Select value={baseForm.appCode} onValueChange={(v) => setBaseForm((f) => ({ ...f, appCode: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {APP_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>菜单 <span className="text-red-500">*</span></Label>
              <MenuTreeSelect
                value={baseForm.e2eMenuId || ''}
                onValueChange={(v) => {
                  setBaseForm((f) => ({ ...f, e2eMenuId: v }));
                  setUrlFromMenu(v);
                }}
                options={menuOptions}
                placeholder="请选择"
                emptyText="暂无菜单"
                contentClassName="z-[110]"
              />
            </div>
            <div className="space-y-2">
              <Label>账号 <span className="text-red-500">*</span></Label>
              <Select
                value={baseForm.accountId || 'none'}
                onValueChange={(v) => setBaseForm((f) => ({ ...f, accountId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">请选择</SelectItem>
                  {accountOptions.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.accountTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 拨测地区 */}
          {showRegion && (
            <div className="space-y-2">
              <Label>拨测地区</Label>
              <Select
                value={baseForm.region ?? 'cn-beijing'}
                onValueChange={(v) => setBaseForm((f) => ({ ...f, region: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="国内（默认）" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* WEB 指令 */}
          {currentType === 'WEB' && baseForm.e2eMenuId && (
            <>
              <h4 className="text-sm font-semibold text-gray-700">WEB指令</h4>
              <div className="space-y-2">
                <Label>Url <span className="text-red-500">*</span></Label>
                <Input
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="请输入拨测页面 URL"
                />
              </div>
            </>
          )}

          {/* LLM-WEB 指令 */}
          {currentType === 'LLM-WEB' && baseForm.e2eMenuId && (
            <>
              <h4 className="text-sm font-semibold text-gray-700">LLM-WEB指令</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Url <span className="text-red-500">*</span></Label>
                  <Input value={llmWebUrl} readOnly className="bg-gray-50" placeholder="选择菜单后自动填充" />
                </div>
                <div className="space-y-2">
                  <Label>任务描述 <span className="text-red-500">*</span></Label>
                  <Input
                    value={llmTask}
                    onChange={(e) => setLlmTask(e.target.value)}
                    placeholder="请输入任务描述"
                  />
                </div>
              </div>
            </>
          )}

          {/* API 接口配置 */}
          {currentType === 'API' && (
            <>
              <h4 className="text-sm font-semibold text-gray-700">接口配置</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>路径 <span className="text-red-500">*</span></Label>
                  <Input
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="请输入接口路径，以/开头"
                  />
                </div>
                <div className="space-y-2">
                  <Label>请求方法 <span className="text-red-500">*</span></Label>
                  <Select value={apiMethod} onValueChange={setApiMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {API_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>请求头 <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={apiHeaders}
                    onChange={(e) => setApiHeaders(e.target.value)}
                    placeholder="请输入headers，格式为 {&quot;key1&quot;:&quot;value1&quot;}"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Params</Label>
                  <Textarea
                    value={apiParams}
                    onChange={(e) => setApiParams(e.target.value)}
                    placeholder="请输入请求参数，格式为 {&quot;key1&quot;:&quot;value1&quot;}"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  placeholder="请输入请求体，格式为 {&quot;key1&quot;:&quot;value1&quot;}"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </>
          )}

          {/* DUBBO 配置 */}
          {currentType === 'DUBBO' && (
            <>
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">Dubbo配置</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">拨测环境：生产</span>
                  <span className="text-xs text-gray-500">调试环境：主测</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleTestDubbo}
                    disabled={dubboTestLoading || !dubboApplicationName?.trim() || !dubboInterface?.trim() || !dubboMethod?.trim() || !dubboParamTypes?.trim() || !dubboParams?.trim() || !dubboSiteTenant?.trim()}
                  >
                    {dubboTestLoading ? '测试中...' : '立即测试'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>后端应用名称 <span className="text-red-500">*</span></Label>
                  <Input
                    value={dubboApplicationName}
                    onChange={(e) => setDubboApplicationName(e.target.value)}
                    placeholder="请输入 applicationName"
                  />
                </div>
                <div className="space-y-2">
                  <Label>接口名称 <span className="text-red-500">*</span></Label>
                  <Input
                    value={dubboInterface}
                    onChange={(e) => setDubboInterface(e.target.value)}
                    placeholder="请输入 interfaceName"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>方法名称 <span className="text-red-500">*</span></Label>
                  <Input
                    value={dubboMethod}
                    onChange={(e) => setDubboMethod(e.target.value)}
                    placeholder="请输入 methodName"
                  />
                </div>
                <div className="space-y-2">
                  <Label>参数类型 <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={dubboParamTypes}
                    onChange={(e) => setDubboParamTypes(e.target.value)}
                    placeholder="如 [&quot;java.lang.String&quot;,&quot;java.lang.Integer&quot;]"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>参数 <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={dubboParams}
                    onChange={(e) => setDubboParams(e.target.value)}
                    placeholder="如 [{&quot;key1&quot;:&quot;value1&quot;}]"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>站点 <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={dubboSiteTenant}
                    onChange={(e) => setDubboSiteTenant(e.target.value)}
                    placeholder="如 'US_AMZ'"
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* PLAYWRIGHT 脚本配置 */}
          {currentType === 'PLAYWRIGHT' && (
            <>
              <h4 className="text-sm font-semibold text-gray-700">脚本配置</h4>
              <div className="border rounded-lg overflow-hidden" style={{ minHeight: 200 }}>
                <Editor
                  height="200px"
                  defaultLanguage="python"
                  value={textCode}
                  onChange={(v) => setTextCode(v ?? '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </>
          )}

          {/* 告警配置 */}
          <h4 className="text-sm font-semibold text-gray-700">告警配置</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>openId <span className="text-red-500">*</span></Label>
              <Input
                value={baseForm.openId}
                onChange={(e) => setBaseForm((f) => ({ ...f, openId: e.target.value }))}
                placeholder="请输入"
              />
            </div>
            <div className="space-y-2">
              <Label>通知人 <span className="text-red-500">*</span></Label>
              <Input
                value={baseForm.userName}
                onChange={(e) => setBaseForm((f) => ({ ...f, userName: e.target.value }))}
                placeholder="请输入通知邮箱"
              />
            </div>
          </div>

          {/* 监听配置 */}
          {showListenConfig && (
            <>
              <h4 className="text-sm font-semibold text-gray-700">监听配置</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>response</Label>
                  <RadioGroup
                    value={baseForm.response ? 'true' : 'false'}
                    onValueChange={(v) => setBaseForm((f) => ({ ...f, response: v === 'true' }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="response-yes" />
                      <Label htmlFor="response-yes" className="font-normal cursor-pointer">是</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="response-no" />
                      <Label htmlFor="response-no" className="font-normal cursor-pointer">否</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>控制台</Label>
                  <RadioGroup
                    value={baseForm.console ? 'true' : 'false'}
                    onValueChange={(v) => setBaseForm((f) => ({ ...f, console: v === 'true' }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="console-yes" />
                      <Label htmlFor="console-yes" className="font-normal cursor-pointer">是</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="console-no" />
                      <Label htmlFor="console-no" className="font-normal cursor-pointer">否</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>元素检测</Label>
                  <RadioGroup
                    value={baseForm.element_error ? 'true' : 'false'}
                    onValueChange={(v) => setBaseForm((f) => ({ ...f, element_error: v === 'true' }))}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="el-yes" />
                      <Label htmlFor="el-yes" className="font-normal cursor-pointer">是</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="el-no" />
                      <Label htmlFor="el-no" className="font-normal cursor-pointer">否</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
