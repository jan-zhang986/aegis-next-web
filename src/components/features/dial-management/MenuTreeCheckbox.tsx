/**
 * 树形菜单多选：以树结构展示菜单，支持展开/收起，每节点一个复选框多选
 * 与原项目 el-tree-select 一致：节点旁显示 ID，父节点有选中子级时显示半选，自动展开含选中项的祖先
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';

export interface MenuTreeNode {
  id: string;
  name: string;
  children?: MenuTreeNode[];
}

export interface MenuTreeCheckboxProps {
  /** 当前选中的 id 列表 */
  value: (string | number)[];
  onValueChange: (ids: (string | number)[]) => void;
  options: MenuTreeNode[];
  /** 无选项时的占位文案 */
  emptyText?: string;
  className?: string;
  /** 滚动区域最大高度 */
  maxHeight?: string;
}

/** 收集某节点及其所有子孙的 id */
function collectDescendantIds(node: MenuTreeNode): Set<string> {
  const set = new Set<string>([node.id]);
  if (node.children?.length) {
    node.children.forEach((child) => collectDescendantIds(child).forEach((id) => set.add(id)));
  }
  return set;
}

/** 收集所有「含选中项」的节点的祖先 id，用于默认展开 */
function collectAncestorIdsToExpand(
  nodes: MenuTreeNode[],
  valueSet: Set<string>,
  ancestors: string[] = []
): Set<string> {
  const expand = new Set<string>();
  for (const node of nodes) {
    if (valueSet.has(node.id)) {
      ancestors.forEach((id) => expand.add(id));
    }
    if (node.children?.length) {
      collectAncestorIdsToExpand(node.children, valueSet, [...ancestors, node.id]).forEach((id) =>
        expand.add(id)
      );
    }
  }
  return expand;
}

export function MenuTreeCheckbox({
  value,
  onValueChange,
  options,
  emptyText = '请先选择应用',
  className,
  maxHeight = '12rem',
}: MenuTreeCheckboxProps) {
  const valueSet = useMemo(() => new Set(value.map((v) => String(v))), [value]);
  const ancestorIdsToExpand = useMemo(
    () => collectAncestorIdsToExpand(options, valueSet),
    [options, valueSet]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(ancestorIdsToExpand));

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      ancestorIdsToExpand.forEach((id) => next.add(id));
      return next;
    });
  }, [ancestorIdsToExpand]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleChecked = useCallback(
    (id: string | number) => {
      const idStr = String(id);
      onValueChange(
        value.some((v) => String(v) === idStr)
          ? value.filter((v) => String(v) !== idStr)
          : [...value, id]
      );
    },
    [value, onValueChange]
  );

  const renderNode = (node: MenuTreeNode, depth: number) => {
    const hasChildren = !!node.children?.length;
    const isExpanded = expandedIds.has(node.id);
    const isChecked = valueSet.has(node.id);
    const descendantIds = hasChildren ? collectDescendantIds(node) : new Set<string>();
    const someDescendantSelected = hasChildren && [...descendantIds].some((id) => id !== node.id && valueSet.has(id));
    const isIndeterminate = hasChildren && someDescendantSelected && !isChecked;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm min-h-8 hover:bg-accent/50'
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
          <Checkbox
            id={`menu-tree-${node.id}`}
            checked={isIndeterminate ? 'indeterminate' : isChecked}
            onCheckedChange={() => toggleChecked(node.id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
          <Label
            htmlFor={`menu-tree-${node.id}`}
            className="font-normal text-sm cursor-pointer flex-1 min-w-0 truncate py-0.5 flex items-center gap-1.5"
          >
            <span className="truncate">{node.name}</span>
            <span className="text-muted-foreground shrink-0 font-mono text-xs">({node.id})</span>
          </Label>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (options.length === 0) {
    return (
      <div
        className={cn(
          'border rounded-lg p-3 bg-gray-50/50 flex items-center justify-center text-sm text-muted-foreground',
          className
        )}
        style={{ minHeight: maxHeight }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <ScrollArea
      className={cn('w-full border rounded-lg bg-gray-50/50 overflow-hidden', className)}
      style={{ height: maxHeight, maxHeight }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col p-3 pr-4 min-h-0">
        {options.map((node) => renderNode(node, 0))}
      </div>
    </ScrollArea>
  );
}
