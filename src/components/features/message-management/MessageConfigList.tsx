/**
 * MessageConfigList Component
 * 消息配置列表组件
 */

import { useMemo, useCallback, memo } from 'react';
import { useMessageConfig } from '@/hooks/message';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';
import { MessageConfigRow } from './MessageConfigRow';
import type { MessageTaskDetail, Robot } from '@/types/message';

interface MessageConfigListProps {
  projectId: string;
  robots: Robot[];
}

export const MessageConfigList = memo(function MessageConfigList({ projectId, robots }: MessageConfigListProps) {
  const {
    messageList,
    filteredMessageList,
    loading,
    saving,
    selectedRobotId,
    setSelectedRobotId,
    updateMessageConfig,
    refresh,
  } = useMessageConfig(projectId);

  // 使用 useCallback 稳定回调引用
  const handleRobotFilterChange = useCallback((value: string) => {
    setSelectedRobotId(value === 'all' ? null : value);
  }, [setSelectedRobotId]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // 展平消息配置列表用于表格展示
  const flattenedConfigs = useMemo(() => {
    const configs: Array<{
      type: string;
      typeName: string;
      taskType: string;
      taskTypeName: string;
      detail: MessageTaskDetail;
    }> = [];

    const listToUse = selectedRobotId ? filteredMessageList : messageList;

    listToUse.forEach(item => {
      item.messageTaskTypeDTOList.forEach(taskType => {
        taskType.messageTaskDetailDTOList.forEach(detail => {
          configs.push({
            type: item.type,
            typeName: item.name,
            taskType: taskType.taskType,
            taskTypeName: taskType.taskTypeName,
            detail,
          });
        });
      });
    });

    return configs;
  }, [messageList, filteredMessageList, selectedRobotId]);

  return (
    <section className="flex flex-col h-full bg-white" aria-label="消息配置列表">
      {/* 工具栏 */}
      <header className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Bell className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">消息配置</h2>
            <p className="text-xs text-gray-500">配置项目各类事件的消息推送规则</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 机器人筛选器 */}
          <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-lg border border-gray-200/50">
            <Select
              value={selectedRobotId || 'all'}
              onValueChange={handleRobotFilterChange}
            >
              <SelectTrigger
                className="w-[180px] h-8 bg-white border-none shadow-none focus:ring-1 focus:ring-blue-100 text-xs"
                aria-label="按机器人筛选消息配置"
              >
                <SelectValue placeholder="按机器人筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部机器人</SelectItem>
                {robots.map(robot => (
                  <SelectItem key={robot.id} value={robot.id}>
                    {robot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-white transition-colors"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="刷新消息配置列表"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {/* 表格 */}
      <div className="flex-1 overflow-auto" role="region" aria-label="消息配置表格">
        <Table>
          <TableHeader className="bg-[#f7f8fa] sticky top-0 z-10 border-b border-gray-200 shadow-sm">
            <TableRow className="hover:bg-transparent border-none h-11">
              <TableHead className="w-[120px] font-medium text-gray-500 pl-6" scope="col">功能模块</TableHead>
              <TableHead className="w-[120px] font-medium text-gray-500" scope="col">任务类型</TableHead>
              <TableHead className="w-[150px] font-medium text-gray-500" scope="col">事件名称</TableHead>
              <TableHead className="min-w-[200px] font-medium text-gray-500" scope="col">接收人</TableHead>
              <TableHead className="w-[180px] font-medium text-gray-500" scope="col">机器人</TableHead>
              <TableHead className="w-[100px] font-medium text-gray-500" scope="col">状态</TableHead>
              <TableHead className="w-[120px] text-center font-medium text-gray-500 pr-6" scope="col">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div role="status" aria-live="polite" aria-label="正在加载消息配置">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" aria-hidden="true" />
                    <span className="sr-only">正在加载...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : flattenedConfigs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="text-gray-400 flex flex-col items-center gap-2" role="status">
                    <Bell className="w-10 h-10 opacity-20" aria-hidden="true" />
                    <span>暂无消息配置</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              flattenedConfigs.map((config, index) => (
                <MessageConfigRow
                  key={`${config.type}-${config.taskType}-${config.detail.event}-${index}`}
                  typeName={config.typeName}
                  taskType={config.taskType}
                  taskTypeName={config.taskTypeName}
                  detail={config.detail}
                  robots={robots}
                  projectId={projectId}
                  saving={saving}
                  onUpdate={updateMessageConfig}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
});
