/**
 * RocketMQTestPage 表单：topic/tag/key/bodyJson/branchTag、从 definition 回显、buildRequestConfig、格式化 JSON
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { MetadataDefinition } from '@/services/metadata';
import type { UseApiEditorResult } from '@/hooks/useApiEditor';
import type { RocketMQRequestConfig } from '../types';

export interface UseRocketMQFormOptions {
  editor: UseApiEditorResult;
  definitionId?: string;
  definitions: MetadataDefinition[];
  loadedDefinitionIdRef: React.MutableRefObject<string | null>;
  setSelectedSite?: (s: string) => void;
}

export function useRocketMQForm({ editor, definitionId, definitions, loadedDefinitionIdRef, setSelectedSite }: UseRocketMQFormOptions) {
  const [topic, setTopic] = useState('');
  const [tag, setTag] = useState('');
  const [key, setKey] = useState('');
  const [bodyJson, setBodyJson] = useState('{}');
  const [branchTag, setBranchTag] = useState('');
  const previousDefinitionIdRef = useRef<string | undefined>(definitionId);

  const buildRequestConfig = (selectedSite: string): RocketMQRequestConfig => {
    let body: unknown = {};
    if (bodyJson?.trim()) {
      try {
        body = JSON.parse(bodyJson);
      } catch {
        body = {};
      }
    }
    const config: RocketMQRequestConfig = {
      topic: topic.trim(),
      tag: tag.trim(),
      key: key.trim(),
      body,
    };
    if (selectedSite?.trim()) config.siteTenant = selectedSite.trim();
    if (branchTag?.trim()) config.envTag = branchTag.trim();
    return config;
  };

  const handleFormatJson = () => {
    if (!bodyJson?.trim()) {
      toast.error('消息内容为空，无法格式化');
      return;
    }
    try {
      setBodyJson(JSON.stringify(JSON.parse(bodyJson), null, 2));
      toast.success('格式化成功');
    } catch {
      toast.error('JSON 格式错误，无法格式化');
    }
  };

  useEffect(() => {
    // 检查是否从编辑页面切换到新建页面
    const wasEditing = previousDefinitionIdRef.current !== undefined && previousDefinitionIdRef.current !== null;
    const isNowNew = definitionId === undefined || definitionId === null;
    const isSwitchingFromEditToNew = wasEditing && isNowNew;
    
    // 更新 previousDefinitionIdRef（在判断之后更新）
    const prevId = previousDefinitionIdRef.current;
    previousDefinitionIdRef.current = definitionId;
    
    if (definitionId && loadedDefinitionIdRef.current !== definitionId) loadedDefinitionIdRef.current = null;
    if (loadedDefinitionIdRef.current === definitionId && prevId === definitionId) return;
    if (!definitionId && editor.state.definitionId && editor.state.definitionId !== definitionId && !isSwitchingFromEditToNew) return;

    if (definitionId && definitions.length > 0) {
      const def = definitions.find((d) => d.id === definitionId);
      if (def) {
        loadedDefinitionIdRef.current = definitionId;
        editor.loadFromDefinition(def);
        if (def.requestConfig) {
          try {
            const config = typeof def.requestConfig === 'string' ? JSON.parse(def.requestConfig) : def.requestConfig;
            setTopic(config.topic || '');
            setTag(config.tag || '');
            setKey(config.key || '');
            if (config.siteTenant && setSelectedSite) setSelectedSite(config.siteTenant);
            setBranchTag(config.envTag || '');
            setBodyJson(config.body ? (typeof config.body === 'string' ? config.body : JSON.stringify(config.body, null, 2)) : '{}');
          } catch (e) {
            console.error('解析 RocketMQ requestConfig 失败:', e);
          }
        }
      } else if (editor.state.definitionId === definitionId) {
        loadedDefinitionIdRef.current = definitionId;
      }
    } else if (!definitionId) {
      // 只在从编辑页面切换到新建页面时清空字段，避免在用户输入时清空
      if (isSwitchingFromEditToNew) {
        loadedDefinitionIdRef.current = null;
        editor.setName('');
        setTopic('');
        setTag('');
        setKey('');
        setBranchTag('');
        setBodyJson('{}');
      }
    }
  }, [definitionId, definitions, editor, loadedDefinitionIdRef, setSelectedSite]);

  return {
    topic,
    setTopic,
    tag,
    setTag,
    key,
    setKey,
    bodyJson,
    setBodyJson,
    branchTag,
    setBranchTag,
    buildRequestConfig,
    handleFormatJson,
  };
}
