import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ResponseDataResult } from '../hooks/useApiDataRenderer';

export interface ApiResponseSectionProps {
  protocol: string;
  responseData: ResponseDataResult | null;
  responseConfig: Record<string, unknown> | null;
  selectedResponseIndex: number;
  onSelectedResponseIndexChange: (i: number) => void;
  renderResponseTree: (obj: unknown, path?: string, level?: number) => JSX.Element[];
}

export function ApiResponseSection({
  protocol,
  responseData,
  responseConfig,
  selectedResponseIndex,
  onSelectedResponseIndexChange,
  renderResponseTree,
}: ApiResponseSectionProps) {
  if (protocol !== 'HTTP' && protocol !== 'DUBBO' || !responseData) return null;

  const current = responseData.responses[selectedResponseIndex] ?? responseData.defaultResponse;
  if (!current) return null;

  let showResponseContent = true;
  if (protocol === 'DUBBO' && responseConfig?.parameterTypes) {
    const types = responseConfig.parameterTypes as string[];
    const isBasic = (t: string) =>
      t.startsWith('java.lang.') ||
      (t.startsWith('java.util.List<') && t.includes('java.lang.')) ||
      (t.startsWith('java.util.Map<') && t.includes('java.lang.'));
    showResponseContent = !types.every(isBasic);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">返回响应</h2>
        {responseData.isMultiple && responseData.responses.length > 1 && (
          <Select
            value={selectedResponseIndex.toString()}
            onValueChange={(v) => onSelectedResponseIndexChange(parseInt(v, 10))}
          >
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {responseData.responses.map((r, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {r.isSuccess ? '成功' : '失败'} ({r.statusCode})
                  {r.description ? ` - ${r.description}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              current.isSuccess ? 'bg-gray-100 text-gray-900' : 'bg-red-100 text-red-900'
            }`}
          >
            {current.isSuccess ? '成功' : '失败'} ({current.statusCode})
          </span>
          {current.description && <span className="text-xs text-gray-500">{current.description}</span>}
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs">
          {protocol === 'DUBBO' ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">返回类型：</span>
                <span className="text-gray-900 font-medium">
                  {(responseConfig?.parameterTypes as string[])?.join(', ') || '-'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">内容格式：</span>
                <span className="text-gray-900 font-medium">JSON</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">HTTP 状态码：</span>
                <span className="text-gray-900 font-medium">{current.statusCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">内容格式：</span>
                <span className="text-gray-900 font-medium">
                  {current.contentType === 'application/json' ? 'JSON' : current.contentType}
                </span>
              </div>
            </>
          )}
        </div>

        {showResponseContent && (
          <div className="flex gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-700 mb-2">数据结构</h3>
              {current.body && typeof current.body === 'object' ? (
                <div className="space-y-1.5">{renderResponseTree(current.body, '', 0)}</div>
              ) : (
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-xs text-gray-600">
                    {typeof current.body === 'object' && current.body !== null ? 'object (0)' : '无数据结构'}
                  </span>
                </div>
              )}
            </div>
            <div className="w-80 border-l border-gray-200 pl-4">
              <div className="sticky top-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">示例</h3>
                <div className="p-3 bg-white rounded border border-gray-200 overflow-auto max-h-[600px]">
                  <pre className="text-xs text-orange-600 font-mono whitespace-pre-wrap">
                    {typeof current.body === 'string'
                      ? current.body
                      : JSON.stringify(current.body, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
