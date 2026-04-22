/**
 * RequirementListDialog 组件
 * 需求列表弹窗组件
 * 从 EfficiencyDashboard.tsx 提取
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Requirement } from '@/services/case-management/service-case-metrics';

/**
 * RequirementListDialog 组件 Props
 */
export interface RequirementListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  requirements: Requirement[];
}

/**
 * RequirementListDialog 组件
 */
export const RequirementListDialog = React.memo<RequirementListDialogProps>(function RequirementListDialog({
  isOpen,
  onClose,
  date,
  requirements,
}: RequirementListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <style>{`
        [data-slot="dialog-content"] button[data-slot="dialog-close"] {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: rgb(156, 163, 175) !important;
        }
        [data-slot="dialog-content"] button[data-slot="dialog-close"]:hover {
          background-color: rgba(55, 65, 81, 0.5) !important;
          color: rgb(255, 255, 255) !important;
        }
        [data-slot="dialog-content"] button[data-slot="dialog-close"][data-state="open"] {
          background-color: transparent !important;
          color: rgb(156, 163, 175) !important;
        }
        [data-slot="dialog-content"] button[data-slot="dialog-close"]:focus {
          outline: none !important;
          ring: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            需求列表 - {date}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          {requirements.length === 0 ? (
            <div className="text-gray-400 text-center py-8">暂无需求数据</div>
          ) : (
            requirements.map((req, index) => (
              <div
                key={req.storyId || index}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{req.storyName || '未命名需求'}</div>
                    <div className="text-gray-400 text-sm space-x-4">
                      <span>需求ID: {req.storyId}</span>
                      {req.relatedCaseCount !== undefined && (
                        <span>关联用例: {req.relatedCaseCount}</span>
                      )}
                      {req.relatedTestPlanCount !== undefined && (
                        <span>关联测试计划: {req.relatedTestPlanCount}</span>
                      )}
                      {req.defectCount !== undefined && (
                        <span>缺陷数: {req.defectCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
