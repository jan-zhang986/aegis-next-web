import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileUp, X, Download, Trash2, Upload, File as FileIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { metadataService, type MetadataDefinition } from '@/services/metadata';
import { toast } from 'sonner';
import { useApiEditor } from '@/hooks/useApiEditor';
import { ApiHeaderBar } from '@/components/features/common/ApiHeaderBar';
import { EnvSelect } from '@/components/features/common/EnvSelect';
import { ModuleConfirmDialog } from '@/components/features/common/ModuleConfirmDialog';
import { ModuleTreeSelect } from '@/components/features/common/ModuleTreeSelect';

interface FileUploadPageProps {
  apiName: string;
  onClose: () => void;
  definitionId?: string;
  definitions?: MetadataDefinition[];
  onRefresh?: () => void;
  spaceId?: string;
}

export function FileUploadPage({ apiName, onClose, definitionId, definitions = [], onRefresh, spaceId }: FileUploadPageProps) {
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
  
  // 使用统一的 API 编辑器 Hook
  const editor = useApiEditor({
    protocol: 'FILE',
    projectId: projectId,
    spaceId,
    onRefresh,
  });

  const [uploadedFileId, setUploadedFileId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从定义中加载数据
  useEffect(() => {
    if (definitionId && definitions.length > 0) {
      const definition = definitions.find(def => def.id === definitionId);
      if (definition) {
        editor.loadFromDefinition(definition);
        // FILE 协议使用 scriptContent 存储文件ID
        if (definition.scriptContent) {
          setUploadedFileId(definition.scriptContent);
        }
      }
    }
  }, [definitionId, definitions, editor]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadedFileId(''); // 清除之前的文件ID
    }
  };

  // 上传文件
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请选择要上传的文件');
      return;
    }
    if (!editor.state.moduleId) {
      toast.error('请选择所属模块');
      return;
    }

    try {
      setIsUploading(true);
      const response = await metadataService.uploadFile(selectedFile, projectId, spaceId);
      setUploadedFileId(response.fileId);
      toast.success('文件上传成功！');
      setSelectedFile(null);
      // 清空文件选择器
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('文件上传失败:', error);
      const errorMessage = error?.message || error?.response?.data?.message || '文件上传失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // 下载文件
  const handleDownload = async (fileId: string) => {
    try {
      const blob = await metadataService.downloadFile(fileId);
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `file-${fileId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('文件下载成功！');
    } catch (error: any) {
      console.error('文件下载失败:', error);
      const errorMessage = error?.message || error?.response?.data?.message || '文件下载失败，请重试';
      toast.error(errorMessage);
    }
  };

  // 保存定义
  const handleSave = async () => {
    if (!editor.state.name.trim()) {
      toast.error('请输入名称');
      return;
    }
    if (!uploadedFileId) {
      toast.error('请先上传文件');
      return;
    }

    // 记录保存前是否为新建接口
    const isNewDefinition = !editor.state.definitionId;

    // 如果是详情页（有 definitionId），直接保存，不需要选择模块
    if (editor.state.definitionId) {
      if (!editor.state.moduleId) {
        toast.error('模块信息缺失，请重新打开该接口');
        return;
      }
      await editor.save({
        scriptContent: uploadedFileId, // 使用 scriptContent 存储文件ID
      });
      if (onRefresh) {
        await onRefresh();
      }
      onClose();
    } else {
      // 新建接口，必须选择模块（打开确认对话框）
      if (!editor.state.moduleId) {
        editor.setIsConfirmDialogOpen(true);
        return;
      }
      // 已选择模块，直接保存
      await editor.save({
        scriptContent: uploadedFileId, // 使用 scriptContent 存储文件ID
      });
      
      // 保存成功后，如果是新建接口，清空表单
      if (isNewDefinition) {
        // 清空名称
        editor.setName('');
        // 清空所属模块
        editor.setSelectedModuleId('');
        // 清空描述
        editor.setDescription('');
        // 清空标签
        editor.setTags([]);
        // 清空文件相关状态
        setUploadedFileId('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 重置 definitionId，通过 loadFromDefinition 传入空定义来重置
        editor.loadFromDefinition({
          id: '',
          name: '',
          protocol: 'FILE',
          projectId: projectId,
          moduleId: '',
          description: '',
          tags: [],
        } as unknown as MetadataDefinition);
      }
      
      if (onRefresh) {
        await onRefresh();
      }
      // 新建接口保存成功后，不关闭页面，保持在创建页面
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <ApiHeaderBar
        protocolLabel="FILE"
        protocolColor="text-purple-500"
        name={editor.state.name}
        onNameChange={editor.setName}
        onClose={onClose}
        namePlaceholder="请输入文件名称"
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧：基本信息 */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">
                    基本信息
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                      名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={editor.state.name}
                      onChange={(e) => editor.setName(e.target.value)}
                      placeholder="请输入文件名称，如：供应链对账单模板"
                      className="h-10 border border-gray-300"
                    />
                  </div>

                  <ModuleTreeSelect
                    moduleTree={editor.moduleTree}
                    moduleId={editor.state.moduleId}
                    onModuleIdChange={editor.setSelectedModuleId}
                    moduleType="FILE"
                    projectId={projectId}
                    typeId={spaceId}
                    onModuleTreeRefresh={async () => {
                      // 只刷新模块树，不刷新定义列表（避免清空用户输入的内容）
                      await editor.refreshModuleTree();
                    }}
                    label="所属模块"
                    required
                    placeholder="请选择所属模块，用于归类当前文件"
                    showQuickCreate={true}
                    defaultExpandFirstLevel={true}
                    disableRootNodes={true}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                      描述
                    </Label>
                    <Input
                      id="description"
                      value={editor.state.description || ''}
                      onChange={(e) => editor.setDescription(e.target.value)}
                      placeholder="请输入文件用途、上下游系统等说明，方便团队理解和维护"
                      className="h-10 border border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-medium text-slate-700">
                      标签（用逗号分隔）
                    </Label>
                    <Input
                      id="tags"
                      value={editor.state.tags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        editor.setTags(tags);
                      }}
                      placeholder="请输入描述例如：合同, 模板, 报表"
                      className="h-10 border border-gray-300"
                    />
                    <p className="text-xs text-slate-400">
                      标签用于在列表中快速筛选和识别不同类型的文件。
                    </p>
                  </div>
                </div>
              </div>

              {/* 右侧：文件上传 */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">
                    文件上传
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* 上传区域 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      选择文件 <span className="text-red-500">*</span>
                    </Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="*/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <FileUp className="w-6 h-6 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            点击或拖拽文件到此处上传
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            支持任意格式，不限制文件类型
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 已选文件信息 */}
                  {selectedFile && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleUpload}
                          disabled={isUploading || !editor.state.moduleId}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          {isUploading ? '上传中...' : '开始上传'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 上传成功提示 */}
                  {uploadedFileId && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-0.5">
                            <FileIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-emerald-900">
                                文件已上传
                              </span>
                              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                FILE 存储
                              </span>
                            </div>
                            <div className="text-xs text-emerald-700 break-all">
                              文件ID：{uploadedFileId}
                            </div>
                            <p className="text-[11px] text-emerald-500">
                              可通过此处按钮直接下载原始文件。
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(uploadedFileId)}
                          className="h-8 text-xs flex-shrink-0"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          下载文件
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-6"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={editor.state.saving}
                  className="h-10 px-6"
                >
                  {editor.state.saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    editor.state.definitionId ? '更新' : '创建'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <ModuleConfirmDialog
          open={editor.isConfirmDialogOpen}
          onOpenChange={editor.setIsConfirmDialogOpen}
          moduleTree={editor.moduleTree}
          selectedModuleId={editor.confirmModuleId}
          onModuleChange={editor.setConfirmModuleId}
          moduleType="FILE"
          projectId={projectId}
          typeId={spaceId}
          onModuleTreeRefresh={async () => {
            // 只刷新模块树，不刷新定义列表（避免清空用户输入的内容）
            await editor.refreshModuleTree();
          }}
          onConfirm={async () => {
            editor.setSelectedModuleId(editor.confirmModuleId);
            editor.setIsConfirmDialogOpen(false);
            
            // 记录保存前是否为新建接口
            const isNewDefinition = !editor.state.definitionId;
            
            // 确认模块后，再次保存
            await editor.save({
              scriptContent: uploadedFileId,
            });
            
            // 保存成功后，如果是新建接口，清空表单
            if (isNewDefinition) {
              // 清空名称
              editor.setName('');
              // 清空所属模块
              editor.setSelectedModuleId('');
              // 清空描述
              editor.setDescription('');
              // 清空标签
              editor.setTags([]);
              // 清空文件相关状态
              setUploadedFileId('');
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              // 重置 definitionId，通过 loadFromDefinition 传入空定义来重置
              editor.loadFromDefinition({
                id: '',
                name: '',
                protocol: 'FILE',
                projectId: projectId,
                moduleId: '',
                description: '',
                tags: [],
              } as unknown as MetadataDefinition);
            }
            
            if (onRefresh) {
              await onRefresh();
            }
            
            // 新建接口保存成功后，不关闭页面，保持在创建页面
            // 更新接口保存成功后，关闭页面
            if (!isNewDefinition) {
              onClose();
            }
          }}
          protocolLabel="文件"
        />
      </div>
    </div>
  );
}
