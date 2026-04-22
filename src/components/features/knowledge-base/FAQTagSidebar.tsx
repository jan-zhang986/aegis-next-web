import { useState, useRef, useEffect } from 'react';
import {
    Folder,
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Check,
    X,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { knowledgeTagService } from '@/services/knowledge-base';
import type { KnowledgeTag } from '@/types/knowledge-base';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface FAQTagSidebarProps {
    kbId: string;
    selectedTagId: string | null;
    onSelectTag: (tagId: string | null) => void;
}

const PAGE_SIZE = 50;

export function FAQTagSidebar({ kbId, selectedTagId, onSelectTag }: FAQTagSidebarProps) {
    const [tags, setTags] = useState<KnowledgeTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Create state
    const [creating, setCreating] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const loadTags = async (reset = false) => {
        if (reset) {
            setPage(1);
            setTags([]);
        }
        const currentPage = reset ? 1 : page;
        setLoading(true);
        try {
            const res = await knowledgeTagService.listKnowledgeTags(kbId, {
                page: currentPage,
                page_size: PAGE_SIZE,
                keyword: searchQuery || undefined,
            });
            const data = (res as any)?.data ?? res;
            const list = Array.isArray(data) ? data : data?.data ?? [];
            const totalCount = (res as any)?.total ?? data?.total ?? list.length;

            const formatted = list.map((t: any) => ({
                ...t,
                id: String(t.id),
                seq_id: Number(t.id), // Ensure seq_id is available if needed
            }));

            setTags(prev => reset ? formatted : [...prev, ...formatted]);
            setTotal(totalCount);
        } catch (e: any) {
            toast.error('加载分类失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTags(true);
    }, [kbId, searchQuery]);

    const handleCreate = async () => {
        if (!newTagName.trim()) return;
        setCreateLoading(true);
        try {
            await knowledgeTagService.createKnowledgeBaseTag(kbId, { name: newTagName.trim() });
            toast.success('创建成功');
            setCreating(false);
            setNewTagName('');
            loadTags(true);
        } catch (e: any) {
            toast.error(e?.message || '创建失败');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingId || !editingName.trim()) return;
        setEditLoading(true);
        try {
            await knowledgeTagService.updateKnowledgeBaseTag(kbId, editingId, { name: editingName.trim() });
            toast.success('更新成功');
            setEditingId(null);
            setEditingName('');
            loadTags(true);
        } catch (e: any) {
            toast.error(e?.message || '更新失败');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (tag: KnowledgeTag) => {
        if (!confirm(`确定要删除分类"${tag.name}"吗？`)) return;
        try {
            await knowledgeTagService.deleteKnowledgeBaseTag(kbId, Number(tag.id), true);
            toast.success('删除成功');
            if (selectedTagId === String(tag.id)) {
                onSelectTag(null);
            }
            loadTags(true);
        } catch (e: any) {
            toast.error(e?.message || '删除失败');
        }
    };

    return (
        <div className="flex flex-col h-full border-r bg-muted/10 w-64 shrink-0">
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">FAQ 分类</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {total}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                        setCreating(true);
                        setEditingId(null);
                        setNewTagName('');
                    }}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Search */}
            <div className="p-2 border-b bg-background">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索分类..."
                        className="h-8 pl-8 text-xs bg-muted/20"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-2 space-y-1">
                    {/* Create Input */}
                    {creating && (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-background border shadow-sm animate-in fade-in slide-in-from-top-1">
                            <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Input
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="h-6 text-xs px-1.5 min-w-0"
                                placeholder="分类名称"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') setCreating(false);
                                }}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={handleCreate}
                                disabled={createLoading}
                            >
                                {createLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setCreating(false)}
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}

                    {/* Tag List */}
                    {tags.map((tag) => {
                        const isEditing = editingId === String(tag.id);
                        const isSelected = selectedTagId === String(tag.id);

                        if (isEditing) {
                            return (
                                <div key={tag.id} className="flex items-center gap-1.5 p-1.5 rounded-md bg-background border shadow-sm">
                                    <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                                    <Input
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="h-6 text-xs px-1.5 min-w-0"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdate();
                                            if (e.key === 'Escape') setEditingId(null);
                                        }}
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={handleUpdate}
                                        disabled={editLoading}
                                    >
                                        {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingId(null)}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={tag.id}
                                className={cn(
                                    "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm",
                                    isSelected
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => onSelectTag(isSelected ? null : String(tag.id))}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Folder className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary fill-current opacity-20" : "text-muted-foreground")} />
                                    <span className="truncate">{tag.name}</span>
                                    {tag.knowledge_count ? (
                                        <span className="text-xs opacity-60 ml-auto mr-2">{tag.knowledge_count}</span>
                                    ) : null}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                        >
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingId(String(tag.id));
                                                setEditingName(tag.name);
                                                setCreating(false);
                                            }}
                                        >
                                            <Edit className="w-3.5 h-3.5 mr-2" />
                                            编辑
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(tag);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                                            删除
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })}

                    {!loading && tags.length === 0 && !creating && (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            暂无分类
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
