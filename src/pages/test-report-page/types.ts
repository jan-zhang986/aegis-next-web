export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface TestRecord {
  id: string;
  workflowName: string;
  status: 'success' | 'failed' | 'running' | 'cancelled';
  duration: number;
  startTime: string;
  endTime: string;
  totalNodes: number;
  successNodes: number;
  failedNodes: number;
  skippedNodes: number;
  executor: string;
  runId?: string;
  workflowId?: string;
}
