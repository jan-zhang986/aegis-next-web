/**
 * TestPage 发送请求：executeSend、handleSend（防抖）、响应状态
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { environmentService, type Environment } from '@/services/environment';
import { trackAction } from '@/utils/analytics';
import type { UseApiEditorResult } from '@/hooks/useApiEditor';
import type { TestPageFormSnapshot } from '../types';
import { DEBOUNCE_DELAY } from '../constants';

declare global {
  interface Window {
    chrome?: {
      runtime: { id?: string; sendMessage: (msg: unknown, cb?: (r: unknown) => void) => void; lastError?: { message: string } };
    };
  }
}

export interface UseTestPageSendOptions {
  formRef: React.MutableRefObject<TestPageFormSnapshot | null>;
  editor: UseApiEditorResult;
  projectId: string;
  definitionId?: string;
}

export function useTestPageSend({ formRef, editor, projectId, definitionId }: UseTestPageSendOptions) {
  const [responseData, setResponseData] = useState<unknown>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [responseCookies, setResponseCookies] = useState<Record<string, string> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [responseSize, setResponseSize] = useState(0);
  const [responseTab, setResponseTab] = useState('response-body');
  const sendDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSend = async () => {
    const f = formRef.current;
    if (!f) {
      toast.error('请先填写请求');
      return;
    }
    const { method, url, noDomain, headers, queryParams, bodyParams, rawBody, jsonBody, bodyType } = f;

    if (!url || typeof fetch === 'undefined') {
      toast.error('请输入接口地址');
      return;
    }
    if (!noDomain && !editor.selectedEnvironment) {
      toast.error('请先选择环境');
      return;
    }

    const executeStartTime = Date.now();
    const currentDefinitionId = editor.state.definitionId || definitionId || '';

    try {
      setIsSending(true);
      setResponseData(null);
      setResponseHeaders(null);
      setResponseCookies(null);
      setResponseTime(0);
      setResponseSize(0);

      let finalUrl = url;

      if (!noDomain) {
        try {
          const envList = await environmentService.getEnvironmentList({ projectId, current: 1, pageSize: 100 });
          const selectedEnv = envList.records.find((env: Environment) => env.id === editor.selectedEnvironment);
          if (selectedEnv?.domain) {
            const domain = selectedEnv.domain.trim().replace(/\/$/, '');
            const path = url.trim().startsWith('/') ? url.trim() : `/${url.trim()}`;
            finalUrl = `${domain}${path}`;
          } else {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              toast.error('未找到环境配置，请确保已选择环境或输入完整的 URL');
              return;
            }
          }
        } catch (err: unknown) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            toast.error('获取环境信息失败，请确保已选择环境或输入完整的 URL');
            return;
          }
        }
      } else {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          toast.error('请输入完整的 URL（包含 http:// 或 https://）');
          return;
        }
      }

      const skipHeaders = ['host', 'connection', 'content-length', 'accept-encoding'];
      const enabledHeaders: Record<string, string> = headers
        .filter((h) => h.enabled && h.key.trim() && !skipHeaders.includes(h.key.trim().toLowerCase()))
        .reduce((acc: Record<string, string>, h) => {
          acc[h.key.trim()] = h.value;
          return acc;
        }, {});

      const enabledParams = queryParams.filter((p) => p.enabled && p.key.trim());
      if (enabledParams.length > 0) {
        try {
          const urlObj = new URL(finalUrl);
          urlObj.search = '';
          enabledParams.forEach((p) => urlObj.searchParams.set(p.key.trim(), p.value));
          finalUrl = urlObj.toString();
        } catch {
          const queryParts = enabledParams.map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`);
          finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${queryParts.join('&')}`;
        }
      }

      let requestBody: string | undefined;
      const contentTypeHeader = enabledHeaders['Content-Type'] || enabledHeaders['content-type'];

      if (method !== 'GET' && method !== 'HEAD' && bodyType !== 'none') {
        if (bodyType === 'raw' && rawBody.trim()) {
          if (contentTypeHeader?.includes('application/json')) {
            try {
              requestBody = JSON.stringify(JSON.parse(rawBody.trim()));
            } catch {
              requestBody = rawBody.trim();
            }
          } else requestBody = rawBody.trim();
        } else if (bodyType === 'json' && jsonBody.trim()) {
          try {
            requestBody = JSON.stringify(JSON.parse(jsonBody.trim()));
            if (!contentTypeHeader) enabledHeaders['Content-Type'] = 'application/json';
          } catch {
            requestBody = jsonBody.trim();
          }
        } else if (bodyType === 'form-data') {
          const enabledFields = bodyParams.filter((x) => x.enabled && x.key.trim());
          if (enabledFields.length > 0) {
            requestBody = JSON.stringify({ type: 'form-data', fields: enabledFields.map((x) => ({ key: x.key.trim(), value: x.value })) });
            delete enabledHeaders['Content-Type'];
            delete enabledHeaders['content-type'];
          }
        } else if (bodyType === 'x-www-form-urlencoded') {
          const enabledFields = bodyParams.filter((x) => x.enabled && x.key.trim());
          if (enabledFields.length > 0) {
            const params = new URLSearchParams();
            enabledFields.forEach((x) => params.append(x.key.trim(), x.value));
            requestBody = params.toString();
            if (!enabledHeaders['Content-Type'] && !enabledHeaders['content-type']) enabledHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        }
      }

      const startTime = Date.now();
      let res: unknown = null;

      if (typeof window !== 'undefined' && window.chrome?.runtime?.id) {
        try {
          res = await new Promise((resolve, reject) => {
            window.chrome!.runtime.sendMessage(
              { type: 'SEND_HTTP_REQUEST', payload: { url: finalUrl, method, headers: enabledHeaders, body: requestBody } },
              (response: unknown) => {
                if (window.chrome?.runtime?.lastError) {
                  reject(new Error(window.chrome.runtime.lastError!.message));
                  return;
                }
                if (!response) {
                  reject(new Error('未收到响应'));
                  return;
                }
                const r = response as { ok?: boolean; error?: string; message?: string };
                if (r.ok === true) resolve(response);
                else reject(new Error(r?.error || r?.message || '请求失败'));
              }
            );
          });
        } catch {
          // 回退到 fetch
        }
      }

      if (!res) {
        const fetchOptions: RequestInit = { method, headers: enabledHeaders };
        if (requestBody && method !== 'GET' && method !== 'HEAD') {
          if (bodyType === 'form-data' && requestBody) {
            const formData = new FormData();
            const bodyData = JSON.parse(requestBody) as { type?: string; fields?: { key: string; value: string }[] };
            if (bodyData.type === 'form-data' && bodyData.fields) {
              bodyData.fields.forEach((x) => formData.append(x.key, x.value));
            }
            fetchOptions.body = formData;
            delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
            delete (fetchOptions.headers as Record<string, string>)['content-type'];
          } else fetchOptions.body = requestBody;
        }

        const response = await fetch(finalUrl, fetchOptions);
        const contentType = response.headers.get('content-type') || '';
        let bodyText: string;
        let isJson = false;
        if (contentType.includes('application/json')) {
          try {
            bodyText = JSON.stringify(await response.json(), null, 2);
            isJson = true;
          } catch {
            bodyText = await response.text();
          }
        } else bodyText = await response.text();

        const responseHeadersArray: { key: string; value: string }[] = [];
        response.headers.forEach((v, k) => responseHeadersArray.push({ key: k, value: v }));
        setResponseHeaders(Object.fromEntries(response.headers.entries()));

        const cookieHeader = response.headers.get('set-cookie');
        const cookiesObj: Record<string, string> = {};
        if (cookieHeader) {
          cookieHeader.split(',').forEach((c) => {
            const [kv] = c.trim().split(';');
            const [k, v] = kv.split('=');
            if (k && v) cookiesObj[k.trim()] = v.trim();
          });
        }
        setResponseCookies(Object.keys(cookiesObj).length > 0 ? cookiesObj : null);

        const timeMs = Date.now() - startTime;
        const size = new Blob([bodyText]).size;
        setResponseTime(timeMs);
        setResponseSize(size);
        res = { status: response.status, statusText: response.statusText, timeMs, size, bodyText, isJson, headers: responseHeadersArray };
      } else {
        const r = res as { body?: string | object; headers?: Record<string, string> };
        let bodyText = '';
        let isJson = false;
        if (r.body) {
          if (typeof r.body === 'string') {
            bodyText = r.body;
            try {
              JSON.parse(bodyText);
              isJson = true;
              bodyText = JSON.stringify(JSON.parse(bodyText), null, 2);
            } catch {
              /* noop */
            }
          } else {
            bodyText = JSON.stringify(r.body, null, 2);
            isJson = true;
          }
        }
        const headersArray: { key: string; value: string }[] = [];
        if (r.headers) Object.entries(r.headers).forEach(([k, v]) => headersArray.push({ key: k, value: String(v) }));
        setResponseHeaders(r.headers || {});
        const size = new Blob([bodyText]).size;
        setResponseSize(size);
        setResponseTime(Date.now() - startTime);
        res = { ...r, timeMs: Date.now() - startTime, size, bodyText, isJson, headers: headersArray };
      }

      setResponseData(res);
      setResponseTab('response-body');

      const duration = Date.now() - executeStartTime;
      const userEmail = localStorage.getItem('currentemail') || '';
      const data = res as { status?: number };
      trackAction('HTTP', {
        protocol: 'HTTP',
        definitionId: currentDefinitionId,
        name: editor.state.name || '',
        moduleId: editor.state.moduleId || '',
        projectId: projectId || '',
        method,
        url: finalUrl,
        duration,
        status: data?.status || 0,
        success: (data?.status || 0) >= 200 && (data?.status || 0) < 300,
        email: userEmail || undefined,
      });
      toast.success('请求已发送');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '请求失败，未知错误';
      const duration = Date.now() - executeStartTime;
      const userEmail = localStorage.getItem('currentemail') || '';
      trackAction('HTTP', {
        protocol: 'HTTP',
        definitionId: currentDefinitionId,
        name: editor.state.name || '',
        moduleId: editor.state.moduleId || '',
        projectId: projectId || '',
        method: f.method,
        url: f.url,
        duration,
        status: 0,
        success: false,
        error: msg,
        email: userEmail || undefined,
      });
      setResponseData({ status: 0, statusText: '请求失败', timeMs: 0, size: 0, bodyText: msg, isJson: false, headers: [] });
      setResponseTab('response-body');
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async (): Promise<void> => {
    if (isSending) return;
    if (sendDebounceTimerRef.current) clearTimeout(sendDebounceTimerRef.current);
    await new Promise<void>((resolve) => {
      sendDebounceTimerRef.current = setTimeout(async () => {
        await executeSend();
        resolve();
      }, DEBOUNCE_DELAY);
    });
  };

  useEffect(() => {
    return () => {
      if (sendDebounceTimerRef.current) clearTimeout(sendDebounceTimerRef.current);
    };
  }, []);

  return {
    isSending,
    responseData,
    responseHeaders,
    responseCookies,
    responseTime,
    responseSize,
    responseTab,
    setResponseTab,
    executeSend,
    handleSend,
  };
}
