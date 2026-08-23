/**
 * 认证服务
 * 提供用户登录、登出、用户信息等功能
 * 集成 aegis-next-server 后端登录
 */

import { http } from '@/utils/request';

// 飞书登录配置信息
export interface LarkInfo {
  agentId: string;
  callBack: string;
  appSecret: string;
  enable: boolean;
  valid: boolean;
  hasConfig: boolean;
  useFrontendConfig?: boolean;
  configSource?: string;
}

// 飞书登录响应
export interface LarkLoginResponse {
  code: number;
  data?: {
    id: string;
    name: string;
    email?: string;
    sessionId?: string;
    csrfToken?: string;
  };
  message?: string;
}

export const authService = {
  /**
   * 用户登录（用户名密码）
   * 使用 AegisOne 标准登录接口 /login
   */
  login: async (data: { username: string; password: string }) => {
    return http.post('/login', data);
  },

  /**
   * 用户登出
   * 使用 AegisOne 标准登出接口 /signout
   */
  logout: async () => {
    return http.get('/signout');
  },

  /**
   * 获取当前用户信息
   * 使用 AegisOne 标准接口 /is-login
   */
  getCurrentUser: async () => {
    return http.get('/is-login');
  },

  /**
   * 刷新 Token
   */
  refreshToken: async (refreshToken: string) => {
    return http.post('/api/auth/refresh', { refreshToken });
  },

  /**
   * 获取飞书登录配置信息
   */
  getLarkInfo: async (): Promise<LarkInfo> => {
    return http.get('/lark/info');
  },

  /**
   * 飞书登录（使用授权码）
   */
  larkLogin: async (code: string): Promise<LarkLoginResponse> => {
    return http.get('/lark/login', { params: { code } });
  },

  /**
   * 通过 sessionId 获取用户信息（不需要 CSRF token，用于飞书回调后获取用户信息）
   */
  getLarkUserBySessionId: async (sessionId: string) => {
    return http.get('/lark/user', { params: { sessionId } });
  },

  /**
   * 切换项目（更新用户的 lastProjectId）
   */
  switchProject: async (data: { projectId: string; userId: string }) => {
    return http.post('/project/switch', data);
  },
};
