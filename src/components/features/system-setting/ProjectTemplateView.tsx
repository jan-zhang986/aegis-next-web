/**
 * 项目管理-模板管理（迁移自 AegisOne 项目模板）
 * 与 OrgTemplateView 布局一致，使用 projectId 与项目级模板 API
 */
import { useState, useCallback } from 'react';
import { Settings, FileText, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TemplateFieldSetting, TemplateManagementList, TemplateWorkflowView } from './template';
import type { SceneType } from '@/types/setting/template';

const TEMPLATE_TYPES: { key: SceneType; title: string; description: string }[] = [
  { key: 'FUNCTIONAL', title: '用例模板', description: '管理用例相关的字段和模板' },
  { key: 'BUG', title: '缺陷模板', description: '管理缺陷相关的字段和模板' },
  { key: 'API', title: 'API 模板', description: '管理 API 相关的字段和模板' },
];

type SubView = 'list' | 'field' | 'templates' | 'workflow';

interface ProjectTemplateViewProps {
  projectId: string;
}

export function ProjectTemplateView({ projectId }: ProjectTemplateViewProps) {
  const [showTip, setShowTip] = useState(true);
  const [subView, setSubView] = useState<SubView>('list');
  const [scene, setScene] = useState<SceneType>('FUNCTIONAL');

  const handleFieldSetting = useCallback((key: string) => {
    setScene(key as SceneType);
    setSubView('field');
  }, []);

  const handleTemplateManagement = useCallback((key: string) => {
    setScene(key as SceneType);
    setSubView('templates');
  }, []);

  const handleWorkflowSetup = useCallback((key: string) => {
    setScene(key as SceneType);
    setSubView('workflow');
  }, []);

  const onBack = useCallback(() => {
    setSubView('list');
  }, []);

  if (subView === 'field') {
    return (
      <TemplateFieldSetting
        scope="project"
        scopeId={projectId}
        scene={scene}
        onBack={onBack}
      />
    );
  }
  if (subView === 'templates') {
    return (
      <TemplateManagementList
        scope="project"
        scopeId={projectId}
        scene={scene}
        onBack={onBack}
      />
    );
  }
  if (subView === 'workflow') {
    return (
      <TemplateWorkflowView
        scope="project"
        scopeId={projectId}
        scene={scene}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">模板管理</h1>
        <p className="mt-1 text-sm text-gray-500">配置项目内各模块的字段、模板和工作流</p>
      </header>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {showTip && (
          <Alert className="mb-6 border-blue-100 bg-blue-50/50">
            <AlertDescription className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-sm text-gray-700">模板管理用于配置项目内各模块的字段、模板和工作流，可根据实际需求进行自定义设置。</span>
              <Button variant="ghost" size="sm" className="shrink-0 text-gray-600" onClick={() => setShowTip(false)}>不再提醒</Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_TYPES.map((type) => (
            <Card key={type.key} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{type.title}</CardTitle>
                <CardDescription className="text-sm">{type.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-gray-50"
                  onClick={() => handleFieldSetting(type.key)}
                >
                  <Settings className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
                  字段设置
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-gray-50"
                  onClick={() => handleTemplateManagement(type.key)}
                >
                  <FileText className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
                  模板管理
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-gray-50"
                  onClick={() => handleWorkflowSetup(type.key)}
                >
                  <Workflow className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
                  工作流设置
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
