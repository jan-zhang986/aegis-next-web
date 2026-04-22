/**
 * 拨测管理页面
 * 一级：拨测管理；二级：顶部菜单（账号、菜单、拨测、拨测历史、Web性能）；三级：页面内内顶部 Tab，对应迁移功能视图
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { PhoneCall } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AccountView,
  MenuView,
  DialListView,
  PlanView,
  PerformanceConfigView,
  PerformanceReportView,
  PerformanceDiagnosisView,
} from '@/components/features/dial-management';

/** 每个二级 tab 下的三级子菜单（id 对应 spotter-aegislm 路由；E2E、仪表盘不迁移；执行器与任务归入任务管理下） */
const DIAL_THIRD_LEVEL_BY_TAB: Record<string, { id: string; label: string }[]> = {
  account: [{ id: 'account', label: '鉴权账号' }],
  menu: [{ id: 'menu', label: '菜单管理' }],
  dial: [
    { id: 'dialWeb', label: 'Web拨测' },
    { id: 'dialApi', label: 'API拨测' },
    { id: 'dialDubbo', label: 'Dubbo拨测' },
    { id: 'dialScript', label: '脚本拨测' },
    { id: 'dialLlm', label: 'LLM拨测' },
  ],
  plan: [{ id: 'plan', label: '拨测历史' }],
};

/** 二级菜单 id -> 展示名（与 TopNavigation dialManagementNavItems 一致） */
const TOP_LABELS: Record<string, string> = {
  account: '鉴权账号',
  menu: '菜单',
  dial: '拨测配置',
  plan: '拨测历史',
};

/** 所有三级 id 的展示名（用于内容区标题） */
const SUB_LABELS: Record<string, string> = {
  account: '鉴权账号',
  menu: '菜单管理',
  dial: '拨测管理',
  dialWeb: 'Web拨测',
  dialApi: 'API拨测',
  dialDubbo: 'Dubbo拨测',
  dialScript: '脚本拨测',
  dialLlm: 'LLM拨测',
  plan: '拨测历史',
};

interface DialManagementPageProps {
  selectedTopMenu: string;
}


export function DialManagementPage({ selectedTopMenu }: DialManagementPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const thirdLevelItems = DIAL_THIRD_LEVEL_BY_TAB[selectedTopMenu] ?? [];
  const firstSubId = thirdLevelItems[0]?.id ?? '';
  const currentSub = searchParams.get('sub') || firstSubId;
  const validSub = thirdLevelItems.some((item) => item.id === currentSub);
  const selectedSub = validSub ? currentSub : firstSubId;
  const title = SUB_LABELS[selectedSub] ?? selectedSub;
  const secondLevelLabel = TOP_LABELS[selectedTopMenu] ?? selectedTopMenu;
  /** 第一行标题：进入三级则显示三级名称，否则显示二级名称 */
  const pageTitle = thirdLevelItems.length > 1 ? title : secondLevelLabel;

  const setSubId = (subId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('menu', 'dial-management');
    params.set('tab', selectedTopMenu);
    params.set('sub', subId);
    navigate(`?${params.toString()}`, { replace: true });
  };

  /** 根据三级子菜单 id 渲染内容 */
  const renderContent = () => {
    switch (selectedSub) {
      case 'account':
        return <AccountView />;
      case 'menu':
        return <MenuView />;
      case 'dial':
      case 'dialWeb':
      case 'dialApi':
      case 'dialDubbo':
      case 'dialScript':
      case 'dialLlm':
        return <DialListView dialSub={selectedSub} />;
      case 'plan':
        return <PlanView />;
      default:
        return (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white min-h-[320px]">
            <div className="text-center text-gray-500">
              <p className="text-base">{title} 页面迁移中</p>
              <p className="text-sm mt-1">sub: {selectedSub}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto p-8 bg-gray-50/20 custom-scrollbar animate-in fade-in duration-500">
          {/* 头部：第一行 = 二级菜单名；进入三级后第一行 = 三级名称 */}
          <div className="flex flex-col gap-1 px-1 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100 ring-4 ring-blue-50 shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">{pageTitle}</h2>
            </div>
          </div>

          {/* 三级子菜单：当子项多于 1 个时，显示为顶部 Tab */}
          {thirdLevelItems.length > 1 && (
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex gap-6" aria-label="子菜单">
                {thirdLevelItems.map((item) => {
                  const isActive = selectedSub === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubId(item.id)}
                      className={cn(
                        'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                        isActive
                          ? 'text-primary border-primary'
                          : 'text-gray-600 border-transparent hover:text-gray-900'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* 卡片容器：仅包裹内容，标题已在第一行展示 */}
          <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100 overflow-hidden">
            <CardContent className="p-6">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
