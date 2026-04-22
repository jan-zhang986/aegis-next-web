/**
 * 生成唯一 ID（用于步骤等）
 */

export function generateId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
