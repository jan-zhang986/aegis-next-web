/**
 * 思考过程展示（参考 aegis-rag-frontend deepThink.vue）
 * 可折叠的「已深度思考」区域
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Brain } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DeepThinkDisplayProps {
  thinkContent: string;
  thinking?: boolean;
  className?: string;
}

export function DeepThinkDisplay({
  thinkContent,
  thinking = false,
  className,
}: DeepThinkDisplayProps) {
  // 默认展开，不自动折叠，方便用户查看思考过程
  const [expanded, setExpanded] = useState(true);

  const hasContent = thinkContent?.trim().length > 0;
  if (!hasContent && !thinking) return null;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg bg-muted/30 dark:bg-muted/20 my-2',
        className
      )}
    >
      <button
        type="button"
        onClick={() => !thinking && setExpanded((v) => !v)}
        disabled={thinking}
        className="flex items-center justify-between w-full py-2 px-3 text-left transition-colors rounded-lg hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          {thinking ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-primary/70 shrink-0 animate-spin" />
              <span className="text-xs font-medium text-muted-foreground">思考中...</span>
            </>
          ) : (
            <>
              <Brain className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              <span className="text-xs font-medium text-muted-foreground">深度思考过程</span>
            </>
          )}
        </div>
        {!thinking && (
          expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          )
        )}
      </button>
      {(expanded || thinking) && (
        <div className="px-3 pb-3 pt-0">
          <div
            className="text-[13px] text-muted-foreground leading-[1.6] max-h-[180px] overflow-y-auto whitespace-pre-wrap scrollbar-thin pl-1"
            style={{ wordBreak: 'break-word' }}
          >
            {thinkContent || (thinking ? '...' : '')}
          </div>
        </div>
      )}
    </div>
  );
}
