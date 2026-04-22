/**
 * 系统设置页（参考拨测管理：一级侧栏、二级顶部 Tab、三级页面内顶部 Tab；一级卡片包裹内容）
 * 二级：系统 | 组织（TopNavigation）；三级：页面内顶部 Tab（用户、用户组等）
 */
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sliders } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SETTING_BASE_PATH } from '@/routes';
import { Card, CardContent } from '@/components/ui/card';
import { SystemUserView, SystemLogView, SystemUserGroupView, SystemOrganizationProjectView, SystemParameterView, SystemTaskCenterView, OrgMemberView, SystemResourcePoolView, SystemPluginManagerView, OrgServiceIntegrationView, OrgLogView, OrgTemplateView, OrgProjectView } from '@/components/features/system-setting';
import { User, Users, Landmark, Settings, FileText, Component, Box, Activity, Share2, FileCode, FolderTree, History } from 'lucide-react';

/** 系统-三级子菜单 */
const SYSTEM_THIRD_ITEMS = [
  { id: 'system-user', label: '用户', icon: User },
  { id: 'system-usergroup', label: '用户组', icon: Users },
  { id: 'system-organization', label: '组织与项目', icon: Landmark },
  { id: 'system-parameter', label: '系统参数', icon: Settings },
  { id: 'system-log', label: '操作日志', icon: History },
];

/** 组织-三级子菜单（与参考项目 organization 下 children 一致：member、usergroup、project、serviceIntegration、template、taskCenter、log） */
const ORGANIZATION_THIRD_ITEMS = [
  { id: 'org-member', label: '成员', icon: User },
  { id: 'org-usergroup', label: '用户组', icon: Users },
  { id: 'org-project', label: '项目管理', icon: FolderTree },
  { id: 'org-serviceIntegration', label: '服务集成', icon: Share2 },
  { id: 'org-template', label: '模板管理', icon: FileCode },
  { id: 'org-taskCenter', label: '任务中心', icon: Activity },
  { id: 'org-log', label: '成员日志', icon: FileText },
];

const DEFAULT_SYSTEM_SUB = 'system-user';
const DEFAULT_ORG_SUB = 'org-member';

/** 三级 id -> 展示名（内容区标题） */
const SUB_LABELS: Record<string, string> = {
  'system-user': '用户',
  'system-usergroup': '用户组',
  'system-organization': '组织与项目',
  'system-parameter': '系统参数',
  'system-resourcePool': '资源池',
  'system-taskCenter': '任务中心',
  'system-pluginManager': '插件管理',
  'system-log': '日志',
  'org-member': '成员',
  'org-usergroup': '用户组',
  'org-project': '项目',
  'org-serviceIntegration': '服务集成',
  'org-template': '模板管理',
  'org-taskCenter': '任务中心',
  'org-log': '日志',
};

interface SystemSettingPageProps {
  /** 顶部二级菜单选中项：系统 | 组织（由 TopNavigation 控制） */
  selectedTopMenu: 'system' | 'organization';
}

export function SystemSettingPage({ selectedTopMenu }: SystemSettingPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const thirdLevelItems = selectedTopMenu === 'system' ? SYSTEM_THIRD_ITEMS : ORGANIZATION_THIRD_ITEMS;
  const defaultSub = selectedTopMenu === 'system' ? DEFAULT_SYSTEM_SUB : DEFAULT_ORG_SUB;
  const currentSub = searchParams.get('sub') || defaultSub;
  const validSub = thirdLevelItems.some((item) => item.id === currentSub);
  const selectedSub = validSub ? currentSub : defaultSub;
  const title = SUB_LABELS[selectedSub] ?? selectedSub;

  // 系统设置规范路径为 /，与 routes 中 SETTING_BASE_PATH 保持一致
  const settingBasePath = SETTING_BASE_PATH;

  const setSubId = (subId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('menu', 'setting');
    params.set('tab', selectedTopMenu);
    params.set('sub', subId);
    navigate(`${settingBasePath}?${params.toString()}`, { replace: true });
  };

  // 进入系统设置且 URL 无 sub 时，写入默认 sub
  useEffect(() => {
    if (searchParams.get('menu') !== 'setting' || searchParams.get('sub')) return;
    const params = new URLSearchParams(searchParams);
    params.set('sub', defaultSub);
    navigate(`${settingBasePath}?${params.toString()}`, { replace: true });
  }, [searchParams.get('menu'), searchParams.get('sub'), defaultSub]);

  // 切换 系统/组织 时，若当前 URL sub 不属于当前分类则重置为默认
  useEffect(() => {
    const urlSub = searchParams.get('sub') || defaultSub;
    if (thirdLevelItems.some((i) => i.id === urlSub)) return;
    const params = new URLSearchParams(searchParams);
    params.set('menu', 'setting');
    params.set('tab', selectedTopMenu);
    params.set('sub', defaultSub);
    navigate(`${settingBasePath}?${params.toString()}`, { replace: true });
  }, [selectedTopMenu, defaultSub, searchParams, thirdLevelItems, navigate]);

  const renderContent = () => {
    switch (selectedSub) {
      case 'system-user':
        return <SystemUserView />;
      case 'system-log':
        return <SystemLogView />;
      case 'system-usergroup':
        return <SystemUserGroupView scope="system" />;
      case 'org-usergroup':
        return <SystemUserGroupView scope="organization" />;
      case 'system-organization':
        return <SystemOrganizationProjectView />;
      case 'system-parameter':
        return <SystemParameterView />;
      case 'system-taskCenter':
        return <SystemTaskCenterView scope="system" />;
      case 'system-resourcePool':
        return <SystemResourcePoolView />;
      case 'system-pluginManager':
        return <SystemPluginManagerView />;
      case 'org-taskCenter':
        return <SystemTaskCenterView scope="organization" />;
      case 'org-member':
        return <OrgMemberView />;
      case 'org-serviceIntegration':
        return <OrgServiceIntegrationView />;
      case 'org-log':
        return <OrgLogView />;
      case 'org-template':
        return <OrgTemplateView />;
      case 'org-project':
        return <OrgProjectView />;
      default:
        return (
          <div className="rounded-lg border border-border bg-white p-8 flex flex-col items-center justify-center min-h-[320px]">
            <div className="text-muted-foreground mb-2">
              <Sliders className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">该功能开发中。</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto p-8 bg-gray-50/20 custom-scrollbar animate-in fade-in duration-300">
          {/* 头部：图标 + 标题（与拨测管理一级卡片页一致） */}
          <div className="flex flex-col gap-1 px-1 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100 ring-4 ring-blue-50 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">
                  {selectedTopMenu === 'system' ? '系统设置' : '组织管理'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">管理系统核心配置、权限与资源</p>
              </div>
            </div>
          </div>

          {/* 三级子菜单：当子项多于 1 个时，显示为顶部 Tab（与拨测管理一致） */}
          {thirdLevelItems.length > 1 && (
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex gap-6" aria-label="子菜单">
                {thirdLevelItems.map((item) => {
                  const isActive = selectedSub === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubId(item.id)}
                      className={cn(
                        'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2',
                        isActive
                          ? 'text-primary border-primary'
                          : 'text-gray-600 border-transparent hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* 一级卡片：仅此一层卡片包裹子视图内容 */}
          <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100 overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
