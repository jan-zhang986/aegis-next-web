/**
 * MessageConfigRow Component
 * 消息配置行组件 - 单行配置展示和编辑
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { MessageTaskDetail, Robot } from '@/types/message';

interface MessageConfigRowProps {
  typeName: string;
  taskType: string;
  taskTypeName: string;
  detail: MessageTaskDetail;
  robots: Robot[];
  projectId: string;
  saving: boolean;
  onUpdate: (params: {
    projectId: string;
    taskType: string;
    event: string;
    robotId: string;
    receiverIds: string[];
    enable: boolean;
  }) => Promise<void>;
  onEditTemplate?: (detail: MessageTaskDetail) => void;
  onPreview?: (detail: MessageTaskDetail) => void;
}

export const MessageConfigRow = memo(function MessageConfigRow({
  typeName,
  taskType,
  taskTypeName,
  detail,
  robots,
  projectId,
  saving,
  onUpdate,
  onEditTemplate,
  onPreview,
}: MessageConfigRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // 使用 useMemo 缓存计算结果
  const currentRobotId = useMemo(() => {
    const robotIds = Object.keys(detail.projectRobotConfigMap);
    return robotIds.length > 0 ? robotIds[0] : null;
  }, [detail.projectRobotConfigMap]);

  const isEnabled = useMemo(() => {
    if (!currentRobotId) return false;
    return detail.projectRobotConfigMap[currentRobotId]?.enable || false;
  }, [detail.projectRobotConfigMap, currentRobotId]);

  const enabledRobots = useMemo(() => {
    return robots.filter(r => r.enable);
  }, [robots]);

  const receiverIds = useMemo(() => {
    return detail.receivers.map(r => r.id);
  }, [detail.receivers]);

  // 使用 useCallback 稳定回调引用
  const handleRobotAssign = useCallback(async (robotId: string) => {
    if (robotId === 'none') return;

    const robotConfig = detail.projectRobotConfigMap[robotId];
    if (!robotConfig) {
      toast.error('机器人配置不存在');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({
        projectId,
        taskType,
        event: detail.event,
        robotId,
        receiverIds,
        enable: robotConfig.enable,
      });
      toast.success('机器人分配成功');
    } catch (error) {
      console.error('机器人分配失败:', error);
      toast.error('机器人分配失败');
    } finally {
      setIsUpdating(false);
    }
  }, [detail.projectRobotConfigMap, detail.event, onUpdate, projectId, taskType, receiverIds]);

  const handleToggleEnable = useCallback(async (enable: boolean) => {
    if (!currentRobotId) {
      toast.error('请先分配机器人');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({
        projectId,
        taskType,
        event: detail.event,
        robotId: currentRobotId,
        receiverIds,
        enable,
      });
      toast.success(enable ? '已启用' : '已禁用');
    } catch (error) {
      console.error('状态切换失败:', error);
      toast.error('状态切换失败');
    } finally {
      setIsUpdating(false);
    }
  }, [currentRobotId, detail.event, onUpdate, projectId, taskType, receiverIds]);

  const handleEditTemplate = useCallback(() => {
    if (!currentRobotId) {
      toast.error('请先分配机器人');
      return;
    }
    onEditTemplate?.(detail);
  }, [currentRobotId, detail, onEditTemplate]);

  const handlePreview = useCallback(() => {
    if (!currentRobotId) {
      toast.error('请先分配机器人');
      return;
    }
    onPreview?.(detail);
  }, [currentRobotId, detail, onPreview]);

  const isDisabled = saving || isUpdating;

  return (
    <TableRow className="group transition-colors [&_td]:transition-colors [&_td]:group-hover:bg-[#f2f3f5] border-b border-gray-100 h-11">
      <TableCell className="pl-6">
        <span className="text-sm text-gray-700">{typeName}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-700">{taskTypeName}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-700">{detail.eventName}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {detail.receivers.length === 0 ? (
            <span className="text-sm text-gray-400">未设置</span>
          ) : (
            <>
              {detail.receivers.slice(0, 3).map(receiver => (
                <Badge
                  key={receiver.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {receiver.name}
                </Badge>
              ))}
              {detail.receivers.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{detail.receivers.length - 3}
                </Badge>
              )}
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={currentRobotId || 'none'}
          onValueChange={handleRobotAssign}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="选择机器人" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未分配</SelectItem>
            {enabledRobots.map(robot => (
              <SelectItem key={robot.id} value={robot.id}>
                {robot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggleEnable}
          disabled={!currentRobotId || isDisabled}
        />
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          {onPreview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={handlePreview}
              disabled={!currentRobotId || isDisabled}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          {onEditTemplate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleEditTemplate}
              disabled={!currentRobotId || isDisabled}
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
