/**
 * DubboTestPage 表单：应用/接口/方法/参数、从 definition 回显、buildRequestConfig、参数 tab 切换
 */

import { useState, useEffect, useRef } from 'react';
import type { MetadataDefinition } from '@/services/metadata';
import type { UseApiEditorResult } from '@/hooks/useApiEditor';
import type { DubboParam, DubboRequestConfig } from '../types';
import { COMMON_PARAM_TYPES, cleanParamName } from '../constants';

export interface UseDubboFormOptions {
  editor: UseApiEditorResult;
  definitionId?: string;
  definitions: MetadataDefinition[];
  loadedDefinitionIdRef: React.MutableRefObject<string | null>;
  setSelectedSite?: (s: string) => void;
}

function parseParamValue(val: string, paramType: string): unknown {
  const v = (val || '').trim();
  if (!v) {
    if (paramType.includes('Integer') || paramType.includes('Long')) return 0;
    if (paramType.includes('Boolean')) return false;
    if (paramType.includes('Double') || paramType.includes('Float')) return 0.0;
    if (paramType.includes('List')) return [];
    if (paramType.includes('Map') || paramType.includes('Set')) return {};
    return '';
  }
  try {
    return JSON.parse(v);
  } catch {
    if (paramType.includes('Integer') || paramType.includes('Long')) return parseInt(v) || 0;
    if (paramType.includes('Boolean')) return v.toLowerCase() === 'true';
    if (paramType.includes('Double') || paramType.includes('Float')) return parseFloat(v) || 0.0;
    return v;
  }
}

export function useDubboForm({ editor, definitionId, definitions, loadedDefinitionIdRef, setSelectedSite }: UseDubboFormOptions) {
  const [paramTypeTab, setParamTypeTab] = useState<'none' | 'basic' | 'custom'>('none');
  const [applicationName, setApplicationName] = useState('');
  const [interfaceName, setInterfaceName] = useState('');
  const [methodName, setMethodName] = useState('');
  const [dubboTag, setDubboTag] = useState('');
  const [parameters, setParameters] = useState<DubboParam[]>([]);
  const previousDefinitionIdRef = useRef<string | undefined>(definitionId);

  const buildRequestConfig = (selectedSite: string): DubboRequestConfig => {
    const paramTypes: string[] = [];
    const params: unknown[] = [];
    parameters
      .filter((p) => p.enabled !== false)
      .forEach((p) => {
        const t = p.type === 'custom' && p.schema ? p.schema : p.type || 'java.lang.Object';
        paramTypes.push(t);
        params.push(parseParamValue(p.value, t));
      });
    return {
      interfaceName: interfaceName.trim(),
      methodName: methodName.trim(),
      parameterTypes: paramTypes.length ? paramTypes : undefined,
      params: params.length ? params : undefined,
      siteTenant: selectedSite.trim() || undefined,
      applicationName: applicationName.trim(),
      dubboTag: dubboTag.trim() || null,
    };
  };

  const addParameter = (item: DubboParam) => setParameters((prev) => [...prev, item]);
  const updateParameter = (index: number, field: 'name' | 'type' | 'value' | 'schema' | 'enabled', value: string | boolean) => {
    setParameters((prev) => {
      const u = [...prev];
      if (index >= 0 && index < u.length) (u[index] as unknown as Record<string, unknown>)[field] = value;
      return u;
    });
  };
  const removeParameter = (index: number) => setParameters((prev) => prev.filter((_, i) => i !== index));

  const convertParamToCustom = (index: number) => {
    setParameters((prev) => {
      const u = prev.map((p, i) => (i === index ? { ...p, type: 'custom' as const, schema: '' } : p));
      const basic = u.filter((p) => p.type !== 'custom').map((p) => ({ ...p, enabled: false }));
      const custom = u.filter((p) => p.type === 'custom').map((p) => ({ ...p, enabled: true }));
      return [...basic, ...custom];
    });
    setParamTypeTab('custom');
  };

  const handleParamTypeTabChange = (value: 'none' | 'basic' | 'custom') => {
    setParamTypeTab(value);
    if (value === 'none') {
      setParameters((prev) => prev.map((p) => ({ ...p, enabled: false })));
    } else if (value === 'basic') {
      setParameters((prev) => {
        const basic = prev.filter((p) => p.type !== 'custom');
        const custom = prev.filter((p) => p.type === 'custom').map((p) => ({ ...p, enabled: false }));
        if (basic.length === 0) return [...custom, { name: '', type: 'java.lang.String', schema: undefined, value: '', enabled: true }];
        return [...basic.map((p) => ({ ...p, enabled: true })), ...custom];
      });
    } else {
      setParameters((prev) => {
        const basic = prev.filter((p) => p.type !== 'custom').map((p) => ({ ...p, enabled: false }));
        const custom = prev.filter((p) => p.type === 'custom');
        if (custom.length === 0) return [...basic, { name: '', type: 'custom', schema: '', value: '', enabled: true }];
        return [...basic, ...custom.map((p) => ({ ...p, enabled: true }))];
      });
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
            setApplicationName(config.applicationName || '');
            setInterfaceName(config.interfaceName || '');
            setMethodName(config.methodName || '');
            setDubboTag(config.dubboTag || config.dubbo_tag || '');
            if (config.siteTenant && setSelectedSite) setSelectedSite(config.siteTenant);
            let params: DubboParam[] = [];
            if (config.body && typeof config.body === 'object' && !Array.isArray(config.body)) {
              params = Object.entries(config.body).map(([k, v]: [string, unknown]) => {
                const o = v && typeof v === 'object' && v !== null && 'type' in v ? (v as { type?: string; schema?: string; enabled?: boolean }) : null;
                const t = o ? (o.type || 'java.lang.Object') : (typeof v === 'string' ? v : 'java.lang.Object');
                const isCustom = !COMMON_PARAM_TYPES.includes(t);
                return {
                  name: cleanParamName(k),
                  type: isCustom ? 'custom' : t,
                  schema: isCustom ? (o?.schema ?? t) : undefined,
                  value: '',
                  enabled: o?.enabled !== undefined ? o.enabled : true,
                };
              });
            } else if (config.parameterTypes && config.params) {
              params = (config.parameterTypes as string[]).map((type, i) => {
                const p = (config.params as unknown[])[i];
                const t = type || 'java.lang.String';
                const isCustom = !COMMON_PARAM_TYPES.includes(t);
                return {
                  name: '',
                  type: isCustom ? 'custom' : t,
                  schema: isCustom ? t : undefined,
                  value: typeof p === 'string' ? p : JSON.stringify(p, null, 2),
                  enabled: true,
                };
              });
            }
            setParameters(params);
            if (params.length === 0) setParamTypeTab('none');
            else if (params.some((p) => p.type === 'custom')) setParamTypeTab('custom');
            else setParamTypeTab('basic');
          } catch (e) {
            console.error('解析 Dubbo requestConfig 失败:', e);
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
        setApplicationName('');
        setInterfaceName('');
        setMethodName('');
        setDubboTag('');
        setParameters([]);
        setParamTypeTab('none');
      }
    }
  }, [definitionId, definitions, editor, loadedDefinitionIdRef]);

  return {
    paramTypeTab,
    setParamTypeTab,
    handleParamTypeTabChange,
    applicationName,
    setApplicationName,
    interfaceName,
    setInterfaceName,
    methodName,
    setMethodName,
    dubboTag,
    setDubboTag,
    parameters,
    setParameters,
    buildRequestConfig,
    addParameter,
    updateParameter,
    removeParameter,
    convertParamToCustom,
  };
}
