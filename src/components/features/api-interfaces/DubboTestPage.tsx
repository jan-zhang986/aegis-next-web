import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Plus, Trash2, Search, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/utils/cn';
import { type MetadataDefinition } from '@/services/metadata';
import { toast } from 'sonner';
import { useApiEditor } from '@/hooks/useApiEditor';
import { EnvSelect } from '@/components/features/common/EnvSelect';
import { ModuleConfirmDialog } from '@/components/features/common/ModuleConfirmDialog';
import { SaveBar } from '@/components/features/common/SaveBar';
import { SaveDialog } from '@/components/features/common/SaveDialog';
import {
  useDubboForm,
  useDubboSites,
  useDubboSend,
  useDubboSave,
  useDubboResize,
  DubboResponseSection,
  COMMON_PARAM_TYPES,
} from './dubbo-test-page';

interface DubboTestPageProps {
  apiName: string;
  onClose: () => void;
  definitionId?: string; // 定义ID，用于获取详细信息
  definitions?: MetadataDefinition[]; // 定义列表，用于查找详细信息
  onRefresh?: () => void; // 刷新列表的回调函数
}

export function DubboTestPage({ apiName, onClose, definitionId, definitions = [], onRefresh }: DubboTestPageProps) {
  const [searchParams] = useSearchParams();
  
  // 获取项目ID：优先从 URL 参数，然后从 localStorage，获取不到则报错
  const projectId = useMemo(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    const projectIdFromStorage = localStorage.getItem('currentProjectId');
    const finalProjectId = projectIdFromUrl || projectIdFromStorage;
    
    if (!finalProjectId) {
      console.error('项目ID不存在，请从URL参数或localStorage中提供projectId');
      toast.error('项目ID不存在，请先选择项目');
    }
    
    return finalProjectId || '';
  }, [searchParams]);
  
  const editor = useApiEditor({ protocol: 'DUBBO', projectId, onRefresh });

  // 获取当前 definition 的 isCase 字段
  const currentDefinition = useMemo(() => {
    if (definitionId && definitions.length > 0) {
      return definitions.find(def => def.id === definitionId);
    }
    return null;
  }, [definitionId, definitions]);

  const isCase = currentDefinition?.isCase ?? false;
  
  // 判断是否是同步数据场景
  const isSyncData = useMemo(() => {
    return currentDefinition?.moduleId === 'plugin-sync' || currentDefinition?.id?.startsWith('sync-');
  }, [currentDefinition]);
  
  // 从 definition.id 中提取 nodeId（如果是 sync- 前缀，需要去掉）
  const nodeId = useMemo(() => {
    if (currentDefinition?.id?.startsWith('sync-')) {
      return currentDefinition.id.replace('sync-', '');
    }
    return currentDefinition?.id || '';
  }, [currentDefinition]);

  // 查找"测试数据"模块的函数
  const findTestDataModuleId = useMemo(() => {
    const flattenNodes = (nodes: any[]): any[] => {
      const result: any[] = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.children && node.children.length > 0) {
          result.push(...flattenNodes(node.children));
        }
      });
      return result;
    };

    const allNodes = flattenNodes(editor.moduleTree || []);
    const testDataModule = allNodes.find(node => 
      node.name === '测试数据' && node.type === 'DUBBO'
    );
    return testDataModule?.id || null;
  }, [editor.moduleTree]);
  
  const loadedDefinitionIdRef = useRef<string | null>(null);
  const sites = useDubboSites();
  const form = useDubboForm({
    editor,
      definitionId, 
    definitions,
    loadedDefinitionIdRef,
    setSelectedSite: sites.setSelectedSite,
  });
  const send = useDubboSend({
    getForm: () => ({ applicationName: form.applicationName, interfaceName: form.interfaceName, methodName: form.methodName }),
    buildRequestConfig: form.buildRequestConfig,
    editor,
    projectId,
    definitionId,
    selectedSite: sites.selectedSite,
  });
  const save = useDubboSave({
    buildRequestConfig: form.buildRequestConfig,
    selectedSite: sites.selectedSite,
    editor,
    projectId,
    onRefresh,
    isSyncData,
    isCase,
    nodeId,
    findTestDataModuleId,
    loadedDefinitionIdRef,
    interfaceName: form.interfaceName,
    methodName: form.methodName,
    applicationName: form.applicationName,
  });
  const resize = useDubboResize();

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-purple-500">DUBBO</span>
            <Input
              value={editor.state.name}
              onChange={(e) => editor.setName(e.target.value)}
                className="text-sm text-gray-700 border-none shadow-none px-2 py-1 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-50 rounded"
              placeholder="请输入DUBBO接口名称"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-2 h-2 rounded-full bg-green-500"></button>
            <button className="text-sm text-gray-600 hover:text-gray-900" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EnvSelect
            environments={editor.environments}
            value={editor.selectedEnvironment}
            onChange={editor.setSelectedEnvironment}
          />
        </div>
      </div>

      {/* Request and Response Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Request Section */}
        <div 
          className="flex flex-col overflow-hidden flex-shrink-0"
          style={{ 
            height: resize.requestHeight != null ? `${resize.requestHeight}px` : undefined,
            flex: resize.requestHeight != null ? '0 0 auto' : undefined
          }}
        >
          <div className="p-4 border-b border-gray-200">
          {/* Service Configuration Input */}
          <div className="space-y-3 mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">应用名称 <span className="text-red-500">*</span></Label>
                <Input 
                  id="dubbo-application-name"
                  name="dubbo-application-name"
                  value={form.applicationName}
                  onChange={(e) => form.setApplicationName(e.target.value)}
                  placeholder="请输入应用名称"
                  className="bg-white flex-1"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">站点租户 <span className="text-red-500">*</span></Label>
                <Popover open={sites.sitePopoverOpen} onOpenChange={sites.setSitePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sites.sitePopoverOpen}
                  disabled={sites.sitesLoading || sites.sites.length === 0}
                      className="w-full max-w-[200px] justify-between h-9 bg-white border border-gray-300 hover:bg-gray-50 text-sm px-3 text-left font-normal"
                    >
                      <span className="truncate flex-1 text-left">
                        {sites.selectedSite 
                          ? (sites.sites.find(s => s.code === sites.selectedSite)?.name || sites.selectedSite)
                          : (sites.sitesLoading ? '加载中...' : sites.sites.length === 0 ? '暂无站点' : '请选择站点租户')
                        }
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <CommandInput 
                          placeholder="搜索站点租户..." 
                          className="h-9 pl-9"
                        />
                      </div>
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>未找到站点租户</CommandEmpty>
                        <CommandGroup>
                    {sites.sites.map((site) => (
                            <CommandItem
                              key={site.code}
                              value={`${site.code} ${site.name || ''}`}
                              onSelect={() => {
                                sites.setSelectedSite(site.code);
                                sites.setSitePopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  sites.selectedSite === site.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{site.name || site.code}</span>
                            </CommandItem>
                    ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">服务接口 <span className="text-red-500">*</span></Label>
              <Input 
                id="dubbo-interface-name"
                name="dubbo-interface-name"
                value={form.interfaceName}
                onChange={(e) => form.setInterfaceName(e.target.value)}
                placeholder="请输入服务接口"
                className="font-mono text-sm bg-white flex-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">方法名 <span className="text-red-500">*</span></Label>
              <Input 
                id="dubbo-method-name"
                name="dubbo-method-name"
                value={form.methodName}
                onChange={(e) => form.setMethodName(e.target.value)}
                placeholder="请输入方法名"
                  className="bg-white flex-1"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">环境tag</Label>
                <Input 
                  id="dubbo-tag"
                  name="dubbo-tag"
                  value={form.dubboTag}
                  onChange={(e) => form.setDubboTag(e.target.value)}
                  placeholder="请输入环境tag（可选，默认为 null）"
                  className="bg-white flex-1"
              />
              </div>
            </div>
          </div>

          {/* Action Buttons - 使用公共组件 */}
          <SaveBar
            onRun={send.handleSend}
            onSave={save.handleSave}
            saving={editor.state.saving || save.isSavingSyncData}
            runLabel="发送"
            saveLabel={isSyncData ? "保存" : (isCase ? "保存" : "另存为测试数据")}
            runDisabled={send.sending}
          />

          {/* 参数类型选择 Tab */}
          <div className="mt-4">
            <Tabs value={form.paramTypeTab} onValueChange={(v) => form.handleParamTypeTabChange(v as 'none'|'basic'|'custom')}>
                <TabsList className="h-9 bg-transparent border-b border-gray-200 rounded-none justify-start p-0 gap-3">
                  <TabsTrigger 
                    value="none" 
                    className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors"
                  >
                    无参数
                  </TabsTrigger>
                  <TabsTrigger 
                    value="basic" 
                    className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors"
                  >
                    基础参数
                    {form.parameters.filter(p => p.type !== 'custom' && p.enabled !== false).length >= 1 && (
                      <span className="ml-1.5 bg-gray-200 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded">
                        {form.parameters.filter(p => p.type !== 'custom' && p.enabled !== false).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="custom" 
                    className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors"
                  >
                    自定义参数
                    {form.parameters.filter(p => p.type === 'custom' && p.enabled !== false).length >= 1 && (
                      <span className="ml-1.5 bg-gray-200 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded">
                        {form.parameters.filter(p => p.type === 'custom' && p.enabled !== false).length}
                      </span>
                    )}
                  </TabsTrigger>
            </TabsList>

                {/* 无参数 Tab */}
                <TabsContent value="none" className="mt-4">
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    无参数
                  </div>
                </TabsContent>

                {/* 基础参数 Tab */}
                <TabsContent value="basic" className="mt-4">
                  {(() => {
                    const basicParams = form.parameters.filter(param => param.type !== 'custom');
                
                return (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-2 mb-1">
                          <div className="col-span-1"></div>
                          <div className="col-span-4">参数类型</div>
                          <div className="col-span-6">参数值</div>
                      <div className="col-span-1"></div>
                    </div>
                        {basicParams.map((param, originalIndex) => {
                          const index = form.parameters.findIndex(p => p === param);
                      return (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center py-1">
                              <div className="col-span-1 flex justify-center">
                                <input 
                                  type="checkbox" 
                                  id={`param-enabled-${index}`}
                                  name={`param-enabled-${index}`}
                                  className="w-4 h-4" 
                                  checked={param.enabled !== false}
onChange={(e) => form.updateParameter(index, 'enabled', e.target.checked)}
                                />
                            </div>
                              <Select
                                value={param.type}
                                onValueChange={(value) => {
                                  if (value === 'custom') {
                                    form.convertParamToCustom(index);
                                  } else {
                                    form.updateParameter(index, 'type', value);
                                  }
                                }}
                              >
                                <SelectTrigger className="col-span-4 text-sm bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COMMON_PARAM_TYPES.map((type) => (
                                    <SelectItem key={type} value={type} className="text-sm">
                                      {type.split('.').pop()}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="custom">自定义类型</SelectItem>
                                </SelectContent>
                              </Select>
                                <Input
                                id={`param-value-${index}`}
                                name={`param-value-${index}`}
                              placeholder={
                                  param.type.includes('List') ? '["value1", "value2"]' :
                                  param.type.includes('Map') ? '{"key": "value"}' :
                                  param.type.includes('Integer') || param.type.includes('Long') ? '123' :
                                  param.type.includes('Boolean') ? 'true' :
                                  '"string value"'
                              }
                                className="col-span-6 text-sm bg-white"
                                value={param.value}
                                onChange={(e) => form.updateParameter(index, 'value', e.target.value)}
                            />
                              <div className="col-span-1 flex justify-center">
                            <button
                              className="text-gray-400 hover:text-gray-600"
                                  onClick={() => {
                                    form.removeParameter(index);
                                    if (basicParams.length === 1) {
                                      form.setParamTypeTab('none');
                                    }
                                  }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    );
                  })}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setParameters([...form.parameters, { name: '', type: 'java.lang.String', schema: undefined, value: '', enabled: true }]);
                          }}
                          className="text-xs mt-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加参数
                        </Button>
                  </div>
                );
              })()}
                </TabsContent>

                {/* 自定义参数 Tab */}
                <TabsContent value="custom" className="mt-4">
                  {(() => {
                    const customParams = form.parameters.filter(param => param.type === 'custom');
                    
                    return (
                      <div className="space-y-1.5">
                        {customParams.map((param, originalIndex) => {
                          const index = form.parameters.findIndex(p => p === param);
                          return (
                            <div key={index} className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    id={`custom-param-enabled-${index}`}
                                    name={`custom-param-enabled-${index}`}
                                    className="w-4 h-4" 
                                    checked={param.enabled !== false}
                                    onChange={(e) => form.updateParameter(index, 'enabled', e.target.checked)}
                                  />
                                  <Label htmlFor={`custom-param-enabled-${index}`} className="text-xs text-gray-600">启用</Label>
                                </div>
                                <button 
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  onClick={() => {
                                    form.removeParameter(index);
                                    if (customParams.length === 1) {
                                      form.setParamTypeTab('none');
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">自定义类型</Label>
                                <Input
                                  value={param.schema || ''}
                                  onChange={(e) => form.updateParameter(index, 'schema', e.target.value)}
                                  placeholder="请输入自定义类型"
                                  className="text-sm font-mono bg-white"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">测试值（JSON格式）</Label>
                                <Textarea
                                  value={param.value}
                                  onChange={(e) => form.updateParameter(index, 'value', e.target.value)}
                                  placeholder='请输入测试值（JSON格式，例如：{"key": "value"} 或 ["value1", "value2"]）'
                                  className="font-mono text-sm min-h-[200px] resize-y bg-white"
                                />
                              </div>
                            </div>
                          );
                        })}
              <Button
                variant="ghost"
                size="sm"
                          onClick={() => {
                            form.setParameters([...form.parameters, { name: '', type: 'custom', schema: '', value: '', enabled: true }]);
                          }}
                className="text-xs mt-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                添加参数
              </Button>
                      </div>
                    );
                  })()}
            </TabsContent>
          </Tabs>
          </div>
          </div>
        </div>

        {/* 可拖拽的分割线 */}
        <div
          ref={resize.resizeRef}
          className="h-1 border-t border-gray-200 bg-gray-100 cursor-row-resize hover:bg-blue-200 transition-colors relative group flex-shrink-0"
          onMouseDown={(e) => { resize.setIsDragging(true); e.preventDefault(); }}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-gray-400 group-hover:bg-blue-500 transition-colors rounded" />
          </div>
        </div>

        <DubboResponseSection
          responseTab={send.responseTab}
          onResponseTabChange={send.setResponseTab}
          sending={send.sending}
          hasResponse={send.hasResponse}
          responseData={send.responseData}
        />
      </div>

      {/* 模块选择确认对话框 */}
      <ModuleConfirmDialog
        open={editor.isConfirmDialogOpen}
        onOpenChange={editor.setIsConfirmDialogOpen}
        moduleTree={editor.moduleTree}
        selectedModuleId={editor.confirmModuleId}
        onModuleChange={editor.setConfirmModuleId}
        moduleType="DUBBO"
        projectId={projectId}
        onModuleTreeRefresh={async () => {
          if (onRefresh) {
            onRefresh();
          }
        }}
        onConfirm={() => {
          if (!editor.confirmModuleId) {
            toast.error('请选择所属模块');
            return;
          }
          // 设置模块ID并打开保存对话框（与 HTTP 一致）
          editor.setSelectedModuleId(editor.confirmModuleId);
          editor.setIsConfirmDialogOpen(false);
          save.setIsSaveDialogOpen(true);
        }}
        protocolLabel="DUBBO"
      />

      {/* 保存对话框 - 使用公共组件（与 HTTP 一致） */}
      <SaveDialog
        open={save.isSaveDialogOpen}
        onOpenChange={save.setIsSaveDialogOpen}
        moduleTree={editor.moduleTree}
        moduleId={editor.state.moduleId || editor.confirmModuleId}
        description={editor.state.description || ''}
        tags={editor.state.tags.join(', ')}
        onDescriptionChange={editor.setDescription}
        onTagsChange={(tagsStr) => {
          const tagsArray = tagsStr
            ? tagsStr.split(',').map((t) => t.trim()).filter((t) => t)
            : [];
          editor.setTags(tagsArray);
        }}
        onModuleIdChange={(moduleId) => {
          editor.setConfirmModuleId(moduleId);
          editor.setSelectedModuleId(moduleId);
        }}
        moduleType="DUBBO"
        projectId={projectId}
        onModuleTreeRefresh={async () => {
          // 只刷新模块树，不刷新定义列表（避免清空用户输入的内容）
          await editor.refreshModuleTree();
        }}
        onConfirm={save.handleSaveDialogConfirm}
        saving={editor.state.saving}
      />
      </div>
    );
}
