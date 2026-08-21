/**
 * 通用接口编辑 Hook
 * 统一管理 HTTP / SQL / DUBBO / MQ 等协议的接口编辑状态与保存逻辑
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  metadataService,
  type MetadataDefinition,
  type MetadataModuleNode,
  type UserProfile,
  type AddMetadataDefinitionParams,
  type UpdateMetadataDefinitionParams,
} from '@/services/metadata';
import type { ApiEditorState } from '@/types';

export type ApiProtocol = MetadataDefinition['protocol'];

export interface UseApiEditorOptions {
  /** 当前接口协议类型，例如 'HTTP' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'TCP' | 'WEBSOCKET' | 'SCRIPT' */
  protocol: ApiProtocol;
  /** 项目标识 */
  projectId: string;
  /** 当前 Space，存在时模块树和保存都限定在该 Space */
  spaceId?: string;
  /** 初始定义（用于详情回显，可选） */
  initialDefinition?: MetadataDefinition | null;
  /** 保存成功后的回调，一般用于刷新列表 */
  onRefresh?: () => void;
}

export interface SavePayload {
  /** HTTP、DUBBO 等使用的请求配置 */
  requestConfig?: UpdateMetadataDefinitionParams['requestConfig'];
  /** SQL / 脚本类接口使用的脚本内容 */
  scriptContent?: string;
}

export interface UseApiEditorResult {
  state: ApiEditorState;

  // 环境相关
  environments: UserProfile[];
  selectedEnvironment: string;
  setSelectedEnvironment: (envId: string) => void;

  // 模块树 & 选择模块（二次确认弹窗使用）
  moduleTree: MetadataModuleNode[];
  confirmModuleId: string;
  setConfirmModuleId: (moduleId: string) => void;
  isConfirmDialogOpen: boolean;
  setIsConfirmDialogOpen: (open: boolean) => void;
  refreshModuleTree: () => Promise<void>;

  // 基础信息编辑
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string[]) => void;
  setSelectedModuleId: (moduleId: string) => void;

  // 加载 / 回显 / 保存
  loadFromDefinition: (definition: MetadataDefinition) => void;
  save: (payload: SavePayload) => Promise<void>;
}

/**
 * 协议到模块类型的映射
 */
const PROTOCOL_TO_MODULE_TYPE: Record<ApiProtocol, MetadataModuleNode['type'] | undefined> = {
  HTTP: 'API',
  SQL: 'SQL',
  DUBBO: 'DUBBO',
  ROCKETMQ: 'ROCKETMQ',
  TCP: 'TCP',
  WEBSOCKET: 'WEBSOCKET',
  FILE: 'FILE',
  // SCRIPT 类型通常对应脚本，不一定有模块类型，这里留空以便调用方自行处理
  SCRIPT: undefined,
};

export function useApiEditor(options: UseApiEditorOptions): UseApiEditorResult {
  const { protocol, projectId, spaceId, initialDefinition, onRefresh } = options;

  const [state, setState] = useState<ApiEditorState>(() => ({
    definitionId: initialDefinition?.id,
    protocol,
    projectId,
    name: initialDefinition?.name || '',
    moduleId: initialDefinition?.moduleId,
    description: initialDefinition?.description,
    tags: initialDefinition?.tags || [],
    environmentId: undefined,
    loading: false,
    saving: false,
  }));

  const [environments, setEnvironments] = useState<UserProfile[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [moduleTree, setModuleTree] = useState<MetadataModuleNode[]>([]);
  const [confirmModuleId, setConfirmModuleId] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const currentModuleType = useMemo(
    () => PROTOCOL_TO_MODULE_TYPE[protocol],
    [protocol],
  );

  // 加载环境列表
  useEffect(() => {
    let mounted = true;
    const loadEnvs = async () => {
      try {
        const data = await metadataService.getUserProfilePage({
          projectId,
          current: 1,
          pageSize: 50,
        });
        if (!mounted) return;
        setEnvironments(data || []);
        if (data && data.length > 0 && !selectedEnvironment) {
          setSelectedEnvironment(data[0].id);
        }
      } catch (e) {
        console.error('加载环境列表失败:', e);
      }
    };
    loadEnvs();
    return () => {
      mounted = false;
    };
  }, [projectId, selectedEnvironment]);

  // 加载模块树的函数（可复用）
  const loadModules = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const data = await metadataService.getModuleTree(projectId, {
        ...(spaceId && currentModuleType ? { typeId: spaceId, moduleType: currentModuleType } : {}),
      });
      setModuleTree(data || []);

      // 如果还未选择模块，且存在当前协议对应的模块，则默认选中第一个（用于确认对话框）
      // 使用函数式更新来获取最新的 state 值，避免依赖 state.moduleId
      setState((prev) => {
        if (!prev.moduleId && !confirmModuleId && currentModuleType) {
          // 展平所有节点，查找符合条件的子节点（排除根节点）
          const allNodes: MetadataModuleNode[] = [];
          const flatten = (nodes: MetadataModuleNode[]) => {
            nodes.forEach(node => {
              allNodes.push(node);
              if (node.children) {
                flatten(node.children);
              }
            });
          };
          flatten(data || []);
          const target = allNodes.filter((m) => m.type === currentModuleType && m.parentId !== 'NONE');
          if (target.length > 0) {
            // 使用 setTimeout 避免在 effect 中直接调用 setState 导致的问题
            setTimeout(() => {
              setConfirmModuleId(target[0].id);
            }, 0);
          }
        }
        return prev;
      });
    } catch (e) {
      console.error('加载模块树失败:', e);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [projectId, spaceId, currentModuleType, confirmModuleId]);

  // 刷新模块树的方法（供外部调用）
  const refreshModuleTree = useCallback(async () => {
    await loadModules();
  }, [loadModules]);

  // 加载模块树（只在 projectId 或 currentModuleType 变化时加载，避免重复调用）
  useEffect(() => {
    let mounted = true;
    const initLoad = async () => {
      await loadModules();
    };
    initLoad();
    return () => {
      mounted = false;
    };
    // 只在 projectId 或 currentModuleType 变化时重新加载
    // 移除 confirmModuleId 和 state.moduleId 依赖，避免重复调用接口
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentModuleType]);

  const loadFromDefinition = useCallback((definition: MetadataDefinition) => {
    setState((prev) => ({
      ...prev,
      definitionId: definition.id,
      protocol: definition.protocol,
      projectId: definition.projectId,
      name: definition.name || '',
      moduleId: definition.moduleId,
      description: definition.description,
      tags: definition.tags || [],
    }));
  }, []);

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setTags = useCallback((tags: string[]) => {
    setState((prev) => ({ ...prev, tags }));
  }, []);

  const setSelectedModuleId = useCallback((moduleId: string) => {
    setState((prev) => ({ ...prev, moduleId }));
  }, []);

  const save = useCallback(
    async (payload: SavePayload) => {
      const { requestConfig, scriptContent } = payload;

      const moduleId = state.moduleId || confirmModuleId;
      if (!moduleId) {
        toast.error('请选择所属模块');
        setIsConfirmDialogOpen(true);
        return;
      }

      const name = state.name && state.name.trim();
      if (!name) {
        toast.error('请输入接口名称');
        return;
      }

      try {
        setState((prev) => ({ ...prev, saving: true }));

        const common = {
          name,
          moduleId,
          description: state.description || undefined,
          tags: state.tags && state.tags.length > 0 ? state.tags : undefined,
        };

        // 注意：后端有的接口 data 直接返回 ID（string），有的返回完整对象
        let result: MetadataDefinition | string | null = null;
        // 基于 definitionId 判断：有 definitionId 视为更新，否则视为新增
        const isUpdate = !!state.definitionId;

        if (isUpdate) {
          if (!state.definitionId) {
            toast.error('更新失败：缺少 definitionId');
            setState((prev) => ({ ...prev, saving: false }));
            return;
          }
          const params: UpdateMetadataDefinitionParams = {
            id: state.definitionId,
            ...(spaceId ? { spaceId } : {}),
            ...common,
          };

          if (protocol === 'HTTP' || protocol === 'DUBBO' || protocol === 'TCP' || protocol === 'WEBSOCKET' || protocol === 'ROCKETMQ') {
            params.requestConfig = requestConfig || {};
          }
          if (protocol === 'SQL' || protocol === 'SCRIPT' || protocol === 'FILE') {
            params.scriptContent = scriptContent;
          }
          if (protocol === 'ROCKETMQ') {
            params.scriptContent = null;
          }

          result = await metadataService.updateDefinition(params);
        } else {
          const params: AddMetadataDefinitionParams = {
            ...common,
            protocol,
            projectId,
            ...(spaceId ? { spaceId } : {}),
          } as AddMetadataDefinitionParams;

          if (protocol === 'HTTP' || protocol === 'DUBBO' || protocol === 'TCP' || protocol === 'WEBSOCKET' || protocol === 'ROCKETMQ') {
            params.requestConfig = requestConfig;
          }
          if (protocol === 'SQL' || protocol === 'SCRIPT' || protocol === 'FILE') {
            params.scriptContent = scriptContent;
          }
          if (protocol === 'ROCKETMQ') {
            params.scriptContent = null;
          }

          result = await metadataService.addDefinition(params);
        }

        // 检查返回结果是否为空
        if (!result) {
          toast.error('保存失败：服务器返回数据为空');
          setState((prev) => ({ ...prev, saving: false }));
          return;
        }

        // 根据返回类型更新状态
        setState((prev) => {
          // 如果 data 是字符串，表示只返回了 ID
          if (typeof result === 'string') {
            return {
              ...prev,
              definitionId: result,
              // 其余字段保留原值
              saving: false,
            };
          }

          // data 是完整对象 MetadataDefinition
          return {
            ...prev,
            definitionId: result.id,
            name: result.name || prev.name,
            moduleId: result.moduleId || prev.moduleId,
            description: result.description,
            tags: result.tags || [],
            saving: false,
          };
        });

        // 显示成功提示
        if (isUpdate) {
          toast.success('接口已更新');
        } else {
          toast.success('接口已保存');
        }

        // HTTP / SQL / DUBBO / ROCKETMQ / FILE 协议：新增 & 更新都需要刷新模块目录（更新 count 等）
        // 其他协议暂不刷新，避免不必要的全局变更
        if ((protocol === 'HTTP' || protocol === 'SQL' || protocol === 'DUBBO' || protocol === 'ROCKETMQ' || protocol === 'FILE') && onRefresh) {
          onRefresh();
        }
      } catch (e: any) {
        console.error('保存接口失败:', e);
        toast.error(e?.message || '保存失败，请稍后重试');
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [state, confirmModuleId, projectId, spaceId, protocol, onRefresh],
  );

  return {
    state,
    environments,
    selectedEnvironment,
    setSelectedEnvironment,
    moduleTree,
    confirmModuleId,
    setConfirmModuleId,
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    refreshModuleTree,
    setName,
    setDescription,
    setTags,
    setSelectedModuleId,
    loadFromDefinition,
    save,
  };
}

