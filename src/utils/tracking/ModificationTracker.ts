/**
 * 复用用例修改耗时统计
 * 从 aegis-next-web 迁移
 * 场景：编辑「复用」来源的用例时，统计修改耗时并上报
 */

import { http } from '@/utils/request';

export interface ModificationTrackerConfig {
  /** 上报接口地址 */
  uploadUrl?: string;
  /** 有效间隔阈值（毫秒） */
  threshold?: number;
  /** 长时间离开后的补偿值（毫秒） */
  compensation?: number;
  /** 是否调试 */
  debug?: boolean;
}

export class ModificationTracker {
  private uploadUrl: string;
  private threshold: number;
  private compensation: number;
  private debug: boolean;
  private caseId: string | null = null;
  private lastActionTime = 0;
  private totalDuration = 0;
  private isActive = false;
  private isModified = false;
  private boundHandlers: { activity: () => void; visibility: () => void } | null = null;

  constructor(config: ModificationTrackerConfig = {}) {
    this.uploadUrl = config.uploadUrl ?? '/api/metrics/track/modification';
    this.threshold = config.threshold ?? 5 * 60 * 1000;
    this.compensation = config.compensation ?? 5000;
    this.debug = config.debug ?? false;
  }

  start(caseId: string): void {
    if (!caseId) return;
    this.caseId = caseId;
    this.isActive = true;
    this.isModified = false;
    this.lastActionTime = Date.now();
    this.totalDuration = 0;
    const activity = this.handleActivity.bind(this);
    const visibility = this.handleVisibilityChange.bind(this);
    this.boundHandlers = { activity, visibility };
    window.addEventListener('mousemove', activity);
    window.addEventListener('click', activity);
    window.addEventListener('keydown', activity);
    window.addEventListener('scroll', activity);
    document.addEventListener('visibilitychange', visibility);
    if (this.debug) console.log('[ModificationTracker] Started tracking modification for caseId:', caseId);
  }

  markAsModified(): void {
    this.isModified = true;
  }

  stop(): void {
    if (!this.isActive) return;
    this.handleActivity();
    this.isActive = false;
    if (this.boundHandlers) {
      window.removeEventListener('mousemove', this.boundHandlers.activity);
      window.removeEventListener('click', this.boundHandlers.activity);
      window.removeEventListener('keydown', this.boundHandlers.activity);
      window.removeEventListener('scroll', this.boundHandlers.activity);
      document.removeEventListener('visibilitychange', this.boundHandlers.visibility);
      this.boundHandlers = null;
    }
    if (this.debug) console.log('[ModificationTracker] Stopped. Total duration:', this.totalDuration, 'ms');
  }

  /**
   * 停止追踪并返回累积的修改时长（仅当 isModified 时返回非 0）
   */
  stopAndGetDuration(): number {
    if (!this.isActive) return 0;
    this.handleActivity();
    const duration = this.totalDuration;
    this.stop();
    return this.isModified ? duration : 0;
  }

  async reportModificationTime(durationMs: number): Promise<void> {
    if (!this.caseId || !durationMs || durationMs <= 0) return;
    try {
      await http.post(this.uploadUrl, {
        caseId: this.caseId,
        modificationCostMs: durationMs,
      });
      if (this.debug) console.log('[ModificationTracker] Reported modification time:', this.caseId, durationMs, 'ms');
    } catch (err) {
      if (this.debug) console.error('[ModificationTracker] Failed to report modification time:', err);
    }
  }

  private handleActivity(): void {
    if (!this.isActive) return;
    const now = Date.now();
    const gap = now - this.lastActionTime;
    if (gap <= this.threshold) {
      this.totalDuration += gap;
    } else {
      this.totalDuration += this.compensation;
    }
    this.lastActionTime = now;
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.handleActivity();
    } else {
      this.lastActionTime = Date.now();
    }
  }

  reset(): void {
    this.stop();
    this.caseId = null;
    this.totalDuration = 0;
    this.isModified = false;
  }
}

export const modificationTracker = new ModificationTracker();
