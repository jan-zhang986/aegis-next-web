import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Workflow, MessageSquare, Network, Bot, Info, Code2 } from 'lucide-react';
import type { AddEnvironmentParams, EnvCode, DataEndpoint, XxlJobInfo, MqInfo, DubboInfo } from '@/services/environment';

export interface EnvironmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  formData: AddEnvironmentParams;
  setFormData: React.Dispatch<React.SetStateAction<AddEnvironmentParams>>;
  variablesList: Array<{ key: string; value: string }>;
  setVariablesList: React.Dispatch<React.SetStateAction<Array<{ key: string; value: string }>>>;
  projectName: string;
  getJsonFieldValue: (f: 'robots' | 'variables') => string;
  updateJsonField: (f: 'robots' | 'variables', v: string) => void;
  updateDataEndpoint: (k: keyof DataEndpoint, v: string | number | undefined) => void;
  updateXxlJobInfo: (k: keyof XxlJobInfo, v: string) => void;
  updateMqInfo: (k: keyof MqInfo, v: string) => void;
  updateDubboInfo: (k: keyof DubboInfo, v: string) => void;
  onSave: () => void;
}

const id = (prefix: string, name: string) => `${prefix}${name}`;

export function EnvironmentFormDialog({
  open,
  onOpenChange,
  isEdit,
  formData,
  setFormData,
  variablesList,
  setVariablesList,
  projectName,
  getJsonFieldValue,
  updateJsonField,
  updateDataEndpoint,
  updateXxlJobInfo,
  updateMqInfo,
  updateDubboInfo,
  onSave,
}: EnvironmentFormDialogProps) {
  const p = isEdit ? 'edit-' : 'add-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[1072px] max-h-[90vh] overflow-hidden flex flex-col border-2 border-gray-300">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? '编辑环境配置' : '添加环境配置'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {isEdit ? '修改环境配置信息' : '创建新的环境配置，用于不同环境的 API 测试'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs defaultValue="basic" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
              <TabsTrigger value="basic">基础信息</TabsTrigger>
              <TabsTrigger value="services">服务配置</TabsTrigger>
              <TabsTrigger value="advanced">其他配置</TabsTrigger>
            </TabsList>
            <div className="flex-1 min-h-0">
              <TabsContent value="basic" className="mt-0 space-y-3">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50/30">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={id(p, 'name')} className="text-xs font-medium text-gray-700">
                        环境名称 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={id(p, 'name')}
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入环境名称"
                        className="h-9 text-sm border border-gray-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={id(p, 'projectId')} className="text-xs font-medium text-gray-700">
                        项目ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={id(p, 'projectId')}
                        value={projectName ? `${formData.projectId}（${projectName}）` : formData.projectId}
                        disabled
                        className="h-9 text-sm bg-gray-50 cursor-not-allowed border border-gray-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={id(p, 'engineType')} className="text-xs font-medium text-gray-700">
                        类型 <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.engineType} disabled>
                        <SelectTrigger className="h-9 text-sm bg-gray-50 cursor-not-allowed border border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="API">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={id(p, 'envCode')} className="text-xs font-medium text-gray-700">
                        环境Code <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.envCode}
                        onValueChange={(v: EnvCode) => setFormData((prev) => ({ ...prev, envCode: v }))}
                      >
                        <SelectTrigger className="h-9 text-sm border border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEV">DEV</SelectItem>
                          <SelectItem value="TST">TST</SelectItem>
                          <SelectItem value="PRE">PRE</SelectItem>
                          <SelectItem value="PRD">PRD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={id(p, 'domain')} className="text-xs font-medium text-gray-700">
                        域名 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={id(p, 'domain')}
                        value={formData.domain}
                        onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
                        placeholder="请输入域名"
                        className="h-9 text-sm border border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-0 space-y-4">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-gray-500" />
                    <Label className="text-xs font-semibold text-gray-700">
                      数据信息配置 <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { k: 'data_host', label: '主机', type: 'text' },
                      { k: 'data_port', label: '端口', type: 'number' },
                      { k: 'data_user', label: '用户', type: 'text' },
                      { k: 'data_password', label: '密码', type: 'text' },
                    ].map(({ k, label, type }) => (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-700">
                          {label} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type={type as 'text' | 'number'}
                          value={
                            k === 'data_port'
                              ? (formData.dataEndpoint?.data_port ?? '')
                              : String((formData.dataEndpoint as unknown as Record<string, string>)?.[k] ?? '')
                          }
                          onChange={(e) =>
                            updateDataEndpoint(
                              k as 'data_host' | 'data_port' | 'data_user' | 'data_password',
                              type === 'number' ? (e.target.value ? parseInt(e.target.value, 10) : undefined) : e.target.value
                            )
                          }
                          placeholder={`请输入${label}`}
                          className="h-9 text-sm border border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Workflow className="w-4 h-4 text-gray-500" />
                    <Label className="text-xs font-semibold text-gray-700">
                      XXL-Job 配置 <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { k: 'xxjob_url', label: 'XXL-Job URL' },
                      { k: 'xxljobuser', label: '用户' },
                      { k: 'xxljobpassword', label: '密码' },
                    ].map(({ k, label }) => (
                      <div key={k} className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-700">
                          {label} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={(formData.xxljobInfo as unknown as Record<string, string>)?.[k] ?? ''}
                          onChange={(e) => updateXxlJobInfo(k as keyof XxlJobInfo, e.target.value)}
                          placeholder={`请输入${label}`}
                          className="h-9 text-sm border border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <Label className="text-xs font-semibold text-gray-700">
                      MQ 配置 <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <Input
                    value={formData.mqInfo?.mq_url ?? ''}
                    onChange={(e) => updateMqInfo('mq_url', e.target.value)}
                    placeholder="请输入MQ URL"
                    className="h-9 text-sm border border-gray-300"
                  />
                </div>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-gray-500" />
                    <Label className="text-xs font-semibold text-gray-700">DUBBO 配置</Label>
                  </div>
                  <Input
                    value={formData.dubboInfo?.dubbo_url ?? ''}
                    onChange={(e) => updateDubboInfo('dubbo_url', e.target.value)}
                    placeholder="请输入DUBBO URL"
                    className="h-9 text-sm border border-gray-300"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-4">
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-gray-500" />
                    <Label className="text-xs font-semibold text-gray-700">机器人配置</Label>
                    <Info className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">JSON 格式</span>
                  </div>
                  <Textarea
                    value={getJsonFieldValue('robots')}
                    onChange={(e) => updateJsonField('robots', e.target.value)}
                    placeholder='{"enabled": true, "webhook": "..."}'
                    rows={4}
                    className="font-mono text-xs bg-gray-900 text-gray-100 border-gray-700 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">配置机器人通知，支持 Slack、钉钉等 webhook</p>
                </div>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="w-4 h-4 text-gray-500" />
                    <Label className="text-xs font-semibold text-gray-700">变量配置</Label>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">系统字段（只读）</div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="变量名" value="url" disabled className="h-9 text-sm flex-1 bg-gray-50" />
                      <Input placeholder="变量值" value={formData.domain || ''} disabled className="h-9 text-sm flex-1 bg-gray-50" />
                      <div className="w-9 shrink-0" />
                    </div>
                    {formData.dataEndpoint && (
                      <>
                        {(['data_host', 'data_port', 'data_user', 'data_password'] as const).map((key) => (
                          <div key={key} className="flex items-center gap-2">
                            <Input placeholder="变量名" value={key} disabled className="h-9 text-sm flex-1 bg-gray-50" />
                            <Input
                              placeholder="变量值"
                              value={
                                key === 'data_port'
                                  ? String(formData.dataEndpoint?.[key] ?? '')
                                  : String((formData.dataEndpoint as Record<string, string>)?.[key] ?? '')
                              }
                              disabled
                              className="h-9 text-sm flex-1 bg-gray-50"
                            />
                            <div className="w-9 shrink-0" />
                          </div>
                        ))}
                      </>
                    )}
                    {formData.mqInfo?.mq_url && (
                      <div className="flex items-center gap-2">
                        <Input placeholder="变量名" value="mq_url" disabled className="h-9 text-sm flex-1 bg-gray-50" />
                        <Input placeholder="变量值" value={formData.mqInfo.mq_url} disabled className="h-9 text-sm flex-1 bg-gray-50" />
                        <div className="w-9 shrink-0" />
                      </div>
                    )}
                    {formData.dubboInfo?.dubbo_url && (
                      <div className="flex items-center gap-2">
                        <Input placeholder="变量名" value="dubbo_url" disabled className="h-9 text-sm flex-1 bg-gray-50" />
                        <Input placeholder="变量值" value={formData.dubboInfo.dubbo_url} disabled className="h-9 text-sm flex-1 bg-gray-50" />
                        <div className="w-9 shrink-0" />
                      </div>
                    )}
                    {formData.xxljobInfo &&
                      (['xxjob_url', 'xxljobuser', 'xxljobpassword'] as const).map(
                        (key) =>
                          (formData.xxljobInfo as Record<string, string>)?.[key] && (
                            <div key={key} className="flex items-center gap-2">
                              <Input placeholder="变量名" value={key} disabled className="h-9 text-sm flex-1 bg-gray-50" />
                              <Input
                                placeholder="变量值"
                                value={(formData.xxljobInfo as Record<string, string>)[key]}
                                disabled
                                className="h-9 text-sm flex-1 bg-gray-50"
                              />
                              <div className="w-9 shrink-0" />
                            </div>
                          )
                      )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 mb-2 font-medium">自定义变量</div>
                    {variablesList.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          placeholder="变量名"
                          value={item.key}
                          onChange={(e) => {
                            const n = [...variablesList];
                            n[i].key = e.target.value;
                            setVariablesList(n);
                          }}
                          className="h-9 text-sm flex-1"
                        />
                        <Input
                          placeholder="变量值"
                          value={item.value}
                          onChange={(e) => {
                            const n = [...variablesList];
                            n[i].value = e.target.value;
                            setVariablesList(n);
                          }}
                          className="h-9 text-sm flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-red-500 shrink-0"
                          onClick={() => {
                            const n = variablesList.filter((_, j) => j !== i);
                            setVariablesList(n.length > 0 ? n : [{ key: '', value: '' }]);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs mt-2"
                    onClick={() => setVariablesList([...variablesList, { key: '', value: '' }])}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加变量
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">配置环境变量，如 baseUrl、timeout 等</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <DialogFooter className="border-t pt-3 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            取消
          </Button>
          <Button onClick={onSave} size="sm" className="min-w-[80px]">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
