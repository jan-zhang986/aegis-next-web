/**
 * DubboTestPage 发送：executeSend、handleSend（防抖）、sending、responseData、hasResponse、responseTab
 */

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { http } from '@/utils/request';
import { environmentService, type Environment } from '@/services/environment';
import { trackAction } from '@/utils/analytics';
import type { UseApiEditorResult } from '@/hooks/useApiEditor';
import type { DubboRequestConfig } from '../types';
import { DEBOUNCE_DELAY } from '../constants';

export interface UseDubboSendOptions {
  getForm: () => { applicationName: string; interfaceName: string; methodName: string };
  buildRequestConfig: (selectedSite: string) => DubboRequestConfig;
  editor: UseApiEditorResult;
  projectId: string;
  definitionId?: string;
  selectedSite: string;
}

export function useDubboSend({ getForm, buildRequestConfig, editor, projectId, definitionId, selectedSite }: UseDubboSendOptions) {
  const [sending, setSending] = useState(false);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [hasResponse, setHasResponse] = useState(false);
  const [responseTab, setResponseTab] = useState('result');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSend = async () => {
    const f = getForm();
    if (!f.applicationName.trim()) { toast.error('请输入应用名称'); return; }
    if (!f.interfaceName.trim()) { toast.error('请输入服务接口'); return; }
    if (!f.methodName.trim()) { toast.error('请输入方法名'); return; }
    if (!selectedSite?.trim()) { toast.error('请选择站点租户'); return; }
    // 直接使用页面上选择的环境，不弹窗
    if (!editor.selectedEnvironment) { toast.error('请先选择环境'); return; }

    const start = Date.now();
    const defId = editor.state.definitionId || definitionId || '';

    try {
      setSending(true);
      setResponseData(null);
      setHasResponse(false);

      // 直接使用页面上选择的环境，不弹窗
      const envList = await environmentService.getEnvironmentList({ projectId, current: 1, pageSize: 100 });
      const env = envList.records.find((e: Environment) => e.id === editor.selectedEnvironment);
      const dubboUrl = env?.dubboInfo?.dubbo_url?.trim();
      if (!dubboUrl) {
        toast.error('未找到环境配置的 DUBBO URL');
        return;
      }
      // 如果 dubboUrl 是完整 URL，直接使用；如果是相对路径，使用相对路径
      // http 工具会自动处理 baseURL 和 /rpc 前缀
      const apiUrl = dubboUrl;

      const cfg = buildRequestConfig(selectedSite);
      const payload = {
        applicationName: cfg.applicationName,
        interfaceName: cfg.interfaceName,
        methodName: cfg.methodName,
        paramTypes: cfg.parameterTypes ?? [],
        params: cfg.params ?? [],
        siteTenant: selectedSite.trim(),
        dubboTag: cfg.dubboTag,
      };

      // 直接发送请求，不弹窗，使用页面上已选择的环境
      const res = await http.post(apiUrl, payload);
      const result = res.data ?? res;
      setResponseData(result);
      setHasResponse(true);

      trackAction('DUBBO', {
        protocol: 'DUBBO',
        definitionId: defId,
        name: editor.state.name || '',
        moduleId: editor.state.moduleId || '',
        projectId: projectId || '',
        interfaceName: f.interfaceName.trim(),
        methodName: f.methodName.trim(),
        applicationName: f.applicationName.trim(),
        duration: Date.now() - start,
        success: !(result as { error?: unknown })?.error,
        email: localStorage.getItem('currentemail') || undefined,
      });
      toast.success('请求发送成功');
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown }; message?: string };
      const data = e.response?.data ?? (e.message ? { error: e.message } : { error: '请求发送失败' });
      setResponseData(data);
      setHasResponse(true);
      trackAction('DUBBO', {
        protocol: 'DUBBO',
        definitionId: defId,
        name: editor.state.name || '',
        moduleId: editor.state.moduleId || '',
        projectId: projectId || '',
        interfaceName: f.interfaceName.trim(),
        methodName: f.methodName.trim(),
        applicationName: f.applicationName.trim(),
        duration: Date.now() - start,
        success: false,
        error: (data as { error?: string })?.error || '请求发送失败',
        email: localStorage.getItem('currentemail') || undefined,
      });
      // 错误信息已在调用结果区域显示，不需要弹出提示
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (sending) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(executeSend, DEBOUNCE_DELAY);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { sending, responseData, hasResponse, responseTab, setResponseTab, handleSend };
}
