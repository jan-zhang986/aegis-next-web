import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Globe,
  Database,
  Workflow,
  Users,
  FileText,
  AlertCircle,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card } from '@/components/ui/card';

interface DashboardStats {
  totalProjects: number;
  totalApis: number;
  totalE2EWorkflows: number;
  totalTestCases: number;
  apiTestSuccessRate: number;
  e2eSuccessRate: number;
  avgResponseTime: number;
  activeUsers: number;
}

interface ApiTestRecord {
  date: string;
  total: number;
  success: number;
  failed: number;
}

interface E2EWorkflowData {
  name: string;
  status: string;
  count: number;
}

interface ApiTypeDistribution {
  name: string;
  value: number;
  color: string;
}

export function DataDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 156,
    totalApis: 2847,
    totalE2EWorkflows: 423,
    totalTestCases: 5621,
    apiTestSuccessRate: 94.6,
    e2eSuccessRate: 91.2,
    avgResponseTime: 245,
    activeUsers: 38,
  });

  // 模拟实时数据更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setStats(prev => ({
        ...prev,
        activeUsers: 35 + Math.floor(Math.random() * 8),
        avgResponseTime: 200 + Math.floor(Math.random() * 100),
      }));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // API测试趋势数据（最近7天）
  const apiTestTrends: ApiTestRecord[] = [
    { date: '11-27', total: 342, success: 324, failed: 18 },
    { date: '11-28', total: 389, success: 368, failed: 21 },
    { date: '11-29', total: 425, success: 401, failed: 24 },
    { date: '11-30', total: 398, success: 378, failed: 20 },
    { date: '12-01', total: 456, success: 432, failed: 24 },
    { date: '12-02', total: 512, success: 486, failed: 26 },
    { date: '12-03', total: 478, success: 453, failed: 25 },
  ];

  // E2E工作流状态分布
  const e2eWorkflowStatus: E2EWorkflowData[] = [
    { name: '成功', status: 'success', count: 386 },
    { name: '失败', status: 'failed', count: 27 },
    { name: '运行中', status: 'running', count: 10 },
  ];

  // API类型分布
  const apiTypeDistribution: ApiTypeDistribution[] = [
    { name: 'HTTP', value: 1245, color: '#3B82F6' },
    { name: 'SQL', value: 687, color: '#10B981' },
    { name: 'Dubbo', value: 523, color: '#A855F7' },
    { name: 'WebSocket', value: 245, color: '#EC4899' },
    { name: 'TCP', value: 89, color: '#F59E0B' },
    { name: 'RocketMQ', value: 58, color: '#EF4444' },
  ];

  // 响应时间分布
  const responseTimeData = [
    { range: '0-100ms', count: 1245 },
    { range: '100-300ms', count: 987 },
    { range: '300-500ms', count: 423 },
    { range: '500-1s', count: 156 },
    { range: '>1s', count: 36 },
  ];

  // 项目活跃度（最近7天）
  const projectActivity = [
    { date: '11-27', tests: 342, workflows: 45 },
    { date: '11-28', tests: 389, workflows: 52 },
    { date: '11-29', tests: 425, workflows: 48 },
    { date: '11-30', tests: 398, workflows: 56 },
    { date: '12-01', tests: 456, workflows: 63 },
    { date: '12-02', tests: 512, workflows: 58 },
    { date: '12-03', tests: 478, workflows: 61 },
  ];

  const COLORS = ['#10B981', '#EF4444', '#3B82F6'];

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AegisOnes数据监控大屏
            </h1>
            <p className="text-gray-600 text-lg">API测试与自动化用例数据分析平台</p>
          </div>
          <div className="text-right">
            <div className="text-3xl text-gray-800 mb-1">
              {currentTime.toLocaleTimeString('zh-CN')}
            </div>
            <div className="text-gray-500">
              {currentTime.toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-8 mb-10">
        <Card className="bg-white border-blue-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-3">总项目数</div>
              <div className="text-4xl text-gray-900 mb-2">{stats.totalProjects}</div>
              <div className="text-green-600 text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-green-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-3">API接口总数</div>
              <div className="text-4xl text-gray-900 mb-2">{stats.totalApis}</div>
              <div className="text-green-600 text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+8.3%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-3">E2E工作流</div>
              <div className="text-4xl text-gray-900 mb-2">{stats.totalE2EWorkflows}</div>
              <div className="text-green-600 text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>+15.7%</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Workflow className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border-orange-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-3">在线用户</div>
              <div className="text-4xl text-gray-900 mb-2">{stats.activeUsers}</div>
              <div className="text-orange-600 text-sm flex items-center gap-1">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>实时</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-4 gap-8 mb-10">
        <Card className="bg-white border-gray-200 shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600">API测试成功率</div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl text-gray-900 mb-3">{stats.apiTestSuccessRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.apiTestSuccessRate}%` }}
            />
          </div>
        </Card>

        <Card className="bg-white border-gray-200 shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600">E2E成功率</div>
            <Workflow className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl text-gray-900 mb-3">{stats.e2eSuccessRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.e2eSuccessRate}%` }}
            />
          </div>
        </Card>

        <Card className="bg-white border-gray-200 shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600">平均响应时间</div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl text-gray-900 mb-2">{stats.avgResponseTime}ms</div>
          <div className="text-sm text-gray-500">比昨日快 12ms</div>
        </Card>

        <Card className="bg-white border-gray-200 shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600">测试用例总数</div>
            <Database className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-3xl text-gray-900 mb-2">{stats.totalTestCases}</div>
          <div className="text-sm text-gray-500">覆盖率 87.3%</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-8 mb-10">
        {/* API Test Trends */}
        <Card className="col-span-2 bg-white border-gray-200 shadow-md p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              API测试趋势（最近7天）
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={apiTestTrends}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
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
              <Legend wrapperStyle={{ fontSize: '14px', color: '#6B7280' }} />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                fill="url(#colorTotal)" 
                strokeWidth={3}
                name="总测试"
              />
              <Area 
                type="monotone" 
                dataKey="success" 
                stroke="#10B981" 
                fill="url(#colorSuccess)" 
                strokeWidth={3}
                name="成功"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* E2E Workflow Status */}
        <Card className="bg-white border-gray-200 shadow-md p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl text-gray-800 flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-purple-600" />
              E2E工作流状态
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={e2eWorkflowStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {e2eWorkflowStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-8">
        {/* API Type Distribution */}
        <Card className="bg-white border-gray-200 shadow-md p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl text-gray-800 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              API类型分布
            </h3>
          </div>
          <div className="space-y-5">
            {apiTypeDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm text-gray-900">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / apiTypeDistribution[0].value) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Response Time Distribution */}
        <Card className="bg-white border-gray-200 shadow-md p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl text-gray-800 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              响应时间分布
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="range" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Project Activity */}
        <Card className="bg-white border-gray-200 shadow-md p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              项目活跃度
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectActivity}>
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
              <Legend wrapperStyle={{ fontSize: '14px', color: '#6B7280' }} />
              <Line 
                type="monotone" 
                dataKey="tests" 
                stroke="#10B981" 
                strokeWidth={3}
                name="API测试"
                dot={{ fill: '#10B981', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="workflows" 
                stroke="#A855F7" 
                strokeWidth={3}
                name="E2E工作流"
                dot={{ fill: '#A855F7', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card className="mt-10 bg-white border-gray-200 shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
            实时活动
          </h3>
          <span className="text-sm text-gray-500">最近更新</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1">
              <div className="text-sm text-gray-900">用户登录接口测试 - 成功</div>
              <div className="text-xs text-gray-600 mt-1">2分钟前 · 响应时间: 156ms</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
          </div>
          <div className="flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1">
              <div className="text-sm text-gray-900">订单流程E2E测试 - 运行中</div>
              <div className="text-xs text-gray-600 mt-1">5分钟前 · 进度: 3/5</div>
            </div>
            <Activity className="w-5 h-5 text-purple-600 mt-1 animate-spin" />
          </div>
          <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="text-sm text-gray-900">支付接口调用 - 失败</div>
              <div className="text-xs text-gray-600 mt-1">8分钟前 · 错误: 连接超时</div>
            </div>
            <XCircle className="w-5 h-5 text-red-600 mt-1" />
          </div>
          <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="text-sm text-gray-900">数据库查询测试 - 成功</div>
              <div className="text-xs text-gray-600 mt-1">12分钟前 · 响应时间: 89ms</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
          </div>
        </div>
      </Card>
    </div>
  );
}
