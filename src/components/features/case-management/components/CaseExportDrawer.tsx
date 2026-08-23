/**
 * 用例导出抽屉（优化版）
 * 支持 Excel 和 XMind 导出，参考 aegis-next-web MsExportDrawer
 * 优化：双栏布局、拖拽排序、搜索功能、更好的视觉效果
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FileSpreadsheet, FileText, Loader2, Download, X, Search, GripVertical, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { caseManagementService } from '@/services';
import { toast } from 'sonner';
import { useExportWebSocket } from '@/hooks/useExportWebSocket';
import { cn } from '@/utils/cn';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 生成唯一 ID
function getGenerateId(): string {
  return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export type ExportType = 'exportExcel' | 'exportXMind';

export interface ExportParams {
  projectId: string;
  selectIds: string[];
  selectAll: boolean;
  excludeIds: string[];
  moduleIds: string[];
  condition?: Record<string, unknown>;
}

interface ExportFieldOption {
  key: string;
  text: string;
  columnType: 'system' | 'custom' | 'other';
}

interface ExportConfig {
  systemColumns?: Record<string, string> | { id: string; name: string }[];
  customColumns?: Record<string, string> | { id: string; name: string }[];
  otherColumns?: Record<string, string> | { id: string; name: string }[];
}

// 可排序的字段项组件
interface SortableFieldItemProps {
  field: ExportFieldOption;
  onRemove: (key: string) => void;
}

function SortableFieldItem({ field, onRemove }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: field.key,
    disabled: field.key === 'name', // name 字段不可拖拽
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 bg-white p-2 rounded-md border transition-colors group",
        isDragging 
          ? "border-blue-300 shadow-md z-10" 
          : "border-gray-200 hover:border-blue-300"
      )}
    >
      {field.key !== 'name' ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="拖拽排序"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-gray-300" />
        </div>
      )}
      <span className="flex-1 text-sm truncate">{field.text}</span>
      {field.key !== 'name' && (
        <button
          onClick={() => onRemove(field.key)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
        >
          <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
        </button>
      )}
    </div>
  );
}

interface CaseExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: ExportType;
  /** 展示用：已选条数或全部约条数 */
  selectCount: number;
  /** 是否导出当前筛选下全部（未勾选任何行时） */
  selectAll?: boolean;
  params: ExportParams;
  onSuccess?: () => void;
}

export function CaseExportDrawer({
  open,
  onOpenChange,
  exportType,
  selectCount,
  selectAll = false,
  params,
  onSuccess,
}: CaseExportDrawerProps) {
  const [isMerge, setIsMerge] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    systemColumns: {},
    customColumns: {},
    otherColumns: {},
  });
  const [selectedFields, setSelectedFields] = useState<ExportFieldOption[]>([]);
  const [exportingMessageId, setExportingMessageId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const reportIdRef = useRef<string>('');
  const taskIdRef = useRef<string>('');

  // 初始化导出配置
  useEffect(() => {
    if (open && params.projectId) {
      setLoading(true);
      caseManagementService.getCaseExportConfig(params.projectId)
        .then((res: any) => {
          const config: ExportConfig = {
            systemColumns: res?.systemColumns ?? res?.systemFields ?? {},
            customColumns: res?.customColumns ?? res?.customFields ?? {},
            otherColumns: res?.otherColumns ?? {},
          };
          setExportConfig(config);
          
          // 设置默认选中字段（name 必须选中）
          const defaultKeys = ['name'];
          const allFields = getAllFieldsFromConfig(config);
          const defaultFields = allFields.filter(f => defaultKeys.includes(f.key));
          setSelectedFields(defaultFields);
        })
        .catch(() => {
          setExportConfig({ systemColumns: {}, customColumns: {}, otherColumns: {} });
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!open) {
      // 关闭时重置状态
      setSearchKeyword('');
      setSelectedFields([]);
      setIsMerge(false);
    }
  }, [open, params.projectId]);

  // 从配置中获取所有字段
  const getAllFieldsFromConfig = useCallback((config: ExportConfig): ExportFieldOption[] => {
    const fields: ExportFieldOption[] = [];
    
    // 系统字段
    if (config.systemColumns) {
      if (Array.isArray(config.systemColumns)) {
        config.systemColumns.forEach((col: any) => {
          fields.push({
            key: col.id || col.key || '',
            text: col.name || col.text || '',
            columnType: 'system',
          });
        });
      } else {
        Object.keys(config.systemColumns).forEach((key) => {
          fields.push({
            key,
            text: config.systemColumns![key],
            columnType: 'system',
          });
        });
      }
    }
    
    // 自定义字段
    if (config.customColumns) {
      if (Array.isArray(config.customColumns)) {
        config.customColumns.forEach((col: any) => {
          fields.push({
            key: col.id || col.key || '',
            text: col.name || col.text || '',
            columnType: 'custom',
          });
        });
      } else {
        Object.keys(config.customColumns).forEach((key) => {
          fields.push({
            key,
            text: config.customColumns![key],
            columnType: 'custom',
          });
        });
      }
    }
    
    // 其他字段
    if (config.otherColumns) {
      if (Array.isArray(config.otherColumns)) {
        config.otherColumns.forEach((col: any) => {
          fields.push({
            key: col.id || col.key || '',
            text: col.name || col.text || '',
            columnType: 'other',
          });
        });
      } else {
        Object.keys(config.otherColumns).forEach((key) => {
          fields.push({
            key,
            text: config.otherColumns![key],
            columnType: 'other',
          });
        });
      }
    }
    
    return fields;
  }, []);

  // 计算所有字段（使用 useMemo 优化性能）
  const allFields = useMemo(() => getAllFieldsFromConfig(exportConfig), [exportConfig, getAllFieldsFromConfig]);
  
  // 过滤字段（根据搜索关键词）
  const filteredFields = useMemo(() => {
    if (!searchKeyword.trim()) return allFields;
    const keyword = searchKeyword.toLowerCase();
    return allFields.filter(f => f.text.toLowerCase().includes(keyword));
  }, [allFields, searchKeyword]);

  const systemFields = useMemo(() => filteredFields.filter(f => f.columnType === 'system'), [filteredFields]);
  const customFields = useMemo(() => filteredFields.filter(f => f.columnType === 'custom'), [filteredFields]);
  const otherFields = useMemo(() => filteredFields.filter(f => f.columnType === 'other'), [filteredFields]);

  // 计算选中状态
  const selectedSystemIds = useMemo(() => 
    selectedFields.filter(f => f.columnType === 'system').map(f => f.key),
    [selectedFields]
  );
  const selectedCustomIds = useMemo(() => 
    selectedFields.filter(f => f.columnType === 'custom').map(f => f.key),
    [selectedFields]
  );
  const selectedOtherIds = useMemo(() => 
    selectedFields.filter(f => f.columnType === 'other').map(f => f.key),
    [selectedFields]
  );

  const isSystemAllSelected = useMemo(() => 
    systemFields.length > 0 && systemFields.every(f => selectedFields.find(sf => sf.key === f.key)),
    [systemFields, selectedFields]
  );
  const isCustomAllSelected = useMemo(() => 
    customFields.length > 0 && customFields.every(f => selectedFields.find(sf => sf.key === f.key)),
    [customFields, selectedFields]
  );
  const isOtherAllSelected = useMemo(() => 
    otherFields.length > 0 && otherFields.every(f => selectedFields.find(sf => sf.key === f.key)),
    [otherFields, selectedFields]
  );

  const isSystemIndeterminate = useMemo(() => 
    selectedSystemIds.length > 0 && selectedSystemIds.length < systemFields.length,
    [selectedSystemIds, systemFields]
  );
  const isCustomIndeterminate = useMemo(() => 
    selectedCustomIds.length > 0 && selectedCustomIds.length < customFields.length,
    [selectedCustomIds, customFields]
  );
  const isOtherIndeterminate = useMemo(() => 
    selectedOtherIds.length > 0 && selectedOtherIds.length < otherFields.length,
    [selectedOtherIds, otherFields]
  );

  // WebSocket hook
  const { websocket, createSocket } = useExportWebSocket({
    reportId: '',
    socketUrl: '/ws/export',
    onMessage: (data: {
      msgType: string;
      fileId?: string;
      taskId?: string;
      isSuccessful?: boolean;
      count?: number;
    }) => {
      if (data.msgType === 'EXEC_RESULT') {
        if (exportingMessageId) {
          toast.dismiss(exportingMessageId);
          setExportingMessageId(null);
        }
        
        if (data.isSuccessful && data.fileId) {
          downloadFile(data.fileId, data.count || 0);
        } else {
          toast.error('导出失败');
        }
        
        setExporting(false);
        setCurrentTaskId(null);
        onOpenChange(false);
        onSuccess?.();
        
        if (websocket.current) {
          websocket.current.close();
          websocket.current = undefined;
        }
      }
    },
  });

  // 下载文件
  const downloadFile = async (fileId: string, count: number) => {
    try {
      const response = await caseManagementService.getCaseDownloadFile(params.projectId, fileId);
      const blob = response instanceof Blob ? response : new Blob([response]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = exportType === 'exportExcel' ? 'xlsx' : 'xmind';
      a.download = `cases.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`导出成功，共导出 ${count} 条用例`, {
        duration: 10000,
      });
    } catch (error) {
      console.error('下载文件失败:', error);
      toast.error('下载文件失败');
    }
  };

  // 取消导出
  const handleCancelExport = async () => {
    if (!currentTaskId) return;
    try {
      await caseManagementService.stopCaseExport(currentTaskId);
      if (exportingMessageId) {
        toast.dismiss(exportingMessageId);
        setExportingMessageId(null);
      }
      toast.info('已取消导出');
      setCurrentTaskId(null);
      setExporting(false);
      onOpenChange(false);
      
      if (websocket.current) {
        websocket.current.close();
        websocket.current = undefined;
      }
    } catch {
      toast.error('取消失败');
    }
  };

  // 字段选择处理
  const handleFieldToggle = useCallback((field: ExportFieldOption, checked: boolean) => {
    if (field.key === 'name' && !checked) {
      return;
    }
    
    setSelectedFields(prev => {
      if (checked) {
        return [...prev, field];
      } else {
        return prev.filter(f => f.key !== field.key);
      }
    });
  }, []);

  const handleSystemAllToggle = useCallback((checked: boolean) => {
    setSelectedFields(prev => {
      if (checked) {
        const newFields = [...prev];
        systemFields.forEach(field => {
          if (!newFields.find(f => f.key === field.key)) {
            newFields.push(field);
          }
        });
        return newFields;
      } else {
        return prev.filter(f => f.columnType !== 'system' || f.key === 'name');
      }
    });
  }, [systemFields]);

  const handleCustomAllToggle = useCallback((checked: boolean) => {
    setSelectedFields(prev => {
      if (checked) {
        const newFields = [...prev];
        customFields.forEach(field => {
          if (!newFields.find(f => f.key === field.key)) {
            newFields.push(field);
          }
        });
        return newFields;
      } else {
        return prev.filter(f => f.columnType !== 'custom');
      }
    });
  }, [customFields]);

  const handleOtherAllToggle = useCallback((checked: boolean) => {
    setSelectedFields(prev => {
      if (checked) {
        const newFields = [...prev];
        otherFields.forEach(field => {
          if (!newFields.find(f => f.key === field.key)) {
            newFields.push(field);
          }
        });
        return newFields;
      } else {
        return prev.filter(f => f.columnType !== 'other');
      }
    });
  }, [otherFields]);

  // 移除已选字段
  const handleRemoveField = useCallback((key: string) => {
    if (key === 'name') return;
    setSelectedFields(prev => prev.filter(f => f.key !== key));
  }, []);

  // 拖拽排序处理
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动8像素后才激活拖拽，避免与点击冲突
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = selectedFields.findIndex((field) => field.key === active.id);
    const newIndex = selectedFields.findIndex((field) => field.key === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setSelectedFields((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [selectedFields]);

  // 重置字段选择
  const handleReset = useCallback(() => {
    const defaultFields = allFields.filter(f => f.key === 'name');
    setSelectedFields(defaultFields);
  }, [allFields]);

  // 开始导出
  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('请至少选择一个导出字段');
      return;
    }

    setExporting(true);
    setCurrentTaskId(null);
    
    try {
      reportIdRef.current = getGenerateId();
      taskIdRef.current = '';
      
      await createSocket(reportIdRef.current);
      
      const getConfirmFields = (columnType: string) => {
        return selectedFields
          .filter((item) => item.columnType === columnType)
          .map((item) => ({ id: item.key, name: item.text }));
      };

      const baseParams = {
        projectId: params.projectId,
        selectIds: params.selectAll ? [] : params.selectIds,
        excludeIds: params.excludeIds || [],
        moduleIds: params.moduleIds || [],
        condition: params.condition || {},
        selectAll: params.selectAll,
        systemFields: getConfirmFields('system'),
        customFields: getConfirmFields('custom'),
        fileId: reportIdRef.current,
      };

      let res: any;
      if (exportType === 'exportExcel') {
        res = await caseManagementService.exportExcelCase({
          ...baseParams,
          otherFields: getConfirmFields('other'),
          isMerge,
        });
      } else {
        res = await caseManagementService.exportXMindCase(baseParams);
      }

      const taskId = res?.taskId ?? res?.data?.taskId ?? (typeof res === 'string' ? res : null);
      if (taskId) {
        taskIdRef.current = taskId;
        setCurrentTaskId(taskId);
      }

      const messageId = toast.loading('正在导出，请稍候...', {
        duration: Infinity,
        action: {
          label: '取消',
          onClick: () => handleCancelExport(),
        },
      });
      setExportingMessageId(String(messageId));
    } catch (err: any) {
      console.error('导出失败:', err);
      toast.error(err?.message || '导出失败');
      setCurrentTaskId(null);
      setExporting(false);
      if (websocket.current) {
        websocket.current.close();
        websocket.current = undefined;
      }
    }
  };

  const title = exportType === 'exportExcel' ? '导出 Excel' : '导出 XMind';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">{title}</SheetTitle>
              <p className="text-sm text-gray-500 mt-1">
                {selectAll
                  ? `将导出当前筛选条件下的全部用例（约 ${selectCount} 条）`
                  : `已选 ${selectCount} 条用例`}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              已选 {selectedFields.length} 个字段
            </Badge>
          </div>
        </SheetHeader>
        
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：可选字段 */}
          <div className="flex-1 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">可选字段</Label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="搜索字段..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-8 h-8 text-sm w-32"
                    />
                  </div>
                </div>
              </div>
              {searchKeyword && (
                <p className="text-xs text-gray-500">
                  找到 {filteredFields.length} 个匹配字段
                </p>
              )}
            </div>
            
            <ScrollArea className="flex-1 px-4 py-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">加载中...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Excel 导出格式选择 */}
                  {exportType === 'exportExcel' && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <Label className="text-sm font-medium mb-2 block">导出格式</Label>
                      <RadioGroup 
                        value={isMerge ? 'merge' : 'default'} 
                        onValueChange={(v) => setIsMerge(v === 'merge')} 
                        className="gap-3"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="default" id="default" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="default" className="font-normal text-sm cursor-pointer">
                              默认格式
                            </Label>
                            <p className="text-xs text-gray-500 mt-0.5">
                              一个用例一行，多个步骤在一个单元格内
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                          <div className="flex-1">
                            <Label htmlFor="merge" className="font-normal text-sm cursor-pointer">
                              单元格拆分
                            </Label>
                            <p className="text-xs text-gray-500 mt-0.5">
                              一个步骤一个单元格，一个用例占用多行
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* 系统字段 */}
                  {systemFields.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSystemAllSelected}
                          onCheckedChange={handleSystemAllToggle}
                        />
                        <Label className="text-sm font-medium">系统字段</Label>
                        <Badge variant="outline" className="text-xs ml-2">
                          {selectedSystemIds.length}/{systemFields.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        {systemFields.map((field) => (
                          <div key={field.key} className="flex items-center space-x-2 group">
                            <Checkbox
                              checked={!!selectedFields.find(f => f.key === field.key)}
                              onCheckedChange={(checked) => handleFieldToggle(field, !!checked)}
                              disabled={field.key === 'name'}
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Label className="text-sm font-normal cursor-pointer flex-1 truncate">
                                    {field.text}
                                  </Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{field.text}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 自定义字段 */}
                  {customFields.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCustomAllSelected}
                          onCheckedChange={handleCustomAllToggle}
                        />
                        <Label className="text-sm font-medium">自定义字段</Label>
                        <Badge variant="outline" className="text-xs ml-2">
                          {selectedCustomIds.length}/{customFields.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        {customFields.map((field) => (
                          <div key={field.key} className="flex items-center space-x-2 group">
                            <Checkbox
                              checked={!!selectedFields.find(f => f.key === field.key)}
                              onCheckedChange={(checked) => handleFieldToggle(field, !!checked)}
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Label className="text-sm font-normal cursor-pointer flex-1 truncate">
                                    {field.text}
                                  </Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{field.text}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 其他字段 */}
                  {otherFields.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isOtherAllSelected}
                          onCheckedChange={handleOtherAllToggle}
                        />
                        <Label className="text-sm font-medium">其他字段</Label>
                        <Badge variant="outline" className="text-xs ml-2">
                          {selectedOtherIds.length}/{otherFields.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-6">
                        {otherFields.map((field) => (
                          <div key={field.key} className="flex items-center space-x-2 group">
                            <Checkbox
                              checked={!!selectedFields.find(f => f.key === field.key)}
                              onCheckedChange={(checked) => handleFieldToggle(field, !!checked)}
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Label className="text-sm font-normal cursor-pointer flex-1 truncate">
                                    {field.text}
                                  </Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{field.text}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {allFields.length === 0 && !loading && (
                    <div className="text-sm text-gray-500 text-center py-8">
                      <Info className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <p>暂无可用字段</p>
                    </div>
                  )}

                  {filteredFields.length === 0 && searchKeyword && (
                    <div className="text-sm text-gray-500 text-center py-8">
                      <p>未找到匹配的字段</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 右侧：已选字段 */}
          <div className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">已选字段 ({selectedFields.length})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={selectedFields.length === 0 || selectedFields.length === 1 && selectedFields[0]?.key === 'name'}
                >
                  重置
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 px-4 py-3">
              {selectedFields.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  <p>请从左侧选择要导出的字段</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedFields.map(f => f.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedFields.map((field) => (
                        <SortableFieldItem
                          key={field.key}
                          field={field}
                          onRemove={handleRemoveField}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t gap-2 bg-white">
          {exporting && currentTaskId ? (
            <Button variant="outline" onClick={handleCancelExport}>
              <X className="w-4 h-4 mr-2" />
              取消导出
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
              取消
            </Button>
          )}
          <Button 
            onClick={handleExport} 
            disabled={exporting || selectedFields.length === 0 || loading}
            className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                导出
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
