import { useState } from 'react';
import {
  ChevronDown,
  TestTube,
  Bug,
  FileText,
  Plug,
  Briefcase,
  Info,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
}

interface ApplicationSettingsPageProps {
  project: Project;
}

interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  settings?: {
    reportRetention?: number;
    reportRetentionUnit?: 'day' | 'month';
    linkExpiry?: number;
    linkExpiryUnit?: 'day' | 'month';
    executor?: string;
    reminderCount?: number;
  };
}

export function ApplicationSettingsPage({ project }: ApplicationSettingsPageProps) {
  const [modules, setModules] = useState<AppModule[]>([
    {
      id: 'test-plan',
      name: '测试计划',
      description: '提供完整的测试计划创建与执行流管理，支持版本控制及多维度进度追踪。',
      icon: <TestTube className="w-5 h-5" />,
      enabled: true
    },
    {
      id: 'defect-management',
      name: '缺陷管理',
      description: '记录并跟踪测试过程中发现的缺陷（Bug），打通开发及测试人员的问题协作。',
      icon: <Bug className="w-5 h-5" />,
      enabled: true
    },
    {
      id: 'test-case',
      name: '测试用例',
      description: '统一管理功能测试用例，支持导入、导出及用例评审工作流。',
      icon: <FileText className="w-5 h-5" />,
      enabled: true
    },
    {
      id: 'api-test',
      name: '接口测试',
      description: '用于API自动化测试与编排，涵盖用例编写、环境变量注入以及自动化回归。',
      icon: <Plug className="w-5 h-5" />,
      enabled: true,
      settings: {
        reportRetention: 3,
        reportRetentionUnit: 'month',
        linkExpiry: 1,
        linkExpiryUnit: 'day',
        executor: '',
        reminderCount: 0
      }
    },
    {
      id: 'task-center',
      name: '任务中心',
      description: '集中式管理异步与自动化作业的下发，包括定时任务排期和执行记录监控。',
      icon: <Briefcase className="w-5 h-5" />,
      enabled: true
    }
  ]);

  const [expandedModule, setExpandedModule] = useState<string | null>('api-test');

  const toggleModule = (moduleId: string) => {
    setModules(modules.map(m =>
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    ));

    // 如果关闭了模块，也关闭它的展开项
    const targetModule = modules.find(m => m.id === moduleId);
    if (targetModule?.enabled && expandedModule === moduleId) {
      setExpandedModule(null);
    }
  };

  const toggleExpand = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const updateModuleSetting = (moduleId: string, key: string, value: any) => {
    setModules(modules.map(m =>
      m.id === moduleId
        ? { ...m, settings: { ...m.settings, [key]: value } }
        : m
    ));
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-gray-800 mb-1 text-lg font-medium">应用设置</h1>
            <p className="text-sm text-gray-500">配置本项目可用的主要功能模块和底层运行参数</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            保存更改
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-[1000px] mx-auto space-y-6">

          {/* 提示信息 */}
          <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl px-4 py-3 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-0.5">模块化管理您的工作空间</p>
              <p className="text-blue-600/80">根据团队需求灵活启用或禁用特定功能模块，部分模块支持自定义更详细的高级配置项。</p>
            </div>
          </div>

          {/* 应用列表区域 */}
          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`bg-white rounded-xl border transition-all duration-200 ${module.enabled ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-75'
                  }`}
              >
                <div className="px-6 py-5 flex items-start sm:items-center justify-between gap-4">
                  {/* 左侧：图标及详情说明 */}
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${module.enabled
                          ? 'bg-blue-50 text-blue-600 border border-blue-100/50'
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}
                    >
                      {module.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-base font-medium ${module.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                          {module.name}
                        </span>
                        {module.enabled && (
                          <Badge variant="outline" className="text-xs font-normal border-green-200 bg-green-50 text-green-700 px-1.5 py-0 h-5">
                            已启用
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* 右侧：操作区（开关与高级设置按钮） */}
                  <div className="flex items-center gap-4 flex-shrink-0 mt-1 sm:mt-0">
                    {module.settings && module.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(module.id)}
                        className={`text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors ${expandedModule === module.id ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                      >
                        <Settings2 className="w-4 h-4 mr-1.5" />
                        高级设置
                        <ChevronDown
                          className={`w-4 h-4 ml-1 transition-transform ${expandedModule === module.id ? 'rotate-180' : ''
                            }`}
                        />
                      </Button>
                    )}
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  </div>
                </div>

                {/* 展开的配置项 */}
                {module.settings && module.enabled && expandedModule === module.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-xl px-6 py-5">
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                      <Settings2 className="w-4 h-4 mr-1.5 text-gray-400" />
                      {module.name} 特定参数配置
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:pl-5">
                      {/* 报告保留时间 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">报告保留时间</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={module.settings.reportRetention}
                            onChange={(e) => updateModuleSetting(
                              module.id,
                              'reportRetention',
                              parseInt(e.target.value) || 0
                            )}
                            className="bg-white"
                            min="1"
                          />
                          <Select
                            value={module.settings.reportRetentionUnit}
                            onValueChange={(value) => updateModuleSetting(
                              module.id,
                              'reportRetentionUnit',
                              value
                            )}
                          >
                            <SelectTrigger className="w-[100px] bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">天</SelectItem>
                              <SelectItem value="month">月</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">自动清理超过保留期限的历史报告</p>
                      </div>

                      {/* 报告链接有效期 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">报告外置链接有效期</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={module.settings.linkExpiry}
                            onChange={(e) => updateModuleSetting(
                              module.id,
                              'linkExpiry',
                              parseInt(e.target.value) || 0
                            )}
                            className="bg-white"
                            min="1"
                          />
                          <Select
                            value={module.settings.linkExpiryUnit}
                            onValueChange={(value) => updateModuleSetting(
                              module.id,
                              'linkExpiryUnit',
                              value
                            )}
                          >
                            <SelectTrigger className="w-[100px] bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">天</SelectItem>
                              <SelectItem value="month">月</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">分享给外部查阅的报告链接在此时长后失效</p>
                      </div>

                      {/* 执行器源 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">默认任务执行器引擎</label>
                        <Select
                          value={module.settings.executor}
                          onValueChange={(value) => updateModuleSetting(
                            module.id,
                            'executor',
                            value
                          )}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="请选择执行器" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">系统默认执行器节点池 (推荐)</SelectItem>
                            <SelectItem value="docker">独立 Docker 执行器 (云托管)</SelectItem>
                            <SelectItem value="k8s">私有 Kubernetes 集群执行器</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400 mt-0.5">指定接口自动化任务拉起时默认使用的资源池</p>
                      </div>

                      {/* 提醒期 / 通知触发日志 */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">预警及消息触发记录</label>
                        <div className="flex items-center h-10 bg-white border border-gray-200 rounded-md px-3 justify-between">
                          <span className="text-sm text-gray-600">
                            本月已成功触发 <strong className="text-gray-900 font-semibold mx-1">{module.settings.reminderCount}</strong> 条提醒指令
                          </span>
                          <Button variant="link" size="sm" className="text-blue-600 h-auto p-0">
                            查看流水详情
                          </Button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
