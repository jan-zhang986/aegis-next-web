import { useMemo } from 'react';
import type { ExecutionLog, DebugMode } from '@/components/features/workflow/types';

export function useExecutionLogCalculations(
  logs: ExecutionLog[],
  debugMode: DebugMode,
  debugNodeId: string | null
) {
  const progressValue = useMemo(() => {
    return debugMode === 'single'
      ? (logs[0]?.status === 'success' || logs[0]?.status === 'failed' || logs[0]?.status === 'skipped' ? 100 : 0)
      : (() => {
          const stepLogs = logs.filter(log => log.parentId);
          if (stepLogs.length === 0) return 0;
          const completedStepLogs = stepLogs.filter(log => log.status === 'success' || log.status === 'failed' || log.status === 'skipped');
          return (completedStepLogs.length / stepLogs.length) * 100;
        })();
  }, [logs, debugMode]);

  const hasFailed = useMemo(() => {
    const stepLogs = logs.filter(log => log.parentId);
    return stepLogs.some(log => log.status === 'failed');
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => debugMode === 'single' ? log.nodeId === debugNodeId : true);
  }, [logs, debugMode, debugNodeId]);

  const treeStructure = useMemo(() => {
    const parentLogs: ExecutionLog[] = [];
    const childLogsMap = new Map<string, ExecutionLog[]>();

    filteredLogs.forEach(log => {
      if (!log.parentId) {
        parentLogs.push(log);
      } else {
        if (!childLogsMap.has(log.parentId)) {
          childLogsMap.set(log.parentId, []);
        }
        childLogsMap.get(log.parentId)!.push(log);
      }
    });

    parentLogs.sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return aTime - bTime;
    });

    childLogsMap.forEach(children => {
      children.sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return aTime - bTime;
      });
    });

    return { parentLogs, childLogsMap };
  }, [filteredLogs]);

  return {
    progressValue,
    hasFailed,
    filteredLogs,
    treeStructure,
  };
}
