/**
 * 保存对话框组件
 * 用于填写描述和标签等信息
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { MetadataModuleNode } from '@/services/metadata';
import { ModuleTreeSelect } from './ModuleTreeSelect';

// 类型配置（与 MainContent.tsx 保持一致）
const TYPE_CONFIG: Record<string, { name: string; icon: string; id: string; category: string }> = {
  API: { name: 'HTTP接口', icon: '🌐', id: 'api', category: 'api' },
  SQL: { name: 'SQL查询', icon: '💾', id: 'sql', category: 'sql' },
  DUBBO: { name: 'Dubbo接口', icon: '🔌', id: 'dubbo', category: 'dubbo' },
  ROCKETMQ: { name: 'RocketMQ', icon: '🚀', id: 'rocketmq', category: 'rocketmq' },
  FILE: { name: '文件上传', icon: '📁', id: 'file', category: 'file' },
  MODULE: { name: '模块', icon: '📂', id: 'module', category: 'module' },
};

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleTree: MetadataModuleNode[];
  moduleId?: string;
  name?: string;
  description?: string;
  tags?: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string) => void;
  onModuleIdChange?: (moduleId: string) => void;
  onConfirm: () => void | Promise<void>;
  saving?: boolean;
  title?: string;
  // 可选：指定模块类型，用于过滤只显示对应类型的子节点
  moduleType?: 'API' | 'SQL' | 'DUBBO' | 'ROCKETMQ' | 'FILE' | 'SCRIPT';
  // 项目ID，用于创建模块
  projectId?: string;
  // Space 详情内快速创建模块时写入当前 spaceId
  typeId?: string;
  // 刷新模块树的回调
  onModuleTreeRefresh?: () => void | Promise<void>;
  // 是否显示名称输入（默认 false，保持向后兼容）
  showNameInput?: boolean;
  // 是否显示描述输入（默认 true）
  showDescription?: boolean;
  // 是否显示标签输入（默认 true）
  showTags?: boolean;
}

export function SaveDialog({
  open,
  onOpenChange,
  moduleTree,
  moduleId,
  name,
  description,
  tags,
  onNameChange,
  onDescriptionChange,
  onTagsChange,
  onModuleIdChange,
  onConfirm,
  saving = false,
  title = '保存',
  moduleType,
  projectId,
  typeId,
  onModuleTreeRefresh,
  showNameInput = false,
  showDescription = true,
  showTags = true,
}: SaveDialogProps) {
  // 本地维护标签输入值，避免父组件处理导致的输入问题
  const [localTags, setLocalTags] = useState(tags || '');

  // 打开对话框时初始化本地标签值，关闭时重置状态
  useEffect(() => {
    if (open) {
      // 初始化本地标签值
      setLocalTags(tags || '');
      
      // 检查当前 moduleId 是否指向根节点（parentId === 'NONE'），如果是则清空选择
      if (moduleId) {
        const flattenNodes = (nodes: MetadataModuleNode[]): MetadataModuleNode[] => {
          const result: MetadataModuleNode[] = [];
          const traverse = (nodeList: MetadataModuleNode[]) => {
            nodeList.forEach(node => {
              result.push(node);
              if (node.children && node.children.length > 0) {
                traverse(node.children);
              }
            });
          };
          traverse(nodes);
          return result;
        };
        const allNodes = flattenNodes(moduleTree);
        const currentNode = allNodes.find(n => n.id === moduleId);
        if (currentNode && currentNode.parentId === 'NONE') {
          // 如果选中的是根节点，清空选择
          if (onModuleIdChange) {
            onModuleIdChange('');
          }
        }
      }
    } else {
      // 关闭时重置状态
      setLocalTags('');
    }
  }, [open, moduleTree, moduleId, onModuleIdChange, tags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            请填写相关信息
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {showNameInput && onNameChange && (
            <div className="space-y-2">
              <Label htmlFor="name">
                名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="请输入名称"
                value={name || ''}
                onChange={(e) => onNameChange(e.target.value)}
                className="border border-gray-300"
              />
            </div>
          )}

          <ModuleTreeSelect
            moduleTree={moduleTree}
            moduleId={moduleId}
            onModuleIdChange={onModuleIdChange}
            moduleType={moduleType}
            projectId={projectId}
            typeId={typeId}
            onModuleTreeRefresh={onModuleTreeRefresh ? async () => {
              await onModuleTreeRefresh();
            } : undefined}
            label="所属模块"
            required
            placeholder="请选择模块"
            showQuickCreate={true}
            defaultExpandFirstLevel={true}
            disableRootNodes={true}
          />

          {showDescription && (
          <div className="space-y-2">
            <Label htmlFor="description">描述（支持换行）</Label>
            <Textarea
              id="description"
              placeholder="请输入描述信息，支持换行"
              value={description || ''}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="!min-h-[4.5rem] max-h-32 resize-y overflow-y-auto border border-gray-300"
            />
          </div>
          )}

          {showTags && (
          <div className="space-y-2">
            <Label htmlFor="tags">标签（用逗号分隔）</Label>
            <input
              id="tags"
              type="text"
              placeholder="请输入标签例如：用户管理,查询"
              value={localTags}
              onChange={(e) => {
                // 使用本地状态，允许输入英文逗号，不实时同步到父组件
                // 直接使用 e.target.value，不做任何过滤
                const value = e.target.value;
                setLocalTags(value);
              }}
              onBlur={() => {
                // 失去焦点时同步到父组件
                onTagsChange(localTags);
              }}
              onKeyDown={(e) => {
                // 只处理 Enter 键，不阻止任何其他按键（包括逗号）
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Enter 键时同步并失去焦点
                  onTagsChange(localTags);
                  (e.target as HTMLInputElement).blur();
                }
                // 不阻止逗号键，允许正常输入
              }}
              onInput={(e) => {
                // 确保输入事件正常处理，不做任何过滤
                const target = e.target as HTMLInputElement;
                setLocalTags(target.value);
              }}
              className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={async () => {
              try {
                // 确认前同步标签值到父组件
                onTagsChange(localTags);
                await onConfirm();
                // 保存成功后关闭对话框
                onOpenChange(false);
              } catch (error) {
                // 保存失败时不关闭对话框，让用户看到错误信息
                console.error('保存失败:', error);
              }
            }}
            disabled={saving}
          >
            {saving ? '保存中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
