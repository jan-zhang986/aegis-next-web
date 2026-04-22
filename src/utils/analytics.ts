// 埋点工具类 - 轻量级自建方案
// 适用于 Web 应用，通过 http 工具发送数据，复用 request.ts 的拦截器逻辑

import { http } from '@/utils/request';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  email?: string;
  timestamp?: number;
  page?: string;
  platform?: string;
  duration?: number;
}

export const ANALYTICS_API_ENDPOINT = '/analytics/track';

class Analytics {
  private sessionId: string;
  private queue: AnalyticsEvent[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000; // 30秒
  private flushTimer: number | null = null;
  private apiEndpoint = ANALYTICS_API_ENDPOINT;
  private enabled = true;
  private flushAttempts = 0;

  constructor() {
    // 生成会话ID（每次应用启动时生成）
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    
    // 页面卸载时上报剩余数据
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取用户ID
  private getUserId(): string | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('currentuser');
      return user || null;
    }
    return null;
  }

  private getUserEmail(): string | null {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('currentemail');
      return email || null;
    }
    return null;
  }

  // 追踪事件
  track(event: string, properties?: Record<string, any>, meta?: { page?: string; platform?: string; duration?: number }): void {
    if (!this.enabled) return;

    const userId = this.getUserId();
    const userIdValue = userId === null ? undefined : userId;
    const userEmail = this.getUserEmail();
    const emailValue = userEmail === null ? undefined : userEmail;
    
    // 从 properties 中提取 duration（如果存在），优先使用 meta 中的 duration
    const { duration: durationFromProperties, ...restProperties } = properties || {};
    const duration = meta?.duration !== undefined ? meta.duration : durationFromProperties;
    
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...restProperties,
      },
      page: meta?.page ?? this.getCurrentPage(),
      platform: meta?.platform ?? 'AegisOne',
      userId: userIdValue,
      email: emailValue,
      timestamp: Date.now(),
      ...(duration !== undefined && { duration }),
    };

    // 添加到队列
    this.queue.push(eventData);

    // 如果队列满了，立即上报
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  // 获取当前页面
  private getCurrentPage(): string {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path || 'unknown';
    }
    return 'unknown';
  }

  // 批量上报
  private async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.enabled) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await this.sendDirectly(events);
      this.flushAttempts = 0; // 成功后重置重试次数
    } catch (error) {
      // 埋点失败时静默处理，不阻塞用户操作
      // 只在开发环境或重试次数过多时输出警告
      if (this.flushAttempts < 3) {
        this.flushAttempts += 1;
        this.queue.unshift(...events);
        // 只在开发环境输出警告
        if (import.meta.env.DEV) {
          console.warn('Analytics flush failed, will retry:', error);
        }
      } else {
        this.flushAttempts = 0;
        // 只在开发环境输出警告
        if (import.meta.env.DEV) {
          console.warn('Analytics flush dropped after 3 retries');
        }
      }
    }
  }

  // 直接发送（使用 http 工具，完全复用 request.ts 的拦截器逻辑，包括鉴权、错误处理等）
  // 与 plugin-sync-node/list 等接口使用相同的方式
  // 使用相对路径，走 axios 的 baseURL，避免 CORS 预检问题
  private async sendDirectly(events: AnalyticsEvent[]): Promise<void> {
    // 使用 http.post，会自动应用请求拦截器（鉴权）和响应拦截器（错误处理）
    // 使用相对路径，axios 会自动添加 baseURL，与项目其他 API 请求保持一致
    await http.post(this.apiEndpoint, { events });
  }

  // 启动定时上报
  private startFlushTimer(): void {
    if (typeof window !== 'undefined') {
      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, this.flushInterval);
    }
  }

  // 停止定时上报
  stop(): void {
    if (this.flushTimer && typeof window !== 'undefined') {
      window.clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // 停止前上报剩余数据
    this.flush();
  }

  // 启用/禁用埋点
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.queue = [];
    }
  }

  // 页面访问追踪
  page(pageName: string, properties?: Record<string, any>): void {
    this.track(
      'view',
      {
        ...properties,
      },
      {
        page: pageName,
        platform: 'AegisOne',
      }
    );
  }

  // 用户行为追踪
  action(pageName: string, properties?: Record<string, any>): void {
    // 从 properties 中提取 duration 和 protocol
    const { duration, protocol, ...restProperties } = properties || {};
    
    // 如果提供了 protocol，使用 protocol 作为 page，否则使用 pageName
    const page = protocol || pageName;
    
    this.track(
      'execute',
      {
        ...restProperties,
      },
      {
        page: page,
        platform: 'AegisOne',
        ...(duration !== undefined && { duration }),
      }
    );
  }

  // 错误追踪
  error(error: Error | string, properties?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.track('error', {
      error_message: errorMessage,
      error_stack: errorStack,
      ...properties,
    });
  }

  // 性能追踪
  performance(metric: string, value: number, properties?: Record<string, any>): void {
    this.track('performance', {
      metric,
      value,
      ...properties,
    });
  }
}

// 创建单例
export const analytics = new Analytics();

// 便捷方法
export const track = (event: string, properties?: Record<string, any>) => {
  analytics.track(event, properties);
};

export const trackPage = (pageName: string, properties?: Record<string, any>) => {
  analytics.page(pageName, properties);
};

export const trackAction = (pageName: string, properties?: Record<string, any>) => {
  analytics.action(pageName, properties);
};

export const trackError = (error: Error | string, properties?: Record<string, any>) => {
  analytics.error(error, properties);
};

export const trackPerformance = (metric: string, value: number, properties?: Record<string, any>) => {
  analytics.performance(metric, value, properties);
};

