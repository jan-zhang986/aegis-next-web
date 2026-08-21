import { Copy, Download, File as FileIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SqlCodeBlock } from './SqlCodeBlock';

type ParamLike = { name: string; type: string; required?: boolean; example?: unknown };

function ParamList({
  params,
  title,
  exampleObj,
}: {
  params: ParamLike[];
  title: string;
  exampleObj?: Record<string, unknown>;
}) {
  if (params.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
          <div className="space-y-1.5">
            {params.map((p, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium min-w-[100px]">
                  {p.name}
                </span>
                <span className="text-xs text-gray-600">{p.type}</span>
                <div className="flex-1" />
                <span className="text-xs text-orange-600 font-medium">必需</span>
              </div>
            ))}
          </div>
        </div>
        {exampleObj && (
          <div className="w-80 border-l border-gray-200 pl-4">
            <div className="sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">示例</h3>
              <div className="p-3 bg-white rounded border border-gray-200 overflow-auto max-h-[600px]">
                <pre className="text-xs text-orange-600 font-mono whitespace-pre-wrap">
                  {JSON.stringify(exampleObj, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface ApiBodySectionProps {
  protocol: string;
  requestConfig: Record<string, unknown> | null;
  definition: { name: string; description?: string; scriptContent?: string | null; moduleId?: string };
  headerParams: ParamLike[];
  queryParams: ParamLike[];
  bodyParams: ParamLike[];
  renderBodyTree: (obj: unknown, path?: string, level?: number) => JSX.Element[];
  onCopySql?: (content: string) => Promise<boolean>;
  onCopyFileId?: () => void;
  onOpenEditFileId?: () => void;
  onDownloadFile?: () => void;
}

export function ApiBodySection({
  protocol,
  requestConfig,
  definition,
  headerParams,
  queryParams,
  bodyParams,
  renderBodyTree,
  onCopySql,
  onCopyFileId,
  onOpenEditFileId,
  onDownloadFile,
}: ApiBodySectionProps) {
  const title =
    protocol === 'FILE' ? '文件信息' : protocol === 'SQL' ? 'SQL' : '请求参数';

  let bodyForRender: unknown = requestConfig?.body;
  if (typeof bodyForRender === 'string' && (bodyForRender as string).trim()) {
    try {
      bodyForRender = JSON.parse(bodyForRender as string);
    } catch {
      // keep string
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>

      {protocol === 'HTTP' && (
        <>
          <ParamList
            params={headerParams}
            title="Header 参数"
            exampleObj={headerParams.length > 0 ? headerParams.reduce((acc, p) => ({ ...acc, [p.name]: p.example }), {} as Record<string, unknown>) : undefined}
          />
          <ParamList
            params={queryParams}
            title="Query 参数"
            exampleObj={queryParams.length > 0 ? queryParams.reduce((acc, p) => ({ ...acc, [p.name]: p.example }), {} as Record<string, unknown>) : undefined}
          />
          {requestConfig?.body && (
            <div className={bodyParams.length > 0 ? 'flex gap-4' : ''}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Body 参数</h3>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">application/json</span>
                </div>
                {bodyParams.length > 0 ? (
                  <div className="space-y-1.5">{renderBodyTree(bodyForRender, '', 0)}</div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                      {typeof bodyForRender === 'string'
                        ? bodyForRender
                        : JSON.stringify(bodyForRender, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              {bodyParams.length > 0 && (
                <div className="w-80 border-l border-gray-200 pl-4">
                  <div className="sticky top-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">示例</h3>
                    <div className="p-3 bg-white rounded border border-gray-200 overflow-auto max-h-[600px]">
                      <pre className="text-xs text-orange-600 font-mono whitespace-pre-wrap">
                        {typeof bodyForRender === 'string'
                          ? bodyForRender
                          : JSON.stringify(bodyForRender, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {protocol === 'SQL' && onCopySql && (
        <SqlCodeBlock
          sqlContent={(requestConfig?.sql as string) || definition.scriptContent || ''}
          onCopy={onCopySql}
        />
      )}

      {protocol === 'DUBBO' && requestConfig && (() => {
        const isBasic = (t: string) =>
          t.startsWith('java.lang.') ||
          (t.startsWith('java.util.List<') && t.includes('java.lang.')) ||
          (t.startsWith('java.util.Map<') && t.includes('java.lang.'));
        const types = (requestConfig.parameterTypes as string[]) || [];
        const allBasic = types.length > 0 && types.every(isBasic);
        const dubboParams = Array.isArray(requestConfig.params) && requestConfig.params.length > 0
          ? requestConfig.params[0]
          : null;
        const hasParams = dubboParams && typeof dubboParams === 'object' && !allBasic;

        return (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">服务接口</h3>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20">接口名称：</span>
                    <code className="text-xs text-gray-900 font-mono">{String(requestConfig.interfaceName || '-')}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20">方法名：</span>
                    <code className="text-xs text-gray-900 font-mono">{String(requestConfig.methodName || '-')}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20">应用名称：</span>
                    <code className="text-xs text-gray-900 font-mono">{String(requestConfig.applicationName || '-')}</code>
                  </div>
                  {Boolean(requestConfig.siteTenant) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-20">站点租户：</span>
                      <code className="text-xs text-gray-900 font-mono">{String(requestConfig.siteTenant)}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {types.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">方法参数类型</h3>
                <div className="space-y-1.5">
                  {types.map((t: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium min-w-[100px]">
                        参数 {i + 1}
                      </span>
                      <span className="text-xs text-gray-600">{t}</span>
                      <div className="flex-1" />
                      <span className="text-xs text-orange-600 font-medium">必需</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasParams && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">请求参数</h3>
                  <div className="space-y-1.5">{renderBodyTree(dubboParams, '', 0)}</div>
                </div>
                <div className="w-80 border-l border-gray-200 pl-4">
                  <div className="sticky top-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">示例</h3>
                    <div className="p-3 bg-white rounded border border-gray-200 overflow-auto max-h-[600px]">
                      <pre className="text-xs text-orange-600 font-mono whitespace-pre-wrap">
                        {JSON.stringify(dubboParams, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {protocol === 'ROCKETMQ' && requestConfig && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">消息配置</h3>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-20">Topic：</span>
                  <code className="text-xs text-gray-900 font-mono">{String(requestConfig.topic || '-')}</code>
                </div>
                {Boolean(requestConfig.tag) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20">Tag：</span>
                    <code className="text-xs text-gray-900 font-mono">{String(requestConfig.tag)}</code>
                  </div>
                )}
                {Boolean(requestConfig.group) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20">Group：</span>
                    <code className="text-xs text-gray-900 font-mono">{String(requestConfig.group)}</code>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-20">消息类型：</span>
                  <code className="text-xs text-gray-900 font-mono">{String(requestConfig.messageType || 'JSON')}</code>
                </div>
              </div>
            </div>
          </div>
          {requestConfig.body && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">消息体</h3>
              <div className="p-3 bg-gray-50 rounded border border-gray-200">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                  {typeof requestConfig.body === 'string'
                    ? requestConfig.body
                    : JSON.stringify(requestConfig.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {protocol === 'FILE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm">
                  <FileIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-slate-900 mb-1 truncate">{definition.name}</h4>
                  {definition.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">{definition.description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">文件ID</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono text-slate-700 break-all">
                    {definition.scriptContent || '未上传文件'}
                  </code>
                  {definition.scriptContent && onCopyFileId && (
                    <Button variant="outline" size="sm" onClick={onCopyFileId} className="h-9 flex-shrink-0" title="复制文件ID">
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              {definition.scriptContent && onOpenEditFileId && onDownloadFile && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                  <Button variant="outline" onClick={onOpenEditFileId} className="flex-1 h-10">
                    <Upload className="w-4 h-4 mr-2" />
                    上传新文件覆盖
                  </Button>
                  <Button onClick={onDownloadFile} className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    下载文件
                  </Button>
                </div>
              )}
              {!definition.scriptContent && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">文件未上传</p>
                      <p className="text-xs text-amber-700">
                        请点击"上传新文件覆盖"按钮上传文件，或返回编辑页面进行配置。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
