import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface PipelineConfigItem {
  id: string;
  gitUrl: string;
  swaggerUrl?: string;
  curlCommand?: string;
  serviceName: string;
  envName: string;
  /** 自动化用例集名称 */
  autoCaseSetName?: string;
  devNotifier?: string;
  testNotifier?: string;
  status: 'CONFIGURED' | 'UNCONFIGURED';
}

export interface PipelineConfigTableProps {
  list: PipelineConfigItem[];
  loading?: boolean;
  onEdit?: (item: PipelineConfigItem) => void;
  onDelete?: (item: PipelineConfigItem) => void;
  onToggleStatus?: (item: PipelineConfigItem) => void;
  onConfigCoreCases?: (item: PipelineConfigItem) => void;
}

export function PipelineConfigTable({
  list,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onConfigCoreCases,
}: PipelineConfigTableProps) {
  if (loading) {
    return <div className="py-12 text-center text-gray-500">加载中...</div>;
  }

  return (
    <Table className="min-w-[1200px]">
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="min-w-[220px] text-gray-600">gitUrl</TableHead>
          <TableHead className="min-w-[200px] text-gray-600">Swagger地址</TableHead>
          <TableHead className="min-w-[200px] text-gray-600">CURL命令</TableHead>
          <TableHead className="w-[140px] text-gray-600">服务</TableHead>
          <TableHead className="w-[100px] text-gray-600">配置环境</TableHead>
          <TableHead className="w-[160px] text-gray-600">自动化用例</TableHead>
          <TableHead className="w-[140px] text-gray-600">开发通知人</TableHead>
          <TableHead className="w-[140px] text-gray-600">测试通知人</TableHead>
          <TableHead className="w-[80px] text-gray-600">状态</TableHead>
          <TableHead className="w-[260px] text-right text-gray-600">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(list && list.length > 0 ? list : []).map((item) => (
          <TableRow key={item.id} className="hover:bg-gray-50/80">
            <TableCell className="max-w-[260px] truncate text-xs font-mono text-gray-700" title={item.gitUrl}>
              {item.gitUrl}
            </TableCell>
            <TableCell className="max-w-[220px] truncate text-xs text-blue-600" title={item.swaggerUrl}>
              {item.swaggerUrl || <span className="text-gray-400">未配置</span>}
            </TableCell>
            <TableCell className="max-w-[220px] truncate text-xs font-mono text-gray-700" title={item.curlCommand}>
              {item.curlCommand || <span className="text-gray-400">未配置</span>}
            </TableCell>
            <TableCell className="truncate text-gray-700" title={item.serviceName}>
              {item.serviceName}
            </TableCell>
            <TableCell className="text-gray-700">{item.envName}</TableCell>
            <TableCell className="truncate text-gray-700" title={item.autoCaseSetName}>
              {item.autoCaseSetName || <span className="text-gray-400">未配置</span>}
            </TableCell>
            <TableCell className="truncate text-gray-700" title={item.devNotifier}>
              {item.devNotifier || <span className="text-gray-400">未配置</span>}
            </TableCell>
            <TableCell className="truncate text-gray-700" title={item.testNotifier}>
              {item.testNotifier || <span className="text-gray-400">未配置</span>}
            </TableCell>
            <TableCell className="text-gray-700">
              {item.status === 'CONFIGURED' ? '已配置' : '未配置'}
            </TableCell>
            <TableCell className="text-right space-x-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => onEdit?.(item)}
              >
                编辑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-red-600 hover:text-red-700"
                onClick={() => onDelete?.(item)}
              >
                删除
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => onToggleStatus?.(item)}
              >
                切换状态
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => onConfigCoreCases?.(item)}
              >
                配置核心用例
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {(!list || list.length === 0) && (
          <TableRow>
            <TableCell colSpan={10} className="py-12 text-center text-gray-400 text-sm">
              暂无流水线配置，请点击右上角「配置」进行新增。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

