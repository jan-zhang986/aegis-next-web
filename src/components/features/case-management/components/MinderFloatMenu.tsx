/**
 * MinderFloatMenu - 思维导图悬浮菜单组件
 * 参考 metersphere-frontend 的浮动菜单实现
 * 
 * 功能：
 * - 插入同级/子级节点菜单
 * - 优先级设置菜单
 * - 更多操作菜单（复制/剪切/粘贴/删除）
 * - 查看详情按钮
 */

import { useState, useCallback } from 'react';
import {
  Plus,
  ChevronDown,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  FileText,
  CircleDot,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import { CASE_LEVEL_MAP } from '../constants';
import type { InsertMenuItem, MinderTreeNode } from '../hooks/useMinderOperations';

interface MinderFloatMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedNode: MinderTreeNode | null;
  insertSiblingMenus: InsertMenuItem[];
  insertSonMenus: InsertMenuItem[];
  canShowPriority: boolean;
  canShowMore: boolean;
  canShowDetail: boolean;
  hasClipboard: boolean;
  currentPriority?: number;
  onInsertSibling: (tag: string) => void;
  onInsertChild: (tag: string) => void;
  onSetPriority: (priority: number) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
  /** 编辑模块名称（仅模块节点时显示） */
  onEditModuleName?: () => void;
  className?: string;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'P0', color: 'text-red-600', borderColor: 'border-red-500' },
  { value: 2, label: 'P1', color: 'text-orange-600', borderColor: 'border-orange-500' },
  { value: 3, label: 'P2', color: 'text-teal-700', borderColor: 'border-teal-600' },
  { value: 4, label: 'P3', color: 'text-gray-600', borderColor: 'border-gray-400' },
];

export function MinderFloatMenu({
  visible,
  position,
  selectedNode,
  insertSiblingMenus,
  insertSonMenus,
  canShowPriority,
  canShowMore,
  canShowDetail,
  hasClipboard,
  currentPriority,
  onInsertSibling,
  onInsertChild,
  onSetPriority,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onViewDetail,
  onEditModuleName,
  className,
}: MinderFloatMenuProps) {
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleInsertSibling = useCallback((tag: string) => {
    onInsertSibling(tag);
    setInsertMenuOpen(false);
  }, [onInsertSibling]);

  const handleInsertChild = useCallback((tag: string) => {
    onInsertChild(tag);
    setInsertMenuOpen(false);
  }, [onInsertChild]);

  const handleSetPriority = useCallback((priority: number) => {
    onSetPriority(priority);
    setPriorityMenuOpen(false);
  }, [onSetPriority]);

  if (!visible || !selectedNode) {
    return null;
  }

  const hasInsertMenus = insertSiblingMenus.length > 0 || insertSonMenus.length > 0;

  return (
    <div
      className={cn(
        'fixed z-50 flex items-center gap-1 p-1 bg-white rounded-lg shadow-lg border border-gray-200',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)',
      }}
    >
      {/* 插入菜单 */}
      {hasInsertMenus && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu open={insertMenuOpen} onOpenChange={setInsertMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[140px]">
                    {insertSiblingMenus.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-sm">
                          插入同级
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {insertSiblingMenus.map((item) => (
                            <DropdownMenuItem
                              key={item.value}
                              onClick={() => handleInsertSibling(item.value)}
                              className="text-sm"
                            >
                              {item.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    {insertSonMenus.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-sm">
                          插入子级
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {insertSonMenus.map((item) => (
                            <DropdownMenuItem
                              key={item.value}
                              onClick={() => handleInsertChild(item.value)}
                              className="text-sm"
                            >
                              {item.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">插入节点</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 优先级菜单 */}
      {canShowPriority && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu open={priorityMenuOpen} onOpenChange={setPriorityMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <CircleDot className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {currentPriority ? `P${currentPriority - 1}` : 'P0'}
                      </span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[100px]">
                    {PRIORITY_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleSetPriority(option.value)}
                        className={cn(
                          'text-sm flex items-center gap-2',
                          currentPriority === option.value && 'bg-blue-50'
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-medium',
                            option.borderColor,
                            option.color
                          )}
                        >
                          {option.label}
                        </span>
                        <span className={option.color}>{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">设置用例等级</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 编辑模块名称（仅模块节点） */}
      {selectedNode?.isModule && selectedNode.id && selectedNode.id !== 'root' && selectedNode.id !== 'NONE' && onEditModuleName && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={onEditModuleName}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">编辑名称</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 查看详情按钮 */}
      {canShowDetail && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={onViewDetail}
              >
                <FileText className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">查看详情</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 更多操作菜单 */}
      {canShowMore && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <span className="text-lg leading-none">⋯</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem onClick={onCopy} className="text-sm gap-2">
                      <Copy className="w-3.5 h-3.5" />
                      复制
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onCut} className="text-sm gap-2">
                      <Scissors className="w-3.5 h-3.5" />
                      剪切
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onPaste}
                      disabled={!hasClipboard}
                      className="text-sm gap-2"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      粘贴
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-sm gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">更多操作</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default MinderFloatMenu;
