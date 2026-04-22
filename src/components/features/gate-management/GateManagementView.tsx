/**
 * 门禁管理 - 组合入口（筛选 + 列表 + 分页 + 补全弹窗）
 * 参考消息管理/环境管理：头部图标+标题+描述，卡片容器，表格 scope/加载/空态，UnifiedPagination
 */

import { Key, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UnifiedPagination } from '@/components/ui/unified-pagination';
import { PAGE_SIZE } from './constants/filter-options';
import { useGateManagement } from './hooks/use-gate-management';
import {
  GateManagementFilter,
  GateManagementTable,
  PipelineRecordEditDialog,
  PipelineRecordCreateDialog,
  PipelineConfigTable,
} from './components';

interface GateManagementViewProps {
  selectedTopMenu?: string;
}

export function GateManagementView({ selectedTopMenu }: GateManagementViewProps) {

  const {
    list,
    total,
    page,
    setPage,
    totalPages,
    loading,
    filters,
    setDeployResult,
    setProjectId,
    setRepoName,
    refetch,
    handleSearch,
    projectOptions,
    requirementOptions,
    userOptions,
    editRow,
    editForm,
    openEdit,
    closeEdit,
    handleSaveEdit,
    saving,
    storyPopoverOpen,
    setStoryPopoverOpen,
    storyFuzzySearch,
    setStoryFuzzySearch,
    setEditForm,
    filteredRequirements,
    storySearchLoading,
    resetFilters,
    createOpen,
    setCreateOpen,
    handleCreate,
    creating,
  } = useGateManagement();

  const isProduction = import.meta.env.PROD;
  const currentTopMenu = selectedTopMenu || 'deploy';

  const hasActiveFilters =
    Boolean(filters.deployResult) || Boolean(filters.projectId) || Boolean(filters.repoName.trim());

  const renderContent = () => {
    if (currentTopMenu === 'scan-config') {
      // 线上环境：仅展示占位提示
      if (isProduction) {
        return (
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100">
            <CardHeader className="flex-shrink-0 space-y-4 pb-6 border-b border-gray-50 bg-gray-50/10">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-black text-gray-900 tracking-tight">扫描配置</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-400">
                  功能界面正在开发中，敬请期待。
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center text-sm text-gray-400">
              功能界面正在开发中，敬请期待。
            </CardContent>
          </Card>
        );
      }

      // 本地 / 非生产：预留真实配置界面位置（当前与线上占位一致，后续可替换为真实表格）
      return (
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100">
          <CardHeader className="flex-shrink-0 space-y-4 pb-6 border-b border-gray-50 bg-gray-50/10">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-black text-gray-900 tracking-tight">扫描配置</CardTitle>
              <CardDescription className="text-xs font-medium text-gray-400">
                后续将在此集中管理代码扫描、质量门禁等相关配置。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center text-sm text-gray-400">
            功能界面正在开发中，敬请期待。
          </CardContent>
        </Card>
      );
    }

    if (currentTopMenu === 'pipeline-config') {
      // 线上环境：仅展示占位提示
      if (isProduction) {
        return (
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100">
            <CardHeader className="flex-shrink-0 space-y-4 pb-6 border-b border-gray-50 bg-gray-50/10">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-black text-gray-900 tracking-tight">流水线配置</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-400">
                  功能界面正在开发中，敬请期待。
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center text-sm text-gray-400">
              功能界面正在开发中，敬请期待。
            </CardContent>
          </Card>
        );
      }

      // 本地 / 非生产环境：展示完整流水线配置占位表格，方便开发联调
      return (
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100">
          <CardHeader className="flex-shrink-0 space-y-4 pb-6 border-b border-gray-50 bg-gray-50/10">
            <div className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-black text-gray-900 tracking-tight">流水线配置</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-400">
                  流水线基础信息、通知人、自动化用例等配置统一在此管理。
                </CardDescription>
              </div>
              <Button
                type="button"
                className="h-9 px-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
              >
                配置
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
            <div className="flex-1 min-h-0 overflow-auto">
              <PipelineConfigTable list={[]} />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        {/* 卡片容器：占满剩余高度，表格区域内部滚动，分页固定在底部 */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100">
          <CardHeader className="flex-shrink-0 space-y-4 pb-6 border-b border-gray-50 bg-gray-50/10">
            <div className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-black text-gray-900 tracking-tight">流水线记录</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-400">
                  支持按项目/服务/状态筛选，可在表格内快速补全
                </CardDescription>
              </div>
              <Button
                type="button"
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/50 shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                手动创建流水线
              </Button>
            </div>
            <div className="w-full">
              <GateManagementFilter
                deployResult={filters.deployResult}
                setDeployResult={setDeployResult}
                projectId={filters.projectId}
                setProjectId={setProjectId}
                repoName={filters.repoName}
                setRepoName={setRepoName}
                projectOptions={projectOptions}
                onSearch={handleSearch}
                onRefresh={refetch}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
                loading={loading}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden p-0">
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="flex-1 min-h-0 overflow-auto">
                <GateManagementTable list={list} loading={loading} onEdit={openEdit} />
              </div>
              <div className="flex-shrink-0 border-t border-gray-100">
                <UnifiedPagination
                  total={total}
                  currentPage={page}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  unitLabel="条"
                  hideWhenEmpty={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <PipelineRecordEditDialog
          open={!!editRow}
          onOpenChange={(o) => !o && closeEdit()}
          editForm={editForm}
          setEditForm={setEditForm}
          projectOptions={projectOptions}
          requirementOptions={requirementOptions}
          userOptions={userOptions}
          filteredRequirements={filteredRequirements}
          storySearchLoading={storySearchLoading}
          storyPopoverOpen={storyPopoverOpen}
          setStoryPopoverOpen={setStoryPopoverOpen}
          storyFuzzySearch={storyFuzzySearch}
          setStoryFuzzySearch={setStoryFuzzySearch}
          onSave={handleSaveEdit}
          onClose={closeEdit}
          saving={saving}
        />

        <PipelineRecordCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          projectOptions={projectOptions}
          requirementOptions={requirementOptions}
          userOptions={userOptions}
          onCreate={handleCreate}
          saving={creating}
        />
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-8 space-y-6">
        {/* 头部：与消息管理/环境管理一致 */}
        <div className="flex-shrink-0 flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100 ring-4 ring-blue-50">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">发布管理</h2>
          </div>
          <p className="text-sm font-medium text-gray-400 mt-2 pl-14">
            云效流水线记录在此展示，缺失的运维侧数据（需求ID、项目、环境、发布结果等）可在此补全。
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
