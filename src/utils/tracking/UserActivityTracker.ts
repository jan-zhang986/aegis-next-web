/**
 * 用例创建耗时统计工具类
 * 从 aegis-next-web 迁移
 * 核心算法：动作触发 + 回溯补偿机制，过滤思考、离开、切屏等噪音
 */

import { http } from '@/utils/request';

export interface UserActivityTrackerConfig {
  /** 有效动作间隔阈值（毫秒），超过此值认为用户离开 */
  maxIdleGap?: number;
  /** 恢复期补偿值（毫秒），用户回来后补偿的时间 */
  resumeCompensation?: number;
  /** 上报接口地址 */
  uploadUrl?: string;
  /** 是否启用调试日志 */
  debug?: boolean;
}

export interface UserActivityResult {
  effectiveDuration: number;
  startTime: number;
  endTime: number;
  pauseCount: number;
  visibilityChangeCount: number;
  filteredDuration: number;
}

export class UserActivityTracker {
  private config: Required<Omit<UserActivityTrackerConfig, 'uploadUrl'>> & { uploadUrl: string };
  private isTracking = false;
  private startTime = 0;
  private lastActionTime = 0;
  private totalDuration = 0;
  private pauseCount = 0;
  private visibilityChangeCount = 0;
  private filteredDuration = 0;
  private isPageVisible = true;
  private lastVisibleTime = 0;
  private boundHandlers = new Map<string, EventListener>();

  constructor(config: UserActivityTrackerConfig = {}) {
    this.config = {
      maxIdleGap: config.maxIdleGap ?? 5 * 60 * 1000,
      resumeCompensation: config.resumeCompensation ?? 5 * 1000,
      uploadUrl: config.uploadUrl ?? '/api/metrics/track/write',
      debug: config.debug ?? false,
    };
  }

  /**
   * 开始追踪（创建用例场景可传临时 id，创建成功后用 reportWithCaseId 上报）
   */
  public start(_tempId?: string): void {
    if (this.isTracking) {
      this.log('警告: 追踪器已在运行中');
      return;
    }
    this.isTracking = true;
    this.startTime = Date.now();
    this.lastActionTime = this.startTime;
    this.lastVisibleTime = this.startTime;
    this.totalDuration = 0;
    this.pauseCount = 0;
    this.visibilityChangeCount = 0;
    this.filteredDuration = 0;
    this.isPageVisible = !document.hidden;
    this.attachEventListeners();
    this.log('追踪器已启动', { startTime: new Date(this.startTime).toISOString() });
  }

  /**
   * 停止追踪并返回结果
   */
  public stop(): UserActivityResult {
    if (!this.isTracking) {
      this.log('警告: 追踪器未运行');
      return this.getEmptyResult();
    }
    if (this.isPageVisible) {
      this.settleCurrentSession();
    }
    this.isTracking = false;
    this.detachEventListeners();
    const result: UserActivityResult = {
      effectiveDuration: this.totalDuration,
      startTime: this.startTime,
      endTime: Date.now(),
      pauseCount: this.pauseCount,
      visibilityChangeCount: this.visibilityChangeCount,
      filteredDuration: this.filteredDuration,
    };
    this.log('追踪器已停止', result);
    return result;
  }

  /**
   * 停止追踪并返回累积时长（不立即上报），用于创建用例：在调用 add 前先停止
   */
  public stopAndGetDuration(): number {
    if (!this.isTracking) return 0;
    if (this.isPageVisible) this.settleCurrentSession();
    const duration = this.totalDuration;
    this.isTracking = false;
    this.detachEventListeners();
    this.log('stopAndGetDuration', { duration });
    return duration;
  }

  /**
   * 使用真实 caseId 上报创建用例编写时长（创建成功后调用）
   */
  public async reportWithCaseId(caseId: string, durationMs: number): Promise<void> {
    if (!caseId || !durationMs || durationMs <= 0) return;
    try {
      await http.post(this.config.uploadUrl, { caseId, durationMs });
      this.log('已上报编写时长', { caseId, durationMs });
    } catch (err) {
      if (this.config.debug) console.warn('[UserActivityTracker] reportWithCaseId failed:', err);
    }
  }

  private attachEventListeners(): void {
    const activityEvents = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];
    const activityHandler = this.handleUserActivity.bind(this);
    activityEvents.forEach((eventType) => {
      window.addEventListener(eventType, activityHandler, { passive: true });
      this.boundHandlers.set(eventType, activityHandler);
    });
    const visibilityHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', visibilityHandler);
    this.boundHandlers.set('visibilitychange', visibilityHandler);
    const blurHandler = this.handleWindowBlur.bind(this);
    const focusHandler = this.handleWindowFocus.bind(this);
    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);
    this.boundHandlers.set('blur', blurHandler);
    this.boundHandlers.set('focus', focusHandler);
  }

  private detachEventListeners(): void {
    const activityEvents = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventType) => {
      const handler = this.boundHandlers.get(eventType);
      if (handler) window.removeEventListener(eventType, handler);
    });
    const visibilityHandler = this.boundHandlers.get('visibilitychange');
    if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
    const blurHandler = this.boundHandlers.get('blur');
    const focusHandler = this.boundHandlers.get('focus');
    if (blurHandler) window.removeEventListener('blur', blurHandler);
    if (focusHandler) window.removeEventListener('focus', focusHandler);
    this.boundHandlers.clear();
  }

  private handleUserActivity(): void {
    if (!this.isTracking || !this.isPageVisible) return;
    const now = Date.now();
    const gap = now - this.lastActionTime;
    if (gap <= this.config.maxIdleGap) {
      this.totalDuration += gap;
    } else {
      this.totalDuration += this.config.resumeCompensation;
      this.filteredDuration += gap - this.config.resumeCompensation;
      this.pauseCount++;
    }
    this.lastActionTime = now;
  }

  private handleVisibilityChange(): void {
    if (!this.isTracking) return;
    const isHidden = document.hidden;
    if (isHidden && this.isPageVisible) {
      this.settleCurrentSession();
      this.isPageVisible = false;
      this.visibilityChangeCount++;
    } else if (!isHidden && !this.isPageVisible) {
      this.isPageVisible = true;
      this.lastActionTime = Date.now();
      this.lastVisibleTime = this.lastActionTime;
      this.visibilityChangeCount++;
    }
  }

  private handleWindowBlur(): void {
    if (!this.isTracking || !this.isPageVisible) return;
    this.settleCurrentSession();
  }

  private handleWindowFocus(): void {
    if (!this.isTracking || !this.isPageVisible) return;
    this.lastActionTime = Date.now();
  }

  private settleCurrentSession(): void {
    const now = Date.now();
    const gap = now - this.lastActionTime;
    if (gap <= this.config.maxIdleGap) {
      this.totalDuration += gap;
    } else {
      this.filteredDuration += gap;
    }
  }

  private getEmptyResult(): UserActivityResult {
    return {
      effectiveDuration: 0,
      startTime: 0,
      endTime: 0,
      pauseCount: 0,
      visibilityChangeCount: 0,
      filteredDuration: 0,
    };
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) console.log('[UserActivityTracker]', message, data ?? '');
  }

  public destroy(): void {
    if (this.isTracking) this.stop();
    this.detachEventListeners();
  }
}

let globalTracker: UserActivityTracker | null = null;

export function getGlobalUserActivityTracker(config?: UserActivityTrackerConfig): UserActivityTracker {
  if (!globalTracker) globalTracker = new UserActivityTracker(config);
  return globalTracker;
}

export function destroyGlobalUserActivityTracker(): void {
  if (globalTracker) {
    globalTracker.destroy();
    globalTracker = null;
  }
}
