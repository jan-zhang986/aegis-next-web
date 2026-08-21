import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Search, Plus, Folder, FolderPlus, Edit, Trash2, 
  ChevronRight, ChevronDown, Layers, Upload, Play, ClipboardList,
  Layers3, Link, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { metadataService, type MetadataDefinition, type MetadataModuleNode } from '@/services/metadata';
import { metadataModuleService } from '@/services/metadata-module';
import { FeatureCaseList } from '@/components/features/case-management';
import type { CaseItem } from '@/components/features/case-management';
import { TestPage } from '@/components/features/api-interfaces/TestPage';
import { DubboTestPage } from '@/components/features/api-interfaces/DubboTestPage';
import { RocketMQTestPage } from '@/components/features/api-interfaces/RocketMQTestPage';
import { FileUploadPage } from '@/components/features/api-interfaces/FileUploadPage';
import type { CaseRealizationSpace } from '@/services/e2e-space';
import { toast } from 'sonner';

interface SpaceAssetDetailPageProps {
  space: CaseRealizationSpace;
  projectId: string;
  onBack: () => void;
  // 以下是透传给 FeatureCaseDetail 使用的状态回调，用于空间内编辑 Case
  spaceCaseMode: 'list' | 'add' | 'edit' | 'copy';
  spaceCaseId: string | null;
  spaceModuleId: string | null;
  setSpaceCaseMode: (mode: 'list' | 'add' | 'edit' | 'copy') => void;
  setSpaceCaseId: (id: string | null) => void;
  setSpaceModuleId: (id: string | null) => void;
}

type AssetType = 'CASE' | 'HTTP' | 'DUBBO' | 'ROCKETMQ' | 'FILE';

export function SpaceAssetDetailPage({
  space,
  projectId,
  onBack,
  spaceCaseMode,
  spaceCaseId,
  spaceModuleId,
  setSpaceCaseMode,
  setSpaceCaseId,
  setSpaceModuleId,
}: SpaceAssetDetailPageProps) {
  const [activeTab, setActiveTab] = useState<AssetType>('CASE');
  
  // 模块树及定义状态
  const [moduleTree, setModuleTree] = useState<MetadataModuleNode[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [definitions, setDefinitions] = useState<MetadataDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 打开调试/编辑器页面的元数据
  const [openedTest, setOpenedTest] = useState<{
    id: string;
    name: string;
    type: 'http' | 'dubbo' | 'rocketmq' | 'file';
    definitionId?: string;
  } | null>(null);

  // 模块增改删弹窗状态
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [isDeleteModuleOpen, setIsDeleteModuleOpen] = useState(false);
  const [moduleFormName, setModuleFormName] = useState('');
  const [editingModuleNode, setEditingModuleNode] = useState<MetadataModuleNode | null>(null);

  // 根据当前Tab转换对应的 moduleType 和 protocol
  const activeConfig = useMemo(() => {
    const configs: Record<AssetType, { type: 'WORKFLOW' | 'API' | 'DUBBO' | 'ROCKETMQ' | 'FILE'; protocol: 'WORKFLOW' | 'HTTP' | 'DUBBO' | 'ROCKETMQ' | 'FILE'; label: string; icon: string }> = {
      CASE: { type: 'WORKFLOW', protocol: 'WORKFLOW', label: '用例资产', icon: '📋' },
      HTTP: { type: 'API', protocol: 'HTTP', label: 'HTTP接口', icon: '🔌' },
      DUBBO: { type: 'DUBBO', protocol: 'DUBBO', label: 'DUBBO服务', icon: '🔄' },
      ROCKETMQ: { type: 'ROCKETMQ', protocol: 'ROCKETMQ', label: 'RocketMQ消息', icon: '🚀' },
      FILE: { type: 'FILE', protocol: 'FILE', label: '文件上传', icon: '📁' },
    };
    return configs[activeTab];
  }, [activeTab]);

  // 加载元数据树
  const loadModuleTree = useCallback(async () => {
    if (!projectId || !space.id || !activeConfig) return;
    try {
      setLoading(true);
      const data = await metadataService.getModuleTree(projectId, {
        typeId: space.id,
        moduleType: activeConfig.type,
      });
      setModuleTree(data || []);
    } catch (error) {
      console.error('加载元数据模块树失败:', error);
      toast.error('加载模块树失败');
    } finally {
      setLoading(false);
    }
  }, [projectId, space.id, activeConfig]);

  // 加载元数据定义列表
  const loadDefinitions = useCallback(async () => {
    if (activeTab === 'CASE' || !projectId || !space.id || !activeConfig) return;
    try {
      setLoading(true);
      const data = await metadataService.getDefinitionPage({
        projectId,
        spaceId: space.id,
        current: 1,
        pageSize: 99999,
        ...(selectedModuleId !== 'all' ? { moduleId: selectedModuleId } : {}),
      });
      // 过滤协议类型匹配的定义
      const filtered = (data || []).filter(
        (def) => def.protocol === activeConfig.protocol
      );
      setDefinitions(filtered);
    } catch (error) {
      console.error('加载元数据定义失败:', error);
      toast.error('加载定义列表失败');
    } finally {
      setLoading(false);
    }
  }, [projectId, space.id, activeTab, activeConfig, selectedModuleId]);

  // 刷新当前资产数据
  const refreshData = useCallback(() => {
    loadModuleTree();
    if (activeTab !== 'CASE') {
      loadDefinitions();
    }
  }, [activeTab, loadModuleTree, loadDefinitions]);

  useEffect(() => {
    setSelectedModuleId('all');
    setOpenedTest(null);
    refreshData();
  }, [activeTab, refreshData]);

  useEffect(() => {
    if (activeTab !== 'CASE') {
      loadDefinitions();
    }
  }, [selectedModuleId, activeTab, loadDefinitions]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // 添加模块
  const handleAddModule = async () => {
    if (!moduleFormName.trim() || !activeConfig) return;
    try {
      await metadataModuleService.createModule({
        projectId,
        name: moduleFormName.trim(),
        parentId: selectedModuleId === 'all' ? 'ROOT' : selectedModuleId,
        moduleType: activeConfig.type,
        typeId: space.id,
      });
      toast.success('添加模块成功');
      setIsAddModuleOpen(false);
      setModuleFormName('');
      loadModuleTree();
    } catch (error) {
      toast.error('添加模块失败');
    }
  };

  // 修改模块
  const handleEditModule = async () => {
    if (!moduleFormName.trim() || !editingModuleNode) return;
    try {
      await metadataModuleService.updateModule({
        id: editingModuleNode.id,
        name: moduleFormName.trim(),
      });
      toast.success('修改模块成功');
      setIsEditModuleOpen(false);
      setModuleFormName('');
      setEditingModuleNode(null);
      loadModuleTree();
    } catch (error) {
      toast.error('修改模块失败');
    }
  };

  // 删除模块
  const handleDeleteModule = async () => {
    if (!editingModuleNode) return;
    try {
      await metadataModuleService.deleteModule(editingModuleNode.id);
      toast.success('删除模块成功');
      setIsDeleteModuleOpen(false);
      setEditingModuleNode(null);
      setSelectedModuleId('all');
      loadModuleTree();
    } catch (error) {
      toast.error('删除模块失败');
    }
  };

  // 新建具体资产（HTTP / DUBBO等）
  const handleCreateAsset = () => {
    if (!activeConfig) return;
    const protocolLower = activeConfig.protocol.toLowerCase() as 'http' | 'dubbo' | 'rocketmq' | 'file';
    setOpenedTest({
      id: '',
      name: `新建${activeConfig.label}`,
      type: protocolLower,
    });
  };

  // 过滤后的定义列表（支持搜索）
  const filteredDefinitions = useMemo(() => {
    if (!searchKeyword.trim()) return definitions;
    const kw = searchKeyword.trim().toLowerCase();
    return definitions.filter(
      (def) =>
        def.name.toLowerCase().includes(kw) ||
        (def.description && def.description.toLowerCase().includes(kw))
    );
  }, [definitions, searchKeyword]);

  // 递归渲染文件夹节点
  const renderFolderNode = (node: MetadataModuleNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedModuleId === node.id;

    return (
      <div key={node.id} style={{ paddingLeft: `${depth * 8}px` }}>
        <div
          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg cursor-pointer transition-all duration-200 group text-slate-700 hover:bg-slate-100 ${
            isSelected ? 'bg-indigo-50/80 text-indigo-700 font-medium' : ''
          }`}
          onClick={() => setSelectedModuleId(node.id)}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(node.id);
            }}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            )}
          </div>
          <Folder className={`w-4 h-4 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span className="text-sm truncate flex-1">{node.name}</span>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedModuleId(node.id);
                setIsAddModuleOpen(true);
              }}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
              title="新建子目录"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingModuleNode(node);
                setModuleFormName(node.name);
                setIsEditModuleOpen(true);
              }}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
              title="重命名"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingModuleNode(node);
                setIsDeleteModuleOpen(true);
              }}
              className="p-0.5 hover:bg-slate-200 rounded text-red-500 hover:text-red-600"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5 border-l border-slate-200/80 ml-2.5">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getMethodColor = (method: string) => {
    switch (String(method).toUpperCase()) {
      case 'GET': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'POST': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PUT': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-50/50 min-w-0 overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-200/80 px-5 py-3 flex items-center justify-between z-10 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center min-w-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center" 
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-400" />
            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mr-2 shadow-sm ${space.iconColor || 'bg-slate-100 text-slate-500'}`}>
              {space.icon || '📁'}
            </div>
            <span className="text-sm font-bold truncate max-w-[240px] tracking-tight">{space.name}</span>
          </Button>
          <Badge className="ml-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/50 h-5.5 px-2 rounded-full text-[10px] font-semibold flex items-center">
            空间测试资产
          </Badge>
        </div>
        
        {activeTab !== 'CASE' && !openedTest && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg flex items-center gap-1.5"
              onClick={refreshData}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </Button>
            <Button
              size="sm"
              className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              onClick={handleCreateAsset}
            >
              <Plus className="w-4 h-4" />
              新建{activeConfig?.label}
            </Button>
          </div>
        )}
      </div>

      {/* 主视图区域 */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* 左侧侧边栏：资产分类 + 模块树 */}
        {!openedTest && (
          <div className="w-72 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-0 overflow-hidden shadow-[1px_0_3px_rgba(0,0,0,0.01)]">
            {/* 5大资产分类节点 */}
            <div className="p-3 border-b border-slate-200/80 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 px-2.5 pb-2 uppercase tracking-wider">资产类别</div>
              
              <button
                onClick={() => setActiveTab('CASE')}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeTab === 'CASE'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList className="w-4.5 h-4.5 shrink-0" />
                <span>用例资产</span>
                {space.testCaseCount != null && (
                  <Badge className={`ml-auto font-medium rounded-full ${activeTab === 'CASE' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {space.testCaseCount}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab('HTTP')}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeTab === 'HTTP'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">🔌</span>
                <span>HTTP 接口</span>
                {space.httpAssetCount != null && (
                  <Badge className={`ml-auto font-medium rounded-full ${activeTab === 'HTTP' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {space.httpAssetCount}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab('DUBBO')}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeTab === 'DUBBO'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">🔄</span>
                <span>DUBBO 服务</span>
                {space.dubboAssetCount != null && (
                  <Badge className={`ml-auto font-medium rounded-full ${activeTab === 'DUBBO' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {space.dubboAssetCount}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ROCKETMQ')}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeTab === 'ROCKETMQ'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">🚀</span>
                <span>RocketMQ</span>
                {space.rocketMqAssetCount != null && (
                  <Badge className={`ml-auto font-medium rounded-full ${activeTab === 'ROCKETMQ' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {space.rocketMqAssetCount}
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab('FILE')}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm text-left transition-all duration-200 ${
                  activeTab === 'FILE'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base shrink-0">📁</span>
                <span>文件上传</span>
                {space.fileAssetCount != null && (
                  <Badge className={`ml-auto font-medium rounded-full ${activeTab === 'FILE' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {space.fileAssetCount}
                  </Badge>
                )}
              </button>
            </div>

            {/* 模块分类树部分 */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <span className="text-xs font-semibold text-slate-500">模块目录</span>
                <button
                  onClick={() => {
                    setSelectedModuleId('all');
                    setIsAddModuleOpen(true);
                  }}
                  className="p-1 hover:bg-slate-200 rounded text-indigo-600 flex items-center gap-1 text-[11px] font-medium"
                  title="添加根模块"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>根模块</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-1 select-none">
                {/* 全部数据节点 */}
                <div
                  onClick={() => setSelectedModuleId('all')}
                  className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer transition-all duration-200 text-slate-700 hover:bg-slate-100 ${
                    selectedModuleId === 'all' ? 'bg-indigo-50/80 text-indigo-700 font-medium' : ''
                  }`}
                >
                  <Layers3 className={`w-4 h-4 ${selectedModuleId === 'all' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className="text-sm">全部元数据</span>
                </div>

                {/* 递归渲染模块树 */}
                {loading && moduleTree.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  </div>
                ) : moduleTree.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">暂无模块</div>
                ) : (
                  moduleTree.map((node) => renderFolderNode(node))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 右侧主内容区域 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
          {openedTest ? (
            // 渲染调试/编辑器面板
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {openedTest.type === 'http' && (
                <TestPage
                  apiType="http"
                  apiName={openedTest.name}
                  onClose={() => {
                    setOpenedTest(null);
                    refreshData();
                  }}
                  definitionId={openedTest.definitionId}
                  spaceId={space.id}
                  onRefresh={loadDefinitions}
                />
              )}
              {openedTest.type === 'dubbo' && (
                <DubboTestPage
                  apiName={openedTest.name}
                  onClose={() => {
                    setOpenedTest(null);
                    refreshData();
                  }}
                  definitionId={openedTest.definitionId}
                  spaceId={space.id}
                  onRefresh={loadDefinitions}
                />
              )}
              {openedTest.type === 'rocketmq' && (
                <RocketMQTestPage
                  apiName={openedTest.name}
                  onClose={() => {
                    setOpenedTest(null);
                    refreshData();
                  }}
                  definitionId={openedTest.definitionId}
                  spaceId={space.id}
                  onRefresh={loadDefinitions}
                />
              )}
              {openedTest.type === 'file' && (
                <FileUploadPage
                  apiName={openedTest.name}
                  onClose={() => {
                    setOpenedTest(null);
                    refreshData();
                  }}
                  definitionId={openedTest.definitionId}
                  spaceId={space.id}
                  onRefresh={loadDefinitions}
                />
              )}
            </div>
          ) : activeTab === 'CASE' ? (
            // 渲染用例资产（全权托管给 FeatureCaseList）
            <div className="flex-1 h-full overflow-hidden">
              <FeatureCaseList
                projectId={projectId}
                spaceId={space.id}
                hideModuleTree={true}
                externalSelectedModuleId={selectedModuleId}
                initialSelectedModuleId={spaceModuleId ?? undefined}
                onEditCase={(item: CaseItem, selModId?: string) => {
                  setSpaceCaseId(item.id);
                  setSpaceModuleId(selModId ?? null);
                  setSpaceCaseMode('edit');
                }}
                onCopyCase={(item: CaseItem, selModId?: string) => {
                  setSpaceCaseId(item.id);
                  setSpaceModuleId(selModId ?? null);
                  setSpaceCaseMode('copy');
                }}
                onCreateCase={(selModId?: string) => {
                  setSpaceCaseId(null);
                  setSpaceModuleId(selModId ?? null);
                  setSpaceCaseMode('add');
                }}
              />
            </div>
          ) : (
            // 渲染元数据资产定义数据表格
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* 工具栏 */}
              <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={`在当前空间搜索${activeConfig?.label}...`}
                    className="pl-9 h-8.5 rounded-lg border-slate-200 bg-white focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                
                <div className="text-xs text-slate-500 font-medium">
                  共 {filteredDefinitions.length} 个元数据定义
                </div>
              </div>

              {/* 数据表格区域 */}
              <div className="flex-1 overflow-auto">
                {loading && filteredDefinitions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="text-slate-500 text-sm">加载中...</span>
                  </div>
                ) : filteredDefinitions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600 mb-0.5">暂无资产定义</p>
                      <p className="text-xs text-slate-400">点击右上角“新建”按钮创建您的第一个{activeConfig?.label}</p>
                    </div>
                  </div>
                ) : (
                  <Table className="border-collapse">
                    <TableHeader className="bg-slate-50/70 border-b border-slate-200/80">
                      <TableRow>
                        <TableHead className="w-56 font-semibold text-slate-700">资产名称</TableHead>
                        {activeTab === 'HTTP' && (
                          <TableHead className="w-96 font-semibold text-slate-700">接口路径 / 详情</TableHead>
                        )}
                        {activeTab === 'DUBBO' && (
                          <TableHead className="w-96 font-semibold text-slate-700">服务接口与方法</TableHead>
                        )}
                        {activeTab === 'ROCKETMQ' && (
                          <TableHead className="w-96 font-semibold text-slate-700">Topic 与 Tag</TableHead>
                        )}
                        {activeTab === 'FILE' && (
                          <TableHead className="w-96 font-semibold text-slate-700">文件键与描述</TableHead>
                        )}
                        <TableHead className="w-32 font-semibold text-slate-700">负责人</TableHead>
                        <TableHead className="w-48 font-semibold text-slate-700">更新时间</TableHead>
                        <TableHead className="w-32 text-right font-semibold text-slate-700">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDefinitions.map((def) => {
                        const reqConfig = def.requestConfig || {};
                        const protocolLower = def.protocol.toLowerCase() as 'http' | 'dubbo' | 'rocketmq' | 'file';
                        
                        return (
                          <TableRow 
                            key={def.id} 
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                            onClick={() => setOpenedTest({
                              id: def.id,
                              name: def.name,
                              type: protocolLower,
                              definitionId: def.id,
                            })}
                          >
                            <TableCell className="font-medium text-slate-900">{def.name}</TableCell>
                            
                            {activeTab === 'HTTP' && (
                              <TableCell>
                                <div className="flex items-center gap-2 max-w-[360px] truncate">
                                  {reqConfig.method && (
                                    <Badge variant="outline" className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getMethodColor(reqConfig.method)}`}>
                                      {reqConfig.method}
                                    </Badge>
                                  )}
                                  <span className="text-slate-600 text-sm truncate">{reqConfig.url || '-'}</span>
                                </div>
                              </TableCell>
                            )}

                            {activeTab === 'DUBBO' && (
                              <TableCell>
                                <div className="text-slate-600 text-sm max-w-[360px] truncate">
                                  <div className="font-semibold text-slate-700 truncate">{reqConfig.interfaceName || '-'}</div>
                                  <div className="text-xs text-slate-400 mt-0.5 font-mono truncate">{reqConfig.methodName || '-'}</div>
                                </div>
                              </TableCell>
                            )}

                            {activeTab === 'ROCKETMQ' && (
                              <TableCell>
                                <div className="text-slate-600 text-sm max-w-[360px] truncate">
                                  <span className="font-semibold text-slate-700">Topic:</span> {reqConfig.topic || '-'}
                                  {reqConfig.tag && (
                                    <span className="ml-2.5"><span className="font-semibold text-slate-700">Tag:</span> {reqConfig.tag}</span>
                                  )}
                                </div>
                              </TableCell>
                            )}

                            {activeTab === 'FILE' && (
                              <TableCell>
                                <div className="text-slate-600 text-xs font-mono max-w-[360px] truncate">
                                  {def.description || '暂无描述'}
                                </div>
                              </TableCell>
                            )}

                            <TableCell className="text-slate-500 text-sm">{def.createUser || '-'}</TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {new Date(def.updateTime).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                                  onClick={() => setOpenedTest({
                                    id: def.id,
                                    name: def.name,
                                    type: protocolLower,
                                    definitionId: def.id,
                                  })}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                                 <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 rounded-lg hover:bg-slate-100"
                                  onClick={async () => {
                                    if (confirm(`确认要删除资产“${def.name}”吗？`)) {
                                      try {
                                        await metadataService.deleteDefinition(def.id);
                                        toast.success('删除成功');
                                        loadDefinitions();
                                      } catch (error) {
                                        toast.error('删除失败');
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模块弹窗定义 */}
      <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">新建模块目录</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              在当前空间下为“{activeConfig?.label}”新建隔离的子模块目录
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module-name" className="text-slate-700 text-sm">目录名称</Label>
              <Input
                id="module-name"
                placeholder="请输入目录名称"
                className="col-span-3 rounded-lg border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                value={moduleFormName}
                onChange={(e) => setModuleFormName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setIsAddModuleOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAddModule}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">重命名模块目录</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-module-name" className="text-slate-700 text-sm">新目录名称</Label>
              <Input
                id="edit-module-name"
                placeholder="请输入新目录名称"
                className="col-span-3 rounded-lg border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                value={moduleFormName}
                onChange={(e) => setModuleFormName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setIsEditModuleOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleEditModule}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModuleOpen} onOpenChange={setIsDeleteModuleOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>确认删除模块？</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              删除模块将同步删除其包含的所有子模块，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setIsDeleteModuleOpen(false)}>
              取消
            </Button>
            <Button size="sm" className="rounded-lg bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteModule}>
              确定删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
