/**
 * ModuleTreePanel Component
 * 模块树面板组件
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import React from 'react';
import { Search, Plus, FolderPlus, FileText, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Pencil, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { metadataModuleService } from '@/services/metadata-module';
import type { CaseRealizationSpace } from '@/services/e2e-space';

interface TestModule {
  id: string;
  name: string;
  testCaseCount: number;
  parentId?: string;
  children?: TestModule[];
}

interface ModuleTreePanelProps {
  space: CaseRealizationSpace;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  modules: TestModule[];
  selectedModule: string | null;
  expandedModules: Set<string>;
  loading: boolean;
  isCreateModuleDialogOpen: boolean;
  setIsCreateModuleDialogOpen: (open: boolean) => void;
  isCreateSubModuleDialogOpen: boolean;
  setIsCreateSubModuleDialogOpen: (open: boolean) => void;
  subModuleParentId: string | null;
  setSubModuleParentId: (id: string | null) => void;
  isRenameModuleDialogOpen: boolean;
  setIsRenameModuleDialogOpen: (open: boolean) => void;
  renameModuleId: string | null;
  setRenameModuleId: (id: string | null) => void;
  renameModuleName: string;
  setRenameModuleName: (name: string) => void;
  isDeleteModuleDialogOpen: boolean;
  setIsDeleteModuleDialogOpen: (open: boolean) => void;
  toggleModule: (moduleId: string) => void;
  handleModuleSelect: (moduleId: string) => void;
  flattenModules: (moduleList: TestModule[]) => TestModule[];
  isSystemModule: (moduleId: string | null) => boolean;
  getModuleTestCaseCount: (moduleId: string) => number;
  loadModules: (preserveSelection?: boolean) => Promise<void>;
  setSelectedModule: (moduleId: string | null) => void;
  setExpandedModules: React.Dispatch<React.SetStateAction<Set<string>>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ModuleTreePanel: React.FC<ModuleTreePanelProps> = ({
  space,
  searchTerm,
  setSearchTerm,
  modules,
  selectedModule,
  expandedModules,
  loading,
  isCreateModuleDialogOpen,
  setIsCreateModuleDialogOpen,
  isCreateSubModuleDialogOpen,
  setIsCreateSubModuleDialogOpen,
  subModuleParentId,
  setSubModuleParentId,
  isRenameModuleDialogOpen,
  setIsRenameModuleDialogOpen,
  renameModuleId,
  setRenameModuleId,
  renameModuleName,
  setRenameModuleName,
  isDeleteModuleDialogOpen,
  setIsDeleteModuleDialogOpen,
  toggleModule,
  handleModuleSelect,
  flattenModules,
  isSystemModule,
  getModuleTestCaseCount,
  loadModules,
  setSelectedModule,
  setExpandedModules,
  setLoading,
}) => {
  const displayModules = modules;

  const renderModule = (moduleItem: TestModule): JSX.Element => {
    if (!moduleItem) {
      return <></>;
    }
    
    const moduleId = moduleItem.id || moduleItem.name || `module-${Math.random()}`;
    const isSelected = selectedModule !== null && selectedModule !== undefined && String(selectedModule) === String(moduleId);
    const testCaseCount = getModuleTestCaseCount(moduleId);
    const hasChildren = moduleItem.children && moduleItem.children.length > 0;
    const isExpanded = expandedModules.has(moduleId);
    
    return (
      <div 
        key={moduleId} 
        className="group mb-0.5"
        data-selected={isSelected ? 'true' : undefined}
      >
        <div
          className={`module-row flex items-center gap-1 px-2 py-1.5 rounded text-sm cursor-pointer ${
            isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleModule(moduleId);
            }
            handleModuleSelect(moduleId);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}
          
          <div className="module-icon flex-shrink-0">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
          </div>
          
          <span className="flex-1 truncate">{moduleItem.name}</span>
          
          <div className="flex items-center gap-1 flex-shrink-0 ml-1 min-w-[24px] justify-end">
            {testCaseCount > 0 && (
              <span className="test-case-count text-xs text-gray-400">
                {testCaseCount}
              </span>
            )}
            
            {!isSystemModule(moduleId) && (
              <div className={`module-actions flex items-center gap-1 ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubModuleParentId(moduleId);
                    setIsCreateSubModuleDialogOpen(true);
                  }}
                  title="添加子模块"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSystemModule(moduleId)) {
                          toast.error('系统保留模块不允许重命名');
                          return;
                        }
                        const module = flattenModules(displayModules).find(m => m.id === moduleId);
                        setRenameModuleId(moduleId);
                        setRenameModuleName(module?.name || '');
                        setIsRenameModuleDialogOpen(true);
                      }}
                      disabled={isSystemModule(moduleId)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async (e) => {
                        e.stopPropagation();
                        const sourceModule = flattenModules(displayModules).find(m => m.id === moduleId);
                        if (!sourceModule) {
                          toast.error('模块不存在');
                          return;
                        }

                        try {
                          setLoading(true);
                          const projectId = space.projectId || localStorage.getItem('currentProjectId');
                          if (!projectId) {
                            toast.error('项目ID不存在');
                            return;
                          }

                          const newModuleId = await metadataModuleService.createModule({
                            projectId,
                            name: `${sourceModule.name}_copy`,
                            parentId: sourceModule.parentId || 'ROOT',
                            moduleType: 'WORKFLOW',
                            typeId: space.id,
                          });

                          toast.success('模块复制成功');
                          
                          await loadModules(true);
                          setSelectedModule(newModuleId);
                          if (sourceModule.parentId && sourceModule.parentId !== 'ROOT') {
                            setExpandedModules(prev => new Set([...prev, sourceModule.parentId!]));
                          }
                        } catch (error: any) {
                          console.error('复制模块失败:', error);
                          toast.error(error.message || '复制模块失败');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      复制模块
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSystemModule(moduleId)) {
                          toast.error('系统保留模块不允许删除');
                          return;
                        }
                        setSelectedModule(moduleId);
                        setIsDeleteModuleDialogOpen(true);
                      }}
                      disabled={isSystemModule(moduleId)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5">
            {moduleItem.children
              ?.filter(child => child)
              .map((child) => renderModule(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索目标或接口"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsCreateModuleDialogOpen(true)}
            title="新建模块"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              const allModuleIds = flattenModules(displayModules).map(m => m.id);
              if (expandedModules.size === allModuleIds.length && allModuleIds.length > 0) {
                setExpandedModules(new Set());
              } else {
                setExpandedModules(new Set(allModuleIds));
              }
            }}
            title="展开/收起全部模块"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            disabled={!selectedModule}
            onClick={async () => {
              if (!selectedModule) return;
              
              try {
                setLoading(true);
                const allModules = flattenModules(displayModules);
                const sourceModule = allModules.find(m => m.id === selectedModule);
                if (!sourceModule) {
                  toast.error('模块不存在');
                  return;
                }

                const projectId = space.projectId || localStorage.getItem('currentProjectId');
                if (!projectId) {
                  toast.error('项目ID不存在');
                  return;
                }

                const newModuleId = await metadataModuleService.createModule({
                  projectId,
                  name: `${sourceModule.name}_copy`,
                  parentId: sourceModule.parentId || 'ROOT',
                  moduleType: 'WORKFLOW',
                  typeId: space.id,
                });

                toast.success('模块复制成功');
                await loadModules(true);
                setSelectedModule(newModuleId);
                if (sourceModule.parentId && sourceModule.parentId !== 'ROOT') {
                  setExpandedModules(prev => new Set([...prev, sourceModule.parentId!]));
                }
              } catch (error: any) {
                console.error('复制模块失败:', error);
                toast.error(error.message || '复制模块失败');
              } finally {
                setLoading(false);
              }
            }}
            title={selectedModule ? "复制模块" : "请先选择要复制的模块"}
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            disabled={!selectedModule || loading || isSystemModule(selectedModule)}
            onClick={() => {
              if (selectedModule) {
                if (isSystemModule(selectedModule)) {
                  toast.error('系统保留模块不允许删除');
                  return;
                }
                setIsDeleteModuleDialogOpen(true);
              }
            }}
            title={selectedModule ? (isSystemModule(selectedModule) ? "系统保留模块不允许删除" : "删除模块") : "请先选择要删除的模块"}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {loading && displayModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-500">加载中...</p>
          </div>
        ) : displayModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">暂无模块</p>
            <p className="text-xs text-gray-500 text-center mb-4">
              创建模块以组织和管理测试用例
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setIsCreateModuleDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              新建模块
            </Button>
          </div>
        ) : (
          displayModules.map((module) => renderModule(module))
        )}
      </div>
    </div>
  );
};
