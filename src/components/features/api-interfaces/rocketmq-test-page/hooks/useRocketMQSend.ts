/**
 * RocketMQTestPage 发送：executeSendMessage、handleSendMessage（防抖）、sending、sendResult、hasResult、responseTab
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { environmentService, type Environment } from '@/services/environment';
import { trackAction } from '@/utils/analytics';
import type { UseApiEditorResult } from '@/hooks/useApiEditor';
import type { RocketMQSendResult } from '../types';
import { DEBOUNCE_DELAY } from '../constants';

declare global {
  interface Window {
    chrome?: {
      runtime: { id?: string; sendMessage: (m: unknown, cb?: (r: unknown) => void) => void; lastError?: { message: string } };
    };
  }
}

function normalizeResponseMessage(msg: unknown): string | null {
  if (!msg) return null;
  if (typeof msg === 'string') return msg.trim() || null;
  if (typeof msg === 'number' || typeof msg === 'boolean') return String(msg);
  try {
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
}

function buildSendResultFromResponse(data: unknown): RocketMQSendResult {
  const msg = normalizeResponseMessage((data as { msg?: unknown })?.msg) || normalizeResponseMessage((data as { message?: unknown })?.message) || normalizeResponseMessage((data as { error?: unknown })?.error);
  const msgId = (typeof (data as { MsgId?: string })?.MsgId === 'string' && (data as { MsgId: string }).MsgId) || (typeof (data as { msgId?: string })?.msgId === 'string' && (data as { msgId: string }).msgId) || (typeof (data as { data?: string })?.data === 'string' && (data as { data: string }).data) || (typeof (data as { traceId?: string })?.traceId === 'string' && (data as { traceId: string }).traceId) || undefined;
  const successById = Boolean(msgId);
  const successByCode = (data as { code?: number })?.code === 200 && Boolean(msg) && msg !== null && /成功|success/i.test(msg);
  if (successById || successByCode) {
    return { success: true, msgId: msgId ? String(msgId) : undefined, info: msg || undefined, data };
  }
  return { success: false, error: msg || ((data as { code?: number })?.code ? `发送失败，code=${(data as { code: number }).code}` : '') || '发送失败', data };
}

export interface UseRocketMQSendOptions {
  getForm: () => { topic: string; tag: string; key: string; bodyJson: string; branchTag: string };
  editor: UseApiEditorResult;
  projectId: string;
  definitionId?: string;
  selectedSite: string;
}

export function useRocketMQSend({ getForm, editor, projectId, definitionId, selectedSite }: UseRocketMQSendOptions) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<RocketMQSendResult | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const [responseTab, setResponseTab] = useState('result');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSendMessage = async () => {
    const f = getForm();
    if (!f.topic || !f.bodyJson || f.bodyJson.trim() === '{}') {
      toast.error('请输入 Topic 和消息内容');
      return;
    }
    if (!editor.selectedEnvironment) {
      toast.error('请先选择环境');
      return;
    }

    const start = Date.now();
    const defId = editor.state.definitionId || definitionId || '';
    let finalTopic = f.topic;
    if (f.branchTag?.trim()) finalTopic = `${f.topic}:${f.branchTag.trim()}`;

    try {
      setSending(true);
      setSendResult(null);
      setHasResult(false);

      const envList = await environmentService.getEnvironmentList({ projectId, current: 1, pageSize: 100 });
      const env = envList.records.find((e: Environment) => e.id === editor.selectedEnvironment);
      const mqUrl = env?.mqInfo?.mq_url?.trim().replace(/\/$/, '');
      if (!mqUrl) {
        toast.error('未找到环境配置的 MQ URL');
        return;
      }

      const apiUrl = `${mqUrl}/spotter-utility-web/mock/sendMQMessage`;
      const messageBodyString = typeof f.bodyJson === 'string' ? f.bodyJson : JSON.stringify(f.bodyJson);
      const payload: Record<string, unknown> = {
        token: 'tM3yI4rA',
        topic: finalTopic,
        messageBody: messageBodyString,
        tag: (f.tag?.trim()) || '*',
      };
      if (f.key?.trim()) payload.key = f.key.trim();

      const headers: Record<string, string> = {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Pragma: 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'x-site-tenant': selectedSite || 'default',
      };

      let data: unknown;
      if (typeof window !== 'undefined' && window.chrome?.runtime?.id) {
        try {
          const res = await Promise.race([
            new Promise<{ ok?: boolean; body?: string; error?: string }>((resolve, reject) => {
              window.chrome!.runtime.sendMessage(
                { type: 'SEND_HTTP_REQUEST', payload: { url: apiUrl, method: 'POST', headers, body: JSON.stringify(payload) } },
                (r: unknown) => {
                  if (window.chrome?.runtime?.lastError) {
                    reject(new Error(window.chrome.runtime.lastError!.message));
                    return;
                  }
                  if (!r) { reject(new Error('未收到响应')); return; }
                  const x = r as { ok?: boolean; body?: string; error?: string };
                  if (x.ok === true) resolve(x);
                  else reject(new Error(x?.error || '请求失败'));
                }
              );
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('请求超时，服务器未响应（30秒）')), 30000)),
          ]);
          data = JSON.parse(res.body || '{}');
        } catch {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          const r = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(payload), mode: 'cors', signal: controller.signal });
          clearTimeout(timeoutId);
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          data = await r.json();
        }
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const r = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(payload), mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        data = await r.json();
      }

      const result = buildSendResultFromResponse(data);
      setSendResult(result);
      setHasResult(true);

      trackAction('ROCKETMQ', {
        protocol: 'ROCKETMQ',
        definitionId: defId,
        name: editor.state.name || '',
        moduleId: editor.state.moduleId || '',
        projectId: projectId || '',
        topic: finalTopic,
        tag: f.tag || '*',
        duration: Date.now() - start,
        success: result.success,
        msgId: result.msgId,
        email: localStorage.getItem('currentemail') || undefined,
      });
      toast.success('消息发送成功');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
      trackAction('ROCKETMQ', {
        protocol: 'ROCKETMQ',
        definitionId: editor.state.definitionId || definitionId || '',
        name: editor.state.name || '',
        moduleId: editor.state.moduleId || '',
        projectId: projectId || '',
        topic: finalTopic,
        tag: f.tag || '*',
        duration: Date.now() - start,
        success: false,
        error: msg,
        email: localStorage.getItem('currentemail') || undefined,
      });
      setSendResult({ success: false, error: msg });
      setHasResult(true);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = () => {
    if (sending) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(executeSendMessage, DEBOUNCE_DELAY);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { sending, sendResult, hasResult, responseTab, setResponseTab, handleSendMessage };
}
