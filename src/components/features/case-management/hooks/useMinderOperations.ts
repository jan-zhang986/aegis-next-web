/**
 * useMinderOperations - 思维导图节点操作 hook
 * 参考 metersphere-frontend/components/business/ms-minders/featureCaseMinder/useMinderBaseApi.ts
 * 
 * 功能：
 * - 节点新增（模块、用例、前置条件、步骤、预期结果、备注）
 * - 节点删除
 * - 节点拖拽（移动、排序）
 * - 节点复制/粘贴
 * - 节点优先级设置
 * - 菜单显隐控制
 */

import { useCallback, useRef, useState } from 'react';
import { MINDER_CONTENT_TAGS, CASE_LEVEL_MAP } from '../constants';

// 节点类型标签
export const MINDER_TAGS = {
  module: '模块',
  case: '用例',
  text: '文本',
  ...MINDER_CONTENT_TAGS,
} as const;

// 顶级标签（模块、用例）
export const TOP_TAGS = [MINDER_TAGS.module, MINDER_TAGS.case];

// 用例子节点标签
export const CASE_CHILD_TAGS = [
  MINDER_TAGS.precondition,
  MINDER_TAGS.stepDesc,
  MINDER_TAGS.textDesc,
  MINDER_TAGS.remark,
];

// 用例子孙节点标签
export const CASE_OFFSPRING_TAGS = [
  ...CASE_CHILD_TAGS,
  MINDER_TAGS.stepExpect,
];

// 描述标签（步骤描述、文本描述）
export const DESC_TAGS = [MINDER_TAGS.stepDesc, MINDER_TAGS.textDesc];

export interface MinderTreeNode {
  id: string;
  name: string;
  text?: string;
  type?: string;
  count?: number;
  children?: MinderTreeNode[];
  isModule?: boolean;
  isCase?: boolean;
  isContent?: boolean;
  resourceType?: string;
  isLoaded?: boolean;
  isMoreModule?: boolean;
  isMoreCase?: boolean;
  currentPage?: number;
  isNew?: boolean;
  changed?: boolean;
  priority?: number;
  parentId?: string;
  data?: {
    id?: string;
    text?: string;
    resource?: string[];
    priority?: number | string;
    isNew?: boolean;
    changed?: boolean;
    [key: string]: any;
  };
}

export interface InsertMenuItem {
  label: string;
  value: string;
}

/** 脑图保存时「模块」项：与后端 /functional/mind/case/edit 的 updateModuleList 一致 */
export interface MinderUpdateModuleItem {
  id: string;
  name: string;
  parentId: string;
  type: 'ADD' | 'UPDATE';
}

export interface MinderUpdateParams {
  projectId: string;
  updateCaseList: any[];
  updateModuleList: MinderUpdateModuleItem[];
  deleteResourceList: Array<{ id: string; type: string }>;
  additionalNodeList: any[];
}

interface UseMinderOperationsOptions {
  hasEditPermission?: boolean;
  onNodeChange?: (params: MinderUpdateParams) => void;
}

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 思维导图节点操作 hook
 */
export function useMinderOperations(options: UseMinderOperationsOptions = {}) {
  const { hasEditPermission = true } = options;

  // 剪贴板
  const clipboardRef = useRef<MinderTreeNode[]>([]);
  
  // 临时保存的更新参数
  const updateParamsRef = useRef<MinderUpdateParams>({
    projectId: '',
    updateCaseList: [],
    updateModuleList: [],
    deleteResourceList: [],
    additionalNodeList: [],
  });

  // 当前可用的插入菜单
  const [insertSiblingMenus, setInsertSiblingMenus] = useState<InsertMenuItem[]>([]);
  const [insertSonMenus, setInsertSonMenus] = useState<InsertMenuItem[]>([]);

  /**
   * 获取节点的资源标签
   */
  const getNodeResource = useCallback((node: MinderTreeNode): string[] => {
    if (node.isModule) return [MINDER_TAGS.module];
    if (node.isCase) return [MINDER_TAGS.case];
    if (node.isContent && node.resourceType) return [node.resourceType];
    return node.data?.resource || [];
  }, []);

  /**
   * 检查节点是否有指定标签
   */
  const hasTag = useCallback((node: MinderTreeNode, tag: string): boolean => {
    const resource = getNodeResource(node);
    return resource.includes(tag);
  }, [getNodeResource]);

  /**
   * 检测节点可展示的菜单项
   */
  const checkNodeCanShowMenu = useCallback((node: MinderTreeNode, parent?: MinderTreeNode) => {
    if (!hasEditPermission) {
      setInsertSiblingMenus([]);
      setInsertSonMenus([]);
      return;
    }

    const resource = getNodeResource(node);
    const parentResource = parent ? getNodeResource(parent) : [];

    if (resource.includes(MINDER_TAGS.module)) {
      // 模块节点
      if (node.id === 'NONE' || node.id === 'root' || parent?.id === 'NONE') {
        // 根节点或 NONE 虚拟节点
        setInsertSiblingMenus([]);
        if (node.id === 'NONE') {
          // NONE 模块节点下只能插入模块
          setInsertSonMenus([{ label: MINDER_TAGS.module, value: MINDER_TAGS.module }]);
        } else {
          if (parent?.id === 'NONE') {
            setInsertSiblingMenus([{ label: MINDER_TAGS.module, value: MINDER_TAGS.module }]);
          }
          // 非 NONE 模块节点下可插入模块、用例、文本
          setInsertSonMenus([
            { label: MINDER_TAGS.module, value: MINDER_TAGS.module },
            { label: MINDER_TAGS.case, value: MINDER_TAGS.case },
            { label: MINDER_TAGS.text, value: MINDER_TAGS.text },
          ]);
        }
      } else {
        // 正常模块节点
        setInsertSiblingMenus([
          { label: MINDER_TAGS.module, value: MINDER_TAGS.module },
          { label: MINDER_TAGS.case, value: MINDER_TAGS.case },
          { label: MINDER_TAGS.text, value: MINDER_TAGS.text },
        ]);
        setInsertSonMenus([
          { label: MINDER_TAGS.module, value: MINDER_TAGS.module },
          { label: MINDER_TAGS.case, value: MINDER_TAGS.case },
          { label: MINDER_TAGS.text, value: MINDER_TAGS.text },
        ]);
      }
    } else if (resource.includes(MINDER_TAGS.case)) {
      // 用例节点
      setInsertSiblingMenus([
        { label: MINDER_TAGS.module, value: MINDER_TAGS.module },
        { label: MINDER_TAGS.case, value: MINDER_TAGS.case },
        { label: MINDER_TAGS.text, value: MINDER_TAGS.text },
      ]);
      
      // 用例下可插入的子节点
      let sonMenus = CASE_CHILD_TAGS.map(tag => ({ label: tag, value: tag }));
      
      // 根据已有子节点过滤
      const children = node.children || [];
      const hasStep = children.some(c => hasTag(c, MINDER_TAGS.stepDesc));
      const hasTextDesc = children.some(c => hasTag(c, MINDER_TAGS.textDesc));
      const hasPrerequisite = children.some(c => hasTag(c, MINDER_TAGS.precondition));
      const hasRemark = children.some(c => hasTag(c, MINDER_TAGS.remark));
      
      if (hasStep) {
        // 有步骤描述，不能插入文本描述
        sonMenus = sonMenus.filter(m => m.value !== MINDER_TAGS.textDesc);
      } else if (hasTextDesc) {
        // 有文本描述，不能插入步骤描述和文本描述
        sonMenus = sonMenus.filter(m => m.value !== MINDER_TAGS.stepDesc && m.value !== MINDER_TAGS.textDesc);
      }
      if (hasPrerequisite) {
        sonMenus = sonMenus.filter(m => m.value !== MINDER_TAGS.precondition);
      }
      if (hasRemark) {
        sonMenus = sonMenus.filter(m => m.value !== MINDER_TAGS.remark);
      }
      
      setInsertSonMenus(sonMenus);
    } else if (CASE_CHILD_TAGS.some(tag => resource.includes(tag))) {
      // 用例下的子节点
      let siblingMenus = CASE_CHILD_TAGS.map(tag => ({ label: tag, value: tag }));
      const siblings = parent?.children || [];
      
      const hasStep = siblings.some(c => hasTag(c, MINDER_TAGS.stepDesc));
      const hasTextDesc = siblings.some(c => hasTag(c, MINDER_TAGS.textDesc));
      const hasPrerequisite = siblings.some(c => hasTag(c, MINDER_TAGS.precondition));
      const hasRemark = siblings.some(c => hasTag(c, MINDER_TAGS.remark));
      
      if (hasStep) {
        siblingMenus = siblingMenus.filter(m => m.value !== MINDER_TAGS.textDesc);
      } else if (hasTextDesc) {
        siblingMenus = siblingMenus.filter(m => m.value !== MINDER_TAGS.stepDesc && m.value !== MINDER_TAGS.textDesc);
      }
      if (hasPrerequisite) {
        siblingMenus = siblingMenus.filter(m => m.value !== MINDER_TAGS.precondition);
      }
      if (hasRemark) {
        siblingMenus = siblingMenus.filter(m => m.value !== MINDER_TAGS.remark);
      }
      
      setInsertSiblingMenus(siblingMenus);
      
      // 文本描述和步骤描述节点可插入预期结果
      if ((resource.includes(MINDER_TAGS.textDesc) || resource.includes(MINDER_TAGS.stepDesc)) &&
          (!node.children || node.children.length === 0)) {
        setInsertSonMenus([{ label: MINDER_TAGS.stepExpect, value: MINDER_TAGS.stepExpect }]);
      } else {
        setInsertSonMenus([]);
      }
    } else {
      setInsertSiblingMenus([]);
      setInsertSonMenus([]);
    }
  }, [hasEditPermission, getNodeResource, hasTag]);

  /**
   * 创建新节点
   */
  const createNode = useCallback((
    tag: string,
    parentId?: string,
    priority?: number
  ): MinderTreeNode => {
    const id = generateId();
    const isModule = tag === MINDER_TAGS.module;
    const isCase = tag === MINDER_TAGS.case;
    const isContent = CASE_OFFSPRING_TAGS.includes(tag);
    
    // 用例节点显示名称：默认 "新建用例"；模块节点默认 "新建模块"；其他为 tag
    const displayName = isCase 
      ? '新建用例' 
      : isModule 
        ? '新建模块' 
        : (tag !== MINDER_TAGS.text ? tag : '');
    
    const node: MinderTreeNode = {
      id,
      name: displayName,
      text: displayName,
      isModule,
      isCase,
      isContent,
      resourceType: isContent ? tag : undefined,
      isNew: true,
      changed: true,
      parentId,
      data: {
        id,
        text: displayName,
        resource: tag !== MINDER_TAGS.text ? [tag] : [],
        isNew: true,
        changed: true,
        priority: isCase ? (priority || 1) : undefined,
      },
    };
    
    // 用例节点默认创建子节点
    if (isCase) {
      node.priority = priority || 1;
      node.children = [
        createNode(MINDER_TAGS.precondition, id),
        {
          ...createNode(MINDER_TAGS.stepDesc, id),
          children: [createNode(MINDER_TAGS.stepExpect, id)],
        },
        createNode(MINDER_TAGS.remark, id),
      ];
    }
    
    // 步骤描述/文本描述节点默认创建预期结果子节点
    if (tag === MINDER_TAGS.stepDesc || tag === MINDER_TAGS.textDesc) {
      node.children = [createNode(MINDER_TAGS.stepExpect, id)];
    }
    
    return node;
  }, []);

  /**
   * 插入子节点，返回新树和新节点（便于调用方选中并打开侧栏）
   */
  const insertChildNode = useCallback((
    treeData: MinderTreeNode[],
    parentId: string,
    tag: string
  ): { newTree: MinderTreeNode[]; newNode: MinderTreeNode } => {
    const newNode = createNode(tag, parentId);

    const insertIntoTree = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          const children = node.children || [];
          return {
            ...node,
            children: [...children, newNode],
            isLoaded: true,
          };
        }
        if (node.children) {
          return {
            ...node,
            children: insertIntoTree(node.children),
          };
        }
        return node;
      });
    };

    return { newTree: insertIntoTree(treeData), newNode };
  }, [createNode]);

  /**
   * 插入同级节点，返回新树和新节点（未找到目标时 newNode 为 null）
   */
  const insertSiblingNode = useCallback((
    treeData: MinderTreeNode[],
    siblingId: string,
    tag: string
  ): { newTree: MinderTreeNode[]; newNode: MinderTreeNode | null } => {
    let created: MinderTreeNode | null = null;
    const insertAfter = (nodes: MinderTreeNode[], parentId?: string): MinderTreeNode[] => {
      const result: MinderTreeNode[] = [];
      for (const node of nodes) {
        const updatedNode = node.children
          ? { ...node, children: insertAfter(node.children, node.id) }
          : node;

        result.push(updatedNode);

        if (node.id === siblingId) {
          const newNode = createNode(tag, parentId);
          created = newNode;
          result.push(newNode);
        }
      }
      return result;
    };

    const newTree = insertAfter(treeData);
    return { newTree, newNode: created };
  }, [createNode]);

  /**
   * 删除节点
   */
  const deleteNode = useCallback((
    treeData: MinderTreeNode[],
    nodeId: string
  ): MinderTreeNode[] => {
    const deleteFromTree = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          children: node.children ? deleteFromTree(node.children) : undefined,
        }));
    };
    
    // 记录删除操作
    const findNode = (nodes: MinderTreeNode[]): MinderTreeNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const deletedNode = findNode(treeData);
    if (deletedNode && !deletedNode.isNew) {
      const resource = getNodeResource(deletedNode);
      updateParamsRef.current.deleteResourceList.push({
        id: nodeId,
        type: resource[0] || 'NONE',
      });
    }
    
    return deleteFromTree(treeData);
  }, [getNodeResource]);

  /**
   * 更新节点文本
   * 模块节点会标记 changed: true，保存时从树中收集并提交后端
   */
  const updateNodeText = useCallback((
    treeData: MinderTreeNode[],
    nodeId: string,
    text: string
  ): MinderTreeNode[] => {
    const updateInTree = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            name: text,
            text,
            changed: true,
            data: {
              ...node.data,
              text,
              changed: true,
            },
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateInTree(node.children),
          };
        }
        return node;
      });
    };

    return updateInTree(treeData);
  }, []);

  /**
   * 更新节点优先级
   */
  const updateNodePriority = useCallback((
    treeData: MinderTreeNode[],
    nodeId: string,
    priority: number
  ): MinderTreeNode[] => {
    const updateInTree = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            priority,
            changed: true,
            data: {
              ...node.data,
              priority,
              changed: true,
            },
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateInTree(node.children),
          };
        }
        return node;
      });
    };
    
    return updateInTree(treeData);
  }, []);

  /**
   * 复制节点到剪贴板
   */
  const copyToClipboard = useCallback((nodes: MinderTreeNode[]) => {
    // 深拷贝节点
    const deepCopy = (node: MinderTreeNode): MinderTreeNode => ({
      ...node,
      id: generateId(), // 生成新 ID
      isNew: true,
      changed: true,
      children: node.children?.map(deepCopy),
      data: {
        ...node.data,
        id: generateId(),
        isNew: true,
        changed: true,
      },
    });
    
    clipboardRef.current = nodes.map(deepCopy);
  }, []);

  /**
   * 剪切节点到剪贴板
   */
  const cutToClipboard = useCallback((
    treeData: MinderTreeNode[],
    nodes: MinderTreeNode[]
  ): MinderTreeNode[] => {
    clipboardRef.current = nodes;
    
    // 从树中删除节点
    let newTreeData = treeData;
    for (const node of nodes) {
      newTreeData = deleteNode(newTreeData, node.id);
    }
    
    return newTreeData;
  }, [deleteNode]);

  /**
   * 粘贴节点
   */
  const pasteFromClipboard = useCallback((
    treeData: MinderTreeNode[],
    targetId: string
  ): MinderTreeNode[] => {
    if (clipboardRef.current.length === 0) return treeData;
    
    const insertIntoTree = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes.map(node => {
        if (node.id === targetId) {
          const children = node.children || [];
          // 重新生成 ID
          const newNodes = clipboardRef.current.map(n => ({
            ...n,
            id: generateId(),
            parentId: targetId,
            data: { ...n.data, id: generateId() },
          }));
          return {
            ...node,
            children: [...children, ...newNodes],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: insertIntoTree(node.children),
          };
        }
        return node;
      });
    };
    
    return insertIntoTree(treeData);
  }, []);

  /**
   * 移动节点到新父节点
   */
  const moveNode = useCallback((
    treeData: MinderTreeNode[],
    nodeId: string,
    newParentId: string
  ): MinderTreeNode[] => {
    // 先找到要移动的节点
    let movedNode: MinderTreeNode | null = null;
    
    const findAndRemove = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes
        .filter(node => {
          if (node.id === nodeId) {
            movedNode = { ...node, parentId: newParentId, changed: true };
            return false;
          }
          return true;
        })
        .map(node => ({
          ...node,
          children: node.children ? findAndRemove(node.children) : undefined,
        }));
    };
    
    const insertIntoParent = (nodes: MinderTreeNode[]): MinderTreeNode[] => {
      return nodes.map(node => {
        if (node.id === newParentId && movedNode) {
          const children = node.children || [];
          return {
            ...node,
            children: [...children, movedNode],
          };
        }
        if (node.children) {
          return {
            ...node,
            children: insertIntoParent(node.children),
          };
        }
        return node;
      });
    };
    
    const withoutMoved = findAndRemove(treeData);
    return insertIntoParent(withoutMoved);
  }, []);

  /**
   * 判断是否可以显示浮动菜单
   */
  const canShowFloatMenu = useCallback((node: MinderTreeNode): boolean => {
    if (node.type === 'tmp' || node.isMoreModule || node.isMoreCase) {
      return false;
    }
    if (!hasEditPermission) {
      // 无编辑权限时，只有用例节点可显示（用于查看详情）
      return hasTag(node, MINDER_TAGS.case);
    }
    return true;
  }, [hasEditPermission, hasTag]);

  /**
   * 判断是否可以显示优先级菜单
   */
  const canShowPriorityMenu = useCallback((nodes: MinderTreeNode[]): boolean => {
    if (!hasEditPermission) return false;
    return nodes.every(node => hasTag(node, MINDER_TAGS.case));
  }, [hasEditPermission, hasTag]);

  /**
   * 判断是否可以显示更多菜单
   */
  const canShowMoreMenu = useCallback((node: MinderTreeNode): boolean => {
    if (!hasEditPermission) return false;
    return node.id !== 'NONE' && node.id !== 'root';
  }, [hasEditPermission]);

  /**
   * 重置更新参数
   */
  const resetUpdateParams = useCallback((projectId: string) => {
    updateParamsRef.current = {
      projectId,
      updateCaseList: [],
      updateModuleList: [],
      deleteResourceList: [],
      additionalNodeList: [],
    };
  }, []);

  /**
   * 获取当前更新参数
   */
  const getUpdateParams = useCallback(() => {
    return updateParamsRef.current;
  }, []);

  return {
    // 标签常量
    MINDER_TAGS,
    TOP_TAGS,
    CASE_CHILD_TAGS,
    CASE_OFFSPRING_TAGS,
    DESC_TAGS,
    // 菜单状态
    insertSiblingMenus,
    insertSonMenus,
    // 工具函数
    getNodeResource,
    hasTag,
    checkNodeCanShowMenu,
    // 节点操作
    createNode,
    insertChildNode,
    insertSiblingNode,
    deleteNode,
    updateNodeText,
    updateNodePriority,
    // 剪贴板操作
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    clipboardRef,
    // 移动操作
    moveNode,
    // 菜单判断
    canShowFloatMenu,
    canShowPriorityMenu,
    canShowMoreMenu,
    // 更新参数
    resetUpdateParams,
    getUpdateParams,
  };
}

export default useMinderOperations;
