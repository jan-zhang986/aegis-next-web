/**
 * 商家&运营 业务线下的一级/二级模块结构
 * 用于当业务线选「商家&运营」时的二级选择（可与 DefectReasonSelect 同构）
 */

export interface MerchantOpsGroup {
    group: string;
    options: { value: string; label: string }[];
}

function opt(group: string, label: string): { value: string; label: string } {
    const value = group === label ? label : `${group}_${label}`;
    return { value, label };
}

export const BUG_BUSINESS_LINE_MERCHANT_OPS_GROUPS: MerchantOpsGroup[] = [
    {
        group: '客户管理',
        options: [
            opt('客户管理', '客户信息'),
            opt('客户管理', '客户标签'),
            opt('客户管理', '客户来源'),
            opt('客户管理', '客户阶段'),
            opt('客户管理', '客户公海'),
            opt('客户管理', '数据同步'),
        ],
    },
    {
        group: '联系人管理',
        options: [
            opt('联系人管理', '联系人信息'),
            opt('联系人管理', '联系人关系网'),
        ],
    },
    {
        group: '线索管理',
        options: [
            opt('线索管理', '线索获取'),
            opt('线索管理', '线索清洗'),
            opt('线索管理', '线索分配'),
            opt('线索管理', '线索转化'),
            opt('线索管理', '线索回收'),
        ],
    },
    {
        group: '商机管理',
        options: [
            opt('商机管理', '商机培育'),
            opt('商机管理', '商机转化'),
        ],
    },
    {
        group: '框架合同',
        options: [
            opt('框架合同', 'SEVC 采购合同'),
            opt('框架合同', '补充协议'),
        ],
    },
    {
        group: '结算条款',
        options: [
            opt('结算条款', 'SEVC 账期条款'),
            opt('结算条款', '线上签约'),
            opt('结算条款', '流程配置'),
        ],
    },
    {
        group: '售前报价',
        options: [
            opt('售前报价', '报价上传'),
            opt('售前报价', '审核处理'),
            opt('售前报价', '智能报价'),
            opt('售前报价', '流程配置'),
        ],
    },
    {
        group: '业务管理',
        options: [
            opt('业务管理', '客户拜访'),
            opt('业务管理', '工作周报'),
            opt('业务管理', '客户清退'),
            opt('业务管理', '指标仪表盘'),
            opt('业务管理', '明细报告'),
            opt('业务管理', '智能客服'),
            opt('业务管理', '客服工单'),
            opt('业务管理', '内部协同'),
        ],
    },
    {
        group: '供应商管理',
        options: [
            opt('供应商管理', '供应商信息'),
            opt('供应商管理', '供应商标签'),
            opt('供应商管理', '生命周期'),
            opt('供应商管理', '数据表现'),
            opt('供应商管理', '供应商状态'),
        ],
    },
    {
        group: '供应商基建',
        options: [
            opt('供应商基建', '评论'),
            opt('供应商基建', '操作日志'),
            opt('供应商基建', '合同与条款'),
        ],
    },
    {
        group: '基础建设',
        options: [
            opt('基础建设', '交互视觉'),
            opt('基础建设', '权限管理'),
            opt('基础建设', '消息中心'),
            opt('基础建设', '导出中心'),
        ],
    },
    {
        group: '营销活动',
        options: [
            opt('营销活动', 'AMZ Coupon'),
            opt('营销活动', 'Promo Code'),
            opt('营销活动', 'Price Discount'),
            opt('营销活动', 'Best Deal'),
            opt('营销活动', 'Lightning Deal'),
            opt('营销活动', 'AMZ 订购省'),
            opt('营销活动', '通用能力'),
        ],
    },
    {
        group: '渠道管理',
        options: [
            opt('渠道管理', 'SAS'),
            opt('渠道管理', 'SAS Promotion'),
            opt('渠道管理', 'OD邮箱'),
            opt('渠道管理', '任务中心'),
            opt('渠道管理', '通知中心'),
        ],
    },
    {
        group: 'AMZ 合规认证',
        options: [
            opt('AMZ 合规认证', 'Product Certificates'),
            opt('AMZ 合规认证', 'Product Compliance'),
            opt('AMZ 合规认证', 'AMZ POA'),
        ],
    },
    {
        group: '业务报告',
        options: [
            opt('业务报告', 'AMZ 销售报告'),
            opt('业务报告', 'AMZ 退货报告'),
        ],
    },
    {
        group: '功能分析',
        options: [opt('功能分析', '控制塔')],
    },
    {
        group: 'AMZ 广告活动',
        options: [
            opt('AMZ 广告活动', 'SP'),
            opt('AMZ 广告活动', 'SD'),
            opt('AMZ 广告活动', 'SB'),
            opt('AMZ 广告活动', '广告组合'),
        ],
    },
    {
        group: '广告授权',
        options: [
            opt('广告授权', 'AMZ 广告授权'),
            opt('广告授权', '供应商广告授权'),
        ],
    },
    {
        group: '广告报告',
        options: [opt('广告报告', 'AMZ 广告报告')],
    },
    {
        group: '智能广告',
        options: [opt('智能广告', 'AMZ 智能广告')],
    },
    {
        group: '广告基建',
        options: [
            opt('广告基建', '基础建设'),
            opt('广告基建', '交互视觉'),
            opt('广告基建', '权限管理'),
            opt('广告基建', '消息中心'),
            opt('广告基建', '导出中心'),
        ],
    },
    {
        group: '品牌管理',
        options: [opt('品牌管理', '品牌入驻')],
    },
];

/** 根据 value 取展示 label（用于回显） */
export function getMerchantOpsLabelByValue(value: string): string {
    for (const grp of BUG_BUSINESS_LINE_MERCHANT_OPS_GROUPS) {
        const item = grp.options.find((o) => o.value === value);
        if (item) return item.label;
    }
    return value;
}
