/**
 * useE2EModuleTree Hook
 * E2E 空间模块树管理逻辑
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { metadataModuleService, MetadataModuleTreeNode } from '@/services/metadata-module';
import type { CaseRealizationSpace } from '@/services/e2e-space';

interface TestModule {
  id: string;
  name: string;
  testCaseCount: number;
  parentId?: string;
  children?: TestModule[];
}

interface UseE2EModuleTreeParams {
  space: CaseRealizationSpace;
}

interface UseE2EModuleTreeReturn {
  // 状态
  modules: TestModule[];
  selectedModule: string | null;
  setSelectedModule: (moduleId: string | null) => void;
  expandedModules: Set<string>;
  setExpandedModules: React.Dispatch<React.SetStateAction<Set<string>>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  // 对话框状态
  isCreateModuleDialogOpen: boolean;
  setIsCreateModuleDialogOpen: (open: boolean) => void;
  newModuleName: string;
  setNewModuleName: (name: string) => void;
  isCreateSubModuleDialogOpen: boolean;
  setIsCreateSubModuleDialogOpen: (open: boolean) => void;
  subModuleParentId: string | null;
  setSubModuleParentId: (id: string | null) => void;
  newSubModuleName: string;
  setNewSubModuleName: (name: string) => void;
  isRenameModuleDialogOpen: boolean;
  setIsRenameModuleDialogOpen: (open: boolean) => void;
  renameModuleId: string | null;
  setRenameModuleId: (id: string | null) => void;
  renameModuleName: string;
  setRenameModuleName: (name: string) => void;
  isDeleteModuleDialogOpen: boolean;
  setIsDeleteModuleDialogOpen: (open: boolean) => void;
  // 操作函数
  loadModules: (preserveSelection?: boolean) => Promise<void>;
  handleCreateModule: () => Promise<void>;
  handleCreateSubModule: () => Promise<void>;
  handleRenameModule: () => Promise<void>;
  handleDeleteModule: () => Promise<void>;
  toggleModule: (moduleId: string) => void;
  handleModuleSelect: (moduleId: string) => void;
  // 工具函数
  flattenModules: (moduleList: TestModule[]) => TestModule[];
  getAllModuleIds: (moduleId: string, moduleList: TestModule[]) => string[];
  isSystemModule: (moduleId: string | null) => boolean;
  getSelectedModuleName: () => string;
}

/**
 * 将 BaseTreeNode 转换为 TestModule 格式
 */
const convertToTestModule = (node: MetadataModuleTreeNode): TestModule => {
  const testCaseCount = 0;
  const children = node.children?.map(convertToTestModule) || [];
  const moduleId = node.id || node.name || `module-${Math.random()}`;
  
  return {
    id: moduleId,
    name: node.name,
    testCaseCount,
    parentId: node.parentId,
    children: children.length > 0 ? children : undefined,
  };
};

/**
 * useE2EModuleTree Hook
 * 管理 E2E 空间的模块树
 */
export function useE2EModuleTree({ space }: UseE2EModuleTreeParams): UseE2EModuleTreeReturn {
  const [modules, setModules] = useState<TestModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  // 对话框状态
  const [isCreateModuleDialogOpen, setIsCreateModuleDialogOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isCreateSubModuleDialogOpen, setIsCreateSubModuleDialogOpen] = useState(false);
  const [subModuleParentId, setSubModuleParentId] = useState<string | null>(null);
  const [newSubModuleName, setNewSubModuleName] = useState('');
  const [isRenameModuleDialogOpen, setIsRenameModuleDialogOpen] = useState(false);
  const [renameModuleId, setRenameModuleId] = useState<string | null>(null);
  const [renameModuleName, setRenameModuleName] = useState('');
  const [isDeleteModuleDialogOpen, setIsDeleteModuleDialogOpen] = useState(false);

  // 加载模块树
  const loadModules = useCallback(async (preserveSelection = false) => {
    try {
      setLoading(true);
      const projectId = space.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        toast.error('项目ID不存在');
        return;
      }

      const previousSelectedModule = preserveSelection ? selectedModule : null;

      const treeNodes = await metadataModuleService.getModuleTree(
        projectId,
        space.id,
        'WORKFLOW'
      );

      const convertedModules = treeNodes.map(convertToTestModule);
      setModules(convertedModules);
      
      // 只有在 preserveSelection=false 且当前没有选中模块时，才自动选择第一个模块
      // 这样可以避免用户手动选择后被重置
      if (!preserveSelection && !selectedModule && convertedModules.length > 0) {
        const firstModule = convertedModules[0];
        if (firstModule && firstModule.id) {
          const firstModuleId = firstModule.id;
          setExpandedModules(new Set([firstModuleId]));
          setSelectedModule(firstModuleId);
        }
      }
      // 如果 preserveSelection=true，保持当前选择不变
      // 如果 preserveSelection=false 但 selectedModule 不为 null，说明用户已经选择了模块，不重置
    } catch (error: any) {
      console.error('加载模块列表失败:', error);
      toast.error(error.message || '加载模块列表失败');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [space.id, space.projectId, selectedModule]);

  // 扁平化模块树以便查找
  const flattenModules = useCallback((moduleList: TestModule[]): TestModule[] => {
    const result: TestModule[] = [];
    const traverse = (items: TestModule[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(moduleList);
    return result;
  }, []);

  // 递归获取模块及其所有子模块的ID列表
  const getAllModuleIds = useCallback((moduleId: string, moduleList: TestModule[]): string[] => {
    const result: string[] = [moduleId];
    
    const findModule = (id: string, modules: TestModule[]): TestModule | null => {
      for (const module of modules) {
        if (module.id === id) {
          return module;
        }
        if (module.children) {
          const found = findModule(id, module.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const module = findModule(moduleId, moduleList);
    if (module && module.children) {
      const traverse = (children: TestModule[]) => {
        for (const child of children) {
          result.push(child.id);
          if (child.children) {
            traverse(child.children);
          }
        }
      };
      traverse(module.children);
    }
    
    return result;
  }, []);

  // 判断是否为系统保留模块
  const isSystemModule = useCallback((moduleId: string | null): boolean => {
    if (!moduleId) return false;
    const allModules = flattenModules(modules);
    const module = allModules.find(m => m.id === moduleId);
    return module?.name === '工作流同步' || module?.name === '默认模块';
  }, [modules, flattenModules]);

  // 获取要删除的模块名称
  const getSelectedModuleName = useCallback((): string => {
    if (!selectedModule) return '';
    const allModules = flattenModules(modules);
    const module = allModules.find(m => m.id === selectedModule);
    return module?.name || '未知模块';
  }, [selectedModule, modules, flattenModules]);

  // 创建模块处理函数
  const handleCreateModule = useCallback(async () => {
    if (!newModuleName.trim()) {
      toast.error('请输入模块名称');
      return;
    }

    try {
      setLoading(true);
      const projectId = space.projectId || localStorage.getItem('currentProjectId');
      if (!projectId) {
        toast.error('项目ID不存在');
        return;
      }

      // 工具栏「新建」始终创建一级模块（根下），子模块用行内「+」添加
      const parentId = 'ROOT';

      const newModuleId = await metadataModuleService.createModule({
        projectId,
        name: newModuleName.trim(),
        parentId,
        moduleType: 'WORKFLOW',
        typeId: space.id,
      });

      toast.success('模块创建成功');
      
      setIsCreateModuleDialogOpen(false);
      setNewModuleName('');
      
      await loadModules(true);
      
      setSelectedModule(newModuleId);
      
      if (parentId !== 'ROOT') {
        setExpandedModules(prev => new Set([...prev, parentId]));
      }
      setExpandedModules(prev => new Set([...prev, newModuleId]));
    } catch (error: any) {
      console.error('创建模块失败:', error);
      toast.error(error.message || '创建模块失败');
    } finally {
      setLoading(false);
    }
  }, [newModuleName, space.projectId, space.id, loadModules]);

  // 创建子模块处理函数
  const handleCreateSubModule = useCallback(async () => {
    if (!newSubModuleName.trim()) {
      toast.error('请输入子模块名称');
      return;
    }

    if (!subModuleParentId) {
      toast.error('父模块ID不存在');
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
        name: newSubModuleName.trim(),
        parentId: subModuleParentId,
        moduleType: 'WORKFLOW',
        typeId: space.id,
      });

      toast.success('子模块创建成功');
      
      setIsCreateSubModuleDialogOpen(false);
      setNewSubModuleName('');
      setSubModuleParentId(null);
      
      await loadModules(true);
      
      setExpandedModules(prev => new Set([...prev, subModuleParentId]));
      setSelectedModule(newModuleId);
    } catch (error: any) {
      console.error('创建子模块失败:', error);
      toast.error(error.message || '创建子模块失败');
    } finally {
      setLoading(false);
    }
  }, [newSubModuleName, subModuleParentId, space.projectId, space.id, loadModules]);

  // 重命名模块处理函数
  const handleRenameModule = useCallback(async () => {
    if (!renameModuleName.trim()) {
      toast.error('请输入模块名称');
      return;
    }

    if (!renameModuleId) {
      toast.error('模块ID不存在');
      return;
    }

    if (isSystemModule(renameModuleId)) {
      toast.error('系统保留模块不允许重命名');
      setIsRenameModuleDialogOpen(false);
      setRenameModuleName('');
      setRenameModuleId(null);
      return;
    }

    try {
      setLoading(true);
      await metadataModuleService.updateModule({
        id: renameModuleId,
        name: renameModuleName.trim(),
      });

      toast.success('模块重命名成功');
      
      setIsRenameModuleDialogOpen(false);
      setRenameModuleName('');
      setRenameModuleId(null);
      
      await loadModules(true);
    } catch (error: any) {
      console.error('重命名模块失败:', error);
      toast.error(error.message || '重命名模块失败');
    } finally {
      setLoading(false);
    }
  }, [renameModuleName, renameModuleId, isSystemModule, loadModules]);

  // 删除模块处理函数
  const handleDeleteModule = useCallback(async () => {
    if (!selectedModule) {
      return;
    }

    if (isSystemModule(selectedModule)) {
      toast.error('系统默认模块不允许删除');
      setIsDeleteModuleDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      await metadataModuleService.deleteModule(selectedModule);
      toast.success('模块删除成功');
      
      setIsDeleteModuleDialogOpen(false);
      
      await loadModules(true);
      
      setSelectedModule(null);
    } catch (error: any) {
      console.error('删除模块失败:', error);
      toast.error(error.message || '删除模块失败');
    } finally {
      setLoading(false);
    }
  }, [selectedModule, isSystemModule, loadModules]);

  // 切换模块展开/折叠
  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  // 选择模块
  const handleModuleSelect = useCallback((moduleId: string) => {
    if (!moduleId) {
      return;
    }
    setSelectedModule(moduleId);
  }, []);

  // 组件挂载时加载模块
  useEffect(() => {
    loadModules();
  }, [loadModules]);

  return {
    modules,
    selectedModule,
    setSelectedModule,
    expandedModules,
    setExpandedModules,
    loading,
    setLoading,
    isCreateModuleDialogOpen,
    setIsCreateModuleDialogOpen,
    newModuleName,
    setNewModuleName,
    isCreateSubModuleDialogOpen,
    setIsCreateSubModuleDialogOpen,
    subModuleParentId,
    setSubModuleParentId,
    newSubModuleName,
    setNewSubModuleName,
    isRenameModuleDialogOpen,
    setIsRenameModuleDialogOpen,
    renameModuleId,
    setRenameModuleId,
    renameModuleName,
    setRenameModuleName,
    isDeleteModuleDialogOpen,
    setIsDeleteModuleDialogOpen,
    loadModules,
    handleCreateModule,
    handleCreateSubModule,
    handleRenameModule,
    handleDeleteModule,
    toggleModule,
    handleModuleSelect,
    flattenModules,
    getAllModuleIds,
    isSystemModule,
    getSelectedModuleName,
  };
}
