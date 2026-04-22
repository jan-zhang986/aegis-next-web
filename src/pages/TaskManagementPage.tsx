/**
 * 任务中心页面（一级菜单）
 * 二级：拨测任务 | 用例任务 | 用例任务详情 | 系统后台任务
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExecutorTaskView } from '@/components/features/dial-management';
import { SystemTaskCenterView } from '@/components/features/system-setting';

interface TaskManagementPageProps {
  selectedTopMenu?: string;
}

export function TaskManagementPage({ selectedTopMenu = 'tasks' }: TaskManagementPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskIdFromUrl = searchParams.get('taskId') ?? '';

  const isDialTask = selectedTopMenu === 'tasks';
  const isCaseTask = selectedTopMenu === 'case-task';
  const isCaseTaskDetail = selectedTopMenu === 'case-task-detail';
  const isSchedule = selectedTopMenu === 'schedule';
  const isTaskCenter = isCaseTask || isCaseTaskDetail || isSchedule;

  const handleNavigateToDetail = (taskId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('menu', 'task-management');
    params.set('tab', 'case-task-detail');
    params.set('taskId', taskId);
    navigate(`?${params.toString()}`);
  };

  const handleNavigateToExecute = () => {
    const params = new URLSearchParams(searchParams);
    params.set('menu', 'task-management');
    params.set('tab', 'case-task');
    params.delete('taskId');
    navigate(`?${params.toString()}`);
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-6">
        {isDialTask && (
          <div className="shrink-0 mb-4">
            <h1 className="text-xl font-semibold text-gray-900">任务中心</h1>
          </div>
        )}
        <div key={selectedTopMenu} className="flex-1 min-h-0 flex flex-col overflow-auto bg-gray-50/20 custom-scrollbar animate-in fade-in duration-500">
          {isDialTask && <ExecutorTaskView />}
          {isCaseTask && (
            <SystemTaskCenterView
              scope="system"
              fixedTab="execute"
              onNavigateToDetail={handleNavigateToDetail}
            />
          )}
          {isCaseTaskDetail && (
            <SystemTaskCenterView
              scope="system"
              fixedTab="detail"
              initialTaskId={taskIdFromUrl}
              onNavigateToExecute={handleNavigateToExecute}
            />
          )}
          {isSchedule && (
            <SystemTaskCenterView scope="system" fixedTab="schedule" />
          )}
        </div>
      </div>
    </div>
  );
}
