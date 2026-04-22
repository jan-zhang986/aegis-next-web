/**
 * RobotCard Component
 * 机器人卡片组件 - 展示单个机器人信息
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, MessageSquare } from 'lucide-react';
import type { Robot } from '@/types/message';

interface RobotCardProps {
  robot: Robot;
  onEdit: (robot: Robot) => void;
  onDelete: (robotId: string) => Promise<void>;
  onToggleStatus: (robotId: string) => Promise<void>;
  disabled?: boolean;
}

// 平台名称映射 - 移到组件外部避免重复创建
const PLATFORM_NAMES: Record<string, string> = {
  WE_COM: '企业微信',
  DING_TALK: '钉钉',
  LARK: '飞书',
  CUSTOM: '自定义',
  IN_SITE: '站内信',
  MAIL: '邮件',
};

// 平台颜色映射 - 移到组件外部避免重复创建
const PLATFORM_COLORS: Record<string, string> = {
  WE_COM: 'bg-green-50 text-green-600',
  DING_TALK: 'bg-blue-50 text-blue-600',
  LARK: 'bg-purple-50 text-purple-600',
  CUSTOM: 'bg-gray-50 text-gray-600',
  IN_SITE: 'bg-orange-50 text-orange-600',
  MAIL: 'bg-red-50 text-red-600',
};

export const RobotCard = memo(function RobotCard({
  robot,
  onEdit,
  onDelete,
  onToggleStatus,
  disabled = false,
}: RobotCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // 使用 useMemo 缓存计算结果
  const platformName = useMemo(() => {
    return PLATFORM_NAMES[robot.platform] || robot.platform;
  }, [robot.platform]);

  const platformColor = useMemo(() => {
    return PLATFORM_COLORS[robot.platform] || 'bg-gray-50 text-gray-600';
  }, [robot.platform]);

  // 使用 useCallback 稳定回调引用
  const handleEdit = useCallback(() => {
    onEdit(robot);
  }, [onEdit, robot]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(robot.id);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, robot.id]);

  const handleToggle = useCallback(async () => {
    setIsToggling(true);
    try {
      await onToggleStatus(robot.id);
    } catch (error) {
      // Error is handled in parent
    } finally {
      setIsToggling(false);
    }
  }, [onToggleStatus, robot.id]);

  return (
    <>
      <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-gray-200/60 rounded-xl overflow-hidden group" role="article" aria-label={`机器人：${robot.name}`}>
        <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30 group-hover:bg-blue-50/30 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/60 flex items-center justify-center shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                <MessageSquare className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900 truncate" title={robot.name}>
                {robot.name}
              </h3>
            </div>
            <Switch
              checked={robot.enable}
              onCheckedChange={handleToggle}
              disabled={disabled || isToggling}
              className="ml-2 data-[state=checked]:bg-blue-600"
              aria-label={`${robot.enable ? '禁用' : '启用'}机器人 ${robot.name}`}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 平台类型 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium tracking-tight">平台类型</span>
            <Badge className={`${platformColor} border-0 shadow-none px-2 py-0 h-5 rounded-md text-[10px] font-bold uppercase transition-all`} aria-label={`平台：${platformName}`}>
              {platformName}
            </Badge>
          </div>

          {/* 钉钉类型（如果是钉钉） */}
          {robot.platform === 'DING_TALK' && robot.type && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">钉钉类型</span>
              <Badge variant="outline" className="text-xs">
                {robot.type === 'CUSTOM' ? '自定义' : '企业'}
              </Badge>
            </div>
          )}

          {/* Webhook URL */}
          {robot.webhook && (
            <div className="space-y-1">
              <span className="text-sm text-gray-500">Webhook</span>
              <p className="text-xs text-gray-600 truncate" title={robot.webhook}>
                {robot.webhook}
              </p>
            </div>
          )}

          {/* 企业钉钉配置 */}
          {robot.platform === 'DING_TALK' && robot.type === 'ENTERPRISE' && (
            <>
              {robot.appKey && (
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">AppKey</span>
                  <p className="text-xs text-gray-600 truncate" title={robot.appKey}>
                    {robot.appKey}
                  </p>
                </div>
              )}
              {robot.appSecret && (
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">AppSecret</span>
                  <p className="text-xs text-gray-600" aria-label="AppSecret已隐藏">••••••••</p>
                </div>
              )}
            </>
          )}

          {/* 描述 */}
          {robot.description && (
            <div className="space-y-1">
              <span className="text-sm text-gray-500">描述</span>
              <p className="text-xs text-gray-600 line-clamp-2">
                {robot.description}
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100" role="group" aria-label="机器人操作">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-medium"
              onClick={handleEdit}
              disabled={disabled}
              aria-label={`编辑机器人 ${robot.name}`}
            >
              <Edit className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              编辑
            </Button>
            <div className="w-px h-4 bg-gray-100" />
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-medium"
              onClick={handleDeleteClick}
              disabled={disabled}
              aria-label={`删除机器人 ${robot.name}`}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              删除
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent role="alertdialog" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description">
          <AlertDialogHeader>
            <AlertDialogTitle id="delete-dialog-title">确认删除机器人</AlertDialogTitle>
            <AlertDialogDescription id="delete-dialog-description">
              确定要删除机器人 "{robot.name}" 吗？删除后，所有使用该机器人的消息配置将失效。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              aria-label={isDeleting ? '正在删除机器人' : '确认删除机器人'}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
