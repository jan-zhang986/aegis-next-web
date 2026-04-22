/**
 * 环境管理页
 * 参考消息管理：头部样式、卡片容器、工具栏与表格统一风格
 */

import { useState } from 'react';
import { Plus, Search, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useEnvironmentListData,
  useEnvironmentForm,
  useEnvironmentDelete,
} from '@/components/features/environment-management/hooks';
import {
  EnvironmentTableSection,
  EnvironmentFormDialog,
  EnvironmentDetailDialog,
  EnvironmentDeleteDialog,
} from '@/components/features/environment-management/components';
import type { Environment } from '@/services/environment';

interface EnvironmentManagementPageProps {
  projectId?: string;
}

export function EnvironmentManagementPage({ projectId: propProjectId }: EnvironmentManagementPageProps) {
  const list = useEnvironmentListData(propProjectId);
  const form = useEnvironmentForm(list.projectId ?? null, list.projectName, list.loadEnvironments);
  const del = useEnvironmentDelete(list.loadEnvironments);

  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailEnvironment, setDetailEnvironment] = useState<Environment | null>(null);

  const handleDetail = (env: Environment) => {
    setDetailEnvironment(env);
    setShowDetailDialog(true);
  };

  const formOpen = form.showAddDialog || form.showEditDialog;
  const isEdit = form.showEditDialog;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="space-y-6 p-8">
        {/* 头部：与消息管理一致 */}
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100 ring-4 ring-blue-50">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">环境管理</h2>
          </div>
          <p className="text-sm font-medium text-gray-400 mt-2 pl-14">管理项目下的环境配置，支持多环境（开发 / 测试 / 预发 / 生产）及域名、变量等。</p>
        </div>

        {/* 卡片容器：与消息管理机器人卡片一致 */}
        <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-50 bg-gray-50/10">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-black text-gray-900 tracking-tight">环境列表</CardTitle>
              <CardDescription className="text-xs font-medium text-gray-400">配置接口、场景等使用的环境域名与变量，点击行可查看详情</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索环境名称或 Code..."
                  className="pl-9 bg-white border-gray-200 h-11 rounded-xl"
                  value={list.searchTerm}
                  onChange={(e) => list.setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl shrink-0"
                onClick={() => list.loadEnvironments()}
                disabled={list.loading}
                aria-label="刷新"
              >
                <RefreshCw className={`w-4 h-4 ${list.loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={form.handleOpenAddDialog}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/50 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> 添加环境
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EnvironmentTableSection
              environments={list.filteredEnvironments}
              loading={list.loading}
              total={list.total}
              pageSize={list.pageSize}
              currentPage={list.currentPage}
              onPageChange={list.setCurrentPage}
              onAdd={form.handleOpenAddDialog}
              onEdit={form.handleOpenEditDialog}
              onDelete={del.handleOpenDelete}
              onDetail={handleDetail}
              getEnvCodeColor={list.getEnvCodeColor}
            />
          </CardContent>
        </Card>
      </div>

      <EnvironmentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) form.closeForm();
        }}
        isEdit={isEdit}
        formData={form.formData}
        setFormData={form.setFormData}
        variablesList={form.variablesList}
        setVariablesList={form.setVariablesList}
        projectName={list.projectName}
        getJsonFieldValue={form.getJsonFieldValue}
        updateJsonField={form.updateJsonField}
        updateDataEndpoint={form.updateDataEndpoint}
        updateXxlJobInfo={form.updateXxlJobInfo}
        updateMqInfo={form.updateMqInfo}
        updateDubboInfo={form.updateDubboInfo}
        onSave={form.handleSave}
      />

      <EnvironmentDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        environment={detailEnvironment}
        onEdit={(env) => {
          setShowDetailDialog(false);
          form.handleOpenEditDialog(env);
        }}
      />

      <EnvironmentDeleteDialog
        open={del.showDeleteDialog}
        onOpenChange={del.setShowDeleteDialog}
        onConfirm={del.handleDelete}
        onCancel={del.handleCancelDelete}
      />
    </div>
  );
}
