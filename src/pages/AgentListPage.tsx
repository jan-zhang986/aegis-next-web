/**
 * 智能体列表页
 * 从 aegis-rag-frontend AgentList.vue 迁移
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  MessageSquare,
  Cpu,
  Search,
  Folder,
  Wrench,
  MessageCircle,
  Lock,
  Loader2,
} from 'lucide-react';
import { agentService } from '@/services/agent';
import type { CustomAgent } from '@/types/agent';
import { AgentAvatar } from '@/components/features/agent/AgentAvatar';
import { AgentEditorModal } from '@/components/features/agent/AgentEditorModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AgentListPage() {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<CustomAgent | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentService.list();
      const data = (res as any)?.data ?? (Array.isArray(res) ? res : []);
      setAgents(data);
    } catch (e: any) {
      toast.error(e?.message || '加载智能体列表失败');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCardClick = (agent: CustomAgent) => {
    setEditingAgent(agent);
    setEditorMode('edit');
    setEditorOpen(true);
  };

  const handleEdit = (agent: CustomAgent) => {
    setEditingAgent(agent);
    setEditorMode('edit');
    setEditorOpen(true);
  };

  const handleDelete = (agent: CustomAgent) => {
    setDeletingAgent(agent);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAgent) return;
    try {
      await agentService.delete(deletingAgent.id);
      toast.success('智能体已删除');
      setDeleteOpen(false);
      setDeletingAgent(null);
      fetchList();
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  };

  const handleCopy = async (agent: CustomAgent) => {
    try {
      await agentService.copy(agent.id);
      toast.success('智能体复制成功');
      fetchList();
    } catch (e: any) {
      toast.error(e?.message || '复制失败');
    }
  };

  const handleCreate = () => {
    setEditingAgent(null);
    setEditorMode('create');
    setEditorOpen(true);
  };

  const handleEditorSuccess = () => {
    setEditorOpen(false);
    setEditingAgent(null);
    fetchList();
  };

  const isAgentMode = (agent: CustomAgent) =>
    agent.config?.agent_mode === 'smart-reasoning';
  const isNormalMode = (agent: CustomAgent) =>
    agent.config?.agent_mode === 'quick-answer' || !agent.config?.agent_mode;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">智能体</h2>
          <p className="text-sm text-muted-foreground mt-1">
            配置和管理您的智能体，自定义对话行为和能力
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-32 h-32 mb-5 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-muted-foreground mb-2">
              暂无自定义智能体
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              点击右上角按钮创建您的第一个智能体
            </p>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white border-transparent">创建智能体</Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white border-transparent">创建智能体</Button>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onCardClick={() => handleCardClick(agent)}
                  onEdit={() => handleEdit(agent)}
                  onCopy={() => handleCopy(agent)}
                  onDelete={() => handleDelete(agent)}
                  isAgentMode={isAgentMode(agent)}
                  isNormalMode={isNormalMode(agent)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AgentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        agent={editingAgent}
        onSuccess={handleEditorSuccess}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除智能体</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除智能体「{deletingAgent?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AgentCard({
  agent,
  onCardClick,
  onEdit,
  onCopy,
  onDelete,
  isAgentMode,
  isNormalMode,
}: {
  agent: CustomAgent;
  onCardClick: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  isAgentMode: boolean;
  isNormalMode: boolean;
}) {
  const cfg = agent.config || {};
  return (
    <div
      onClick={onCardClick}
      className={`
        relative rounded-xl border p-4 flex flex-col h-[160px] cursor-pointer transition-all
        ${isNormalMode ? 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 hover:border-emerald-500 hover:shadow-emerald-100' : ''}
        ${isAgentMode ? 'border-violet-200 bg-gradient-to-br from-white to-violet-50/50 hover:border-violet-500 hover:shadow-violet-100' : ''}
        hover:shadow-md
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {agent.is_builtin ? (
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${isAgentMode
                  ? 'bg-violet-100 text-violet-600'
                  : 'bg-emerald-100 text-emerald-600'
                }`}
            >
              <Cpu className="w-4 h-4" />
            </div>
          ) : (
            <AgentAvatar name={agent.name} size="medium" />
          )}
          <span className="font-medium truncate" title={agent.name}>
            {agent.name}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="w-4 h-4 mr-2" /> 编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
              <Copy className="w-4 h-4 mr-2" /> 复制
            </DropdownMenuItem>
            {!agent.is_builtin && (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" /> 删除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-hidden text-sm text-muted-foreground line-clamp-2">
        {agent.description || '暂无描述'}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-md ${isAgentMode ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            title={isAgentMode ? '智能推理' : '快速问答'}
          >
            <Cpu className="w-3.5 h-3.5" />
          </div>
          {cfg.web_search_enabled && (
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-600"
              title="网络搜索"
            >
              <Search className="w-3.5 h-3.5" />
            </div>
          )}
          {(cfg.knowledge_bases?.length || cfg.kb_selection_mode === 'all') && (
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-600"
              title="知识库"
            >
              <Folder className="w-3.5 h-3.5" />
            </div>
          )}
          {(cfg.mcp_services?.length || cfg.mcp_selection_mode === 'all') && (
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md bg-pink-100 text-pink-600"
              title="MCP"
            >
              <Wrench className="w-3.5 h-3.5" />
            </div>
          )}
          {cfg.multi_turn_enabled && (
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600"
              title="多轮对话"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        {agent.is_builtin ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" /> 内置
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatDate(agent.updated_at)}
          </span>
        )}
      </div>
    </div>
  );
}
