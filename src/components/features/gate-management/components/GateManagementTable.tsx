/**
 * 门禁管理 - 流水线记录表格
 */

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDeployTime } from '../utils/format-deploy-time';
import type { PipelineRecordListItem } from '@/services/gate-management';
import { cn } from '@/utils/cn';

export interface GateManagementTableProps {
  list: PipelineRecordListItem[];
  loading: boolean;
  onEdit: (row: PipelineRecordListItem) => void;
}

const DEPLOY_RESULT_LABELS: Record<string, string> = {
  PENDING: '待补全',
  SUCCESS: '成功',
  FAILED: '失败',
  ROLLED_BACK: '回滚',
  HOTFIX: '热修',
};

/** 类型（endpointType）前后端映射为中文 */
const ENDPOINT_TYPE_LABELS: Record<string, string> = {
  FRONTEND: '前端',
  BACKEND: '后端',
  MIXED: '混合',
};

export function GateManagementTable({ list, loading, onEdit }: GateManagementTableProps) {
  if (loading) {
    return <div className="py-12 text-center text-gray-500">加载中...</div>;
  }
  if (list.length === 0) {
    return <div className="py-12 text-center text-gray-500">暂无流水线记录</div>;
  }

  return (
    <Table className="min-w-[1180px]">
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="w-[110px] text-gray-600">流水线ID</TableHead>
          <TableHead className="min-w-[160px] text-gray-600">流水线名称</TableHead>
          <TableHead className="w-[120px] text-gray-600">代码仓库名称</TableHead>
          <TableHead className="w-[90px] text-gray-600">类型</TableHead>
          <TableHead className="w-[160px] text-gray-600">发布时间</TableHead>
          <TableHead className="w-[90px] text-gray-600">发布人</TableHead>
          <TableHead className="w-[90px] text-gray-600">发布结果</TableHead>
          <TableHead className="w-[100px] text-gray-600">代码新增行数</TableHead>
          <TableHead className="w-[100px] text-gray-600">代码删除行数</TableHead>
          <TableHead className="w-[120px] text-gray-600">需求</TableHead>
          <TableHead className="w-[90px] text-gray-600">项目</TableHead>
          <TableHead className="w-[90px] text-right text-gray-600">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map((row) => (
          <TableRow key={row.id} className="hover:bg-gray-50/80">
            <TableCell className="font-mono text-xs text-gray-700 truncate max-w-[110px]" title={row.pipelineId}>
              {row.pipelineId}
            </TableCell>
            <TableCell className="truncate max-w-[180px] text-gray-800" title={row.pipelineName ?? ''}>
              {row.pipelineUrl ? (
                <a
                  href={row.pipelineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-500 hover:underline truncate block max-w-full"
                  title={row.pipelineName ?? row.pipelineId ?? ''}
                >
                  {row.pipelineName ?? row.pipelineId ?? '—'}
                </a>
              ) : (
                row.pipelineName ?? row.pipelineId ?? <span className="text-gray-400">—</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs text-gray-700 truncate max-w-[120px]" title={row.repoName}>
              {row.repoName}
            </TableCell>
            <TableCell className="text-gray-700">
              {row.endpointType
                ? ENDPOINT_TYPE_LABELS[row.endpointType] ?? row.endpointType
                : <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell className="text-gray-600">{formatDeployTime(row.deployTime)}</TableCell>
            <TableCell className="text-gray-700">{row.deployer ?? <span className="text-gray-400">—</span>}</TableCell>
            <TableCell>
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  row.deployResult === 'PENDING' && 'bg-amber-100 text-amber-800',
                  row.deployResult === 'SUCCESS' && 'bg-green-100 text-green-800',
                  row.deployResult === 'FAILED' && 'bg-red-100 text-red-800',
                  row.deployResult === 'ROLLED_BACK' && 'bg-orange-100 text-orange-800',
                  row.deployResult === 'HOTFIX' && 'bg-blue-100 text-blue-800',
                  !['PENDING', 'SUCCESS', 'FAILED', 'ROLLED_BACK', 'HOTFIX'].includes(row.deployResult) &&
                    'bg-gray-100 text-gray-700'
                )}
              >
                {DEPLOY_RESULT_LABELS[row.deployResult] ?? row.deployResult ?? '—'}
              </span>
            </TableCell>
            <TableCell className="text-gray-700 tabular-nums">
              {row.locAdd != null ? row.locAdd : <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell className="text-gray-700 tabular-nums">
              {row.locDelete != null ? row.locDelete : <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell className="truncate max-w-[120px] text-gray-700" title={row.storyName ?? row.storyId ?? ''}>
              {row.storyName ?? row.storyId ?? <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell className="truncate max-w-[90px] text-gray-700" title={row.projectName ?? row.projectId ?? ''}>
              {row.projectName ?? row.projectId ?? <span className="text-gray-400">—</span>}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={() => onEdit(row)}>
                <Pencil className="w-3.5 h-3.5" />
                {row.deployResult === 'PENDING' ? '补全' : '编辑'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
