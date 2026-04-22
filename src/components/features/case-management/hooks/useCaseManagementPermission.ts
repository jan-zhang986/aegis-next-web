/**
 * 用例管理权限 Hook
 * 用于控制用例列表与详情抽屉中的编辑、复制、删除、分享、关注、评论等操作权限。
 * 当前默认全部为 true；后续可接入项目角色/权限 API（如 getUserRolePermissionSetting）进行细粒度控制。
 */

import { useState, useEffect, useMemo } from 'react';

export interface CaseManagementPermission {
  canEdit: boolean;
  canCopy: boolean;
  canDelete: boolean;
  canShare: boolean;
  canFollow: boolean;
  canComment: boolean;
}

export function useCaseManagementPermission(projectId?: string): CaseManagementPermission {
  const [permission, setPermission] = useState<CaseManagementPermission>({
    canEdit: true,
    canCopy: true,
    canDelete: true,
    canShare: true,
    canFollow: true,
    canComment: true,
  });

  useEffect(() => {
    // 预留：根据 projectId 与当前用户角色调用权限 API，更新 permission
    // 例如：projectManagementService.getUserRolePermissionSetting(roleId)
    // 或：caseManagementService.checkCasePermission(projectId, 'functional')
    // 当前无用例级权限 API，保持默认全部允许
    setPermission({
      canEdit: true,
      canCopy: true,
      canDelete: true,
      canShare: true,
      canFollow: true,
      canComment: true,
    });
  }, [projectId]);

  return useMemo(() => permission, [permission]);
}
