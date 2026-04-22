/**
 * TestPage 响应区域：响应体 / 响应头 / Cookie 三个 Tab
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TestPageResponseSectionProps {
  responseTab: string;
  onResponseTabChange: (v: string) => void;
  isSending: boolean;
  responseData: unknown;
  responseTime: number;
  responseSize: number;
  responseHeaders: Record<string, string> | null;
  responseCookies: Record<string, string> | null;
}

export function TestPageResponseSection({
  responseTab,
  onResponseTabChange,
  isSending,
  responseData,
  responseTime,
  responseSize,
  responseHeaders,
  responseCookies,
}: TestPageResponseSectionProps) {
  const data = responseData as { status?: number; statusText?: string; bodyText?: string; headers?: { key: string; value: string }[] } | null;

  return (
    <div className="flex flex-col border-t border-gray-200 overflow-hidden flex-1">
      <Tabs value={responseTab} onValueChange={onResponseTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="h-9 bg-transparent rounded-none justify-start px-4 gap-6 shrink-0">
          <TabsTrigger
            value="response-body"
            className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors"
          >
            响应体
          </TabsTrigger>
          <TabsTrigger
            value="response-header"
            className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors"
          >
            响应头
          </TabsTrigger>
          <TabsTrigger
            value="cookie"
            className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:rounded-none data-[state=active]:shadow-none text-gray-400 hover:text-gray-600 pb-2 px-1 transition-colors"
          >
            Cookie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="response-body" className="flex-1 p-4 m-0 overflow-y-auto min-h-0">
          {isSending ? (
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
              <p className="text-sm">正在发送请求...</p>
            </div>
          ) : data ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">状态:</span>
                  <span
                    className={`font-medium ${
                      (data.status ?? 0) >= 200 && (data.status ?? 0) < 300
                        ? 'text-green-600'
                        : (data.status ?? 0) >= 400
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {data.status ?? 0} {data.statusText ?? ''}
                  </span>
                </div>
                {responseTime > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">耗时:</span>
                    <span className="font-medium text-gray-600">{responseTime}ms</span>
                  </div>
                )}
                {responseSize > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">大小:</span>
                    <span className="font-medium text-gray-600">
                      {responseSize < 1024
                        ? `${responseSize}B`
                        : responseSize < 1024 * 1024
                          ? `${(responseSize / 1024).toFixed(2)}KB`
                          : `${(responseSize / (1024 * 1024)).toFixed(2)}MB`}
                    </span>
                  </div>
                )}
              </div>
              <pre
                className={`text-xs font-mono whitespace-pre-wrap ${
                  (data.status ?? 0) >= 200 && (data.status ?? 0) < 300 ? 'text-gray-600' : 'text-red-600'
                }`}
              >
                {(data as { bodyText?: string; error?: string }).bodyText || (data as { error?: string }).error || '无响应内容'}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm">输入url并发送即可显示测试结果</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="response-header" className="flex-1 p-4 m-0 overflow-y-auto min-h-0">
          {data?.headers && Array.isArray(data.headers) ? (
            <div className="space-y-2">
              {data.headers.map((h: { key: string; value: string }, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-gray-700 min-w-[200px]">{h.key}:</span>
                  <span className="text-gray-600 break-all">{h.value}</span>
                </div>
              ))}
            </div>
          ) : responseHeaders ? (
            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
              {JSON.stringify(responseHeaders, null, 2)}
            </pre>
          ) : (
            <div className="text-xs text-gray-400">// 响应头将在这里显示</div>
          )}
        </TabsContent>

        <TabsContent value="cookie" className="flex-1 p-4 m-0 overflow-y-auto min-h-0">
          <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
            {responseCookies ? JSON.stringify(responseCookies, null, 2) : '// Cookie将在这里显示'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
