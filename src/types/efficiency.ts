/**
 * EfficiencyDashboard 类型定义
 * 
 * 从 src/components/features/EfficiencyDashboard.tsx 提取
 * 包含用例效能指标、SnapTest指标、WebTest指标等类型定义
 */

// 基于新Dashboard API的用例效能指标（完整版：20+个指标）
export interface CaseManagementMetrics {
    projectId: string;

    // ========== UQS质量指标 (2个) ==========
    avgUQS: number;                    // 用例质量综合评分（UQS）(0-100)
    firstPassRate: number;             // 测试计划首次通过率 (%)
    // UQS子指标（可选）
    defectDiscoveryRate?: number;      // 缺陷发现率 (%)
    executableRate?: number;           // 可执行率 (%)
    reuseExecutionRate?: number;        // 复用率 (%)

    // ========== 复杂度指标 (4个) ==========
    totalWriteComplexity: number;      // 用例编写总复杂分
    totalExecComplexity: number;       // 用例执行总复杂分
    avgComplexity: number;             // 用例平均复杂度
    complexityVariance: number;        // 用例复杂度方差

    // ========== 工时指标 - 整体偏差 (2个) ==========
    avgWriteTimeDeviation: number;     // 平均编写工时偏差率 (%)
    avgExecTimeDeviation: number;      // 平均执行工时偏差率 (%)

    // ========== 工时指标 - 按复杂度分级 (8个) ==========
    expectedWriteTime: {               // 预期用例编写时长（按复杂度等级）
        l1: number;                      // L1复杂度 (小时)
        l2: number;                      // L2复杂度 (小时)
        l3: number;                      // L3复杂度 (小时)
        l4: number;                      // L4复杂度 (小时)
    };
    actualWriteTime: {                 // 实际用例编写时长（按复杂度等级）
        l1: number;
        l2: number;
        l3: number;
        l4: number;
    };
    expectedExecTime: {                // 预期用例执行时长（按复杂度等级）
        l1: number;                      // L1复杂度 (分钟)
        l2: number;                      // L2复杂度 (分钟)
        l3: number;                      // L3复杂度 (分钟)
        l4: number;                      // L4复杂度 (分钟)
    };
    actualExecTime: {                  // 实际用例执行时长（按复杂度等级）
        l1: number;
        l2: number;
        l3: number;
        l4: number;
    };
    writeTimeDeviationByLevel: {       // 用例编写时长偏差率（按复杂度等级）(%)
        l1: number;
        l2: number;
        l3: number;
        l4: number;
    };
    execTimeDeviationByLevel: {        // 用例执行时长偏差率（按复杂度等级）(%)
        l1: number;
        l2: number;
        l3: number;
        l4: number;
    };

    // ========== 复用指标 (3个) ==========
    reuseRateByCount: number;          // 用例数量复用率 (%)
    reuseRateByWorkload: number;       // 用例工作量复用率 (%)
    absoluteTimeSavings: number;       // 复用绝对节约工时 (小时)

    // ========== 变更热度指标 (2个) ==========
    caseGrowthRate: number;            // 用例新增率 (%)
    caseChangeHeat: number;            // 用例变更热度 (%)

    // ========== 执行效率指标 (3个) ==========
    avgCaseExecDuration: number;       // 平均用例执行时长 (分钟)
    manualCaseExecHeat: number;        // 手动用例执行热度 (%)
    topFrequentCases: Array<{          // 手动用例高执行次数top
        caseId: string;
        caseName: string;
        execCount: number;
        complexity: number;
    }>;

    // ========== 额外统计数据 ==========
    totalCaseCount?: number;           // 总用例数
    effectiveCaseCount?: number;       // 有效用例数
    reusedCaseCount?: number;          // 复用用例数（总数）
    directReuseCount?: number;         // 直接复用数（仅改标题）
    adaptReuseCount?: number;          // 适配复用数（改了其它）
    /** 复用指标用总用例数 = 用例模板库+回归用例库+最近2周新增（与复用率分母一致，仅复用卡片展示） */
    totalCaseCountForReuse?: number;

    // ========== 分子分母数据（用于前端展示计算公式验证）==========

    // 用例新增率的分子分母
    newCaseCount?: number;             // 新增用例数（分子）
    periodStartCaseCount?: number;     // 期初用例数（分母）

    // 平均用例执行时长的分子分母
    totalExecDurationMs?: number;      // 执行时长总和（毫秒，分子）
    totalExecCount?: number;           // 执行次数（分母）

    // 手动用例执行热度的分子分母
    highFreqCsTotal?: number;          // 高频回归用例CS总分（分子）
    allExecCsTotal?: number;           // 所有执行用例CS总分（分母）

    // 首次通过率的分子分母
    firstPassCount?: number;           // 首次执行通过用例数（分子）
    firstExecCount?: number;           // 首次执行总用例数（分母）

    // 编写工时偏差率的分子分母
    actualWriteDurationHours?: number; // 实际编写工时（小时，分子）
    expectedWriteDurationHours?: number;// 理论编写工时（小时，分母）

    // 执行工时偏差率的分子分母
    actualExecDurationMinutes?: number;// 实际执行工时（分钟，分子）
    expectedExecDurationMinutes?: number;// 理论执行工时（分钟，分母）

    // 用例工作量复用率的分子分母
    reusedCsTotal?: number;            // 复用用例总CS分值（分子）
    totalCsScore?: number;             // 总CS分值（分母）

    // 用例变更热度的分子分母
    modifiedCaseCount?: number;        // 周期内修改的用例数量（分子）
    totalCaseCountInPeriod?: number;   // 周期内总的用例数量（分母）
}

// snaptest 模块指标
export interface SnapTestMetrics {
    dataGenerationEfficiencyTime: number; // 造数提效总时长（小时）
    dataGenerationEfficiencyRatio: number; // 造数提效比例（%）
    mqUsageCount: number; // MQ 使用的总次数
    automationEfficiency: number; // 自动化提效（小时）
    leftShiftAutomationRate: number; // 左移自动化率（%）
    dataCostReductionRate: number; // 数据成本降低率（%）
    userActivity: number; // 用户活跃度（操作次数/天）
    automationBugDiscoveryRate: number; // 自动化 bug 发现率（%）
    automationCriticalBugRate: number; // 自动化严重/致命 bug 发现占比（%）
    automationCaseWritingDuration: number; // 自动化用例编写时长（小时）
}

// webTest 模块指标
export interface WebTestMetrics {
    monitoringTaskCount: number; // 拨测任务数 (task_number)
    taskNumberTrend?: number; // 任务数趋势 (trend) - 数值类型
    monitoringTaskExecutionCount: number; // 拨测任务执行数 (running_times)
    runningTimesTrend?: number; // 执行次数趋势 (running_times_trend) - 数值类型
    avgMonitoringExecutionTime: number; // 平均拨测执行时间（秒）(avg_running_time)
    avgRunningTimeTrend?: number; // 平均执行时间趋势 (avg_running_time_trend) - 数值类型
    anomalyDiscoveryCount: number; // 发现异常数
    userExperience: number; // 用户体验（API 性能分数）
}

// 综合效能指标
export interface EfficiencyMetrics {
    caseManagement: CaseManagementMetrics;
    snapTest: SnapTestMetrics;
    webTest: WebTestMetrics;
}

// 维度类型
export type DimensionType = 'personal' | 'project';

// 时间范围类型
export type TimeRangeType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

// WebTest 时间范围类型
export type WebTestTimeRangeType = '全部' | '本周' | '上周' | '本月' | '上月';

// 全局指标类型
export interface GlobalMetrics {
    totalCaseCount: number;
    effectiveCaseCount: number;  // 有效用例数：单位时间内两库中的用例新增数量（按 create_time）
    avgUQS: number;
    absoluteTimeSavings: number;
    caseChangeHeat: number;
}

// 自定义日期范围类型
export interface CustomDateRange {
    start: Date | null;
    end: Date | null;
}

// 饼图数据类型
export interface PieChartData {
    name: string;
    value: number;
    percentage: number;
}

// 用例列表弹窗类型
export interface CaseListModalState {
    isOpen: boolean;
    title: string;
    cases: Array<{
        id: string;
        name: string;
        requirementId?: string;
        requirementName?: string;
        [key: string]: unknown;
    }>;
    type: 'change' | 'block';
}

// 复杂度等级类型
export interface ComplexityLevel {
    l1: number;
    l2: number;
    l3: number;
    l4: number;
}
