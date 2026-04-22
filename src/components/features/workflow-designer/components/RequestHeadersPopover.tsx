/**
 * RequestHeadersPopover 组件
 * 请求头设置弹窗（Popover）
 */

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RequestHeadersPopoverProps {
  projectId: string;
  userVariableXTagHeader: string;
  setUserVariableXTagHeader: (value: string) => void;
  userVariableXSiteTenant: string;
  setUserVariableXSiteTenant: (value: string) => void;
  userVariableXTenantId: string;
  setUserVariableXTenantId: (value: string) => void;
  userVariableXApp: string;
  setUserVariableXApp: (value: string) => void;
}

export const RequestHeadersPopover: React.FC<RequestHeadersPopoverProps> = ({
  projectId,
  userVariableXTagHeader,
  setUserVariableXTagHeader,
  userVariableXSiteTenant,
  setUserVariableXSiteTenant,
  userVariableXTenantId,
  setUserVariableXTenantId,
  userVariableXApp,
  setUserVariableXApp,
}) => {
  const [open, setOpen] = useState(false);

  // 检查是否有已设置的请求头
  const hasHeaders = userVariableXTagHeader || userVariableXSiteTenant || userVariableXTenantId || userVariableXApp;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          title="请求头设置"
        >
          <Settings className="w-4 h-4" />
          请求头
          {hasHeaders && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">请求头设置</h4>
            <p className="text-xs text-gray-500">
              设置的值将保存到浏览器缓存，刷新后自动恢复
            </p>
          </div>
          
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="x-tag-header" className="text-xs">
                X-Tag-Header
              </Label>
              <Input
                id="x-tag-header"
                className="h-8 text-xs"
                value={userVariableXTagHeader}
                onChange={(e) => setUserVariableXTagHeader(e.target.value)}
                placeholder="请输入 X-Tag-Header"
              />
            </div>
            
            <div className="grid gap-1.5">
              <Label htmlFor="x-site-tenant" className="text-xs">
                X-Site-Tenant
              </Label>
              <Input
                id="x-site-tenant"
                className="h-8 text-xs"
                value={userVariableXSiteTenant}
                onChange={(e) => setUserVariableXSiteTenant(e.target.value)}
                placeholder="请输入 X-Site-Tenant"
              />
            </div>
            
            <div className="grid gap-1.5">
              <Label htmlFor="x-tenant-id" className="text-xs">
                X-Tenant-Id
              </Label>
              <Input
                id="x-tenant-id"
                className="h-8 text-xs"
                value={userVariableXTenantId}
                onChange={(e) => setUserVariableXTenantId(e.target.value)}
                placeholder="请输入 X-Tenant-Id"
              />
            </div>
            
            <div className="grid gap-1.5">
              <Label htmlFor="x-app" className="text-xs">
                X-App
              </Label>
              <Input
                id="x-app"
                className="h-8 text-xs"
                value={userVariableXApp}
                onChange={(e) => setUserVariableXApp(e.target.value)}
                placeholder="请输入 X-App"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
