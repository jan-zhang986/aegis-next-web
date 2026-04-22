/**
 * RobotFormDialog Component
 * 机器人表单对话框 - 创建和编辑机器人
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTrapFocus } from '@/hooks/useKeyboardNavigation';
import type { Robot, RobotPlatform, DingtalkType, RobotAddParams, RobotEditParams } from '@/types/message';

interface RobotFormDialogProps {
  open: boolean;
  robot: Robot | null;
  projectId: string;
  onClose: () => void;
  onSave: (data: RobotAddParams | RobotEditParams) => Promise<void>;
}

export function RobotFormDialog({
  open,
  robot,
  projectId,
  onClose,
  onSave,
}: RobotFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    platform: 'DING_TALK' as RobotPlatform,
    type: 'CUSTOM' as DingtalkType,
    webhook: '',
    appKey: '',
    appSecret: '',
    enable: true,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 焦点捕获
  const dialogRef = useTrapFocus(open);

  // 初始化表单数据
  useEffect(() => {
    if (robot) {
      setFormData({
        name: robot.name,
        platform: robot.platform,
        type: robot.type || 'CUSTOM',
        webhook: robot.webhook || '',
        appKey: robot.appKey || '',
        appSecret: robot.appSecret || '',
        enable: robot.enable,
        description: robot.description || '',
      });
    } else {
      setFormData({
        name: '',
        platform: 'DING_TALK',
        type: 'CUSTOM',
        webhook: '',
        appKey: '',
        appSecret: '',
        enable: true,
        description: '',
      });
    }
    setErrors({});
  }, [robot, open]);

  // 表单验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入机器人名称';
    }

    // Webhook 必填验证（除了站内信和邮件）
    if (!['IN_SITE', 'MAIL'].includes(formData.platform) && !formData.webhook.trim()) {
      newErrors.webhook = '请输入 Webhook URL';
    }

    // 企业钉钉必填字段验证
    if (formData.platform === 'DING_TALK' && formData.type === 'ENTERPRISE') {
      if (!formData.appKey.trim()) {
        newErrors.appKey = '请输入 AppKey';
      }
      if (!formData.appSecret.trim()) {
        newErrors.appSecret = '请输入 AppSecret';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理保存
  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      const data: RobotAddParams | RobotEditParams = {
        ...(robot ? { id: robot.id } : {}),
        projectId,
        name: formData.name.trim(),
        platform: formData.platform,
        ...(formData.platform === 'DING_TALK' ? { type: formData.type } : {}),
        ...(formData.webhook ? { webhook: formData.webhook.trim() } : {}),
        ...(formData.appKey ? { appKey: formData.appKey.trim() } : {}),
        ...(formData.appSecret ? { appSecret: formData.appSecret.trim() } : {}),
        enable: formData.enable,
      } as RobotAddParams | RobotEditParams;

      await onSave(data);
      toast.success(robot ? '机器人更新成功' : '机器人创建成功');
      onClose();
    } catch (error) {
      console.error('保存机器人失败:', error);
      toast.error(robot ? '机器人更新失败' : '机器人创建失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 是否需要显示钉钉类型选择
  const showDingtalkType = formData.platform === 'DING_TALK';

  // 是否需要显示 Webhook
  const showWebhook = !['IN_SITE', 'MAIL'].includes(formData.platform);

  // 是否需要显示企业钉钉配置
  const showEnterpriseConfig = formData.platform === 'DING_TALK' && formData.type === 'ENTERPRISE';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{robot ? '编辑机器人' : '添加机器人'}</DialogTitle>
          <DialogDescription>
            {robot ? '修改机器人配置信息' : '创建新的消息通知机器人'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 机器人名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              机器人名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入机器人名称"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 平台类型 */}
          <div className="space-y-2">
            <Label htmlFor="platform">
              平台类型 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.platform}
              onValueChange={(value) =>
                setFormData({ ...formData, platform: value as RobotPlatform })
              }
            >
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WE_COM">企业微信</SelectItem>
                <SelectItem value="DING_TALK">钉钉</SelectItem>
                <SelectItem value="LARK">飞书</SelectItem>
                <SelectItem value="CUSTOM">自定义</SelectItem>
                <SelectItem value="IN_SITE">站内信</SelectItem>
                <SelectItem value="MAIL">邮件</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 钉钉类型 */}
          {showDingtalkType && (
            <div className="space-y-2">
              <Label htmlFor="dingtalk-type">钉钉类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as DingtalkType })
                }
              >
                <SelectTrigger id="dingtalk-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM">自定义机器人</SelectItem>
                  <SelectItem value="ENTERPRISE">企业内部机器人</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Webhook URL */}
          {showWebhook && (
            <div className="space-y-2">
              <Label htmlFor="webhook">
                Webhook URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="webhook"
                value={formData.webhook}
                onChange={(e) => setFormData({ ...formData, webhook: e.target.value })}
                placeholder="https://..."
                className={errors.webhook ? 'border-red-500' : ''}
              />
              {errors.webhook && (
                <p className="text-sm text-red-500">{errors.webhook}</p>
              )}
            </div>
          )}

          {/* 企业钉钉配置 */}
          {showEnterpriseConfig && (
            <>
              <div className="space-y-2">
                <Label htmlFor="appKey">
                  AppKey <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="appKey"
                  value={formData.appKey}
                  onChange={(e) => setFormData({ ...formData, appKey: e.target.value })}
                  placeholder="请输入 AppKey"
                  className={errors.appKey ? 'border-red-500' : ''}
                />
                {errors.appKey && (
                  <p className="text-sm text-red-500">{errors.appKey}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appSecret">
                  AppSecret <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="appSecret"
                  type="password"
                  value={formData.appSecret}
                  onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                  placeholder="请输入 AppSecret"
                  className={errors.appSecret ? 'border-red-500' : ''}
                />
                {errors.appSecret && (
                  <p className="text-sm text-red-500">{errors.appSecret}</p>
                )}
              </div>
            </>
          )}

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入机器人描述（可选）"
              rows={3}
            />
          </div>

          {/* 启用状态 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enable">启用状态</Label>
            <Switch
              id="enable"
              checked={formData.enable}
              onCheckedChange={(checked) => setFormData({ ...formData, enable: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
