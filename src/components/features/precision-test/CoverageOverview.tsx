import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Leaf, Zap, Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CoverageOverviewProps {
    lineCoverage: number;
    branchCoverage: number;
    methodCoverage: number;
    classCoverage: number;
}

export function CoverageOverview({
    lineCoverage,
    branchCoverage,
    methodCoverage,
    classCoverage,
}: CoverageOverviewProps) {
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
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">总体覆盖率概览</h2>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    导出Jacoco报告
                </Button>
            </div>
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Pencil className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">行覆盖率</span>
                        </div>
                        <div className={`text-2xl font-bold mb-2 ${getCoverageTextColor(lineCoverage)}`}>
                            {lineCoverage.toFixed(0)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${getCoverageColor(lineCoverage)}`}
                                style={{ width: `${lineCoverage}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Leaf className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">分支覆盖率</span>
                        </div>
                        <div className={`text-2xl font-bold mb-2 ${getCoverageTextColor(branchCoverage)}`}>
                            {branchCoverage.toFixed(0)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${getCoverageColor(branchCoverage)}`}
                                style={{ width: `${branchCoverage}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">方法覆盖率</span>
                        </div>
                        <div className={`text-2xl font-bold mb-2 ${getCoverageTextColor(methodCoverage)}`}>
                            {methodCoverage.toFixed(0)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${getCoverageColor(methodCoverage)}`}
                                style={{ width: `${methodCoverage}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">类覆盖率</span>
                        </div>
                        <div className={`text-2xl font-bold mb-2 ${getCoverageTextColor(classCoverage)}`}>
                            {classCoverage.toFixed(0)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${getCoverageColor(classCoverage)}`}
                                style={{ width: `${classCoverage}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
