/**
 * useMessageTemplate Hook
 * 消息模板管理自定义 Hook
 */

import { useState, useCallback } from 'react';
import {
  getMessageDetail,
  getMessageFields,
  updateMessageTemplate,
  resetMessageTemplate,
} from '@/services/message';
import type {
  MessageTemplateDetail,
  TemplateVariable,
  SaveMessageConfigParams,
} from '@/types/message';

export interface UseMessageTemplateResult {
  template: MessageTemplateDetail | null;
  fields: TemplateVariable[];
  loading: boolean;
  saving: boolean;
  editedSubject: string;
  editedTemplate: string;
  cursorPosition: number;
  setEditedSubject: (subject: string) => void;
  setEditedTemplate: (template: string) => void;
  setCursorPosition: (position: number) => void;
  loadTemplate: (params: {
    projectId: string;
    taskType: string;
    event: string;
    robotId: string;
  }) => Promise<void>;
  loadFields: (projectId: string, taskType: string) => Promise<void>;
  insertVariable: (variable: TemplateVariable, targetField: 'subject' | 'template') => void;
  saveTemplate: (params: SaveMessageConfigParams) => Promise<void>;
  resetToDefault: (params: Omit<SaveMessageConfigParams, 'subject' | 'template'>) => Promise<void>;
  hasChanges: () => boolean;
}

export function useMessageTemplate(): UseMessageTemplateResult {
  const [template, setTemplate] = useState<MessageTemplateDetail | null>(null);
  const [fields, setFields] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedTemplate, setEditedTemplate] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // 加载模板详情
  const loadTemplate = useCallback(async (params: {
    projectId: string;
    taskType: string;
    event: string;
    robotId: string;
  }) => {
    try {
      setLoading(true);
      const data = await getMessageDetail(params);
      setTemplate(data);
      setEditedSubject(data.subject || data.defaultSubject);
      setEditedTemplate(data.template || data.defaultTemplate);
    } catch (error) {
      console.error('加载消息模板失败:', error);
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载字段列表
  const loadFields = useCallback(async (projectId: string, taskType: string) => {
    try {
      const data = await getMessageFields(projectId, taskType);
      setFields(data.fieldList || []);
    } catch (error) {
      console.error('加载字段列表失败:', error);
      setFields([]);
    }
  }, []);

  // 插入变量到指定位置
  const insertVariable = useCallback((variable: TemplateVariable, targetField: 'subject' | 'template') => {
    const variablePlaceholder = `\${${variable.id}}`;
    
    if (targetField === 'subject') {
      const before = editedSubject.slice(0, cursorPosition);
      const after = editedSubject.slice(cursorPosition);
      const newSubject = before + variablePlaceholder + after;
      setEditedSubject(newSubject);
      setCursorPosition(cursorPosition + variablePlaceholder.length);
    } else {
      const before = editedTemplate.slice(0, cursorPosition);
      const after = editedTemplate.slice(cursorPosition);
      const newTemplate = before + variablePlaceholder + after;
      setEditedTemplate(newTemplate);
      setCursorPosition(cursorPosition + variablePlaceholder.length);
    }
  }, [editedSubject, editedTemplate, cursorPosition]);

  // 保存模板
  const saveTemplate = useCallback(async (params: SaveMessageConfigParams) => {
    try {
      setSaving(true);
      await updateMessageTemplate(params);
      // Reload template after save
      if (template) {
        await loadTemplate({
          projectId: params.projectId,
          taskType: params.taskType,
          event: params.event,
          robotId: params.robotId,
        });
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [template, loadTemplate]);

  // 重置为默认模板
  const resetToDefault = useCallback(async (
    params: Omit<SaveMessageConfigParams, 'subject' | 'template'>
  ) => {
    try {
      setSaving(true);
      await resetMessageTemplate({
        ...params,
        useDefaultSubject: true,
        useDefaultTemplate: true,
      });
      // Reload template after reset
      await loadTemplate({
        projectId: params.projectId,
        taskType: params.taskType,
        event: params.event,
        robotId: params.robotId,
      });
    } catch (error) {
      console.error('重置模板失败:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [loadTemplate]);

  // 检查是否有未保存的更改
  const hasChanges = useCallback(() => {
    if (!template) return false;
    return (
      editedSubject !== (template.subject || template.defaultSubject) ||
      editedTemplate !== (template.template || template.defaultTemplate)
    );
  }, [template, editedSubject, editedTemplate]);

  return {
    template,
    fields,
    loading,
    saving,
    editedSubject,
    editedTemplate,
    cursorPosition,
    setEditedSubject,
    setEditedTemplate,
    setCursorPosition,
    loadTemplate,
    loadFields,
    insertVariable,
    saveTemplate,
    resetToDefault,
    hasChanges,
  };
}
