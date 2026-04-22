/**
 * 将 AI 生成的用例内容保存到平台
 * 参考 spotter-metersphere createCaseRequest 与 CaseDetailForm
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { caseManagementService } from '@/services';
import { CaseModuleSelect } from './CaseModuleSelect';
import { StepEditor } from './StepEditor';
import { generateId } from '../utils';
import { resolvePriorityFieldId } from '../utils/getCaseLevel';
import type { ModuleTreeNode } from '../types';
import type { StepListItem } from '../types';
import { toast } from 'sonner';

/** 从 AI 生成的 markdown/文本中解析用例名和步骤 */
function parseAiContentToCase(content: string): { name: string; steps: StepListItem[] } {
  const text = (content || '').trim();
  if (!text) return { name: '新建用例', steps: [{ id: generateId(), step: '', expected: '' }] };

  let name = '';
  const steps: StepListItem[] = [];

  // 尝试提取标题：## 用例名 或 ### 用例名 或 第一行
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titleMatch = text.match(/^#+\s+(.+?)(?:\n|$)/m);
  if (titleMatch) {
    name = titleMatch[1].trim().slice(0, 255) || '新建用例';
  } else if (lines[0]) {
    name = lines[0].replace(/^[#\-\*\d.]+\s*/, '').slice(0, 255) || '新建用例';
  } else {
    name = '新建用例';
  }

  // 解析步骤：1. xxx 预期：yyy 或 - xxx 或 * xxx
  const stepPatterns = [
    /^(\d+)[.)]\s*(.+?)(?:\s+预期[：:]\s*(.+))?$/im,
    /^[-*]\s*(.+?)(?:\s+预期[：:]\s*(.+))?$/im,
    /^\d+[.)]\s*(.+)$/im,
  ];
  const stepLines = text.split(/\n/).filter((l) => /^\s*(\d+[.)]|[-*])\s+.+/.test(l) || /步骤\s*\d+/.test(l));
  for (const line of stepLines) {
    const trimmed = line.trim();
    let step = '';
    let expected = '';
    const m1 = trimmed.match(/^(\d+)[.)]\s*(.+?)(?:\s+预期[：:]\s*(.+))?$/i);
    const m2 = trimmed.match(/^[-*]\s*(.+?)(?:\s+预期[：:]\s*(.+))?$/i);
    const m3 = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
    if (m1) {
      step = m1[2].trim();
      expected = (m1[3] || '').trim();
    } else if (m2) {
      step = m2[1].trim();
      expected = (m2[2] || '').trim();
    } else if (m3) {
      step = m3[2].trim();
    } else {
      step = trimmed.replace(/^[\d.)\-\*]+\s*/, '');
    }
    if (step) {
      steps.push({ id: generateId(), step, expected });
    }
  }

  if (steps.length === 0) {
    // 未解析到步骤时，将整段文本作为单个步骤的描述
    const desc = text
      .replace(/^#+\s+.+$/m, '')
      .replace(/^\s*[\d.)\-\*]+\s+/gm, '')
      .trim();
    if (desc) {
      steps.push({ id: generateId(), step: desc, expected: '' });
    } else {
      steps.push({ id: generateId(), step: text.slice(0, 500), expected: '' });
    }
  }

  if (steps.length === 0) {
    steps.push({ id: generateId(), step: '', expected: '' });
  }

  return { name: name || '新建用例', steps };
}

function buildStepsPayload(steps: StepListItem[]): string {
  const payload = steps
    .filter((s) => (s.step ?? '').trim())
    .map((s, i) => ({
      id: s.id,
      num: i,
      desc: (s.step ?? '').trim(),
      result: (s.expected ?? '').trim(),
    }));
  return payload.length ? JSON.stringify(payload) : '';
}

interface SaveCaseToPlatformDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** AI 生成的用例内容 */
  content: string;
  /** 保存成功后回调 */
  onSuccess?: (caseId: string, caseName: string) => void;
}

export function SaveCaseToPlatformDrawer({
  open,
  onOpenChange,
  projectId,
  content,
  onSuccess,
}: SaveCaseToPlatformDrawerProps) {
  const [moduleTree, setModuleTree] = useState<ModuleTreeNode[]>([]);
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [steps, setSteps] = useState<StepListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    caseManagementService.getCaseModuleTree({ projectId }).then((tree: any) => {
      const t = Array.isArray(tree) ? tree : tree ?? [];
      setModuleTree(t);
      if (t.length > 0 && !moduleId) {
        const first = findFirstLeaf(t);
        if (first) setModuleId(first.id);
      }
    }).catch(() => setModuleTree([]));
  }, [open, projectId]);

  useEffect(() => {
    if (open && content) {
      const parsed = parseAiContentToCase(content);
      setName(parsed.name);
      setSteps(parsed.steps);
    }
  }, [open, content]);

  const findFirstLeaf = (nodes: ModuleTreeNode[]): ModuleTreeNode | null => {
    for (const n of nodes) {
      if (!n.children?.length) return n;
      const c = findFirstLeaf(n.children);
      if (c) return c;
    }
    return nodes[0] ?? null;
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('请输入用例名称');
      return;
    }
    if (!moduleId) {
      toast.error('请选择所属模块');
      return;
    }
    const stepsStr = buildStepsPayload(steps);
    if (!stepsStr) {
      toast.error('请至少填写一个步骤');
      return;
    }

    setLoading(true);
    try {
      let templateId = '';
      let customFields: Array<{ fieldId: string; value: string }> = [];
      try {
        const defaultFields: any = await caseManagementService.getCaseDefaultFields(projectId);
        templateId = defaultFields?.id ?? '';
        const priorityFieldId = resolvePriorityFieldId(defaultFields);
        customFields = [{ fieldId: priorityFieldId || 'functional_priority', value: 'P0' }];
      } catch {
        customFields = [{ fieldId: 'functional_priority', value: 'P0' }];
      }

      const request = {
        projectId,
        templateId,
        name: trimmedName,
        moduleId,
        prerequisite: '',
        caseEditType: 'STEP',
        steps: stepsStr,
        textDescription: '',
        expectedResult: '',
        description: '',
        tags: [] as string[],
        customFields,
        aiCreate: true, // AI 生成用例保存到平台，与 metersphere-frontend 一致
      };

      const res: any = await caseManagementService.createCaseRequest({
        request,
        fileList: [],
      });
      const caseId = res?.id ?? res?.data?.id ?? '';
      if (caseId) {
        toast.success('用例已保存到平台');
        onSuccess?.(caseId, trimmedName);
        onOpenChange(false);
      } else {
        toast.error('保存成功但未返回用例 ID');
      }
    } catch (err: any) {
      console.error('保存用例失败:', err);
      toast.error(err?.message ?? '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>保存到平台</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>用例名称 <span className="text-red-500">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入用例名称"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <CaseModuleSelect
              moduleTree={moduleTree}
              value={moduleId}
              onChange={setModuleId}
              label="所属模块"
              required
              placeholder="请选择所属模块"
            />
          </div>
          <div className="space-y-2">
            <Label>步骤 <span className="text-red-500">*</span></Label>
            <StepEditor steps={steps} onChange={setSteps} />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存到平台
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
