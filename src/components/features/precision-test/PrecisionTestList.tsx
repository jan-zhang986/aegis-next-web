import { useState } from 'react';
import { Search, Plus, MoreVertical, Folder, Settings, BarChart3, User, Calendar, FileCode, ArrowLeft, AlertCircle, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TestPlan } from '@/types/precisionTest';

interface PrecisionTestListProps {
    testPlans: TestPlan[];
    onSelectPlan: (plan: TestPlan) => void;
}

export function PrecisionTestList({ testPlans, onSelectPlan }: PrecisionTestListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProject, setFilterProject] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredPlans = testPlans.filter((plan) => {
        const matchesSearch =
            plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.projectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProject = filterProject === 'all' || plan.projectName === filterProject;
        const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
        return matchesSearch && matchesProject && matchesStatus;
    });

    const totalPlans = testPlans.length;
    const runningPlans = testPlans.filter(p => p.status === 'running').length;
    const completedPlans = testPlans.filter(p => p.status === 'completed').length;
    const failedPlans = testPlans.filter(p => p.status === 'failed').length;
    const avgCoverage = testPlans.reduce((sum, p) => sum + p.codeCoverage, 0) / testPlans.length;

    const uniqueProjects = Array.from(new Set(testPlans.map(p => p.projectName)));

    const getStatusBadge = (status: TestPlan['status']) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 border-green-200">已完成</Badge>;
            case 'running':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">进行中</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-700 border-red-200">失败</Badge>;
        }
    };

    const getPlanTypeBadge = (planType: TestPlan['planType']) => {
        switch (planType) {
            case 'unit':
                return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">单元测试</Badge>;
            case 'functional':
                return <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">功能测试</Badge>;
        }
    };

    const getEnvironmentBadge = (environment: string) => {
        const envColors: Record<string, { bg: string; text: string; border: string }> = {
            '生产环境': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
            '测试环境': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
            '开发环境': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
        };
        const colors = envColors[environment] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' };
        return (
            <Badge variant="outline" className={`${colors.border} ${colors.text} ${colors.bg}`}>
                {environment}
            </Badge>
        );
    };

    const getCoverageColor = (coverage: number) => {
        if (coverage >= 80) return 'bg-green-500';
        if (coverage >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getCoverageTextColor = (coverage: number) => {
        if (coverage >= 80) return 'text-green-600';
        if (coverage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="flex-1 w-full h-full flex flex-col bg-gray-50 min-w-0 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">精准测试</h1>
                            <p className="text-sm text-gray-500">管理测试计划，查看代码覆盖率和测试报告</p>
                        </div>
                    </div>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        新建测试计划
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-2">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-600 mb-1">总计划数</div>
                        <div className="text-2xl font-bold text-blue-900">{totalPlans}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="text-sm text-green-600 mb-1">已完成</div>
                        <div className="text-2xl font-bold text-green-900">{completedPlans}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <div className="text-sm text-purple-600 mb-1">平均覆盖率</div>
                        <div className="text-2xl font-bold text-purple-900">{avgCoverage.toFixed(1)}%</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <div className="text-sm text-orange-600 mb-1">进行中</div>
                        <div className="text-2xl font-bold text-orange-900">{runningPlans}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="搜索测试计划或项目..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="所有项目" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有项目</SelectItem>
                        {uniqueProjects.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="所有状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">所有状态</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="running">进行中</SelectItem>
                        <SelectItem value="failed">失败</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid gap-4">
                    {filteredPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer group"
                            onClick={() => onSelectPlan(plan)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${plan.status === 'completed' ? 'bg-green-50 text-green-600' :
                                            plan.status === 'running' ? 'bg-blue-50 text-blue-600' :
                                                'bg-red-50 text-red-600'
                                        }`}>
                                        <FileCode className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {plan.name}
                                            </h3>
                                            {getStatusBadge(plan.status)}
                                            {getPlanTypeBadge(plan.planType)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Folder className="w-4 h-4" />
                                                {plan.projectName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <GitBranch className="w-4 h-4" />
                                                {plan.branch}
                                            </span>
                                            {getEnvironmentBadge(plan.environment)}
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>查看详情</DropdownMenuItem>
                                        <DropdownMenuItem>编辑计划</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">删除计划</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="grid grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        测试人员
                                    </div>
                                    <div className="font-medium text-gray-900">{plan.tester}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        执行时间
                                    </div>
                                    <div className="font-medium text-gray-900">{plan.date}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">用例执行</div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{plan.passedCount}/{plan.caseCount}</span>
                                        <div className="flex-1 w-20 bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-green-500 h-1.5 rounded-full"
                                                style={{ width: `${(plan.passedCount / plan.caseCount) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">代码覆盖率</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${getCoverageTextColor(plan.codeCoverage)}`}>
                                            {plan.codeCoverage}%
                                        </span>
                                        <div className="flex-1 w-20 bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${getCoverageColor(plan.codeCoverage)}`}
                                                style={{ width: `${plan.codeCoverage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
