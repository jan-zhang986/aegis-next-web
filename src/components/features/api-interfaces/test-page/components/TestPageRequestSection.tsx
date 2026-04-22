/**
 * TestPage 请求区域：URL 行、Header/Params/Body Tabs
 */

import { Play, Save, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTypeBadgeColor } from '../constants';
import type { HeaderParam, QueryParam, BodyParam } from '../types';

export interface TestPageRequestSectionProps {
  requestScrollRef: React.RefObject<HTMLDivElement | null>;
  method: string;
  setMethod: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  onImportClick: () => void;
  onSend: () => void;
  isSending: boolean;
  onSave: () => void;
  saving: boolean;
  isSavingSyncData: boolean;
  isSyncData: boolean;
  isCase: boolean;
  activeTab: string;
  setActiveTab: (v: string) => void;
  headers: HeaderParam[];
  setHeaders: React.Dispatch<React.SetStateAction<HeaderParam[]>>;
  queryParams: QueryParam[];
  setQueryParams: React.Dispatch<React.SetStateAction<QueryParam[]>>;
  bodyParams: BodyParam[];
  setBodyParams: React.Dispatch<React.SetStateAction<BodyParam[]>>;
  rawBody: string;
  setRawBody: (v: string) => void;
  jsonBody: string;
  setJsonBody: (v: string) => void;
  bodyType: string;
  setBodyType: (v: string) => void;
  generateId: () => string;
}

const tabCls =
  'text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-2 transition-colors';

export function TestPageRequestSection({
  requestScrollRef,
  method,
  setMethod,
  url,
  setUrl,
  onImportClick,
  onSend,
  isSending,
  onSave,
  saving,
  isSavingSyncData,
  isSyncData,
  isCase,
  activeTab,
  setActiveTab,
  headers,
  setHeaders,
  queryParams,
  setQueryParams,
  bodyParams,
  setBodyParams,
  rawBody,
  setRawBody,
  jsonBody,
  setJsonBody,
  bodyType,
  setBodyType,
  generateId,
}: TestPageRequestSectionProps) {
  const headerCount = headers.filter((h) => h.enabled && h.key.trim()).length;
  const queryCount = queryParams.filter((p) => p.enabled && p.key.trim()).length;
  let bodyCount = 0;
  if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') {
    bodyCount = bodyParams.filter((p) => p.enabled && p.key.trim()).length;
  } else if (bodyType === 'json') {
    const c = jsonBody.trim();
    if (c && c !== '{}' && c !== '[]') bodyCount = 1;
  } else if (bodyType === 'raw') {
    bodyCount = rawBody.trim() ? 1 : 0;
  }

  return (
    <div ref={requestScrollRef as React.RefObject<HTMLDivElement>} className="flex-1 p-4 border-b border-gray-200 overflow-y-auto min-h-0">
        <div className="flex items-center gap-2 mb-4">
          <Select value={method} onValueChange={setMethod} name="http-method">
            <SelectTrigger id="http-method" className="w-32 [&_[data-slot=select-value]]:hidden">
              <SelectValue />
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(method)}`}>{method}</span>
            </SelectTrigger>
            <SelectContent>
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                <SelectItem key={m} value={m}>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(m)}`}>{m}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input id="api-url" name="api-url" placeholder="请输入接口地址" className="flex-1" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button variant="outline" onClick={onImportClick}>
            <Upload className="w-4 h-4 mr-1" />
            导入cURL
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={onSend} disabled={isSending}>
            <Play className="w-4 h-4 mr-1" />
            {isSending ? '发送中...' : '发送'}
          </Button>
          <Button variant="outline" onClick={onSave} disabled={saving || isSavingSyncData}>
            <Save className="w-4 h-4 mr-1" />
            {saving || isSavingSyncData ? '保存中...' : isSyncData ? '保存' : isCase ? '保存' : '另存为测试数据'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9 bg-transparent border-b border-gray-200 rounded-none w-64 justify-start p-0 gap-3">
            <TabsTrigger value="header" className={tabCls}>
              <span className="flex items-center gap-1.5">
                Header
                {headerCount >= 1 && <span className="bg-gray-200 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded">{headerCount}</span>}
              </span>
            </TabsTrigger>
            <TabsTrigger value="query" className={tabCls}>
              <span className="flex items-center gap-1.5">
                Params
                {queryCount >= 1 && <span className="bg-gray-200 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded">{queryCount}</span>}
              </span>
            </TabsTrigger>
            <TabsTrigger value="body" className={tabCls}>
              <span className="flex items-center gap-1.5">
                Body
                {bodyCount >= 1 && <span className="bg-gray-200 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded">{bodyCount}</span>}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="mt-4">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-2">
                <div className="col-span-1" />
                <div className="col-span-5">参数名</div>
                <div className="col-span-5">参数值</div>
                <div className="col-span-1" />
              </div>
              {headers.map((h) => (
                <div key={h.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 flex justify-center">
                    <input type="checkbox" checked={h.enabled} onChange={(e) => setHeaders((prev) => prev.map((x) => (x.id === h.id ? { ...x, enabled: e.target.checked } : x)))} />
                  </div>
                  <Input className="col-span-5 text-sm" placeholder="Header Name" value={h.key} onChange={(e) => setHeaders((prev) => prev.map((x) => (x.id === h.id ? { ...x, key: e.target.value } : x)))} />
                  <Input className="col-span-5 text-sm" placeholder="Header Value" value={h.value} onChange={(e) => setHeaders((prev) => prev.map((x) => (x.id === h.id ? { ...x, value: e.target.value } : x)))} />
                  <div className="col-span-1 flex justify-center">
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setHeaders((prev) => prev.filter((x) => x.id !== h.id))}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setHeaders((prev) => [...prev, { id: generateId(), key: '', value: '', enabled: true }])}>
                <Plus className="w-3 h-3 mr-1" />
                添加Header
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="query" className="mt-4">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-2">
                <div className="col-span-1" />
                <div className="col-span-5">参数名</div>
                <div className="col-span-5">参数值</div>
                <div className="col-span-1" />
              </div>
              {queryParams.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 flex justify-center">
                    <input type="checkbox" checked={p.enabled} onChange={(e) => setQueryParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, enabled: e.target.checked } : x)))} />
                  </div>
                  <Input className="col-span-5 text-sm" placeholder="Params Name" value={p.key} onChange={(e) => setQueryParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, key: e.target.value } : x)))} />
                  <Input className="col-span-5 text-sm" placeholder="Params Value" value={p.value} onChange={(e) => setQueryParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, value: e.target.value } : x)))} />
                  <div className="col-span-1 flex justify-center">
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setQueryParams((prev) => prev.filter((x) => x.id !== p.id))}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setQueryParams((prev) => [...prev, { id: generateId(), key: '', value: '', enabled: true }])}>
                <Plus className="w-3 h-3 mr-1" />
                添加Params参数
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="body" className="mt-4">
            <RadioGroup value={bodyType} onValueChange={setBodyType} name="body-type" className="flex gap-6 mb-4">
              {['none', 'form-data', 'x-www-form-urlencoded', 'json', 'raw'].map((v) => (
                <div key={v} className="flex items-center space-x-2">
                  <RadioGroupItem value={v} id={v} />
                  <Label htmlFor={v} className="text-sm">{v === 'x-www-form-urlencoded' ? 'x-www-form-urlencoded' : v}</Label>
                </div>
              ))}
            </RadioGroup>

            {bodyType === 'none' && <div className="flex items-center justify-center h-48 text-gray-400 text-sm">请选择数据格式并填入</div>}

            {bodyType === 'json' && (
              <Textarea id="json-body" placeholder="请输入JSON格式的请求体内容" className="min-h-[200px] font-mono text-sm" value={jsonBody} onChange={(e) => setJsonBody(e.target.value)} />
            )}

            {bodyType === 'raw' && (
              <Textarea id="raw-body" placeholder="请输入请求体内容" className="min-h-[200px] font-mono text-sm" value={rawBody} onChange={(e) => setRawBody(e.target.value)} />
            )}

            {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-2">
                  <div className="col-span-1" />
                  <div className="col-span-4">参数名</div>
                  <div className="col-span-4">参数值</div>
                  <div className="col-span-2">类型</div>
                  <div className="col-span-1" />
                </div>
                {bodyParams.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 flex justify-center">
                      <input type="checkbox" checked={p.enabled} onChange={(e) => setBodyParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, enabled: e.target.checked } : x)))} />
                    </div>
                    <Input className="col-span-4 text-sm" placeholder="key" value={p.key} onChange={(e) => setBodyParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, key: e.target.value } : x)))} />
                    <Input className="col-span-4 text-sm" placeholder="value" value={p.value} onChange={(e) => setBodyParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, value: e.target.value } : x)))} />
                    <Select value={p.type} onValueChange={(v: 'text' | 'file') => setBodyParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, type: v } : x)))}>
                      <SelectTrigger className="col-span-2 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">text</SelectItem>
                        <SelectItem value="file">file</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="col-span-1 flex justify-center">
                      <button className="text-gray-400 hover:text-gray-600" onClick={() => setBodyParams((prev) => prev.filter((x) => x.id !== p.id))}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setBodyParams((prev) => [...prev, { id: generateId(), key: '', value: '', type: 'text', enabled: true }])}>
                  <Plus className="w-3 h-3 mr-1" />
                  添加参数
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
