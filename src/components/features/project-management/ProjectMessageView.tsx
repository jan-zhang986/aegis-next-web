/**
 * 项目管理-消息通知
 * 逻辑与交互参考 spotter-metersphere：消息列表 DTO、补全 projectRobotConfigMap、保存完整参数、接收人必填
 */
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import {
    Bell,
    MessageSquare,
    Plus,
    Settings,
    Trash2,
    ShieldCheck,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { projectManagementService } from '@/services/project-management';
import type { Robot, MessageItem, MessageTask, MessageReceiver, RobotConfig, RobotPlatform, DingTalkType } from '@/types/projectManagement';

interface ProjectMessageViewProps {
    projectId: string;
}

const PLATFORM_OPTIONS: { label: string; value: RobotPlatform }[] = [
    { label: '钉钉', value: 'DING_TALK' },
    { label: '飞书', value: 'LARK' },
    { label: '企业微信', value: 'WE_COM' },
    { label: '自定义 Webhook', value: 'CUSTOM' },
    { label: '站内信', value: 'IN_SITE' },
    { label: '邮件', value: 'MAIL' },
];

/** 兼容后端 DTO 字段名（messageTaskTypeDTOList / messageTaskDetailDTOList） */
function normalizeMessageItem(m: any, robots: Robot[]): MessageItem {
    const typeList = m?.messageTaskTypeDTOList ?? m?.messageTaskTypeList ?? [];
    return {
        ...m,
        projectId: m.projectId,
        type: m.type,
        name: m.name,
        messageTaskTypeList: typeList.map((tt: any) => {
            const detailList = tt?.messageTaskDetailDTOList ?? tt?.messageTaskDetailList ?? [];
            return {
                ...tt,
                taskType: tt.taskType,
                taskTypeName: tt.taskTypeName ?? tt.taskType,
                messageTaskDetailList: detailList.map((d: any) => fillRobotConfigMap(d, robots)),
            };
        }),
    };
}

/** 为每一行补全 projectRobotConfigMap：未配置的机器人用首个已配置的模板作为默认（与原项目一致） */
function fillRobotConfigMap(detail: any, robots: Robot[]): MessageTask {
    const map = { ...(detail.projectRobotConfigMap || {}) };
    const firstConfig = Object.values(map)[0] as RobotConfig | undefined;
    robots.forEach(r => {
        if (map[r.id]) return;
        map[r.id] = {
            robotId: r.id,
            robotName: r.name,
            platform: r.platform,
            enable: false,
            template: firstConfig?.template ?? '',
            defaultTemplate: firstConfig?.defaultTemplate ?? '',
            useDefaultTemplate: true,
            subject: firstConfig?.subject ?? '',
            defaultSubject: firstConfig?.defaultSubject ?? '',
            useDefaultSubject: true,
            previewTemplate: firstConfig?.previewTemplate,
            previewSubject: firstConfig?.previewSubject,
        } as RobotConfig;
    });
    return {
        ...detail,
        event: detail.event,
        eventName: detail.eventName ?? detail.event,
        receivers: Array.isArray(detail.receivers) ? detail.receivers : [],
        projectRobotConfigMap: map,
    };
}

export function ProjectMessageView({ projectId }: ProjectMessageViewProps) {
    const [activeTab, setActiveTab] = useState('robots');
    const [robots, setRobots] = useState<Robot[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Robot Modal
    const [robotModalOpen, setRobotModalOpen] = useState(false);
    const [editingRobot, setEditingRobot] = useState<Partial<Robot> | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [robotList, messageList] = await Promise.all([
                projectManagementService.getRobotList(projectId),
                projectManagementService.getMessageList(projectId)
            ]);
            const robotArr = Array.isArray(robotList) ? robotList : [];
            setRobots(robotArr);
            const rawMessages = Array.isArray(messageList) ? messageList : (messageList as any)?.list ?? [];
            setMessages(rawMessages.map((m: any) => normalizeMessageItem(m, robotArr)));
        } catch (e) {
            toast.error('加载消息配置失败');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Robot Operations ---

    const handleOpenRobotModal = (robot?: Robot) => {
        setEditingRobot(robot || {
            name: '',
            platform: 'DING_TALK',
            type: 'CUSTOM',
            webhook: '',
            enable: true,
            projectId,
            description: '',
        });
        setRobotModalOpen(true);
    };

    const handleSaveRobot = async () => {
        if (!editingRobot?.name) {
            toast.error('请填写名称');
            return;
        }
        const needWebhook = editingRobot.platform && !['IN_SITE', 'MAIL'].includes(editingRobot.platform);
        if (needWebhook && !editingRobot?.webhook) {
            toast.error('请填写 Webhook');
            return;
        }
        if (editingRobot.platform === 'DING_TALK' && editingRobot.type === 'ENTERPRISE') {
            if (!editingRobot.appKey || !editingRobot.appSecret) {
                toast.error('企业钉钉请填写 AppKey 和 AppSecret');
                return;
            }
        }
        setSubmitting(true);
        try {
            const payload: any = {
                ...editingRobot,
                name: editingRobot.name,
                platform: editingRobot.platform,
                webhook: editingRobot.webhook ?? '',
                enable: editingRobot.enable ?? true,
                description: editingRobot.description ?? '',
            };
            if (editingRobot.platform === 'DING_TALK') {
                payload.type = editingRobot.type ?? 'CUSTOM';
                if (payload.type === 'ENTERPRISE') {
                    payload.appKey = editingRobot.appKey;
                    payload.appSecret = editingRobot.appSecret;
                } else {
                    payload.appSecret = editingRobot.appSecret ?? '';
                }
            }
            if (editingRobot.id) {
                await projectManagementService.updateRobot(payload);
                toast.success('更新成功');
            } else {
                await projectManagementService.addRobot(payload);
                toast.success('添加成功');
            }
            setRobotModalOpen(false);
            loadData();
        } catch (e) {
            toast.error('操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRobot = async (id: string) => {
        try {
            await projectManagementService.deleteRobot(id);
            toast.success('删除成功');
            loadData();
        } catch (e) {
            toast.error('删除失败');
        }
    };

    const handleToggleRobot = async (id: string) => {
        try {
            await projectManagementService.toggleRobot(id);
            setRobots(prev => prev.map(r => r.id === id ? { ...r, enable: !r.enable } : r));
        } catch (e) {
            toast.error('操作失败');
        }
    };

    // --- Message Config Operations（与原项目一致：保存时传完整参数，含 receiverIds；开启前需已设接收人）---

    const handleToggleEvent = async (taskType: string, event: string, robotId: string, enabled: boolean) => {
        const task = findTask(messages, taskType, event);
        if (!task) return;
        const receiverIds = (task.receivers ?? []).map((r: MessageReceiver) => (r as any).id ?? r);
        if (enabled && receiverIds.length === 0) {
            toast.warning('请先设置接收人后再开启该机器人的通知');
            return;
        }
        const config = task.projectRobotConfigMap?.[robotId];
        const payload: any = {
            projectId,
            taskType,
            event,
            robotId,
            receiverIds,
            enable: enabled,
        };
        if (config) {
            Object.assign(payload, {
                template: config.template ?? config.defaultTemplate ?? '',
                defaultTemplate: config.defaultTemplate ?? '',
                useDefaultTemplate: config.useDefaultTemplate ?? true,
                subject: config.subject ?? config.defaultSubject ?? '',
                defaultSubject: config.defaultSubject ?? '',
                useDefaultSubject: config.useDefaultSubject ?? true,
            });
        }
        try {
            await projectManagementService.saveMessageConfig(payload);
            toast.success(enabled ? '已订阅' : '已取消订阅');
            setMessages(prev => (prev ?? []).map(m => {
                const newTypeList = (m.messageTaskTypeList ?? []).map(tt => {
                    if (tt.taskType === taskType) {
                        const newDetailList = (tt.messageTaskDetailList ?? []).map(td => {
                            if (td.event === event) {
                                const newConfigMap = { ...td.projectRobotConfigMap };
                                if (newConfigMap[robotId]) {
                                    newConfigMap[robotId] = { ...newConfigMap[robotId], enable: enabled };
                                }
                                return { ...td, projectRobotConfigMap: newConfigMap };
                            }
                            return td;
                        });
                        return { ...tt, messageTaskDetailList: newDetailList };
                    }
                    return tt;
                });
                return { ...m, messageTaskTypeList: newTypeList };
            }));
        } catch (e) {
            toast.error('保存失败');
        }
    };

    const findTask = (list: MessageItem[], taskType: string, event: string): MessageTask | null => {
        for (const m of list ?? []) {
            for (const tt of m.messageTaskTypeList ?? []) {
                if (tt.taskType !== taskType) continue;
                const found = (tt.messageTaskDetailList ?? []).find(td => td.event === event);
                if (found) return found;
            }
        }
        return null;
    };

    const [receiverOptions, setReceiverOptions] = useState<MessageReceiver[]>([]);
    const [receiverPopoverOpen, setReceiverPopoverOpen] = useState<{ taskType: string; event: string } | null>(null);
    const [receiverDraft, setReceiverDraft] = useState<string[]>([]);
    /** 模板弹窗：预览或编辑 */
    const [templateDialog, setTemplateDialog] = useState<null | {
        taskType: string; event: string; eventName: string; robotId: string; robotName: string; mode: 'preview' | 'edit';
    }>(null);
    const [templateDetail, setTemplateDetail] = useState<any>(null);
    const [templateEditSubject, setTemplateEditSubject] = useState('');
    const [templateEditBody, setTemplateEditBody] = useState('');
    const [templateLoading, setTemplateLoading] = useState(false);
    const [templateSaving, setTemplateSaving] = useState(false);
    /** 通知设置：各模块展开/收起，key 为 module.type，true 展开 / false 收起，默认收起 */
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    useEffect(() => {
        if (!projectId) return;
        projectManagementService.getMessageUserList(projectId, '').then((list: any) => {
            setReceiverOptions(Array.isArray(list) ? list : []);
        }).catch(() => setReceiverOptions([]));
    }, [projectId]);

    // 打开模板预览/编辑时拉取详情
    useEffect(() => {
        if (!templateDialog || !projectId) return;
        setTemplateLoading(true);
        projectManagementService.getMessageDetail({
            projectId,
            taskType: templateDialog.taskType,
            event: templateDialog.event,
            robotId: templateDialog.robotId,
        }).then((data: any) => {
            setTemplateDetail(data);
            setTemplateEditSubject(data?.subject ?? data?.defaultSubject ?? '');
            setTemplateEditBody(data?.template ?? data?.defaultTemplate ?? '');
        }).catch(() => {
            toast.error('加载模板失败');
            setTemplateDetail(null);
        }).finally(() => setTemplateLoading(false));
    }, [templateDialog, projectId]);

    const handleOpenTemplate = (taskType: string, event: string, eventName: string, task: MessageTask, mode: 'preview' | 'edit') => {
        const firstEnabledRobotId = task.projectRobotConfigMap && Object.keys(task.projectRobotConfigMap).find(
            rid => task.projectRobotConfigMap![rid]?.enable
        );
        const robotId = firstEnabledRobotId ?? robots.find(r => r.enable)?.id ?? robots[0]?.id;
        if (!robotId) {
            toast.warning('请先为该事件订阅至少一个机器人');
            return;
        }
        const robotName = robots.find(r => r.id === robotId)?.name ?? '';
        setTemplateDialog({ taskType, event, eventName, robotId, robotName, mode });
    };

    const handleSaveTemplate = async () => {
        if (!templateDialog || !templateDetail) return;
        const task = findTask(messages, templateDialog.taskType, templateDialog.event);
        const config = task?.projectRobotConfigMap?.[templateDialog.robotId];
        const receiverIds = (task?.receivers ?? []).map((r: MessageReceiver) => (r as any).id ?? r.id);
        setTemplateSaving(true);
        try {
            await projectManagementService.saveMessageConfig({
                projectId,
                taskType: templateDialog.taskType,
                event: templateDialog.event,
                robotId: templateDialog.robotId,
                receiverIds,
                enable: config?.enable ?? false,
                subject: templateEditSubject,
                template: templateEditBody,
                defaultSubject: templateDetail.defaultSubject ?? '',
                defaultTemplate: templateDetail.defaultTemplate ?? '',
                useDefaultSubject: false,
                useDefaultTemplate: false,
            });
            toast.success('模板已保存');
            setTemplateDialog(null);
            loadData();
        } catch (e) {
            toast.error('保存失败');
        } finally {
            setTemplateSaving(false);
        }
    };

    const handleReceiversChange = async (
        taskType: string,
        event: string,
        robotId: string,
        receiverIds: string[],
        task: MessageTask
    ) => {
        const receivers: MessageReceiver[] = receiverIds.map(id => {
            const r = receiverOptions.find(o => (o as any).id === id || o.id === id);
            return r ? { id: (r as any).id ?? r.id, name: (r as any).name ?? r.name } : { id, name: id };
        }).filter(r => r.id);
        const config = task.projectRobotConfigMap?.[robotId];
        const payload: any = {
            projectId,
            taskType,
            event,
            robotId,
            receiverIds,
            enable: config?.enable ?? false,
        };
        if (config) {
            Object.assign(payload, {
                template: config.template ?? config.defaultTemplate ?? '',
                defaultTemplate: config.defaultTemplate ?? '',
                useDefaultTemplate: config.useDefaultTemplate ?? true,
                subject: config.subject ?? config.defaultSubject ?? '',
                defaultSubject: config.defaultSubject ?? '',
                useDefaultSubject: config.useDefaultSubject ?? true,
            });
        }
        try {
            await projectManagementService.saveMessageConfig(payload);
            toast.success('接收人已保存');
            setMessages(prev => (prev ?? []).map(m => {
                const newTypeList = (m.messageTaskTypeList ?? []).map(tt => {
                    if (tt.taskType !== taskType) return tt;
                    return {
                        ...tt,
                        messageTaskDetailList: (tt.messageTaskDetailList ?? []).map(td =>
                            td.event === event ? { ...td, receivers } : td
                        ),
                    };
                });
                return { ...m, messageTaskTypeList: newTypeList };
            }));
        } catch (e) {
            toast.error('保存失败');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 px-1">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100 ring-4 ring-blue-50">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900">消息通知</h2>
                    </div>
                    <p className="text-sm font-medium text-gray-400 mt-2 pl-14">配置项目的 Webhook 机器人及各类关键事件的通知分发规则。</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                <TabsList className="bg-gray-100/80 p-1 rounded-[1.25rem] border border-gray-200/50 backdrop-blur-sm shadow-inner inline-flex h-12">
                    <TabsTrigger
                        value="robots"
                        className="rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:ring-1 data-[state=active]:ring-gray-200 transition-all flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" /> 机器人管理
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:ring-1 data-[state=active]:ring-gray-200 transition-all flex items-center gap-2"
                    >
                        <Bell className="w-4 h-4" /> 通知设置
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="robots" className="space-y-4">
                    <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.04)] rounded-[2rem] bg-white ring-1 ring-gray-100 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-50 bg-gray-50/10">
                            <div className="space-y-1.5">
                                <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Webhook 机器人</CardTitle>
                                <CardDescription className="text-xs font-medium text-gray-400">管理通知分发的输出通道，支持钉钉、飞书等主流平台</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenRobotModal()} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 border-b-4 border-blue-800">
                                <Plus className="w-4 h-4 mr-2" /> 添加机器人
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 h-14">
                                        <TableHead className="pl-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">名称</TableHead>
                                        <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">平台</TableHead>
                                        <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Webhook 地址</TableHead>
                                        <TableHead className="w-24 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">状态</TableHead>
                                        <TableHead className="w-32 text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && robots.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-20 grayscale opacity-40 font-bold text-gray-400 tracking-widest">正在加载机器人列表...</TableCell></TableRow>
                                    ) : robots.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-20 grayscale opacity-40 font-bold text-gray-400 tracking-widest">暂无配置任何 Webhook 机器人</TableCell></TableRow>
                                    ) : (
                                        robots.map((robot) => (
                                            <TableRow key={robot.id} className="group hover:bg-blue-50/20 transition-all border-b border-gray-50 h-16">
                                                <TableCell className="pl-8 font-bold text-gray-900">{robot.name}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                                        {PLATFORM_OPTIONS.find(opt => opt.value === robot.platform)?.label || robot.platform}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate text-gray-500 font-medium text-xs">
                                                    {robot.webhook}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={robot.enable}
                                                        onCheckedChange={() => handleToggleRobot(robot.id)}
                                                        className="data-[state=checked]:bg-blue-600"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpenRobotModal(robot)} className="h-9 px-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 font-bold rounded-xl transition-all">
                                                            <Settings className="w-4 h-4 mr-2" /> 编辑
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all" onClick={() => handleDeleteRobot(robot.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-5">
                    {messages.length === 0 && !loading ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                                <CheckCircle2 className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm">暂无可订阅的事件</p>
                            <p className="text-gray-400 text-xs mt-1">通常在模块启用后显示</p>
                        </div>
                    ) : (
                        messages.map((module) => {
                            const isExpanded = expandedModules[module.type] === true;
                            const eventCount = (module.messageTaskTypeList ?? []).reduce(
                                (sum, tt) => sum + (tt.messageTaskDetailList ?? []).length,
                                0
                            );
                            return (
                                <Card key={module.type} className="overflow-hidden border-none shadow-[0_15px_40px_rgba(0,0,0,0.03)] rounded-[2rem] bg-white ring-1 ring-gray-100">
                                    <CardHeader
                                        className="bg-gray-50/10 py-5 px-8 border-b border-gray-50 cursor-pointer select-none hover:bg-gray-50/50 transition-all duration-300"
                                        onClick={() => setExpandedModules(prev => ({ ...prev, [module.type]: !isExpanded }))}
                                        role="button"
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-500 shadow-sm",
                                                isExpanded ? "bg-blue-600 text-white shadow-blue-200" : "bg-white text-gray-400 ring-1 ring-gray-100"
                                            )}>
                                                <ShieldCheck className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-black text-gray-900 tracking-tight">{module.name}</CardTitle>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                    {isExpanded ? '管理相关事件的通知分发' : `包含 ${eventCount} 个可订阅事件`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isExpanded && eventCount > 0 && (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-black text-[10px] px-2.5 py-1">
                                                        ACTIVE
                                                    </Badge>
                                                )}
                                                <div className={cn("p-1.5 rounded-xl transition-transform duration-300", isExpanded ? "rotate-0 bg-gray-100" : "-rotate-90 bg-transparent")}>
                                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    {isExpanded && (
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-gray-50/30">
                                                        <TableRow className="hover:bg-transparent border-b border-gray-100 h-14">
                                                            <TableHead className="w-64 pl-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                事件名称
                                                            </TableHead>
                                                            <TableHead className="w-64 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                接收人
                                                            </TableHead>
                                                            {(robots.filter(r => r.enable)).map(r => (
                                                                <TableHead key={r.id} className="text-center px-4 min-w-[140px]">
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 leading-none">
                                                                            {PLATFORM_OPTIONS.find(o => o.value === r.platform)?.label}
                                                                        </span>
                                                                        <span className="text-[11px] font-black text-gray-500 truncate max-w-[110px]" title={r.name}>
                                                                            {r.name}
                                                                        </span>
                                                                    </div>
                                                                </TableHead>
                                                            ))}
                                                            <TableHead className="w-28 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                操作
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {(module.messageTaskTypeList ?? []).map(type => (
                                                            (type.messageTaskDetailList ?? []).map((task) => (
                                                                <TableRow
                                                                    key={`${type.taskType}-${task.event}`}
                                                                    className="border-b border-gray-50 last:border-b-0 hover:bg-blue-50/10 transition-all h-16 group/row"
                                                                >
                                                                    <TableCell className="pl-8 text-sm font-bold text-gray-900">
                                                                        {task.eventName}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Popover
                                                                            open={receiverPopoverOpen?.taskType === type.taskType && receiverPopoverOpen?.event === task.event}
                                                                            onOpenChange={(open) => {
                                                                                if (open) {
                                                                                    setReceiverPopoverOpen({ taskType: type.taskType, event: task.event });
                                                                                    setReceiverDraft((task.receivers ?? []).map((r: MessageReceiver) => (r as any).id ?? r.id));
                                                                                } else {
                                                                                    setReceiverPopoverOpen(null);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <PopoverTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-10 px-4 text-xs font-bold bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all w-full justify-start overflow-hidden">
                                                                                    <span className="truncate">
                                                                                        {(task.receivers ?? []).length > 0
                                                                                            ? (task.receivers ?? []).map((r: MessageReceiver) => (r as any).name ?? r.name).join('、')
                                                                                            : <span className="text-gray-300 italic">选择接收人...</span>}
                                                                                    </span>
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-64 p-3 rounded-2xl border-gray-100 shadow-2xl" align="start">
                                                                                <div className="flex flex-col gap-2">
                                                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">可用接收人</div>
                                                                                    <div className="max-h-64 overflow-y-auto space-y-1 py-1 custom-scrollbar">
                                                                                        {receiverOptions.map(rec => {
                                                                                            const id = (rec as any).id ?? rec.id;
                                                                                            const name = (rec as any).name ?? rec.name;
                                                                                            return (
                                                                                                <label key={id} className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-blue-50/50 group/item transition-all">
                                                                                                    <Checkbox
                                                                                                        checked={receiverDraft.includes(id)}
                                                                                                        onCheckedChange={(checked) => {
                                                                                                            setReceiverDraft(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
                                                                                                        }}
                                                                                                        className="rounded-md border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                                                                    />
                                                                                                    <span className="text-sm font-bold text-gray-600 group-hover/item:text-blue-600 transition-colors">{name}</span>
                                                                                                </label>
                                                                                            );
                                                                                        })}
                                                                                        {receiverOptions.length === 0 && (
                                                                                            <div className="py-8 text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">暂无可用账号</div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex gap-2 pt-3 border-t border-gray-50 mt-1">
                                                                                        <Button variant="ghost" size="sm" className="flex-1 h-9 rounded-xl font-bold text-gray-400" onClick={() => setReceiverPopoverOpen(null)}>取消</Button>
                                                                                        <Button size="sm" className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100" onClick={() => {
                                                                                            const firstRobotId = robots.find(r => r.enable)?.id ?? robots[0]?.id;
                                                                                            if (firstRobotId) handleReceiversChange(type.taskType, task.event, firstRobotId, receiverDraft, task);
                                                                                            setReceiverPopoverOpen(null);
                                                                                        }}>确定</Button>
                                                                                    </div>
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    </TableCell>
                                                                    {(robots.filter(r => r.enable)).map(robot => (
                                                                        <TableCell key={robot.id} className="text-center py-3.5 px-4">
                                                                            <div className="flex justify-center">
                                                                                <Checkbox
                                                                                    checked={task.projectRobotConfigMap?.[robot.id]?.enable ?? false}
                                                                                    onCheckedChange={(checked) => handleToggleEvent(type.taskType, task.event, robot.id, !!checked)}
                                                                                    className="rounded-lg w-5 h-5 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all duration-300 scale-110"
                                                                                />
                                                                            </div>
                                                                        </TableCell>
                                                                    ))}
                                                                    <TableCell className="text-center py-3.5 px-2">
                                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-all duration-300">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                                                                                onClick={() => handleOpenTemplate(type.taskType, task.event, task.eventName, task, 'preview')}
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-9 w-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                                                                                onClick={() => handleOpenTemplate(type.taskType, task.event, task.eventName, task, 'edit')}
                                                                            >
                                                                                <Settings className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </TabsContent>
            </Tabs>

            {/* Robot Edit Modal */}
            <Dialog open={robotModalOpen} onOpenChange={setRobotModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingRobot?.id ? '编辑机器人' : '添加机器人'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">名称 <span className="text-red-500">*</span></label>
                            <Input
                                className="col-span-3"
                                value={editingRobot?.name || ''}
                                onChange={e => setEditingRobot(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="例如：钉钉报警机器人"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">平台 <span className="text-red-500">*</span></label>
                            <Select
                                value={editingRobot?.platform || 'DING_TALK'}
                                onValueChange={v => setEditingRobot(prev => ({ ...prev, platform: v as RobotPlatform }))}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLATFORM_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {editingRobot?.platform === 'DING_TALK' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">钉钉类型</label>
                                <Select
                                    value={(editingRobot?.type as DingTalkType) || 'CUSTOM'}
                                    onValueChange={v => setEditingRobot(prev => ({ ...prev, type: v as DingTalkType }))}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CUSTOM">自定义机器人</SelectItem>
                                        <SelectItem value="ENTERPRISE">企业内部机器人</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {editingRobot?.platform && !['IN_SITE', 'MAIL'].includes(editingRobot.platform) && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium pr-1 leading-tight">Webhook <span className="text-red-500">*</span></label>
                                <Input
                                    className="col-span-3"
                                    value={editingRobot?.webhook || ''}
                                    onChange={e => setEditingRobot(prev => ({ ...prev, webhook: e.target.value }))}
                                    placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                                />
                            </div>
                        )}
                        {editingRobot?.platform === 'DING_TALK' && (editingRobot?.type as DingTalkType) === 'ENTERPRISE' && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">AppKey <span className="text-red-500">*</span></label>
                                    <Input
                                        className="col-span-3"
                                        value={editingRobot?.appKey || ''}
                                        onChange={e => setEditingRobot(prev => ({ ...prev, appKey: e.target.value }))}
                                        placeholder="企业钉钉 AppKey"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">AppSecret <span className="text-red-500">*</span></label>
                                    <Input
                                        className="col-span-3"
                                        type="password"
                                        value={editingRobot?.appSecret || ''}
                                        onChange={e => setEditingRobot(prev => ({ ...prev, appSecret: e.target.value }))}
                                        placeholder="企业钉钉 AppSecret"
                                    />
                                </div>
                            </>
                        )}
                        {(editingRobot?.platform === 'DING_TALK' && (editingRobot?.type as DingTalkType) === 'CUSTOM') || editingRobot?.platform === 'CUSTOM' ? (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label className="text-right text-sm font-medium">签名密钥</label>
                                <Input
                                    className="col-span-3"
                                    value={editingRobot?.appSecret || ''}
                                    onChange={e => setEditingRobot(prev => ({ ...prev, appSecret: e.target.value }))}
                                    placeholder="可选，由平台提供的安全密钥"
                                />
                            </div>
                        ) : null}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">描述</label>
                            <Input
                                className="col-span-3"
                                value={editingRobot?.description || ''}
                                onChange={e => setEditingRobot(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-sm font-medium">启用状态</label>
                            <div className="col-span-3 flex items-center">
                                <Switch
                                    checked={editingRobot?.enable ?? true}
                                    onCheckedChange={v => setEditingRobot(prev => ({ ...prev, enable: v }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRobotModalOpen(false)}>取消</Button>
                        <Button onClick={handleSaveRobot} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                            {submitting ? '保存中...' : '确定'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 模板预览/编辑弹窗 */}
            <Dialog open={!!templateDialog} onOpenChange={(open) => !open && setTemplateDialog(null)}>
                <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {templateDialog?.mode === 'preview' ? '消息预览' : '编辑模板'} - {templateDialog?.eventName}
                        </DialogTitle>
                        {templateDialog && (
                            <p className="text-sm text-muted-foreground">机器人：{templateDialog.robotName}</p>
                        )}
                    </DialogHeader>
                    {templateLoading ? (
                        <div className="py-12 text-center text-muted-foreground">加载中...</div>
                    ) : templateDialog?.mode === 'preview' && templateDetail ? (
                        <div className="space-y-4 overflow-auto flex-1 min-h-0">
                            <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">标题</div>
                                <div className="rounded-md border bg-gray-50/50 px-3 py-2 text-sm">
                                    {templateDetail.previewSubject ?? templateDetail.subject ?? templateDetail.defaultSubject ?? '-'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">内容</div>
                                <div className="rounded-md border bg-gray-50/50 px-3 py-2 text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                                    {templateDetail.previewTemplate ?? templateDetail.template ?? templateDetail.defaultTemplate ?? '-'}
                                </div>
                            </div>
                        </div>
                    ) : templateDialog?.mode === 'edit' && templateDetail ? (
                        <div className="space-y-4 overflow-auto flex-1 min-h-0">
                            <div>
                                <label className="text-sm font-medium text-gray-700">标题</label>
                                <Input
                                    className="mt-1"
                                    value={templateEditSubject}
                                    onChange={e => setTemplateEditSubject(e.target.value)}
                                    placeholder="消息标题"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">内容</label>
                                <Textarea
                                    className="mt-1 min-h-[160px] resize-y"
                                    value={templateEditBody}
                                    onChange={e => setTemplateEditBody(e.target.value)}
                                    placeholder="消息内容，支持变量"
                                />
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTemplateDialog(null)}>关闭</Button>
                        {templateDialog?.mode === 'edit' && (
                            <Button onClick={handleSaveTemplate} disabled={templateSaving} className="bg-blue-600 hover:bg-blue-700">
                                {templateSaving ? '保存中...' : '保存'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
