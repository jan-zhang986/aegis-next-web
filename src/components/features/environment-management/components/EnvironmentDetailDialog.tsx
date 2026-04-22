/**
 * 环境配置详情 - 右侧抽屉，只读展示；参考拨测配置详情（DialDetailDialog）
 * 支持「编辑」按钮进入编辑（关闭抽屉并由父级打开编辑弹窗）
 */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Database, Workflow, MessageSquare, Network, Bot, Code2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { Environment } from '@/services/environment';
import { getFlattenedDetailConfig } from '../utils/flattenDetailConfig';

export interface EnvironmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environment: Environment | null;
  /** 点击「编辑」时调用，通常关闭抽屉并打开编辑弹窗 */
  onEdit?: (env: Environment) => void;
}

const PASSWORD_KEYS = new Set(['data_password', 'xxljobpassword']);

export function EnvironmentDetailDialog({
  open,
  onOpenChange,
  environment,
  onEdit,
}: EnvironmentDetailDialogProps) {
  const [showPasswords, setShowPasswords] = useState(false);

  const handleCopy = () => {
    if (!environment) return;
    const flat = getFlattenedDetailConfig(environment);
    navigator.clipboard.writeText(JSON.stringify(flat, null, 2));
    toast.success('配置信息已复制到剪贴板');
  };

  const handleEdit = () => {
    if (environment && onEdit) {
      onEdit(environment);
      onOpenChange(false);
    }
  };

  if (!environment) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="!w-[40vw] sm:!max-w-[40vw]" showCloseButton>
          <div className="p-6 text-gray-500 text-sm">暂无数据</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Helper to safely parse strings or objects
  const parseJsonStr = (val?: any) => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(String(val));
    } catch {
      return {};
    }
  };

  const dataEndpointObj = parseJsonStr(environment.dataEndpoint);
  const xxljobInfoObj = parseJsonStr(environment.xxljobInfo);
  const mqInfoObj = parseJsonStr(environment.mqInfo);
  const dubboInfoObj = parseJsonStr(environment.dubboInfo);
  const robotsRaw = typeof environment.robots === 'string' ? environment.robots : JSON.stringify(environment.robots || {}, null, 2);

  // Extract variables
  const getRawVariables = () => {
    try {
      // @ts-ignore - The database schema might store variables differently
      const cfg = environment.config || (environment as any).variables;
      if (typeof cfg === 'string' && cfg.trim().startsWith('{')) {
        const parsed = JSON.parse(cfg);
        if (parsed?.variables) return parsed.variables;
      } else if (typeof cfg === 'object') {
        return cfg?.variables || cfg;
      }
    } catch {
      // ignore
    }
    return {};
  };

  const currentVariablesObj = getRawVariables() || {};
  const currentVariablesList = Object.entries(currentVariablesObj).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  // 系统变量：由环境基础信息与服务配置推导出的固定键（与 FIXED_VARIABLE_KEYS 一致），用于在详情页统一展示
  const systemVariablesList: Array<{ key: string; value: string }> = [];
  if (environment.domain) systemVariablesList.push({ key: 'url', value: environment.domain });
  if (dataEndpointObj?.data_host != null) systemVariablesList.push({ key: 'data_host', value: String(dataEndpointObj.data_host) });
  if (dataEndpointObj?.data_port != null) systemVariablesList.push({ key: 'data_port', value: String(dataEndpointObj.data_port) });
  if (dataEndpointObj?.data_user != null) systemVariablesList.push({ key: 'data_user', value: String(dataEndpointObj.data_user) });
  if (dataEndpointObj?.data_password != null) systemVariablesList.push({ key: 'data_password', value: String(dataEndpointObj.data_password) });
  if (mqInfoObj?.mq_url) systemVariablesList.push({ key: 'mq_url', value: String(mqInfoObj.mq_url) });
  if (dubboInfoObj?.dubbo_url) systemVariablesList.push({ key: 'dubbo_url', value: String(dubboInfoObj.dubbo_url) });
  if (xxljobInfoObj?.xxjob_url) systemVariablesList.push({ key: 'xxjob_url', value: String(xxljobInfoObj.xxjob_url) });
  if (xxljobInfoObj?.xxljobuser) systemVariablesList.push({ key: 'xxljobuser', value: String(xxljobInfoObj.xxljobuser) });
  if (xxljobInfoObj?.xxljobpassword != null) systemVariablesList.push({ key: 'xxljobpassword', value: String(xxljobInfoObj.xxljobpassword) });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 bg-white border-l border-gray-200/80 !w-[50vw] sm:!max-w-[50vw]"
        showCloseButton
      >
        <SheetHeader className="border-b border-gray-200/80 bg-white/95 backdrop-blur px-6 py-4 shrink-0 flex flex-row items-center justify-between gap-4 shadow-sm">
          <SheetTitle className="text-lg font-semibold text-gray-900 truncate pr-4">
            环境配置详情 - {environment.name ?? '-'}
          </SheetTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswords((v) => !v)}
            >
              {showPasswords ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPasswords ? '隐藏密码' : '显示密码'}
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                编辑进入修改模式
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              复制 JSON
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50/30 space-y-6 pb-8">
          {/* 一、基础信息 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">基础信息</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">环境名称</Label>
                <div className="text-sm font-medium text-gray-900">{environment.name || '-'}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">项目ID</Label>
                <div className="text-sm font-medium text-gray-900">{environment.projectId || '-'}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">类型</Label>
                <div className="text-sm font-medium text-gray-900">{environment.engineType || '-'}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">环境Code</Label>
                <div className="text-sm font-medium text-gray-900">{environment.envCode || '-'}</div>
              </div>
            </div>
            <div className="mt-5 space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">域名</Label>
              <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-100 break-all">
                {environment.domain || '-'}
              </div>
            </div>
          </section>

          {/* 二、服务配置 */}
          <section className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-200">服务配置</h3>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <Database className="w-4 h-4" />
                </div>
                <Label className="text-sm font-semibold text-gray-800">数据信息配置</Label>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">主机 (data_host)</Label>
                  <Input readOnly value={dataEndpointObj?.data_host || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">端口 (data_port)</Label>
                  <Input readOnly value={dataEndpointObj?.data_port || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">用户 (data_user)</Label>
                  <Input readOnly value={dataEndpointObj?.data_user || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">密码 (data_password)</Label>
                  <Input type={showPasswords ? 'text' : 'password'} readOnly value={dataEndpointObj?.data_password ? (showPasswords ? String(dataEndpointObj.data_password) : '********') : ''} placeholder="未设置" className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                  <Workflow className="w-4 h-4" />
                </div>
                <Label className="text-sm font-semibold text-gray-800">XXL-Job 配置</Label>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-gray-500">XXL-Job URL</Label>
                  <Input readOnly value={xxljobInfoObj?.xxjob_url || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">用户</Label>
                  <Input readOnly value={xxljobInfoObj?.xxljobuser || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">密码</Label>
                  <Input type={showPasswords ? 'text' : 'password'} readOnly value={xxljobInfoObj?.xxljobpassword ? (showPasswords ? String(xxljobInfoObj.xxljobpassword) : '********') : ''} placeholder="未设置" className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <Label className="text-sm font-semibold text-gray-800">MQ 配置</Label>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">MQ URL</Label>
                  <Input readOnly value={mqInfoObj?.mq_url || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                    <Network className="w-4 h-4" />
                  </div>
                  <Label className="text-sm font-semibold text-gray-800">DUBBO 配置</Label>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">DUBBO URL</Label>
                  <Input readOnly value={dubboInfoObj?.dubbo_url || '-'} className="h-9 bg-gray-50 text-gray-900 text-sm focus-visible:ring-0 border-gray-200" />
                </div>
              </div>
            </div>
          </section>

          {/* 三、其他配置 */}
          <section className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-200">其他配置</h3>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gray-100 text-gray-600 rounded-md">
                  <Bot className="w-4 h-4" />
                </div>
                <Label className="text-sm font-semibold text-gray-800">机器人配置</Label>
              </div>
              <Textarea
                readOnly
                value={robotsRaw}
                rows={6}
                className="font-mono text-xs bg-slate-900 text-slate-50 border-gray-700 resize-none focus-visible:ring-0 py-3"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                  <Code2 className="w-4 h-4" />
                </div>
                <Label className="text-sm font-semibold text-gray-800">系统变量</Label>
              </div>
              <p className="text-xs text-gray-500 mb-4">由环境域名与服务配置推导，在脚本中可直接使用这些变量名。</p>
              {systemVariablesList.length > 0 ? (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-50/80 text-xs text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-medium w-1/3">变量名 (Key)</th>
                        <th className="px-4 py-3 font-medium">变量值 (Value)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {systemVariablesList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs">{item.key || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium break-all">
                            {PASSWORD_KEYS.has(item.key) && !showPasswords ? '********' : (item.value || '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <p className="text-sm text-gray-500">当前环境未配置系统变量（未填写域名或服务配置）</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gray-100 text-gray-600 rounded-md">
                  <Code2 className="w-4 h-4" />
                </div>
                <Label className="text-sm font-semibold text-gray-800">自定义变量清单</Label>
              </div>

              {currentVariablesList.length > 0 ? (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-50/80 text-xs text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-medium w-1/3">变量名 (Key)</th>
                        <th className="px-4 py-3 font-medium">变量值 (Value)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {currentVariablesList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs">{item.key || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium break-all">{item.value || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <p className="text-sm text-gray-500">当前环境未配置自定义变量</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
