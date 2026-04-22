/**
 * AegisAgent 服务
 * 管理 AegisAgent 的初始化、配置和生命周期
 * 基于 alibaba/page-agent 封装
 */

import type { AegisAgentConfig, AegisAgentStorageConfig } from '@/types/aegisAgent';
import { DEFAULT_AEGIS_AGENT_CONFIG, DEMO_AEGIS_AGENT_CONFIG } from '@/types/aegisAgent';

const STORAGE_KEY = 'aegis-agent-config';

/**
 * 从本地存储获取配置
 */
export function getStoredConfig(): AegisAgentStorageConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse AegisAgent config from storage:', error);
  }
  return null;
}

/**
 * 保存配置到本地存储
 */
export function saveConfig(config: AegisAgentStorageConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save AegisAgent config to storage:', error);
  }
}

/**
 * 清除存储的配置
 */
export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 验证配置是否有效
 * 如果使用默认配置，则跳过验证
 */
export function validateConfig(config: AegisAgentStorageConfig): { valid: boolean; errors: string[] } {
  // 如果使用默认配置，直接返回有效
  if (config.useDemoConfig) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('API Key 不能为空');
  }

  if (!config.baseURL || config.baseURL.trim() === '') {
    errors.push('模型接口地址不能为空');
  } else {
    try {
      new URL(config.baseURL);
    } catch {
      errors.push('模型接口地址格式不正确');
    }
  }

  if (!config.model || config.model.trim() === '') {
    errors.push('模型名称不能为空');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 构建完整的 AegisAgent 配置
 * 如果用户没有配置，使用默认的 DEMO 配置
 */
export function buildConfig(storageConfig: AegisAgentStorageConfig, useDemoConfig: boolean = false): AegisAgentConfig {
  // 如果使用默认配置，或者用户没有配置，使用 DEMO 配置
  const useDemo = useDemoConfig || (!storageConfig.apiKey && !storageConfig.baseURL);
  
  return {
    ...DEFAULT_AEGIS_AGENT_CONFIG,
    llm: {
      apiKey: useDemo 
        ? DEMO_AEGIS_AGENT_CONFIG.DEMO_API_KEY 
        : (storageConfig.apiKey || ''),
      baseURL: useDemo 
        ? DEMO_AEGIS_AGENT_CONFIG.DEMO_BASE_URL 
        : (storageConfig.baseURL || ''),
      model: useDemo 
        ? DEMO_AEGIS_AGENT_CONFIG.DEMO_MODEL 
        : (storageConfig.model || 'gpt-4.1-mini'),
    },
  } as AegisAgentConfig;
}

/**
 * 初始化 AegisAgent
 * 实例化后需要手动调用 panel.show() 显示 UI 面板
 */
export async function initAegisAgent(config: AegisAgentConfig): Promise<boolean> {
  try {
    // 如果已经存在实例，先停止
    if ((window as any).__aegisAgentInstance) {
      stopAegisAgent();
    }
    
    // 动态导入 page-agent（命名导出）
    const { PageAgent } = await import('page-agent');
    
    // 创建实例
    const aegisAgent = new PageAgent({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseURL,
      model: config.llm.model,
      language: config.language || 'zh-CN',
    });
    
    // 显示 Panel UI - 创建后 Panel 默认是隐藏的
    if (aegisAgent.panel) {
      aegisAgent.panel.show();
    }
    
    // 存储到 window 以便后续访问
    (window as any).__aegisAgentInstance = aegisAgent;
    
    return true;
  } catch (error) {
    console.error('Failed to initialize AegisAgent:', error);
    return false;
  }
}

/**
 * 停止并销毁 AegisAgent
 */
export function stopAegisAgent(): void {
  try {
    const instance = (window as any).__aegisAgentInstance;
    if (instance) {
      // 先隐藏 Panel
      instance.panel?.hide?.();
      // 使用 dispose() 方法来清理
      instance.dispose?.('USER_STOPPED');
      delete (window as any).__aegisAgentInstance;
    }
  } catch (error) {
    console.error('Failed to stop AegisAgent:', error);
  }
}

/**
 * 检查 AegisAgent 是否正在运行
 */
export function isAegisAgentRunning(): boolean {
  return !!(window as any).__aegisAgentInstance;
}

