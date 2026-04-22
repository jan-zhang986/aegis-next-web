import { useMemo, Fragment } from 'react';
import { ChevronRight, ChevronDown, Folder, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export interface BaseModuleTreeNode {
    id: string;
    name: string;
    parentId: string;
    children?: BaseModuleTreeNode[];
    count?: number;
    [key: string]: any;
}

export interface BaseModuleTreeAction {
    label: string;
    icon: React.ReactNode;
    onClick: (node: BaseModuleTreeNode) => void;
    className?: string;
    divideBefore?: boolean;
}

export interface BaseModuleTreeProps {
    /** 树形数据 */
    data: BaseModuleTreeNode[];
    /** 选中的模块 ID */
    selectedId: string;
    /** 点击选择回调 */
    onSelect: (id: string) => void;
    /** 展开的节点 IDs */
    expandedIds: Set<string>;
    /** 切换展开回调 */
    onToggleExpand: (id: string, isExpanded: boolean) => void;
    /** 搜索关键词（用于高亮和自动展开） */
    searchKeyword?: string;
    /** 容器类名 */
    className?: string;
    /** 节点类名 */
    nodeClassName?: string;
    /** 是否在搜索时强制展开所有匹配节点 */
    expandAllWhenSearch?: boolean;
    /** 自定义节点渲染插件：渲染额外信息（如计数、标记等） */
    renderNodeExtra?: (node: BaseModuleTreeNode, isSelected: boolean) => React.ReactNode;
    /** 节点操作菜单配置 */
    actions?: BaseModuleTreeAction[];
    /** 节点左侧图标：默认为 Folder，支持根据节点数据自定义 */
    renderNodeIcon?: (node: BaseModuleTreeNode, isSelected: boolean) => React.ReactNode;
    /** 层级偏移量 (px)，默认 12 */
    levelOffset?: number;
    /** 是否启用极简模式（减小行高和间距） */
    compact?: boolean;
}

/**
 * 通用模块树组件
 * 统一了测试用例、测试计划、用例评审的左侧树展示逻辑
 */
export function BaseModuleTree({
    data,
    selectedId,
    onSelect,
    expandedIds,
    onToggleExpand,
    searchKeyword = '',
    className,
    nodeClassName,
    expandAllWhenSearch = true,
    renderNodeExtra,
    actions,
    renderNodeIcon,
    levelOffset = 12,
    compact = false,
}: BaseModuleTreeProps) {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    const highlightText = (text: string) => {
        if (!normalizedKeyword || !text) return text;
        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(normalizedKeyword);
        if (index === -1) return text;

        const before = text.slice(0, index);
        const match = text.slice(index, index + normalizedKeyword.length);
        const after = text.slice(index + normalizedKeyword.length);

        return (
            <>
                {before}
                <span className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5 font-medium">{match}</span>
                {after}
            </>
        );
    };

    const renderTreeNode = (node: BaseModuleTreeNode, level: number = 0) => {
        const isExpanded = (normalizedKeyword && expandAllWhenSearch) || expandedIds.has(node.id);
        const isSelected = selectedId === node.id;
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id} className={cn("mb-0.5", nodeClassName)}>
                <div
                    onClick={() => {
                        if (hasChildren) {
                            onToggleExpand(node.id, !isExpanded);
                        }
                        onSelect(node.id);
                    }}
                    style={{ paddingLeft: `${level * levelOffset}px` }}
                    className={cn(
                        "group flex items-center gap-1.5 px-2.5 py-1.5 mr-2 rounded-r-full cursor-pointer transition-all",
                        compact ? "py-1 text-xs" : "py-1.5 text-[13px]",
                        isSelected
                            ? "bg-blue-50 text-blue-600 font-bold shadow-sm ring-1 ring-blue-100/50"
                            : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    )}
                >
                    {/* 展开/折叠图标 */}
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                            )
                        ) : null}
                    </div>

                    {/* 业务图标 */}
                    <div className="shrink-0">
                        {renderNodeIcon ? (
                            renderNodeIcon(node, isSelected)
                        ) : (
                            <Folder className={cn(
                                "w-3.5 h-3.5 lg:w-4 lg:h-4",
                                isSelected ? "text-blue-600" : "text-gray-400"
                            )} />
                        )}
                    </div>

                    {/* 名称 */}
                    <span className="truncate flex-1 min-w-0">
                        {highlightText(node.name)}
                    </span>

                    {/* 额外信息（计数等） */}
                    {renderNodeExtra ? (
                        renderNodeExtra(node, isSelected)
                    ) : node.count !== undefined ? (
                        <span className={cn(
                            "text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-full",
                            isSelected ? "bg-blue-100 text-blue-700" : "text-gray-400 opacity-60"
                        )}>
                            {node.count}
                        </span>
                    ) : null}

                    {/* 操作菜单 */}
                    {actions && actions.length > 0 && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-6 h-6 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all"
                                    >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40 rounded-xl shadow-xl border-gray-100">
                                    {actions.map((action, idx) => (
                                        <Fragment key={idx}>
                                            {action.divideBefore && <div className="h-px bg-gray-50 my-1 mx-1" />}
                                            <DropdownMenuItem
                                                onClick={() => action.onClick(node)}
                                                className={cn("text-xs font-medium rounded-lg py-2", action.className)}
                                            >
                                                <div className="w-4 h-4 mr-2 opacity-60">{action.icon}</div>
                                                {action.label}
                                            </DropdownMenuItem>
                                        </Fragment>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* 子节点递归 */}
                {hasChildren && isExpanded && (
                    <div className="mt-0.5">
                        {node.children!.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn("flex flex-col min-h-0", className)}>
            {data.map(node => renderTreeNode(node))}
        </div>
    );
}
