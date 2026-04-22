/**
 * 文档内容预览（右侧抽屉）
 * 从 aegis-rag-frontend doc-content.vue 迁移（简化版）
 */

import { useState, useEffect } from 'react';
import { knowledgeFileService } from '@/services/knowledge-base';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Chunk {
  id?: string;
  content?: string;
  [key: string]: unknown;
}

interface DocContentViewerProps {
  open: boolean;
  knowledgeId: string;
  title?: string;
  onOpenChange: (open: boolean) => void;
}

/** API 每页返回的 chunk 数量（getChunkDetails 固定 page_size=25） */
const CHUNK_PAGE_SIZE = 25;

export function DocContentViewer({ open, knowledgeId, title, onOpenChange }: DocContentViewerProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !knowledgeId) return;
    let cancelled = false;
    setLoading(true);
    const loadAllChunks = async () => {
      const all: Chunk[] = [];
      let page = 1;
      for (;;) {
        const res: any = await knowledgeFileService.getChunkDetails(knowledgeId, page);
        if (cancelled) return;
        const raw = res?.data ?? res?.list ?? res?.records ?? res?.chunks ?? res;
        const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.list ?? raw?.records ?? raw?.chunks ?? []);
        if (list.length === 0) break;
        all.push(...list);
        if (list.length < CHUNK_PAGE_SIZE) break;
        page++;
      }
      if (!cancelled) setChunks(all);
    };
    loadAllChunks()
      .catch(() => {
        if (!cancelled) setChunks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, knowledgeId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="truncate pr-8">{title || '文档内容'}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0 p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">加载中...</div>
          ) : chunks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无内容</div>
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk, i) => (
                <div key={chunk.id || i} className="p-3 rounded-md bg-gray-50 text-sm">
                  {chunk.content || String(chunk)}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
