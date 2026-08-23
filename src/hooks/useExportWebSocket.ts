/**
 * 导出任务 WebSocket Hook
 * 用于监听导出任务的执行结果
 */

import { useRef, useCallback } from 'react';
import { getToken } from '@/utils/auth';

export interface UseExportWebSocketParams {
  reportId: string;
  socketUrl?: string;
  onMessage?: (data: {
    msgType: string;
    fileId?: string;
    taskId?: string;
    isSuccessful?: boolean;
    count?: number;
  }) => void;
}

export interface UseExportWebSocketReturn {
  websocket: React.MutableRefObject<WebSocket | undefined>;
  createSocket: (reportId?: string) => Promise<void>;
}

/**
 * 获取 WebSocket URL（参考 aegis-next-web getSocket 实现）
 */
function getWebSocketUrl(reportId: string, socketUrl: string = '/ws/export', host?: string): string {
  let protocol = 'ws://';
  
  // 根据当前页面协议或传入的 host 判断是否为 https 协议
  if (!host?.startsWith('http') && (window.location.protocol === 'https:' || host?.startsWith('https'))) {
    protocol = 'wss://';
  }
  
  // 确定主机地址
  let hostname: string;
  if (host?.startsWith('http')) {
    hostname = host.split('://')[1];
  } else if (host) {
    hostname = host;
  } else {
    // 使用环境变量或当前页面主机
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      const backendUrl = import.meta.env.VITE_AEGIS_BACKEND_URL_DEVELOPMENT || 
                        import.meta.env.VITE_AEGIS_BACKEND_URL || 
                        'localhost:8081';
      hostname = backendUrl.replace(/^https?:\/\//, '');
    } else {
      hostname = window.location.host;
    }
  }
  
  // 构建 WebSocket URL：protocol + hostname + socketUrl + /reportId
  // 确保 socketUrl 不以斜杠结尾，reportId 前有斜杠
  const cleanSocketUrl = socketUrl.endsWith('/') ? socketUrl.slice(0, -1) : socketUrl;
  return `${protocol}${hostname}${cleanSocketUrl}/${reportId}`;
}

export function useExportWebSocket({
  reportId,
  socketUrl = '/ws/export',
  onMessage,
}: UseExportWebSocketParams): UseExportWebSocketReturn {
  const websocket = useRef<WebSocket | undefined>();

  const createSocket = useCallback((currentReportId?: string) => {
    return new Promise<void>((resolve, reject) => {
      // 使用传入的 reportId 或默认的 reportId
      const id = currentReportId || reportId;
      if (!id) {
        reject(new Error('reportId 不能为空'));
        return;
      }

      // 如果已有连接，先关闭
      if (websocket.current) {
        websocket.current.close();
        websocket.current = undefined;
      }

      try {
        const wsUrl = getWebSocketUrl(id, socketUrl);
        console.log('[Export WebSocket] 连接 URL:', wsUrl);
        const ws = new WebSocket(wsUrl);
        websocket.current = ws;

        ws.addEventListener('open', () => {
          console.log('[Export WebSocket] 连接已建立');
          resolve();
        });

        ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[Export WebSocket] 收到消息:', data);
            if (onMessage) {
              onMessage(data);
            }
          } catch (error) {
            console.error('[Export WebSocket] 解析消息失败:', error);
          }
        });

        ws.addEventListener('error', (error) => {
          console.error('[Export WebSocket] 连接错误:', error);
          reject(error);
        });

        ws.addEventListener('close', (event) => {
          console.log('[Export WebSocket] 连接已关闭:', event.code, event.reason);
          websocket.current = undefined;
        });
      } catch (error) {
        console.error('[Export WebSocket] 创建连接失败:', error);
        reject(error);
      }
    });
  }, [reportId, socketUrl, onMessage]);

  return {
    websocket,
    createSocket,
  };
}
