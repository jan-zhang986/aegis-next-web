/**
 * 缺陷原因：非必填、单选，一级/二级枚举
 * value 使用「一级_二级」保证唯一（同名前缀区分）；无二级的一级 value 即名称
 */

export interface DefectReasonGroup {
    group: string;
    options: { value: string; label: string }[];
}

function opt(group: string, label: string): { value: string; label: string } {
    const value = group === label ? label : `${group}_${label}`;
    return { value, label };
}

export const BUG_DEFECT_REASON_GROUPS: DefectReasonGroup[] = [
    {
        group: '开发原因',
        options: [
            opt('开发原因', '逻辑问题'),
            opt('开发原因', '兼容适配问题'),
            opt('开发原因', '接口时序问题'),
            opt('开发原因', '三方依赖问题'),
            opt('开发原因', '性能问题'),
            opt('开发原因', '前端跨域问题'),
            opt('开发原因', '异常处理不足'),
            opt('开发原因', '接口调用错误'),
            opt('开发原因', '开发设计遗漏'),
            opt('开发原因', '配置问题'),
            opt('开发原因', '操作不当'),
            opt('开发原因', '夹带私货上线'),
            opt('开发原因', '未经测试上线'),
        ],
    },
    {
        group: '产品逻辑',
        options: [
            opt('产品逻辑', '产品设计遗漏'),
            opt('产品逻辑', 'PRD未更新'),
            opt('产品逻辑', '新需求'),
            opt('产品逻辑', '回归遗漏'),
        ],
    },
    {
        group: '漏测',
        options: [
            opt('漏测', '用例未设计'),
            opt('漏测', '用例未执行'),
            opt('漏测', '紧急需求用例未设计'),
        ],
    },
    {
        group: '环境问题',
        options: [opt('环境问题', '环境问题')],
    },
    {
        group: 'UX原因',
        options: [opt('UX原因', 'UX原因')],
    },
    {
        group: '用户体验',
        options: [
            opt('用户体验', '操作不当'),
            opt('用户体验', '用户习惯变更'),
        ],
    },
    {
        group: '数据问题',
        options: [
            opt('数据问题', '上线数据订正'),
            opt('数据问题', '上游数据变更'),
            opt('数据问题', 'OA 数据订正'),
            opt('数据问题', '缺乏测试数据'),
        ],
    },
    {
        group: '渠道问题',
        options: [
            opt('渠道问题', 'AMZ 变更'),
            opt('渠道问题', 'AMZ 业务波动'),
            opt('渠道问题', '仓库系统业务变更'),
            opt('渠道问题', '仓库系统业务波动'),
        ],
    },
    {
        group: '上/下游问题',
        options: [
            opt('上/下游问题', '底层组件问题'),
            opt('上/下游问题', '上游数据变更'),
            opt('上/下游问题', '上游服务波动'),
            opt('上/下游问题', '上游服务变动'),
        ],
    },
];

/** 所有可选项的 value 列表（用于校验/回显） */
export const BUG_DEFECT_REASON_VALUES = BUG_DEFECT_REASON_GROUPS.flatMap((g) =>
    g.options.map((o) => o.value)
);
