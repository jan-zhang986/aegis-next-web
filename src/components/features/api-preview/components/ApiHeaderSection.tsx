import { ArrowLeft, History, Play, Download, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export interface ApiHeaderSectionProps {
  onBack?: () => void;
  viewMode: 'doc' | 'request';
  onViewModeChange: (v: 'doc' | 'request') => void;
  protocol: string;
  definitionName: string;
  fileId?: string | null;
  onStartDebug: () => void;
  onDownloadFile?: () => void;
}

export function ApiHeaderSection({
  onBack,
  viewMode,
  onViewModeChange,
  protocol,
  definitionName,
  fileId,
  onStartDebug,
  onDownloadFile,
}: ApiHeaderSectionProps) {
  return (
    <div className="border-b border-gray-200 bg-white flex-shrink-0">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title="返回"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {protocol === 'SQL' && (
              <h1 className="text-lg font-semibold text-green-600">{definitionName}</h1>
            )}
            {(protocol === 'HTTP' || protocol === 'DUBBO') && (
              <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'doc' | 'request')}>
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="doc" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    文档
                  </TabsTrigger>
                  <TabsTrigger value="request" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    请求
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => toast.info('功能开发中，敬请期待')}
            >
              <History className="w-4 h-4 mr-1" />
              历史版本
            </Button>
            {protocol === 'FILE' ? (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                size="sm"
                onClick={onDownloadFile}
                disabled={!fileId}
              >
                <Download className="w-4 h-4 mr-1" />
                下载文件
              </Button>
            ) : protocol === 'SQL' ? (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                size="sm"
                onClick={() => toast.info('暂不支持，如需执行SQL请移步到自动化用例')}
              >
                <Play className="w-4 h-4 mr-1" />
                发起调试
              </Button>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                size="sm"
                onClick={onStartDebug}
              >
                <Play className="w-4 h-4 mr-1" />
                发起调试
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
