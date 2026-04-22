import { useState, useEffect } from 'react';
import { projectManagementService } from '@/services/project-management';

export function useUserNameMap(createUser: string | undefined): Map<string, string> {
  const [userNameMap, setUserNameMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!createUser || !/^\d+$/.test(createUser)) return;
    const load = async () => {
      try {
        const projectId = localStorage.getItem('currentProjectId');
        if (projectId) {
          const members = await projectManagementService.getProjectMemberOptions(projectId);
          const map = new Map<string, string>();
          members.forEach((m) => map.set(m.id, m.name));
          setUserNameMap(map);
        }
      } catch (e) {
        console.error('加载用户名称映射失败:', e);
      }
    };
    load();
  }, [createUser]);

  return userNameMap;
}
