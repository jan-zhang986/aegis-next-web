/**
 * DeletePublicNodeDialog Component
 * 删除公共节点确认对话框组件
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import React from 'react';
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

interface DeletePublicNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicNodeName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const DeletePublicNodeDialog: React.FC<DeletePublicNodeDialogProps> = ({
  open,
  onOpenChange,
  publicNodeName,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除公共节点</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除公共节点 <span className="font-semibold text-gray-900">"{publicNodeName}"</span> 吗？此操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            确定删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
