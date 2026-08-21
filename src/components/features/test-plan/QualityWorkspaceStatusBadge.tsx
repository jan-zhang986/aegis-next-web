import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface QualityWorkspaceStatusBadgeProps {
  status?: string;
  className?: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-slate-100 text-slate-700' },
  TODO: { label: '待开始', className: 'bg-slate-100 text-slate-700' },
  READY: { label: '待开始', className: 'bg-slate-100 text-slate-700' },
  PREPARED: { label: '待开始', className: 'bg-slate-100 text-slate-700' },
  IN_PROGRESS: { label: '进行中', className: 'bg-blue-100 text-blue-700' },
  UNDERWAY: { label: '进行中', className: 'bg-blue-100 text-blue-700' },
  RUNNING: { label: '进行中', className: 'bg-blue-100 text-blue-700' },
  DONE: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  ARCHIVED: { label: '已归档', className: 'bg-amber-100 text-amber-700' },
};

export function QualityWorkspaceStatusBadge({ status, className }: QualityWorkspaceStatusBadgeProps) {
  const normalized = status === 'NOT_ARCHIVED' ? 'IN_PROGRESS' : (status || 'TODO');
  const meta = STATUS_META[normalized] || { label: normalized, className: 'bg-slate-100 text-slate-700' };

  return (
    <Badge className={cn('border-0 font-bold', meta.className, className)} variant="secondary">
      {meta.label}
    </Badge>
  );
}
