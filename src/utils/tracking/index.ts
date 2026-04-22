/**
 * 效能埋点工具类统一导出
 * 从 metersphere-frontend 迁移
 */

export {
  destroyGlobalExecutionTracker,
  type ExecutionResult,
  ExecutionTracker,
  type ExecutionTrackerConfig,
  getGlobalExecutionTracker,
} from './ExecutionTracker';
export {
  destroyGlobalUserActivityTracker,
  getGlobalUserActivityTracker,
  type UserActivityResult,
  UserActivityTracker,
  type UserActivityTrackerConfig,
} from './UserActivityTracker';
export { modificationTracker, type ModificationTrackerConfig } from './ModificationTracker';
