"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

/** 截断文案悬浮展示完整内容，统一使用 Tooltip 组件 */
export interface TruncateWithTooltipProps {
  /** 展示的文案（可被截断） */
  children: React.ReactNode;
  /** 悬浮时展示的完整内容，默认与 children 相同 */
  content?: React.ReactNode;
  /** 根节点 class，默认含 truncate */
  className?: string;
  /** 根节点标签，默认 span */
  as?: "span" | "div";
  /** Tooltip 位置 */
  side?: "top" | "right" | "bottom" | "left";
}

export function TruncateWithTooltip({
  children,
  content,
  className,
  as: Tag = "span",
  side = "top",
}: TruncateWithTooltipProps) {
  const fullContent = content ?? children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Tag className={cn("truncate", className)}>{children}</Tag>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[320px] break-words">
        {fullContent}
      </TooltipContent>
    </Tooltip>
  );
}
