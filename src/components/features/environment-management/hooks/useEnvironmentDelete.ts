import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { environmentService } from '@/services/environment';

export function useEnvironmentDelete(reload: () => void) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenDelete = useCallback((id: string) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    try {
      await environmentService.deleteEnvironment(deletingId);
      toast.success('环境删除成功');
      setShowDeleteDialog(false);
      setDeletingId(null);
      reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || '删除环境失败，请稍后重试');
    }
  }, [deletingId, reload]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setDeletingId(null);
  }, []);

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    deletingId,
    handleOpenDelete,
    handleDelete,
    handleCancelDelete,
  };
}
