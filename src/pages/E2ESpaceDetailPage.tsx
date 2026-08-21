/**
 * 用例实现空间详情页面
 * 左侧模块树，右侧 Case 实现列表与画布，支持联动
 */

/** @deprecated compatibility shell file name; prefer CaseRealizationSpaceDetailPage symbol and case-realization entry flow */
import React, { useEffect } from 'react';
import { ArrowLeft, Plus, Star, Grid, Play, Copy, Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { CaseRealizationSpace } from '@/services/e2e-space';
import { useE2ESpaceDetailPage } from '@/components/features/e2e-space/hooks';
import { WorkflowDesignerEmbed, ModuleTreePanel, TestCaseTable, E2ESpaceDialogs } from '@/components/features/e2e-space/components';

interface CaseRealizationSpaceDetailPageProps {
  space: CaseRealizationSpace;
  onBack: () => void;
}

export function CaseRealizationSpaceDetailPage({ space, onBack }: CaseRealizationSpaceDetailPageProps) {
  // 使用整合的 hook 管理所有状态和逻辑
  const {
    // 工作流集成
    viewMode,
    setViewMode,
    isFullscreen,
    fullscreenContainerRef,
    selectedTestCase,
    setSelectedTestCase,
    handleToggleFullscreen,
    workflowDesignRef,
    // 模块树
    modules,
    selectedModule,
    setSelectedModule,
    expandedModules,
    setExpandedModules,
    loading,
    isCreateModuleDialogOpen,
    setIsCreateModuleDialogOpen,
    newModuleName,
    setNewModuleName,
    isCreateSubModuleDialogOpen,
    setIsCreateSubModuleDialogOpen,
    subModuleParentId,
    setSubModuleParentId,
    newSubModuleName,
    setNewSubModuleName,
    isRenameModuleDialogOpen,
    setIsRenameModuleDialogOpen,
    renameModuleId,
    setRenameModuleId,
    renameModuleName,
    setRenameModuleName,
    isDeleteModuleDialogOpen,
    setIsDeleteModuleDialogOpen,
    loadModules,
    handleCreateModule,
    handleCreateSubModule,
    handleRenameModule,
    handleDeleteModule,
    toggleModule,
    handleModuleSelect,
    flattenModules,
    isSystemModule,
    getSelectedModuleName,
    setLoading,
    // 测试用例列表
    testCases,
    searchTerm,
    setSearchTerm,
    filteredTestCases,
    getModuleTestCaseCount,
    loadTestCases,
    // 测试用例操作
    isCreateTestCaseDialogOpen,
    setIsCreateTestCaseDialogOpen,
    newTestCaseName,
    setNewTestCaseName,
    newTestCaseDescription,
    setNewTestCaseDescription,
    newTestCaseCategory,
    setNewTestCaseCategory,
    isDeleteTestCaseDialogOpen,
    setIsDeleteTestCaseDialogOpen,
    testCaseToDelete,
    setTestCaseToDelete,
    isEditTestCaseDialogOpen,
    setIsEditTestCaseDialogOpen,
    editingTestCase,
    setEditingTestCase,
    editTestCaseName,
    setEditTestCaseName,
    editTestCaseDescription,
    setEditTestCaseDescription,
    editTestCaseCategory,
    setEditTestCaseCategory,
    editingTestCaseId,
    setEditingTestCaseId,
    editingTestCaseName,
    setEditingTestCaseName,
    editTestCaseNameInputRef,
    selectedTestCaseIds,
    setSelectedTestCaseIds,
    isBatchDeleteDialogOpen,
    setIsBatchDeleteDialogOpen,
    isCopyToDialogOpen,
    setIsCopyToDialogOpen,
    isMoveToDialogOpen,
    setIsMoveToDialogOpen,
    targetModuleId,
    setTargetModuleId,
    handleCreateTestCase,
    handleDeleteTestCase,
    handleCopyTestCase,
    handleEditTestCase,
    handleSaveEditTestCase,
    handleStartEditTestCaseName,
    handleCancelEditTestCaseName,
    handleSaveTestCaseName,
    handleToggleSelectAll,
    handleToggleTestCaseSelection,
    handleRunTestCase,
    handleBatchDelete,
    handleConfirmBatchDelete,
    handleBatchCopyTo,
    handleBatchMoveTo,
    handleConfirmCopyTo,
    handleConfirmMoveTo,
    // 环境管理
    environments,
    selectedEnvironmentId,
    setSelectedEnvironmentId,
    loadingEnvironments,
    isEnvironmentDialogOpen,
    setIsEnvironmentDialogOpen,
    userVariableXTagHeader,
    setUserVariableXTagHeader,
    userVariableXSiteTenant,
    setUserVariableXSiteTenant,
    userVariableXTenantId,
    setUserVariableXTenantId,
    userVariableXApp,
    setUserVariableXApp,
    // 其他
    columnWidths,
    setColumnWidths,
    resizingColumn,
    handleResizeStart,
    handleBatchExecute,
    handleConfirmBatchExecute,
  } = useE2ESpaceDetailPage({ space });

  // 添加CSS样式来处理hover状态
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .module-row:hover .test-case-count {
        display: none !important;
      }
      .module-row:hover .module-actions {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);


  // 如果选择了测试用例，显示画布页面
  if (selectedTestCase) {
    return (
      <WorkflowDesignerEmbed
        space={space}
        selectedTestCase={selectedTestCase}
        selectedModule={selectedModule}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isFullscreen={isFullscreen}
        fullscreenContainerRef={fullscreenContainerRef}
        onToggleFullscreen={handleToggleFullscreen}
        onBack={onBack}
        onReturnToList={() => setSelectedTestCase(null)}
        loadTestCases={loadTestCases}
        loading={loading}
        workflowDesignRef={workflowDesignRef}
      />
    );
  }

  // 显示测试用例列表
  return (
    <div className="flex-1 w-full h-full flex flex-col bg-gray-50 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={(e) => {
                      e.preventDefault();
                      onBack();
                    }}
                    className="cursor-pointer hover:text-gray-900"
                  >
                    用例实现
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{space.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Star className="w-4 h-4" />
              AI 构建测试
            </Button>
            <Button variant="ghost" size="sm">
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Module Tree */}
        <ModuleTreePanel
          space={space}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          modules={modules}
          selectedModule={selectedModule}
          expandedModules={expandedModules}
          loading={loading}
          isCreateModuleDialogOpen={isCreateModuleDialogOpen}
          setIsCreateModuleDialogOpen={setIsCreateModuleDialogOpen}
          isCreateSubModuleDialogOpen={isCreateSubModuleDialogOpen}
          setIsCreateSubModuleDialogOpen={setIsCreateSubModuleDialogOpen}
          subModuleParentId={subModuleParentId}
          setSubModuleParentId={setSubModuleParentId}
          isRenameModuleDialogOpen={isRenameModuleDialogOpen}
          setIsRenameModuleDialogOpen={setIsRenameModuleDialogOpen}
          renameModuleId={renameModuleId}
          setRenameModuleId={setRenameModuleId}
          renameModuleName={renameModuleName}
          setRenameModuleName={setRenameModuleName}
          isDeleteModuleDialogOpen={isDeleteModuleDialogOpen}
          setIsDeleteModuleDialogOpen={setIsDeleteModuleDialogOpen}
          toggleModule={toggleModule}
          handleModuleSelect={handleModuleSelect}
          flattenModules={flattenModules}
          isSystemModule={isSystemModule}
          getModuleTestCaseCount={getModuleTestCaseCount}
          loadModules={loadModules}
          setSelectedModule={setSelectedModule}
          setExpandedModules={setExpandedModules}
          setLoading={setLoading}
        />

        {/* Right Content - Test Cases List */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Title：与左侧选中的模块名称一致，切换模块时同步更新 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {getSelectedModuleName() || '用例实现'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                共 {filteredTestCases.length} 个测试用例
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 复制到、移动到和批量删除按钮 - 只在选中用例时显示 */}
              {selectedTestCaseIds.size > 0 && (
                <>
                  <Button 
                    onClick={handleBatchCopyTo}
                    disabled={loading}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制到 ({selectedTestCaseIds.size})
                  </Button>
                  <Button 
                    onClick={handleBatchMoveTo}
                    disabled={loading}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Move className="w-4 h-4 mr-2" />
                    移动到 ({selectedTestCaseIds.size})
                  </Button>
                  <Button 
                    onClick={handleBatchDelete}
                    disabled={loading}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    批量删除 ({selectedTestCaseIds.size})
                  </Button>
                </>
              )}
              <Button 
                onClick={() => setIsCreateTestCaseDialogOpen(true)}
                disabled={!selectedModule || loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                新建
              </Button>
              <Button 
                onClick={handleBatchExecute}
                disabled={selectedTestCaseIds.size === 0 || loading}
                variant={selectedTestCaseIds.size > 0 ? "default" : "outline"}
                className={selectedTestCaseIds.size > 0 ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Play className="w-4 h-4 mr-2" />
                {selectedTestCaseIds.size > 0 ? `执行选中 (${selectedTestCaseIds.size})` : '批量执行'}
              </Button>
            </div>
          </div>

          {/* Test Cases Table */}
          <TestCaseTable
            filteredTestCases={filteredTestCases}
            selectedTestCaseIds={selectedTestCaseIds}
            selectedTestCase={selectedTestCase}
            selectedModule={selectedModule}
            searchTerm={searchTerm}
            columnWidths={columnWidths}
            resizingColumn={resizingColumn}
            editingTestCaseId={editingTestCaseId}
            editingTestCaseName={editingTestCaseName}
            loading={loading}
            handleToggleSelectAll={handleToggleSelectAll}
            handleToggleTestCaseSelection={handleToggleTestCaseSelection}
            handleResizeStart={handleResizeStart}
            setSelectedTestCase={setSelectedTestCase}
            handleStartEditTestCaseName={handleStartEditTestCaseName}
            setEditingTestCaseName={setEditingTestCaseName}
            handleSaveTestCaseName={handleSaveTestCaseName}
            handleCancelEditTestCaseName={handleCancelEditTestCaseName}
            handleRunTestCase={handleRunTestCase}
            handleEditTestCase={handleEditTestCase}
            handleCopyTestCase={handleCopyTestCase}
            setTestCaseToDelete={setTestCaseToDelete}
            setIsDeleteTestCaseDialogOpen={setIsDeleteTestCaseDialogOpen}
            setIsCreateTestCaseDialogOpen={setIsCreateTestCaseDialogOpen}
          />
        </div>
      </div>

      {/* All Dialogs */}
      <E2ESpaceDialogs
        space={space}
        isCreateModuleDialogOpen={isCreateModuleDialogOpen}
        setIsCreateModuleDialogOpen={setIsCreateModuleDialogOpen}
        newModuleName={newModuleName}
        setNewModuleName={setNewModuleName}
        handleCreateModule={handleCreateModule}
        isCreateSubModuleDialogOpen={isCreateSubModuleDialogOpen}
        setIsCreateSubModuleDialogOpen={setIsCreateSubModuleDialogOpen}
        newSubModuleName={newSubModuleName}
        setNewSubModuleName={setNewSubModuleName}
        subModuleParentId={subModuleParentId}
        setSubModuleParentId={setSubModuleParentId}
        handleCreateSubModule={handleCreateSubModule}
        isRenameModuleDialogOpen={isRenameModuleDialogOpen}
        setIsRenameModuleDialogOpen={setIsRenameModuleDialogOpen}
        renameModuleName={renameModuleName}
        setRenameModuleName={setRenameModuleName}
        renameModuleId={renameModuleId}
        setRenameModuleId={setRenameModuleId}
        handleRenameModule={handleRenameModule}
        isDeleteModuleDialogOpen={isDeleteModuleDialogOpen}
        setIsDeleteModuleDialogOpen={setIsDeleteModuleDialogOpen}
        handleDeleteModule={handleDeleteModule}
        getSelectedModuleName={getSelectedModuleName}
        isCreateTestCaseDialogOpen={isCreateTestCaseDialogOpen}
        setIsCreateTestCaseDialogOpen={setIsCreateTestCaseDialogOpen}
        newTestCaseName={newTestCaseName}
        setNewTestCaseName={setNewTestCaseName}
        newTestCaseDescription={newTestCaseDescription}
        setNewTestCaseDescription={setNewTestCaseDescription}
        newTestCaseCategory={newTestCaseCategory}
        setNewTestCaseCategory={setNewTestCaseCategory}
        handleCreateTestCase={handleCreateTestCase}
        isEditTestCaseDialogOpen={isEditTestCaseDialogOpen}
        setIsEditTestCaseDialogOpen={setIsEditTestCaseDialogOpen}
        editingTestCase={editingTestCase}
        setEditingTestCase={setEditingTestCase}
        editTestCaseName={editTestCaseName}
        setEditTestCaseName={setEditTestCaseName}
        editTestCaseDescription={editTestCaseDescription}
        setEditTestCaseDescription={setEditTestCaseDescription}
        editTestCaseCategory={editTestCaseCategory}
        setEditTestCaseCategory={setEditTestCaseCategory}
        editTestCaseNameInputRef={editTestCaseNameInputRef}
        handleSaveEditTestCase={handleSaveEditTestCase}
        isDeleteTestCaseDialogOpen={isDeleteTestCaseDialogOpen}
        setIsDeleteTestCaseDialogOpen={setIsDeleteTestCaseDialogOpen}
        testCaseToDelete={testCaseToDelete}
        setTestCaseToDelete={setTestCaseToDelete}
        handleDeleteTestCase={handleDeleteTestCase}
        isBatchDeleteDialogOpen={isBatchDeleteDialogOpen}
        setIsBatchDeleteDialogOpen={setIsBatchDeleteDialogOpen}
        handleConfirmBatchDelete={handleConfirmBatchDelete}
        isCopyToDialogOpen={isCopyToDialogOpen}
        setIsCopyToDialogOpen={setIsCopyToDialogOpen}
        isMoveToDialogOpen={isMoveToDialogOpen}
        setIsMoveToDialogOpen={setIsMoveToDialogOpen}
        targetModuleId={targetModuleId}
        setTargetModuleId={setTargetModuleId}
        handleConfirmCopyTo={handleConfirmCopyTo}
        handleConfirmMoveTo={handleConfirmMoveTo}
        selectedTestCaseIds={selectedTestCaseIds}
        isEnvironmentDialogOpen={isEnvironmentDialogOpen}
        setIsEnvironmentDialogOpen={setIsEnvironmentDialogOpen}
        environments={environments}
        selectedEnvironmentId={selectedEnvironmentId}
        setSelectedEnvironmentId={setSelectedEnvironmentId}
        loadingEnvironments={loadingEnvironments}
        userVariableXTagHeader={userVariableXTagHeader}
        setUserVariableXTagHeader={setUserVariableXTagHeader}
        userVariableXSiteTenant={userVariableXSiteTenant}
        setUserVariableXSiteTenant={setUserVariableXSiteTenant}
        userVariableXTenantId={userVariableXTenantId}
        setUserVariableXTenantId={setUserVariableXTenantId}
        userVariableXApp={userVariableXApp}
        setUserVariableXApp={setUserVariableXApp}
        handleConfirmBatchExecute={handleConfirmBatchExecute}
        loading={loading}
      />
    </div>
  );
}

