/**
 * 测试计划报告分享详情页（只读）
 * 通过分享链接打开：/share/test-plan-report?shareId=xxx&reportId=yyy
 * 使用 TestPlanReportDetailPage 并传入 shareId，不展示分享/导出等操作
 */

import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestPlanReportDetailPage } from './TestPlanReportDetailPage';

export function TestPlanReportSharePage() {
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get('shareId') ?? undefined;
  const reportId = searchParams.get('reportId') ?? '';

  if (!reportId) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center text-gray-500">
        <p>缺少报告参数，请使用完整的分享链接打开。</p>
      </div>
    );
  }

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="shrink-0 flex justify-end px-4 py-2 bg-white border-b border-gray-100">
        <Button variant="ghost" size="sm" className="gap-1" onClick={handleClose}>
          <X className="w-4 h-4" />
          关闭
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <TestPlanReportDetailPage reportId={reportId} shareId={shareId} onBack={undefined} />
      </div>
    </div>
  );
}
