/**
 * 认证工具
 * 基于 AegisOne 的鉴权机制
 */

const SESSION_ID = 'sessionId';
const CSRF_TOKEN = 'csrfToken';
const LOGIN_TYPE = 'loginType';

interface TokenPair {
  sessionId: string;
  csrfToken: string;
}

/**
 * 获取token
 */
export const getToken = (): TokenPair | null => {
  const sessionId = localStorage.getItem(SESSION_ID);
  const csrfToken = localStorage.getItem(CSRF_TOKEN) || '';
  
  if (!sessionId) {
    return null;
  }
  
  return { sessionId, csrfToken };
};

/**
 * 设置token
 */
export const setToken = (sessionId: string, csrfToken: string) => {
  localStorage.setItem(SESSION_ID, sessionId);
  localStorage.setItem(CSRF_TOKEN, csrfToken);
};

/**
 * 清除token
 */
export const clearToken = () => {
  localStorage.removeItem(SESSION_ID);
  localStorage.removeItem(CSRF_TOKEN);
  localStorage.removeItem(LOGIN_TYPE);
};

/**
 * 检查是否有token
 */
export const hasToken = (): boolean => {
  const token = getToken();
  return !!token && !!token.sessionId;
};

/**
 * 设置登录类型
 */
export const setLoginType = (loginType: string) => {
  localStorage.setItem(LOGIN_TYPE, loginType);
};

/**
 * 获取登录类型
 */
export const getLoginType = (): string | null => {
  return localStorage.getItem(LOGIN_TYPE);
};

/**
 * 设置登录过期时间
 */
export const setLoginExpires = () => {
  localStorage.setItem('loginExpires', Date.now().toString());
};

/**
 * 检查登录是否过期（30天）
 */
export const isLoginExpires = (): boolean => {
  const lastLoginTime = Number(localStorage.getItem('loginExpires'));
  const now = Date.now();
  const diff = now - lastLoginTime;
  const thirtyDay = 24 * 60 * 60 * 1000 * 30;
  return diff > thirtyDay;
};

