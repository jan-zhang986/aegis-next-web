import { useState, useRef, useCallback } from 'react';
import { metadataService } from '@/services/metadata';
import { toast } from 'sonner';
import { copyToClipboard } from '@/utils/clipboard';
import type { MetadataDefinition } from '@/services/metadata';

export function useFileManagement(definition: MetadataDefinition, onBack?: () => void) {
  const [isEditFileIdDialogOpen, setIsEditFileIdDialogOpen] = useState(false);
  const [newFileId, setNewFileId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyFileId = useCallback(async () => {
    if (!definition.scriptContent) {
      toast.error('文件ID不存在');
      return;
    }
    const ok = await copyToClipboard(definition.scriptContent);
    if (ok) toast.success('文件ID已复制到剪贴板');
    else toast.error('复制失败，请手动复制');
  }, [definition.scriptContent]);

  const handleDownloadFile = useCallback(async () => {
    if (!definition.scriptContent) {
      toast.error('文件ID不存在');
      return;
    }
    try {
      const blob = await metadataService.downloadFile(definition.scriptContent);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('文件下载成功！');
    } catch (e: unknown) {
      console.error('文件下载失败:', e);
      const err = e as { message?: string; response?: { data?: { message?: string } } };
      toast.error(err?.message || err?.response?.data?.message || '文件下载失败，请重试');
    }
  }, [definition.scriptContent]);

  const handleOpenEditFileId = useCallback(() => {
    setNewFileId('');
    setSelectedFile(null);
    setIsEditFileIdDialogOpen(true);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
  }, []);

  const handleUpdateFileId = useCallback(
    async (fileId: string) => {
      if (!fileId.trim()) {
        toast.error('文件ID不存在');
        return;
      }
      if (fileId.trim() === definition.scriptContent) {
        toast.info('文件ID未发生变化');
        setIsEditFileIdDialogOpen(false);
        return;
      }
      try {
        setIsUpdating(true);
        await metadataService.updateDefinition({
          id: definition.id,
          name: definition.name,
          moduleId: definition.moduleId,
          description: definition.description,
          tags: definition.tags,
          scriptContent: fileId.trim(),
        });
        toast.success('文件更新成功！');
        setIsEditFileIdDialogOpen(false);
        setNewFileId('');
        setSelectedFile(null);
        onBack?.();
        window.location.reload();
      } catch (e: unknown) {
        console.error('更新文件ID失败:', e);
        const err = e as { message?: string; response?: { data?: { message?: string } } };
        toast.error(err?.message || err?.response?.data?.message || '更新文件ID失败，请重试');
      } finally {
        setIsUpdating(false);
      }
    },
    [definition, onBack]
  );

  const handleUploadFile = useCallback(async () => {
    if (!selectedFile) {
      toast.error('请选择要上传的文件');
      return;
    }
    if (!definition.moduleId) {
      toast.error('模块ID不存在，无法上传文件');
      return;
    }
    try {
      setIsUploading(true);
      const res = await metadataService.uploadFile(selectedFile, definition.moduleId);
      await handleUpdateFileId(res.fileId);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: unknown) {
      console.error('文件上传失败:', e);
      const err = e as { message?: string; response?: { data?: { message?: string } } };
      toast.error(err?.message || err?.response?.data?.message || '文件上传失败，请重试');
    } finally {
      setIsUpdating(false);
      setIsUploading(false);
    }
  }, [selectedFile, definition.moduleId, handleUpdateFileId]);

  return {
    isEditFileIdDialogOpen,
    setIsEditFileIdDialogOpen,
    newFileId,
    setNewFileId,
    isUpdating,
    selectedFile,
    setSelectedFile,
    isUploading,
    fileInputRef,
    handleCopyFileId,
    handleDownloadFile,
    handleOpenEditFileId,
    handleFileSelect,
    handleUploadFile,
    handleUpdateFileId,
  };
}
