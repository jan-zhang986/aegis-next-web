import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddModuleDialog } from '../common/AddModuleDialog';
import { ModuleTreeSelect } from '../common/ModuleTreeSelect';
import { metadataService, type MetadataModuleNode, type MetadataDefinition } from '@/services/metadata';
import { http } from '@/utils/request';
import { toast } from 'sonner';
import type { UseMetadataDialogsResult } from '@/hooks/useMetadataDialogs';
import type { CurrentSelection } from '@/hooks/useMetadataSearch';

// 类型配置（与 AddModuleDialog 保持一致）
const TYPE_CONFIG: Record<string, { name: string; icon: string; id: string; category: string }> = {
  'API': { name: 'HTTP接口', icon: '🔌', id: 'metadata-http', category: 'http' },
  'SQL': { name: 'SQL操作', icon: '📊', id: 'metadata-sql', category: 'sql' },
  'DUBBO': { name: 'DUBBO服务', icon: '🔄', id: 'metadata-dubbo', category: 'dubbo' },
  'ROCKETMQ': { name: 'RocketMQ消息', icon: '🚀', id: 'metadata-mq', category: 'rocketmq' },
  'FILE': { name: '文件上传', icon: '📁', id: 'metadata-file', category: 'file' },
  'SCRIPT': { name: '造数工厂', icon: '🏭', id: 'metadata-script', category: 'script' },
};

interface MetadataDialogsProps {
  projectId: string;
  moduleTree: MetadataModuleNode[];
  definitions: MetadataDefinition[];
  selectedDefinitionIds: Set<string>;
  currentSelection: CurrentSelection;
  protocolContext: string;
  calculateModuleCounts: Map<string, number>;
  dialogs: UseMetadataDialogsResult;
  onBatchMove: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onLoadModuleTree: () => Promise<void>;
  onLoadDefinitions: () => Promise<void>;
  onLoadDdlImportEnvironments: () => Promise<void>;
  ddlImportEnvironments: any[];
  onDeleteDefinition: (id: string) => Promise<void>;
  onUpdateCurrentSelection: (selection: CurrentSelection) => void;
}

export function MetadataDialogs({
  projectId,
  moduleTree,
  definitions,
  selectedDefinitionIds,
  currentSelection,
  protocolContext,
  calculateModuleCounts,
  dialogs,
  onBatchMove,
  onRefresh,
  onLoadModuleTree,
  onLoadDefinitions,
  ddlImportEnvironments,
  onDeleteDefinition,
  onUpdateCurrentSelection,
}: MetadataDialogsProps) {
  // 模块选择器状态
  const [isEditModuleSelectOpen, setIsEditModuleSelectOpen] = useState(false);
  const [isDeleteModuleSelectOpen, setIsDeleteModuleSelectOpen] = useState(false);
  const [expandedEditNodes, setExpandedEditNodes] = useState<Set<string>>(new Set());
  const [expandedDeleteNodes, setExpandedDeleteNodes] = useState<Set<string>>(new Set());
  const editSelectRef = useRef<HTMLDivElement>(null);
  const deleteSelectRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editSelectRef.current && !editSelectRef.current.contains(event.target as Node)) {
        setIsEditModuleSelectOpen(false);
      }
      if (deleteSelectRef.current && !deleteSelectRef.current.contains(event.target as Node)) {
        setIsDeleteModuleSelectOpen(false);
      }
    };

    if (isEditModuleSelectOpen || isDeleteModuleSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditModuleSelectOpen, isDeleteModuleSelectOpen]);

  // 递归展平所有节点（包括子节点）
  const flattenNodes = (nodes: MetadataModuleNode[]): MetadataModuleNode[] => {
    const result: MetadataModuleNode[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result.push(...flattenNodes(node.children));
      }
    });
    return result;
  };

  // 生成节点路径
  const getNodePath = (node: MetadataModuleNode): string => {
    const allNodes = flattenNodes(moduleTree);
    if (node.parentId === 'NONE') {
      return node.name;
    }
    const parent = allNodes.find(n => n.id === node.parentId);
    if (parent) {
      const parentPath = getNodePath(parent);
      return parentPath === parent.name 
        ? `${parent.name} / ${node.name}` 
        : `${parentPath} / ${node.name}`;
    }
    return node.name;
  };

  const handleEditModule = async () => {
    if (!dialogs.editModuleName.trim()) {
      toast.error('请输入模块名称');
      return;
    }
    if (!dialogs.editModuleId) {
      toast.error('请选择要修改的模块');
      return;
    }
    // 检查选中的是否是根目录
    const allNodes = flattenNodes(moduleTree);
    const selectedNode = allNodes.find(n => n.id === dialogs.editModuleId);
    if (selectedNode && selectedNode.parentId === 'NONE') {
      toast.error('不能选择根目录');
      return;
    }
    try {
      dialogs.setIsSubmitting(true);
      await metadataService.updateModule({
        id: dialogs.editModuleId,
        name: dialogs.editModuleName.trim(),
      });
      
      toast.success('模块修改成功！');
      dialogs.setIsEditModuleDialogOpen(false);
      dialogs.setEditModuleName('');
      dialogs.setEditModuleId('');
      await onLoadModuleTree();
      // 如果当前选中的就是被修改的模块，更新选择状态
      if (currentSelection.id === dialogs.editModuleId) {
      onUpdateCurrentSelection({
        ...currentSelection,
        name: dialogs.editModuleName.trim(),
      });
      }
    } catch (error) {
      console.error('修改模块失败:', error);
      toast.error('修改模块失败，请重试');
    } finally {
      dialogs.setIsSubmitting(false);
    }
  };

  const handleImportSwagger = async () => {
    if (!dialogs.importUrl.trim()) {
      toast.error('请输入 Swagger URL');
      return;
    }
    if (!dialogs.importModuleId) {
      toast.error('请选择所属模块');
      return;
    }
    const finalProjectId = dialogs.importProjectId || projectId;
    if (!finalProjectId) {
      toast.error('请输入项目ID');
      return;
    }
    if (protocolContext !== 'DUBBO' && !dialogs.importServiceCode.trim()) {
      toast.error('请输入服务代码');
      return;
    }
    try {
      dialogs.setIsImporting(true);
      
      let response;
      if (protocolContext === 'DUBBO') {
        response = await metadataService.importDubboSwagger({
          url: dialogs.importUrl.trim(),
          moduleId: dialogs.importModuleId,
          projectId: finalProjectId,
        });
      } else {
        response = await metadataService.importSwagger({
          url: dialogs.importUrl.trim(),
          serviceCode: dialogs.importServiceCode.trim(),
          projectId: finalProjectId,
          moduleId: dialogs.importModuleId,
        });
      }
      
      let responseData = response;
      if (response?.data) {
        responseData = response.data;
      }
      
      const message = responseData?.data?.message || responseData?.message || '导入成功！';
      toast.success(message);
      dialogs.setIsImportDialogOpen(false);
      dialogs.setImportUrl('');
      dialogs.setImportServiceCode('');
      dialogs.setImportModuleId('');
      dialogs.setImportProjectId('');
      dialogs.setImportApplicationName('');
      dialogs.setImportSiteTenant('');
      await onLoadDefinitions();
      await onLoadModuleTree();
    } catch (error: any) {
      console.error('导入失败:', error);
      const errorMessage = error?.message || error?.response?.data?.message || '导入失败，请重试';
      toast.error(errorMessage);
    } finally {
      dialogs.setIsImporting(false);
    }
  };

  const handleDdlImport = async () => {
    if (!dialogs.ddlImportEnvironmentId) {
      toast.error('请选择环境');
      return;
    }
    if (!dialogs.ddlImportDatabase.trim()) {
      toast.error('请输入数据库名称');
      return;
    }
    if (!dialogs.ddlImportModuleId) {
      toast.error('请选择所属模块');
      return;
    }
    
    try {
      dialogs.setIsDdlImporting(true);
      
      const selectedEnv = ddlImportEnvironments.find(env => env.id === dialogs.ddlImportEnvironmentId);
      if (!selectedEnv || !selectedEnv.dataEndpoint) {
        toast.error('所选环境未配置 dataEndpoint');
        return;
      }
      
      const params: any = {
        dataEndpoint: selectedEnv.dataEndpoint,
        database: dialogs.ddlImportDatabase.trim(),
        projectId: projectId,
        moduleId: dialogs.ddlImportModuleId,
      };
      
      if (dialogs.ddlImportTableName && dialogs.ddlImportTableName.trim()) {
        params.tableName = dialogs.ddlImportTableName.trim();
      }
      
      const response = await http.post('/metadata/definition/import/ddl', params);
      
      let responseData = response;
      if (response?.data) {
        responseData = response.data;
      }
      
      const message = responseData?.data?.message || responseData?.message || 'DDL 导入成功';
      toast.success(message);
      
      dialogs.setIsDdlImportDialogOpen(false);
      dialogs.setDdlImportDatabase('');
      dialogs.setDdlImportTableName('');
      dialogs.setDdlImportModuleId('');
      dialogs.setDdlImportEnvironmentId('');
      
      setTimeout(async () => {
        await onLoadDefinitions();
      }, 2000);
    } catch (error: any) {
      console.error('导入 DDL 失败:', error);
      let errorMessage = '导入 DDL 失败';
      if (error?.response?.data?.error || error?.response?.data?.message) {
        errorMessage = error.response.data.error || error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      dialogs.setIsDdlImporting(false);
    }
  };

  const handleUploadFile = async () => {
    if (!dialogs.uploadFile) {
      toast.error('请选择要上传的文件');
      return;
    }
    if (!dialogs.uploadModuleId) {
      toast.error('请选择所属模块');
      return;
    }
    try {
      dialogs.setIsUploading(true);
      
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsText(dialogs.uploadFile!);
      });
      
      toast.success('文件上传成功！');
      dialogs.setIsUploadDialogOpen(false);
      dialogs.setUploadFile(null);
      dialogs.setUploadModuleId('');
      await onLoadDefinitions();
      await onLoadModuleTree();
    } catch (error: any) {
      console.error('文件上传失败:', error);
      const errorMessage = error?.message || error?.response?.data?.message || '文件上传失败，请重试';
      toast.error(errorMessage);
    } finally {
      dialogs.setIsUploading(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!dialogs.deleteModuleId) {
      toast.error('请选择要删除的模块');
      return;
    }
    // 检查选中的是否是根目录
    const allNodes = flattenNodes(moduleTree);
    const selectedNode = allNodes.find(n => n.id === dialogs.deleteModuleId);
    if (selectedNode && selectedNode.parentId === 'NONE') {
      toast.error('不能选择根目录');
      return;
    }
    try {
      dialogs.setIsSubmitting(true);
      await metadataService.deleteModule(dialogs.deleteModuleId);
      
      toast.success('模块删除成功！');
      dialogs.setIsDeleteModuleDialogOpen(false);
      dialogs.setDeleteModuleId('');
      await onLoadModuleTree();
      // 如果当前选中的就是被删除的模块，清空选择
      if (currentSelection.id === dialogs.deleteModuleId) {
      onUpdateCurrentSelection({ level: 'none' });
      }
    } catch (error) {
      console.error('删除模块失败:', error);
      toast.error('删除模块失败，请重试');
    } finally {
      dialogs.setIsSubmitting(false);
    }
  };

  const handleDeleteDefinition = async () => {
    if (!dialogs.deleteDefinitionId) return;
    try {
      await onDeleteDefinition(dialogs.deleteDefinitionId);
      toast.success('删除成功');
      dialogs.setIsDeleteDefinitionDialogOpen(false);
      dialogs.setDeleteDefinitionId(null);
      dialogs.setDeleteDefinitionName('');
      await onRefresh();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const selectedDefinitions = definitions.filter(def => selectedDefinitionIds.has(def.id));
  const protocols = new Set(selectedDefinitions.map(def => def.protocol));
  const moduleTypeMap: Record<string, 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT'> = {
    'HTTP': 'API',
    'SQL': 'SQL',
    'DUBBO': 'DUBBO',
    'ROCKETMQ': 'ROCKETMQ',
    'FILE': 'FILE',
    'SCRIPT': 'SCRIPT',
  };
  const batchMoveModuleType = protocols.size === 1 ? moduleTypeMap[Array.from(protocols)[0]] : undefined;
  
  // 根据 protocolContext 确定模块类型（用于修改和删除模块对话框）
  const editDeleteModuleType = moduleTypeMap[protocolContext] || undefined;
  
  // 渲染模块选择器（与 AddModuleDialog 保持一致）
  const renderModuleSelector = (
    selectedModuleId: string,
    onModuleChange: (id: string) => void,
    isSelectOpen: boolean,
    setIsSelectOpen: (open: boolean) => void,
    expandedNodes: Set<string>,
    setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>,
    selectRef: React.RefObject<HTMLDivElement>,
    placeholder: string,
    moduleType?: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT'
  ) => {
    // 切换节点展开状态
    const toggleNode = (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedNodes((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    };
    
    // 选择节点（不允许选择根目录）
    const selectNode = (node: MetadataModuleNode) => {
      // 根目录（parentId 为 'NONE'）不允许选择
      if (node.parentId === 'NONE') {
        toast.error('不能选择根目录');
        return;
      }
      onModuleChange(node.id);
      setIsSelectOpen(false);
    };
    
    // 递归渲染树形节点（只过滤掉 WORKFLOW 类型，允许其他所有类型）
    const renderTreeNode = (node: MetadataModuleNode, level: number = 0): JSX.Element | null => {
      // 只过滤掉 WORKFLOW 类型的节点，允许其他所有类型
      if ((node.type as string) === 'WORKFLOW') {
        return null;
      }
      
      const config = TYPE_CONFIG[node.type] || TYPE_CONFIG['API'];
      const indent = level * 16;
      // 过滤子节点，只排除 WORKFLOW 类型，允许其他所有类型
      const validChildren = node.children?.filter(child => {
        const childType = child.type as string;
        return childType !== 'WORKFLOW';
      }) || [];
      const hasChildren = validChildren.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const isSelected = selectedModuleId === node.id;
      const isRootNode = node.parentId === 'NONE'; // 根节点不可选择
      
      return (
        <div key={node.id}>
          <div
            onClick={() => {
              if (!isRootNode) {
                selectNode(node);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 ${
              isRootNode 
                ? 'cursor-default' 
                : 'hover:bg-gray-100 cursor-pointer'
            } ${
              isSelected ? 'bg-blue-50' : ''
            }`}
            style={{ paddingLeft: `${indent + 12}px` }}
            title={isRootNode ? '根目录不可修改' : undefined}
          >
            {/* 展开/收起按钮 */}
            <div
              onClick={(e) => {
                if (hasChildren) {
                  toggleNode(node.id, e);
                }
              }}
              className="w-4 h-4 flex items-center justify-center flex-shrink-0"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )
              ) : (
                <div className="w-3 h-3"></div>
              )}
            </div>
            <span className={`text-sm flex-1 ${
              isSelected 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-900'
            }`}>
              {node.name}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              ({config?.name || node.type})
            </span>
          </div>
          {/* 递归渲染子节点（只渲染非 WORKFLOW 类型的子节点） */}
          {hasChildren && isExpanded && (
            <>
              {validChildren.map(child => renderTreeNode(child, level + 1)).filter(Boolean)}
            </>
          )}
        </div>
      );
    };
    
    // 只渲染顶级节点（parentId 为 NONE 的节点），排除 WORKFLOW 类型
    const topLevelNodes = moduleTree
      .filter(node => {
        if (node.parentId !== 'NONE') return false;
        if ((node.type as string) === 'WORKFLOW') return false;
        return true;
      })
      // 排序：SCRIPT 类型放在后面，其他类型保持原顺序
      .sort((a, b) => {
        const aIsScript = (a.type as string) === 'SCRIPT';
        const bIsScript = (b.type as string) === 'SCRIPT';
        if (aIsScript && !bIsScript) return 1; // SCRIPT 排在后面
        if (!aIsScript && bIsScript) return -1; // 非 SCRIPT 排在前面
        return 0; // 相同类型保持原顺序
      });
    
    const selectedNode = selectedModuleId ? (() => {
      const allNodes = flattenNodes(moduleTree);
      return allNodes.find(n => n.id === selectedModuleId);
    })() : null;

    return (
      <div className="space-y-2">
        <div className="relative" ref={selectRef}>
          {/* 触发器 */}
          <button
            type="button"
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className={selectedModuleId ? 'text-gray-900' : 'text-gray-500'}>
              {selectedNode ? selectedNode.name : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* 下拉树形列表 */}
          {isSelectOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[300px] overflow-y-auto">
              {topLevelNodes.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  暂无模块
                </div>
              ) : (
                topLevelNodes.map(node => renderTreeNode(node, 0)).filter(Boolean)
              )}
            </div>
          )}
        </div>
        {selectedNode && (
          <div className="text-xs text-gray-500 mt-1">
            路径: {getNodePath(selectedNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={dialogs.isBatchMoveDialogOpen} onOpenChange={dialogs.setIsBatchMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量移动</DialogTitle>
            <DialogDescription>
              {protocols.size !== 1
                ? '无法移动：选中的元数据类型不一致，只能选择同类型的元数据进行批量移动'
                : `将选中的 ${selectedDefinitionIds.size} 个元数据移动到目标模块`}
            </DialogDescription>
          </DialogHeader>
          
          {protocols.size !== 1 ? (
            <>
              <div className="py-4">
                <p className="text-sm text-gray-600">
                  请确保选中的元数据类型一致（只能选择同类型的元数据进行批量移动）
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => dialogs.setIsBatchMoveDialogOpen(false)}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <ModuleTreeSelect
                  moduleTree={moduleTree}
                  moduleId={dialogs.batchMoveTargetModuleId}
                  onModuleIdChange={dialogs.setBatchMoveTargetModuleId}
                  projectId={projectId}
                  onModuleTreeRefresh={onLoadModuleTree}
                  label="目标模块"
                  required
                  placeholder="请选择目标模块"
                  showQuickCreate={true}
                  defaultExpandFirstLevel={true}
                  disableRootNodes={false}
                  moduleType={batchMoveModuleType}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => dialogs.setIsBatchMoveDialogOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={onBatchMove}
                  disabled={dialogs.isBatchMoving || !dialogs.batchMoveTargetModuleId}
                >
                  {dialogs.isBatchMoving ? '移动中...' : '确定'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddModuleDialog
        open={dialogs.isAddModuleDialogOpen}
        onOpenChange={dialogs.setIsAddModuleDialogOpen}
        moduleTree={moduleTree}
        projectId={projectId}
        moduleType={dialogs.selectedModuleType}
        onSuccess={onLoadModuleTree}
      />

      <Dialog 
        open={dialogs.isEditModuleDialogOpen} 
        onOpenChange={(open) => {
          dialogs.setIsEditModuleDialogOpen(open);
          if (!open) {
            // 关闭时清空状态
            dialogs.setEditModuleName('');
            dialogs.setEditModuleId('');
            setIsEditModuleSelectOpen(false);
            setExpandedEditNodes(new Set());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改模块</DialogTitle>
            <DialogDescription>选择要修改的模块并修改模块名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editModule">选择模块 *</Label>
              {renderModuleSelector(
                dialogs.editModuleId,
                (id) => {
                  dialogs.setEditModuleId(id);
                  // 根据选中的模块自动填充名称
                  const allNodes = flattenNodes(moduleTree);
                  const selectedNode = allNodes.find(n => n.id === id);
                  if (selectedNode) {
                    dialogs.setEditModuleName(selectedNode.name);
                  }
                },
                isEditModuleSelectOpen,
                setIsEditModuleSelectOpen,
                expandedEditNodes,
                setExpandedEditNodes,
                editSelectRef,
                '请选择要修改的模块'
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editModuleName">模块名称 *</Label>
              <Input
                id="editModuleName"
                placeholder="请输入模块名称"
                value={dialogs.editModuleName}
                onChange={(e) => dialogs.setEditModuleName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogs.setIsEditModuleDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditModule} disabled={dialogs.isSubmitting}>
              {dialogs.isSubmitting ? '修改中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogs.isImportDialogOpen} onOpenChange={dialogs.setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {protocolContext === 'DUBBO' ? '导入 DUBBO Swagger' : '导入 Swagger'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {protocolContext === 'DUBBO' ? (
                <>
                  Swagger URL示例：
                  <br />
                  http://spotter-snap-rpc.tst.spotter.ink/rpc/application-tree/swagger?application=spotter-order
                </>
              ) : (
                <>
                  Swagger URL示例：
                  <br />
                  http://api.tst.spotterio.com/spotter-evidence-web/swagger/doc
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="importUrl">
                Swagger URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="importUrl"
                placeholder="请输入Swagger URL"
                value={dialogs.importUrl}
                onChange={(e) => dialogs.setImportUrl(e.target.value)}
                className="border border-gray-300"
              />
            </div>
            {protocolContext !== 'DUBBO' && (
              <div className="space-y-2">
                <Label htmlFor="importServiceCode">
                  服务代码 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="importServiceCode"
                  placeholder="请输入服务代码"
                  value={dialogs.importServiceCode}
                  onChange={(e) => dialogs.setImportServiceCode(e.target.value)}
                  className="border border-gray-300"
                />
              </div>
            )}
            <ModuleTreeSelect
              moduleTree={moduleTree}
              moduleId={dialogs.importModuleId}
              onModuleIdChange={dialogs.setImportModuleId}
              moduleType={protocolContext === 'DUBBO' ? 'DUBBO' : 'API'}
              projectId={projectId}
              onModuleTreeRefresh={onLoadModuleTree}
              label="所属模块"
              required
              placeholder="请选择模块"
              showQuickCreate={true}
              defaultExpandFirstLevel={true}
              disableRootNodes={false}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogs.setIsImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImportSwagger} disabled={dialogs.isImporting}>
              {dialogs.isImporting ? '导入中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogs.isDdlImportDialogOpen} onOpenChange={dialogs.setIsDdlImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入 DDL</DialogTitle>
            <DialogDescription>从数据库导入表结构定义（DDL）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ddlImportEnvironment">环境 *</Label>
              <Select
                value={dialogs.ddlImportEnvironmentId}
                onValueChange={dialogs.setDdlImportEnvironmentId}
              >
                <SelectTrigger className="border border-gray-300">
                  <SelectValue placeholder="请选择环境" />
                </SelectTrigger>
                <SelectContent>
                  {ddlImportEnvironments.map((env) => (
                    <SelectItem key={env.id} value={env.id || ''}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ddlImportDatabase">数据库 *</Label>
              <Input
                id="ddlImportDatabase"
                placeholder="请输入数据库名称"
                value={dialogs.ddlImportDatabase}
                onChange={(e) => dialogs.setDdlImportDatabase(e.target.value)}
                className="border border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ddlImportTableName">表名（可选）</Label>
              <Input
                id="ddlImportTableName"
                placeholder="不填写则导入全部数据库"
                value={dialogs.ddlImportTableName}
                onChange={(e) => dialogs.setDdlImportTableName(e.target.value)}
                className="border border-gray-300"
              />
            </div>
            <ModuleTreeSelect
              moduleTree={moduleTree}
              moduleId={dialogs.ddlImportModuleId}
              onModuleIdChange={dialogs.setDdlImportModuleId}
              moduleType="SQL"
              projectId={projectId}
              onModuleTreeRefresh={onLoadModuleTree}
              label="所属模块"
              required
              placeholder="请选择模块"
              showQuickCreate={true}
              defaultExpandFirstLevel={true}
              disableRootNodes={false}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                dialogs.setIsDdlImportDialogOpen(false);
                dialogs.setDdlImportDatabase('');
                dialogs.setDdlImportTableName('');
                dialogs.setDdlImportModuleId('');
                dialogs.setDdlImportEnvironmentId('');
              }}
            >
              取消
            </Button>
            <Button onClick={handleDdlImport} disabled={dialogs.isDdlImporting}>
              {dialogs.isDdlImporting ? '导入中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {projectId && (
        <AddModuleDialog
          open={dialogs.isImportCreateModuleDialogOpen}
          onOpenChange={dialogs.setIsImportCreateModuleDialogOpen}
          moduleTree={moduleTree}
          projectId={projectId}
          moduleType={protocolContext === 'DUBBO' ? 'DUBBO' : 'API'}
          title="快速创建模块"
          description="选择父模块，创建新的子模块"
          onSuccess={onLoadModuleTree}
        />
      )}

      <Dialog open={dialogs.isUploadDialogOpen} onOpenChange={dialogs.setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>上传文件导入接口定义（支持 JSON、YAML 等格式）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uploadFile">选择文件 *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="uploadFile"
                  type="file"
                  accept=".json,.yaml,.yml,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      dialogs.setUploadFile(file);
                    }
                  }}
                  className="flex-1"
                />
                {dialogs.uploadFile && (
                  <span className="text-sm text-gray-600">{dialogs.uploadFile.name}</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadModuleId">所属模块 *</Label>
              <Select value={dialogs.uploadModuleId} onValueChange={dialogs.setUploadModuleId}>
                <SelectTrigger id="uploadModuleId">
                  <SelectValue placeholder="请输入模块" />
                </SelectTrigger>
                <SelectContent>
                  {moduleTree
                    .filter(node => node.type === protocolContext || (protocolContext === 'HTTP' && node.type === 'API'))
                    .map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({calculateModuleCounts.get(node.id) || 0})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogs.setIsUploadDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUploadFile} disabled={dialogs.isUploading}>
              {dialogs.isUploading ? '上传中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={dialogs.isDeleteModuleDialogOpen} 
        onOpenChange={(open) => {
          dialogs.setIsDeleteModuleDialogOpen(open);
          if (!open) {
            // 关闭时清空状态
            dialogs.setDeleteModuleId('');
            setIsDeleteModuleSelectOpen(false);
            setExpandedDeleteNodes(new Set());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除模块</DialogTitle>
            <DialogDescription>
              选择要删除的模块。删除后该模块下的所有接口也将被删除，此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deleteModule">选择模块 *</Label>
              {renderModuleSelector(
                dialogs.deleteModuleId,
                dialogs.setDeleteModuleId,
                isDeleteModuleSelectOpen,
                setIsDeleteModuleSelectOpen,
                expandedDeleteNodes,
                setExpandedDeleteNodes,
                deleteSelectRef,
                '请选择要删除的模块'
              )}
            </div>
            {dialogs.deleteModuleId && (() => {
              const allNodes = flattenNodes(moduleTree);
              const selectedNode = allNodes.find(n => n.id === dialogs.deleteModuleId);
              return selectedNode ? (
                <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <p className="font-medium text-red-900">警告：将删除模块 "{selectedNode.name}"</p>
                  <p className="text-red-700 mt-1">该模块下的所有接口也将被删除，此操作不可恢复。</p>
                </div>
              ) : null;
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogs.setIsDeleteModuleDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteModule} disabled={dialogs.isSubmitting}>
              {dialogs.isSubmitting ? '删除中...' : '确定删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogs.isDeleteDefinitionDialogOpen} onOpenChange={dialogs.setIsDeleteDefinitionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除确认</DialogTitle>
            <DialogDescription>
              确定要删除 "{dialogs.deleteDefinitionName}" 吗？删除后无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogs.setIsDeleteDefinitionDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteDefinition}>
              确定删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

