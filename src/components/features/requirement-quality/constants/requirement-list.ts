/**
 * 需求质量视图 - 需求列表常量与类型
 */

export interface RequirementItem {
  id: string;
  name: string;
  owner: string;
  /** 状态：后端为 PREPARED/UNDERWAY/COMPLETED 等，展示时可转为中文 */
  status: string;
  /** 执行周期总时长展示，如「11天」 */
  period: string;
  /** 执行周期日期范围，用于 tooltip，如「2025/12/11 — 2025/12/22」 */
  periodRange?: string;
  totalCases: number;
  executedCases: number;
  passedCases: number;
  executionRate: number;
  passRate: number;
  /** 首次通过率(%)，列表展示与详情一致 */
  firstPassRate?: number;
  defectCount: number;
  /** 重开率(%)，后端直接返回；空时展示 - */
  reopenRate?: number | null;
  reopenCount: number;
  codeCoverageRate: number;
  /** 总千行代码缺陷率，(缺陷总数/变更代码行数)×1000，空时展示 - */
  totalDefectRatePer1k?: number | null;
  newCases: number;
  reusedCases: number;
}

/** 近期需求列表（Mock） */
export const REQUIREMENT_LIST: RequirementItem[] = [
  {
    id: 'sprint-24-regression',
    name: 'Sprint 24 回归需求',
    owner: '张三',
    status: '执行中',
    period: '2026-01-15 ~ 2026-01-25',
    totalCases: 826,
    executedCases: 638,
    passedCases: 589,
    executionRate: 77.2,
    passRate: 92.3,
    defectCount: 23,
    reopenCount: 3,
    codeCoverageRate: 85.7,
    newCases: 264,
    reusedCases: 562,
  },
  {
    id: 'sprint-24-smoke',
    name: 'Sprint 24 冒烟需求',
    owner: '李四',
    status: '已完成',
    period: '2026-01-10 ~ 2026-01-12',
    totalCases: 156,
    executedCases: 156,
    passedCases: 152,
    executionRate: 100,
    passRate: 97.4,
    defectCount: 4,
    reopenCount: 0,
    codeCoverageRate: 92.3,
    newCases: 17,
    reusedCases: 139,
  },
  {
    id: 'performance-q1',
    name: '性能需求 Q1',
    owner: '王五',
    status: '计划中',
    period: '2026-01-22 ~ 2026-01-30',
    totalCases: 342,
    executedCases: 0,
    passedCases: 0,
    executionRate: 0,
    passRate: 0,
    defectCount: 0,
    reopenCount: 0,
    codeCoverageRate: 0,
    newCases: 95,
    reusedCases: 247,
  },
  {
    id: 'api-integration',
    name: 'API 集成需求',
    owner: '赵六',
    status: '执行中',
    period: '2026-01-18 ~ 2026-01-28',
    totalCases: 584,
    executedCases: 412,
    passedCases: 385,
    executionRate: 70.5,
    passRate: 93.4,
    defectCount: 18,
    reopenCount: 2,
    codeCoverageRate: 88.2,
    newCases: 109,
    reusedCases: 475,
  },
  {
    id: 'sprint-23-regression',
    name: 'Sprint 23 回归需求',
    owner: '张三',
    status: '已完成',
    period: '2026-01-01 ~ 2026-01-10',
    totalCases: 768,
    executedCases: 768,
    passedCases: 695,
    executionRate: 100,
    passRate: 90.5,
    defectCount: 31,
    reopenCount: 5,
    codeCoverageRate: 83.6,
    newCases: 267,
    reusedCases: 501,
  },
  {
    id: 'security',
    name: '安全需求',
    owner: '孙七',
    status: '执行中',
    period: '2026-01-16 ~ 2026-01-26',
    totalCases: 218,
    executedCases: 124,
    passedCases: 118,
    executionRate: 56.9,
    passRate: 95.2,
    defectCount: 8,
    reopenCount: 1,
    codeCoverageRate: 78.5,
    newCases: 123,
    reusedCases: 95,
  },
];
