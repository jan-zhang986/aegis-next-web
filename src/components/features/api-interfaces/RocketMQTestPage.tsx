import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, MessageSquare, Search, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';
import { useApiEditor } from '@/hooks/useApiEditor';
import { EnvSelect } from '@/components/features/common/EnvSelect';
import { ModuleConfirmDialog } from '@/components/features/common/ModuleConfirmDialog';
import { SaveBar } from '@/components/features/common/SaveBar';
import { SaveDialog } from '@/components/features/common/SaveDialog';
import type { MetadataDefinition } from '@/services/metadata';
import {
  useRocketMQForm,
  useRocketMQSites,
  useRocketMQSend,
  useRocketMQSave,
  useRocketMQResize,
  RocketMQResponseSection,
} from './rocketmq-test-page';

interface RocketMQTestPageProps {
  apiName: string;
  onClose: () => void;
  definitionId?: string; // 定义ID，用于获取详细信息
  definitions?: MetadataDefinition[]; // 定义列表，用于查找详细信息
  onRefresh?: () => void; // 刷新目录回调
  spaceId?: string;
}

export function RocketMQTestPage({
  apiName,
  onClose,
  definitionId,
  definitions = [],
  onRefresh,
  spaceId,
}: RocketMQTestPageProps) {
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

  const editor = useApiEditor({ protocol: 'ROCKETMQ', projectId, spaceId, onRefresh });

  const currentDefinition = useMemo(() => (definitionId && definitions.length ? definitions.find((d) => d.id === definitionId) ?? null : null), [definitionId, definitions]);
  const isSyncData = useMemo(() => currentDefinition?.moduleId === 'plugin-sync' || (currentDefinition?.id ?? '').startsWith('sync-'), [currentDefinition]);
  const nodeId = useMemo(() => ((currentDefinition?.id ?? '').startsWith('sync-') ? (currentDefinition!.id as string).replace('sync-', '') : currentDefinition?.id ?? ''), [currentDefinition]);

  const loadedDefinitionIdRef = useRef<string | null>(null);
  const sites = useRocketMQSites();
  const form = useRocketMQForm({ editor, definitionId, definitions, loadedDefinitionIdRef, setSelectedSite: sites.setSelectedSite });
  const send = useRocketMQSend({
    getForm: () => ({ topic: form.topic, tag: form.tag, key: form.key, bodyJson: form.bodyJson, branchTag: form.branchTag }),
    editor,
    projectId,
    definitionId,
    selectedSite: sites.selectedSite,
  });
  const save = useRocketMQSave({
    buildRequestConfig: form.buildRequestConfig,
    selectedSite: sites.selectedSite,
    editor,
    projectId,
    spaceId,
    onRefresh,
    isSyncData,
    nodeId,
    currentDefinition,
    topic: form.topic,
    tag: form.tag,
    key: form.key,
    loadedDefinitionIdRef,
  });
  const resize = useRocketMQResize();

  return (
      <div className="flex-1 flex flex-col bg-white overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" />
            <Input
              value={editor.state.name}
              onChange={(e) => editor.setName(e.target.value)}
              className="h-7 w-52 text-sm"
              placeholder="请输入MQ名称"
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
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Request Section */}
        <div 
          className="flex flex-col min-h-0 overflow-hidden flex-shrink-0"
          style={{ height: resize.requestHeight != null ? `${resize.requestHeight}px` : undefined, flex: resize.requestHeight != null ? '0 0 auto' : undefined }}
        >
          <div className={`p-4 ${editor.state.definitionId ? '' : 'border-b border-gray-300'} space-y-4 overflow-y-auto`}>
          {/* MQ Configuration */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Topic:</label>
                <Input
                  id="rocketmq-topic"
                  name="rocketmq-topic"
                  placeholder="请输入Topic"
                  value={form.topic}
                  onChange={(e) => form.setTopic(e.target.value)}
                  className="border border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">分支环境Tag:</label>
                <Input
                  id="rocketmq-branch-tag"
                  name="rocketmq-branch-tag"
                  placeholder="请输入分支环境Tag（可选）"
                  value={form.branchTag}
                  onChange={(e) => form.setBranchTag(e.target.value)}
                  className="border border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tag:</label>
                <Input
                  id="rocketmq-tag"
                  name="rocketmq-tag"
                  placeholder="请输入Tag"
                  value={form.tag}
                  onChange={(e) => form.setTag(e.target.value)}
                  className="border border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Key:</label>
                <Input
                  id="rocketmq-key"
                  name="rocketmq-key"
                  placeholder="请输入Key"
                  value={form.key}
                  onChange={(e) => form.setKey(e.target.value)}
                  className="border border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">站点:</label>
                <Popover open={sites.sitePopoverOpen} onOpenChange={sites.setSitePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sites.sitePopoverOpen}
                  disabled={sites.sitesLoading || sites.sites.length === 0}
                      className="w-full justify-between h-9 bg-white border border-gray-300 hover:bg-gray-50 text-sm px-3 text-left font-normal"
                    >
                      <span className="truncate flex-1 text-left">
                        {sites.selectedSite 
                          ? (sites.sites.find(s => s.code === sites.selectedSite)?.name || sites.selectedSite)
                          : (sites.sitesLoading ? '加载中...' : sites.sites.length === 0 ? '暂无站点' : '请选择站点')
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">消息内容:</label>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={form.handleFormatJson}
                  >
                    格式化
                  </Button>
                </div>
              </div>
              <Textarea 
                placeholder="请输入消息内容"
                className="min-h-[180px] font-mono text-sm border border-gray-300 rounded"
                value={form.bodyJson}
                onChange={(e) => form.setBodyJson(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons - 使用公共组件 */}
          <SaveBar
            onRun={send.handleSendMessage}
            onSave={save.handleSave}
            saving={editor.state.saving || save.isSavingSyncData}
            runLabel="发送消息"
            saveLabel={isSyncData ? "保存" : "保存"}
            showBottomBorder={false}
            runDisabled={send.sending}
          />
          </div>
        </div>

        {/* 可拖拽的分割线 */}
        <div
          ref={resize.resizeRef}
          className="h-1 border-t border-gray-200 bg-gray-100 cursor-row-resize hover:bg-blue-200 transition-colors relative group flex-shrink-0"
          onMouseDown={(e) => { resize.setIsDragging(true); e.preventDefault(); }}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-gray-400 group-hover:bg-blue-500 transition-colors rounded"></div>
          </div>
        </div>

        <RocketMQResponseSection
          responseTab={send.responseTab}
          onResponseTabChange={send.setResponseTab}
          sending={send.sending}
          hasResult={send.hasResult}
          sendResult={send.sendResult}
          topic={form.topic}
          branchTag={form.branchTag}
        />
      </div>

      {/* 模块选择确认对话框 */}
      <ModuleConfirmDialog
        open={editor.isConfirmDialogOpen}
        onOpenChange={editor.setIsConfirmDialogOpen}
        moduleTree={editor.moduleTree}
        selectedModuleId={editor.confirmModuleId}
        onModuleChange={editor.setConfirmModuleId}
        moduleType="ROCKETMQ"
        projectId={projectId}
        typeId={spaceId}
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
          // 设置模块ID并打开保存对话框（与 HTTP、DUBBO 一致）
          editor.setSelectedModuleId(editor.confirmModuleId);
          editor.setIsConfirmDialogOpen(false);
          save.setIsSaveDialogOpen(true);
        }}
        protocolLabel="RocketMQ"
      />

      {/* 保存对话框 - 使用公共组件（与 HTTP、DUBBO 一致） */}
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
        moduleType="ROCKETMQ"
        projectId={projectId}
        typeId={spaceId}
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
