import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectManagementService } from '@/services';
import { GitBranch, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';

interface ProjectVersionSelectProps {
  projectId: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onSelect?: (version: any) => void;
}

export function ProjectVersionSelect({ projectId, value, onValueChange, onSelect }: ProjectVersionSelectProps) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  const fetchVersions = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res: any = await projectManagementService.getVersionOptions(projectId);
      setVersions(res || []);
      // If no value, select the latest one
      if (!value && res?.length > 0) {
        const latest = res.find((v: any) => v.latest) || res[0];
        onValueChange?.(latest.id);
        onSelect?.(latest);
      } else if (value && res?.length > 0) {
        const current = res.find((v: any) => v.id === value);
        if (current) onSelect?.(current);
      }
    } catch (error) {
      console.error('Failed to fetch versions', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, value, onValueChange, onSelect]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return (
    <div className="flex items-center">
      <Select 
        value={value} 
        onValueChange={(val) => {
          onValueChange?.(val);
          const v = versions.find(x => x.id === val);
          if (v) onSelect?.(v);
        }} 
        disabled={loading}
      >
        <SelectTrigger className="h-7 min-w-[120px] max-w-[200px] border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[12px] font-semibold shadow-none transition-all px-2.5 rounded-md gap-2">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <GitBranch className="h-3.5 w-3.5 text-slate-500" />
          )}
          <SelectValue placeholder="Branch: main" />
        </SelectTrigger>
        <SelectContent className="min-w-[240px] p-0 shadow-xl border-slate-200">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Switch branches/tags</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {versions.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
                No branches found.
              </div>
            )}
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id} className="text-[13px] py-2 rounded-md focus:bg-slate-100 focus:text-slate-900 border-none outline-none cursor-pointer">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className={cn("h-3.5 w-3.5", v.latest ? "text-slate-900" : "text-slate-400")} />
                    <span className={cn(v.id === value ? "font-bold" : "font-normal")}>{v.name}</span>
                  </div>
                  {v.latest && (
                    <Badge variant="outline" className="text-[9px] font-bold border-emerald-200 text-emerald-600 bg-emerald-50 px-1 py-0 leading-none h-4">
                      DEFAULT
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
