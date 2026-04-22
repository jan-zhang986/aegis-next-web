/**
 * Project and User List Hook
 * 管理项目和用户列表加载逻辑
 * 从 EfficiencyDashboard.tsx 提取
 */

import { useState, useEffect } from 'react';
import { http } from '@/utils/request';

interface UseProjectAndUserListReturn {
  projects: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email?: string }>;
  setSelectedProjects: React.Dispatch<React.SetStateAction<string[]>>;
}

interface UseProjectAndUserListParams {
  selectedProjects: string[];
  setSelectedProjects: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Project and User List Hook
 */
export function useProjectAndUserList({
  selectedProjects,
  setSelectedProjects,
}: UseProjectAndUserListParams): UseProjectAndUserListReturn {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email?: string }>>([]);

  // 加载项目列表，并校正选中项（移除无效 id）
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await http.get('/project/list/public');

        if (Array.isArray(response) && response.length > 0) {
          const projectList = response.map((p: any) => ({
            id: p.id,
            name: p.name || p.id,
          }));

          setProjects(projectList);
          setSelectedProjects((prev) => {
            const currentId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
            const hasValidCurrent = currentId && currentId !== 'no_such_project' && projectList.some((p: any) => p.id === currentId);
            if (hasValidCurrent && (prev.length === 0 || prev.includes('all'))) return [currentId];
            if (prev.length === 0 || prev.includes('all')) return prev;
            const valid = prev.filter((id) => projectList.some((p: any) => p.id === id));
            return valid.length === 0 ? ['all'] : valid;
          });
        } else if (response && typeof response === 'object' && 'code' in response) {
          if (response.code === 100200 && Array.isArray(response.data)) {
            const projectList = response.data.map((p: any) => ({
              id: p.id,
              name: p.name || p.id,
            }));

            if (projectList.length > 0) {
              setProjects(projectList);
              setSelectedProjects((prev) => {
                const currentId = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
                const hasValidCurrent = currentId && currentId !== 'no_such_project' && projectList.some((p: any) => p.id === currentId);
                if (hasValidCurrent && (prev.length === 0 || prev.includes('all'))) return [currentId];
                if (prev.length === 0 || prev.includes('all')) return prev;
                const valid = prev.filter((id) => projectList.some((p: any) => p.id === id));
                return valid.length === 0 ? ['all'] : valid;
              });
            }
          }
        }
      } catch (err: any) {
        console.error('加载项目列表失败:', err);

        const urlParams = new URLSearchParams(window.location.search);
        const projectIdFromUrl = urlParams.get('projectId') || urlParams.get('pId');
        if (projectIdFromUrl) {
          setSelectedProjects([projectIdFromUrl]);
          setProjects([{ id: projectIdFromUrl, name: '当前项目' }]);
        }
      }
    };
    loadProjects();
  }, [setSelectedProjects]);

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await http.get('/system/user/list/public');

        if (Array.isArray(response) && response.length > 0) {
          const userList = response.map((u: any) => ({
            id: u.id,
            name: u.name || u.email || u.id,
            email: u.email,
          }));

          setUsers(userList);
        } else if (response && typeof response === 'object' && 'code' in response) {
          if (response.code === 100200 && Array.isArray(response.data)) {
            const userList = response.data.map((u: any) => ({
              id: u.id,
              name: u.name || u.email || u.id,
              email: u.email,
            }));

            if (userList.length > 0) {
              setUsers(userList);
            }
          }
        }
      } catch (err) {
        console.error('加载用户列表失败:', err);
      }
    };
    loadUsers();
  }, []);

  return {
    projects,
    users,
    setSelectedProjects,
  };
}
