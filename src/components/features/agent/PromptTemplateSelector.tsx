/**
 * 提示词模板选择器
 * 从 aegis-rag-frontend PromptTemplateSelector.vue 迁移
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { systemConfigService, type PromptTemplate } from '@/services/agent-settings';
import { LayoutGrid, Loader2, Folder, Globe } from 'lucide-react';

type TemplateType = 'systemPrompt' | 'contextTemplate' | 'rewriteSystem' | 'rewriteUser' | 'fallback';

interface PromptTemplateSelectorProps {
  type: TemplateType;
  hasKnowledgeBase?: boolean;
  position?: 'inline' | 'corner';
  onSelect: (content: string) => void;
}

const TYPE_MAP: Record<TemplateType, keyof import('@/services/agent-settings').PromptTemplatesConfig> = {
  systemPrompt: 'system_prompt',
  contextTemplate: 'context_template',
  rewriteSystem: 'rewrite_system',
  rewriteUser: 'rewrite_user',
  fallback: 'fallback',
};

export function PromptTemplateSelector({
  type,
  onSelect,
  position = 'inline',
}: PromptTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  useEffect(() => {
    if (open && templates.length === 0) {
      setLoading(true);
      systemConfigService
        .getPromptTemplates()
        .then((res: any) => {
          const data = res?.data ?? res;
          const list = data?.[TYPE_MAP[type]] ?? [];
          setTemplates(Array.isArray(list) ? list : []);
        })
        .catch(() => setTemplates([]))
        .finally(() => setLoading(false));
    }
  }, [open, type]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-7 text-xs ${position === 'corner' ? 'absolute right-2 bottom-2 z-10' : ''}`}
          type="button"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          <span className="ml-1">使用模板</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="p-3 border-b">
          <span className="text-sm font-medium">选择模板</span>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">加载中...</div>
          ) : templates.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">暂无模板</div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors mb-1"
                onClick={() => {
                  onSelect(t.content);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm">{t.name}</span>
                  {t.has_knowledge_base && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      <Folder className="w-3 h-3" /> 含知识库
                    </span>
                  )}
                  {t.has_web_search && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                      <Globe className="w-3 h-3" /> 含网络搜索
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
