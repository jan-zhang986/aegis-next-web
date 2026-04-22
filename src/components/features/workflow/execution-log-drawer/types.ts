export interface ExecutionLogDrawerState {
  expandedLogIds: Set<string>;
  expandedConsoleLogIds: Set<string>;
  expandedParentIds: Set<string>;
  loadingConsoleLogs: Set<string>;
}
