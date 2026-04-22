/**
 * RobotList Component
 * 机器人列表组件 - 卡片网格布局
 */

import { useState } from 'react';
import { useRobotManagement } from '@/hooks/message';
import { Button } from '@/components/ui/button';
import { Plus, Bot, RefreshCw } from 'lucide-react';
import { RobotCard } from './RobotCard';
import { RobotFormDialog } from './RobotFormDialog';
import type { Robot, RobotAddParams, RobotEditParams } from '@/types/message';

interface RobotListProps {
  projectId: string;
}

export function RobotList({ projectId }: RobotListProps) {
  const {
    robots,
    loading,
    submitting,
    createRobot,
    editRobot,
    removeRobot,
    toggleRobotStatus,
    refresh,
  } = useRobotManagement(projectId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);

  // 处理添加机器人
  const handleAdd = () => {
    setEditingRobot(null);
    setIsDialogOpen(true);
  };

  // 处理编辑机器人
  const handleEdit = (robot: Robot) => {
    setEditingRobot(robot);
    setIsDialogOpen(true);
  };

  // 处理保存（创建或更新）
  const handleSave = async (data: RobotAddParams | RobotEditParams) => {
    try {
      if (editingRobot) {
        await editRobot(data as RobotEditParams);
      } else {
        await createRobot(data as RobotAddParams);
      }
      setIsDialogOpen(false);
      setEditingRobot(null);
    } catch (error) {
      // Error is handled in the hook
      throw error;
    }
  };

  // 处理删除
  const handleDelete = async (robotId: string) => {
    await removeRobot(robotId);
  };

  // 处理状态切换
  const handleToggleStatus = async (robotId: string) => {
    await toggleRobotStatus(robotId);
  };

  return (
    <section className="flex flex-col h-full bg-white" aria-label="机器人管理">
      {/* 工具栏 */}
      <header className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">机器人管理</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium" aria-label={`共 ${robots.length} 个机器人`}>
                {robots.length}
              </span>
            </div>
            <p className="text-xs text-gray-500">配置第三方机器人 Webhook 进行消息推送</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleAdd}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 px-4"
            disabled={submitting}
            aria-label="添加新机器人"
          >
            <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
            添加机器人
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            onClick={refresh}
            disabled={loading}
            aria-label="刷新机器人列表"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </Button>
        </div>
      </header>

      {/* 机器人卡片网格 */}
      <div className="flex-1 overflow-auto p-6" role="region" aria-label="机器人列表">
        {loading ? (
          <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" aria-hidden="true" />
            <span className="sr-only">正在加载机器人列表...</span>
          </div>
        ) : robots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400" role="status">
            <Bot className="w-16 h-16 opacity-20 mb-4" aria-hidden="true" />
            <p className="text-base mb-2">暂无机器人</p>
            <p className="text-sm">点击"添加机器人"按钮创建第一个机器人</p>
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="list"
          >
            {robots.map(robot => (
              <li key={robot.id}>
                <RobotCard
                  robot={robot}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  disabled={submitting}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 机器人表单对话框 */}
      <RobotFormDialog
        open={isDialogOpen}
        robot={editingRobot}
        projectId={projectId}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingRobot(null);
        }}
        onSave={handleSave}
      />
    </section>
  );
}
