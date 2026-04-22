/**
 * ExecutionEnvironmentDialog 组件
 * 执行环境选择对话框
 */

import React from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExecutionEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingExecutionType: 'debug' | 'run' | null;
  executionEnvironmentId: string;
  setExecutionEnvironmentId: (id: string) => void;
  loadingProfiles: boolean;
  engineProfiles: any[];
  userVariableXTagHeader: string;
  setUserVariableXTagHeader: (value: string) => void;
  userVariableXSiteTenant: string;
  setUserVariableXSiteTenant: (value: string) => void;
  userVariableXTenantId: string;
  setUserVariableXTenantId: (value: string) => void;
  userVariableXApp: string;
  setUserVariableXApp: (value: string) => void;
  onConfirm: () => void;
}

export const ExecutionEnvironmentDialog: React.FC<ExecutionEnvironmentDialogProps> = ({
  open,
  onOpenChange,
  pendingExecutionType,
  executionEnvironmentId,
  setExecutionEnvironmentId,
  loadingProfiles,
  engineProfiles,
  userVariableXTagHeader,
  setUserVariableXTagHeader,
  userVariableXSiteTenant,
  setUserVariableXSiteTenant,
  userVariableXTenantId,
  setUserVariableXTenantId,
  userVariableXApp,
  setUserVariableXApp,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>选择执行环境</DialogTitle>
          <DialogDescription>
            {pendingExecutionType === 'debug' 
              ? '请选择调试节点的执行环境'
              : '请选择运行工作流的执行环境'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="execution-environment">
              执行环境 <span className="text-red-500">*</span>
            </Label>
            {loadingProfiles ? (
              <div className="text-sm text-gray-500">加载环境中...</div>
            ) : engineProfiles.length === 0 ? (
              <div className="text-sm text-red-500">暂无可用环境，请先创建环境</div>
            ) : (
              <Select value={executionEnvironmentId} onValueChange={setExecutionEnvironmentId}>
                <SelectTrigger id="execution-environment" className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="请选择环境" />
                </SelectTrigger>
                <SelectContent>
                  {engineProfiles.map((profile: any) => {
                    const envId = profile.environmentId || profile.id;
                    const name = profile.environmentName || profile.name || '';
                    return (
                      <SelectItem key={envId} value={envId || ''}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="x-tag-header">X-Tag-Header</Label>
            <Input
              id="x-tag-header"
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={userVariableXTagHeader}
              onChange={(e) => setUserVariableXTagHeader(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="x-site-tenant">X-Site-Tenant</Label>
            <Input
              id="x-site-tenant"
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={userVariableXSiteTenant}
              onChange={(e) => setUserVariableXSiteTenant(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="x-tenant-id">X-Tenant-Id</Label>
            <Input
              id="x-tenant-id"
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={userVariableXTenantId}
              onChange={(e) => setUserVariableXTenantId(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="x-app">X-App</Label>
            <Input
              id="x-app"
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={userVariableXApp}
              onChange={(e) => setUserVariableXApp(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!executionEnvironmentId || loadingProfiles || engineProfiles.length === 0}
          >
            确认执行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
