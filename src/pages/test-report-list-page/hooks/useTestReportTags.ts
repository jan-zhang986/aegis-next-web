import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { workflowTestReportService } from '@/services/workflow-test-report';
import { TEST_REPORT_TAGS } from '@/constants';

export function useTestReportTags(onTagUpdate?: () => void) {
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<{ reportId: string; tag: string; isEditing: boolean } | null>(null);

  const handleStartEditTags = useCallback((report: { id: string; tags: string[] }) => {
    setEditingReportId(report.id);
    setEditingTags([...report.tags]);
    setTagInputOpen(false);
    setNewTagInput('');
  }, []);

  const handleAddTag = useCallback(async (reportId: string, tag: string) => {
    if (!tag.trim()) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    if (editingTags.includes(normalizedTag)) {
      toast.error('标签已存在');
      return;
    }

    try {
      await workflowTestReportService.addTag(reportId, normalizedTag);
      setEditingTags(prev => [...prev, normalizedTag]);
      setNewTagInput('');
      setTagInputOpen(false);
      if (onTagUpdate) {
        onTagUpdate();
      }
    } catch (error: any) {
      toast.error(`添加标签失败: ${error.message || '未知错误'}`);
    }
  }, [editingTags, onTagUpdate]);

  const handleDeleteTag = useCallback(async (reportId: string, tag: string) => {
    try {
      await workflowTestReportService.deleteTag(reportId, tag);
      setEditingTags(prev => prev.filter(t => t !== tag));
      if (onTagUpdate) {
        onTagUpdate();
      }
    } catch (error: any) {
      toast.error(`删除标签失败: ${error.message || '未知错误'}`);
    }
  }, [onTagUpdate]);

  const handleSaveTags = useCallback(async (reportId: string) => {
    try {
      let tagsToSave = [...editingTags];
      const trimmedInput = newTagInput.trim();
      if (trimmedInput && !tagsToSave.includes(trimmedInput)) {
        tagsToSave = [...tagsToSave, trimmedInput];
      }
      
      await workflowTestReportService.updateTestReportTags(reportId, tagsToSave);
      setEditingReportId(null);
      setEditingTags([]);
      setNewTagInput('');
      setTagInputOpen(false);
      toast.success('标签已更新');
      if (onTagUpdate) {
        onTagUpdate();
      }
    } catch (error: any) {
      toast.error(`保存标签失败: ${error.message || '未知错误'}`);
    }
  }, [editingReportId, editingTags, newTagInput, onTagUpdate]);

  const handleCancelEditTags = useCallback(() => {
    setEditingReportId(null);
    setEditingTags([]);
    setTagInputOpen(false);
    setNewTagInput('');
  }, []);

  return {
    editingReportId,
    setEditingReportId,
    editingTags,
    setEditingTags,
    newTagInput,
    setNewTagInput,
    tagInputOpen,
    setTagInputOpen,
    deleteTagDialogOpen,
    setDeleteTagDialogOpen,
    tagToDelete,
    setTagToDelete,
    handleStartEditTags,
    handleAddTag,
    handleDeleteTag,
    handleSaveTags,
    handleCancelEditTags,
  };
}
