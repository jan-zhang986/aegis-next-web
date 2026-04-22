/**
 * @ 知识库/文件选择器
 * 参考 aegis-rag-frontend MentionSelector
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { knowledgeBaseService, knowledgeFileService } from '@/services/knowledge-base';
import { Folder, FileText, Loader2 } from 'lucide-react';

export interface MentionItem {
  id: string;
  name: string;
  type: 'kb' | 'file';
  kbType?: 'document' | 'faq';
  count?: number;
  kbName?: string;
}

interface Props {
  visible: boolean;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const DROPDOWN_MAX_HEIGHT = 320;
const GAP = 8;

export function CaseGenerationMentionSelector({ visible, onSelect, onClose, anchorRef }: Props) {
  const [kbItems, setKbItems] = useState<MentionItem[]>([]);
  const [fileItems, setFileItems] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  const loadKbs = useCallback(async () => {
    try {
      const res: any = await knowledgeBaseService.listKnowledgeBases();
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      const valid = list.filter(
        (kb: any) => kb.embedding_model_id && kb.summary_model_id
      );
      setKbItems(
        valid.map((kb: any) => ({
          id: kb.id,
          name: kb.name,
          type: 'kb' as const,
          kbType: (kb.type || 'document') as 'document' | 'faq',
          count: kb.type === 'faq' ? (kb.chunk_count ?? 0) : (kb.knowledge_count ?? 0),
        }))
      );
    } catch (e) {
      console.error('Failed to load knowledge bases', e);
      setKbItems([]);
    }
  }, []);

  const loadFiles = useCallback(async (q: string, offset = 0) => {
    setLoading(true);
    try {
      const res: any = await knowledgeFileService.searchKnowledge(q || '', offset, 20);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : [];
      setFileItems(
        list.map((f: any) => ({
          id: f.id,
          name: f.title || f.file_name || f.name,
          type: 'file' as const,
          kbName: f.knowledge_base_name || '',
        }))
      );
    } catch (e) {
      console.error('Failed to search knowledge', e);
      setFileItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadKbs();
      loadFiles(query);
      setActiveIndex(0);
    }
  }, [visible, query, loadKbs]);

  const filteredKbs = query
    ? kbItems.filter((kb) => kb.name.toLowerCase().includes(query.toLowerCase()))
    : kbItems;
  const allItems = [...filteredKbs, ...fileItems];
  const maxIndex = Math.max(0, allItems.length - 1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!visible) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(maxIndex, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = allItems[activeIndex];
        if (item) onSelect(item);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [visible, activeIndex, maxIndex, allItems, onSelect, onClose]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - GAP;
      const spaceAbove = rect.top - GAP;
      const openAbove = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
      setPosition({
        left: rect.left,
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + GAP }
          : { top: rect.bottom + GAP }),
      });
    } else if (!visible) {
      setPosition(null);
    }
  }, [visible]);

  if (!visible) return null;

  const dropdownContent = (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden
      />
      {position && (
      <div
        className="fixed z-[9999] w-[320px] max-h-[320px] overflow-y-auto flex flex-col rounded-xl bg-card border border-border shadow-lg"
        style={{ left: position.left, top: position.top, bottom: position.bottom }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <input
          type="text"
          className="m-2 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
          placeholder="搜索知识库或文件..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {filteredKbs.length > 0 && (
          <div className="py-1 border-b border-border/40">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">知识库</div>
            {filteredKbs.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
                  idx === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                }`}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <Folder className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate flex-1">{item.name}</span>
                {item.count !== undefined && (
                  <span className="text-xs text-muted-foreground">({item.count})</span>
                )}
              </div>
            ))}
          </div>
        )}
        {fileItems.length > 0 && (
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">文件</div>
            {fileItems.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
                  filteredKbs.length + idx === activeIndex
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/60'
                }`}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setActiveIndex(filteredKbs.length + idx)}
              >
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate flex-1">{item.name}</span>
                {item.kbName && (
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.kbName}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && filteredKbs.length === 0 && fileItems.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">暂无结果</div>
        )}
      </div>
      )}
    </>
  );

  return createPortal(dropdownContent, document.body);
}
