/**
 * 发现人枚举：value 为飞书选项 ID（落库），label 为展示中文。
 * - 顶层（其他）：客户、运营、财务
 * - 顶层（系统）：自动化测试、巡检(拨测)平台、日志告警
 * - 内部（可折叠）：核对平台、产品、开发、测试
 */

export interface DiscovererOption {
    value: string;
    label: string;
    /** 标签背景色类名（Tailwind），与设计图一致 */
    tagClass?: string;
}

export interface DiscovererGroup {
    group: string;
    options: DiscovererOption[];
}

/** 发现人分组：value=飞书选项 ID，label=中文 */
export const BUG_DISCOVERER_GROUPS: DiscovererGroup[] = [
    {
        group: '其他',
        options: [
            { value: 'ni44ivb3f', label: '客户', tagClass: 'bg-red-100 text-red-800' },
            { value: 'fz1ucyq94', label: '运营', tagClass: 'bg-amber-50 text-amber-800 border border-amber-200' },
            { value: '8l_px3ic5', label: '财务', tagClass: 'bg-amber-50 text-amber-800 border border-amber-200' },
        ],
    },
    {
        group: '系统',
        options: [
            { value: 'k_x1_h_wz', label: '自动化测试', tagClass: 'bg-slate-100 text-slate-700' },
            { value: 'nprb0vbwo', label: '巡检(拨测)平台', tagClass: 'bg-yellow-100 text-yellow-800' },
            { value: '9izhmhih76', label: '日志告警', tagClass: 'bg-slate-100 text-slate-700' },
        ],
    },
    {
        group: '内部',
        options: [
            { value: 'fck_4ikcj', label: '核对平台', tagClass: 'bg-pink-100 text-pink-800' },
            { value: '1djafdjzn', label: '产品', tagClass: 'bg-violet-100 text-violet-800' },
            { value: 'j__nd637a', label: '开发', tagClass: 'bg-sky-100 text-sky-800' },
            { value: 'h2c8psxg7', label: '测试', tagClass: 'bg-emerald-100 text-emerald-800' },
        ],
    },
];

/** 根据 value 取展示文案（内部下显示为「内部 / 测试」） */
export function getDiscovererLabelByValue(value: string): string {
    for (const grp of BUG_DISCOVERER_GROUPS) {
        const opt = grp.options.find((o) => o.value === value);
        if (opt) return grp.group === '内部' ? `${grp.group} / ${opt.label}` : opt.label;
    }
    return value;
}
