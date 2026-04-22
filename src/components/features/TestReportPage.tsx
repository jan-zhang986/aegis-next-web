import { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Search,
  ChevronDown,
  PlayCircle,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TestRecord {
  id: string;
  workflowName: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  startTime: string;
  endTime: string;
  totalNodes: number;
  successNodes: number;
  failedNodes: number;
  executor: string;
}

interface TestReportPageProps {
  reportId?: string;
  onBack?: () => void;
}

export function TestReportPage({ reportId, onBack }: TestReportPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  // 核心指标数据
  const metrics = {
    totalTests: 1247,
    successRate: 92.3,
    failedTests: 96,
    avgDuration: 156,
    trend: {
      tests: '+15.2%',
      successRate: '+2.1%',
      duration: '-8.3%'
    }
  };

  // 测试趋势数据（最近7天）
  const trendData = [
    { date: '11-27', total: 156, success: 145, failed: 11 },
    { date: '11-28', total: 172, success: 160, failed: 12 },
    { date: '11-29', total: 189, success: 174, failed: 15 },
    { date: '11-30', total: 165, success: 152, failed: 13 },
    { date: '12-01', total: 198, success: 183, failed: 15 },
    { date: '12-02', total: 201, success: 186, failed: 15 },
    { date: '12-03', total: 166, success: 151, failed: 15 },
  ];

  // 工作流成功率分布
  const workflowSuccessRate = [
    { name: '用户注册流程', rate: 98.5, total: 245 },
    { name: '订单支付流程', rate: 94.2, total: 312 },
    { name: '商品搜索流程', rate: 96.8, total: 189 },
    { name: '购物车流程', rate: 91.3, total: 267 },
    { name: '用户登录流程', rate: 99.1, total: 234 },
  ];

  // 节点类型成功率
  const nodeTypeStats = [
    { name: 'HTTP请求', value: 456, color: '#3B82F6' },
    { name: 'SQL查询', value: 234, color: '#10B981' },
    { name: '数据校验', value: 189, color: '#A855F7' },
    { name: '条件判断', value: 145, color: '#F59E0B' },
    { name: '其他', value: 87, color: '#6B7280' },
  ];

  // 测试记录数据
  const testRecords: TestRecord[] = [
    {
      id: 'TEST-2024-001',
      workflowName: '用户注册完整流程',
      status: 'success',
      duration: 145,
      startTime: '2024-12-03 14:35:22',
      endTime: '2024-12-03 14:37:47',
      totalNodes: 8,
      successNodes: 8,
      failedNodes: 0,
      executor: '张三'
    },
    {
      id: 'TEST-2024-002',
      workflowName: '订单支付流程测试',
      status: 'failed',
      duration: 89,
      startTime: '2024-12-03 14:20:15',
      endTime: '2024-12-03 14:21:44',
      totalNodes: 12,
      successNodes: 9,
      failedNodes: 3,
      executor: '李四'
    },
    {
      id: 'TEST-2024-003',
      workflowName: '商品搜索与筛选',
      status: 'success',
      duration: 67,
      startTime: '2024-12-03 14:10:30',
      endTime: '2024-12-03 14:11:37',
      totalNodes: 6,
      successNodes: 6,
      failedNodes: 0,
      executor: '王五'
    },
    {
      id: 'TEST-2024-004',
      workflowName: '购物车操作流程',
      status: 'success',
      duration: 123,
      startTime: '2024-12-03 13:45:12',
      endTime: '2024-12-03 13:47:15',
      totalNodes: 10,
      successNodes: 10,
      failedNodes: 0,
      executor: '赵六'
    },
    {
      id: 'TEST-2024-005',
      workflowName: '用户登录认证流程',
      status: 'running',
      duration: 45,
      startTime: '2024-12-03 15:00:00',
      endTime: '-',
      totalNodes: 5,
      successNodes: 3,
      failedNodes: 0,
      executor: '孙七'
    },
    {
      id: 'TEST-2024-006',
      workflowName: '订单退款流程',
      status: 'failed',
      duration: 234,
      startTime: '2024-12-03 12:30:45',
      endTime: '2024-12-03 12:34:39',
      totalNodes: 15,
      successNodes: 12,
      failedNodes: 3,
      executor: '周八'
    },
    {
      id: 'TEST-2024-007',
      workflowName: '商品评价流程',
      status: 'success',
      duration: 98,
      startTime: '2024-12-03 12:15:20',
      endTime: '2024-12-03 12:16:58',
      totalNodes: 7,
      successNodes: 7,
      failedNodes: 0,
      executor: '吴九'
    },
    {
      id: 'TEST-2024-008',
      workflowName: '优惠券使用流程',
      status: 'success',
      duration: 112,
      startTime: '2024-12-03 11:50:10',
      endTime: '2024-12-03 11:52:02',
      totalNodes: 9,
      successNodes: 9,
      failedNodes: 0,
      executor: '郑十'
    },
  ];

  // 筛选测试记录
  const filteredRecords = testRecords.filter(record => {
    const matchSearch = record.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">成功</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">失败</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">运行中</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">未知</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <PlayCircle className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              className="gap-2 mb-4 text-gray-600 hover:text-gray-900"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
              返回报告列表
            </Button>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl text-gray-900 mb-2">
                {reportId ? `测试报告 - ${reportId}` : '自动化用例测试报告'}
              </h1>
              <p className="text-gray-600">全面的测试执行数据分析与报告</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="7days">最近7天</SelectItem>
                  <SelectItem value="30days">最���30天</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                导出报告
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-gray-600 text-sm mb-2">总测试数</div>
                <div className="text-3xl text-gray-900">{metrics.totalTests}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{metrics.trend.tests} vs 上周</span>
            </div>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-gray-600 text-sm mb-2">成功率</div>
                <div className="text-3xl text-gray-900">{metrics.successRate}%</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{metrics.trend.successRate} vs 上周</span>
            </div>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-gray-600 text-sm mb-2">失败测试</div>
                <div className="text-3xl text-gray-900">{metrics.failedTests}</div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span>需要关注</span>
            </div>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-gray-600 text-sm mb-2">平均耗时</div>
                <div className="text-3xl text-gray-900">{metrics.avgDuration}s</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingDown className="w-4 h-4" />
              <span>{metrics.trend.duration} vs 上周</span>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Test Trend */}
          <Card className="col-span-2 bg-white border-gray-200 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                测试执行趋势
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Area 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10B981" 
                  fill="url(#colorSuccess)" 
                  strokeWidth={2}
                  name="成功"
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#EF4444" 
                  fill="url(#colorFailed)" 
                  strokeWidth={2}
                  name="失败"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Node Type Distribution */}
          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg text-gray-900">节点类型分布</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={nodeTypeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nodeTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Workflow Success Rate */}
        <Card className="bg-white border-gray-200 shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h3 className="text-lg text-gray-900">��作流成功率 Top 5</h3>
          </div>
          <div className="space-y-4">
            {workflowSuccessRate.map((workflow, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 text-center text-gray-500 text-sm">#{index + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-900">{workflow.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{workflow.total} 次测试</span>
                      <span className="text-sm text-gray-900">{workflow.rate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${workflow.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Test Records Table */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">测试执行记录</h3>
              <div className="text-sm text-gray-500">
                共 {testRecords.length} 条记录，显示 {filteredRecords.length} 条
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索工作流名称或测试ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">测试ID</TableHead>
                  <TableHead>工作流名称</TableHead>
                  <TableHead className="w-24 text-center">状态</TableHead>
                  <TableHead className="w-32">执行时长</TableHead>
                  <TableHead className="w-44">开始时间</TableHead>
                  <TableHead className="w-44">结束时间</TableHead>
                  <TableHead className="w-32 text-center">节点统计</TableHead>
                  <TableHead className="w-24">执行人</TableHead>
                  <TableHead className="w-24 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-900">{record.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className="text-gray-900">{record.workflowName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{record.duration}s</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{record.startTime}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{record.endTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-green-600">{record.successNodes}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-red-600">{record.failedNodes}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{record.totalNodes}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">{record.executor}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              </div>
              <p className="text-gray-500">没有找到匹配的测试记录</p>
            </div>
          )}

          {filteredRecords.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                显示第 1-{filteredRecords.length} 条，共 {filteredRecords.length} 条
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
                <Button variant="outline" size="sm">
                  下一页
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
