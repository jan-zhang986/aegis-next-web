/**
 * API 测试服务
 * 提供各种协议类型的API测试功能
 */

import { http } from '@/utils/request';

export const apiTestService = {
  /**
   * HTTP API 测试
   */
  testHttpApi: async (config: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, any>;
  }) => {
    return http.post('/api/test/http', config);
  },

  /**
   * SQL 查询测试
   */
  testSqlQuery: async (config: {
    datasourceId: string;
    query: string;
    params?: any[];
  }) => {
    return http.post('/api/test/sql', config);
  },

  /**
   * Dubbo 服务测试
   */
  testDubbo: async (config: {
    interface: string;
    method: string;
    params?: any[];
  }) => {
    return http.post('/api/test/dubbo', config);
  },

  /**
   * RocketMQ 消息测试
   */
  testRocketMQ: async (config: {
    topic: string;
    tag?: string;
    message: string;
  }) => {
    return http.post('/api/test/rocketmq', config);
  },

  /**
   * TCP 连接测试
   */
  testTcp: async (config: {
    host: string;
    port: number;
    message: string;
  }) => {
    return http.post('/api/test/tcp', config);
  },

  /**
   * WebSocket 测试
   */
  testWebSocket: async (config: {
    url: string;
    message?: string;
  }) => {
    return http.post('/api/test/websocket', config);
  },
};
