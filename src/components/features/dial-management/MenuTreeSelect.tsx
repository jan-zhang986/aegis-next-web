/**
 * 树形菜单选择器：以树结构展示菜单，支持展开/收起，点击节点选中
 */
import { useState, useCallback } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';

export interface MenuTreeNode {
  id: string;
  name: string;
  children?: MenuTreeNode[];
}

export interface MenuTreeSelectProps {
  value: string;
  onValueChange: (id: string) => void;
  options: MenuTreeNode[];
  placeholder?: string;
  /** 无选项时的占位文案 */
  emptyText?: string;
  /** 是否显示「无」选项，用于清空选择 */
  showNone?: boolean;
  className?: string;
  /** 弹层 z-index，在 Dialog/Sheet 内使用时需设大一点，如 z-[100] */
  contentClassName?: string;
  disabled?: boolean;
}

function findLabel(nodes: MenuTreeNode[], id: string): string {
  if (!id) return '';
  const idStr = String(id);
  for (const node of nodes) {
    if (String(node.id) === idStr) return node.name;
    if (node.children?.length) {
      const found = findLabel(node.children, idStr);
      if (found) return found;
    }
  }
  return '';
}

export function MenuTreeSelect({
  value,
  onValueChange,
  options,
  placeholder = '请选择',
  emptyText = '暂无菜单',
  showNone = false,
  className,
  contentClassName,
  disabled,
}: MenuTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const label = value ? findLabel(options, value) : showNone && !value ? '无' : '';

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      onValueChange(id);
      setOpen(false);
    },
    [onValueChange]
  );

  const renderNode = (node: MenuTreeNode, depth: number) => {
    const hasChildren = !!node.children?.length;
    const isExpanded = expandedIds.has(node.id);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground min-h-8',
            value === node.id && 'bg-accent text-accent-foreground'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="shrink-0 p-0.5 -m-0.5 rounded hover:bg-accent/80"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              aria-expanded={isExpanded}
            >
              <ChevronRightIcon
                className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
              />
            </button>
          ) : (
            <span className="w-5 shrink-0" aria-hidden />
          )}
          <span
            className="flex-1 truncate"
            onClick={() => handleSelect(node.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(node.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {node.name}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
            !label && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{label || placeholder}</span>
          <ChevronRightIcon className="size-4 rotate-90 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[var(--radix-popover-trigger-width)] p-1', contentClassName)}
        align="start"
      >
        {options.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ScrollArea
            className="h-64 w-full"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col py-1 pr-2">
              {options.map((node) => renderNode(node, 0))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
