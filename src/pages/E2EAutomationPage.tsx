/**
 * 自动化用例页面
 * 空间列表页面
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Star, MoreVertical, Folder, Pencil, Users, Activity, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { E2ESpaceDetailPage } from './E2ESpaceDetailPage';
import { PublicNodesManagementView } from '@/components/features/e2e-space/components';
import WorkflowDesignPageV2 from '@/components/features/WorkflowDesignPageV2';
import { e2eSpaceService, E2ESpace } from '@/services/e2e-space';
import { projectManagementService } from '@/services/project-management';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

type E2EViewMode = 'space-list' | 'public-nodes';

export function E2EAutomationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const directWorkflowId = searchParams.get('id') ?? undefined;
  const directProjectId = searchParams.get('projectId') ?? undefined;
  const isDirectWorkflowCanvas = Boolean(directWorkflowId && directProjectId);

  const [viewMode, setViewMode] = useState<E2EViewMode>('space-list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<E2ESpace | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<E2ESpace | null>(null);
  const [spaces, setSpaces] = useState<E2ESpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<E2ESpace | null>(null);
  const [newSpaceForm, setNewSpaceForm] = useState({
    name: '',
    description: '',
    responsiblePerson: '',
    icon: '📁',
    iconColor: 'bg-gray-100',
  });
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [responsiblePersonInput, setResponsiblePersonInput] = useState('');
  const [userNameMap, setUserNameMap] = useState<Map<string, string>>(new Map());

  // 加载空间列表
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        setLoading(true);
        const projectId = localStorage.getItem('currentProjectId');
        if (!projectId) {
          setSpaces([]);
          return;
        }
        const spaceList = await e2eSpaceService.getSpaceList({ projectId });
        setSpaces(spaceList || []);

        // 收集需要查询用户名称的用户ID（responsiblePerson是数字ID的情况）
        const userIds = new Set<string>();
        spaceList.forEach(space => {
          if (space.responsiblePerson && /^\d+$/.test(space.responsiblePerson)) {
            // 如果是纯数字，说明是用户ID，需要查询名称
            userIds.add(space.responsiblePerson);
          }
        });

        // 如果有需要查询的用户ID，批量查询用户名称
        if (userIds.size > 0) {
          try {
            const members = await projectManagementService.getProjectMemberOptions(projectId);
            const nameMap = new Map<string, string>();
            members.forEach(member => {
              nameMap.set(member.id, member.name);
            });
            setUserNameMap(nameMap);
          } catch (error) {
            console.error('加载用户名称映射失败:', error);
          }
        }
      } catch (error) {
        console.error('加载空间列表失败:', error);
        toast.error('加载空间列表失败，请稍后重试');
        setSpaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadSpaces();
  }, []);

  // 加载项目成员列表（当打开创建或编辑对话框时）
  useEffect(() => {
    const loadProjectMembers = async () => {
      if (isCreateDialogOpen || isEditDialogOpen) {
        try {
          setLoadingMembers(true);
          const projectId = localStorage.getItem('currentProjectId');
          if (projectId) {
            const members = await projectManagementService.getProjectMemberOptions(projectId);
            setProjectMembers(members || []);
          }
        } catch (error) {
          console.error('加载项目成员列表失败:', error);
          setProjectMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      }
    };

    loadProjectMembers();
  }, [isCreateDialogOpen, isEditDialogOpen]);

  // 点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.responsible-person-input-container')) {
        setMemberSearchOpen(false);
      }
    };

    if (memberSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [memberSearchOpen]);

  const filteredSpaces = spaces.filter((space) =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (space.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpaces = spaces.length;
  const totalTests = spaces.reduce((sum, s) => sum + (s.testCaseCount || 0), 0);
  const avgPassRate = spaces.length > 0 ? spaces.reduce((sum, s) => sum + (s.passRate || 0), 0) / spaces.length : 0;
  // 参与成员数：统计所有空间的负责人（去重）
  const totalMembers = new Set(spaces.map(s => s.responsiblePerson).filter(Boolean)).size;

  const getStatusBadge = (status: E2ESpace['status']) => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center justify-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">运行正常</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">有失败</span>
          </div>
        );
      case 'not-run':
        return (
          <div className="flex items-center justify-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">未运行</span>
          </div>
        );
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 95) return 'bg-green-500';
    if (rate >= 85) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const handleBackFromDirectWorkflow = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('id');
    params.delete('projectId');
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  // URL 带 id + projectId 时直接进入工作流画布详情（如从子节点「在新标签打开画布」进入）
  if (isDirectWorkflowCanvas) {
    return (
      <div className="flex-1 w-full h-full flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleBackFromDirectWorkflow}>
            <ArrowLeft className="w-4 h-4" />
            返回 自动化用例
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <WorkflowDesignPageV2
            workflowId={directWorkflowId}
            projectId={directProjectId}
          />
        </div>
      </div>
    );
  }

  // 公共节点管理视图
  if (viewMode === 'public-nodes') {
    return (
      <PublicNodesManagementView
        onBack={() => setViewMode('space-list')}
      />
    );
  }

  // 如果选择了空间，显示空间详情
  if (selectedSpace) {
    return (
      <E2ESpaceDetailPage
        space={selectedSpace}
        onBack={() => setSelectedSpace(null)}
      />
    );
  }

  // 显示空间列表
  return (
    <div className="flex-1 w-full h-full flex flex-col bg-gray-50 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">自动化用例</h1>
            <p className="text-sm text-gray-500 mt-1">按微服务应用管理自动化测试用例</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setViewMode('public-nodes')}
            >
              <Star className="w-4 h-4" />
              公共节点管理
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // TODO: 实现AI创建空间功能
              }}
            >
              <Star className="w-4 h-4" />
              AI 创建空间
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              新建空间
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <Input
              placeholder="搜索空间名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-2 border-gray-300 bg-white focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Folder className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600">总空间数</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalSpaces}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm text-gray-600">总测试数</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalTests}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-sm text-gray-600">平均通过率</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{avgPassRate.toFixed(0)}%</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-sm text-gray-600">参与成员</div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spaces Table */}
      <div className="flex-1 overflow-auto bg-white p-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">空间名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>负责人</TableHead>
              <TableHead className="text-center">测试用例</TableHead>
              <TableHead className="text-center">模块数</TableHead>
              <TableHead className="text-center">通过率</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead>最后运行</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500">加载中...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSpaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Folder className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {searchTerm ? '没有找到匹配的空间' : '暂无空间'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm 
                          ? '请尝试其他搜索关键词' 
                          : '创建您的第一个自动化用例空间，开始管理微服务应用的自动化测试用例'}
                      </p>
                      {!searchTerm && (
                        <Button 
                          size="sm" 
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                          新建空间
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSpaces.map((space) => (
                <TableRow
                  key={space.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedSpace(space)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${space.iconColor} rounded-lg flex items-center justify-center text-xl`}>
                        {space.icon}
                      </div>
                      <span className="font-medium text-gray-900">{space.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{space.description}</TableCell>
                  <TableCell>
                    {space.responsiblePerson && /^\d+$/.test(space.responsiblePerson)
                      ? (userNameMap.get(space.responsiblePerson) || space.responsiblePerson)
                      : space.responsiblePerson || '-'}
                  </TableCell>
                  <TableCell className="text-center">{space.testCaseCount}</TableCell>
                  <TableCell className="text-center">{space.moduleCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-sm font-medium">{space.passRate != null ? `${space.passRate}%` : '0%'}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getPassRateColor(space.passRate || 0)}`}
                          style={{ width: `${Math.min(space.passRate || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(space.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{space.lastRun}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedSpace(space)}>查看详情</DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSpaceToEdit(space);
                            // 填充表单数据
                            setNewSpaceForm({
                              name: space.name,
                              description: space.description || '',
                              responsiblePerson: space.responsiblePerson || '',
                              icon: space.icon || '📁',
                              iconColor: space.iconColor || 'bg-gray-100',
                            });
                            // 设置负责人输入框显示名称
                            if (space.responsiblePerson) {
                              if (/^\d+$/.test(space.responsiblePerson)) {
                                // 如果是用户ID，从userNameMap获取名称
                                const name = userNameMap.get(space.responsiblePerson);
                                setResponsiblePersonInput(name || space.responsiblePerson);
                              } else {
                                // 如果已经是名称，直接使用
                                setResponsiblePersonInput(space.responsiblePerson);
                              }
                            } else {
                              setResponsiblePersonInput('');
                            }
                            setIsEditDialogOpen(true);
                          }}
                        >
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const copiedSpace = await e2eSpaceService.copySpace(space.id);
                              setSpaces([...spaces, copiedSpace]);
                              toast.success('空间复制成功');
                            } catch (error) {
                              console.error('复制空间失败:', error);
                              toast.error('复制空间失败');
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          复制
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setSpaceToDelete(space);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Space Dialog */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSpaceToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除空间</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除空间 <span className="font-semibold text-gray-900">"{spaceToDelete?.name}"</span> 吗？此操作将同时删除该空间下的所有模块和测试用例，且不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!spaceToDelete) return;
                try {
                  setLoading(true);
                  await e2eSpaceService.deleteSpace(spaceToDelete.id);
                  setSpaces(spaces.filter((s: E2ESpace) => s.id !== spaceToDelete.id));
                  toast.success('空间删除成功');
                  // 如果删除的是当前选中的空间，清除选中状态
                  if (selectedSpace && (selectedSpace as E2ESpace).id === spaceToDelete.id) {
                    setSelectedSpace(null);
                  }
                  setDeleteDialogOpen(false);
                  setSpaceToDelete(null);
                } catch (error) {
                  console.error('删除空间失败:', error);
                  toast.error('删除空间失败');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Space Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // 清空输入框的选中状态
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSpaceToEdit(null);
          setNewSpaceForm({
            name: '',
            description: '',
            responsiblePerson: '',
            icon: '📁',
            iconColor: 'bg-gray-100',
          });
          setResponsiblePersonInput('');
          setMemberSearchOpen(false);
        }
      }}>
        <DialogContent 
          className="sm:max-w-[550px]"
          onOpenAutoFocus={(e) => {
            // 阻止自动聚焦到第一个输入框，避免文本被选中
            e.preventDefault();
          }}
        >
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">{isEditDialogOpen ? '编辑空间' : '新建空间'}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              {isEditDialogOpen 
                ? '编辑自动化用例空间信息'
                : '创建一个新的自动化用例空间，用于管理微服务应用的自动化测试用例'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2.5">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                空间名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="请输入空间名称"
                value={newSpaceForm.name}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, name: e.target.value })}
                className="h-10 border-2 border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                描述
              </Label>
              <Textarea
                id="description"
                placeholder="请输入空间描述"
                value={newSpaceForm.description}
                onChange={(e) => setNewSpaceForm({ ...newSpaceForm, description: e.target.value })}
                rows={3}
                className="resize-none border-2 border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="responsiblePerson" className="text-sm font-medium text-gray-700">
                负责人 <span className="text-red-500">*</span>
              </Label>
              <div className="relative responsible-person-input-container">
                <Input
                  id="responsiblePerson"
                  placeholder={loadingMembers ? "加载中..." : projectMembers.length === 0 ? "暂无成员" : "请输入或搜索负责人姓名"}
                  value={responsiblePersonInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setResponsiblePersonInput(value);
                    setMemberSearchOpen(true);
                    // 实时搜索匹配
                    const matchedMember = projectMembers.find(m => 
                      m.name.toLowerCase() === value.toLowerCase()
                    );
                    if (matchedMember) {
                      setNewSpaceForm({ ...newSpaceForm, responsiblePerson: matchedMember.id });
                    } else if (!value) {
                      setNewSpaceForm({ ...newSpaceForm, responsiblePerson: '' });
                    }
                  }}
                  onFocus={() => {
                    if (projectMembers.length > 0) {
                      setMemberSearchOpen(true);
                    }
                  }}
                  disabled={loadingMembers || projectMembers.length === 0}
                  className="h-10 border-2 border-gray-300 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 bg-white"
                />
                {memberSearchOpen && projectMembers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                    {projectMembers
                      .filter((member) => 
                        !responsiblePersonInput || 
                        member.name.toLowerCase().includes(responsiblePersonInput.toLowerCase())
                      )
                      .slice(0, responsiblePersonInput ? undefined : 5)
                      .map((member) => (
                        <div
                          key={member.id}
                          onClick={() => {
                            setResponsiblePersonInput(member.name);
                            setNewSpaceForm({ ...newSpaceForm, responsiblePerson: member.id });
                            setMemberSearchOpen(false);
                          }}
                          className={cn(
                            "px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm",
                            newSpaceForm.responsiblePerson === member.id && "bg-blue-50"
                          )}
                        >
                          {member.name}
                        </div>
                      ))}
                    {!responsiblePersonInput && projectMembers.length > 5 && (
                      <div className="px-3 py-2 text-xs text-gray-500 text-center border-t bg-gray-50">
                        显示前 5 个，共 {projectMembers.length} 个成员，请输入关键词搜索更多
                      </div>
                    )}
                    {responsiblePersonInput && projectMembers.filter((member) => 
                      member.name.toLowerCase().includes(responsiblePersonInput.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        未找到匹配的成员
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                // 清空输入框的选中状态
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSpaceToEdit(null);
                setNewSpaceForm({
                  name: '',
                  description: '',
                  responsiblePerson: '',
                  icon: '📁',
                  iconColor: 'bg-gray-100',
                });
                setResponsiblePersonInput('');
                setMemberSearchOpen(false);
              }}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!newSpaceForm.name.trim() || !newSpaceForm.responsiblePerson) {
                  toast.error('请填写必填项：空间名称和负责人');
                  return;
                }

                try {
                  setLoading(true);
                  
                  if (isEditDialogOpen && spaceToEdit) {
                    const editingSpace: E2ESpace = spaceToEdit;
                    // 编辑模式：更新空间
                    const updatedSpace = await e2eSpaceService.updateSpace({
                      id: editingSpace.id,
                      name: newSpaceForm.name.trim(),
                      description: newSpaceForm.description.trim() || undefined,
                      responsiblePerson: newSpaceForm.responsiblePerson,
                      icon: newSpaceForm.icon,
                      iconColor: newSpaceForm.iconColor,
                    });
                    
                    // 更新空间列表
                    setSpaces(spaces.map((s: E2ESpace) => s.id === editingSpace.id ? updatedSpace : s));
                    
                    // 如果当前选中的是正在编辑的空间，更新选中状态（断言 selectedSpace 因前文 return 被收窄为 null，此处需比较时仍可能非空）
                    const currentSelected = selectedSpace as E2ESpace | null;
                    if (currentSelected && currentSelected.id === editingSpace.id) {
                      setSelectedSpace(updatedSpace);
                    }
                    
                    toast.success('空间更新成功');
                    
                    // 清空输入框的选中状态
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    
                    // 关闭对话框并重置表单
                    setIsEditDialogOpen(false);
                    setSpaceToEdit(null);
                    setNewSpaceForm({
                      name: '',
                      description: '',
                      responsiblePerson: '',
                      icon: '📁',
                      iconColor: 'bg-gray-100',
                    });
                    setResponsiblePersonInput('');
                    setMemberSearchOpen(false);
                  } else {
                    // 新建模式：创建空间
                    const projectId = localStorage.getItem('currentProjectId');
                    
                    const newSpace = await e2eSpaceService.createSpace({
                      name: newSpaceForm.name.trim(),
                      description: newSpaceForm.description.trim() || undefined,
                      responsiblePerson: newSpaceForm.responsiblePerson,
                      icon: newSpaceForm.icon,
                      iconColor: newSpaceForm.iconColor,
                      projectId: projectId || undefined,
                    });

                    // 将新创建的空间添加到列表中
                    setSpaces([...spaces, newSpace]);
                    
                    toast.success('空间创建成功');
                    
                    // 清空输入框的选中状态
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    
                    // 重置表单
                    setNewSpaceForm({
                      name: '',
                      description: '',
                      responsiblePerson: '',
                      icon: '📁',
                      iconColor: 'bg-gray-100',
                    });
                    setResponsiblePersonInput('');
                    setMemberSearchOpen(false);
                    
                    // 关闭对话框并进入详情页面
                    setIsCreateDialogOpen(false);
                    setSelectedSpace(newSpace);
                  }
                } catch (error: any) {
                  console.error(isEditDialogOpen ? '更新空间失败:' : '创建空间失败:', error);
                  toast.error(error.message || (isEditDialogOpen ? '更新空间失败，请重试' : '创建空间失败，请重试'));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!newSpaceForm.name.trim() || !newSpaceForm.responsiblePerson || !responsiblePersonInput.trim() || loading}
            >
              {loading 
                ? (isEditDialogOpen ? '更新中...' : '创建中...') 
                : (isEditDialogOpen ? '保存' : '创建并进入')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

