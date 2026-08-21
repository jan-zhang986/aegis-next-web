
import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TruncateWithTooltip } from "@/components/ui/truncate-with-tooltip";
import { toast } from "sonner";
import { testPlanManagementService, qualityWorkspaceService } from "@/services";
import { requirementQualityService } from "@/services/requirement-quality";
import { Loader2, ChevronRight, ChevronDown, X, Check, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
    name: z.string().min(1, "名称不能为空"),
    description: z.string().default(""),
    isGroup: z.enum(["true", "false"]).default("false"),
    groupId: z.string().default(""),
    moduleId: z.string().default(""),
    tags: z.array(z.string()).default([]),
    plannedStartTime: z.number().optional(),
    plannedEndTime: z.number().optional(),
    passThreshold: z.coerce.number().min(0).max(100).default(100),
    repeatCase: z.boolean().default(false),
    automaticStatusUpdate: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTestPlanSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    planId?: string;
    projectId: string;
    onSuccess: () => void;
    moduleTree?: any[]; // define proper type later
    /** 创建时从模块树点击进入，预填所属模块 */
    initialModuleId?: string;
    /** 创建成功后若需跳转详情，传入新建计划 id */
    onCreatedPlanId?: (id: string) => void;
}

export function CreateTestPlanSheet({
    open,
    onOpenChange,
    planId,
    projectId,
    onSuccess,
    moduleTree = [],
    initialModuleId,
    onCreatedPlanId,
}: CreateTestPlanSheetProps) {
    const [loading, setLoading] = useState(false);
    const [groupOptions, setGroupOptions] = useState<any[]>([]);
    const [groupOptionsLoading, setGroupOptionsLoading] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedModuleId, setSelectedModuleId] = useState<string>("");
    /** 飞书需求：仅当创建位置为「业务模块」时可编辑；为「测试计划组」时展示继承自组 */
    const [feishuStoryId, setFeishuStoryId] = useState("");
    const [feishuStoryKeyword, setFeishuStoryKeyword] = useState("");
    const [storyOptions, setStoryOptions] = useState<{ id: string; name: string }[]>([]);
    const [storySearching, setStorySearching] = useState(false);
    const [storyDropdownOpen, setStoryDropdownOpen] = useState(false);
    const storySearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** 计划组关联的飞书需求（只读展示） */
    const [groupFeishuStoryId, setGroupFeishuStoryId] = useState("");
    const [groupFeishuStoryName, setGroupFeishuStoryName] = useState("");
    /** 未关联飞书时的二次确认：暂存的提交参数，确认后执行 */

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            isGroup: "false",
            groupId: "",
            moduleId: "",
            tags: [],
            plannedStartTime: undefined,
            plannedEndTime: undefined,
            passThreshold: 100,
            repeatCase: false,
            automaticStatusUpdate: false,
        },
    });

    const isGroup = form.watch("isGroup") === "true";
    const selectedGroupId = form.watch("groupId");

    const DEFAULT_STORY_LIMIT = 10;

    const searchFeishu = useCallback((keyword: string) => {
        if (storySearchRef.current) clearTimeout(storySearchRef.current);
        if (!keyword.trim()) {
            setStoryOptions([]);
            return;
        }
        storySearchRef.current = setTimeout(() => {
            storySearchRef.current = null;
            setStorySearching(true);
            requirementQualityService.storySearch(keyword.trim()).then((res) => {
                setStoryOptions(Array.isArray(res) ? res : []);
            }).finally(() => setStorySearching(false));
        }, 300);
    }, []);

    /** 聚焦时若输入为空，拉取默认 10 条需求展示在下拉中 */
    const loadDefaultFeishuOptions = useCallback(() => {
        if (storySearching) return;
        setStorySearching(true);
        requirementQualityService.getDefaultStoryOptions().then((res) => {
            const list = Array.isArray(res) ? res : [];
            setStoryOptions(list.slice(0, DEFAULT_STORY_LIMIT));
        }).finally(() => setStorySearching(false));
    }, [storySearching]);

    // 当选择「测试计划组」时拉取该组的飞书需求，并允许手动覆盖
    useEffect(() => {
        if (!open || !isGroup || !selectedGroupId) {
            setGroupFeishuStoryId("");
            setGroupFeishuStoryName("");
            return;
        }
        testPlanManagementService.getTestPlanDetail(selectedGroupId).then((detail) => {
            const fid = detail?.feishuStoryId ?? "";
            setGroupFeishuStoryId(fid);

            // 若当前未选择需求或选择的需求与之前继承的一致，则自动预填新组的需求
            if (fid && (!feishuStoryId || feishuStoryId === groupFeishuStoryId)) {
                setFeishuStoryId(fid);
                requirementQualityService.storySearch(fid).then((results) => {
                    const found = Array.isArray(results) ? results.find((r: { id: string }) => r.id === fid) : undefined;
                    setFeishuStoryKeyword(found ? `${fid} - ${(found as { name: string }).name}` : fid);
                }).catch(() => setFeishuStoryKeyword(fid));
            }

            if (fid) {
                requirementQualityService.storySearch(fid).then((results) => {
                    const found = Array.isArray(results) ? results.find((r: { id: string }) => r.id === fid) : undefined;
                    setGroupFeishuStoryName(found ? (found as { name: string }).name : "");
                }).catch(() => setGroupFeishuStoryName(""));
            } else {
                setGroupFeishuStoryName("");
            }
        }).catch(() => {
            setGroupFeishuStoryId("");
            setGroupFeishuStoryName("");
        });
    }, [open, isGroup, selectedGroupId]);

    // Fetch groups when dialog opens
    useEffect(() => {
        if (open) {
            fetchGroups();
            setFeishuStoryId("");
            setFeishuStoryKeyword("");
            setGroupFeishuStoryId("");
            setGroupFeishuStoryName("");
            if (planId) {
                fetchPlanDetail(planId);
            } else {
                const moduleId = initialModuleId ?? "";
                form.reset({
                    name: "",
                    description: "",
                    isGroup: "false",
                    groupId: "",
                    moduleId,
                    tags: [],
                    plannedStartTime: undefined,
                    plannedEndTime: undefined,
                    passThreshold: 100,
                    repeatCase: false,
                    automaticStatusUpdate: false,
                });
                setSelectedModuleId(moduleId);
            }
        }
    }, [open, planId, initialModuleId]);

    const fetchGroups = async () => {
        setGroupOptionsLoading(true);
        try {
            const res = await testPlanManagementService.getPlanGroupOptions(projectId);
            // 兼容多种返回格式：直接数组、res.list、res.data、res.records 等
            const raw = Array.isArray(res)
                ? res
                : (res as any)?.list ?? (res as any)?.data ?? (res as any)?.records ?? [];
            const list = Array.isArray(raw) ? raw : [];
            // 统一为 { id, name }，兼容 value/label 等字段
            setGroupOptions(
                list.map((item: any) => ({
                    id: item.id ?? item.value ?? item.key ?? '',
                    name: item.name ?? item.label ?? item.text ?? String(item.id ?? item.value ?? ''),
                })).filter((item: { id: string }) => item.id)
            );
        } catch (error) {
            console.error("Failed to fetch groups", error);
            setGroupOptions([]);
        } finally {
            setGroupOptionsLoading(false);
        }
    };

    const fetchPlanDetail = async (id: string) => {
        try {
            const res = await testPlanManagementService.getTestPlanDetail(id);
            const tagsRaw = res.tags;
            const tags = Array.isArray(tagsRaw)
                ? tagsRaw.map((t: string | { id?: string; name?: string }) => (typeof t === "string" ? t : t?.name ?? t?.id ?? "")).filter(Boolean)
                : [];
            form.reset({
                name: res.name ?? "",
                description: res.description ?? "",
                isGroup: res.groupId && res.groupId !== "NONE" ? "true" : "false",
                groupId: res.groupId && res.groupId !== "NONE" ? res.groupId : "",
                moduleId: res.moduleId ?? "",
                tags,
                plannedStartTime: res.plannedStartTime ?? undefined,
                plannedEndTime: res.plannedEndTime ?? undefined,
                passThreshold: res.passThreshold ?? 100,
                repeatCase: Boolean(res.repeatCase),
                automaticStatusUpdate: Boolean(res.automaticStatusUpdate),
            });
            setSelectedModuleId(res.moduleId ?? "");
            const fid = res.feishuStoryId ?? "";
            setFeishuStoryId(fid);
            if (fid) {
                requirementQualityService.storySearch(fid).then((results) => {
                    const found = Array.isArray(results) ? results.find((r: { id: string }) => r.id === fid) : undefined;
                    setFeishuStoryKeyword(found ? `${fid} - ${(found as { name: string }).name}` : fid);
                }).catch(() => setFeishuStoryKeyword(fid));
            } else {
                setFeishuStoryKeyword("");
            }
        } catch (error) {
            console.error("Failed to fetch plan detail", error);
            toast.error("获取计划详情失败");
        }
    };

    // 切换节点展开/收起
    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    // 选择模块
    const handleSelectModule = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        form.setValue("moduleId", moduleId);
    };

    // 递归渲染树节点（选中态与 form 的 moduleId 同步，确保重置/回填时也正确高亮）
    const currentModuleId = form.watch("moduleId");
    const renderTreeNode = (node: any, level: number = 0): JSX.Element => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = currentModuleId === node.id;
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id} className="mb-0.5" style={{ paddingLeft: `${level * 12}px` }}>
                <div
                    onClick={() => {
                        if (hasChildren) {
                            toggleNode(node.id);
                        }
                        handleSelectModule(node.id);
                    }}
                    className={`group flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer transition-colors border-l-2 ${
                        isSelected
                            ? "border-[#165DFF] bg-[#165DFF]/10 text-[#165DFF] font-medium"
                            : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-[#165DFF]"
                    }`}
                >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                            )
                        ) : (
                            <div className="w-3.5 flex-shrink-0" />
                        )}
                        <TruncateWithTooltip className="text-sm flex-1 min-w-0">{node.name}</TruncateWithTooltip>
                        {isSelected && (
                            <Check className="w-4 h-4 flex-shrink-0 text-[#165DFF]" strokeWidth={2.5} />
                        )}
                    </div>
                    {node.count !== undefined && (
                        <span className={`text-[11px] ml-auto font-normal ${isSelected ? "text-[#165DFF]" : "text-gray-400"}`}>
                            {node.count}
                        </span>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="mt-0.5">
                        {node.children.map((child: any) => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const hasFeishuAssociated = !!feishuStoryId;

    const doSubmit = async (values: FormValues, isContinue?: boolean) => {
        setLoading(true);
        try {
            const underParentGroup = values.isGroup === "true" && !!values.groupId;
            const payload: any = {
                name: values.name,
                description: values.description ?? "",
                projectId,
                moduleId: values.moduleId || "root",
                tags: values.tags ?? [],
                passThreshold: values.passThreshold ?? 100,
                repeatCase: Boolean(values.repeatCase),
                automaticStatusUpdate: Boolean(values.automaticStatusUpdate),
                testPlanning: false,
                type: "TEST_PLAN",
                baseAssociateCaseRequest: { selectIds: [], selectAll: false, condition: {} },
                feishuStoryId: feishuStoryId || "",
                plannedStartTime: values.plannedStartTime,
                plannedEndTime: values.plannedEndTime,
                cycle:
                    values.plannedStartTime != null && values.plannedEndTime != null
                        ? [values.plannedStartTime, values.plannedEndTime]
                        : [],
                isGroup: underParentGroup,
            };
            if (underParentGroup && values.groupId) {
                payload.groupId = values.groupId;
            }

            if (planId) {
                // 编辑模式：调用新接口更新
                await qualityWorkspaceService.saveWorkspace({
                    workspaceId: planId,
                    projectId,
                    name: values.name,
                    description: values.description,
                    targetType: feishuStoryId ? "REQUIREMENT" : "RELEASE_BATCH",
                    targetId: feishuStoryId || planId,
                    targetName: feishuStoryId || values.name,
                    plannedStartTime: values.plannedStartTime,
                    plannedEndTime: values.plannedEndTime,
                    tags: values.tags,
                    metadata: { feishuStoryId }
                });
                toast.success("更新成功");
                onSuccess();
                onOpenChange(false);
            } else {
                // 新建模式
                const res = await qualityWorkspaceService.saveWorkspace({
                    projectId,
                    name: values.name,
                    description: values.description,
                    targetType: feishuStoryId ? "REQUIREMENT" : "RELEASE_BATCH",
                    targetId: feishuStoryId || values.name,
                    targetName: feishuStoryId || values.name,
                    plannedStartTime: values.plannedStartTime,
                    plannedEndTime: values.plannedEndTime,
                    tags: values.tags,
                    metadata: { feishuStoryId }
                }) as any;
                
                toast.success("创建成功");
                onSuccess();
                const newId = res?.data || res;
                
                if (isContinue) {
                    form.reset({
                        name: "",
                        description: "",
                        isGroup: values.isGroup,
                        groupId: values.groupId,
                        moduleId: values.moduleId,
                        tags: [],
                        plannedStartTime: undefined,
                        plannedEndTime: undefined,
                        passThreshold: 100,
                        repeatCase: false,
                        automaticStatusUpdate: false,
                    });
                    setFeishuStoryId("");
                    setFeishuStoryKeyword("");
                    setSelectedModuleId(values.moduleId || "");
                } else {
                    if (newId && typeof newId === 'string' && onCreatedPlanId) {
                        onCreatedPlanId(newId);
                    }
                    onOpenChange(false);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("操作失败");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (values: FormValues, isContinue?: boolean) => {
        // 将飞书关联改为非强制，移除原有的强制报错拦截
        await doSubmit(values, isContinue);
    };


    return (
        <>
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] w-full p-0 flex flex-col overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b border-gray-100 shrink-0">
                    <SheetTitle className="text-lg">{planId ? "编辑测试计划" : "创建测试计划"}</SheetTitle>
                    <SheetDescription className="text-xs">
                        {planId ? "请完善测试计划的基本信息" : "填写以下信息创建一个新的测试计划来管理您的测试用例"}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    <Form {...form}>
                        <form id="test-plan-form" onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-6 py-6 pb-20">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[13px] font-semibold text-gray-700">计划名称 <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="请输入方案名称，如：2.4.0 版本发布测试" className="h-9 text-sm w-full" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[13px] font-semibold text-gray-700">描述</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="输入测试计划的具体背景、目标或注意事项..."
                                                className="min-h-[100px] text-sm resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="plannedStartTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                htmlFor="planned-start-time"
                                                className="text-[13px] font-semibold text-gray-700 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('planned-start-time') as HTMLInputElement | null;
                                                    if (input) {
                                                        input.focus();
                                                        if (typeof input.showPicker === 'function') input.showPicker();
                                                    }
                                                }}
                                            >
                                                计划开始时间
                                            </FormLabel>
                                            <FormControl>
                                                <div
                                                    className="flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-[box-shadow,border-color] hover:border-gray-300 hover:bg-gray-50/50 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 focus-within:bg-white cursor-pointer"
                                                    onClick={(e) => {
                                                        const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input');
                                                        if (input) {
                                                            input.focus();
                                                            if (typeof input.showPicker === 'function') input.showPicker();
                                                        }
                                                    }}
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-gray-100 bg-gray-50/80 text-gray-500">
                                                        <Calendar className="h-4 w-4" />
                                                    </span>
                                                    <Input
                                                        id="planned-start-time"
                                                        type="datetime-local"
                                                        className="h-9 flex-1 min-w-0 border-0 bg-transparent py-2 pl-3 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer [color-scheme:light]"
                                                        value={field.value != null ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            field.onChange(v ? new Date(v).getTime() : undefined);
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="plannedEndTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                htmlFor="planned-end-time"
                                                className="text-[13px] font-semibold text-gray-700 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('planned-end-time') as HTMLInputElement | null;
                                                    if (input) {
                                                        input.focus();
                                                        if (typeof input.showPicker === 'function') input.showPicker();
                                                    }
                                                }}
                                            >
                                                计划结束时间
                                            </FormLabel>
                                            <FormControl>
                                                <div
                                                    className="flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-[box-shadow,border-color] hover:border-gray-300 hover:bg-gray-50/50 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 focus-within:bg-white cursor-pointer"
                                                    onClick={(e) => {
                                                        const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input');
                                                        if (input) {
                                                            input.focus();
                                                            if (typeof input.showPicker === 'function') input.showPicker();
                                                        }
                                                    }}
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-gray-100 bg-gray-50/80 text-gray-500">
                                                        <Calendar className="h-4 w-4" />
                                                    </span>
                                                    <Input
                                                        id="planned-end-time"
                                                        type="datetime-local"
                                                        className="h-9 flex-1 min-w-0 border-0 bg-transparent py-2 pl-3 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer [color-scheme:light]"
                                                        value={field.value != null ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            field.onChange(v ? new Date(v).getTime() : undefined);
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[13px] font-semibold text-gray-700">标签</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-md bg-gray-50/50 min-h-[36px]">
                                                {(field.value ?? []).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const next = (field.value ?? []).filter((_, idx) => idx !== i);
                                                                field.onChange(next);
                                                            }}
                                                            className="hover:opacity-70"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <Input
                                                    className="flex-1 min-w-[120px] h-7 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
                                                    placeholder="添加标签，回车结束"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            const input = e.target as HTMLInputElement;
                                                            const v = (input.value || "").trim();
                                                            if (v) {
                                                                field.onChange([...(field.value ?? []), v]);
                                                                input.value = "";
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[11px]" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="isGroup"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-[13px] font-semibold text-gray-700">{planId ? "移动到" : "创建位置"}</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="flex flex-row gap-6"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="false" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-sm cursor-pointer hover:text-blue-600 transition-colors">
                                                            业务模块
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="true" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal text-sm cursor-pointer hover:text-blue-600 transition-colors">
                                                            测试计划组
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="passThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-semibold text-gray-700">通过阈值 (%) <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="number" min={0} max={100} className="h-9 pr-8" {...field} />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">%</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="p-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                {isGroup ? (
                                    <FormField
                                        control={form.control}
                                        name="groupId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-semibold text-gray-700">选择测试计划组 <span className="text-red-500">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="搜索或选择现有计划组" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="max-h-[300px] overflow-y-auto">
                                                        {groupOptionsLoading ? (
                                                            <div className="py-6 text-center text-sm text-gray-500">
                                                                <Loader2 className="w-4 h-4 animate-spin inline-block mr-1.5" />
                                                                加载中...
                                                            </div>
                                                        ) : groupOptions.length === 0 ? (
                                                            <div className="py-6 text-center text-sm text-gray-500">
                                                                暂无计划组
                                                            </div>
                                                        ) : (
                                                            groupOptions.map((group) => (
                                                                <SelectItem key={group.id} value={group.id}>
                                                                    {group.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="moduleId"
                                        render={({ field }) => {
                                            return (
                                                <FormItem>
                                                    <FormLabel className="text-[13px] font-semibold text-gray-700">选择所属模块</FormLabel>
                                                    <div className="border border-gray-200 rounded-md bg-white">
                                                        <ScrollArea className="h-[240px] w-full">
                                                            <div className="p-2">
                                                                {moduleTree.length === 0 ? (
                                                                    <div className="text-center text-gray-400 text-xs py-4">
                                                                        暂无模块
                                                                    </div>
                                                                ) : (
                                                                    moduleTree.map((node: any) => renderTreeNode(node))
                                                                )}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                )}
                            </div>

                            <FormItem>
                                <FormLabel className="text-[13px] font-semibold text-gray-700">关联飞书需求</FormLabel>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Input
                                                value={feishuStoryKeyword || feishuStoryId}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setFeishuStoryKeyword(v);
                                                    setFeishuStoryId("");
                                                    searchFeishu(v);
                                                    setStoryDropdownOpen(true);
                                                }}
                                                onFocus={() => {
                                                    setStoryDropdownOpen(true);
                                                    if (!(feishuStoryKeyword || feishuStoryId).trim()) {
                                                        loadDefaultFeishuOptions();
                                                    }
                                                }}
                                                placeholder="请选择关联的飞书需求（可选），点击可查看最近需求"
                                                className="h-9"
                                            />
                                            {storyDropdownOpen && (
                                                <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                                                    {storySearching ? (
                                                        <div className="p-2 text-sm text-gray-500">加载中...</div>
                                                    ) : storyOptions.length === 0 ? (
                                                        <div className="p-2 text-sm text-gray-500">
                                                            {feishuStoryKeyword || feishuStoryId ? "无匹配需求" : "暂无需求数据"}
                                                        </div>
                                                    ) : (
                                                        storyOptions.map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                                onClick={() => {
                                                                    setFeishuStoryId(opt.id);
                                                                    setFeishuStoryKeyword(`${opt.id} - ${opt.name}`);
                                                                    setStoryDropdownOpen(false);
                                                                }}
                                                            >
                                                                {opt.id} - {opt.name}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {isGroup && groupFeishuStoryId && (
                                            <div className="flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50/50 p-2 rounded-md border border-blue-100/50 animate-in fade-in slide-in-from-top-1">
                                                <Check className="w-3 h-3" strokeWidth={3} />
                                                <span>
                                                    已从计划组继承需求：<span className="font-semibold">{groupFeishuStoryName || groupFeishuStoryId}</span> 
                                                    {feishuStoryId === groupFeishuStoryId ? "（当前生效）" : "（已被手动覆盖）"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                            </FormItem>

                            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 space-y-5">
                                <FormField
                                    control={form.control}
                                    name="repeatCase"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between space-y-0">
                                            <div className="space-y-1">
                                                <FormLabel className="text-sm font-semibold text-gray-800">关联重复用例</FormLabel>
                                                <FormDescription className="text-xs">
                                                    是否允许在同一计划下关联多个相同的测试用例
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="data-[state=checked]:bg-blue-600"
                                                    title={field.value ? '已开启' : '已关闭'}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="h-[1px] bg-gray-100 w-full" />
                                <FormField
                                    control={form.control}
                                    name="automaticStatusUpdate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between space-y-0">
                                            <div className="space-y-1">
                                                <FormLabel className="text-sm font-semibold text-gray-800">自动更新状态</FormLabel>
                                                <FormDescription className="text-xs">
                                                    根据用例执行通过情况自动流转测试计划的整体状态
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="data-[state=checked]:bg-blue-600"
                                                    title={field.value ? '已开启' : '已关闭'}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <SheetFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 shrink-0 gap-2">
                    <Button type="button" variant="outline" className="h-9 px-6 border-gray-200 text-gray-600 hover:bg-white" onClick={() => onOpenChange(false)}>取消</Button>
                    {!planId && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 px-6"
                            disabled={loading}
                            onClick={() => form.handleSubmit((values) => onSubmit(values, true))()}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存并继续
                        </Button>
                    )}
                    <Button
                        type="submit"
                        form="test-plan-form"
                        disabled={loading}
                        className="h-9 px-8 bg-blue-600 hover:bg-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {planId ? "保存更新" : "立即创建"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        </>
    );
}
