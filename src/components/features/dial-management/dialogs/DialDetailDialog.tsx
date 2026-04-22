/**
 * 拨测详情 - 1:1 还原 spotter-aegislm DialDetail.vue
 * 右侧抽屉，Tab：基础信息、执行结果、Network、Console、Performance；支持在抽屉内编辑
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { dialApi, menuApi, accountApi } from '@/services/dial-management';
import type { MenuItem } from '@/services/dial-management';
import type { AccountItem } from '@/services/dial-management';
import { toast } from 'sonner';
import { AlertCircle, FileQuestion, Inbox } from 'lucide-react';
import { APP_OPTIONS } from '../constants';
import { MenuTreeSelect } from '../MenuTreeSelect';

const PRIORITY_OPTIONS = [
  { value: 0, label: '低' },
  { value: 1, label: '中' },
  { value: 2, label: '高' },
];
const DIALING_TYPES = ['WEB', 'LLM-WEB', 'API', 'PLAYWRIGHT', 'DUBBO'];

const REGION_OPTIONS = [
  { value: 'cn-beijing', label: '国内（默认）' },
  { value: 'us-west-1', label: '美国硅谷' },
] as const;

const API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

const TRACE_BASE = 'https://spotter-e2e.spotter.ink';
const TRACE_VIEWER = 'https://trace.playwright.dev/?trace=';

export interface DialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logId: string | number | null;
  detailForm: Record<string, unknown> | null;
  /** 为 true 时以编辑模式打开，为 false 时以只读详情打开（默认 false） */
  initialEditing?: boolean;
  /** 编辑保存后刷新列表 */
  onSuccess?: () => void;
}

function getFeatures(obj: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
  const f = obj?.features;
  return f && typeof f === 'object' ? (f as Record<string, unknown>) : undefined;
}

/** 北京时间格式化（与原项目一致：timestamp 加 8 小时再格式化） */
function timestampToBeijingTime(timestamp: number): string {
  const date = new Date(timestamp);
  date.setTime(date.getTime() + 8 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatUpdatedAt(value: unknown): string {
  if (value == null) return '';
  const timestamp = typeof value === 'string' ? Date.parse(value) : Number(value);
  if (!Number.isFinite(timestamp)) return '';
  return timestampToBeijingTime(timestamp);
}

function formatTimestampValue(value: number | null): string {
  if (value === null) return '--';
  return timestampToBeijingTime(value);
}

function formatDurationValue(value: number | null): string {
  if (value === null) return '--';
  return `${value} ms`;
}

function parseToDisplay(payload: unknown): string {
  if (payload === null || payload === undefined) return '';
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (!trimmed) return '';
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

interface EditFormState {
  description: string;
  priority: number;
  dialingType: string;
  appCode: string;
  e2eMenuId: string;
  accountId: string;
  region: string | null;
  webUrl: string;
  llmWebUrl: string;
  llmTask: string;
  openId: string;
  userName: string;
  response: boolean;
  console: boolean;
  element_error: boolean;
  apiUrl: string;
  apiMethod: string;
  apiHeaders: string;
  apiParams: string;
  apiBody: string;
  dubboApplicationName: string;
  dubboInterface: string;
  dubboMethod: string;
  dubboParamTypes: string;
  dubboParams: string;
  dubboSiteTenant: string;
  textCode: string;
}

const defaultEditForm: EditFormState = {
  description: '',
  priority: 1,
  dialingType: 'WEB',
  appCode: 'Gmesh',
  e2eMenuId: '',
  accountId: '',
  region: null,
  webUrl: '',
  llmWebUrl: '',
  llmTask: '',
  openId: '',
  userName: '',
  response: true,
  console: false,
  element_error: false,
  apiUrl: '',
  apiMethod: 'GET',
  apiHeaders: '',
  apiParams: '',
  apiBody: '',
  dubboApplicationName: '',
  dubboInterface: '',
  dubboMethod: '',
  dubboParamTypes: '',
  dubboParams: '',
  dubboSiteTenant: '',
  textCode: '',
};

export function DialDetailDialog({ open, onOpenChange, logId, detailForm, initialEditing = false, onSuccess }: DialDetailDialogProps) {
  const [logDetail, setLogDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [menuAllList, setMenuAllList] = useState<MenuItem[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountItem[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const setUrlFromMenu = (menuId: string) => {
    if (!menuId) return;
    const idNum = Number(menuId);
    const menu = menuAllList.find((m) => (typeof m.id === 'number' ? m.id === idNum : String(m.id) === menuId));
    const path = menu?.path ?? (menu as MenuItem & { url?: string })?.url ?? '';
    if (path)
      setEditForm((f) => {
        if (f.dialingType === 'WEB') return { ...f, webUrl: path };
        if (f.dialingType === 'LLM-WEB') return { ...f, llmWebUrl: path };
        return f;
      });
  };

  const logMessage = detailForm ?? {};
  const dialingType = (logMessage?.dialingType ?? getFeatures(logMessage as Record<string, unknown>)?.dialingType ?? '') as string;
  const isDubboOrApi = dialingType === 'DUBBO' || dialingType === 'API';

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      return;
    }
    // 打开时：initialEditing 为 true 进编辑，否则进只读详情
    if (detailForm) {
      setIsEditing(!!initialEditing);
    }
  }, [open, detailForm, initialEditing]);

  useEffect(() => {
    if (isEditing && detailForm) {
      const menu = detailForm.menu as Record<string, unknown> | undefined;
      const account = detailForm.account as Record<string, unknown> | undefined;
      const features = getFeatures(detailForm) as Record<string, unknown> | undefined;
      const alarm = features?.alarmConfig as Record<string, unknown> | undefined;
      const strategy = features?.strategyPattern as Record<string, unknown> | undefined;
      const web = features?.webActions as Record<string, unknown> | undefined;
      const llm = features?.llmActions as Record<string, unknown> | undefined;
      const api = features?.apiActions as Record<string, unknown> | undefined;
      const dubbo = features?.dubboActions as Record<string, unknown> | undefined;
      
      // 菜单 id：兼容 menu.id（number/string）或 detailForm.e2eMenuId
      const menuId = menu?.id != null ? String(menu.id) : (detailForm.e2eMenuId != null ? String(detailForm.e2eMenuId) : '');
      // 账号 id：兼容 account.id（number/string）或 detailForm.accountId
      const accId = account?.id != null ? String(account.id) : (detailForm.accountId != null ? String(detailForm.accountId) : '');
      
      setEditForm({
        ...defaultEditForm,
        description: String(detailForm.description ?? ''),
        priority: Number(detailForm.priority) ?? 1,
        dialingType: String(features?.dialingType ?? detailForm.dialingType ?? 'WEB'),
        appCode: String(detailForm.appCode ?? 'Gmesh'),
        e2eMenuId: menuId,
        accountId: accId,
        region: detailForm.region != null ? String(detailForm.region) : null,
        webUrl: String(web?.url ?? ''),
        llmWebUrl: String(llm?.url ?? ''),
        llmTask: String(llm?.task ?? ''),
        openId: String(alarm?.openId ?? detailForm.openId ?? ''),
        userName: String(alarm?.userName ?? detailForm.userName ?? ''),
        response: !!strategy?.response,
        console: !!strategy?.console,
        element_error: !!strategy?.element_error,
        apiUrl: String(api?.url ?? ''),
        apiMethod: String(api?.method ?? 'GET'),
        apiHeaders: typeof api?.headers === 'object' ? JSON.stringify(api.headers, null, 2) : String(api?.headers ?? ''),
        apiParams: typeof api?.params === 'object' ? JSON.stringify(api.params, null, 2) : String(api?.params ?? ''),
        apiBody: typeof api?.body === 'object' ? JSON.stringify(api.body, null, 2) : String(api?.body ?? ''),
        dubboApplicationName: String(dubbo?.applicationName ?? ''),
        dubboInterface: String(dubbo?.interfaceName ?? ''),
        dubboMethod: String(dubbo?.methodName ?? ''),
        dubboParamTypes: Array.isArray(dubbo?.paramTypes) ? JSON.stringify(dubbo.paramTypes, null, 2) : String(dubbo?.paramTypes ?? ''),
        dubboParams: Array.isArray(dubbo?.params) ? JSON.stringify(dubbo.params, null, 2) : (typeof dubbo?.params === 'object' ? JSON.stringify(dubbo.params, null, 2) : String(dubbo?.params ?? '')),
        dubboSiteTenant: String(dubbo?.siteTenant ?? ''),
        textCode: String(detailForm.textCode ?? ''),
      });
    }
  }, [isEditing, detailForm]);

  useEffect(() => {
    if (!isEditing || !editForm.appCode) return;
    const app = editForm.appCode;
    menuApi.page({ appCode: app, pageSize: 9999, currentPage: 1 }).then((res) => {
      const raw = res && typeof res === 'object' && 'data' in res ? (res as any).data : null;
      const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : []) ?? [];
      const menuList = Array.isArray(list) ? (list as MenuItem[]) : [];
      // 确保所有 id 都是 string（API 可能返回 number）
      const normalizeId = (item: MenuItem): MenuItem => ({
        ...item,
        id: String(item.id),
        children: item.children?.map(normalizeId),
      });
      const normalized = menuList.map(normalizeId);
      setMenuTree(normalized);
      const flatten = (items: MenuItem[]): MenuItem[] => items.flatMap((item) => [item].concat(item.children?.length ? flatten(item.children) : []));
      setMenuAllList(flatten(normalized));
    });
    accountApi.page({ currentPage: 1, pageSize: 999, appCode: app, accountTitle: '' }).then((res) => {
      const raw = res && typeof res === 'object' && 'data' in res ? (res as any).data : null;
      const data = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : []) ?? [];
      setAccountOptions(Array.isArray(data) ? data : []);
    });
  }, [isEditing, editForm.appCode]);

  const parseJson = (value: string, name: string): { ok: boolean; data?: unknown; err?: string } => {
    if (!value?.trim()) return { ok: true, data: undefined };
    try {
      return { ok: true, data: JSON.parse(value) };
    } catch {
      return { ok: false, err: `${name} 必须是有效 JSON` };
    }
  };

  const handleEditSave = async () => {
    if (!detailForm?.id) return;
    if (!editForm.description?.trim() || !editForm.appCode) {
      toast.error('请填写描述、应用');
      return;
    }
    const type = editForm.dialingType;
    if (type === 'WEB' && !editForm.webUrl?.trim()) {
      toast.error('请填写 Url');
      return;
    }
    if (type === 'LLM-WEB' && (!editForm.llmWebUrl?.trim() || !editForm.llmTask?.trim())) {
      toast.error('请填写 Url 和任务描述');
      return;
    }
    if (type === 'API') {
      const h = parseJson(editForm.apiHeaders, '请求头');
      if (!h.ok) {
        toast.error(h.err);
        return;
      }
    }
    if (type === 'DUBBO') {
      const pt = parseJson(editForm.dubboParamTypes, '参数类型');
      const dp = parseJson(editForm.dubboParams, '参数');
      if (!pt.ok || !dp.ok) {
        toast.error(pt.err || dp.err);
        return;
      }
    }
    setEditSubmitting(true);
    try {
      const baseFeatures: Record<string, unknown> = {
        dialingType: type,
        alarmConfig: { openId: editForm.openId?.trim() ?? '', userName: editForm.userName?.trim() ?? '' },
        strategyPattern: {
          request: false,
          response: type === 'WEB' || type === 'LLM-WEB' || type === 'PLAYWRIGHT' ? editForm.response : false,
          console: type === 'WEB' || type === 'LLM-WEB' || type === 'PLAYWRIGHT' ? editForm.console : false,
          element_error: type === 'WEB' || type === 'LLM-WEB' || type === 'PLAYWRIGHT' ? editForm.element_error : false,
          validation: {},
        },
      };
      if (type === 'WEB') {
        baseFeatures.webActions = { url: editForm.webUrl.trim() };
      } else if (type === 'LLM-WEB') {
        baseFeatures.llmActions = { url: editForm.llmWebUrl.trim(), task: editForm.llmTask.trim(), actions: [] };
      } else if (type === 'API') {
        baseFeatures.apiActions = {
          url: editForm.apiUrl.trim(),
          method: editForm.apiMethod,
          headers: parseJson(editForm.apiHeaders, '请求头').data ?? {},
          params: parseJson(editForm.apiParams, 'Params').data ?? {},
          body: parseJson(editForm.apiBody, 'Body').data ?? {},
        };
      } else if (type === 'DUBBO') {
        baseFeatures.dubboActions = {
          environment: 'PROD',
          applicationName: editForm.dubboApplicationName.trim(),
          interfaceName: editForm.dubboInterface.trim(),
          methodName: editForm.dubboMethod.trim(),
          paramTypes: parseJson(editForm.dubboParamTypes, '参数类型').data ?? [],
          params: parseJson(editForm.dubboParams, '参数').data ?? [],
          siteTenant: editForm.dubboSiteTenant.trim(),
        };
      } else if (type === 'PLAYWRIGHT') {
        baseFeatures.scriptActions = {};
      }
      await dialApi.modify({
        id: detailForm.id,
        description: editForm.description.trim(),
        testPrompt: detailForm.testPrompt ?? {},
        priority: editForm.priority,
        textCode: type === 'PLAYWRIGHT' ? editForm.textCode : (detailForm.textCode ?? ''),
        features: baseFeatures,
        isActive: detailForm.isActive ?? 1,
        appCode: editForm.appCode,
        userId: detailForm.userId ?? '',
        e2eMenuId: editForm.e2eMenuId || undefined,
        accountId: editForm.accountId || undefined,
        region: editForm.region ?? undefined,
      });
      toast.success('保存成功');
      onSuccess?.();
      setIsEditing(false);
    } catch (e) {
      toast.error((e as Error).message || '保存失败');
    } finally {
      setEditSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open || !logId) {
      setLogDetail(null);
      return;
    }
    setLoading(true);
    dialApi
      .planLog({
        currentPage: 1,
        pageSize: 1,
        id: 0,
        dialingTestId: Number(logId),
        dialingPlanId: 0,
      })
      .then((res: any) => {
        // 兼容多种返回结构：res.data 为数组 / res 为数组 / res.data.data 为数组（未解包时）
        let raw: Record<string, unknown> | null = null;
        if (Array.isArray(res?.data) && res.data.length > 0) raw = res.data[0] as Record<string, unknown>;
        else if (Array.isArray(res) && res.length > 0) raw = res[0] as Record<string, unknown>;
        else if (Array.isArray(res?.data?.data) && res.data.data.length > 0) raw = res.data.data[0] as Record<string, unknown>;
        else if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.data?.[0]) raw = res.data.data[0] as Record<string, unknown>;
        else if (res?.code === 200 && res?.data?.data?.[0]) raw = res.data.data[0] as Record<string, unknown>;

        if (raw && typeof raw === 'object') {
          if (Array.isArray(raw.network)) {
            raw = {
              ...raw,
              network: raw.network.map((item: Record<string, unknown>) => {
                if (item?.timing && typeof item.timing === 'object') {
                  return { ...item, ...(item.timing as object) };
                }
                return item;
              }),
            };
          }
          setLogDetail({
            ...raw,
            screenShot: (raw as any).trace?.screenShot ?? (raw as any).screenShot ?? '',
            tracePath: (raw as any).trace?.tracePath ?? (raw as any).tracePath ?? '',
          });
        } else {
          setLogDetail(null);
        }
      })
      .catch((e) => {
        toast.error((e as Error).message || '获取拨测详情失败');
        setLogDetail(null);
      })
      .finally(() => setLoading(false));
  }, [open, logId]);

  const features = getFeatures(logMessage as Record<string, unknown>);
  const alarmConfig = features?.alarmConfig as Record<string, unknown> | undefined;
  const detailFeatures = (logDetail?.features as Record<string, unknown>) ?? {};

  const firstNetworkEntry = useMemo(() => {
    const network = logDetail?.network;
    if (Array.isArray(network) && network.length > 0) return network[0] as Record<string, unknown>;
    return null;
  }, [logDetail?.network]);

  const responseTimeValue = useMemo(() => {
    const direct = Number(logDetail?.responseTime);
    if (Number.isFinite(direct)) return direct;
    const networkVal = Number(firstNetworkEntry?.responseTime);
    if (Number.isFinite(networkVal)) return networkVal;
    const featVal = Number((logDetail?.features as Record<string, unknown>)?.responseTime);
    if (Number.isFinite(featVal)) return featVal;
    return 0;
  }, [logDetail?.responseTime, logDetail?.features, firstNetworkEntry?.responseTime]);

  const responseTimeTagType = useMemo(() => {
    if (responseTimeValue < 1000) return 'success';
    if (responseTimeValue <= 2000) return 'warning';
    return 'danger';
  }, [responseTimeValue]);

  const responseResultText = useMemo(() => {
    const detail = logDetail ?? {};
    const networkContent = firstNetworkEntry?.responseContent;
    if (networkContent) {
      const text = parseToDisplay(networkContent);
      if (text) return text;
    }
    const candidates = [
      detail.responseContent,
      detail.responseResult,
      detail.response,
      detail.result,
      (detail.features as Record<string, unknown>)?.response,
      (detail.features as Record<string, unknown>)?.result,
      (detail.features as Record<string, unknown>)?.responseBody,
      (detail.features as Record<string, unknown>)?.responseData,
    ];
    for (const c of candidates) {
      const text = parseToDisplay(c);
      if (text) return text;
    }
    return '暂无响应结果';
  }, [logDetail, firstNetworkEntry?.responseContent]);

  const executionStatusLabel = useMemo(() => {
    if (isDubboOrApi && !logDetail?.dialingStatus) return '无';
    return String(logDetail?.dialingStatus ?? '');
  }, [isDubboOrApi, logDetail?.dialingStatus]);

  const executionTimeLabel = useMemo(() => {
    if (isDubboOrApi && !logDetail?.updatedAt) return '无';
    return formatUpdatedAt(logDetail?.updatedAt);
  }, [isDubboOrApi, logDetail?.updatedAt]);

  const toNumber = (raw: unknown): number | null => {
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  };
  const duration = (end: unknown, start: unknown): number | null => {
    const endNum = toNumber(end);
    const startNum = toNumber(start);
    if (endNum === null || startNum === null) return null;
    const result = endNum - startNum;
    return Number.isFinite(result) ? result : null;
  };

  const statisticMetrics = useMemo(() => ({
    navigationStart: toNumber(detailFeatures.navigationStart),
    domainTime: duration(detailFeatures.domainLookupEnd, detailFeatures.domainLookupStart),
    connectTime: duration(detailFeatures.connectEnd, detailFeatures.connectStart),
    requestTime: duration(detailFeatures.responseStart, detailFeatures.requestStart),
    domInteractive: toNumber(detailFeatures.domInteractive),
    domContentLoadedEventEnd: toNumber(detailFeatures.domContentLoadedEventEnd),
  }), [detailFeatures]);

  const networkList = Array.isArray(logDetail?.network) ? (logDetail.network as Record<string, unknown>[]) : [];
  const hasLogDetail = logDetail != null && Object.keys(logDetail).length > 0;

  function EmptyState({ icon: Icon = Inbox, title, desc }: { icon?: React.ComponentType<{ className?: string }>; title: string; desc?: string }) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Icon className="size-10 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {desc && <p className="text-xs text-gray-500 mt-1.5 max-w-[240px] text-center">{desc}</p>}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`flex flex-col gap-0 p-0 bg-white border-l border-gray-200/80 ${isEditing ? '!w-full sm:!max-w-[28rem]' : '!w-[40vw] sm:!max-w-[40vw]'}`}
        showCloseButton={true}
      >
        <SheetHeader className="border-b border-gray-200/80 bg-white/95 backdrop-blur px-6 py-4 shrink-0 flex flex-row items-center justify-between gap-4 shadow-sm">
          <SheetTitle className="text-lg font-semibold text-gray-900 truncate pr-4">
            {isEditing ? '编辑拨测' : String(logMessage?.description ?? '拨测详情')}
          </SheetTitle>
          {isEditing ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>取消</Button>
              <Button size="sm" onClick={handleEditSave} disabled={editSubmitting}>
                {editSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setIsEditing(true)}>
              编辑
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
          {isEditing ? (
            <div className="flex-1 overflow-auto px-6 py-5">
              <div className="grid gap-5 w-full max-w-full rounded-2xl bg-white p-5 border border-gray-100 shadow-sm">
                <div className="space-y-2">
                  <Label>描述</Label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="请输入"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>优先级</Label>
                    <Select
                      value={String(editForm.priority)}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, priority: Number(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>拨测类型</Label>
                    <Select
                      value={editForm.dialingType}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, dialingType: v }))}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {DIALING_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>应用</Label>
                  <Select value={editForm.appCode} onValueChange={(v) => setEditForm((f) => ({ ...f, appCode: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      {APP_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>菜单</Label>
                  <MenuTreeSelect
                    value={editForm.e2eMenuId || ''}
                    onValueChange={(v) => {
                      setEditForm((f) => ({ ...f, e2eMenuId: v }));
                      setUrlFromMenu(v);
                    }}
                    options={menuTree}
                    placeholder="请选择"
                    emptyText="暂无菜单"
                    contentClassName="z-[100]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>账号</Label>
                  <Select value={editForm.accountId || 'none'} onValueChange={(v) => setEditForm((f) => ({ ...f, accountId: v === 'none' ? '' : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="none">无</SelectItem>
                      {accountOptions.map((acc) => (
                        <SelectItem key={String(acc.id)} value={String(acc.id)}>{acc.accountTitle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(editForm.dialingType === 'WEB' || editForm.dialingType === 'LLM-WEB' || editForm.dialingType === 'PLAYWRIGHT') && (
                  <div className="space-y-2">
                    <Label>拨测地区</Label>
                    <Select
                      value={editForm.region ?? 'cn-beijing'}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, region: v || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="国内（默认）" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {REGION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editForm.dialingType === 'WEB' && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 pt-2">WEB 指令</h4>
                    <div className="space-y-2">
                      <Label>Url</Label>
                      <Input
                        value={editForm.webUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, webUrl: e.target.value }))}
                        placeholder="拨测页面 URL"
                      />
                    </div>
                  </>
                )}

                {editForm.dialingType === 'LLM-WEB' && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 pt-2">LLM-WEB 指令</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Url</Label>
                        <Input value={editForm.llmWebUrl} readOnly className="bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>任务描述</Label>
                        <Input
                          value={editForm.llmTask}
                          onChange={(e) => setEditForm((f) => ({ ...f, llmTask: e.target.value }))}
                          placeholder="任务描述"
                        />
                      </div>
                    </div>
                  </>
                )}

                {editForm.dialingType === 'API' && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 pt-2">接口配置</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>路径</Label>
                        <Input value={editForm.apiUrl} onChange={(e) => setEditForm((f) => ({ ...f, apiUrl: e.target.value }))} placeholder="/api/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>请求方法</Label>
                        <Select value={editForm.apiMethod} onValueChange={(v) => setEditForm((f) => ({ ...f, apiMethod: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="z-[100]">
                            {API_METHODS.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>请求头 (JSON)</Label>
                      <Textarea value={editForm.apiHeaders} onChange={(e) => setEditForm((f) => ({ ...f, apiHeaders: e.target.value }))} rows={2} placeholder='{"key":"value"}' className="font-mono text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Params (JSON)</Label>
                        <Textarea value={editForm.apiParams} onChange={(e) => setEditForm((f) => ({ ...f, apiParams: e.target.value }))} rows={2} placeholder='{}' className="font-mono text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label>Body (JSON)</Label>
                        <Textarea value={editForm.apiBody} onChange={(e) => setEditForm((f) => ({ ...f, apiBody: e.target.value }))} rows={2} placeholder='{}' className="font-mono text-sm" />
                      </div>
                    </div>
                  </>
                )}

                {editForm.dialingType === 'DUBBO' && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 pt-2">Dubbo 配置</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>后端应用名称</Label>
                        <Input value={editForm.dubboApplicationName} onChange={(e) => setEditForm((f) => ({ ...f, dubboApplicationName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>接口名称</Label>
                        <Input value={editForm.dubboInterface} onChange={(e) => setEditForm((f) => ({ ...f, dubboInterface: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>方法名称</Label>
                        <Input value={editForm.dubboMethod} onChange={(e) => setEditForm((f) => ({ ...f, dubboMethod: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>站点</Label>
                        <Input value={editForm.dubboSiteTenant} onChange={(e) => setEditForm((f) => ({ ...f, dubboSiteTenant: e.target.value }))} placeholder="如 US_AMZ" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>参数类型 (JSON 数组)</Label>
                        <Textarea value={editForm.dubboParamTypes} onChange={(e) => setEditForm((f) => ({ ...f, dubboParamTypes: e.target.value }))} rows={2} placeholder='["java.lang.String"]' className="font-mono text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label>参数 (JSON)</Label>
                        <Textarea value={editForm.dubboParams} onChange={(e) => setEditForm((f) => ({ ...f, dubboParams: e.target.value }))} rows={2} placeholder='[]' className="font-mono text-sm" />
                      </div>
                    </div>
                  </>
                )}

                {editForm.dialingType === 'PLAYWRIGHT' && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 pt-2">脚本配置</h4>
                    <div className="space-y-2">
                      <Label>Python 代码</Label>
                      <Textarea value={editForm.textCode} onChange={(e) => setEditForm((f) => ({ ...f, textCode: e.target.value }))} rows={8} placeholder="请输入 Python 代码..." className="font-mono text-sm" />
                    </div>
                  </>
                )}

                <h4 className="text-sm font-semibold text-gray-700 pt-2 border-t border-gray-100 mt-4 pt-4">告警配置</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>openId</Label>
                    <Input value={editForm.openId} onChange={(e) => setEditForm((f) => ({ ...f, openId: e.target.value }))} placeholder="openId" />
                  </div>
                  <div className="space-y-2">
                    <Label>通知人</Label>
                    <Input value={editForm.userName} onChange={(e) => setEditForm((f) => ({ ...f, userName: e.target.value }))} placeholder="通知邮箱" />
                  </div>
                </div>

                {(editForm.dialingType === 'WEB' || editForm.dialingType === 'LLM-WEB' || editForm.dialingType === 'PLAYWRIGHT') && (
                  <>
                    <h4 className="text-sm font-semibold text-gray-700 pt-2">监听配置</h4>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Label className="font-normal text-sm">response</Label>
                        <RadioGroup value={editForm.response ? 'yes' : 'no'} onValueChange={(v) => setEditForm((f) => ({ ...f, response: v === 'yes' }))} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="edit-response-yes" />
                            <Label htmlFor="edit-response-yes" className="font-normal cursor-pointer">是</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="edit-response-no" />
                            <Label htmlFor="edit-response-no" className="font-normal cursor-pointer">否</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="font-normal text-sm">控制台</Label>
                        <RadioGroup value={editForm.console ? 'yes' : 'no'} onValueChange={(v) => setEditForm((f) => ({ ...f, console: v === 'yes' }))} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="edit-console-yes" />
                            <Label htmlFor="edit-console-yes" className="font-normal cursor-pointer">是</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="edit-console-no" />
                            <Label htmlFor="edit-console-no" className="font-normal cursor-pointer">否</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="font-normal text-sm">元素检测</Label>
                        <RadioGroup value={editForm.element_error ? 'yes' : 'no'} onValueChange={(v) => setEditForm((f) => ({ ...f, element_error: v === 'yes' }))} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="edit-el-yes" />
                            <Label htmlFor="edit-el-yes" className="font-normal cursor-pointer">是</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="edit-el-no" />
                            <Label htmlFor="edit-el-no" className="font-normal cursor-pointer">否</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
          <Tabs defaultValue="base" className="flex-1 flex flex-col min-h-0 px-6 pt-4 pb-6">
            <TabsList className="w-full justify-start flex-shrink-0 h-11 bg-white/80 border border-gray-200/80 rounded-xl p-1.5 shadow-sm">
              <TabsTrigger value="base" className="rounded-lg px-5 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">基础信息</TabsTrigger>
              {!isDubboOrApi && (
                <>
                  <TabsTrigger value="network" className="rounded-lg px-5 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Network</TabsTrigger>
                  <TabsTrigger value="console" className="rounded-lg px-5 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Console</TabsTrigger>
                  <TabsTrigger value="performance" className="rounded-lg px-5 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Performance</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="base" className="flex-1 overflow-auto mt-5 data-[state=inactive]:hidden">
              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <dl className="grid grid-cols-[120px_1fr] gap-y-3.5 text-sm">
                    <dt className="text-gray-500 font-medium">拨测类型</dt>
                    <dd className="text-gray-900">{String(dialingType || '-')}</dd>
                    <dt className="text-gray-500 font-medium">应用</dt>
                    <dd className="text-gray-900">{String(logMessage?.appCode ?? '-')}</dd>
                    <dt className="text-gray-500 font-medium">账号</dt>
                    <dd className="text-gray-900">{String(logMessage?.accountName ?? '-')}</dd>
                    <dt className="text-gray-500 font-medium">菜单</dt>
                    <dd className="text-gray-900">{String(logMessage?.menuName ?? '-')}</dd>
                    <dt className="text-gray-500 font-medium">OpenID</dt>
                    <dd className="text-gray-900 break-all">{String(alarmConfig?.openId ?? '-')}</dd>
                    <dt className="text-gray-500 font-medium">通知人</dt>
                    <dd className="text-gray-900">{String(alarmConfig?.userName ?? '-')}</dd>
                    {dialingType === 'WEB' && (
                      <>
                        <dt className="text-gray-500 font-medium">URL</dt>
                        <dd className="text-gray-900 break-all">{(features?.webActions as any)?.url ?? '-'}</dd>
                      </>
                    )}
                    {dialingType === 'LLM-WEB' && (
                      <>
                        <dt className="text-gray-500 font-medium">Url</dt>
                        <dd className="text-gray-900 break-all">{(features?.llmActions as any)?.url ?? '-'}</dd>
                        <dt className="text-gray-500 font-medium">任务描述</dt>
                        <dd className="text-gray-900">{(features?.llmActions as any)?.task ?? '-'}</dd>
                      </>
                    )}
                  </dl>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                  <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50/60">
                    <h3 className="text-sm font-semibold text-gray-800">执行结果</h3>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <p className="text-gray-500 text-sm py-4">加载中...</p>
                    ) : !hasLogDetail ? (
                      <EmptyState
                        icon={FileQuestion}
                        title="暂无执行记录"
                        desc="请先执行拨测配置，执行后将在此展示结果与截图"
                      />
                    ) : (
                      <div className="space-y-4">
                        <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                          <dt className="text-gray-500 font-medium">拨测结果</dt>
                          <dd>
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
                                logDetail?.dialingStatus === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {executionStatusLabel || '-'}
                            </span>
                          </dd>
                          <dt className="text-gray-500 font-medium">最近一次拨测时间</dt>
                          <dd className="text-gray-900">{executionTimeLabel || '-'}</dd>
                          {isDubboOrApi ? (
                            <>
                              <dt className="text-gray-500 font-medium">响应时间</dt>
                              <dd>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
                                    responseTimeTagType === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                    responseTimeTagType === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {responseTimeValue} ms
                                </span>
                              </dd>
                            </>
                          ) : (
                            <>
                              <dt className="text-gray-500 font-medium">Trace 地址</dt>
                              <dd>
                                {(logDetail as any)?.tracePath ? (
                                  <a
                                    href={`${TRACE_VIEWER}${TRACE_BASE}/${(logDetail as any).tracePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium"
                                  >
                                    Trace 详情
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </dd>
                            </>
                          )}
                        </dl>
                        {isDubboOrApi ? (
                          <div className="mt-4 p-4 rounded-lg bg-gray-50/80 max-h-[320px] overflow-auto border border-gray-100">
                            <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-all m-0">
                              {responseResultText}
                            </pre>
                          </div>
                        ) : (logDetail as any)?.screenShot ? (
                          <div className="mt-4 w-full min-w-0">
                            <img
                              src={`${TRACE_BASE}/${(logDetail as any).screenShot}`}
                              alt="截图"
                              className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-gray-100"
                            />
                          </div>
                        ) : (
                          <div className="mt-4 py-6 text-center text-sm text-gray-400">暂无截图</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {!isDubboOrApi && (
              <>
                <TabsContent value="network" className="flex-1 overflow-auto mt-5 data-[state=inactive]:hidden">
                  {dialingType === 'WEB' && networkList.length > 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                      <TooltipProvider>
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                            <TableHead className="font-medium min-w-0 w-[calc(45%+50px)]">URL</TableHead>
                            <TableHead className="font-medium w-[4rem] whitespace-nowrap text-right pr-2">状态</TableHead>
                            <TableHead className="font-medium w-[5.5rem] whitespace-nowrap text-right pl-0">响应时间(ms)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {networkList.map((row: Record<string, unknown>, idx: number) => {
                            const urlStr = String(row.url ?? '-');
                            return (
                            <TableRow key={idx} className="hover:bg-gray-50/50">
                              <TableCell className="font-mono text-xs max-w-0 w-[calc(45%+50px)] min-w-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate cursor-default" title={urlStr}>{urlStr}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[80vw]">
                                    <pre className="text-xs font-mono whitespace-pre-wrap break-all m-0">{urlStr}</pre>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="w-[4rem] whitespace-nowrap text-right pr-2">
                                <span
                                  className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                                    row.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {String(row.status ?? '-')}
                                </span>
                              </TableCell>
                              <TableCell className="w-[5.5rem] whitespace-nowrap text-right pl-0">
                                {(() => {
                                  const rt = Number(row.responseTime);
                                  const type = rt < 500 ? 'success' : rt <= 2000 ? 'warning' : 'danger';
                                  return (
                                    <span
                                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                                        type === 'success' ? 'bg-green-100 text-green-800' :
                                        type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {Number.isFinite(rt) ? rt : '-'} ms
                                    </span>
                                  );
                                })()}
                              </TableCell>
                            </TableRow>
                          );
                          })}
                        </TableBody>
                      </Table>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <EmptyState
                      icon={Inbox}
                      title="暂无 Network 数据"
                      desc={dialingType !== 'WEB' ? '仅 WEB 拨测类型会记录网络请求' : '执行拨测后将在此展示网络请求列表'}
                    />
                  )}
                </TabsContent>

                <TabsContent value="console" className="flex-1 overflow-auto mt-5 data-[state=inactive]:hidden">
                  {hasLogDetail ? (
                    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                      <pre className="font-mono text-sm text-gray-700 bg-gray-50/60 p-5 whitespace-pre-wrap overflow-auto max-h-[400px] min-h-[120px] rounded-2xl">
                        {(logDetail as any)?.consoleLog || '暂无控制台日志'}
                      </pre>
                    </div>
                  ) : (
                    <EmptyState title="暂无控制台日志" desc="执行拨测后将在此展示浏览器控制台输出" />
                  )}
                </TabsContent>

                <TabsContent value="performance" className="flex-1 overflow-auto mt-5 data-[state=inactive]:hidden">
                  {hasLogDetail ? (
                    <TooltipProvider>
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                            导航起始时间
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="size-3.5 cursor-help text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>页面开始导航的时间起点(所有时间的基准点)</TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-base font-semibold text-gray-900">{formatTimestampValue(statisticMetrics.navigationStart)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                            DNS查询耗时(ms)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="size-3.5 cursor-help text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>域名解析耗时</TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-base font-semibold text-gray-900">{formatDurationValue(statisticMetrics.domainTime)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                            TCP连接耗时(ms)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="size-3.5 cursor-help text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>包含TCP三次握手和SSL握手时间</TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-base font-semibold text-gray-900">{formatDurationValue(statisticMetrics.connectTime)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="text-sm text-gray-500 mb-1">响应耗时(ms)</div>
                          <p className="text-base font-semibold text-gray-900">{formatDurationValue(statisticMetrics.requestTime)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="text-sm text-gray-500 mb-1">Dom解析完成时间</div>
                          <p className="text-base font-semibold text-gray-900">{formatTimestampValue(statisticMetrics.domInteractive)}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                          <div className="text-sm text-gray-500 mb-1">DomContentLoaded事件完成时间</div>
                          <p className="text-base font-semibold text-gray-900">{formatTimestampValue(statisticMetrics.domContentLoadedEventEnd)}</p>
                        </div>
                      </div>
                    </TooltipProvider>
                  ) : (
                    <EmptyState
                      title="暂无性能数据"
                      desc="执行 WEB/LLM-WEB/脚本 拨测后将在此展示性能指标"
                    />
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
