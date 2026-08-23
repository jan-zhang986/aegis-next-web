/**
 * 测试计划执行耗时统计
 * 从 aegis-next-web 迁移
 * 核心算法：切出即执行 (Focus-out Heuristic)，区分「执行」与「阅读」时间
 */

export interface ExecutionTrackerConfig {
  minExecutionTime?: number;
  maxExecutionTime?: number;
  batchDetectionThreshold?: number;
  debug?: boolean;
}

export interface ExecutionResult {
  executionTime: number;
  readingTime: number;
  totalTime: number;
  isBatch: boolean;
  focusOutCount: number;
  filteredTime: number;
  settleTime: number;
}

export class ExecutionTracker {
  private config: Required<ExecutionTrackerConfig>;
  private isTracking = false;
  private sessionStartTime = 0;
  private lastSettleTime = 0;
  private isFocused = true;
  private focusOutTime = 0;
  private pendingDuration = 0;
  private focusOutCount = 0;
  private filteredTime = 0;
  private boundHandlers = new Map<string, EventListener>();

  constructor(config: ExecutionTrackerConfig = {}) {
    this.config = {
      minExecutionTime: config.minExecutionTime ?? 5 * 1000,
      maxExecutionTime: config.maxExecutionTime ?? 30 * 60 * 1000,
      batchDetectionThreshold: config.batchDetectionThreshold ?? 3 * 1000,
      debug: config.debug ?? false,
    };
  }

  start(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.sessionStartTime = Date.now();
    this.lastSettleTime = this.sessionStartTime;
    this.isFocused = !document.hidden;
    this.focusOutTime = 0;
    this.pendingDuration = 0;
    this.focusOutCount = 0;
    this.filteredTime = 0;
    this.attachEventListeners();
  }

  settle(): ExecutionResult {
    if (!this.isTracking) return this.getEmptyResult();
    const now = Date.now();
    if (!this.isFocused && this.focusOutTime > 0) {
      this.settleFocusOutSession(now);
    }
    const totalTime = now - this.sessionStartTime;
    const executionTime = this.pendingDuration;
    const readingTime = Math.max(0, totalTime - executionTime);
    const timeSinceLastSettle = now - this.lastSettleTime;
    const isBatch = timeSinceLastSettle < this.config.batchDetectionThreshold;
    const result: ExecutionResult = {
      executionTime,
      readingTime,
      totalTime,
      isBatch,
      focusOutCount: this.focusOutCount,
      filteredTime: this.filteredTime,
      settleTime: now,
    };
    this.resetForNextCase(now);
    return result;
  }

  stop(): void {
    if (!this.isTracking) return;
    this.isTracking = false;
    this.detachEventListeners();
  }

  private attachEventListeners(): void {
    const blurHandler = this.handleWindowBlur.bind(this);
    const focusHandler = this.handleWindowFocus.bind(this);
    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);
    this.boundHandlers.set('blur', blurHandler);
    this.boundHandlers.set('focus', focusHandler);
    const visibilityHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', visibilityHandler);
    this.boundHandlers.set('visibilitychange', visibilityHandler);
  }

  private detachEventListeners(): void {
    const blurHandler = this.boundHandlers.get('blur');
    const focusHandler = this.boundHandlers.get('focus');
    if (blurHandler) window.removeEventListener('blur', blurHandler);
    if (focusHandler) window.removeEventListener('focus', focusHandler);
    const visibilityHandler = this.boundHandlers.get('visibilitychange');
    if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
    this.boundHandlers.clear();
  }

  private handleWindowBlur(): void {
    if (!this.isTracking || !this.isFocused) return;
    this.isFocused = false;
    this.focusOutTime = Date.now();
    this.focusOutCount++;
  }

  private handleWindowFocus(): void {
    if (!this.isTracking || this.isFocused) return;
    const now = Date.now();
    this.settleFocusOutSession(now);
    this.isFocused = true;
    this.focusOutTime = 0;
  }

  private handleVisibilityChange(): void {
    if (!this.isTracking) return;
    if (document.hidden && this.isFocused) this.handleWindowBlur();
    else if (!document.hidden && !this.isFocused) this.handleWindowFocus();
  }

  private settleFocusOutSession(now: number): void {
    if (this.focusOutTime === 0) return;
    const awayTime = now - this.focusOutTime;
    if (awayTime >= this.config.minExecutionTime && awayTime <= this.config.maxExecutionTime) {
      this.pendingDuration += awayTime;
    } else {
      this.filteredTime += awayTime;
    }
  }

  private resetForNextCase(now: number): void {
    this.sessionStartTime = now;
    this.lastSettleTime = now;
    this.pendingDuration = 0;
    this.focusOutCount = 0;
    this.filteredTime = 0;
    if (!this.isFocused) this.focusOutTime = now;
  }

  private getEmptyResult(): ExecutionResult {
    return {
      executionTime: 0,
      readingTime: 0,
      totalTime: 0,
      isBatch: false,
      focusOutCount: 0,
      filteredTime: 0,
      settleTime: Date.now(),
    };
  }

  destroy(): void {
    if (this.isTracking) this.stop();
    this.detachEventListeners();
  }
}

let globalExecutionTracker: ExecutionTracker | null = null;

export function getGlobalExecutionTracker(config?: ExecutionTrackerConfig): ExecutionTracker {
  if (!globalExecutionTracker) globalExecutionTracker = new ExecutionTracker(config);
  return globalExecutionTracker;
}

export function destroyGlobalExecutionTracker(): void {
  if (globalExecutionTracker) {
    globalExecutionTracker.destroy();
    globalExecutionTracker = null;
  }
}
