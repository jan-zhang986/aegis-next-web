/**
 * HTTP 接口调试页：组合 test-page 模块的 hooks 与组件
 */

import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiEditor } from '@/hooks/useApiEditor';
import { EnvSelect } from '@/components/features/common/EnvSelect';
import { ModuleConfirmDialog } from '@/components/features/common/ModuleConfirmDialog';
import { SaveDialog } from '@/components/features/common/SaveDialog';
import { ImportDialog, type ImportData } from '@/components/features/common/ImportDialog';
import {
  useTestPageForm,
  useTestPageSend,
  useTestPageSave,
  useTestPageResize,
  TestPageRequestSection,
  TestPageResponseSection,
  getTypeBadgeColor,
} from './test-page';
import type { MetadataDefinition } from '@/services/metadata';
import type { TestPageFormSnapshot } from './test-page';

interface TestPageProps {
  apiType: 'http' | 'sql' | 'dubbo' | 'websocket' | 'tcp' | 'rocketmq';
  apiName: string;
  onClose: () => void;
  definitionId?: string;
  definitions?: MetadataDefinition[];
  onRefresh?: () => void;
}

export function TestPage({ apiType, apiName, onClose, definitionId, definitions = [], onRefresh }: TestPageProps) {
  const [searchParams] = useSearchParams();
  const projectId = useMemo(() => {
    const fromUrl = searchParams.get('projectId');
    const fromStorage = localStorage.getItem('currentProjectId');
    const id = fromUrl || fromStorage;
    if (!id) {
      console.error('项目ID不存在');
      toast.error('项目ID不存在，请先选择项目');
    }
    return id || '';
  }, [searchParams]);

  const editor = useApiEditor({ protocol: 'HTTP', projectId, onRefresh });

  const currentDefinition = useMemo(() => (definitionId && definitions.length ? definitions.find((d) => d.id === definitionId) ?? null : null), [definitionId, definitions]);
  const isCase = currentDefinition?.isCase ?? false;
  const isSyncData = useMemo(() => currentDefinition?.moduleId === 'plugin-sync' || (currentDefinition?.id ?? '').startsWith('sync-'), [currentDefinition]);
  const nodeId = useMemo(() => ((currentDefinition?.id ?? '').startsWith('sync-') ? (currentDefinition!.id as string).replace('sync-', '') : currentDefinition?.id ?? ''), [currentDefinition]);

  const findTestDataModuleId = useMemo(() => {
    const flatten = (nodes: { id?: string; name?: string; type?: string; children?: unknown[] }[]): typeof nodes => {
      const out: typeof nodes = [];
      for (const n of nodes) {
        out.push(n);
        if (n.children?.length) out.push(...flatten(n.children as typeof nodes));
      }
      return out;
    };
    const all = flatten(editor.moduleTree || []);
    const m = all.find((n) => n.name === '测试数据' && n.type === 'API');
    return m?.id ?? null;
  }, [editor.moduleTree]);

  const loadedDefinitionIdRef = useRef<string | null>(null);

  const form = useTestPageForm({ editor, definitionId, definitions, loadedDefinitionIdRef });

  const formRef = useRef<TestPageFormSnapshot | null>(null);
  formRef.current = form.formSnapshot;

  const send = useTestPageSend({ formRef, editor, projectId, definitionId });
  const save = useTestPageSave({
    buildRequestConfig: form.buildRequestConfig,
    url: form.url,
    editor,
    projectId,
    onRefresh,
    isSyncData,
    isCase,
    nodeId,
    findTestDataModuleId,
    loadedDefinitionIdRef,
  });

  const resize = useTestPageResize({ activeTab: form.activeTab });

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const handleSend = () => {
    if (!form.url) {
      toast.error('请输入接口地址');
      return;
    }
    if (!form.noDomain && !editor.selectedEnvironment) {
      toast.error('请先选择环境');
      return;
    }
    send.handleSend();
  };

  const handleImport = (data: ImportData) => {
    form.setMethod(data.method);
    let importUrl = data.url;
    try {
      const u = new URL(data.url);
      importUrl = u.pathname || '/';
    } catch {
      if (importUrl.includes('?')) importUrl = importUrl.split('?')[0];
    }
    form.setUrl(importUrl);
    form.setQueryParams(data.params?.length ? data.params.map((p) => ({ id: form.generateId(), key: p.key, value: p.value, enabled: true })) : []);
    form.setHeaders(data.headers?.length ? data.headers.map((h) => ({ id: form.generateId(), key: h.key, value: h.value, enabled: true })) : []);
    if (data.body) {
      try {
        form.setBodyType('json');
        form.setJsonBody(JSON.stringify(JSON.parse(data.body), null, 2));
        form.setRawBody('');
        form.setBodyParams([]);
      } catch {
        form.setBodyType('raw');
        form.setRawBody(data.body);
        form.setJsonBody('{}');
        form.setBodyParams([]);
      }
    } else {
      form.setBodyType('none');
      form.setJsonBody('{}');
      form.setRawBody('');
      form.setBodyParams([]);
    }
    form.setActiveTab('body');
    toast.success('cURL 命令导入成功');
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeBadgeColor(form.method)}`}>{form.method}</span>
            <Input
              value={editor.state.name}
              onChange={(e) => editor.setName(e.target.value)}
              className="text-sm text-gray-700 border-none shadow-none px-2 py-1 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-50 rounded"
              placeholder="请输入接口名称"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-2 h-2 rounded-full bg-green-500" />
            <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EnvSelect environments={editor.environments} value={editor.selectedEnvironment} onChange={editor.setSelectedEnvironment} disabled={form.noDomain} />
          <div className="flex items-center gap-2">
            <Checkbox id="no-domain" checked={form.noDomain} onCheckedChange={(c) => form.setNoDomain(!!c)} />
            <Label htmlFor="no-domain" className="text-sm text-gray-600 cursor-pointer">无需域名</Label>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          ref={resize.requestSectionRef}
          className="flex flex-col min-h-0 overflow-hidden flex-shrink-0"
          style={{ height: resize.requestHeight != null ? `${resize.requestHeight}px` : undefined, flex: resize.requestHeight != null ? '0 0 auto' : undefined }}
        >
          <TestPageRequestSection
            requestScrollRef={resize.requestScrollRef}
            method={form.method}
            setMethod={form.setMethod}
            url={form.url}
            setUrl={form.setUrl}
            onImportClick={() => setIsImportDialogOpen(true)}
            onSend={handleSend}
            isSending={send.isSending}
            onSave={save.handleSave}
            saving={editor.state.saving}
            isSavingSyncData={save.isSavingSyncData}
            isSyncData={isSyncData}
            isCase={isCase}
            activeTab={form.activeTab}
            setActiveTab={form.setActiveTab}
            headers={form.headers}
            setHeaders={form.setHeaders}
            queryParams={form.queryParams}
            setQueryParams={form.setQueryParams}
            bodyParams={form.bodyParams}
            setBodyParams={form.setBodyParams}
            rawBody={form.rawBody}
            setRawBody={form.setRawBody}
            jsonBody={form.jsonBody}
            setJsonBody={form.setJsonBody}
            bodyType={form.bodyType}
            setBodyType={form.setBodyType}
            generateId={form.generateId}
          />
        </div>

        <div
          ref={resize.resizeRef}
          className="h-1 border-t border-gray-200 bg-gray-100 cursor-row-resize hover:bg-blue-200 transition-colors relative group flex-shrink-0"
          onMouseDown={(e) => { resize.setIsDragging(true); e.preventDefault(); }}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-gray-400 group-hover:bg-blue-500 transition-colors rounded" />
          </div>
        </div>

        <TestPageResponseSection
          responseTab={send.responseTab}
          onResponseTabChange={send.setResponseTab}
          isSending={send.isSending}
          responseData={send.responseData}
          responseTime={send.responseTime}
          responseSize={send.responseSize}
          responseHeaders={send.responseHeaders}
          responseCookies={send.responseCookies}
        />
      </div>

      <ModuleConfirmDialog
        open={editor.isConfirmDialogOpen}
        onOpenChange={editor.setIsConfirmDialogOpen}
        moduleTree={editor.moduleTree}
        selectedModuleId={editor.confirmModuleId}
        onModuleChange={editor.setConfirmModuleId}
        moduleType="API"
        projectId={projectId}
        onModuleTreeRefresh={() => onRefresh?.()}
        onConfirm={() => {
          if (!editor.confirmModuleId) { toast.error('请选择所属模块'); return; }
          editor.setSelectedModuleId(editor.confirmModuleId);
          editor.setIsConfirmDialogOpen(false);
          save.setIsSaveDialogOpen(true);
        }}
        protocolLabel="HTTP接口"
      />

      <SaveDialog
        open={save.isSaveDialogOpen}
        onOpenChange={save.setIsSaveDialogOpen}
        moduleTree={editor.moduleTree}
        moduleId={editor.state.moduleId || editor.confirmModuleId}
        description={editor.state.description || ''}
        tags={editor.state.tags.join(', ')}
        onDescriptionChange={editor.setDescription}
        onTagsChange={(s) => editor.setTags(s ? s.split(',').map((t) => t.trim()).filter(Boolean) : [])}
        onModuleIdChange={(id) => { editor.setConfirmModuleId(id); editor.setSelectedModuleId(id); }}
        moduleType={apiType === 'http' ? 'API' : (apiType.toUpperCase() as 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE')}
        projectId={projectId}
        onModuleTreeRefresh={() => editor.refreshModuleTree()}
        onConfirm={save.handleSaveDialogConfirm}
        saving={editor.state.saving}
      />

      <ImportDialog open={isImportDialogOpen} onClose={() => setIsImportDialogOpen(false)} onImport={handleImport} />
    </div>
  );
}
