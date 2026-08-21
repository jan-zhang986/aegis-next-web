/**
 * E2ESpaceDialogs Component
 * E2E 空间相关的所有对话框组件
 * 从 E2ESpaceDetailPage.tsx 提取
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WorkflowModuleSelectDialog } from '@/components/features/common/WorkflowModuleSelectDialog';
import type { CaseRealizationSpace } from '@/services/e2e-space';
import type { TestCase } from '@/types/e2e-space';
import type { Environment } from '@/services/environment';

interface E2ESpaceDialogsProps {
  space: CaseRealizationSpace;
  // 模块相关对话框
  isCreateModuleDialogOpen: boolean;
  setIsCreateModuleDialogOpen: (open: boolean) => void;
  newModuleName: string;
  setNewModuleName: (name: string) => void;
  handleCreateModule: () => void;
  isCreateSubModuleDialogOpen: boolean;
  setIsCreateSubModuleDialogOpen: (open: boolean) => void;
  newSubModuleName: string;
  setNewSubModuleName: (name: string) => void;
  subModuleParentId: string | null;
  setSubModuleParentId: (id: string | null) => void;
  handleCreateSubModule: () => void;
  isRenameModuleDialogOpen: boolean;
  setIsRenameModuleDialogOpen: (open: boolean) => void;
  renameModuleName: string;
  setRenameModuleName: (name: string) => void;
  renameModuleId: string | null;
  setRenameModuleId: (id: string | null) => void;
  handleRenameModule: () => void;
  isDeleteModuleDialogOpen: boolean;
  setIsDeleteModuleDialogOpen: (open: boolean) => void;
  handleDeleteModule: () => void;
  getSelectedModuleName: () => string;
  // 测试用例相关对话框
  isCreateTestCaseDialogOpen: boolean;
  setIsCreateTestCaseDialogOpen: (open: boolean) => void;
  newTestCaseName: string;
  setNewTestCaseName: (name: string) => void;
  newTestCaseDescription: string;
  setNewTestCaseDescription: (description: string) => void;
  newTestCaseCategory: string;
  setNewTestCaseCategory: (category: string) => void;
  handleCreateTestCase: () => void;
  isEditTestCaseDialogOpen: boolean;
  setIsEditTestCaseDialogOpen: (open: boolean) => void;
  editingTestCase: TestCase | null;
  setEditingTestCase: (testCase: TestCase | null) => void;
  editTestCaseName: string;
  setEditTestCaseName: (name: string) => void;
  editTestCaseDescription: string;
  setEditTestCaseDescription: (description: string) => void;
  editTestCaseCategory: string;
  setEditTestCaseCategory: (category: string) => void;
  editTestCaseNameInputRef: React.RefObject<HTMLInputElement>;
  handleSaveEditTestCase: () => void;
  isDeleteTestCaseDialogOpen: boolean;
  setIsDeleteTestCaseDialogOpen: (open: boolean) => void;
  testCaseToDelete: TestCase | null;
  setTestCaseToDelete: (testCase: TestCase | null) => void;
  handleDeleteTestCase: () => void;
  isBatchDeleteDialogOpen: boolean;
  setIsBatchDeleteDialogOpen: (open: boolean) => void;
  handleConfirmBatchDelete: () => void;
  // 批量操作对话框
  isCopyToDialogOpen: boolean;
  setIsCopyToDialogOpen: (open: boolean) => void;
  isMoveToDialogOpen: boolean;
  setIsMoveToDialogOpen: (open: boolean) => void;
  targetModuleId: string;
  setTargetModuleId: (id: string) => void;
  handleConfirmCopyTo: (moduleId: string) => Promise<void>;
  handleConfirmMoveTo: (moduleId: string) => Promise<void>;
  selectedTestCaseIds: Set<string>;
  // 环境选择对话框
  isEnvironmentDialogOpen: boolean;
  setIsEnvironmentDialogOpen: (open: boolean) => void;
  environments: Environment[];
  selectedEnvironmentId: string;
  setSelectedEnvironmentId: (id: string) => void;
  loadingEnvironments: boolean;
  userVariableXTagHeader: string;
  setUserVariableXTagHeader: (value: string) => void;
  userVariableXSiteTenant: string;
  setUserVariableXSiteTenant: (value: string) => void;
  userVariableXTenantId: string;
  setUserVariableXTenantId: (value: string) => void;
  userVariableXApp: string;
  setUserVariableXApp: (value: string) => void;
  handleConfirmBatchExecute: () => void;
  // 通用状态
  loading: boolean;
}

export const E2ESpaceDialogs: React.FC<E2ESpaceDialogsProps> = ({
  space,
  isCreateModuleDialogOpen,
  setIsCreateModuleDialogOpen,
  newModuleName,
  setNewModuleName,
  handleCreateModule,
  isCreateSubModuleDialogOpen,
  setIsCreateSubModuleDialogOpen,
  newSubModuleName,
  setNewSubModuleName,
  subModuleParentId,
  setSubModuleParentId,
  handleCreateSubModule,
  isRenameModuleDialogOpen,
  setIsRenameModuleDialogOpen,
  renameModuleName,
  setRenameModuleName,
  renameModuleId,
  setRenameModuleId,
  handleRenameModule,
  isDeleteModuleDialogOpen,
  setIsDeleteModuleDialogOpen,
  handleDeleteModule,
  getSelectedModuleName,
  isCreateTestCaseDialogOpen,
  setIsCreateTestCaseDialogOpen,
  newTestCaseName,
  setNewTestCaseName,
  newTestCaseDescription,
  setNewTestCaseDescription,
  newTestCaseCategory,
  setNewTestCaseCategory,
  handleCreateTestCase,
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
  editTestCaseNameInputRef,
  handleSaveEditTestCase,
  isDeleteTestCaseDialogOpen,
  setIsDeleteTestCaseDialogOpen,
  testCaseToDelete,
  setTestCaseToDelete,
  handleDeleteTestCase,
  isBatchDeleteDialogOpen,
  setIsBatchDeleteDialogOpen,
  handleConfirmBatchDelete,
  isCopyToDialogOpen,
  setIsCopyToDialogOpen,
  isMoveToDialogOpen,
  setIsMoveToDialogOpen,
  targetModuleId,
  setTargetModuleId,
  handleConfirmCopyTo,
  handleConfirmMoveTo,
  selectedTestCaseIds,
  isEnvironmentDialogOpen,
  setIsEnvironmentDialogOpen,
  environments,
  selectedEnvironmentId,
  setSelectedEnvironmentId,
  loadingEnvironments,
  userVariableXTagHeader,
  setUserVariableXTagHeader,
  userVariableXSiteTenant,
  setUserVariableXSiteTenant,
  userVariableXTenantId,
  setUserVariableXTenantId,
  userVariableXApp,
  setUserVariableXApp,
  handleConfirmBatchExecute,
  loading,
}) => {
  return (
    <>
      {/* 新建模块对话框 */}
      <Dialog open={isCreateModuleDialogOpen} onOpenChange={setIsCreateModuleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>新建模块</DialogTitle>
            <DialogDescription>
              在当前空间下创建一个新的模块
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2.5">
              <Label htmlFor="moduleName" className="text-sm font-semibold text-gray-700">
                模块名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="moduleName"
                placeholder="请输入模块名称"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newModuleName.trim()) {
                    handleCreateModule();
                  }
                }}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModuleDialogOpen(false);
                setNewModuleName('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateModule}
              disabled={!newModuleName.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建测试用例对话框 */}
      <Dialog
        open={isCreateTestCaseDialogOpen}
        onOpenChange={(open) => {
          setIsCreateTestCaseDialogOpen(open);
          if (!open) {
            setNewTestCaseName('');
            setNewTestCaseDescription('');
            setNewTestCaseCategory('API');
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新建测试用例</DialogTitle>
            <DialogDescription>
              在当前模块下创建一个新的测试用例
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2.5">
              <Label htmlFor="testCaseName" className="text-sm font-semibold text-gray-700">
                测试名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="testCaseName"
                placeholder="请输入测试名称"
                value={newTestCaseName}
                onChange={(e) => setNewTestCaseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTestCaseName.trim()) {
                    handleCreateTestCase();
                  }
                }}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="testCaseDescription" className="text-sm font-semibold text-gray-700">
                描述
              </Label>
              <Textarea
                id="testCaseDescription"
                placeholder="请输入测试用例描述"
                value={newTestCaseDescription}
                onChange={(e) => setNewTestCaseDescription(e.target.value)}
                rows={3}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="testCaseCategory" className="text-sm font-semibold text-gray-700">
                分类 <span className="text-red-500">*</span>
              </Label>
              <Select value={newTestCaseCategory} onValueChange={setNewTestCaseCategory}>
                <SelectTrigger
                  id="testCaseCategory"
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
                >
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="UI">UI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTestCaseDialogOpen(false);
                setNewTestCaseName('');
                setNewTestCaseDescription('');
                setNewTestCaseCategory('API');
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateTestCase}
              disabled={!newTestCaseName.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑测试用例对话框 */}
      <Dialog
        open={isEditTestCaseDialogOpen}
        onOpenChange={(open) => {
          setIsEditTestCaseDialogOpen(open);
          if (!open) {
            setEditingTestCase(null);
            setEditTestCaseName('');
            setEditTestCaseDescription('');
            setEditTestCaseCategory('API');
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[500px]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setTimeout(() => {
              if (editTestCaseNameInputRef.current) {
                editTestCaseNameInputRef.current.focus();
                editTestCaseNameInputRef.current.setSelectionRange(
                  editTestCaseNameInputRef.current.value.length,
                  editTestCaseNameInputRef.current.value.length
                );
              }
            }, 0);
          }}
        >
          <DialogHeader>
            <DialogTitle>编辑测试用例</DialogTitle>
            <DialogDescription>
              修改测试用例的名称、描述和分类
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2.5">
              <Label htmlFor="editTestCaseName" className="text-sm font-semibold text-gray-700">
                测试名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={editTestCaseNameInputRef}
                id="editTestCaseName"
                placeholder="请输入测试名称"
                value={editTestCaseName}
                onChange={(e) => setEditTestCaseName(e.target.value)}
                onMouseDown={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.selectionStart !== null && target.selectionEnd !== null) {
                    if (target.selectionStart !== target.selectionEnd) {
                      e.preventDefault();
                      const clickPosition = target.selectionStart;
                      target.setSelectionRange(clickPosition, clickPosition);
                    }
                  }
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  setTimeout(() => {
                    target.setSelectionRange(target.value.length, target.value.length);
                  }, 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editTestCaseName.trim()) {
                    handleSaveEditTestCase();
                  }
                }}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="editTestCaseDescription" className="text-sm font-semibold text-gray-700">
                描述
              </Label>
              <Textarea
                id="editTestCaseDescription"
                placeholder="请输入测试用例描述"
                value={editTestCaseDescription}
                onChange={(e) => setEditTestCaseDescription(e.target.value)}
                rows={3}
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="editTestCaseCategory" className="text-sm font-semibold text-gray-700">
                分类 <span className="text-red-500">*</span>
              </Label>
              <Select value={editTestCaseCategory} onValueChange={setEditTestCaseCategory}>
                <SelectTrigger
                  id="editTestCaseCategory"
                  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
                >
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="UI">UI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTestCaseDialogOpen(false);
                setEditingTestCase(null);
                setEditTestCaseName('');
                setEditTestCaseDescription('');
                setEditTestCaseCategory('API');
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveEditTestCase}
              disabled={!editTestCaseName.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除模块确认对话框 */}
      <AlertDialog open={isDeleteModuleDialogOpen} onOpenChange={setIsDeleteModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模块</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除模块 <span className="font-semibold text-gray-900">"{getSelectedModuleName()}"</span> 吗？
              <br />
              <span className="text-red-600 mt-2 block">此操作不可恢复，模块下的所有测试用例也将一并删除。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModule}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加子模块对话框 */}
      <Dialog open={isCreateSubModuleDialogOpen} onOpenChange={setIsCreateSubModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加子模块</DialogTitle>
            <DialogDescription>
              请输入子模块名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2.5 py-4">
            <Label htmlFor="subModuleName" className="text-sm font-semibold text-gray-700">
              子模块名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subModuleName"
              value={newSubModuleName}
              onChange={(e) => setNewSubModuleName(e.target.value)}
              placeholder="请输入子模块名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSubModuleName.trim()) {
                  handleCreateSubModule();
                }
              }}
              autoFocus
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateSubModuleDialogOpen(false);
                setNewSubModuleName('');
                setSubModuleParentId(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateSubModule}
              disabled={!newSubModuleName.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名模块对话框 */}
      <Dialog open={isRenameModuleDialogOpen} onOpenChange={setIsRenameModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名模块</DialogTitle>
            <DialogDescription>
              请输入新的模块名称
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2.5 py-4">
            <Label htmlFor="renameModuleName" className="text-sm font-semibold text-gray-700">
              模块名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="renameModuleName"
              value={renameModuleName}
              onChange={(e) => setRenameModuleName(e.target.value)}
              placeholder="请输入模块名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameModuleName.trim()) {
                  handleRenameModule();
                }
              }}
              autoFocus
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-10"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameModuleDialogOpen(false);
                setRenameModuleName('');
                setRenameModuleId(null);
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleRenameModule}
              disabled={!renameModuleName.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用例确认对话框 */}
      <AlertDialog open={isDeleteTestCaseDialogOpen} onOpenChange={setIsDeleteTestCaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用例</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除测试用例 <span className="font-semibold text-gray-900">"{testCaseToDelete?.name}"</span> 吗？
              <br />
              <span className="text-red-600 mt-2 block">此操作不可恢复。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              onClick={() => {
                setTestCaseToDelete(null);
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTestCase}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 <span className="font-semibold text-gray-900">{selectedTestCaseIds.size}</span> 个测试用例吗？
              <br />
              <span className="text-red-600 mt-2 block">此操作不可恢复。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={loading}
              onClick={() => setIsBatchDeleteDialogOpen(false)}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBatchDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 环境选择对话框 */}
      <Dialog open={isEnvironmentDialogOpen} onOpenChange={setIsEnvironmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>选择执行环境</DialogTitle>
            <DialogDescription>
              请选择批量执行测试用例的环境，共 {selectedTestCaseIds.size} 个测试用例
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="environment">
                执行环境 <span className="text-red-500">*</span>
              </Label>
              {loadingEnvironments ? (
                <div className="text-sm text-gray-500">加载环境中...</div>
              ) : environments.length === 0 ? (
                <div className="text-sm text-red-500">暂无可用环境，请先创建环境</div>
              ) : (
                <Select value={selectedEnvironmentId} onValueChange={setSelectedEnvironmentId}>
                  <SelectTrigger id="environment" className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="请选择环境" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env, i) => (
                      <SelectItem key={env.id ?? `env-${i}`} value={env.id ?? ''}>
                        {env.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="x-tag-header">X-Tag-Header</Label>
              <Input
                id="x-tag-header"
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={userVariableXTagHeader}
                onChange={(e) => setUserVariableXTagHeader(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="x-site-tenant">X-Site-Tenant</Label>
              <Input
                id="x-site-tenant"
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={userVariableXSiteTenant}
                onChange={(e) => setUserVariableXSiteTenant(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="x-tenant-id">X-Tenant-Id</Label>
              <Input
                id="x-tenant-id"
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={userVariableXTenantId}
                onChange={(e) => setUserVariableXTenantId(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="x-app">X-App</Label>
              <Input
                id="x-app"
                className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={userVariableXApp}
                onChange={(e) => setUserVariableXApp(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEnvironmentDialogOpen(false);
                setSelectedEnvironmentId('');
                setUserVariableXTagHeader('');
                setUserVariableXSiteTenant('');
                setUserVariableXTenantId('');
                setUserVariableXApp('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmBatchExecute}
              disabled={!selectedEnvironmentId || loadingEnvironments || environments.length === 0}
            >
              确认执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量复制到对话框 */}
      <WorkflowModuleSelectDialog
        open={isCopyToDialogOpen}
        onOpenChange={setIsCopyToDialogOpen}
        projectId={space.projectId || localStorage.getItem('currentProjectId') || ''}
        workspaceId={space.id}
        selectedModuleId={targetModuleId}
        onModuleChange={setTargetModuleId}
        onConfirm={handleConfirmCopyTo}
        title="复制到"
        caseCount={selectedTestCaseIds.size}
        operationType="copy"
      />

      {/* 批量移动到对话框 */}
      <WorkflowModuleSelectDialog
        open={isMoveToDialogOpen}
        onOpenChange={setIsMoveToDialogOpen}
        projectId={space.projectId || localStorage.getItem('currentProjectId') || ''}
        workspaceId={space.id}
        selectedModuleId={targetModuleId}
        onModuleChange={setTargetModuleId}
        onConfirm={handleConfirmMoveTo}
        title="移动到"
        caseCount={selectedTestCaseIds.size}
        operationType="move"
      />
    </>
  );
};
