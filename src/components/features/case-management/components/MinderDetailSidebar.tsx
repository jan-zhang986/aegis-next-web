/**
 * MinderDetailSidebar - 思维导图用例详情侧边栏组件
 * 参考 aegis-next-web 的抽屉实现
 * 
 * 功能：
 * - 基本信息 Tab：用例名称、等级、标签、前置条件、步骤/文本描述、备注
 * - 附件 Tab：关联附件列表
 * - 评论 Tab：用例评论列表
 * - 缺陷 Tab：关联缺陷列表
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Paperclip, MessageSquare, Bug, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { CASE_LEVEL_MAP } from '../constants';
import { CaseLevelBadge } from './CaseLevelBadge';
import type { MinderTreeNode } from '../hooks/useMinderOperations';

interface CaseDetail {
  id: string;
  name: string;
  moduleId?: string;
  moduleName?: string;
  priority?: string;
  tags?: string[];
  prerequisite?: string;
  caseEditType?: 'STEP' | 'TEXT';
  steps?: Array<{ id?: string; num?: number; desc: string; result: string }>;
  textDescription?: string;
  expectedResult?: string;
  description?: string;
  attachments?: Array<{ id: string; fileName: string; size: number }>;
  isNew?: boolean;
}

interface MinderDetailSidebarProps {
  visible: boolean;
  selectedNode: MinderTreeNode | null;
  caseDetail: CaseDetail | null;
  loading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSave: (data: Partial<CaseDetail>) => void;
  onLoadDetail: (caseId: string) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'P0', label: 'P0' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
];

export function MinderDetailSidebar({
  visible,
  selectedNode,
  caseDetail,
  loading = false,
  disabled = false,
  onClose,
  onSave,
  onLoadDetail,
}: MinderDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState('baseInfo');
  const [formData, setFormData] = useState<Partial<CaseDetail>>({});
  const [isDirty, setIsDirty] = useState(false);

  // 当选中节点变化时，加载详情
  useEffect(() => {
    if (visible && selectedNode?.isCase && selectedNode.id && !selectedNode.isNew) {
      try {
        onLoadDetail(selectedNode.id);
      } catch (err) {
        console.error('加载用例详情失败:', err);
      }
    }
  }, [visible, selectedNode?.id, selectedNode?.isCase, selectedNode?.isNew, onLoadDetail]);

  // 当详情数据变化时，更新表单
  useEffect(() => {
    if (caseDetail) {
      // 确保 steps 始终是数组
      let steps = caseDetail.steps;
      if (!Array.isArray(steps)) {
        // 如果 steps 不是数组，尝试转换
        if (steps && typeof steps === 'object') {
          // 如果是对象，尝试转换为数组
          steps = Object.values(steps);
        } else {
          // 否则使用空数组
          steps = [];
        }
      }
      // 如果 steps 为空，且是 STEP 类型，至少提供一个空步骤
      if (caseDetail.caseEditType === 'STEP' && (!steps || steps.length === 0)) {
        steps = [{ desc: '', result: '' }];
      }
      
      setFormData({
        name: caseDetail.name,
        priority: caseDetail.priority,
        tags: Array.isArray(caseDetail.tags) ? caseDetail.tags : [],
        prerequisite: caseDetail.prerequisite || '',
        caseEditType: caseDetail.caseEditType || 'STEP',
        steps: steps,
        textDescription: caseDetail.textDescription || '',
        expectedResult: caseDetail.expectedResult || '',
        description: caseDetail.description || '',
      });
      setIsDirty(false);
    } else if (selectedNode?.isNew) {
      // 新建用例，使用节点数据初始化
      setFormData({
        name: selectedNode.name || '',
        priority: 'P0',
        tags: [],
        prerequisite: '',
        caseEditType: 'STEP',
        steps: [{ desc: '', result: '' }],
        textDescription: '',
        expectedResult: '',
        description: '',
      });
      setIsDirty(false);
    }
  }, [caseDetail, selectedNode]);

  const handleFieldChange = useCallback((field: keyof CaseDetail, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    onSave(formData);
    setIsDirty(false);
  }, [formData, onSave]);

  const handleClose = useCallback(() => {
    if (isDirty && window.confirm('有未保存的修改，确定关闭？')) {
      onClose();
    } else if (!isDirty) {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleStepChange = useCallback((index: number, field: 'desc' | 'result', value: string) => {
    const steps = Array.isArray(formData.steps) ? [...formData.steps] : [];
    if (steps[index]) {
      steps[index] = { ...steps[index], [field]: value };
      handleFieldChange('steps', steps);
    }
  }, [formData.steps, handleFieldChange]);

  const handleAddStep = useCallback(() => {
    const steps = Array.isArray(formData.steps) ? [...formData.steps] : [];
    steps.push({ desc: '', result: '' });
    handleFieldChange('steps', steps);
  }, [formData.steps, handleFieldChange]);

  const handleRemoveStep = useCallback((index: number) => {
    const steps = Array.isArray(formData.steps) ? [...formData.steps] : [];
    steps.splice(index, 1);
    handleFieldChange('steps', steps);
  }, [formData.steps, handleFieldChange]);

  if (!visible) {
    return null;
  }

  // 如果没有选中节点或不是用例节点，不显示
  if (!selectedNode || !selectedNode.isCase) {
    return null;
  }

  const isCase = selectedNode.isCase;
  const isNewCase = selectedNode.isNew;
  const showTabs = isCase && !isNewCase;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-gray-200 shadow-lg z-50',
        'flex flex-col transition-transform duration-300',
        visible ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <h3 className="text-base font-medium text-gray-900">
          {isNewCase ? '新建用例' : '用例详情'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : showTabs ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 shrink-0">
              <TabsTrigger value="baseInfo" className="gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="attachment" className="gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                附件
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                评论
              </TabsTrigger>
              <TabsTrigger value="bug" className="gap-1.5">
                <Bug className="w-3.5 h-3.5" />
                缺陷
              </TabsTrigger>
            </TabsList>

            <TabsContent value="baseInfo" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <BaseInfoForm
                    formData={formData}
                    disabled={disabled}
                    onFieldChange={handleFieldChange}
                    onStepChange={handleStepChange}
                    onAddStep={handleAddStep}
                    onRemoveStep={handleRemoveStep}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="attachment" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <AttachmentTab attachments={caseDetail?.attachments || []} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="text-sm text-gray-500 text-center py-8">
                    暂无评论
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bug" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="text-sm text-gray-500 text-center py-8">
                    暂无关联缺陷
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <BaseInfoForm
                formData={formData}
                disabled={disabled}
                onFieldChange={handleFieldChange}
                onStepChange={handleStepChange}
                onAddStep={handleAddStep}
                onRemoveStep={handleRemoveStep}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      {!disabled && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 shrink-0">
          <Button variant="outline" size="sm" onClick={handleClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            保存
          </Button>
        </div>
      )}
    </div>
  );
}

// 基本信息表单组件
interface BaseInfoFormProps {
  formData: Partial<CaseDetail>;
  disabled?: boolean;
  onFieldChange: (field: keyof CaseDetail, value: any) => void;
  onStepChange: (index: number, field: 'desc' | 'result', value: string) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
}

function BaseInfoForm({
  formData,
  disabled = false,
  onFieldChange,
  onStepChange,
  onAddStep,
  onRemoveStep,
}: BaseInfoFormProps) {
  return (
    <>
      {/* 用例名称 */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">用例名称</Label>
        <Input
          value={formData.name || ''}
          onChange={(e) => onFieldChange('name', e.target.value)}
          disabled={disabled}
          placeholder="请输入用例名称"
        />
      </div>

      {/* 用例等级 */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">用例等级</Label>
        <Select
          value={formData.priority || 'P0'}
          onValueChange={(value) => onFieldChange('priority', value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <CaseLevelBadge level={option.value} size="sm" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 前置条件 */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">前置条件</Label>
        <Textarea
          value={formData.prerequisite || ''}
          onChange={(e) => onFieldChange('prerequisite', e.target.value)}
          disabled={disabled}
          placeholder="请输入前置条件"
          rows={2}
        />
      </div>

      {/* 步骤描述 */}
      {formData.caseEditType === 'STEP' && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">步骤描述</Label>
          <div className="space-y-2">
            {(Array.isArray(formData.steps) ? formData.steps : []).map((step, index) => (
              <div key={index} className="p-3 border rounded-md bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">步骤 {index + 1}</span>
                  {!disabled && (formData.steps?.length || 0) > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-red-500 hover:text-red-600"
                      onClick={() => onRemoveStep(index)}
                    >
                      删除
                    </Button>
                  )}
                </div>
                <Textarea
                  value={step.desc}
                  onChange={(e) => onStepChange(index, 'desc', e.target.value)}
                  disabled={disabled}
                  placeholder="步骤描述"
                  rows={2}
                />
                <Textarea
                  value={step.result}
                  onChange={(e) => onStepChange(index, 'result', e.target.value)}
                  disabled={disabled}
                  placeholder="预期结果"
                  rows={2}
                />
              </div>
            ))}
            {!disabled && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onAddStep}
              >
                添加步骤
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 文本描述 */}
      {formData.caseEditType === 'TEXT' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">文本描述</Label>
            <Textarea
              value={formData.textDescription || ''}
              onChange={(e) => onFieldChange('textDescription', e.target.value)}
              disabled={disabled}
              placeholder="请输入文本描述"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">预期结果</Label>
            <Textarea
              value={formData.expectedResult || ''}
              onChange={(e) => onFieldChange('expectedResult', e.target.value)}
              disabled={disabled}
              placeholder="请输入预期结果"
              rows={3}
            />
          </div>
        </>
      )}

      {/* 备注 */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">备注</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
          disabled={disabled}
          placeholder="请输入备注"
          rows={2}
        />
      </div>
    </>
  );
}

// 附件 Tab 组件
interface AttachmentTabProps {
  attachments: Array<{ id: string; fileName: string; size: number }>;
}

function AttachmentTab({ attachments }: AttachmentTabProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        暂无附件
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50"
        >
          <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="flex-1 text-sm truncate">{file.fileName}</span>
          <span className="text-xs text-gray-400 shrink-0">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
      ))}
    </div>
  );
}

export default MinderDetailSidebar;
