import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, Bug, MessageSquareText } from 'lucide-react';
import { WorkspaceJointReviewPanel } from './WorkspaceJointReviewPanel';
import { QualityTaskBoard } from './QualityTaskBoard';
import { QualityRiskEvidencePanel } from './QualityRiskEvidencePanel';
import type { WorkspaceReferenceBundle } from './workspace-trace-utils';

interface WorkspaceExecutionPanelProps {
  workspaceId: string;
  projectId: string;
  spaceId?: string;
  canEdit?: boolean;
  reviewStatus?: string;
  demoMode?: boolean;
  referenceBundle?: WorkspaceReferenceBundle;
  onChanged?: () => void;
}

export function WorkspaceExecutionPanel({
  workspaceId,
  projectId,
  spaceId,
  canEdit = true,
  reviewStatus,
  demoMode,
  referenceBundle,
  onChanged,
}: WorkspaceExecutionPanelProps) {
  const defaultTab = useMemo(() => {
    if (reviewStatus === 'REVIEWED') return 'run';
    return 'review';
  }, [reviewStatus]);

  return (
    <div className="flex h-full flex-col bg-[#F7F8FB]">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-base font-black text-slate-900">联合评审与执行</h2>
        <p className="mt-1 text-sm text-slate-500">
          用例生成后，与研发对照需求文档、测试分析、测试用例做联合评审；通过后再执行与留痕。
        </p>
      </div>
      <Tabs defaultValue={defaultTab} key={defaultTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-slate-100 bg-white px-6">
          <TabsList className="h-10 bg-transparent p-0">
            <TabsTrigger value="review" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-xs font-black">
              <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
              1. 联合评审
            </TabsTrigger>
            <TabsTrigger value="run" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-xs font-black">
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
              2. 用例执行
            </TabsTrigger>
            <TabsTrigger value="risk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-xs font-black">
              <Bug className="mr-1.5 h-3.5 w-3.5" />
              3. 风险复测
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="review" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <WorkspaceJointReviewPanel
            workspaceId={workspaceId}
            projectId={projectId}
            canEdit={canEdit}
            demoMode={demoMode}
            referenceBundle={referenceBundle}
            onChanged={onChanged}
          />
        </TabsContent>
        <TabsContent value="run" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <QualityTaskBoard
            workspaceId={workspaceId}
            projectId={projectId}
            spaceId={spaceId}
            canEdit={canEdit}
            onWorkItemsChange={onChanged}
          />
        </TabsContent>
        <TabsContent value="risk" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <QualityRiskEvidencePanel
            workspaceId={workspaceId}
            projectId={projectId}
            canEdit={canEdit}
            onChanged={onChanged}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
