/**
 * SaveToPublicDialog 组件
 * 保存节点到公共节点的对话框
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
import { Textarea } from '@/components/ui/textarea';

interface SaveToPublicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicNodeName: string;
  setPublicNodeName: (name: string) => void;
  publicNodeDescription: string;
  setPublicNodeDescription: (description: string) => void;
  onConfirm: () => void;
}

export const SaveToPublicDialog: React.FC<SaveToPublicDialogProps> = ({
  open,
  onOpenChange,
  publicNodeName,
  setPublicNodeName,
  publicNodeDescription,
  setPublicNodeDescription,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>保存到公共节点</DialogTitle>
          <DialogDescription>
            将当前节点保存为公共节点，可在项目内复用
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publicNodeName">节点名称 *</Label>
            <Input
              id="publicNodeName"
              placeholder="请输入节点名称"
              value={publicNodeName}
              onChange={(e) => setPublicNodeName(e.target.value)}
              className="border border-gray-300"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="publicNodeDescription">节点描述</Label>
            <Textarea
              id="publicNodeDescription"
              placeholder="请输入节点描述（可选）"
              value={publicNodeDescription}
              onChange={(e) => setPublicNodeDescription(e.target.value)}
              rows={3}
              className="border border-gray-300"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onConfirm}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
