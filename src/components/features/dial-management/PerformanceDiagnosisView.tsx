/**
 * 拨测管理 - web性能分析（来自 spotter-aegislm PerfDiagnosis，1:1 还原）
 */
import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { performanceApi } from '@/services/dial-management';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { Share2, Play, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { DiagnosisDetail } from './DiagnosisDetail';

import { APP_OPTIONS } from './constants';

interface MenuNode {
  id: string | number;
  name: string;
  path: string;
  isActive: number;
  performance?: number | string;
  accessibility?: number | string;
  best_practice?: number | string;
  seo?: number | string;
  children?: MenuNode[];
}

export function PerformanceDiagnosisView() {
  const [selectedApp, setSelectedApp] = useState<string>(APP_OPTIONS[0]);
  const [filters, setFilters] = useState({
    name: '',
    path: '',
    isActive: 'all' as string,
  });
  const [tableData, setTableData] = useState<MenuNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // 详情抽屉
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string | number>('');

  // 配置弹窗
  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executionType, setExecutionType] = useState<'single' | 'batch'>('single');
  const [currentExecutionData, setCurrentExecutionData] = useState<any>(null);

  const [configForm, setConfigForm] = useState({
    account: '',
    device: 'desktop',
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    locale: 'zh-CN',
  });

  const getPerformanceScores = async () => {
    try {
      const res = await performanceApi.latest({ app_code: selectedApp });
      // request.ts 返回的是 res.data，如果后端返回 { code: 200, data: [...] }，则 res 是数组
      // 如果后端返回 { code: 200, data: { data: [...] } }，则 res 是 { data: [...] }
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      const map: Record<string | number, any> = {};
      data.forEach((item: any) => {
        map[item.menu_id] = {
          performance: Math.round(item.performance_score * 100),
          accessibility: Math.round(item.accessibility_score * 100),
          best_practice: Math.round(item.best_practices_score * 100),
          seo: Math.round(item.seo_score * 100),
        };
      });
      return map;
    } catch (error) {
      console.error('获取性能数据失败:', error);
      return {};
    }
  };

  const processMenuData = (menuItem: any, performanceMap: Record<string | number, any>): MenuNode => {
    const node: MenuNode = {
      ...menuItem,
      ...(performanceMap[menuItem.id] || {
        performance: '-',
        accessibility: '-',
        best_practice: '-',
        seo: '-',
      }),
    };
    if (menuItem.children && menuItem.children.length > 0) {
      node.children = menuItem.children.map((child: any) =>
        processMenuData(child, performanceMap)
      );
    }
    return node;
  };

  const queryMenuList = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        currentPage: 1,
        pageSize: 9999,
        appCode: selectedApp,
      };
      if (filters.name) params.name = filters.name;
      if (filters.path) params.path = filters.path;
      if (filters.isActive !== 'all') params.isActive = Number(filters.isActive);

      const [menuRes, performanceMap] = await Promise.all([
        performanceApi.menuList(params),
        getPerformanceScores(),
      ]);

      if (menuRes && (menuRes as any).data) {
        const rawData = (menuRes as any).data;
        setTableData(rawData.map((item: any) => processMenuData(item, performanceMap)));
      } else {
        setTableData([]);
      }
    } catch (error) {
      toast.error('获取列表失败');
    } finally {
      setLoading(false);
    }
  }, [selectedApp, filters]);

  useEffect(() => {
    queryMenuList();
  }, [selectedApp]);

  const onReset = () => {
    setFilters({ name: '', path: '', isActive: 'all' });
    setSelectedApp('Gmesh');
  };

  const handleRowSelect = (id: string | number, checked: boolean) => {
    const newSelected = new Set(selectedRows);

    // 查找节点及其所有子节点
    const findNodeAndChildrenIds = (nodes: MenuNode[], targetId: string | number): (string | number)[] => {
      for (const node of nodes) {
        if (node.id === targetId) {
          const ids = [node.id];
          const getChildrenIds = (children: MenuNode[]) => {
            children.forEach(child => {
              ids.push(child.id);
              if (child.children) getChildrenIds(child.children);
            });
          };
          if (node.children) getChildrenIds(node.children);
          return ids;
        }
        if (node.children) {
          const found = findNodeAndChildrenIds(node.children, targetId);
          if (found.length > 0) return found;
        }
      }
      return [];
    };

    const targetIds = findNodeAndChildrenIds(tableData, id);
    targetIds.forEach(targetId => {
      if (checked) {
        newSelected.add(targetId);
      } else {
        newSelected.delete(targetId);
      }
    });

    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string | number>();
      const collectIds = (nodes: MenuNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(tableData);
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getValidMenus = (nodes: MenuNode[]): any[] => {
    const result: any[] = [];
    nodes.forEach((node) => {
      if (selectedRows.has(node.id)) {
        if (node.path && node.path !== '-') {
          result.push({ id: node.id, path: node.path, name: node.name });
        }
      }
      if (node.children) {
        result.push(...getValidMenus(node.children));
      }
    });
    return result;
  };

  const fetchAccounts = async (appCode: string) => {
    try {
      const res = await performanceApi.accountList({
        appCode,
        currentPage: 1,
        pageSize: 999,
        accountTitle: '',
        baseUrl: '',
      });
      if (res && (res as any).data && (res as any).data.data) {
        setAccountList((res as any).data.data);
      }
    } catch (e) {
      toast.error('获取账号列表失败');
    }
  };

  const openConfigDialog = async (type: 'single' | 'batch', data: any) => {
    setExecutionType(type);
    setCurrentExecutionData(data);
    setConfigForm({
      account: '',
      device: 'desktop',
      categories: ['performance', 'accessibility', 'best-practices', 'seo'],
      locale: 'zh-CN',
    });
    await fetchAccounts(selectedApp);
    setConfigDialogVisible(true);
  };

  const onConfirmExecute = async () => {
    if (!configForm.account) {
      toast.error('请选择执行账号');
      return;
    }
    setExecuting(true);
    try {
      let menuDatas: any[] = [];
      if (executionType === 'single') {
        menuDatas = [{
          id: currentExecutionData.id,
          path: currentExecutionData.path,
          name: currentExecutionData.name,
        }];
      } else {
        menuDatas = getValidMenus(tableData);
      }

      const selectedAccount = accountList.find(a => a.id === configForm.account);

      const requestData = {
        configuration_id: 10086,
        menu_datas: menuDatas,
        device: configForm.device,
        categories: configForm.categories,
        locale: configForm.locale,
        status: "pending",
        error_message: "",
        report_path: "",
        account_features: selectedAccount?.accountFeatures,
        app_code: selectedApp,
        task_type: "WEB",
        alarm_features: null,
      };

      const res: any = await performanceApi.createBatch(requestData);
      if (res && res.code === 200) {
        toast.success(executionType === 'single' ? '任务创建成功' : `批量任务创建成功，共 ${menuDatas.length} 个`);
        setConfigDialogVisible(false);
        setSelectedRows(new Set());
      } else {
        toast.error(res?.message || '任务创建失败');
      }
    } catch (e) {
      toast.error('执行失败');
    } finally {
      setExecuting(false);
    }
  };

  const getScoreBadge = (score: number | string) => {
    if (score === '-') return <span className="text-gray-400">-</span>;
    const val = Number(score);
    let style = "bg-red-100 text-red-700";
    if (val >= 90) style = "bg-green-100 text-green-700";
    else if (val >= 50) style = "bg-amber-100 text-amber-800";

    return (
      <Badge variant="outline" className={cn("font-mono border-none", style)}>
        {val}
      </Badge>
    );
  };

  const renderRows = (nodes: MenuNode[], depth = 0) => {
    return nodes.map((node) => (
      <Fragment key={node.id}>
        <TableRow className={cn(depth > 0 && "bg-gray-50/30")}>
          <TableCell className="w-[50px] pl-6">
            <Checkbox
              checked={selectedRows.has(node.id)}
              onCheckedChange={(checked) => handleRowSelect(node.id, !!checked)}
            />
          </TableCell>
          <TableCell className="min-w-[200px]" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
            <div className="flex items-center gap-2">
              {node.children && node.children.length > 0 ? (
                <button
                  onClick={() => toggleRow(node.id)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {expandedRows.has(node.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <span className="font-medium text-gray-900">{node.name}</span>
            </div>
          </TableCell>
          <TableCell className="w-[100px] text-xs font-mono text-gray-500">{node.id}</TableCell>
          <TableCell className="max-w-[300px] truncate text-xs text-gray-500" title={node.path}>{node.path || '-'}</TableCell>
          <TableCell>{getScoreBadge(node.performance || '-')}</TableCell>
          <TableCell>{getScoreBadge(node.accessibility || '-')}</TableCell>
          <TableCell>{getScoreBadge(node.best_practice || '-')}</TableCell>
          <TableCell>{getScoreBadge(node.seo || '-')}</TableCell>
          <TableCell>
            <Badge variant="outline" className={node.isActive === 1 ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}>
              {node.isActive === 1 ? '启用' : '禁用'}
            </Badge>
          </TableCell>
          <TableCell className="text-right pr-6 space-x-1">
            {node.path && node.path !== '-' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedMenuId(node.id);
                    setDrawerVisible(true);
                  }}
                >
                  <Info className="w-3.5 h-3.5 mr-1" />
                  详情
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => openConfigDialog('single', node)}
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  执行
                </Button>
              </>
            )}
          </TableCell>
        </TableRow>
        {node.children && expandedRows.has(node.id) && renderRows(node.children, depth + 1)}
      </Fragment>
    ));
  };

  return (
    <div className="flex h-full gap-5">
      {/* 左侧应用列表 */}
      <aside className="w-48 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-900">应用列表</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {APP_OPTIONS.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedApp(key)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 flex items-center justify-between group",
                selectedApp === key
                  ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {key}
              {selectedApp === key && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200" />}
            </button>
          ))}
        </div>
      </aside>

      {/* 右侧主内容 */}
      <div className="flex-1 min-w-0 flex flex-col space-y-4">
        {/* 查询表单 */}
        <form
          className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); queryMenuList(); }}
        >
          <div className="flex-1 flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-500">菜单名称</Label>
              <Input
                className="h-9 w-44"
                placeholder="请输入"
                value={filters.name}
                onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500">路径</Label>
              <Input
                className="h-9 w-52"
                placeholder="请输入"
                value={filters.path}
                onChange={(e) => setFilters(f => ({ ...f, path: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500">状态</Label>
              <Select
                value={filters.isActive}
                onValueChange={(v) => setFilters(f => ({ ...f, isActive: v }))}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
            <Button type="submit" disabled={loading} className="px-6 shadow-sm">查询</Button>
            <Button type="button" variant="outline" onClick={onReset} className="px-6">重置</Button>
          </div>
        </form>

        {/* 表格区 */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-semibold text-gray-900">性能诊断列表</h2>
              <a
                href="https://developer.chrome.com/docs/lighthouse/performance/performance-scoring?hl=zh-cn"
                target="_blank"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 group"
              >
                <Share2 className="w-3 h-3 transition-transform group-hover:scale-110" />
                Lighthouse 评分规则
              </a>
            </div>
            <Button
              disabled={selectedRows.size === 0}
              onClick={() => openConfigDialog('batch', null)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              批量执行 ({selectedRows.size})
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow className="hover:bg-gray-50 border-b border-gray-100">
                  <TableHead className="w-[50px] pl-6">
                    <Checkbox
                      checked={tableData.length > 0 && selectedRows.size === (function count(nodes: MenuNode[]): number {
                        return nodes.reduce((acc, node) => acc + 1 + (node.children ? count(node.children) : 0), 0);
                      })(tableData)}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">菜单名称</TableHead>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="min-w-[250px]">路径</TableHead>
                  <TableHead>性能</TableHead>
                  <TableHead>无障碍</TableHead>
                  <TableHead>最佳实践</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right pr-6 min-w-[160px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-gray-50 rounded-full">
                          <Info className="w-6 h-6 text-gray-300" />
                        </div>
                        <span className="text-sm font-medium">暂无数据</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : renderRows(tableData)}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 详情 */}
      <DiagnosisDetail
        visible={drawerVisible}
        onOpenChange={setDrawerVisible}
        menuId={selectedMenuId}
      />

      {/* 执行配置弹窗 */}
      <Dialog open={configDialogVisible} onOpenChange={setConfigDialogVisible}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>性能测试执行配置</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-gray-500">应用</Label>
              <Input disabled value={selectedApp} className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">账号</Label>
              <Select
                value={configForm.account}
                onValueChange={(v) => setConfigForm(f => ({ ...f, account: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择账号" />
                </SelectTrigger>
                <SelectContent>
                  {accountList.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.accountTitle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>设备</Label>
              <RadioGroup
                value={configForm.device}
                onValueChange={(v) => setConfigForm(f => ({ ...f, device: v }))}
                className="flex gap-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="desktop" id="desktop" />
                  <Label htmlFor="desktop" className="font-normal">桌面端</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mobile" id="mobile" />
                  <Label htmlFor="mobile" className="font-normal">移动端</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>测试类别</Label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { id: 'performance', label: '性能' },
                  { id: 'accessibility', label: '无障碍功能' },
                  { id: 'best-practices', label: '最佳实践' },
                  { id: 'seo', label: 'SEO' },
                ].map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={cat.id}
                      checked={configForm.categories.includes(cat.id)}
                      onCheckedChange={(checked) => {
                        const newCats = !!checked
                          ? [...configForm.categories, cat.id]
                          : configForm.categories.filter(c => c !== cat.id);
                        setConfigForm(f => ({ ...f, categories: newCats }));
                      }}
                    />
                    <Label htmlFor={cat.id} className="font-normal truncate">{cat.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>语言</Label>
              <RadioGroup
                value={configForm.locale}
                onValueChange={(v) => setConfigForm(f => ({ ...f, locale: v }))}
                className="flex gap-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zh-CN" id="zh-CN" />
                  <Label htmlFor="zh-CN" className="font-normal">中文</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en-US" id="en-US" />
                  <Label htmlFor="en-US" className="font-normal">英文</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogVisible(false)}>取消</Button>
            <Button onClick={onConfirmExecute} disabled={executing}>
              {executing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  提交中...
                </>
              ) : (
                executionType === 'single' ? '立即执行' : '确认批量执行'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
