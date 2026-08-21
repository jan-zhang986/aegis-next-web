/**
 * 模块确认对话框组件
 * 通用的"选择模块"二次确认弹窗
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MetadataModuleNode } from '@/services/metadata';
import { ModuleTreeSelect } from './ModuleTreeSelect';

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

interface ModuleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 完整的模块树 */
  moduleTree: MetadataModuleNode[];
  /** 当前选中的模块ID */
  selectedModuleId: string;
  /** 模块ID变化回调 */
  onModuleChange: (moduleId: string) => void;
  /** 确认回调 */
  onConfirm: () => void;
  /** 对话框标题 */
  title?: string;
  /** 对话框描述 */
  description?: string;
  /** 协议标签（用于描述） */
  protocolLabel?: string;
  /** 模块类型过滤（只显示该类型的模块） */
  moduleType?: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE';
  /** 项目ID（用于快速创建模块） */
  projectId?: string;
  /** Space 详情内快速创建模块时写入当前 spaceId */
  typeId?: string;
  /** 模块树刷新回调（用于快速创建模块后刷新） */
  onModuleTreeRefresh?: () => Promise<void>;
}

export function ModuleConfirmDialog({
  open,
  onOpenChange,
  moduleTree,
  selectedModuleId,
  onModuleChange,
  onConfirm,
  title = '选择所属模块',
  description,
  protocolLabel = '接口',
  moduleType,
  projectId,
  typeId,
  onModuleTreeRefresh,
}: ModuleConfirmDialogProps) {
  // 打开对话框时，如果没有选中模块，默认选择第一个符合条件的模块（与 HTTP 一致）
  useEffect(() => {
    if (open && !selectedModuleId && moduleType) {
      const allNodes = flattenNodes(moduleTree);
      // 查找第一个符合条件的子节点（排除根节点和 WORKFLOW 类型）
      const firstValidNode = allNodes.find(node => {
        if ((node.type as string) === 'WORKFLOW') return false;
        if (node.type !== moduleType) return false;
        if (node.parentId === 'NONE') return false; // 排除根节点
        return true;
      });
      
      if (firstValidNode) {
        onModuleChange(firstValidNode.id);
      }
    }
  }, [open, selectedModuleId, moduleTree, moduleType, onModuleChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || `请选择${protocolLabel}对应的模块`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <ModuleTreeSelect
            moduleTree={moduleTree}
            moduleId={selectedModuleId}
            onModuleIdChange={onModuleChange}
            moduleType={moduleType}
            projectId={projectId}
            typeId={typeId}
            onModuleTreeRefresh={onModuleTreeRefresh}
            label="所属模块"
            required
            placeholder="请选择模块"
            showQuickCreate={!!projectId}
            defaultExpandFirstLevel={true}
            disableRootNodes={true}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onConfirm}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
