import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Download,
  Loader2,
  FileQuestion,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { faqService, knowledgeTagService } from '@/services/knowledge-base';
import type { FAQEntry, KnowledgeTag, FAQEntryFieldsBatchRequest } from '@/types/knowledge-base';
import { toast } from 'sonner';
import { FAQTagSidebar } from './FAQTagSidebar';
import { FAQCard } from './FAQCard';
import { FAQEditorModal } from './FAQEditorModal';

interface FAQEntryManagerProps {
  kbId: string;
}

export function FAQEntryManager({ kbId }: FAQEntryManagerProps) {
  const [entries, setEntries] = useState<FAQEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FAQEntry | null>(null);

  // Tags for selector in editor
  const [tags, setTags] = useState<KnowledgeTag[]>([]);

  // Load Tags for editor (and mapping tag names)
  const loadTags = useCallback(async () => {
    try {
      const res = await knowledgeTagService.listKnowledgeTags(kbId, { page: 1, page_size: 100 });
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setTags(list.map((t: any) => ({ ...t, id: String(t.id) })));
    } catch (e) {
      console.error('Failed to load tags', e);
    }
  }, [kbId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const loadEntries = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1);
      setEntries([]);
      setHasMore(true);
    }
    const currentPage = reset ? 1 : page;
    setLoading(true);
    try {
      const res = await faqService.listFAQEntries(kbId, {
        page: currentPage,
        page_size: 20,
        tag_id: selectedTagId ? Number(selectedTagId) : undefined,
        keyword: searchKeyword || undefined,
      });

      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];

      // Ensure we have an array and filter out nulls
      const safeList = (Array.isArray(list) ? list : []).filter(e => !!e);

      if (safeList.length < 20) {
        setHasMore(false);
      }

      setEntries(prev => reset ? safeList : [...prev, ...safeList]);
    } catch (e: any) {
      toast.error('加载 FAQ 列表失败');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [kbId, selectedTagId, searchKeyword, page]);

  useEffect(() => {
    loadEntries(true);
  }, [loadEntries]);

  // Infinite scroll or load more could be implemented, for now simple pagination or load more button
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  const handleDelete = async (entry: FAQEntry) => {
    if (!confirm('确定要删除这条 FAQ 吗？')) return;
    try {
      await faqService.deleteFAQEntries(kbId, [entry.seq_id]);
      toast.success('删除成功');
      loadEntries(true);
      loadTags(); // Reload tags as counts might update
    } catch (e: any) {
      toast.error('删除失败');
    }
  };

  const handleStatusChange = async (entry: FAQEntry, enabled: boolean) => {
    // Optimistic update
    setEntries(prev => prev.map(e => e.seq_id === entry.seq_id ? { ...e, is_enabled: enabled } : e));
    try {
      const payload: FAQEntryFieldsBatchRequest = {
        by_id: {
          [entry.seq_id]: { is_enabled: enabled }
        }
      };
      await faqService.updateFAQEntryFieldsBatch(kbId, payload);
      toast.success(enabled ? '已启用' : '已禁用');
    } catch (e: any) {
      // Revert
      setEntries(prev => prev.map(e => e.seq_id === entry.seq_id ? { ...e, is_enabled: !enabled } : e));
      toast.error('状态更新失败');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await faqService.exportFAQEntries(kbId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faq_export_${kbId}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('导出成功');
    } catch (e: any) {
      toast.error('导出失败');
    }
  };

  const getTagName = (tagId?: number) => {
    if (!tagId) return undefined;
    const tag = tags.find(t => String(t.id) === String(tagId));
    return tag?.name;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] border rounded-lg bg-background overflow-hidden shadow-sm">
      {/* Sidebar */}
      <FAQTagSidebar
        kbId={kbId}
        selectedTagId={selectedTagId}
        onSelectTag={setSelectedTagId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center justify-between gap-4 bg-background/50 backdrop-blur-sm z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索问题..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 h-9"
              onKeyDown={(e) => e.key === 'Enter' && loadEntries(true)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingEntry(null);
                setEditorOpen(true);
              }}
              className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加 FAQ
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/5 scrollbar-thin">
          {entries.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="bg-muted/30 p-4 rounded-full mb-4">
                <FileQuestion className="w-12 h-12 opacity-20" />
              </div>
              <p className="font-medium">暂无 FAQ 条目</p>
              <p className="text-sm opacity-60 mt-1">
                {searchKeyword ? '尝试更换搜索关键词' : '点击上方按钮添加第一条 FAQ'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
              {entries.map((entry) => (
                <FAQCard
                  key={entry.seq_id}
                  entry={entry}
                  tagName={getTagName(entry.tag_id)}
                  onEdit={(e) => {
                    setEditingEntry(e);
                    setEditorOpen(true);
                  }}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
            </div>
          )}

          {!loading && hasMore && entries.length > 0 && (
            <div className="flex justify-center pt-4 pb-8">
              <Button variant="ghost" onClick={handleLoadMore} disabled={loading}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </div>

      <FAQEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        kbId={kbId}
        initialEntry={editingEntry}
        tags={tags}
        onSuccess={() => {
          loadEntries(true);
          loadTags(); // Reload tags in case counts changed or new tags added
        }}
      />
    </div>
  );
}
