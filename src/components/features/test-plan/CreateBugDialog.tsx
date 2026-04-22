/**
 * 创建缺陷对话框
 * 单列竖向布局，字段顺序与文案对齐参考图。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Paperclip, User, Loader2, Info, Calendar as CalendarIcon, Cloud, ChevronDown, CheckCircle, Trash2 } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarWithYearNav, type CalendarProps } from '@/components/ui/calendar';
import { bugManagementService, requirementQualityService, projectManagementService, authService } from '@/services';
import { BUG_STATUS_OPTIONS, BUG_STATUS_DEFAULT } from '@/services/bug-management/constants/bug-status';
import { BUG_PRIORITY_OPTIONS, BUG_PRIORITY_TOOLTIP } from '@/services/bug-management/constants/bug-priority';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { BUG_DEFECT_TYPE_OPTIONS } from '@/services/bug-management/constants/bug-defect-type';
import { DefectReasonSelect } from '@/components/features/bug-management/DefectReasonSelect';
import { AppSelect } from '@/components/features/bug-management/AppSelect';
import { BUG_APP_OPTIONS_LIST } from '@/services/bug-management/constants/bug-app-options';
import { BUG_DISCOVERY_PHASE_OPTIONS_LIST } from '@/services/bug-management/constants/bug-discovery-phase';
import {
    BusinessLineSelect,
    type BusinessLineFlatOption,
} from '@/components/features/bug-management/BusinessLineSelect';
import { DiscovererSelect } from '@/components/features/bug-management/DiscovererSelect';
import {
    getFeishuBusinessLineOptions,
    getFeishuDefectReasonOptions,
    getFeishuFieldOptions,
    type FeishuDefectReasonGroup,
} from '@/services/bug-management/service';
import { toast } from 'sonner';

interface CreateBugDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId?: string;
    caseId?: string;
    testPlanId?: string;
    testPlanCaseId?: string;
    onSuccess?: () => void;
    /** 编辑模式：传入 bugId 加载已有数据 */
    bugId?: string;
    /** 复制模式 */
    isCopy?: boolean;
}

interface StoryOption {
    id: string;
    name: string;
    creator?: string;
}

interface MemberOption {
    id: string;
    name: string;
}

export function CreateBugDialog({
    open,
    onOpenChange,
    projectId,
    caseId,
    testPlanId,
    testPlanCaseId,
    onSuccess,
    bugId,
    isCopy,
}: CreateBugDialogProps) {
    const isEdit = !!bugId && !isCopy;
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('');
    const [status, setStatus] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<MemberOption[]>([]);
    /** 报告人：单选，默认当前用户 */
    const [reporterUser, setReporterUser] = useState<MemberOption | null>(null);
    const [reporterKeyword, setReporterKeyword] = useState('');
    const [reporterOptions, setReporterOptions] = useState<MemberOption[]>([]);
    const [reporterSearching, setReporterSearching] = useState(false);
    const [showReporterDropdown, setShowReporterDropdown] = useState(false);
    /** 已移除产品经理 UI，保留占位避免遗留引用报错 */
    const [showProductManagerRow, setShowProductManagerRow] = useState(false);
    const [showAddRoleDropdown, setShowAddRoleDropdown] = useState(false);
    const [addRoleKeyword, setAddRoleKeyword] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [createBugStatusOptions, setCreateBugStatusOptions] = useState<Array<{ value: string; label: string }>>([]);
    /** 缺陷类型：必填单选，枚举为 7 类 */
    const [defectType, setDefectType] = useState('');
    /** 缺陷原因：非必填单选，一级/二级枚举 */
    const [defectReason, setDefectReason] = useState('');
    /** 所属应用：必填单选，枚举 + 输入框搜索 */
    const [appId, setAppId] = useState('');
    /** 关联影响应用：非必填单选，枚举同所属应用，输入框搜索 */
    const [affectedAppId, setAffectedAppId] = useState('');
    /** 发现阶段：必填单选 */
    const [discoveryPhase, setDiscoveryPhase] = useState('');
    /** 业务线：必填单选（选项来自飞书接口，与飞书一致、只展示中文） */
    const [businessLine, setBusinessLine] = useState('');
    const [businessLineOptions, setBusinessLineOptions] = useState<BusinessLineFlatOption[]>([]);
    /** 缺陷原因：选项来自飞书接口（与业务线一样不走写死） */
    const [defectReasonOptions, setDefectReasonOptions] = useState<FeishuDefectReasonGroup[]>([]);
    /** 以下枚举均从飞书 field-options 拉取，未拉取到则用写死常量兜底 */
    const [priorityOptions, setPriorityOptions] = useState<FeishuDefectReasonGroup[]>([]);
    const [discoveryPhaseOptions, setDiscoveryPhaseOptions] = useState<FeishuDefectReasonGroup[]>([]);
    const [appOptions, setAppOptions] = useState<FeishuDefectReasonGroup[]>([]);
    const [discoveryDifficultyOptions, setDiscoveryDifficultyOptions] = useState<FeishuDefectReasonGroup[]>([]);
    const [discovererOptions, setDiscovererOptions] = useState<FeishuDefectReasonGroup[]>([]);
    /** 缺陷发现难易度：不必填、单选、支持搜索 */
    const [discoveryDifficulty, setDiscoveryDifficulty] = useState('');
    /** 发现人：不必填、单选、支持搜索 */
    const [discoverer, setDiscoverer] = useState('');
    /** 实际时间：日期选择，不必填 */
    const [actualTimeDate, setActualTimeDate] = useState<Date | undefined>(undefined);
    /** 重开次数（只读、自动统计，仅展示；从详情回显，不提交） */
    const [reopenCountDisplay, setReopenCountDisplay] = useState(0);
    /** 缺陷模板 ID，后端必填（选择流程模板） */
    const [templateId, setTemplateId] = useState('');
    /** 流程模板选项（选择流程模板下拉） */
    const [templateOptions, setTemplateOptions] = useState<{ id: string; name?: string }[]>([]);

    // 处理人搜索
    const [userKeyword, setUserKeyword] = useState('');
    const [userOptions, setUserOptions] = useState<MemberOption[]>([]);
    const [userSearching, setUserSearching] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    // 关注人：用户枚举、搜索、多选
    const [selectedFollowers, setSelectedFollowers] = useState<MemberOption[]>([]);
    const [followerKeyword, setFollowerKeyword] = useState('');
    const [followerOptions, setFollowerOptions] = useState<MemberOption[]>([]);
    const [followerSearching, setFollowerSearching] = useState(false);
    const [showFollowerDropdown, setShowFollowerDropdown] = useState(false);

    // 关联需求
    const [storyKeyword, setStoryKeyword] = useState('');
    const [storyOptions, setStoryOptions] = useState<StoryOption[]>([]);
    const [selectedStoryId, setSelectedStoryId] = useState('');
    const [selectedStoryName, setSelectedStoryName] = useState('');
    const [storySearching, setStorySearching] = useState(false);
    const [showStoryDropdown, setShowStoryDropdown] = useState(false);

    // 附件
    const [fileList, setFileList] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<{ fileId: string; fileName: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [submitting, setSubmitting] = useState(false);
    // 描述图片上传中状态（可用于后续禁用提交按钮等扩展）
    const [descriptionImageUploading, setDescriptionImageUploading] = useState(false);
    /** 连续创建：提交后清空部分字段继续填 */
    const [continuousCreate, setContinuousCreate] = useState(false);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSeverity('');
        setStatus('');
        setSelectedUsers([]);
        setUserKeyword('');
        setUserOptions([]);
        setReporterUser(null);
        setReporterKeyword('');
        setReporterOptions([]);
        setShowReporterDropdown(false);
        setShowProductManagerRow(false);
        setShowAddRoleDropdown(false);
        setAddRoleKeyword('');
        setTags([]);
        setTagInput('');
        setSelectedFollowers([]);
        setFollowerKeyword('');
        setFollowerOptions([]);
        setShowFollowerDropdown(false);
        setSelectedStoryId('');
        setSelectedStoryName('');
        setStoryKeyword('');
        setStoryOptions([]);
        setFileList([]);
        setExistingAttachments([]);
        setDefectType('');
        setDefectReason('');
        setAppId('');
        setAffectedAppId('');
        setDiscoveryPhase('');
        setBusinessLine('');
        setDiscoveryDifficulty('');
        setDiscoverer('');
        setActualTimeDate(undefined);
        setReopenCountDisplay(0);
        setTemplateId('');
        setDefectReasonOptions([]);
        setPriorityOptions([]);
        setDiscoveryPhaseOptions([]);
        setAppOptions([]);
        setDiscoveryDifficultyOptions([]);
        setDiscovererOptions([]);
        setDescriptionImageUploading(false);
    };

    useEffect(() => {
        if (!open) {
            resetForm();
            return;
        }
        if (bugId) {
            setLoading(true);
            bugManagementService.getBugDetail(bugId).then((res: any) => {
                const detail = res?.data !== undefined ? res.data : res;
                if (!detail) return;
                setTitle(isCopy ? `copy_${detail.title || ''}`.slice(0, 255) : (detail.title || ''));
                setDescription(detail.description || '');
                setTags(Array.isArray(detail.tags) ? detail.tags : []);
                setStatus(detail.status || '');
                setSeverity('');
                setDefectType(detail.defectType || '');
                setDefectReason(detail.defectReason || '');
                setAppId(detail.appId || '');
                setAffectedAppId(detail.affectedAppIds || '');
                setDiscoveryPhase(detail.discoveryPhase || '');
                setBusinessLine(detail.businessLine || '');
                setDiscoveryDifficulty(detail.discoveryDifficulty || (detail.customFields && Array.isArray(detail.customFields) ? (detail.customFields.find((f: any) => f.id === 'discoveryDifficulty')?.value ?? '') : ''));
                setDiscoverer(
                    detail.discoverer ||
                    (detail.customFields && Array.isArray(detail.customFields)
                        ? (detail.customFields.find((f: any) => f.id === 'discoverer')?.value ?? '')
                        : '')
                );
                const actualTimeStr = detail.actualTime ?? (detail.customFields && Array.isArray(detail.customFields) ? detail.customFields.find((f: any) => f.id === 'actualTime')?.value : undefined);
                if (actualTimeStr) {
                    const d = new Date(actualTimeStr);
                    if (!Number.isNaN(d.getTime())) setActualTimeDate(d);
                }
                const reopenVal = detail.reopenCount ?? (detail.customFields && Array.isArray(detail.customFields) ? detail.customFields.find((f: any) => f.id === 'reopenCount')?.value : undefined);
                setReopenCountDisplay(reopenVal !== undefined && reopenVal !== null ? Number(reopenVal) : 0);
                setTemplateId(detail.templateId || '');
                const projectIdForTemplate = detail.projectId || projectId;
                if (projectIdForTemplate) {
                    bugManagementService.getTemplateOption(projectIdForTemplate).then((res: any) => {
                        const list = Array.isArray(res) ? res : res?.data ?? res?.list ?? [];
                        setTemplateOptions(list.map((t: any) => ({ id: t.id, name: t.name || t.label })));
                    }).catch(() => setTemplateOptions([]));
                }
                setSelectedStoryId(detail.feishuStoryId || '');
                setSelectedStoryName(detail.feishuStoryName || '');
                setStoryKeyword(detail.feishuStoryId ? `${detail.feishuStoryId} - ${detail.feishuStoryName || ''}` : '');
                if (detail.feishuStoryId && !detail.feishuStoryName) {
                    requirementQualityService.storySearch(detail.feishuStoryId).then((results: { id: string; name: string }[] | undefined) => {
                        const found = results?.find((r: { id: string }) => r.id === detail.feishuStoryId);
                        if (found?.name) {
                            setSelectedStoryName(found.name);
                            setStoryKeyword(`${detail.feishuStoryId} - ${found.name}`);
                        }
                    }).catch(() => {});
                }
                setExistingAttachments(Array.isArray(detail.attachments) ? detail.attachments.map((a: any) => ({ fileId: a.fileId, fileName: a.fileName || a.name || '' })) : []);
                if (detail.customFields && Array.isArray(detail.customFields)) {
                    for (const f of detail.customFields) {
                        if (f.id === 'status' && f.value) setStatus(f.value);
                        if (f.id === 'severity' && f.value) setSeverity(f.value);
                        if (f.id === 'handleUser' && f.value) {
                            let ids: string[] = [];
                            try {
                                const parsed = JSON.parse(f.value);
                                ids = Array.isArray(parsed) ? parsed : [String(parsed)];
                            } catch {
                                ids = [String(f.value)];
                            }
                            if (ids.length > 0) {
                                projectManagementService.getProjectMemberOptions(projectId || '').then((members: any) => {
                                    const list = Array.isArray(members) ? members : members?.list ?? members?.data ?? [];
                                    setSelectedUsers(ids.map((uid: string) => {
                                        const m = list.find((mm: any) => mm.id === uid);
                                        return { id: uid, name: m?.name || m?.userName || uid };
                                    }));
                                }).catch(() => {
                                    setSelectedUsers(ids.map((uid: string) => ({ id: uid, name: uid })));
                                });
                            }
                        }
                        if (f.id === 'follower' && f.value) {
                            let followerIds: string[] = [];
                            try {
                                const parsed = JSON.parse(f.value);
                                followerIds = Array.isArray(parsed) ? parsed : [String(parsed)];
                            } catch {
                                followerIds = [String(f.value)];
                            }
                            if (followerIds.length > 0) {
                                projectManagementService.getProjectMemberOptions(projectId || '').then((members: any) => {
                                    const list = Array.isArray(members) ? members : members?.list ?? members?.data ?? [];
                                    setSelectedFollowers(followerIds.map((uid: string) => {
                                        const m = list.find((mm: any) => mm.id === uid);
                                        return { id: uid, name: m?.name || m?.userName || uid };
                                    }));
                                }).catch(() => {
                                    setSelectedFollowers(followerIds.map((uid: string) => ({ id: uid, name: uid })));
                                });
                            }
                        }
                        if (f.id === 'reporter' && f.value) {
                            const uid = typeof f.value === 'string' && !f.value.startsWith('[') ? f.value : (() => {
                                try {
                                    const p = JSON.parse(f.value);
                                    return Array.isArray(p) ? p[0] : p;
                                } catch {
                                    return f.value;
                                }
                            })();
                            if (uid) {
                                projectManagementService.getProjectMemberOptions(projectId || '').then((members: any) => {
                                    const list = Array.isArray(members) ? members : members?.list ?? members?.data ?? [];
                                    const m = list.find((mm: any) => mm.id === uid);
                                    setReporterUser({ id: uid, name: m?.name || m?.userName || uid });
                                }).catch(() => setReporterUser({ id: uid, name: uid }));
                            }
                        }
                    }
                }
            }).catch(() => {
                toast.error('加载缺陷详情失败');
            }).finally(() => setLoading(false));
        } else if (open && projectId && !bugId) {
            // 新建时：默认状态为待确认
            setStatus(BUG_STATUS_DEFAULT);
            // 新建时报告人默认当前用户
            authService.getCurrentUser().then((u: any) => {
                const user = u?.data !== undefined ? u.data : u;
                if (user?.id) setReporterUser({ id: user.id, name: user.name || user.userName || user.id });
            }).catch(() => {});
            // 新建时拉取项目缺陷模板选项，取第一个作为默认 templateId
            bugManagementService.getTemplateOption(projectId).then((res: any) => {
                const list = Array.isArray(res) ? res : res?.data ?? res?.list ?? [];
                setTemplateOptions(list.map((t: any) => ({ id: t.id, name: t.name || t.label })));
                const first = list[0];
                if (first?.id) setTemplateId(first.id);
            }).catch(() => {});
        }
    }, [open, bugId, isCopy, projectId]);

    // 飞书项目时从表头接口拉取流程状态选项
    useEffect(() => {
        if (!open || !projectId) {
            setCreateBugStatusOptions([]);
            return;
        }
        bugManagementService.getCustomOptionHeader(projectId).then((res: any) => {
            const raw = res?.statusOption || [];
            const opts = raw.map((o: { value?: string; text?: string }) => ({ value: o.value ?? o.text ?? '', label: o.text ?? o.value ?? '' })).filter((o: { value: string }) => o.value);
            setCreateBugStatusOptions(opts);
        }).catch(() => setCreateBugStatusOptions([]));
    }, [open, projectId]);

    const statusOptionsForCreateBug = createBugStatusOptions.length ? createBugStatusOptions : BUG_STATUS_OPTIONS;

    const searchStories = useCallback(async (keyword: string) => {
        setStorySearching(true);
        try {
            const results = keyword.trim()
                ? await requirementQualityService.storySearch(keyword)
                : await requirementQualityService.getDefaultStoryOptions();
            setStoryOptions(results || []);
            // 不在此处展开下拉，仅由用户点击/聚焦时展开
        } catch {
            setStoryOptions([]);
        } finally {
            setStorySearching(false);
        }
    }, []);

    /** 弹窗打开时预加载默认需求选项（不输入内容也展示需求列表） */
    useEffect(() => {
        if (open) {
            searchStories('');
        }
    }, [open, searchStories]);

    /** 弹窗打开时拉取飞书业务线选项（与飞书接口一致，只展示中文） */
    useEffect(() => {
        if (!open) return;
        getFeishuBusinessLineOptions()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
                setBusinessLineOptions(list.map((i: { id: string; name: string; level?: string; path?: string }) => ({ value: i.id, label: i.name, level: i.level, path: i.path })));
            })
            .catch(() => setBusinessLineOptions([]));
    }, [open]);

    /** 弹窗打开时拉取飞书缺陷原因选项（与业务线一样从接口拉取，不走写死） */
    useEffect(() => {
        if (!open) return;
        getFeishuDefectReasonOptions()
            .then((res) => {
                const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
                setDefectReasonOptions(list as FeishuDefectReasonGroup[]);
            })
            .catch(() => setDefectReasonOptions([]));
    }, [open]);

    /** 弹窗打开时拉取飞书全部枚举（优先级、发现阶段、所属应用、发现难易度、发现人），与缺陷原因一样不走写死 */
    useEffect(() => {
        if (!open) return;
        const fieldKeys = [
            { key: 'priority', set: setPriorityOptions },
            { key: 'field_1cbc4e', set: setDiscoveryPhaseOptions },
            { key: 'field_39dbe4', set: setAppOptions },
            { key: 'field_6b822e', set: setDiscoveryDifficultyOptions },
            { key: 'field_f12022', set: setDiscovererOptions },
        ] as const;
        fieldKeys.forEach(({ key, set }) => {
            getFeishuFieldOptions(key)
                .then((res) => {
                    const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
                    set(list as FeishuDefectReasonGroup[]);
                })
                .catch(() => set([]));
        });
    }, [open]);

    const searchUsers = useCallback(async (keyword: string) => {
        if (!projectId) return;
        setUserSearching(true);
        try {
            const res = await projectManagementService.getProjectMemberOptions(projectId, keyword || undefined);
            const list = Array.isArray(res) ? res : (res as any)?.list ?? (res as any)?.data ?? [];
            setUserOptions(list.map((m: any) => ({ id: m.id, name: m.name || m.userName || '-' })));
            setShowUserDropdown(true);
        } catch {
            setUserOptions([]);
        } finally {
            setUserSearching(false);
        }
    }, [projectId]);

    const handleUserKeywordChange = (value: string) => {
        setUserKeyword(value);
        searchUsers(value);
    };

    const handleToggleUser = (user: MemberOption) => {
        setSelectedUsers((prev) => {
            const exists = prev.some((u) => u.id === user.id);
            return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
        });
        setUserKeyword('');
        setShowUserDropdown(false);
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const searchFollowers = useCallback(async (keyword: string) => {
        if (!projectId) return;
        setFollowerSearching(true);
        try {
            const res = await projectManagementService.getProjectMemberOptions(projectId, keyword || undefined);
            const list = Array.isArray(res) ? res : (res as any)?.list ?? (res as any)?.data ?? [];
            setFollowerOptions(list.map((m: any) => ({ id: m.id, name: m.name || m.userName || '-' })));
            setShowFollowerDropdown(true);
        } catch {
            setFollowerOptions([]);
        } finally {
            setFollowerSearching(false);
        }
    }, [projectId]);

    const handleFollowerKeywordChange = (value: string) => {
        setFollowerKeyword(value);
        searchFollowers(value);
    };

    const handleToggleFollower = (user: MemberOption) => {
        setSelectedFollowers((prev) => {
            const exists = prev.some((u) => u.id === user.id);
            return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
        });
        setFollowerKeyword('');
        setShowFollowerDropdown(false);
    };

    const handleRemoveFollower = (userId: string) => {
        setSelectedFollowers((prev) => prev.filter((u) => u.id !== userId));
    };

    const searchReporter = useCallback(async (keyword: string) => {
        if (!projectId) return;
        setReporterSearching(true);
        try {
            const res = await projectManagementService.getProjectMemberOptions(projectId, keyword || undefined);
            const list = Array.isArray(res) ? res : (res as any)?.list ?? (res as any)?.data ?? [];
            setReporterOptions(list.map((m: any) => ({ id: m.id, name: m.name || m.userName || '-' })));
            setShowReporterDropdown(true);
        } catch {
            setReporterOptions([]);
        } finally {
            setReporterSearching(false);
        }
    }, [projectId]);

    const handleStoryKeywordChange = (value: string) => {
        setStoryKeyword(value);
        setSelectedStoryId('');
        setSelectedStoryName('');
        searchStories(value.trim() ? value : '');
        // 下拉仅由点击/聚焦时展开，不随输入自动展开
    };

    const handleSelectStory = (story: StoryOption) => {
        setSelectedStoryId(story.id);
        setSelectedStoryName(story.name);
        setStoryKeyword(`${story.id} - ${story.name}`);
        setShowStoryDropdown(false);
    };

    const handleClearStory = () => {
        setSelectedStoryId('');
        setSelectedStoryName('');
        setStoryKeyword('');
        setStoryOptions([]);
    };

    const handleTagAdd = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) {
            setTags([...tags, t]);
        }
        setTagInput('');
    };

    const handleTagRemove = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFileList([...fileList, ...Array.from(e.target.files)]);
        }
        e.target.value = '';
    };

    const handleFileRemove = (index: number) => {
        setFileList(fileList.filter((_, i) => i !== index));
    };

    const handleSubmit = async (isContinue = false) => {
        if (!title.trim()) {
            toast.error('请输入缺陷名称');
            return;
        }
        if (!selectedStoryId) {
            toast.error('请选择关联需求');
            return;
        }

        setSubmitting(true);
        try {
            // 通知逻辑依赖 status/handleUser 的 text（显示名），需一并提交
            const customFields: { id: string; value: string; text?: string }[] = [];
            const statusLabel = statusOptionsForCreateBug.find((o) => o.value === status)?.label ?? status;
            customFields.push({ id: 'status', value: status || '', text: JSON.stringify([statusLabel || '']) });
            if (reporterUser?.id) {
                customFields.push({ id: 'reporter', value: reporterUser.id });
            }
            if (selectedUsers.length > 0) {
                customFields.push({
                    id: 'handleUser',
                    value: JSON.stringify(selectedUsers.map((u) => u.id)),
                    text: JSON.stringify(selectedUsers.map((u) => u.name)),
                });
            }
            if (selectedFollowers.length > 0) {
                customFields.push({ id: 'follower', value: JSON.stringify(selectedFollowers.map((u) => u.id)) });
            }
            if (discoveryDifficulty) {
                customFields.push({ id: 'discoveryDifficulty', value: discoveryDifficulty });
            }
            if (discoverer) {
                customFields.push({ id: 'discoverer', value: discoverer });
            }
            if (actualTimeDate) {
                customFields.push({ id: 'actualTime', value: format(actualTimeDate, 'yyyy-MM-dd') });
            }
            customFields.push({ id: 'severity', value: severity || '' });
            if (!severity) {
                toast.error('请选择优先级');
                setSubmitting(false);
                return;
            }

            if (!defectType) {
                toast.error('请选择缺陷类型');
                setSubmitting(false);
                return;
            }
            if (!appId) {
                toast.error('请选择所属应用');
                setSubmitting(false);
                return;
            }
            if (!discoveryPhase) {
                toast.error('请选择发现阶段');
                setSubmitting(false);
                return;
            }
            if (!businessLine) {
                toast.error('请选择业务线');
                setSubmitting(false);
                return;
            }
            if (!templateId) {
                toast.error('未获取到缺陷模板，请稍后重试');
                setSubmitting(false);
                return;
            }
            // 提交时带上当前输入框中未按回车添加的标签，确保不会丢失
            const tagsToSend = tagInput.trim()
                ? (tags.includes(tagInput.trim()) ? tags : [...tags, tagInput.trim()])
                : tags;
            const request: Record<string, any> = {
                title: title.trim(),
                description,
                projectId: projectId || '',
                templateId,
                platform: 'FEISHU',
                feishuStoryId: selectedStoryId,
                defectType,
                defectReason: defectReason || undefined,
                appId,
                affectedAppIds: affectedAppId || undefined,
                discoveryPhase,
                businessLine,
                discoveryDifficulty: discoveryDifficulty || undefined,
                discoverer: discoverer || undefined,
                actualTime: actualTimeDate ? startOfDay(actualTimeDate).getTime() : undefined,
                tags: Array.isArray(tagsToSend) ? tagsToSend : [],
                customFields,
            };
            if (isEdit && bugId) request.id = bugId;
            // 用例侧创建时自动关联当前用例（caseId/testPlanCaseId 必传，caseType 固定为 FUNCTIONAL）
            if (caseId) request.caseId = caseId;
            if (testPlanId) request.testPlanId = testPlanId;
            if (testPlanCaseId) request.testPlanCaseId = testPlanCaseId;
            if (caseId || testPlanCaseId) request.caseType = 'FUNCTIONAL';

            await bugManagementService.createOrUpdateBug({ request, fileList });
            toast.success(isEdit ? '缺陷更新成功' : '缺陷创建成功');

            if (isContinue || continuousCreate) {
                setTitle('');
                setDescription('');
                setFileList([]);
                setTags([]);
            } else {
                onOpenChange(false);
            }
            onSuccess?.();
        } catch (err: any) {
            toast.error(err?.message || '创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files?.length) {
            setFileList((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px] max-h-[90vh] p-0 flex flex-col" aria-describedby={undefined}>
                {/* 头部：标题「缺陷」，无图标；关闭按钮仅保留 DialogContent 自带一个 */}
                <DialogHeader className="px-6 py-4 border-b border-gray-100">
                    <DialogTitle className="text-base font-medium">缺陷</DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5 relative">
                    {loading && bugId && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm">加载中...</span>
                            </div>
                        </div>
                    )}

                    {/* 基本信息 */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-800">基本信息</h3>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-gray-700">
                                <span className="text-red-500 mr-0.5">*</span>名称
                            </Label>
                            <Input
                                placeholder="待填"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={255}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-gray-700">描述</Label>
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="待填"
                                minHeight="120px"
                                className="rounded-md border border-input shadow-[0_1px_2px_0_rgb(0_0_0_/0.05)]"
                                uploadImage={async (file: File) => {
                                    if (!projectId) {
                                        toast.error('缺少项目ID，无法上传图片');
                                        return '';
                                    }
                                    try {
                                        setDescriptionImageUploading(true);
                                        const fileId = await bugManagementService.uploadCommentImage(file);
                                        if (!fileId) {
                                            toast.error('图片上传失败');
                                            return '';
                                        }
                                        const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').toString().trim().replace(/\/$/, '');
                                        const prefix = apiBase || '/api';
                                        return `${prefix}/bug/attachment/preview/md/${projectId}/${fileId}/false`;
                                    } catch (err: any) {
                                        toast.error(err?.message || '图片上传失败');
                                        return '';
                                    } finally {
                                        setDescriptionImageUploading(false);
                                    }
                                }}
                            />
                        </div>
                    </section>

                    {/* 缺陷属性 */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-800">缺陷属性</h3>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-gray-700">
                                <span className="text-red-500 mr-0.5">*</span>缺陷类型
                            </Label>
                            <Select value={defectType} onValueChange={setDefectType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="待填" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BUG_DEFECT_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* 流程模板：只有默认模板，自动选中第一个，无需展示选择器 */}
                        </div>

                    {/* 缺陷原因：非必填，单选，一级展开/收起 + 二级彩色标签（选项来自飞书接口，与业务线一样） */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">缺陷原因</Label>
                        <DefectReasonSelect
                            value={defectReason}
                            onChange={setDefectReason}
                            groups={defectReasonOptions}
                            placeholder="待填"
                        />
                    </div>

                    {/* 优先级：必填，单选 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700 flex items-center gap-1">
                            <span className="text-red-500 mr-0.5">*</span>优先级
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex cursor-help">
                                        <Info className="w-3.5 h-3.5 text-gray-400" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-sm whitespace-pre-line text-xs">
                                    {BUG_PRIORITY_TOOLTIP}
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Select value={severity} onValueChange={setSeverity}>
                            <SelectTrigger>
                                <SelectValue placeholder="待填" />
                            </SelectTrigger>
                            <SelectContent>
                                {(priorityOptions.length > 0 ? priorityOptions.flatMap((g) => g.options) : BUG_PRIORITY_OPTIONS).map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 所属应用：必填，单选，输入框内搜索 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">
                            <span className="text-red-500 mr-0.5">*</span>所属应用
                        </Label>
                        <AppSelect
                            value={appId}
                            onChange={setAppId}
                            options={appOptions.length > 0 ? appOptions.flatMap((g) => g.options) : BUG_APP_OPTIONS_LIST}
                            placeholder="待填"
                        />
                    </div>

                    {/* 关联影响应用：非必填，单选，枚举同所属应用，输入框内搜索，单列 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">关联影响应用</Label>
                        <AppSelect
                            value={affectedAppId}
                            onChange={setAffectedAppId}
                            options={appOptions.length > 0 ? appOptions.flatMap((g) => g.options) : BUG_APP_OPTIONS_LIST}
                            placeholder="待填"
                        />
                    </div>

                    {/* 发现阶段：必填，单选，输入框内搜索，单列 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">
                            <span className="text-red-500 mr-0.5">*</span>发现阶段
                        </Label>
                        <AppSelect
                            value={discoveryPhase}
                            onChange={(v) => {
                                setDiscoveryPhase(v);
                                // 切换为非「线上阶段」时清空发现人，避免提交无效值
                                const options = discoveryPhaseOptions.length > 0 ? discoveryPhaseOptions.flatMap((g) => g.options) : BUG_DISCOVERY_PHASE_OPTIONS_LIST;
                                const opt = options.find((o) => o.value === v);
                                const label = opt?.label ?? v;
                                if (label !== '线上阶段') setDiscoverer('');
                            }}
                            options={discoveryPhaseOptions.length > 0 ? discoveryPhaseOptions.flatMap((g) => g.options) : BUG_DISCOVERY_PHASE_OPTIONS_LIST}
                            placeholder="待填"
                        />
                    </div>

                    {/* 业务线：必填，单选，与缺陷原因同款一级展开/二级单列，输入框内搜索 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">
                            <span className="text-red-500 mr-0.5">*</span>业务线
                        </Label>
                        <BusinessLineSelect
                            value={businessLine}
                            onChange={setBusinessLine}
                            placeholder="待填"
                            options={businessLineOptions}
                        />
                    </div>

                    {/* 关联需求：必填，下拉列表 + 搜索，不输入也展示默认选项，ID | 创建人 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">
                            <span className="text-red-500 mr-0.5">*</span>关联需求
                        </Label>
                        <div className="relative">
                            <div
                                role="combobox"
                                aria-expanded={showStoryDropdown}
                                className={`flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background pl-3 pr-2 py-2 text-sm focus-within:outline-none focus-within:border-blue-400 ${showStoryDropdown ? 'border-blue-400' : ''}`}
                                onClick={() => {
                                    setShowStoryDropdown(true);
                                    if (storyOptions.length === 0 && !storySearching) {
                                        searchStories(storyKeyword.trim() || '');
                                    }
                                }}
                            >
                                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <input
                                    type="text"
                                    value={storyKeyword}
                                    onChange={(e) => handleStoryKeywordChange(e.target.value)}
                                    onFocus={() => {
                                        setShowStoryDropdown(true);
                                        if (storyOptions.length === 0 && !storySearching) {
                                            searchStories(storyKeyword.trim() || '');
                                        }
                                    }}
                                    onBlur={() => setTimeout(() => setShowStoryDropdown(false), 200)}
                                    placeholder="搜索"
                                    className="flex-1 min-w-0 bg-transparent border-0 p-0 text-sm outline-none placeholder:text-muted-foreground"
                                />
                                {selectedStoryId ? (
                                    <button
                                        type="button"
                                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleClearStory();
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ) : (
                                    <ChevronDown
                                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${showStoryDropdown ? 'rotate-180' : ''}`}
                                    />
                                )}
                            </div>
                            {showStoryDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg overflow-hidden">
                                    <div className="px-2.5 py-1.5 text-xs text-muted-foreground border-b bg-muted/40">
                                        你可能想选
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {storySearching ? (
                                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                加载中...
                                            </div>
                                        ) : storyOptions.length === 0 ? (
                                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                暂无数据，请输入关键词搜索
                                            </div>
                                        ) : (
                                            storyOptions.map((s) => (
                                                <div
                                                    key={s.id}
                                                    className="flex gap-2 px-3 py-2.5 text-sm hover:bg-muted/60 cursor-pointer border-b border-border/50 last:border-0 items-start"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelectStory(s);
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-foreground">{s.name}</div>
                                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                                            ID: {s.id}
                                                            {s.creator != null && s.creator !== '' && (
                                                                <span> | 创建人: {s.creator}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            {selectedStoryId && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    <Badge variant="secondary" className="text-xs font-normal text-blue-600 bg-blue-50">
                                        {selectedStoryName || selectedStoryId}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                    </section>

                    {/* 多个附件 */}
                    <section className="space-y-1.5">
                        <h3 className="text-sm font-medium text-gray-800">多个附件</h3>
                        {existingAttachments.length > 0 && (
                            <div className="space-y-1 mt-1">
                                <p className="text-xs text-muted-foreground">已有附件</p>
                                {existingAttachments.map((a) => (
                                    <div key={a.fileId} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded text-sm">
                                        <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {bugId && projectId ? (
                                            <button
                                                type="button"
                                                className="truncate text-left text-blue-600 hover:underline"
                                                onClick={async () => {
                                                    try {
                                                        const res = await bugManagementService.downloadBugAttachment({ projectId, bugId, fileId: a.fileId, associated: false });
                                                        const blob = res instanceof Blob ? res : (res as any)?.data;
                                                        if (!blob) { toast.error('下载失败'); return; }
                                                        const url = URL.createObjectURL(blob);
                                                        const el = document.createElement('a');
                                                        el.href = url;
                                                        el.download = a.fileName || 'attachment';
                                                        el.click();
                                                        URL.revokeObjectURL(url);
                                                    } catch {
                                                        toast.error('下载失败');
                                                    }
                                                }}
                                            >
                                                {a.fileName || a.fileId}
                                            </button>
                                        ) : (
                                            <span className="truncate text-gray-700">{a.fileName || a.fileId}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                            onClick={handleFileSelect}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <Cloud className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">点击上传或拖拽文件到这里</p>
                            <p className="text-xs text-muted-foreground mt-1">支持任意类型文件，最多上传50份，单份文件大小不超过2GB</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {fileList.length > 0 && (
                            <div className="space-y-1 mt-2">
                                {fileList.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate text-gray-700">{file.name}</span>
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                            onClick={() => handleFileRemove(index)}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 关注人（仅保留一个标题） */}
                    <section className="space-y-1.5">
                        <h3 className="text-sm font-medium text-gray-800">关注人</h3>
                        <div className="relative">
                            <div className="flex min-h-9 w-full items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-within:border-blue-400">
                                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                                    {selectedFollowers.map((u) => (
                                        <Badge key={u.id} variant="secondary" className="text-xs font-normal gap-1 pr-1 py-0">
                                            {u.name}
                                            <button type="button" onClick={() => handleRemoveFollower(u.id)} className="hover:text-red-500 rounded">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <input
                                        className="min-w-[60px] flex-1 shrink-0 border-0 bg-transparent py-1 text-sm outline-none"
                                        placeholder={selectedFollowers.length === 0 ? '待填' : ''}
                                        value={followerKeyword}
                                        onChange={(e) => handleFollowerKeywordChange(e.target.value)}
                                        onFocus={() => searchFollowers(followerKeyword)}
                                        onBlur={() => setTimeout(() => setShowFollowerDropdown(false), 200)}
                                    />
                                </div>
                                {followerSearching && (
                                    <span className="shrink-0 text-xs text-gray-400">搜索中...</span>
                                )}
                            </div>
                            {showFollowerDropdown && followerOptions.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto overscroll-contain">
                                    {followerOptions.map((u) => {
                                        const isSelected = selectedFollowers.some((s) => s.id === u.id);
                                        return (
                                            <div
                                                key={u.id}
                                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                                onMouseDown={() => handleToggleFollower(u)}
                                            >
                                                <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                                    {isSelected && <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 12 12"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                </div>
                                                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span>{u.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {showFollowerDropdown && !followerSearching && followerOptions.length === 0 && followerKeyword && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                                    <div className="px-3 py-3 text-center text-sm text-muted-foreground">无匹配成员</div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 角色与人员 */}
                    <section className="space-y-1.5">
                        <h3 className="text-sm font-medium text-gray-800">角色与人员</h3>
                        <div className="space-y-3">
                            {/* 报告人：单选，右侧预留空间显示悬浮删除按钮 */}
                            <div className="group relative flex items-start gap-3">
                                <div className="w-28 flex items-center shrink-0 pt-2">
                                    <span className="text-xs text-gray-600">报告人</span>
                                </div>
                                <div className="relative flex-1 min-w-0 pr-8">
                                    <div className="flex min-h-9 w-full items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-within:border-blue-400">
                                        {reporterUser ? (
                                            <Badge variant="secondary" className="text-xs font-normal gap-1 pr-1 py-0 max-w-[140px] truncate shrink-0" title={reporterUser.name}>
                                                {reporterUser.name}
                                                <button type="button" onClick={() => setReporterUser(null)} className="hover:text-red-500 rounded shrink-0">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ) : null}
                                        <input
                                            className="min-w-[60px] flex-1 shrink-0 border-0 bg-transparent py-1 text-sm outline-none"
                                            placeholder={reporterUser ? '' : '搜索人员姓名'}
                                            value={reporterKeyword}
                                            onChange={(e) => {
                                                setReporterKeyword(e.target.value);
                                                searchReporter(e.target.value);
                                            }}
                                            onFocus={() => searchReporter(reporterKeyword)}
                                            onBlur={() => setTimeout(() => setShowReporterDropdown(false), 200)}
                                        />
                                        {reporterSearching && <span className="shrink-0 text-xs text-muted-foreground">搜索中...</span>}
                                    </div>
                                    {showReporterDropdown && reporterOptions.length > 0 && (
                                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto overscroll-contain">
                                            {reporterOptions.map((u) => (
                                                <div
                                                    key={u.id}
                                                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                                    onMouseDown={() => {
                                                        setReporterUser(u);
                                                        setReporterKeyword('');
                                                        setShowReporterDropdown(false);
                                                    }}
                                                >
                                                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    <span>{u.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showReporterDropdown && !reporterSearching && reporterOptions.length === 0 && reporterKeyword && (
                                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                                            <div className="px-3 py-3 text-center text-sm text-muted-foreground">无匹配成员</div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        onClick={() => setReporterUser(null)}
                                        aria-label="清空报告人"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* 经办人：多选，右侧预留空间显示悬浮删除按钮 */}
                            <div className="group relative flex items-start gap-3">
                                <div className="w-28 flex items-center shrink-0 pt-2">
                                    <span className="text-xs text-gray-600">经办人</span>
                                </div>
                                <div className="relative flex-1 min-w-0 pr-8">
                                    <div className="flex min-h-9 w-full items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-within:border-blue-400">
                                        <div className="flex flex-1 min-w-0 flex-wrap items-center gap-1.5">
                                            {selectedUsers.map((u) => (
                                                <Badge key={u.id} variant="secondary" className="text-xs font-normal gap-1 pr-1 py-0 max-w-[120px] truncate shrink-0" title={u.name}>
                                                    {u.name}
                                                    <button type="button" onClick={() => handleRemoveUser(u.id)} className="hover:text-red-500 rounded shrink-0">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            <input
                                                className="min-w-[60px] flex-1 shrink-0 border-0 bg-transparent py-1 text-sm outline-none"
                                                placeholder={selectedUsers.length === 0 ? '搜索人员姓名' : ''}
                                                value={userKeyword}
                                                onChange={(e) => handleUserKeywordChange(e.target.value)}
                                                onFocus={() => searchUsers(userKeyword)}
                                                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                                            />
                                        </div>
                                        {userSearching && <span className="shrink-0 text-xs text-muted-foreground">搜索中...</span>}
                                    </div>
                                    {showUserDropdown && userOptions.length > 0 && (
                                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-48 overflow-auto overscroll-contain">
                                            {userOptions.map((u) => {
                                                const isSelected = selectedUsers.some((s) => s.id === u.id);
                                                return (
                                                    <div
                                                        key={u.id}
                                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                                                        onMouseDown={() => handleToggleUser(u)}
                                                    >
                                                        <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                                            {isSelected && <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 12 12"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                        </div>
                                                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                        <span>{u.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {showUserDropdown && !userSearching && userOptions.length === 0 && userKeyword && (
                                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                                            <div className="px-3 py-3 text-center text-sm text-muted-foreground">无匹配成员</div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        onClick={() => setSelectedUsers([])}
                                        aria-label="清空经办人"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* 缺陷详情 */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-800">缺陷详情</h3>
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">缺陷发现难易度</Label>
                        <AppSelect
                            value={discoveryDifficulty}
                            onChange={setDiscoveryDifficulty}
                            options={discoveryDifficultyOptions.length > 0 ? discoveryDifficultyOptions.flatMap((g) => g.options) : [{ value: '容易', label: '容易' }, { value: '一般', label: '一般' }, { value: '困难', label: '困难' }]}
                            placeholder="待填"
                        />
                    </div>

                    {/* 重开次数、是否重开过：只读，由后端自动统计，仅展示；编辑时从详情回显 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm text-gray-700">重开次数</Label>
                            <Input value={String(reopenCountDisplay)} readOnly className="bg-gray-50 text-muted-foreground" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-gray-700">是否重开过 (自动统计)</Label>
                            <Input value={reopenCountDisplay > 0 ? '是' : '否'} readOnly className="bg-gray-50 text-muted-foreground" />
                        </div>
                    </div>

                    {/* 发现人：仅当发现阶段为「线上阶段」时展示 */}
                    {(() => {
                        const options = discoveryPhaseOptions.length > 0 ? discoveryPhaseOptions.flatMap((g) => g.options) : BUG_DISCOVERY_PHASE_OPTIONS_LIST;
                        const opt = options.find((o) => o.value === discoveryPhase);
                        const discoveryPhaseLabel = opt?.label ?? discoveryPhase;
                        const showDiscovererField = discoveryPhaseLabel === '线上阶段';
                        if (!showDiscovererField) return null;
                        return (
                            <div className="space-y-1.5">
                                <Label className="text-sm text-gray-700 flex items-center gap-1">
                                    发现人
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex cursor-help">
                                                <Info className="w-3.5 h-3.5 text-gray-400" />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                                            用于标记缺陷的发现来源，如：客户、运营、财务、内部/测试等。
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <DiscovererSelect
                                    value={discoverer}
                                    onChange={setDiscoverer}
                                    groups={discovererOptions}
                                    placeholder="待填"
                                />
                            </div>
                        );
                    })()}

                    {/* 实际时间：日期选择，不必填 */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">实际时间</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="relative">
                                    <Input
                                        readOnly
                                        placeholder="待填"
                                        value={actualTimeDate ? format(actualTimeDate, 'yyyy-MM-dd') : ''}
                                        className="focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                                        onClick={(e) => (e.target as HTMLInputElement).focus()}
                                    />
                                    <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground pointer-events-none" />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarWithYearNav
                                    {...({
                                        mode: 'single',
                                        selected: actualTimeDate,
                                        onSelect: setActualTimeDate,
                                        locale: zhCN,
                                    } as CalendarProps)}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    </section>

                    {/* 标签（保留逻辑，放在靠后位置） */}
                    <div className="space-y-1.5">
                        <Label className="text-sm text-gray-700">标签</Label>
                        <Input
                            className="text-sm"
                            placeholder="输入后回车添加标签"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs font-normal gap-1 pr-1">
                                        {tag}
                                        <button onClick={() => handleTagRemove(tag)} className="hover:text-red-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 编辑时显示状态 */}
                    {isEdit && (
                        <div className="space-y-1.5">
                            <Label className="text-sm text-gray-700">状态</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="请选择" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptionsForCreateBug.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div className="flex items-center">
                        {!isEdit && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                                <Checkbox
                                    checked={continuousCreate}
                                    onCheckedChange={(v) => setContinuousCreate(!!v)}
                                />
                                连续创建
                            </label>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleSubmit(continuousCreate)}
                            disabled={submitting || loading || !title.trim() || !selectedStoryId || !defectType || !severity || !appId}
                        >
                            {submitting ? '提交中...' : isEdit ? '保存' : '确认创建'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
