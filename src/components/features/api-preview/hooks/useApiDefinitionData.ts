import { useMemo } from 'react';
import type { MetadataDefinition } from '@/services/metadata';
import { generateInputExample } from '../utils/requestUtils';

export interface ApiDefinitionData {
  requestConfig: Record<string, unknown> | null;
  responseConfig: Record<string, unknown> | null;
  protocol: string;
  httpMethod: string;
  url: string;
  headerParams: Array<{ name: string; type: string; required: boolean; example: string }>;
  queryParams: Array<{ name: string; type: string; required: boolean; example: string }>;
  bodyParams: Array<{ name: string; type: string; required: boolean; example: unknown }>;
  inputExample: string;
}

export function useApiDefinitionData(definition: MetadataDefinition): ApiDefinitionData {
  const protocol = definition.protocol || 'HTTP';

  const requestConfig = useMemo(() => {
    const rc = definition.requestConfig;
    if (!rc) return null;
    try {
      return typeof rc === 'string' ? JSON.parse(rc) : rc;
    } catch {
      return null;
    }
  }, [definition.requestConfig]);

  const responseConfig = useMemo(() => {
    const rc = definition.responseConfig;
    if (!rc) return null;
    try {
      return typeof rc === 'string' ? JSON.parse(rc) : rc;
    } catch {
      return null;
    }
  }, [definition.responseConfig]);

  const httpMethod = useMemo(() => {
    if (protocol !== 'HTTP' || !requestConfig) return 'GET';
    return (requestConfig.method as string) || 'GET';
  }, [protocol, requestConfig]);

  const url = useMemo(() => {
    if (protocol === 'HTTP' && requestConfig) {
      return (requestConfig.url || requestConfig.path || '/') as string;
    }
    if (protocol === 'SQL') {
      return (requestConfig?.sql || definition.scriptContent || '/') as string;
    }
    if (protocol === 'DUBBO' && requestConfig) {
      return (requestConfig.interfaceName || '/') as string;
    }
    if (protocol === 'ROCKETMQ' && requestConfig) {
      return (requestConfig.topic || '/') as string;
    }
    if (protocol === 'FILE') {
      return (definition.scriptContent || '未上传文件') as string;
    }
    return '/';
  }, [protocol, requestConfig, definition.scriptContent]);

  const headerParams = useMemo(() => {
    if (protocol !== 'HTTP' || !requestConfig?.headers) return [];
    const h = requestConfig.headers as Record<string, unknown>;
    if (typeof h === 'object' && !Array.isArray(h)) {
      return Object.entries(h).map(([k, v]) => ({
        name: k,
        type: 'string',
        required: true,
        example: String(v),
      }));
    }
    return [];
  }, [protocol, requestConfig]);

  const queryParams = useMemo(() => {
    if (protocol !== 'HTTP' || !requestConfig?.query) return [];
    const q = requestConfig.query as Record<string, unknown>;
    if (typeof q === 'object' && !Array.isArray(q)) {
      return Object.entries(q).map(([k, v]) => ({
        name: k,
        type: 'string',
        required: true,
        example: String(v),
      }));
    }
    return [];
  }, [protocol, requestConfig]);

  const bodyParams = useMemo(() => {
    if (protocol !== 'HTTP' || !requestConfig?.body) return [];
    let body = requestConfig.body;
    if (typeof body === 'string' && body.trim()) {
      try {
        body = JSON.parse(body);
      } catch {
        return [];
      }
    }
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      return Object.entries(body).map(([k, v]) => {
        let type = 'string';
        if (Array.isArray(v)) type = 'array';
        else if (typeof v === 'number') type = 'number';
        else if (typeof v === 'boolean') type = 'boolean';
        else if (typeof v === 'object' && v !== null) type = 'object';
        return { name: k, type, required: true, example: v };
      });
    }
    return [];
  }, [protocol, requestConfig]);

  const inputExample = useMemo(
    () => generateInputExample(requestConfig, protocol, definition),
    [requestConfig, protocol, definition]
  );

  return {
    requestConfig,
    responseConfig,
    protocol,
    httpMethod,
    url,
    headerParams,
    queryParams,
    bodyParams,
    inputExample,
  };
}
