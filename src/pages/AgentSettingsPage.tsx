/**
 * Agent 设置页
 * 从 aegis-rag-frontend Settings.vue 迁移
 * 包含：常规、模型、Ollama、网络搜索、MCP、系统信息等
 */

import { useState } from 'react';
import { Cpu, Server, Search, Wrench, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

import { AgentModelSettings } from '@/components/features/agent-settings/AgentModelSettings';
import { AgentOllamaSettings } from '@/components/features/agent-settings/AgentOllamaSettings';
import { AgentWebSearchSettings } from '@/components/features/agent-settings/AgentWebSearchSettings';
import { AgentMcpSettings } from '@/components/features/agent-settings/AgentMcpSettings';

const NAV_ITEMS = [
  { key: 'models', icon: Cpu, label: '模型管理', description: '' },
  { key: 'ollama', icon: Server, label: 'Ollama', description: '本地 Ollama 服务连接配置' },
  { key: 'websearch', icon: Search, label: '网络搜索', description: '搜索引擎与搜索增强配置' },
  { key: 'mcp', icon: Wrench, label: 'MCP 服务', description: 'Model Context Protocol 服务集成' },
] as const;

export function AgentSettingsPage() {
  const [currentSection, setCurrentSection] = useState<string>('models');

  const CurrentComponent = () => {
    switch (currentSection) {
      case 'models': return <AgentModelSettings />;
      case 'ollama': return <AgentOllamaSettings />;
      case 'websearch': return <AgentWebSearchSettings />;
      case 'mcp': return <AgentMcpSettings />;
      default: return <AgentModelSettings />;
    }
  };

  const currentItem = NAV_ITEMS.find(item => item.key === currentSection);

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden bg-gray-50/50">
      {/* 左侧导航 */}
      <aside className="w-72 shrink-0 border-r border-border bg-white flex flex-col">
        <div className="px-6 py-6 border-b border-border/50">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">AI Agent 设置</h2>
          <p className="text-sm text-gray-500 mt-1.5">配置与管理您的智能助手</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = currentSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setCurrentSection(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 group relative',
                  isSelected
                    ? 'bg-blue-50/80 text-blue-600 font-medium shadow-sm ring-1 ring-blue-100'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                  isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                )}>
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className={cn(
                    "text-xs mt-0.5 truncate",
                    isSelected ? "text-blue-600/70" : "text-gray-400"
                  )}>
                    {item.description}
                  </div>
                </div>
                {isSelected && (
                  <ChevronRight className="w-4 h-4 text-blue-400 absolute right-3 opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 右侧内容 */}
      <main className="flex-1 min-w-0 overflow-auto bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{currentItem?.label}</h1>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CurrentComponent />
          </div>
        </div>
      </main>
    </div>
  );
}



