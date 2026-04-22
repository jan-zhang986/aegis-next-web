/**
 * 测试计划执行结果标签组件
 */
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, MinusCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface ExecuteResultTagProps {
    /** 兼容旧版传布尔值 */
    pass?: boolean | null;
    /** 新版传测试状态字符串：SUCCESS, FAILED, ERROR, BLOCKED, SKIPPED, PENDING 等 */
    result?: string | null;
    className?: string;
    /** 为 true 时仅显示文字，无背景色和彩色 */
    plain?: boolean;
    /** 尺寸：sm (默认) / md */
    size?: 'sm' | 'md';
}

/** 统一状态映射表 */
const RESULT_CONFIG: Record<string, { label: string; icon: any; colorClass: string; bgClass: string; borderClass: string; plainColor: string }> = {
    SUCCESS: { label: '通过', icon: CheckCircle2, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200/60', plainColor: 'text-emerald-600' },
    PASSED: { label: '通过', icon: CheckCircle2, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200/60', plainColor: 'text-emerald-600' },
    ERROR: { label: '失败', icon: XCircle, colorClass: 'text-rose-700', bgClass: 'bg-rose-50', borderClass: 'border-rose-200/60', plainColor: 'text-rose-600' },
    FAILED: { label: '失败', icon: XCircle, colorClass: 'text-rose-700', bgClass: 'bg-rose-50', borderClass: 'border-rose-200/60', plainColor: 'text-rose-600' },
    FAKE_ERROR: { label: '造假失败', icon: XCircle, colorClass: 'text-orange-700', bgClass: 'bg-orange-50', borderClass: 'border-orange-200/60', plainColor: 'text-orange-600' },
    BLOCKED: { label: '阻塞', icon: MinusCircle, colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200/60', plainColor: 'text-indigo-600' },
    BLOCK: { label: '阻塞', icon: MinusCircle, colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200/60', plainColor: 'text-indigo-600' },
    SKIPPED: { label: '跳过', icon: HelpCircle, colorClass: 'text-slate-600', bgClass: 'bg-slate-100', borderClass: 'border-slate-200', plainColor: 'text-slate-500' },
    PENDING: { label: '待执行', icon: AlertCircle, colorClass: 'text-slate-600', bgClass: 'bg-slate-100', borderClass: 'border-slate-200', plainColor: 'text-slate-500' },
};

export function ExecuteResultTag({ pass, result, className = '', plain = false, size = 'sm' }: ExecuteResultTagProps) {
    let key = 'PENDING';
    if (result != null) {
        key = result.toUpperCase().trim();
    } else if (pass != null) {
        key = pass ? 'SUCCESS' : 'ERROR';
    }

    const config = RESULT_CONFIG[key] || RESULT_CONFIG['PENDING'];

    if (plain) {
        return <span className={`text-sm ${config.plainColor} flex items-center gap-1.5 ${className}`}>
            <config.icon className="w-3.5 h-3.5" />
            {config.label}
        </span>;
    }

    const isMd = size === 'md';
    return (
        <Badge
            variant="outline"
            className={`font-medium gap-1.5 transition-colors ${config.bgClass} ${config.colorClass} ${config.borderClass} ${isMd ? 'px-2.5 py-0.5 text-xs h-6' : 'px-1.5 py-0 text-[11px] h-5'} ${className}`}
        >
            <config.icon className={`${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} opacity-80`} />
            {config.label}
        </Badge>
    );
}
