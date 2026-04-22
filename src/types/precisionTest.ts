export interface TestPlan {
  id: string;
  name: string;
  status: 'completed' | 'running' | 'failed';
  planType: 'unit' | 'functional'; // 计划类型：单元测试、功能测试
  environment: string; // 环境标签
  projectName: string;
  branch: string;
  tester: string;
  date: string;
  taskId: string;
  caseCount: number;
  passedCount: number;
  failedCount: number;
  codeCoverage: number;
  coverageReports?: CoverageReport[];
  packageCoverage?: PackageCoverage[];
}

export interface CoverageReport {
  id: string;
  fileName: string;
  filePath: string;
  lineCoverage: number;
  branchCoverage: number;
  methodCoverage?: number;
  classCoverage?: number;
  totalLines: number;
  coveredLines: number;
  uncoveredLines: number;
  lastUpdate: string;
  status: 'success' | 'warning' | 'error';
}

export interface PackageCoverage {
  packageName: string;
  lineCoverage: number;
  lineCovered: number;
  lineTotal: number;
  branchCoverage: number;
  branchCovered: number;
  branchTotal: number;
  methodCoverage: number;
  classCoverage: number;
  classes?: ClassCoverage[];
}

export interface ClassCoverage {
  className: string;
  lineCoverage: number;
  lineCovered: number;
  lineTotal: number;
  branchCoverage: number;
  branchCovered: number;
  branchTotal: number;
  methodCoverage: number;
  classCoverage: number;
}
