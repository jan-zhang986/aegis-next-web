/**
 * 用例生成 - Agent 选择器
 * 从 aegis-rag-frontend AgentSelector.vue 迁移
 * 支持内置智能体（快速问答、智能推理）和自定义智能体
 */

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, Check, Loader2 } from 'lucide-react';
import { agentService } from '@/services/agent';
import { AgentAvatar } from '@/components/features/agent/AgentAvatar';
import type { CustomAgent } from '@/types/agent';
import { BUILTIN_QUICK_ANSWER_ID, BUILTIN_SMART_REASONING_ID } from '@/types/agent';

interface Props {
  visible: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  currentAgentId: string;
  onClose: () => void;
  onSelect: (agent: CustomAgent) => void;
}

const BUILTIN_LABELS: Record<string, string> = {
  [BUILTIN_QUICK_ANSWER_ID]: '快速问答',
  [BUILTIN_SMART_REASONING_ID]: '智能推理',
};

const BUILTIN_DESCS: Record<string, string> = {
  [BUILTIN_QUICK_ANSWER_ID]: '快速响应，直接回答问题',
  [BUILTIN_SMART_REASONING_ID]: '深度思考，多步推理解决问题',
};

const DROPDOWN_MAX_HEIGHT = 320;
const GAP = 8;

export function CaseGenerationAgentSelector({
  visible,
  anchorRef,
  currentAgentId,
  onClose,
  onSelect,
}: Props) {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  const builtinAgents = agents.filter((a) => a.is_builtin);
  const customAgents = agents.filter((a) => !a.is_builtin);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await agentService.list();
      const data = (res as any)?.data ?? [];
      setAgents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load agents:', e);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && anchorRef.current) {
      loadAgents();
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - GAP;
      const spaceAbove = rect.top - GAP;
      const openAbove = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
      setPosition({
        left: rect.left,
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + GAP }
          : { top: rect.bottom + GAP }),
      });
    } else if (!visible) {
      setPosition(null);
    }
  }, [visible]);

  if (!visible) return null;

  const getAgentLabel = (agent: CustomAgent) =>
    BUILTIN_LABELS[agent.id] ?? agent.name;

  const getAgentDesc = (agent: CustomAgent) =>
    BUILTIN_DESCS[agent.id] ?? agent.description ?? '暂无描述';

  const isAgentMode = (agent: CustomAgent) =>
    agent.config?.agent_mode === 'smart-reasoning';

  const dropdownContent = (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden
      />
      {position && (
      <div
        className="fixed z-[9999] w-[220px] max-h-[320px] flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden"
        style={{ left: position.left, top: position.top, bottom: position.bottom }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
          <span>选择智能体</span>
          <Link
            to="/?menu=aegis-agent&tab=agents"
            onClick={onClose}
            className="text-primary hover:underline"
          >
            + 管理智能体
          </Link>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {builtinAgents.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    内置智能体
                  </div>
                  {builtinAgents.map((agent) => {
                    const isSelected = currentAgentId === agent.id;
                    const isReasoning = agent.id === BUILTIN_SMART_REASONING_ID;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => {
                          onSelect(agent);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
                            isReasoning
                              ? 'bg-primary/20 text-primary'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          {isReasoning ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="flex-1 truncate">{getAgentLabel(agent)}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {customAgents.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    自定义智能体
                  </div>
                  {customAgents.map((agent) => {
                    const isSelected = currentAgentId === agent.id;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => {
                          onSelect(agent);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <AgentAvatar name={agent.name} size="small" />
                        <span className="flex-1 truncate">{agent.name}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {!loading && builtinAgents.length === 0 && customAgents.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无智能体
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </>
  );

  return createPortal(dropdownContent, document.body);
}
