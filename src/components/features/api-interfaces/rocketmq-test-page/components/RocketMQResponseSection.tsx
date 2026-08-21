/**
 * RocketMQTestPage 响应区域：发送结果 Tab
 */

import { MessageSquare, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { RocketMQSendResult } from '../types';

export interface RocketMQResponseSectionProps {
  responseTab: string;
  onResponseTabChange: (v: string) => void;
  sending: boolean;
  hasResult: boolean;
  sendResult: RocketMQSendResult | null;
  topic: string;
  branchTag: string;
}

export function RocketMQResponseSection({
  responseTab,
  onResponseTabChange,
  sending,
  hasResult,
  sendResult,
  topic,
  branchTag,
}: RocketMQResponseSectionProps) {
  return (
    <div className="flex flex-col overflow-hidden flex-1">
      <Tabs value={responseTab} onValueChange={onResponseTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="h-9 bg-transparent rounded-none justify-start px-4">
          <TabsTrigger
            value="result"
            className="text-sm border-0 bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:rounded-none data-[state=active]:shadow-none"
          >
            发送结果
          </TabsTrigger>
        </TabsList>

        <TabsContent value="result" className="flex-1 flex flex-col m-0 overflow-hidden">
          {sending ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
                <p className="text-sm">正在发送消息...</p>
              </div>
            </div>
          ) : !hasResult ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-gray-300" />
                </div>
                <p className="text-sm">配置并发送RocketMQ消息</p>
              </div>
            </div>
          ) : sendResult ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-4">
              <div className={`p-4 rounded-lg border ${sendResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${sendResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`font-semibold ${sendResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {sendResult.success ? '发送成功' : '发送失败'}
                  </span>
                  {!sendResult.success && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-red-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>确保 Topic :{topic || '当前Topic'}_{branchTag || '当前环境Tag'} 已正确创建</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {sendResult.msgId && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">消息ID: </span>
                    <span className="text-sm font-mono text-gray-800">{sendResult.msgId}</span>
                  </div>
                )}
                {sendResult.info && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">信息: </span>
                    <span className="text-sm text-gray-800">{sendResult.info}</span>
                  </div>
                )}
                {sendResult.error && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">错误: </span>
                    <span className="text-sm text-red-600">{sendResult.error}</span>
                  </div>
                )}
                {Boolean(sendResult.data) && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600 block mb-1">响应数据:</span>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(sendResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
