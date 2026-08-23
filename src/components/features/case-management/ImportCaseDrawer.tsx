/**
 * 用例导入
 * 与 aegis-next-web caseManagementFeature/components/import 保持一致
 */

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, FileText, AlertCircle, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { caseManagementService } from '@/services';
import { toast } from 'sonner';

interface ValidateInfo {
  failCount: number;
  successCount: number;
  errorMessages?: { rowNum: number; errMsg: string }[];
}

interface ImportCaseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function ImportCaseDrawer({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: ImportCaseDrawerProps) {
  const [validateType, setValidateType] = useState<'Excel' | 'Xmind'>('Excel');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cover, setCover] = useState(false);
  const [step, setStep] = useState<'upload' | 'validating' | 'result'>('upload');
  const [validateLoading, setValidateLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validateInfo, setValidateInfo] = useState<ValidateInfo>({
    failCount: 0,
    successCount: 0,
    errorMessages: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildFormData = (type: 'check' | 'import', successCount?: number) => {
    const formData = new FormData();
    const request: Record<string, unknown> = {
      projectId,
      versionId: '',
      cover,
    };
    if (type === 'import' && successCount !== undefined) {
      request.count = String(successCount);
    }
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    return formData;
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = validateType === 'Excel'
        ? await caseManagementService.downloadExcelTemplate(projectId)
        : await caseManagementService.downloadXMindTemplate(projectId);
      const blob = res instanceof Blob ? res : new Blob([res]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = validateType === 'Excel' ? 'excel_case.xlsx' : 'xmind_case.xmind';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('模板下载成功');
    } catch (err) {
      console.error('下载模板失败:', err);
      toast.error('下载模板失败');
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      toast.error('请选择要导入的文件');
      return;
    }
    setValidateLoading(true);
    setStep('validating');
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);
    try {
      const formData = buildFormData('check');
      const checkFn = validateType === 'Excel'
        ? caseManagementService.exportExcelCheck
        : caseManagementService.exportXMindCheck;
      const result: any = await checkFn(formData);
      clearInterval(timer);
      setProgress(100);
      const data = result?.data ?? result;
      setValidateInfo({
        failCount: data?.failCount ?? 0,
        successCount: data?.successCount ?? 0,
        errorMessages: data?.errorMessages ?? [],
      });
      setStep('result');
    } catch (err) {
      clearInterval(timer);
      console.error('校验失败:', err);
      toast.error('文件校验失败');
      setStep('upload');
    } finally {
      setValidateLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImportLoading(true);
    try {
      const formData = buildFormData('import', validateInfo.successCount);
      const importFn = validateType === 'Excel'
        ? caseManagementService.importExcelCase
        : caseManagementService.importXMindCase;
      await importFn(formData);
      toast.success('导入成功');
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('导入失败:', err);
      toast.error('导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedFile(null);
    setValidateInfo({ failCount: 0, successCount: 0, errorMessages: [] });
    setProgress(0);
    onOpenChange(false);
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setValidateInfo({ failCount: 0, successCount: 0, errorMessages: [] });
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (validateType === 'Excel' && !['xlsx', 'xls'].includes(ext || '')) {
        toast.error('请选择 Excel 文件 (.xlsx, .xls)');
        return;
      }
      if (validateType === 'Xmind' && ext !== 'xmind') {
        toast.error('请选择 XMind 文件 (.xmind)');
        return;
      }
      setSelectedFile(file);
    }
    e.target.value = '';
  };

  const getResultIcon = () => {
    const { successCount, failCount } = validateInfo;
    if (failCount && successCount) return <AlertCircle className="w-8 h-8 text-amber-500" />;
    if (!failCount) return <CheckCircle2 className="w-8 h-8 text-green-500" />;
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  const getResultText = () => {
    const { successCount, failCount } = validateInfo;
    if (failCount && successCount) return '部分校验失败';
    if (!failCount) return '校验成功';
    if (!successCount) return '校验失败';
    return '校验失败';
  };

  const fileSizeTip = validateType === 'Excel'
    ? '仅支持 xls/xlsx，单个大小不超过 50M'
    : '仅支持 xmind，单个大小不超过 50M';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (step !== 'validating') onOpenChange(v); }}>
      <DialogContent
        className="max-w-[520px]"
        onPointerDownOutside={(e) => step === 'validating' && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' ? '导入' : step === 'validating' ? '正在导入用例' : '导入用例'}
          </DialogTitle>
          {step === 'upload' ? (
            <DialogDescription>支持从 Excel 或 XMind 文件导入用例</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">导入用例</DialogDescription>
          )}
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <ToggleGroup
              type="single"
              value={validateType}
              onValueChange={(v) => { if (v) { setValidateType(v as 'Excel' | 'Xmind'); setSelectedFile(null); } }}
              className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
            >
              <ToggleGroupItem
                value="Excel"
                className="rounded-md px-4 py-2 text-sm data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-[#165DFF]"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Excel 导入
              </ToggleGroupItem>
              <ToggleGroupItem
                value="Xmind"
                className="rounded-md px-4 py-2 text-sm data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-[#165DFF]"
              >
                <FileText className="w-4 h-4 mr-1.5" /> Xmind 导入
              </ToggleGroupItem>
            </ToggleGroup>

            <Alert className="border-amber-200 bg-amber-50/80">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex flex-wrap items-center gap-1 text-sm text-amber-800">
                <span>上传前请先按 {validateType} 模板中的格式编辑内容，</span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-[#165DFF] font-medium"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="w-3.5 h-3.5 mr-0.5 inline" />
                  下载 {validateType} 模板
                </Button>
              </AlertDescription>
            </Alert>

            <div>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50/80 hover:border-gray-300 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={validateType === 'Excel' ? '.xlsx,.xls' : '.xmind'}
                  onChange={handleFileChange}
                />
                <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : '拖拽或点击此区域选择文件'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{fileSizeTip}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'validating' && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100">
                {validateType === 'Excel' ? (
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                ) : (
                  <FileText className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {validateType === 'Excel' ? '正在校验文件正确性' : '正在校验模版正确性'}
                </p>
                <Progress value={progress} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            <div className="text-center py-2">
              {getResultIcon()}
              <p className="mt-2 font-medium text-gray-900">{getResultText()}</p>
              <p className="text-sm text-gray-600 mt-1 leading-7">
                <span>校验通过 </span>
                <span className="text-green-600 font-medium">{validateInfo.successCount}</span>
                <span> 个用例</span>
                {validateInfo.failCount > 0 && (
                  <>
                    <span>，失败 </span>
                    <span className="text-red-600 font-medium">{validateInfo.failCount}</span>
                    <span> 个用例</span>
                  </>
                )}
              </p>
              {validateInfo.errorMessages && validateInfo.errorMessages.length > 0 && (
                <div className="mt-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-sm font-medium text-[#165DFF] hover:underline"
                      >
                        查看错误详情
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px] p-0" align="center">
                      <div className="px-4 py-3 border-b text-sm font-medium text-gray-900">
                        部分用例导入失败
                        <span className="text-gray-500 font-normal ml-1">({validateInfo.failCount})</span>
                      </div>
                      <ScrollArea className="max-h-[280px] p-4">
                        {validateInfo.errorMessages.map((item, i) => (
                          <div key={i} className="flex gap-2 py-1.5 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            {item.errMsg}
                          </div>
                        ))}
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {validateInfo.failCount > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  修改失败用例后可重新上传 {validateType} 文件
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-4">
          {step === 'upload' && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox id="cover" checked={cover} onCheckedChange={(c) => setCover(!!c)} />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="cover" className="text-sm cursor-pointer flex items-center gap-1">
                        用例 ID 相同时覆盖原用例
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px]">
                      <p>勾选：ID 相同时覆盖原用例</p>
                      <p>不勾选：ID 已存在时，跳过该用例</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>取消</Button>
                <Button onClick={handleValidate} disabled={!selectedFile || validateLoading}>
                  {validateType === 'Excel' ? '校验文件' : '校验模板'}
                </Button>
              </div>
            </>
          )}
          {step === 'result' && (
            <>
              <div />
              <div className="flex gap-2">
                {(!validateInfo.successCount || !validateInfo.failCount) && (
                  <Button variant="outline" onClick={handleClose}>
                    返回用例列表
                  </Button>
                )}
                <Button variant="outline" onClick={handleBackToUpload}>
                  返回上传页
                </Button>
                {validateInfo.successCount > 0 && (
                  <Button onClick={handleImport} disabled={importLoading}>
                    {validateInfo.failCount > 0 ? '忽略错误继续导入' : '导入'}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
