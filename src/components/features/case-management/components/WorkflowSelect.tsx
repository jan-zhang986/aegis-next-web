import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { workflowService } from '@/services';
import { useDebounce } from '@/hooks/use-debounce';
import { Loader2, Search } from 'lucide-react';

interface WorkflowSelectProps {
  projectId: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function WorkflowSelect({ projectId, value, onChange, placeholder = '选择自动化' }: WorkflowSelectProps) {
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 500);

  const fetchWorkflows = useCallback(async (searchKeyword: string) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res: any = await workflowService.getWorkflowList({
        projectId,
        keyword: searchKeyword,
        current: 1,
        pageSize: 20,
      });
      setWorkflows(res?.records || []);
    } catch (error) {
      console.error('Failed to fetch workflows', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkflows(debouncedKeyword);
  }, [debouncedKeyword, fetchWorkflows]);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="flex items-center px-3 pb-2 pt-2 sticky top-0 bg-white z-10 border-b mb-1">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="搜索…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-8 border-none focus-visible:ring-0 px-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
          </div>
          {workflows.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">未找到</div>
          ) : (
            workflows.map((wf) => (
              <SelectItem key={wf.workflowId} value={wf.workflowId}>
                <div className="flex flex-col">
                  <span className="font-medium">{wf.name}</span>
                  <span className="text-xs text-gray-400">{wf.workflowId}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
