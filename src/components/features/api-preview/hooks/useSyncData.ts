import { useMemo, useState, useCallback } from 'react';
import { pluginSyncNodeService } from '@/services/metadata';
import { toast } from 'sonner';
import type { MetadataDefinition } from '@/services/metadata';

export function useSyncData(
  definition: MetadataDefinition,
  requestConfig: Record<string, unknown> | null,
  protocol: string,
  onRefresh?: () => void
) {
  const isSyncData = useMemo(
    () => definition.moduleId === 'plugin-sync' || definition.id.startsWith('sync-'),
    [definition.moduleId, definition.id]
  );

  const nodeId = useMemo(() => {
    return definition.id.startsWith('sync-') ? definition.id.replace('sync-', '') : definition.id;
  }, [definition.id]);

  const [isSavingSyncData, setIsSavingSyncData] = useState(false);

  const handleSaveSyncData = useCallback(async () => {
    if (!requestConfig) {
      toast.error('请求配置不存在');
      return;
    }
    try {
      setIsSavingSyncData(true);
      let endpointData: Record<string, unknown> = {};
      if (protocol === 'HTTP') {
        endpointData = {
          name: definition.name || '',
          method: requestConfig.method || 'GET',
          url: requestConfig.url || '',
          path: requestConfig.path || requestConfig.url || '',
          headers: requestConfig.headers || {},
          queryParams: requestConfig.query || requestConfig.queryParams || {},
          body: requestConfig.body || {},
        };
      } else if (protocol === 'SQL') {
        endpointData = {
          name: definition.name || '',
          sql: requestConfig.sql || definition.scriptContent || '',
          operationType: requestConfig.operationType || 'SELECT',
        };
      } else if (protocol === 'DUBBO') {
        endpointData = {
          name: definition.name || '',
          url: requestConfig.url || '',
          interface_name: requestConfig.interfaceName || requestConfig.interface_name || '',
          interfaceName: requestConfig.interfaceName || requestConfig.interface_name || '',
          method_name: requestConfig.methodName || requestConfig.method_name || '',
          methodName: requestConfig.methodName || requestConfig.method_name || '',
          application_name: requestConfig.applicationName || requestConfig.application_name || '',
          applicationName: requestConfig.applicationName || requestConfig.application_name || '',
          parameterTypes: requestConfig.parameterTypes || [],
          paramTypes: requestConfig.parameterTypes || [],
          params: requestConfig.params || [],
          version: requestConfig.version || '',
          group: requestConfig.group || '',
          timeout: requestConfig.timeout || 3000,
        };
      } else if (protocol === 'ROCKETMQ') {
        endpointData = {
          name: definition.name || '',
          topic: requestConfig.topic || '',
          tag: requestConfig.tag || '',
          key: requestConfig.key || '',
          messageBody: requestConfig.body || '',
          body: requestConfig.body || '',
          mqUrl: requestConfig.mqUrl || requestConfig.mq_url || '',
          mq_url: requestConfig.mqUrl || requestConfig.mq_url || '',
          producerGroup: requestConfig.producerGroup || requestConfig.producer_group || '',
          producer_group: requestConfig.producerGroup || requestConfig.producer_group || '',
        };
      } else {
        endpointData = { ...requestConfig, name: definition.name || '' };
      }
      await pluginSyncNodeService.updateNode({ nodeId, endpointData });
      toast.success('同步数据保存成功');
      onRefresh?.();
    } catch (e: unknown) {
      console.error('保存同步数据失败:', e);
      const err = e as { message?: string; response?: { data?: { message?: string } } };
      toast.error(err?.message || err?.response?.data?.message || '保存同步数据失败，请重试');
    } finally {
      setIsSavingSyncData(false);
    }
  }, [definition, requestConfig, protocol, nodeId, onRefresh]);

  return { isSyncData, nodeId, isSavingSyncData, handleSaveSyncData };
}
