/**
 * 门禁管理页面
 * 展示云效流水线记录，运维在此补全需求ID、项目、环境、发布结果等
 * 顶部二级菜单：发布管理 / 流水线配置（通过 selectedTopMenu 控制）
 */

import { GateManagementView } from '@/components/features/gate-management';

interface GateManagementPageProps {
  selectedTopMenu?: string;
}

export function GateManagementPage({ selectedTopMenu }: GateManagementPageProps) {
  return <GateManagementView selectedTopMenu={selectedTopMenu} />;
}
