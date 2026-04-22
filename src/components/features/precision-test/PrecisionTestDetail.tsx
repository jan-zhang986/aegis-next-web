import { useState } from 'react';
import { Settings as SettingsIcon, Play, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { TestPlan, CoverageReport } from '@/types/precisionTest';
import { CodeCoverageViewer } from '@/components/features/CodeCoverageViewer';
import { CoverageOverview } from './CoverageOverview';
import { PackageCoverageTable } from './PackageCoverageTable';

interface PrecisionTestDetailProps {
    plan: TestPlan;
    onBack: () => void;
}

export function PrecisionTestDetail({ plan, onBack }: PrecisionTestDetailProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'failed' | 'coverage'>('coverage');
    const [selectedReport, setSelectedReport] = useState<CoverageReport | null>(null);

    // 计算总体覆盖率
    const overallLineCoverage = plan.packageCoverage
        ? plan.packageCoverage.reduce((sum, p) => sum + p.lineCoverage, 0) / plan.packageCoverage.length
        : plan.codeCoverage;
    const overallBranchCoverage = plan.packageCoverage
        ? plan.packageCoverage.reduce((sum, p) => sum + p.branchCoverage, 0) / plan.packageCoverage.length
        : 78;
    const overallMethodCoverage = plan.packageCoverage
        ? plan.packageCoverage.reduce((sum, p) => sum + p.methodCoverage, 0) / plan.packageCoverage.length
        : 89;
    const overallClassCoverage = plan.packageCoverage
        ? plan.packageCoverage.reduce((sum, p) => sum + p.classCoverage, 0) / plan.packageCoverage.length
        : 88;

    const handleViewReport = (report: CoverageReport) => {
        setSelectedReport(report);
    };

    return (
        <div className="flex-1 w-full h-full flex flex-col bg-gray-50 min-w-0 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            &larr; 返回
                        </Button>
                        <h1 className="text-2xl font-semibold text-gray-900">{plan.name}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <SettingsIcon className="w-4 h-4" />
                            配置
                        </Button>
                        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Play className="w-4 h-4" />
                            运行测试
                        </Button>
                    </div>
                </div>

                {/* Project Info */}
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <span><span className="text-gray-500">项目:</span> {plan.projectName}</span>
                    <span><span className="text-gray-500">分支:</span> {plan.branch}</span>
                    <span><span className="text-gray-500">创建人:</span> {plan.tester}</span>
                    <span><span className="text-gray-500">Jacoco任务:</span> {plan.taskId}</span>
                </div>

                {/* Summary Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-600">总计: <span className="text-gray-900 font-medium">{plan.caseCount}</span></span>
                    <span className="text-gray-600 flex items-center gap-1">
                        通过: <CheckCircle2 className="w-4 h-4 text-green-600" /> <span className="text-green-600 font-medium">{plan.passedCount}</span>
                    </span>
                    <span className="text-gray-600 flex items-center gap-1">
                        失败: <XCircle className="w-4 h-4 text-red-600" /> <span className="text-red-600 font-medium">{plan.failedCount}</span>
                    </span>
                    <span className="text-gray-600">覆盖率: <span className="text-gray-900 font-medium">{plan.codeCoverage}%</span></span>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="bg-transparent">
                        <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                            全部测试
                        </TabsTrigger>
                        <TabsTrigger value="failed" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                            失败测试
                        </TabsTrigger>
                        <TabsTrigger value="coverage" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                            覆盖率分析
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-white p-6">
                {activeTab === 'coverage' && (
                    <>
                        <CoverageOverview
                            lineCoverage={overallLineCoverage}
                            branchCoverage={overallBranchCoverage}
                            methodCoverage={overallMethodCoverage}
                            classCoverage={overallClassCoverage}
                        />
                        {plan.packageCoverage && (
                            <PackageCoverageTable
                                packageCoverage={plan.packageCoverage}
                                onViewReport={handleViewReport}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Code Coverage Viewer Modal */}
            {selectedReport && (
                <CodeCoverageViewer
                    fileName={selectedReport.fileName}
                    filePath={selectedReport.filePath}
                    lineCoverage={selectedReport.lineCoverage}
                    branchCoverage={selectedReport.branchCoverage}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
}
