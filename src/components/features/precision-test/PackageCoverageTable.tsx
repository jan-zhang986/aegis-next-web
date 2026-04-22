import { useState } from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PackageCoverage, CoverageReport } from '@/types/precisionTest';

interface PackageCoverageTableProps {
    packageCoverage: PackageCoverage[];
    onViewReport: (report: CoverageReport) => void;
}

export function PackageCoverageTable({ packageCoverage, onViewReport }: PackageCoverageTableProps) {
    const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set(['com.aegisone.order']));

    const togglePackage = (packageName: string) => {
        setExpandedPackages(prev => {
            const next = new Set(prev);
            if (next.has(packageName)) {
                next.delete(packageName);
            } else {
                next.add(packageName);
            }
            return next;
        });
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
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">包覆盖率详情</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Layers className="w-4 h-4" />
                    点击类名查看代码染色
                </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[300px]">包/类名称</TableHead>
                            <TableHead>行覆盖率</TableHead>
                            <TableHead>分支覆盖率</TableHead>
                            <TableHead>方法覆盖率</TableHead>
                            <TableHead>类覆盖率</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {packageCoverage.map((pkg) => (
                            <>
                                <TableRow key={pkg.packageName} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => togglePackage(pkg.packageName)}
                                                className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                                            >
                                                {expandedPackages.has(pkg.packageName) ? (
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                                <span className="font-medium">{pkg.packageName}</span>
                                            </button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${getCoverageTextColor(pkg.lineCoverage)}`}>
                                                {pkg.lineCoverage}%
                                            </span>
                                            <span className="text-xs text-gray-500">({pkg.lineCovered}/{pkg.lineTotal})</span>
                                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${getCoverageColor(pkg.lineCoverage)}`}
                                                    style={{ width: `${pkg.lineCoverage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${getCoverageTextColor(pkg.branchCoverage)}`}>
                                                {pkg.branchCoverage}%
                                            </span>
                                            <span className="text-xs text-gray-500">({pkg.branchCovered}/{pkg.branchTotal})</span>
                                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${getCoverageColor(pkg.branchCoverage)}`}
                                                    style={{ width: `${pkg.branchCoverage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${getCoverageTextColor(pkg.methodCoverage)}`}>
                                                {pkg.methodCoverage}%
                                            </span>
                                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${getCoverageColor(pkg.methodCoverage)}`}
                                                    style={{ width: `${pkg.methodCoverage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${getCoverageTextColor(pkg.classCoverage)}`}>
                                                {pkg.classCoverage}%
                                            </span>
                                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${getCoverageColor(pkg.classCoverage)}`}
                                                    style={{ width: `${pkg.classCoverage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedPackages.has(pkg.packageName) && pkg.classes?.map((cls) => (
                                    <TableRow key={cls.className} className="bg-gray-50 hover:bg-gray-100">
                                        <TableCell>
                                            <div className="pl-6">
                                                <button
                                                    onClick={() => onViewReport({
                                                        id: cls.className,
                                                        fileName: cls.className,
                                                        filePath: `${pkg.packageName}/${cls.className}`,
                                                        lineCoverage: cls.lineCoverage,
                                                        branchCoverage: cls.branchCoverage,
                                                        methodCoverage: cls.methodCoverage,
                                                        classCoverage: cls.classCoverage,
                                                        totalLines: cls.lineTotal,
                                                        coveredLines: cls.lineCovered,
                                                        uncoveredLines: cls.lineTotal - cls.lineCovered,
                                                        lastUpdate: '',
                                                        status: cls.lineCoverage >= 80 ? 'success' : cls.lineCoverage >= 60 ? 'warning' : 'error',
                                                    })}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {cls.className}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${getCoverageTextColor(cls.lineCoverage)}`}>
                                                    {cls.lineCoverage}%
                                                </span>
                                                <span className="text-xs text-gray-500">({cls.lineCovered}/{cls.lineTotal})</span>
                                                <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getCoverageColor(cls.lineCoverage)}`}
                                                        style={{ width: `${cls.lineCoverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${getCoverageTextColor(cls.branchCoverage)}`}>
                                                    {cls.branchCoverage}%
                                                </span>
                                                <span className="text-xs text-gray-500">({cls.branchCovered}/{cls.branchTotal})</span>
                                                <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getCoverageColor(cls.branchCoverage)}`}
                                                        style={{ width: `${cls.branchCoverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${getCoverageTextColor(cls.methodCoverage)}`}>
                                                    {cls.methodCoverage}%
                                                </span>
                                                <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getCoverageColor(cls.methodCoverage)}`}
                                                        style={{ width: `${cls.methodCoverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${getCoverageTextColor(cls.classCoverage)}`}>
                                                    {cls.classCoverage}%
                                                </span>
                                                <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${getCoverageColor(cls.classCoverage)}`}
                                                        style={{ width: `${cls.classCoverage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
