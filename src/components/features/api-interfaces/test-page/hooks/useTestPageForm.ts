/**
 * TestPage 请求表单状态：method/url/headers/params/body、buildRequestConfig、从 definition 回显
 */

import { useState, useEffect } from 'react';
import type { MetadataDefinition } from '@/services/metadata';
import type { UseApiEditorResult } from '@/hooks/useApiEditor';
import type { HeaderParam, QueryParam, BodyParam, TestPageFormSnapshot } from '../types';

export interface UseTestPageFormOptions {
  editor: UseApiEditorResult;
  definitionId?: string;
  definitions: MetadataDefinition[];
  loadedDefinitionIdRef: React.MutableRefObject<string | null>;
}

const generateId = () => `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useTestPageForm({
  editor,
  definitionId,
  definitions,
  loadedDefinitionIdRef,
}: UseTestPageFormOptions) {
  const [method, setMethod] = useState('POST');
  const [noDomain, setNoDomain] = useState(false);
  const [url, setUrl] = useState('');
  const [bodyType, setBodyType] = useState('json');
  const [activeTab, setActiveTab] = useState('body');
  const [headers, setHeaders] = useState<HeaderParam[]>([]);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [bodyParams, setBodyParams] = useState<BodyParam[]>([]);
  const [rawBody, setRawBody] = useState('');
  const [jsonBody, setJsonBody] = useState('{}');

  const buildRequestConfig = () => {
    const headersObj: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.key).forEach((h) => { headersObj[h.key] = h.value; });

    const requestConfig: Record<string, unknown> = { method, headers: headersObj };
    if (url) requestConfig.path = url;

    if (bodyType === 'json' && jsonBody) {
      try {
        requestConfig.body = JSON.parse(jsonBody);
      } catch {
        requestConfig.body = jsonBody;
      }
      requestConfig.bodyType = 'json';
    } else if (bodyType === 'raw' && rawBody) {
      requestConfig.raw = rawBody;
    } else if ((bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && bodyParams.length > 0) {
      const bodyObj: Record<string, string> = {};
      bodyParams.filter((p) => p.enabled && p.key).forEach((p) => { bodyObj[p.key] = p.value; });
      requestConfig.body = bodyObj;
      requestConfig.bodyType = bodyType;
    }

    if (queryParams.length > 0) {
      const queryObj: Record<string, string> = {};
      queryParams.filter((p) => p.enabled && p.key).forEach((p) => { queryObj[p.key] = p.value; });
      requestConfig.query = queryObj;
    }

    return requestConfig;
  };

  // 从 definition 回显
  useEffect(() => {
    if (definitionId && loadedDefinitionIdRef.current !== definitionId) {
      loadedDefinitionIdRef.current = null;
    }
    if (loadedDefinitionIdRef.current === definitionId) return;
    if (!definitionId && editor.state.definitionId && editor.state.definitionId !== definitionId) return;

    if (definitionId && definitions.length > 0) {
      const definition = definitions.find((def) => def.id === definitionId);
      if (definition) {
        loadedDefinitionIdRef.current = definitionId;
        editor.loadFromDefinition(definition);

        if (definition.requestConfig) {
          try {
            setMethod('POST');
            setUrl('');
            setHeaders([]);
            setQueryParams([]);
            setBodyParams([]);
            setRawBody('');
            setJsonBody('{}');
            setBodyType('json');

            const config =
              typeof definition.requestConfig === 'string'
                ? JSON.parse(definition.requestConfig)
                : definition.requestConfig;

            if (config.method) setMethod(config.method.toUpperCase());
            if (config.path) setUrl(config.path);
            else if (config.url) setUrl(config.url);

            if (config.headers && typeof config.headers === 'object' && Object.keys(config.headers).length > 0) {
              setHeaders(
                Object.entries(config.headers).map(([k, v]) => ({
                  id: generateId(),
                  key: k,
                  value: String(v),
                  enabled: true,
                }))
              );
            } else setHeaders([]);

            if (config.query && typeof config.query === 'object' && Object.keys(config.query).length > 0) {
              setQueryParams(
                Object.entries(config.query).map(([k, v]) => ({
                  id: generateId(),
                  key: k,
                  value: String(v),
                  enabled: true,
                }))
              );
            } else setQueryParams([]);

            if (config.raw !== undefined && config.raw !== null) {
              setBodyType('raw');
              setRawBody(String(config.raw));
              setJsonBody('{}');
              setBodyParams([]);
            } else if (config.body !== undefined && config.body !== null) {
              setBodyType('json');
              setJsonBody(
                typeof config.body === 'object' ? JSON.stringify(config.body, null, 2) : String(config.body)
              );
              setRawBody('');
              setBodyParams([]);
            } else {
              setBodyType('json');
              setJsonBody('{}');
              setRawBody('');
              setBodyParams([]);
            }
          } catch (e) {
            console.error('解析接口配置失败:', e);
          }
        }
      } else if (editor.state.definitionId && editor.state.definitionId === definitionId) {
        loadedDefinitionIdRef.current = definitionId;
      }
    } else if (!definitionId) {
      loadedDefinitionIdRef.current = null;
    }
  }, [definitionId, definitions, editor, loadedDefinitionIdRef]);

  const formSnapshot: TestPageFormSnapshot = {
    method,
    url,
    noDomain,
    headers,
    queryParams,
    bodyParams,
    rawBody,
    jsonBody,
    bodyType,
  };

  return {
    method,
    setMethod,
    noDomain,
    setNoDomain,
    url,
    setUrl,
    bodyType,
    setBodyType,
    activeTab,
    setActiveTab,
    headers,
    setHeaders,
    queryParams,
    setQueryParams,
    bodyParams,
    setBodyParams,
    rawBody,
    setRawBody,
    jsonBody,
    setJsonBody,
    buildRequestConfig,
    generateId,
    formSnapshot,
  };
}
