/**
 * LeftPanelTabs Component
 * 左侧面板标签页切换组件
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
import { List, Star, Info, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LeftPanelTabsProps {
  value: 'public-nodes' | 'nodes' | 'metadata' | 'history';
  onValueChange: (value: 'public-nodes' | 'nodes' | 'metadata' | 'history') => void;
}

export const LeftPanelTabs: React.FC<LeftPanelTabsProps> = ({ value, onValueChange }) => {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as 'public-nodes' | 'nodes' | 'metadata' | 'history')} className="w-full">
      <TabsList className="w-full flex gap-1 h-9 rounded-md bg-gray-50 p-1">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-0">
              <TabsTrigger 
                value="nodes" 
                className="w-full text-xs px-2 py-1.5 justify-center"
              >
                <List className="w-4 h-4" />
                <span className="sr-only">节点</span>
              </TabsTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            sideOffset={8}
            className="bg-gray-900 text-white border border-gray-700 z-[9999]"
          >
            <p>节点：添加工作流节点到画布</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-0">
              <TabsTrigger 
                value="public-nodes" 
                className="w-full text-xs px-2 py-1.5 justify-center"
              >
                <Star className="w-4 h-4" />
                <span className="sr-only">公共节点</span>
              </TabsTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            sideOffset={8}
            className="bg-gray-900 text-white border border-gray-700 z-[9999]"
          >
            <p>公共节点：查看和管理共享的节点模板</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-0">
              <TabsTrigger 
                value="metadata" 
                className="w-full text-xs px-2 py-1.5 justify-center"
              >
                <Info className="w-4 h-4" />
                <span className="sr-only">元数据</span>
              </TabsTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            sideOffset={8}
            className="bg-gray-900 text-white border border-gray-700 z-[9999]"
          >
            <p>元数据：查看项目中的接口和元数据</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-0">
              <TabsTrigger 
                value="history" 
                className="w-full text-xs px-2 py-1.5 justify-center"
              >
                <History className="w-4 h-4" />
                <span className="sr-only">历史</span>
              </TabsTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            sideOffset={8}
            className="bg-gray-900 text-white border border-gray-700 z-[9999]"
          >
            <p>历史：查看工作流执行历史记录</p>
          </TooltipContent>
        </Tooltip>
      </TabsList>
    </Tabs>
  );
};
