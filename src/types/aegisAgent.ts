/**
 * AegisAgent 类型定义
 * 基于 alibaba/page-agent 项目封装
 */

/** LLM 配置 */
export interface AegisAgentLLMConfig {
  /** API Key */
  apiKey: string;
  /** 模型接口地址 */
  baseURL: string;
  /** 模型名称 */
  model: string;
}

/** 操作权限配置 */
export interface AegisAgentPermissions {
  /** 是否允许点击操作 */
  click?: boolean;
  /** 是否允许输入操作 */
  input?: boolean;
  /** 是否允许选择操作 */
  select?: boolean;
  /** 是否允许滚动操作 */
  scroll?: boolean;
  /** 是否允许导航操作 */
  navigate?: boolean;
}

/** AegisAgent 配置选项 */
export interface AegisAgentConfig {
  /** LLM 配置 */
  llm: AegisAgentLLMConfig;
  /** 操作权限 */
  permissions?: AegisAgentPermissions;
  /** 是否显示 UI */
  showUI?: boolean;
  /** UI 位置 */
  uiPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 自定义样式 */
  customStyles?: Record<string, string>;
  /** 调试模式 */
  debug?: boolean;
  /** 语言设置 */
  language?: 'zh-CN' | 'en-US';
}

/** AegisAgent 实例接口 */
export interface AegisAgentInstance {
  /** 启动 AegisAgent */
  start: () => void;
  /** 停止 AegisAgent */
  stop: () => void;
  /** 执行指令 */
  execute: (instruction: string) => Promise<void>;
  /** 销毁实例 */
  destroy: () => void;
}

/** AegisAgent 存储配置 */
export interface AegisAgentStorageConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  enabled?: boolean;
  useDemoConfig?: boolean; // 是否使用默认 DEMO 配置
}

/** 默认 DEMO 配置（免费测试） */
export const DEMO_AEGIS_AGENT_CONFIG = {
  DEMO_MODEL: 'PAGE-AGENT-FREE-TESTING-RANDOM',
  DEMO_BASE_URL: 'https://hwcxiuzfylggtcktqgij.supabase.co/functions/v1/llm-testing-proxy',
  DEMO_API_KEY: 'PAGE-AGENT-FREE-TESTING-RANDOM',
} as const;

/** 默认配置 */
export const DEFAULT_AEGIS_AGENT_CONFIG: Partial<AegisAgentConfig> = {
  permissions: {
    click: true,
    input: true,
    select: true,
    scroll: true,
    navigate: true,
  },
  showUI: true,
  uiPosition: 'bottom-right',
  debug: false,
  language: 'zh-CN',
};

