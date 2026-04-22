/**
 * DubboTestPage 响应区域：调用结果 Tab
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface DubboResponseSectionProps {
  responseTab: string;
  onResponseTabChange: (v: string) => void;
  sending: boolean;
  hasResponse: boolean;
  responseData: unknown;
}

export function DubboResponseSection({ responseTab, onResponseTabChange, sending, hasResponse, responseData }: DubboResponseSectionProps) {
  const data = responseData as { error?: string } | null;

  return (
    <div className="flex flex-col border-t border-gray-200 overflow-hidden flex-shrink-0" style={{ minHeight: '150px' }}>
      <Tabs value={responseTab} onValueChange={onResponseTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="h-9 bg-transparent border-b border-gray-200 rounded-none justify-start shrink-0 p-0 gap-3">
          <TabsTrigger value="result" className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors">
            调用结果
          </TabsTrigger>
        </TabsList>
        <TabsContent value="result" className="flex-1 p-4 m-0 overflow-auto bg-gray-50">
          {sending ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">正在发送请求...</p>
              </div>
            </div>
          ) : !hasResponse ? (
            <div className="text-xs font-mono text-gray-600">
              <pre className="whitespace-pre-wrap">等待调用...</pre>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${data.error ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className={`font-semibold text-sm ${data.error ? 'text-red-700' : 'text-green-700'}`}>
                  {data.error ? '调用失败' : '调用成功'}
                </span>
              </div>
              {data.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700 font-medium mb-1">错误信息:</p>
                  <p className="text-xs text-red-600 font-mono">{data.error}</p>
                </div>
              )}
              <div className="bg-white border border-gray-300 rounded p-3">
                <p className="text-xs text-gray-500 mb-2">响应数据:</p>
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-auto max-h-[600px]">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
