/**
 * 性能诊断详情弹窗
 */
import { useState, useEffect, useMemo } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { performanceApi } from '@/services/dial-management';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DiagnosisDetailProps {
    visible: boolean;
    onOpenChange: (visible: boolean) => void;
    menuId: string | number;
}

export function DiagnosisDetail({ visible, onOpenChange, menuId }: DiagnosisDetailProps) {
    const [tableData, setTableData] = useState<any[]>([]);
    const [apiData, setApiData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDiagnosisData = async () => {
        if (!menuId) return;
        setLoading(true);
        try {
            const res = await performanceApi.diagnosis({ menu_id: menuId });
            // request.ts 已处理 code 逻辑并返回了 data 内容
            if (res) {
                const data = Array.isArray(res) ? res : (res as any).data || [];
                setTableData(data);

                // 处理 API 数据 (取最新一条)
                if (data.length > 0 && data[0].api_data && data[0].api_data.api_details) {
                    const processedApi = data[0].api_data.api_details
                        .map((item: any) => ({
                            url: item.url,
                            method: item.method || 'GET',
                            status: item.status || 200,
                            duration: item.duration,
                        }))
                        .sort((a: any, b: any) => b.duration - a.duration);
                    setApiData(processedApi);
                } else {
                    setApiData([]);
                }
            }
        } catch (error) {
            toast.error('获取诊断数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && menuId) {
            fetchDiagnosisData();
        }
    }, [visible, menuId]);

    const trendData = useMemo(() => {
        const sorted = [...tableData]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(item => ({
                time: format(new Date(item.created_at), 'MM-dd HH:mm'),
                fullTime: format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss'),
                performance: Math.round(item.performance_score * 100),
                accessibility: Math.round(item.accessibility_score * 100),
                bestPractice: Math.round(item.best_practices_score * 100),
                seo: Math.round(item.seo_score * 100),
            }));
        // 只展示最近 20 条，避免过于拥挤
        return sorted.slice(-20);
    }, [tableData]);

    const getScoreColor = (score: number) => {
        const val = Math.round(score * 100);
        if (val >= 90) return 'text-green-700 bg-green-100 border-none';
        if (val >= 50) return 'text-amber-800 bg-amber-100 border-none';
        return 'text-red-700 bg-red-100 border-none';
    };

    const getStatusBadge = (status: number) => {
        if (status >= 200 && status < 300) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">{status}</Badge>;
        if (status >= 400) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">{status}</Badge>;
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">{status}</Badge>;
    };

    const getDurationBadge = (duration: number) => {
        if (duration <= 1000) return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">优</Badge>;
        if (duration <= 3000) return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">中</Badge>;
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">差</Badge>;
    };

    return (
        <Sheet open={visible} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[800px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>性能诊断详情</SheetTitle>
                </SheetHeader>

                <div className="space-y-6">
                    {/* 趋势图 */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base font-medium">性能趋势</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {trendData.length === 0 ? (
                                <div className="h-[260px] flex items-center justify-center text-xs text-gray-400">
                                    暂无历史诊断记录
                                </div>
                            ) : (
                                <div className="h-[260px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={trendData}
                                            margin={{ top: 24, right: 16, bottom: 8, left: 8 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="time"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => `${v}%`}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => [`${value}%`, '']}
                                                labelFormatter={(label: string, payload) =>
                                                    payload?.[0]?.payload?.fullTime || label
                                                }
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    border: '1px solid #e5e7eb',
                                                    boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
                                                    fontSize: 12,
                                                }}
                                                labelStyle={{ fontWeight: 500, marginBottom: 4 }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                iconType="circle"
                                                wrapperStyle={{ paddingBottom: 12 }}
                                            />
                                            <Line
                                                name="性能"
                                                type="monotone"
                                                dataKey="performance"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line
                                                name="无障碍"
                                                type="monotone"
                                                dataKey="accessibility"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line
                                                name="最佳实践"
                                                type="monotone"
                                                dataKey="bestPractice"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line
                                                name="SEO"
                                                type="monotone"
                                                dataKey="seo"
                                                stroke="#8b5cf6"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 5 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* API 详情 */}
                    {apiData.length > 0 && (
                        <Card>
                            <CardHeader className="py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-medium">API 详情</CardTitle>
                                <div className="text-xs text-gray-500 space-x-4">
                                    <span>总计: {apiData.length}个请求</span>
                                    <span>总耗时: {apiData.reduce((s, i) => s + i.duration, 0)}ms</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50">
                                            <TableHead className="pl-6">URL</TableHead>
                                            <TableHead>方法</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead className="text-right pr-6">耗时(ms)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiData.slice(0, 10).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="pl-6 max-w-[300px] truncate" title={row.url}>
                                                    {row.url}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">{row.method}</TableCell>
                                                <TableCell>{getStatusBadge(row.status)}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="inline-flex items-center gap-2">
                                                        <span className="font-medium">{row.duration}</span>
                                                        {getDurationBadge(row.duration)}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {apiData.length > 10 && (
                                    <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-100 italic">
                                        仅展示耗时前 10 条记录
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* 执行记录 */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-base font-medium">执行记录</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead className="pl-6 w-[80px]">ID</TableHead>
                                        <TableHead>性能</TableHead>
                                        <TableHead>无障碍</TableHead>
                                        <TableHead>最佳实践</TableHead>
                                        <TableHead>SEO</TableHead>
                                        <TableHead className="text-right pr-6">时间</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableData.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="pl-6 font-mono text-xs">{row.id}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getScoreColor(row.performance_score)}>
                                                    {Math.round(row.performance_score * 100)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getScoreColor(row.accessibility_score)}>
                                                    {Math.round(row.accessibility_score * 100)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getScoreColor(row.best_practices_score)}>
                                                    {Math.round(row.best_practices_score * 100)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getScoreColor(row.seo_score)}>
                                                    {Math.round(row.seo_score * 100)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 text-xs text-gray-500">
                                                {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tableData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-400">暂无记录</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SheetContent>
        </Sheet>
    );
}
