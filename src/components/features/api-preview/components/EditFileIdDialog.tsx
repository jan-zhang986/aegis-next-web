import { FileIcon, FileUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface EditFileIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFileId: string | null | undefined;
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  isUpdating: boolean;
  onClose: () => void;
}

export function EditFileIdDialog({
  open,
  onOpenChange,
  currentFileId,
  selectedFile,
  fileInputRef,
  onFileSelect,
  onUpload,
  isUploading,
  isUpdating,
  onClose,
}: EditFileIdDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>上传新文件覆盖</DialogTitle>
          <DialogDescription>选择新文件上传后将自动替换当前文件</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentFileId && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 mb-1">当前文件</p>
                  <p className="text-xs text-slate-500 break-all">
                    文件ID: <code className="font-mono">{currentFileId}</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              选择文件 <span className="text-red-500">*</span>
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={onFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileUp className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-slate-400 mt-1">支持任意格式，不限制文件类型</p>
                </div>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onUpload}
                  disabled={isUploading || isUpdating}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {isUploading || isUpdating ? '上传中...' : '开始上传'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
