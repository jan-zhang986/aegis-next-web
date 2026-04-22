/**
 * 用例等级展示（空心圆 + 文字，非 tag 样式）
 */

import { getCaseLevel } from '../utils';
import { CASE_LEVEL_MAP } from '../constants';
import type { CaseItem } from '../types';

interface CaseLevelBadgeProps {
  /** 用例项（用于从 customFields 解析等级） */
  item?: CaseItem | null;
  /** 直接传入等级字符串（如 P0、P1），优先于 item */
  level?: string;
}

function LevelIcon({ level }: { level: string }) {
  const key = level.toUpperCase();
  const style = CASE_LEVEL_MAP[key] ?? { circleClass: 'border-gray-400' };
  return (
    <span
      className={`inline-block w-1 h-1 rounded-full border shrink-0 ${style.circleClass}`}
      aria-hidden
    />
  );
}

export function CaseLevelBadge({ item, level: levelProp }: CaseLevelBadgeProps) {
  const level = levelProp ?? getCaseLevel(item);
  if (!level || level === '-') return <>-</>;
  const key = level.toUpperCase();
  const style = CASE_LEVEL_MAP[key] ?? {
    label: level,
    className: 'text-gray-600',
    circleClass: 'border-gray-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-normal ${style.className}`}>
      <LevelIcon level={level} />
      {style.label}
    </span>
  );
}

/** 用于 SelectItem 内联的等级选项（与 CaseLevelBadge 样式一致） */
export function CaseLevelOption({ value }: { value: string }) {
  const style = CASE_LEVEL_MAP[value] ?? { label: value, circleClass: 'border-gray-400' };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-1 h-1 rounded-full border shrink-0 ${style.circleClass}`} />
      {style.label}
    </span>
  );
}
