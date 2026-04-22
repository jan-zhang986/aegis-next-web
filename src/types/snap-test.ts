/**
 * SnapTest 相关类型定义
 * 从 SnapTestModule.tsx 提取
 */

/**
 * SnapTest 模块指标
 */
export interface SnapTestMetrics {
  dataGenerationEfficiencyTime: number | null; // 造数提效总时长（小时）
  dataGenerationEfficiencyRatio: number | null; // 造数提效比例（%）
  mqUsageCount: number | null; // MQ 使用的总次数
  toolAdoptionRate: number | null; // 工具采纳度（%）
  /** 造数工厂总数（Aegis 概览接口返回） */
  dataFactoryExecutionCount: number | null;
  automationEfficiency: number | null; // 自动化提效（小时）
  leftShiftAutomationRate: number | null; // 左移自动化率（%）
  dataCostReductionRate: number | null; // 数据成本降低率（%）
  userActivity: number | null; // 用户活跃度（操作次数/天）
  automationBugDiscoveryRate: number | null; // 自动化 bug 发现率（%）
  automationCriticalBugRate: number | null; // 自动化严重/致命 bug 发现占比（%）
  automationCaseWritingDuration: number | null; // 自动化用例编写时长（小时）
}

/**
 * call_count 数据项
 */
export interface CallCountItem {
  related_id: string;
  biz_name: string;
  call_count: number;
}

/**
 * 复杂度明细数据项
 */
export interface ComplexityDetailItem {
  biz_name: string;
  related_id: string;
  scores: {
    base: number;
    api: number;
    db: number;
    sql: number;
    logic: number;
    mq: number;
    risk: number;
    chain: number;
    functions: number;
  };
  total_cs: number;
  level: string;
}

/**
 * SnapTest API 响应数据
 */
export interface SnapTestApiResponse {
  dataGenerationEfficiency?: {
    total_save_time?: number;
    total_save_ratio?: number;
    total_estimated_time?: number;
    total_save_execution_time?: number;
    save_detail?: Record<string, any>;
    call_count?: CallCountItem[];
    complexity_detail?: ComplexityDetailItem[];
  };
  mqUsageCount?: number;
  dataFactoryExecutionCount?: number;
  toolAdoptionRate?: {
    activeUserCount?: number;
    targetUserCount?: number;
    adoptionRate?: number;
  };
}

/** 环比/同比对比项：up 上升/绿箭头，down 下降/红箭头，flat 持平 */
export type ComparisonChangeType = 'up' | 'down' | 'flat';

export interface ComparisonItem {
  current: number;
  previous: number;
  delta: number;
  changeType: ComparisonChangeType;
  changeRate: number | null;
}

/** Aegis 概览接口响应（camelCase）*/
export interface AegisEfficiencyOverviewResponse {
  code: number;
  message?: string | null;
  messageDetail?: string | null;
  data?: {
    dataGenerationEfficiency?: {
      totalSaveRatio?: number;
      totalSaveTime?: number;
      totalEstimatedTime?: number;
      totalSaveExecutionTime?: number;
      saveDetail?: Record<string, { totalSaveRatio?: number; totalSaveTime?: number }>;
      callCount?: Array<{ relatedId: string; bizName: string; callCount: number }>;
      complexityDetail?: Array<{
        bizName: string;
        relatedId: string;
        scores: Record<string, number>;
        totalCs: number;
        level: string;
      }>;
    };
    dataFactoryExecutionCount?: number;
    mqUsageCount?: number;
    /** 造数工厂统计（新结构） */
    dataFactoryStats?: {
      total: number;
      executionCount: number;
      comparison?: {
        total?: ComparisonItem;
        executionCount?: ComparisonItem;
      };
    };
    /** MQ 统计（新结构） */
    mqStats?: {
      total: number;
      usageCount: number;
      comparison?: {
        total?: ComparisonItem;
        usageCount?: ComparisonItem;
      };
    };
    /** MOCK 工厂统计（新结构） */
    mockFactoryStats?: {
      total: number;
      executionCount: number;
      comparison?: {
        total?: ComparisonItem;
        executionCount?: ComparisonItem;
      };
    };
    /** 自动化 Case 数 */
    automationStats?: {
      total: number;
      comparison?: { total?: ComparisonItem };
    };
    /** 测试计划总数 */
    testPlanStats?: {
      total: number;
      comparison?: { total?: ComparisonItem };
    };
    /** 自动化运行总数、E2E 成功率 */
    automationRunStats?: {
      total: number;
      successRate: number;
      comparison?: {
        total?: ComparisonItem;
        successCount?: ComparisonItem;
      };
    };
    /** 功能用例执行总数、执行成功率 */
    functionalCaseExecutionStats?: {
      total: number;
      successRate: number;
      comparison?: {
        total?: ComparisonItem;
        successCount?: ComparisonItem;
      };
    };
    toolAdoptionRate?: {
      activeUserCount?: number;
      targetUserCount?: number;
      adoptionRate?: number;
    };
    /** AI 用例统计（与 metrics/efficiency/overview 返回的 aiCaseStats 一致） */
    aiCaseStats?: {
      aiCaseCount: number;
      manualCaseCount: number;
      aiRatio: number;
      manualRatio?: number;
      aiCaseNewRate?: number;
      comparison?: {
        aiCaseCount?: ComparisonItem;
        manualCaseCount?: ComparisonItem;
        aiRatio?: ComparisonItem;
      };
    };
    comparisonType?: string;
    comparisonPeriod?: string;
    comparisonLabel?: string;
  };
}

/**
 * 用户信息接口（SnapTest）
 */
export interface SnapTestUserInfo {
  id: number;
  email: string;
  name: string;
  nickname: string;
  register_time: string;
  login_time: string;
}

/**
 * 用户列表 API 响应
 */
export interface UserListApiResponse {
  code: number;
  message: string;
  data: SnapTestUserInfo[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

/** 同比/环比：MOM 环比，YOY 同比 */
export type SnapTestComparisonType = 'MOM' | 'YOY';

/**
 * SnapTest API 请求参数
 */
export interface SnapTestApiRequest {
  startDate?: string;
  endDate?: string;
  /** 同比/环比：MOM 环比（默认），YOY 同比 */
  comparisonType?: SnapTestComparisonType;
  /** 个人维度：按人员邮箱 */
  personal?: string[];
  /** 个人维度：按用户 ID 列表（与 personal 同时传） */
  userId?: string[];
  /** 项目维度：按项目 ID 列表 */
  projectIds?: string[];
}

/**
 * 用户列表项格式
 */
export interface UserOption {
  value: string; // email
  label: string; // name + email
  name: string;
  /** 用户 ID，请求接口时传 userId 用 */
  id?: string;
}

/**
 * 用户活跃度数据接口
 */
export interface UserActivityDetail {
  name: string;
  data: number[];
}

export interface UserActivitySeries {
  name: string;
  data: number[];
  details?: UserActivityDetail[];
}

export interface UserActivityAction {
  action: string;
  count: number;
}

export interface UserActivityApplication {
  [detailType: string]: UserActivityAction[];
}

export interface UserActivityTopUser {
  user: string;
  total_activity: number;
  applications: {
    SnapTest?: UserActivityApplication;
    AegisGO?: UserActivityApplication;
  };
}

export interface UserActivityApiResponse {
  code: number;
  message: string;
  data: {
    dates: string[];
    series: UserActivitySeries[];
    top_users?: UserActivityTopUser[];
    total_activity?: number;
  };
}

/** /metrics/efficiency/activity 新接口：按维度返回 series（bizType / moduleType），breakdown 为直接总数据 */
export interface AegisEfficiencyActivitySeriesItem {
  user: string;
  totalActivity: number;
  /** 维度下的分类汇总，键如 Web/Plugin/Electron 或 SCRIPT/Automation/Case Execution 等，值为总数 */
  breakdown: Record<string, number>;
}

export interface AegisEfficiencyActivitySeries {
  dimension: string;
  description: string;
  items: AegisEfficiencyActivitySeriesItem[];
}

/** 在线用户明细项（metrics/efficiency/activity 的 onlineUserStats.details） */
export interface OnlineUserDetailItem {
  userId: string;
  name: string;
  email: string;
  sessionCount: number;
  onlineDurationSeconds: number;
  /** 上线时间戳（毫秒） */
  creationTime?: number;
}

export interface AegisEfficiencyActivityResponse {
  code: number;
  message?: string | null;
  messageDetail?: string | null;
  data?: {
    series: AegisEfficiencyActivitySeries[];
    totalActivity?: number;
    toolAdoptionRate?: { activeUserCount?: number; targetUserCount?: number; adoptionRate?: number };
    onlineUserStats?: { count: number; details?: OnlineUserDetailItem[] };
  };
}

/** 使用功能活跃：按用户 + 模块类型，breakdown 对应 API 键 MOCK/SCRIPT/SQL/HTTP/DUBBO/TOOL/ROCKETMQ/Automation/Case Execution */
export interface UserFunctionActivityItem {
  name: string;
  rank: number;
  /** Mock工厂，对应 MOCK */
  mockFactory: number;
  /** 自动化，对应 Automation */
  automation: number;
  /** 测试计划执行，对应 Case Execution */
  caseExecution: number;
  /** 造数工厂，对应 SCRIPT */
  dataFactory: number;
  /** 数据库工具，对应 SQL */
  dbTool: number;
  /** HTTP测试，对应 HTTP */
  httpTest: number;
  /** DUBBO测试，对应 DUBBO */
  dubboTest: number;
  /** 工具箱，对应 TOOL */
  tool: number;
  /** ROCKETMQ，对应 ROCKETMQ */
  rocketmq: number;
}

/** 使用端口活跃：按用户 + 业务类型（Web/Plugin/Electron） */
export interface PortActivityItem {
  name: string;
  rank: number;
  ports: {
    web: { total: number };
    plugin: { total: number };
    client: { total: number };
  };
}

/**
 * 时间范围类型（SnapTest）
 */
export type SnapTestTimeRangeType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * 筛选维度（SnapTest）
 */
export type SnapTestDimensionType = 'project' | 'personal';

/**
 * 指标卡片趋势：兼容旧格式或新接口 changeType
 */
export type SnapTestMetricCardTrend =
  | { value: number; isPositive: boolean }
  | { changeType: ComparisonChangeType; changeRate?: number };

/**
 * 指标卡片组件 Props（SnapTest）
 */
export interface SnapTestMetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: any;
  color?: string;
  /** 增长：up 绿箭头，down 红箭头，flat 持平；或旧格式 value + isPositive */
  trend?: SnapTestMetricCardTrend;
  /** 主数值使用该颜色（如自动化运行用黄色数值） */
  valueColor?: string;
  hoverContent?: React.ReactNode; // hover 时显示的内容
  subtitle?: React.ReactNode; // 标题下方的副标题
}
