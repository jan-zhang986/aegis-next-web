/**
 * 知识库页面
 * 从 aegis-rag-frontend 迁移
 * 支持列表和详情两种视图
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Folder,
  MessageCircleQuestion,
  MoreHorizontal,
  Settings,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { knowledgeBaseService } from '@/services/knowledge-base';
import type { KnowledgeBase as KBType } from '@/types/knowledge-base';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { KnowledgeBaseDetailView } from '@/components/features/knowledge-base/KnowledgeBaseDetailView';
import { KnowledgeBaseEditorModal } from '@/components/features/knowledge-base/KnowledgeBaseEditorModal';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isInitialized(kb: KBType): boolean {
  return !!(
    kb.embedding_model_id &&
    kb.embedding_model_id !== '' &&
    kb.summary_model_id &&
    kb.summary_model_id !== ''
  );
}

export function KnowledgeBasePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kbId = searchParams.get('kbId');

  const [kbs, setKbs] = useState<KBType[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingKb, setDeletingKb] = useState<KBType | null>(null);
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorKbId, setEditorKbId] = useState<string | undefined>();
  const [editorType, setEditorType] = useState<'document' | 'faq'>('document');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await knowledgeBaseService.listKnowledgeBases();
      const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setKbs(
        data.map((kb: any) => ({
          ...kb,
          updated_at: kb.updated_at ? formatDate(kb.updated_at) : '',
        }))
      );
    } catch (e: any) {
      toast.error(e?.message || '加载知识库列表失败');
      setKbs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCardClick = (kb: KBType) => {
    if (isInitialized(kb)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('kbId', kb.id);
        return next;
      });
    } else {
      toast.info('请先完成知识库配置');
      // 可在此打开设置弹窗
    }
  };

  const handleSettings = (kb: KBType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorMode('edit');
    setEditorKbId(kb.id);
    setEditorType((kb.type as 'document' | 'faq') || 'document');
    setEditorModalOpen(true);
  };

  const handleDelete = (kb: KBType, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingKb(kb);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKb) return;
    try {
      await knowledgeBaseService.deleteKnowledgeBase(deletingKb.id);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      setDeletingKb(null);
      if (kbId === deletingKb.id) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('kbId');
          return next;
        });
      }
      fetchList();
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const handleBackToList = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('kbId');
      return next;
    });
  };

  const handleCreate = (type?: 'document' | 'faq') => {
    setEditorMode('create');
    setEditorKbId(undefined);
    setEditorType(type || 'document');
    setEditorModalOpen(true);
  };

  const handleEditorSuccess = (newKbId: string) => {
    fetchList();
    // 只有在创建新知识库时才跳转到详情页，编辑时不跳转
    if (editorMode === 'create' && kbId !== newKbId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('kbId', newKbId);
        return next;
      });
    }
  };

  const handleNavigateToKb = (newKbId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('kbId', newKbId);
      return next;
    });
  };

  // 详情视图
  if (kbId) {
    return (
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
        <KnowledgeBaseDetailView
          kbId={kbId}
          onBack={handleBackToList}
          knowledgeList={kbs.map((kb) => ({ id: kb.id, name: kb.name, type: kb.type }))}
          onNavigateToKb={handleNavigateToKb}
        />
      </div>
    );
  }

  // 列表视图
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">知识库</h2>
            <p className="text-sm text-gray-500 mt-0.5">管理文档与 FAQ 知识库</p>
          </div>
          <Button onClick={() => handleCreate('document')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 hover:shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            新建知识库
          </Button>
        </div>

        <div className="border-b border-gray-200 mb-6" />

        {/* 卡片列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : kbs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kbs.map((kb) => (
              <Card
                key={kb.id}
                className={`cursor-pointer transition-all hover:shadow-md hover:border-green-500/50 ${!isInitialized(kb) ? 'opacity-90' : ''
                  } ${(kb.type || 'document') === 'document'
                    ? 'border-green-100 bg-gradient-to-br from-white to-green-50/50'
                    : 'border-blue-100 bg-gradient-to-br from-white to-blue-50/50'
                  }`}
                onClick={() => handleCardClick(kb)}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <span
                    className="font-medium text-gray-900 truncate flex-1 min-w-0"
                    title={kb.name}
                  >
                    {kb.name}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleSettings(kb, e)}>
                        <Settings className="w-4 h-4 mr-2" />
                        设置
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => handleDelete(kb, e)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
                    {kb.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      {kb.type === 'faq' ? (
                        <>
                          <MessageCircleQuestion className="w-3.5 h-3.5" />
                          <span>{kb.chunk_count ?? 0} 条</span>
                        </>
                      ) : (
                        <>
                          <Folder className="w-3.5 h-3.5" />
                          <span>{kb.knowledge_count ?? 0} 个文档</span>
                        </>
                      )}
                    </div>
                    <span>{kb.updated_at || '--'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">暂无知识库</p>
            <p className="text-sm text-gray-400 mt-1">创建第一个知识库开始使用</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 hover:shadow-md" onClick={() => handleCreate('document')}>
              <Plus className="w-4 h-4 mr-2" />
              新建知识库
            </Button>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除知识库「{deletingKb?.name}」吗？此操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <KnowledgeBaseEditorModal
          open={editorModalOpen}
          mode={editorMode}
          kbId={editorKbId}
          initialType={editorType}
          onOpenChange={setEditorModalOpen}
          onSuccess={handleEditorSuccess}
        />
      </div>
    </div>
  );
}
