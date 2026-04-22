/**
 * 知识库详情视图
 * 从 aegis-rag-frontend KnowledgeBase.vue 完整迁移
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  FileText,
  Link,
  FileEdit,
  Loader2,
  Search,
  MoreHorizontal,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  Folder,
  Edit,
  X,
  Check,
  FileSpreadsheet,
  Image,
  Globe,
  PenLine,
  FileType,
  AlertCircle,
} from 'lucide-react';
import {
  knowledgeBaseService,
  knowledgeFileService,
  knowledgeTagService,
} from '@/services/knowledge-base';
import type { KnowledgeBase, KnowledgeFile, KnowledgeTag } from '@/types/knowledge-base';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ManualKnowledgeEditor } from './ManualKnowledgeEditor';
import { DocContentViewer } from './DocContentViewer';
import { FAQEntryManager } from './FAQEntryManager';
import { KnowledgeBaseEditorModal } from './KnowledgeBaseEditorModal';

const PAGE_SIZE = 35;
const TAG_PAGE_SIZE = 50;
const VALID_FILE_TYPES = ['pdf', 'txt', 'md', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'csv', 'xlsx', 'xls'];
const FILE_TYPE_ALL = '__all__';
const FILE_TYPE_OPTIONS = [
  { value: FILE_TYPE_ALL, label: '全部类型' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'doc', label: 'DOC' },
  { value: 'txt', label: 'TXT' },
  { value: 'md', label: 'MD' },
  { value: 'url', label: 'URL' },
  { value: 'manual', label: '手动创建' },
];

function formatDocTime(time?: string): string {
  if (!time) return '--';
  const d = new Date(time);
  return d.toLocaleString('zh-CN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKnowledgeType(item: KnowledgeFile & { type?: string }): string {
  if (item.type === 'url') return 'URL';
  if (item.type === 'manual') return '手动创建';
  if (item.file_type) return String(item.file_type).toUpperCase();
  return '--';
}

/** 根据文件类型返回图标和颜色配置 */
function getFileTypeConfig(item: KnowledgeFile & { type?: string }) {
  const t = item.type;
  const ext = (item.file_type || '').toLowerCase();
  if (t === 'url') return { icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50', label: 'URL' };
  if (t === 'manual') return { icon: PenLine, color: 'text-violet-500', bg: 'bg-violet-50', label: '手动' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
    return { icon: Image, color: 'text-pink-500', bg: 'bg-pink-50', label: ext.toUpperCase() };
  if (['xlsx', 'xls', 'csv'].includes(ext))
    return { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50', label: ext.toUpperCase() };
  if (['pdf'].includes(ext))
    return { icon: FileType, color: 'text-red-500', bg: 'bg-red-50', label: 'PDF' };
  if (['md', 'txt'].includes(ext))
    return { icon: FileEdit, color: 'text-amber-500', bg: 'bg-amber-50', label: ext.toUpperCase() };
  return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50', label: ext ? ext.toUpperCase() : 'DOC' };
}

function validateFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!VALID_FILE_TYPES.includes(ext)) {
    toast.error('不支持的文件类型');
    return false;
  }
  return true;
}

type KnowledgeFileCard = KnowledgeFile & { display_name?: string };

interface KnowledgeBaseDetailViewProps {
  kbId: string;
  onBack: () => void;
  knowledgeList?: { id: string; name: string; type?: string }[];
  onNavigateToKb?: (kbId: string) => void;
}

export function KnowledgeBaseDetailView({
  kbId,
  onBack,
  knowledgeList = [],
  onNavigateToKb,
}: KnowledgeBaseDetailViewProps) {
  const [kbInfo, setKbInfo] = useState<KnowledgeBase | null>(null);
  const [files, setFiles] = useState<KnowledgeFileCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedFileType, setSelectedFileType] = useState(FILE_TYPE_ALL);
  const [tagList, setTagList] = useState<(KnowledgeTag & { id: string; knowledge_count?: number })[]>([]);
  const [tagPage, setTagPage] = useState(1);
  const [tagTotal, setTagTotal] = useState(0);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagLoading, setTagLoading] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [creatingTagLoading, setCreatingTagLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagSubmitting, setEditingTagSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<KnowledgeFileCard | null>(null);
  const [manualEditorOpen, setManualEditorOpen] = useState(false);
  const [manualEditorFile, setManualEditorFile] = useState<KnowledgeFileCard | null>(null);
  const [docPreview, setDocPreview] = useState<{ id: string; title?: string } | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [urlImporting, setUrlImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadKbInfo = useCallback(async () => {
    try {
      const res = await knowledgeBaseService.getKnowledgeBaseById(kbId);
      const data = (res as any)?.data ?? res;
      setKbInfo(data);
    } catch (e: any) {
      toast.error(e?.message || '加载知识库失败');
    }
  }, [kbId]);

  const loadTags = useCallback(
    async (reset = false) => {
      if (reset) {
        setTagPage(1);
      }
      const pageNum = reset ? 1 : tagPage;
      setTagLoading(true);
      try {
        const res = await knowledgeTagService.listKnowledgeTags(kbId, {
          page: pageNum,
          page_size: TAG_PAGE_SIZE,
          keyword: tagSearchQuery.trim() || undefined,
        });
        const pageData = (res as any)?.data ?? res;
        const list = Array.isArray(pageData) ? pageData : pageData?.data ?? [];
        const totalCount = (res as any)?.total ?? pageData?.total ?? list.length;
        const formatted = list.map((t: any) => ({ ...t, id: String(t.id) }));
        if (reset || pageNum === 1) {
          setTagList(formatted);
        } else {
          setTagList((prev) => [...prev, ...formatted]);
        }
        setTagTotal(totalCount);
      } catch {
        setTagList([]);
      } finally {
        setTagLoading(false);
      }
    },
    [kbId, tagPage, tagSearchQuery]
  );

  const loadFiles = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await knowledgeFileService.listKnowledgeFiles(kbId, {
          page: pageNum,
          page_size: PAGE_SIZE,
          keyword: keyword.trim() || undefined,
          tag_id: selectedTagId || undefined,
          file_type: selectedFileType === FILE_TYPE_ALL ? undefined : selectedFileType,
        });
        const r = res as any;
        const raw = r?.data ?? r?.list ?? r?.records ?? r?.results ?? r;
        const list = Array.isArray(raw)
          ? raw
          : (raw?.data ?? raw?.list ?? raw?.records ?? raw?.results ?? []);
        const totalCount =
          r?.total ??
          r?.total_entries ??
          (typeof r?.meta === 'object' && r.meta?.total) ??
          raw?.total ??
          raw?.total_entries ??
          list.length;

        const formatted = list.map((item: any) => {
          const rawName = item.file_name || item.title || item.source || '未命名文档';
          const dotIndex = rawName.lastIndexOf('.');
          const displayName = dotIndex > 0 ? rawName.substring(0, dotIndex) : rawName;
          return {
            ...item,
            display_name: displayName,
          };
        });

        if (pageNum === 1) {
          setFiles(formatted);
        } else {
          setFiles((prev) => [...prev, ...formatted]);
        }
        setTotal(totalCount);
      } catch (e: any) {
        toast.error(e?.message || '加载文档列表失败');
      } finally {
        setLoading(false);
      }
    },
    [kbId, keyword, selectedTagId, selectedFileType]
  );

  // 解析状态轮询
  useEffect(() => {
    const needPoll = files.some((f) => {
      const parsing = f.parse_status === 'pending' || f.parse_status === 'processing';
      const summaryPending =
        f.parse_status === 'completed' &&
        (f.summary_status === 'pending' || f.summary_status === 'processing');
      return parsing || summaryPending;
    });
    if (!needPoll) return;

    const ids = files
      .filter((f) => {
        const parsing = f.parse_status === 'pending' || f.parse_status === 'processing';
        const summaryPending =
          f.parse_status === 'completed' &&
          (f.summary_status === 'pending' || f.summary_status === 'processing');
        return parsing || summaryPending;
      })
      .map((f) => f.id);
    const query = ids.map((id) => `ids=${id}`).join('&');

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await knowledgeFileService.batchQueryKnowledge(query);
        const data = (res as any)?.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setFiles((prev) =>
            prev.map((f) => {
              const updated = data.find((d: any) => d.id === f.id);
              if (updated) {
                return {
                  ...f,
                  parse_status: updated.parse_status,
                  summary_status: updated.summary_status,
                  description: updated.description,
                };
              }
              return f;
            })
          );
        }
      } catch {
        // 轮询失败静默
      }
    }, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [files]);

  useEffect(() => {
    loadKbInfo();
  }, [loadKbInfo]);

  useEffect(() => {
    loadFiles(1);
    setPage(1);
  }, [loadFiles]);

  useEffect(() => {
    loadTags(true);
  }, [kbId]);

  const tagSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tagSearchDebounce.current) clearTimeout(tagSearchDebounce.current);
    tagSearchDebounce.current = setTimeout(() => {
      loadTags(true);
    }, 300);
    return () => {
      if (tagSearchDebounce.current) clearTimeout(tagSearchDebounce.current);
    };
  }, [tagSearchQuery]);

  const handleTagFilterChange = (tagId: string) => {
    setSelectedTagId(tagId);
    setPage(1);
  };

  const handleTagRowClick = (tagId: string) => {
    setCreatingTag(false);
    setEditingTagId(null);
    if (selectedTagId === tagId) return;
    handleTagFilterChange(tagId);
  };

  const startCreateTag = () => {
    setCreatingTag(true);
    setNewTagName('');
    setEditingTagId(null);
  };

  const cancelCreateTag = () => {
    setCreatingTag(false);
    setNewTagName('');
  };

  const submitCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      toast.warning('请输入标签名称');
      return;
    }
    setCreatingTagLoading(true);
    try {
      await knowledgeTagService.createKnowledgeBaseTag(kbId, { name });
      toast.success('创建成功');
      cancelCreateTag();
      loadTags(true);
    } catch (e: any) {
      toast.error(e?.message || '创建失败');
    } finally {
      setCreatingTagLoading(false);
    }
  };

  const startEditTag = (tag: { id: string; name: string }) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setCreatingTag(false);
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
    setEditingTagName('');
  };

  const submitEditTag = async () => {
    if (!editingTagId) return;
    const name = editingTagName.trim();
    if (!name) {
      toast.warning('请输入标签名称');
      return;
    }
    setEditingTagSubmitting(true);
    try {
      await knowledgeTagService.updateKnowledgeBaseTag(kbId, editingTagId, { name });
      toast.success('更新成功');
      cancelEditTag();
      loadTags(true);
    } catch (e: any) {
      toast.error(e?.message || '更新失败');
    } finally {
      setEditingTagSubmitting(false);
    }
  };

  const confirmDeleteTag = async (tag: { id: string; seq_id?: number; name: string }) => {
    if (!window.confirm(`确定要删除标签「${tag.name}」吗？`)) return;
    try {
      const tagIdForDelete = tag.seq_id ?? Number(tag.id);
      await knowledgeTagService.deleteKnowledgeBaseTag(kbId, tagIdForDelete, { force: true });
      toast.success('删除成功');
      if (selectedTagId === tag.id) {
        setSelectedTagId('');
      }
      loadTags(true);
      setTimeout(() => loadFiles(1), 500);
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const handleKnowledgeTagChange = async (knowledgeId: string, tagValue: string) => {
    try {
      await knowledgeFileService.updateKnowledgeTagBatch({
        updates: { [knowledgeId]: tagValue || null },
      });
      toast.success('分类已更新');
      loadFiles(1);
      loadTags(true);
    } catch (e: any) {
      toast.error(e?.message || '更新失败');
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFiles(nextPage);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 50 && files.length < total) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFiles(nextPage);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const tagIdToUpload = selectedTagId || undefined;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!validateFile(file)) {
        failCount++;
        continue;
      }
      try {
        await knowledgeFileService.uploadKnowledgeFile(kbId, { file, tag_id: tagIdToUpload });
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(fileList.length === 1 ? '上传成功' : `成功上传 ${successCount} 个文件`);
      loadFiles(1);
      loadTags(true);
    }
    if (failCount > 0) {
      toast.error(`失败 ${failCount} 个`);
    }
    e.target.value = '';
  };

  const handleDeleteFile = (file: KnowledgeFileCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingFile(file);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!deletingFile) return;
    try {
      await knowledgeFileService.deleteKnowledgeDetails(deletingFile.id);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      setDeletingFile(null);
      loadFiles(1);
      loadTags(true);
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const handleManualEdit = (file: KnowledgeFileCard) => {
    setManualEditorFile(file);
    setManualEditorOpen(true);
  };

  const handleURLImportClick = () => {
    setUrlInputValue('');
    setUrlDialogOpen(true);
  };

  const handleURLImportConfirm = async () => {
    const url = urlInputValue.trim();
    if (!url) {
      toast.warning('请输入 URL');
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.warning('请输入有效的 URL');
      return;
    }
    setUrlImporting(true);
    try {
      await knowledgeFileService.createKnowledgeFromURL(kbId, {
        url,
        tag_id: selectedTagId || undefined,
      });
      toast.success('URL 导入成功');
      setUrlDialogOpen(false);
      setUrlInputValue('');
      loadFiles(1);
      loadTags(true);
    } catch (e: any) {
      toast.error(e?.message || 'URL 导入失败');
    } finally {
      setUrlImporting(false);
    }
  };

  const tagMap = Object.fromEntries(tagList.map((t) => [t.id, t]));
  const getTagName = (tagId?: string) => {
    if (!tagId) return '未分类';
    return tagMap[tagId]?.name ?? tagId;
  };

  const isFAQ = kbInfo?.type === 'faq';
  const hasMore = files.length < total;

  if (isFAQ) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 shrink-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-gray-900 truncate">{kbInfo?.name || '知识库详情'}</h2>
            <p className="text-xs text-gray-500">FAQ 问答</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSettingsModalOpen(true)}>
            <Settings className="w-4 h-4 mr-1" />
            设置
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <FAQEntryManager kbId={kbId} onOpenSettings={() => setSettingsModalOpen(true)} />
        </div>
        <KnowledgeBaseEditorModal
          open={settingsModalOpen}
          mode="edit"
          kbId={kbId}
          initialType="faq"
          onOpenChange={setSettingsModalOpen}
          onSuccess={() => loadKbInfo()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 头部：面包屑 + 知识库切换 */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm text-gray-500">知识库</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
          {knowledgeList.length > 0 && onNavigateToKb ? (
            <Select
              value={kbId}
              onValueChange={(v) => v !== kbId && onNavigateToKb(v)}
            >
              <SelectTrigger className="w-[220px] border-0 shadow-none font-medium">
                <SelectValue placeholder={kbInfo?.name || '--'} />
              </SelectTrigger>
              <SelectContent>
                {knowledgeList.map((kb) => (
                  <SelectItem key={kb.id} value={kb.id}>
                    {kb.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-medium truncate">{kbInfo?.name || '知识库详情'}</span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">文档</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSettingsModalOpen(true)}>
          <Settings className="w-4 h-4 mr-1" />
          设置
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 标签侧边栏 */}
        <aside className="w-56 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">文档分类</span>
              <span className="text-xs text-gray-500">({tagList.length})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={startCreateTag}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索标签..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {creatingTag && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white border">
                <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="标签名称"
                  className="h-7 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitCreateTag();
                    if (e.key === 'Escape') cancelCreateTag();
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={submitCreateTag}
                  disabled={creatingTagLoading}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelCreateTag}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            {tagList.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer group ${selectedTagId === tag.id ? 'bg-green-50 text-green-700' : 'hover:bg-gray-100'
                  }`}
                onClick={() => handleTagRowClick(tag.id)}
              >
                {editingTagId === tag.id ? (
                  <>
                    <Input
                      value={editingTagName}
                      onChange={(e) => setEditingTagName(e.target.value)}
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitEditTag();
                        if (e.key === 'Escape') cancelEditTag();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        submitEditTag();
                      }}
                      disabled={editingTagSubmitting}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEditTag();
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate text-sm">{tag.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {tag.knowledge_count ?? 0}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditTag(tag)}>
                          <Edit className="w-4 h-4 mr-2" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => confirmDeleteTag(tag)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 工具栏 */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索文档..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFiles(1)}
                className="pl-8"
              />
            </div>
            <Select value={selectedFileType} onValueChange={(v) => { setSelectedFileType(v); setPage(1); }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="文件类型" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={VALID_FILE_TYPES.map((t) => `.${t}`).join(',')}
              multiple
              onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              上传文件
            </Button>
            <Button variant="outline" size="sm" onClick={handleURLImportClick}>
              <Link className="w-4 h-4 mr-2" />
              导入网页
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setManualEditorFile(null); setManualEditorOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              手工创建
            </Button>
          </div>

          {/* 文档卡片网格 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4"
            onScroll={handleScroll}
          >
            {loading && files.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">暂无文档</p>
                <Button variant="outline" className="mt-3" onClick={handleUploadClick}>
                  上传文件
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {files.map((file) => {
                  const typeConfig = getFileTypeConfig(file);
                  const TypeIcon = typeConfig.icon;
                  const isParsing = file.parse_status === 'pending' || file.parse_status === 'processing';
                  const isFailed = file.parse_status === 'failed';
                  const isDraft = file.parse_status === 'draft';
                  const isCompleted = file.parse_status === 'completed';
                  const isSummarizing = isCompleted && (file.summary_status === 'pending' || file.summary_status === 'processing');
                  return (
                    <div
                      key={file.id}
                      className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-2 min-h-[156px]"
                      onClick={() => {
                        if (file.type !== 'url') {
                          setDocPreview({ id: file.id, title: file.display_name || file.file_name });
                        }
                      }}
                    >
                      {/* 头部：文件类型图标 + 标题 + 操作菜单 */}
                      <div className="flex items-start gap-2.5">
                        <div className={`w-9 h-9 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <TypeIcon className={`w-4.5 h-4.5 ${typeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2"
                              title={file.display_name || file.file_name}
                            >
                              {file.display_name || file.file_name || '未命名'}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {file.type === 'manual' && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleManualEdit(file);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" /> 编辑
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => handleDeleteFile(file, e)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> 删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {/* 状态条 */}
                          {isParsing && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                              <span className="text-[11px] text-blue-500 font-medium">解析中...</span>
                            </div>
                          )}
                          {isSummarizing && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
                              <span className="text-[11px] text-violet-500 font-medium">生成摘要中...</span>
                            </div>
                          )}
                          {isFailed && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              <span className="text-[11px] text-red-500 font-medium">解析失败</span>
                            </div>
                          )}
                          {isDraft && (
                            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600">草稿</span>
                          )}
                        </div>
                      </div>

                      {/* 摘要描述 */}
                      {isCompleted && !isSummarizing && (
                        <p className="text-xs text-gray-400 line-clamp-3 flex-1 leading-relaxed">
                          {file.description || '暂无摘要'}
                        </p>
                      )}
                      {!isCompleted && !isParsing && !isFailed && !isDraft && (
                        <p className="text-xs text-gray-300 flex-1">暂无摘要</p>
                      )}

                      {/* 底部元信息 */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {tagList.length > 0 ? (
                            <Select
                              value={file.tag_id || '__none__'}
                              onValueChange={(v) => {
                                handleKnowledgeTagChange(file.id, v === '__none__' ? '' : v);
                              }}
                            >
                              <SelectTrigger className="h-5 px-1.5 text-[10px] border-0 shadow-none bg-gray-50 hover:bg-gray-100 rounded w-auto max-w-[90px] gap-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">未分类</SelectItem>
                                {tagList.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : null}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{formatDocTime(file.updated_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {hasMore && loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <DocContentViewer
        open={!!docPreview}
        knowledgeId={docPreview?.id ?? ''}
        title={docPreview?.title}
        onOpenChange={(o) => { if (!o) setDocPreview(null); }}
      />

      <ManualKnowledgeEditor
        open={manualEditorOpen}
        mode={manualEditorFile ? 'edit' : 'create'}
        kbId={kbId}
        knowledgeId={manualEditorFile?.id}
        initialTitle={manualEditorFile?.display_name || manualEditorFile?.file_name}
        initialContent={''}
        initialStatus="draft"
        onClose={() => {
          setManualEditorOpen(false);
          setManualEditorFile(null);
        }}
        onSuccess={() => {
          setManualEditorOpen(false);
          setManualEditorFile(null);
          loadFiles(1);
        }}
      />

      <KnowledgeBaseEditorModal
        open={settingsModalOpen}
        mode="edit"
        kbId={kbId}
        initialType="document"
        onOpenChange={setSettingsModalOpen}
        onSuccess={() => { loadKbInfo(); loadTags(true); }}
      />

      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入网页</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL 地址</label>
              <Input
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleURLImportConfirm()}
              />
              <p className="text-xs text-gray-500 mt-1">
                支持导入各类网页内容，系统会自动提取和解析
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleURLImportConfirm} disabled={urlImporting}>
              {urlImporting ? '导入中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deletingFile?.display_name || deletingFile?.file_name}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
