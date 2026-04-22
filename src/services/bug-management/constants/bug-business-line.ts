/**
 * 业务线枚举：四级结构（一级 -> 二级 -> 分组 -> 选项）
 */

export interface BusinessLineGroup {
    group: string;
    options: { value: string; label: string }[];
}

/** 第二级：如 客户关系、营销中心（商家&运营下） */
export interface BusinessLineSecondLevel {
    group: string;
    children: BusinessLineGroup[];
}

/** 最上面的一级 */
export interface BusinessLineTopLevel {
    group: string;
    children: BusinessLineSecondLevel[];
}

export const BUG_BUSINESS_LINE_TOP_LEVEL: BusinessLineTopLevel[] = 
[
  {
    group: '商家&运营',
    children: [
      {
        group: '客户关系',
        children: [
          {
            group: 'CRM',
            options: [
              {
                value: '667929fa910c73c27d58e2e2',
                label: '客户管理'
              },
              {
                value: '66792a0b9cd4daf3f2236d76',
                label: '售前报价'
              },
              {
                value: '66792a5ce6f243593cbea4f9',
                label: '合同管理'
              },
              {
                value: '66792a759cd4daf3f2236d77',
                label: '渠道管理'
              },
              {
                value: '66792a88910c73c27d58e2e3',
                label: '销售管理'
              },
              {
                value: '674434ffcc2d9ec9e2f5ae35',
                label: '数据看板'
              },
              {
                value: '6744352d880daeaee5defe2c',
                label: '工作台'
              }
            ]
          },
          {
            group: '供应商',
            options: [
              {
                value: '663b579461f5181f8b669984',
                label: '供应商管理'
              },
              {
                value: '66792b96d473d0a1a6abd44b',
                label: '运营日志'
              },
              {
                value: '66792bc29cfb8c47fdbd6bf7',
                label: '标签管理'
              },
              {
                value: '66792bd3910c73c27d58e2e4',
                label: '数据表现'
              },
              {
                value: '66792bdf8e134edc80856f75',
                label: '绩效管理'
              },
              {
                value: '66792c046482393162aa1dc1',
                label: '合同台账'
              }
            ]
          },
          {
            group: 'CSM',
            options: [
              {
                value: '6744354ccc2d9ec9e2f5ae36',
                label: '咨询类工单'
              },
              {
                value: '67443556b195ed4cc9c0a3c1',
                label: '智能客服'
              }
            ]
          },
          {
            group: '平台规则',
            options: [
              {
                value: '67455e0c33ee6c0bac34a7f9',
                label: '平台规则'
              }
            ]
          },
          {
            group: '其它',
            options: [
              {
                value: '667ab75c8e134edc80856f96',
                label: '其它'
              }
            ]
          },
          {
            group: '客户管理',
            options: [
              {
                value: '6899ad71a52e141882e9a010',
                label: '客户信息'
              },
              {
                value: '6899ade8c775b3f15e219c6d',
                label: '客户标签'
              },
              {
                value: '6899adef37fb9d5ad2887d4f',
                label: '客户来源'
              },
              {
                value: '6899adf5b61e6887a8c84c38',
                label: '客户阶段'
              },
              {
                value: '6899adfd37fb9d5ad2887d50',
                label: '客户公海'
              },
              {
                value: '6899ae05307e734a309f5d46',
                label: '数据同步'
              }
            ]
          },
          {
            group: '联系人管理',
            options: [
              {
                value: '6899ae1ba581729c4dfc1db5',
                label: '联系人信息'
              },
              {
                value: '6899ae2278f648f44212be6f',
                label: '联系人关系网'
              }
            ]
          },
          {
            group: '线索管理',
            options: [
              {
                value: '6899aea5c775b3f15e219c6f',
                label: '线索获取'
              },
              {
                value: '6899aeab78f648f44212be71',
                label: '线索清洗'
              },
              {
                value: '6899aeb2a52e141882e9a012',
                label: '线索分配'
              },
              {
                value: '6899aeb8dda07a916539775d',
                label: '线索转化'
              },
              {
                value: '6899aec099a76d146be290e6',
                label: '线索回收'
              }
            ]
          },
          {
            group: '商机管理',
            options: [
              {
                value: '6899aecb74b1e900f14e171b',
                label: '商机培育'
              },
              {
                value: '6899aed199a76d146be290e7',
                label: '商机转化'
              }
            ]
          },
          {
            group: '合同管理',
            options: [
              {
                value: '6899aeef3c248f877174effd',
                label: 'SEVC 采购合同'
              },
              {
                value: '6899aee27ae23b08cdd10063',
                label: '补充协议'
              },
              {
                value: '6899af0cc5df6c51b93beaa3',
                label: 'SEVC 账期条款'
              },
              {
                value: '6899af15c775b3f15e219c70',
                label: '线上签约'
              },
              {
                value: '6899af1bd43d351987748a38',
                label: '流程配置'
              }
            ]
          },
          {
            group: '售前报价',
            options: [
              {
                value: '6899af2bd43d351987748a39',
                label: '报价上传'
              },
              {
                value: '6899af30b61e6887a8c84c39',
                label: '审核处理'
              },
              {
                value: '6899af3611de3902f68ae2bc',
                label: '智能报价'
              },
              {
                value: '6899af3c1a87287cf9ec25b4',
                label: '流程配置'
              }
            ]
          },
          {
            group: '业务管理',
            options: [
              {
                value: '6899af61dda07a916539775e',
                label: '客户拜访'
              },
              {
                value: '6899af67ebea94d8ba2d86bf',
                label: '工作周报'
              },
              {
                value: '6899af6c9db5f6e43e7534ac',
                label: '客户清退'
              }
            ]
          },
          {
            group: '数据看板',
            options: [
              {
                value: '6899af7d70b80bfb78161581',
                label: '指标仪表盘'
              },
              {
                value: '6899af8abcc248f2b64360a6',
                label: '明细报告'
              }
            ]
          },
          {
            group: '客户服务',
            options: [
              {
                value: '6899af95ebea94d8ba2d86c1',
                label: '智能客服'
              },
              {
                value: '6899af9b9db5f6e43e7534ad',
                label: '客服工单'
              },
              {
                value: '6899afa685a954b004948b0a',
                label: '内部协同'
              }
            ]
          },
          {
            group: '供应商管理',
            options: [
              {
                value: '6899afb2b81b0366a066d968',
                label: '供应商信息'
              },
              {
                value: '6899afc611de3902f68ae2bd',
                label: '供应商标签'
              },
              {
                value: '6899afd215b57bdd44374f92',
                label: '生命周期'
              },
              {
                value: '6899afe0b61e6887a8c84c3a',
                label: '数据表现'
              },
              {
                value: '6899affc99a76d146be290e8',
                label: '供应商状态'
              },
              {
                value: '6899b00ee76c8669b7a76ee2',
                label: '评论'
              },
              {
                value: '6899b0142c56b147cd5a328c',
                label: '操作日志'
              },
              {
                value: '6899b01fb81b0366a066d969',
                label: '合同与条款'
              }
            ]
          },
          {
            group: '基础建设',
            options: [
              {
                value: '689ab7ad342b395259d68ca8',
                label: '交互视觉'
              },
              {
                value: '689ab7b3e3f7103b36833a17',
                label: '权限管理'
              },
              {
                value: '689ab7b93c248f877174f002',
                label: '消息中心'
              },
              {
                value: '689ab82c2913c47377ae3953',
                label: '导出中心'
              }
            ]
          }
        ]
      },
      {
        group: '营销中心',
        children: [
          {
            group: '营销活动',
            options: [
              {
                value: '66792e63910c73c27d58e2e6',
                label: 'AMZ Coupon'
              },
              {
                value: '66792e8d9e3b88dff995778b',
                label: 'Promo Code'
              },
              {
                value: '66792eb2e6f243593cbea4fa',
                label: 'Price Discount'
              },
              {
                value: '66792e739e3b88dff995778a',
                label: 'Best Deal'
              },
              {
                value: '66792eccb93c1fa1fcf9da82',
                label: 'Lightning Deal'
              },
              {
                value: '6899c7d770b80bfb78161582',
                label: 'AMZ 订购省'
              },
              {
                value: '674436a833ee6c0bac34a7e1',
                label: '通用能力'
              }
            ]
          },
          {
            group: '广告系统',
            options: [
              {
                value: '66792f22f2a33fb1197a5d43',
                label: 'SP'
              },
              {
                value: '66792f2ce6f243593cbea4fb',
                label: 'SD'
              },
              {
                value: '66792f36d473d0a1a6abd44c',
                label: 'SB'
              },
              {
                value: '66792f478e134edc80856f76',
                label: '广告组合'
              },
              {
                value: '6899c8094492568a028bc60d',
                label: 'AMZ 广告授权'
              },
              {
                value: '6899c81028252e39e2ec5b8b',
                label: '供应商广告授权'
              },
              {
                value: '6899c822812487ae9d4639d6',
                label: 'AMZ 广告报告'
              },
              {
                value: '6899c831812487ae9d4639d7',
                label: 'AMZ 智能广告'
              },
              {
                value: '67443bbaa8bd1a896f63edac',
                label: '广告基建'
              }
            ]
          },
          {
            group: '渠道管理',
            options: [
              {
                value: '66792f0e9cfb8c47fdbd6bf8',
                label: 'SAS Promotion'
              },
              {
                value: '663b579461f5181f8b66998b',
                label: 'OD邮箱'
              },
              {
                value: '6899c88111de3902f68ae2be',
                label: '任务中心'
              },
              {
                value: '6899c886342b395259d68c9f',
                label: '通知中心'
              }
            ]
          },
          {
            group: '合规风控',
            options: [
              {
                value: '6899c8b6dda07a9165397760',
                label: 'Product Certificates'
              },
              {
                value: '6899c8bc28252e39e2ec5b8c',
                label: 'Product Compliance'
              },
              {
                value: '6899c8aec775b3f15e219c73',
                label: 'AMZ POA'
              }
            ]
          },
          {
            group: '数据报告',
            options: [
              {
                value: '6899c8e8d43d351987748a3b',
                label: 'AMZ 销售报告'
              },
              {
                value: '6899c8efdda07a9165397762',
                label: 'AMZ 退货报告'
              },
              {
                value: '6899c8e0812487ae9d4639d8',
                label: '控制塔'
              }
            ]
          },
          {
            group: '帮助体系',
            options: [
              {
                value: '674436c7fb9a275486910421',
                label: '初始化引导'
              },
              {
                value: '67443ae3dc657aed546e0194',
                label: '步骤式引导'
              },
              {
                value: '67443af3a8f9d493b6b077fb',
                label: '体验反馈'
              }
            ]
          },
          {
            group: '知识库',
            options: [
              {
                value: '663b579461f5181f8b66997f',
                label: '知识库'
              }
            ]
          },
          {
            group: '行动计划',
            options: [
              {
                value: '663b579461f5181f8b669981',
                label: '行动计划'
              }
            ]
          },
          {
            group: '操作日志',
            options: [
              {
                value: '663b579461f5181f8b669980',
                label: '操作日志'
              }
            ]
          },
          {
            group: '业务管理',
            options: [
              {
                value: '66792c57910c73c27d58e2e5',
                label: '工作台'
              }
            ]
          },
          {
            group: '智能化运营',
            options: [
              {
                value: '663b579461f5181f8b669986',
                label: '营收管理'
              },
              {
                value: '66793cb09cfb8c47fdbd6bfa',
                label: '发货建议'
              },
              {
                value: '66793cbd9cd4daf3f2236d78',
                label: 'Review监测'
              }
            ]
          },
          {
            group: '客服系统（废弃）',
            options: [
              {
                value: '663b579461f5181f8b66997d',
                label: '客服系统（废弃）'
              }
            ]
          },
          {
            group: '其它',
            options: [
              {
                value: '667ab765e6f243593cbea512',
                label: '其它'
              }
            ]
          },
          {
            group: '基础建设',
            options: [
              {
                value: '689ab87ec775b3f15e219c78',
                label: '交互视觉'
              },
              {
                value: '689ab883a581729c4dfc1dbb',
                label: '权限管理'
              },
              {
                value: '689ab888427943bddf615941',
                label: '消息中心'
              },
              {
                value: '689ab88dac1776e0e7ae428c',
                label: '导出中心'
              }
            ]
          }
        ]
      },
      {
        group: '商品中心',
        children: [
          {
            group: '品牌管理',
            options: [
              {
                value: '6899c4f04492568a028bc60c',
                label: '品牌入驻'
              },
              {
                value: '6899c4f5078060dd3e7e3c74',
                label: '品牌授权'
              },
              {
                value: '6899c5012c56b147cd5a328d',
                label: '商标审查'
              },
              {
                value: '6899c506e3f7103b36833a09',
                label: '流程配置'
              }
            ]
          },
          {
            group: '产品中心',
            options: [
              {
                value: '667aae2a9e3b88dff99577c5',
                label: '产品管理'
              },
              {
                value: '6899c519420ed3721ee1cc5f',
                label: '产品导入'
              },
              {
                value: '6899c51fa52e141882e9a013',
                label: '产品信息'
              },
              {
                value: '667aae459cd4daf3f2236d8a',
                label: '类目管理'
              },
              {
                value: '6899c52715b57bdd44374f93',
                label: '数据同步'
              }
            ]
          },
          {
            group: '价格中心',
            options: [
              {
                value: '6899c56ea581729c4dfc1db6',
                label: '报价申请'
              },
              {
                value: '6899c5755f61969739eb571e',
                label: '审核处理'
              },
              {
                value: '6899c57adda07a916539775f',
                label: '智能报价'
              },
              {
                value: '6899c580dbe197213ff3bb5e',
                label: '流程配置'
              },
              {
                value: '6899c58abcfb5c817cb154a1',
                label: '调价发起'
              },
              {
                value: '6899c591342b395259d68c9e',
                label: '调价校验'
              },
              {
                value: '6899c5977ae23b08cdd10065',
                label: '流程配置'
              },
              {
                value: '6899c5a1c775b3f15e219c72',
                label: 'VC 报价协议'
              },
              {
                value: '6899c5aa9db5f6e43e7534af',
                label: 'VC 报价测算'
              },
              {
                value: '6899c5c9e76c8669b7a76ee3',
                label: 'VC 利润估算'
              }
            ]
          },
          {
            group: '渠道产品中心',
            options: [
              {
                value: '66795ed968badb862e5c4e2f',
                label: '类目管理'
              },
              {
                value: '66795eef706223ea53dc588b',
                label: '品牌管理'
              },
              {
                value: '66795efc427dc2a4fae3eae9',
                label: 'Listing上传'
              },
              {
                value: '6899c5fbb81b0366a066d96a',
                label: 'DF 克隆'
              },
              {
                value: '6899c60674b1e900f14e171c',
                label: 'Listing 同步'
              },
              {
                value: '6899c60b85a954b004948b0d',
                label: 'Listing 管理'
              },
              {
                value: '6899c611ebea94d8ba2d86c2',
                label: 'Listing 接单状态'
              },
              {
                value: '6899c615ebea94d8ba2d86c3',
                label: 'Listing 操作日志'
              },
              {
                value: '6899c61bc5df6c51b93beab8',
                label: 'Listing 解析'
              },
              {
                value: '6899c6203e1004d083caae9c',
                label: 'Main Listing'
              },
              {
                value: '66795f1188dc2cc20467cd60',
                label: 'Shipify产品中心'
              },
              {
                value: '66795f1eee7d5435b635855d',
                label: 'Temu产品中心'
              },
              {
                value: '66795f2a06e6ffbbb24621f5',
                label: 'Tiktok产品中心'
              }
            ]
          },
          {
            group: '产品工具',
            options: [
              {
                value: '6899c66a48a7a0c2c4f91792',
                label: '产品分析'
              },
              {
                value: '6899c66f1a87287cf9ec25ca',
                label: 'AMZ NPPM Data'
              },
              {
                value: '6899c6758ff08e07702281e2',
                label: 'AMZ Listing 监控'
              },
              {
                value: '6899c682b61e6887a8c84c43',
                label: '价格监控'
              }
            ]
          },
          {
            group: '业务工单',
            options: [
              {
                value: '6679610906e6ffbbb24621f7',
                label: '图片'
              },
              {
                value: '66796118706223ea53dc588c',
                label: '视频'
              },
              {
                value: '66796122706223ea53dc588d',
                label: 'A+'
              },
              {
                value: '667961336849d28808cc80cf',
                label: 'Variation'
              },
              {
                value: '66796149ee7d5435b6358560',
                label: 'Newer Model'
              },
              {
                value: '667961564d74a1a5df8b4aa1',
                label: '目录变更'
              },
              {
                value: '667961619c18c775caf18006',
                label: '包装认证'
              }
            ]
          },
          {
            group: '渠道管理',
            options: [
              {
                value: '6899c705307e734a309f5d49',
                label: '账号费率'
              },
              {
                value: '6899c71299a76d146be29101',
                label: 'SAS Catalog'
              },
              {
                value: '6899c719427943bddf61593e',
                label: 'SAS Others'
              }
            ]
          },
          {
            group: 'SAS系统',
            options: [
              {
                value: '66795f539cbc7ad912aafbff',
                label: 'Price'
              },
              {
                value: '66795f65427dc2a4fae3eaea',
                label: 'Catalog & Brand'
              }
            ]
          },
          {
            group: '报价中心',
            options: [
              {
                value: '66795e6868badb862e5c4e2e',
                label: '产品调价-对客'
              },
              {
                value: '66795e784d74a1a5df8b4aa0',
                label: '产品报价-对客'
              },
              {
                value: '66795e8f06e6ffbbb24621f4',
                label: '产品调价-对渠道'
              },
              {
                value: '674412375d344f85eb312dcd',
                label: '产品报价-对渠道'
              }
            ]
          },
          {
            group: '业务管理',
            options: [
              {
                value: '682e9b7c9c907e3795600753',
                label: '工作台'
              }
            ]
          },
          {
            group: '数据分析',
            options: [
              {
                value: '663b579461f5181f8b66998c',
                label: '运营管理池'
              },
              {
                value: '66795fc0ee7d5435b635855f',
                label: '产品分析'
              },
              {
                value: '66795fd688dc2cc20467cd61',
                label: 'NPPM管理池'
              },
              {
                value: '66795fe86849d28808cc80ce',
                label: 'Listing质量看板'
              },
              {
                value: '682efb00d66c9415da6fa5ca',
                label: 'Reports'
              }
            ]
          },
          {
            group: '渠道账号管理',
            options: [
              {
                value: '667961909c18c775caf18008',
                label: 'VC账号健康'
              },
              {
                value: '6679619d9c18c775caf18009',
                label: '费率管理'
              }
            ]
          },
          {
            group: '其它',
            options: [
              {
                value: '667ab770d430da01882188cd',
                label: '其它'
              }
            ]
          },
          {
            group: '数据报告',
            options: [
              {
                value: '6899c92f4bca2e2a6fd7af43',
                label: 'AMZ 类目报告 '
              },
              {
                value: '6899c934c5df6c51b93beab9',
                label: 'AMZ  客户之声'
              },
              {
                value: '6899c93bb0a1615eb26739d5',
                label: 'AMZ Concession hub'
              },
              {
                value: '6899c92577588eff8c6d03b4',
                label: '控制塔'
              }
            ]
          },
          {
            group: '基础建设',
            options: [
              {
                value: '689ab9324bca2e2a6fd7af46',
                label: '交互视觉'
              },
              {
                value: '689ab93a342b395259d68ca9',
                label: '权限管理'
              },
              {
                value: '689ab93e2c56b147cd5a32a9',
                label: '消息中心'
              },
              {
                value: '689ab9457ae23b08cdd1006a',
                label: '导出中心'
              }
            ]
          }
        ]
      },
      {
        group: '其他',
        children: [
          {
            group: '多渠道站点',
            options: [
              {
                value: '668e3620b67baae56c47fdf0',
                label: '多渠道站点'
              }
            ]
          }
        ]
      },
      {
        group: '公共基建',
        children: [
          {
            group: '工作台',
            options: [
              {
                value: '6899c9b4bcfb5c817cb154a2',
                label: 'CRM 工作台'
              },
              {
                value: '6899c9bd4492568a028bc60e',
                label: 'SEVC 工作台'
              },
              {
                value: '6899c9c79d6d793664aa79c0',
                label: 'Gmesh 工作台'
              },
              {
                value: '6899c9ccbcfb5c817cb154a3',
                label: 'CSM 工作台'
              },
              {
                value: '6899c9d14d4b9dbae7d9b1e6',
                label: 'Corin 工作台'
              }
            ]
          },
          {
            group: 'SEVC 平台设施',
            options: [
              {
                value: '6899c9dcbcfb5c817cb154a4',
                label: 'SEVC 账户注册'
              },
              {
                value: '6899c9e946b6e865241237bc',
                label: 'SEVC 站点权限'
              },
              {
                value: '6899c9ef3c248f877174effe',
                label: 'SEVC 消息接收人'
              },
              {
                value: '6899c9f8307e734a309f5d4a',
                label: 'SEVC 平台规则'
              },
              {
                value: '6899c9fd4492568a028bc60f',
                label: 'SEVC 初始化引导'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    group: '效率协同',
    children: [
      {
        group: '业务中台',
        children: [
          {
            group: '权限中心',
            options: [
              {
                value: '667aaf12d473d0a1a6abd469',
                label: '账号管理'
              },
              {
                value: '667aaf1ff2a33fb1197a5d70',
                label: '租户管理'
              },
              {
                value: '667aaf2c6482393162aa1de6',
                label: '组织架构'
              },
              {
                value: '690af395d654a498cb04daaf',
                label: '成员管理'
              },
              {
                value: '667aaf46910c73c27d58e310',
                label: '应用管理'
              },
              {
                value: '690af3c2ddd12c2394256ca6',
                label: '资源管理'
              },
              {
                value: '690af344a0e8eb6bfbc67c50',
                label: '角色管理'
              },
              {
                value: '690af34bf42007a912488831',
                label: '数据权限'
              },
              {
                value: '69450805fb5500dc42a303a5',
                label: '模拟登录'
              },
              {
                value: '694b5f8d65f9e909ae095e46',
                label: '临时权限申请'
              },
              {
                value: '667aaf5ff2a33fb1197a5d71',
                label: '渠道站点管理'
              },
              {
                value: '667aaf6ab93c1fa1fcf9daa7',
                label: '日志管理'
              }
            ]
          },
          {
            group: '消息中心',
            options: [
              {
                value: '667aaee5b93c1fa1fcf9daa5',
                label: '邮件通知'
              },
              {
                value: '667aaef087e15fa070b1e1cf',
                label: '飞书通知'
              },
              {
                value: '667aaef89cfb8c47fdbd6c0d',
                label: '短信通知'
              },
              {
                value: '667aaed79cd4daf3f2236d8b',
                label: '站内信'
              },
              {
                value: '690af2b8557c1a4fbae35f31',
                label: '系统更新通知'
              },
              {
                value: '690af2d44d83a8b161cc9e13',
                label: '消息徽标及消息中心'
              }
            ]
          },
          {
            group: '开放平台',
            options: [
              {
                value: '69413cf169d1bbf7e0737935',
                label: '开放平台官网'
              },
              {
                value: '69413d946bd4ff38582d4ef9',
                label: '客户开放API需求'
              },
              {
                value: '694b5e5047e2674bb8c41a90',
                label: 'API 信息管理'
              },
              {
                value: '695233341246bdf84e70ba45',
                label: '项目管理'
              }
            ]
          },
          {
            group: '文件服务',
            options: [
              {
                value: '67455e64da77fd9be1d4b225',
                label: '导出中心'
              },
              {
                value: '67455e6a12214548a2f9b64a',
                label: '云存储'
              },
              {
                value: '69670823966201d8d883d893',
                label: '文件中心'
              }
            ]
          },
          {
            group: '审计中心',
            options: [
              {
                value: '67455e0591973c7278adb66f',
                label: '操作日志'
              }
            ]
          },
          {
            group: '帮助中心',
            options: [
              {
                value: '690af99bdbf7b6dd80fea08e',
                label: 'Feedback'
              },
              {
                value: '690afa1182cb2691c52656d4',
                label: '帮助文档'
              },
              {
                value: '690afa1ef060bf15f4c57775',
                label: '智能客服'
              }
            ]
          },
          {
            group: '国际化平台',
            options: [
              {
                value: '667aaf8a9cfb8c47fdbd6c0f',
                label: '国际化平台'
              }
            ]
          },
          {
            group: 'SPOTTER 官网',
            options: [
              {
                value: '67455e3dbd9a9d14114f52bd',
                label: '国内官网'
              },
              {
                value: '67455e4491973c7278adb670',
                label: '海外官网'
              }
            ]
          },
          {
            group: '业务工作台',
            options: [
              {
                value: '6751106002f7d12d5f7e225a',
                label: 'Gmesh工作台'
              },
              {
                value: '6751106a488816fb65c38b3d',
                label: 'SEVC工作台'
              }
            ]
          },
          {
            group: '任务中心',
            options: [
              {
                value: '6942225bfc462716f83f3eaa',
                label: '任务中心'
              }
            ]
          }
        ]
      },
      {
        group: '技术中台',
        children: [
          {
            group: '表单引擎',
            options: [
              {
                value: '663b579461f5181f8b669988',
                label: '表单引擎'
              }
            ]
          },
          {
            group: '流程引擎',
            options: [
              {
                value: '674562b2468ce1e37c86f733',
                label: '流程配置'
              }
            ]
          },
          {
            group: '定时调度',
            options: [
              {
                value: '667aafb7d7cd8f3ddc2f3608',
                label: '定时调度'
              }
            ]
          },
          {
            group: '研发能效洞察平台',
            options: [
              {
                value: '667aafca9cd4daf3f2236d8c',
                label: '研发能效洞察平台'
              }
            ]
          },
          {
            group: '一致性引擎',
            options: [
              {
                value: '667aafe39cfb8c47fdbd6c10',
                label: '弱一致性-重试组件'
              },
              {
                value: '667aafed8e134edc80856f94',
                label: '强一致性-分布式事务'
              }
            ]
          },
          {
            group: '智能助手',
            options: [
              {
                value: '667ab00ef2a33fb1197a5d72',
                label: '业务助手'
              },
              {
                value: '667ab017f2a33fb1197a5d73',
                label: '研发助手'
              },
              {
                value: '667ab01fe6f243593cbea511',
                label: '客户助手'
              }
            ]
          },
          {
            group: '技术博客建设',
            options: [
              {
                value: '667ab041d7cd8f3ddc2f3609',
                label: '技术博客建设'
              }
            ]
          },
          {
            group: '技术氛围建设',
            options: [
              {
                value: '667ab02ad430da01882188cc',
                label: '技术氛围建设'
              }
            ]
          },
          {
            group: '统一告警平台',
            options: [
              {
                value: '690af9e7ddd12c2394256ca7',
                label: '统一告警平台'
              }
            ]
          },
          {
            group: '中间件',
            options: [
              {
                value: '690afc008545434229e6665c',
                label: '中间件'
              }
            ]
          },
          {
            group: 'SRE',
            options: [
              {
                value: '690afc09a0e8eb6bfbc67c56',
                label: 'SRE'
              }
            ]
          },
          {
            group: '二方包',
            options: [
              {
                value: '690afc144ebf6aadfba72524',
                label: '二方包'
              }
            ]
          },
          {
            group: '规则引擎',
            options: [
              {
                value: '694111451398832543623a62',
                label: '规则引擎'
              }
            ]
          }
        ]
      },
      {
        group: '质量中台',
        children: [
          {
            group: 'AegisOnes',
            options: [
              {
                value: '6945111e379c73800208b8ac',
                label: 'AegisOnes'
              }
            ]
          },
          {
            group: 'AegisSnap',
            options: [
              {
                value: '694511824c236f6cf0a9e01f',
                label: 'AegisSnap'
              }
            ]
          },
          {
            group: 'AegisVigil',
            options: [
              {
                value: '694511b15ba13f58d7f248cd',
                label: 'AegisVigil'
              }
            ]
          },
          {
            group: 'AegisEngine',
            options: [
              {
                value: '694511e94e8b124898143093',
                label: 'AegisEngine'
              }
            ]
          }
        ]
      },
      {
        group: '设计中台',
        children: [
          {
            group: '多渠道站点',
            options: [
              {
                value: '668d02c11eeb6836676ef672',
                label: '多渠道站点'
              }
            ]
          },
          {
            group: '体验反馈',
            options: [
              {
                value: '672ae77e8a93da022a2949d8',
                label: '体验反馈'
              }
            ]
          },
          {
            group: 'UI&UX优化',
            options: [
              {
                value: '668e459208a5882c2d7a904a',
                label: '内置页签'
              },
              {
                value: '67455ebda0190c78b55b805f',
                label: '一致性优化'
              },
              {
                value: '67455ed612214548a2f9b64b',
                label: 'UI 优化'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    group: '供应链',
    children: [
      {
        group: '订单履约',
        children: [
          {
            group: '订单',
            options: [
              {
                value: '667e2daea8b2528f0854b1fa',
                label: '订单'
              }
            ]
          },
          {
            group: '售后',
            options: [
              {
                value: '667e2db871f771fe90517569',
                label: '售后'
              }
            ]
          },
          {
            group: '履约单',
            options: [
              {
                value: '667e2dc0d770169c39efbbc7',
                label: '履约单'
              }
            ]
          },
          {
            group: '开放平台',
            options: [
              {
                value: '667e2dc9a8b2528f0854b1fb',
                label: '开放平台'
              }
            ]
          },
          {
            group: '渠道库存',
            options: [
              {
                value: '667e2dd0a8b2528f0854b1fc',
                label: '渠道库存'
              }
            ]
          }
        ]
      },
      {
        group: '仓储平台',
        children: [
          {
            group: '出库',
            options: [
              {
                value: '663b579461f5181f8b669994',
                label: '出库'
              }
            ]
          },
          {
            group: '库存',
            options: [
              {
                value: '663b579461f5181f8b669995',
                label: '库存'
              }
            ]
          },
          {
            group: '入库',
            options: [
              {
                value: '663b579461f5181f8b669996',
                label: '入库'
              }
            ]
          },
          {
            group: '增值服务',
            options: [
              {
                value: '663b579461f5181f8b669997',
                label: '增值服务'
              }
            ]
          },
          {
            group: '基础配置',
            options: [
              {
                value: '663b579461f5181f8b669998',
                label: '基础配置'
              }
            ]
          },
          {
            group: '在库',
            options: [
              {
                value: '667e2dee53c01d27d4d391d5',
                label: '在库'
              }
            ]
          },
          {
            group: '渠道对接',
            options: [
              {
                value: '667e2df361ffc00a3d1ecf35',
                label: '渠道对接'
              }
            ]
          },
          {
            group: '货品',
            options: [
              {
                value: '667e2dfdd770169c39efbbc8',
                label: '货品'
              }
            ]
          }
        ]
      },
      {
        group: '物流平台',
        children: [
          {
            group: '物流单',
            options: [
              {
                value: '663b579461f5181f8b66999a',
                label: '物流单'
              }
            ]
          },
          {
            group: '头程',
            options: [
              {
                value: '667e2e5453c01d27d4d391d6',
                label: '头程'
              }
            ]
          },
          {
            group: '渠道对接',
            options: [
              {
                value: '667e2e5a61ffc00a3d1ecf36',
                label: '渠道对接'
              }
            ]
          },
          {
            group: '亚马逊shipment',
            options: [
              {
                value: '667e2e63f6e41a490097fc10',
                label: '亚马逊shipment'
              }
            ]
          },
          {
            group: '地址库',
            options: [
              {
                value: '667e2e6b53c01d27d4d391d7',
                label: '地址库'
              }
            ]
          }
        ]
      },
      {
        group: '其他',
        children: [
          {
            group: '多渠道站点',
            options: [
              {
                value: '668e363d8562e4d965daeae5',
                label: '多渠道站点'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    group: '金融&财会',
    children: [
      {
        group: '多渠道结算',
        children: [
          {
            group: '核对项目',
            options: [
              {
                value: '663b579461f5181f8b6699a1',
                label: '核对项目'
              }
            ]
          },
          {
            group: '货款结算',
            options: [
              {
                value: '6891ce05e56f4345b6443abc',
                label: '货款结算'
              }
            ]
          },
          {
            group: 'VC应收结算',
            options: [
              {
                value: '6891ce0f5145d70392e01722',
                label: 'VC应收结算'
              }
            ]
          },
          {
            group: '结算中心',
            options: [
              {
                value: '6891cec89425313eb021dcab',
                label: '结算中心'
              }
            ]
          }
        ]
      },
      {
        group: '供应链结算',
        children: [
          {
            group: 'GDS结算',
            options: [
              {
                value: '6891ccf1ca5b3ff7ae9a9b84',
                label: 'GDS结算'
              }
            ]
          },
          {
            group: '票据',
            options: [
              {
                value: '663b579461f5181f8b6699a0',
                label: '票据'
              }
            ]
          },
          {
            group: '财务凭证',
            options: [
              {
                value: '663b579461f5181f8b6699a3',
                label: '财务凭证'
              }
            ]
          },
          {
            group: '核算',
            options: [
              {
                value: '6891ccdc5b9001e97123b754',
                label: '核算'
              }
            ]
          },
          {
            group: '税务',
            options: [
              {
                value: '689d94447ae23b08cdd100ab',
                label: '税务'
              }
            ]
          }
        ]
      },
      {
        group: '金融支付',
        children: [
          {
            group: '金融',
            options: [
              {
                value: '6891c9e23b4123183b5012b8',
                label: '金融'
              }
            ]
          },
          {
            group: '支付',
            options: [
              {
                value: '6891c9ee43dfb418a1555ca3',
                label: '支付'
              }
            ]
          },
          {
            group: '资金',
            options: [
              {
                value: '6891cb133b4123183b5012b9',
                label: '资金'
              }
            ]
          },
          {
            group: '广告',
            options: [
              {
                value: '67bd2a450ed75d2adedd6df5',
                label: '广告'
              }
            ]
          }
        ]
      },
      {
        group: '其他',
        children: [
          {
            group: '多渠道站点',
            options: [
              {
                value: '668e3652efa02940d694ef33',
                label: '多渠道站点'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    group: '业务引擎',
    children: [
      {
        group: '数据服务',
        children: [
          {
            group: '[领域]MessageExplorer消息检索',
            options: [
              {
                value: '663b579461f5181f8b6699b0',
                label: '[领域]MessageExplorer消息检索'
              }
            ]
          },
          {
            group: '爬虫服务',
            options: [
              {
                value: '663b579461f5181f8b6699ae',
                label: '爬虫服务'
              }
            ]
          },
          {
            group: '[领域]取数服务',
            options: [
              {
                value: '663b579461f5181f8b6699a6',
                label: '[领域]取数服务'
              }
            ]
          },
          {
            group: '数据加工',
            options: [
              {
                value: '663b579461f5181f8b6699a8',
                label: '数据加工'
              }
            ]
          },
          {
            group: '采集网关',
            options: [
              {
                value: '663b579461f5181f8b6699a9',
                label: '采集引擎'
              },
              {
                value: '663b579461f5181f8b6699a5',
                label: '业务网关'
              },
              {
                value: '663b579461f5181f8b6699a7',
                label: '任务调度'
              }
            ]
          },
          {
            group: '渠道安全',
            options: [
              {
                value: '663b579461f5181f8b6699b1',
                label: '渠道对接网关'
              },
              {
                value: '663b579461f5181f8b6699aa',
                label: '认证维护'
              }
            ]
          },
          {
            group: '数据监控',
            options: [
              {
                value: '670f2ddc61fac8d10de2f1c7',
                label: '数据监控'
              }
            ]
          }
        ]
      },
      {
        group: '数据平台',
        children: [
          {
            group: '数据资产',
            options: [
              {
                value: '664db68df89811d6fa2f8425',
                label: '数据资产'
              }
            ]
          },
          {
            group: 'Dataverse',
            options: [
              {
                value: '663b579461f5181f8b6699b3',
                label: 'Dataverse'
              }
            ]
          },
          {
            group: '数据服务',
            options: [
              {
                value: '664db6c30eaf573a813809bb',
                label: '数据服务'
              }
            ]
          },
          {
            group: '权限中心',
            options: [
              {
                value: '664db6d69bb4c2245bac8549',
                label: '权限中心'
              }
            ]
          },
          {
            group: '指标库',
            options: [
              {
                value: '664db6ef70fe6292e13f7eb1',
                label: '指标库'
              }
            ]
          },
          {
            group: '报表中心',
            options: [
              {
                value: '664dba5c9916ac16b571772b',
                label: '报表中心'
              }
            ]
          },
          {
            group: '多维分析',
            options: [
              {
                value: '66cee8710e786fef07fd77e6',
                label: '多维分析'
              }
            ]
          },
          {
            group: '实时查询',
            options: [
              {
                value: '670f398c103b940bc80a08e6',
                label: '实时查询'
              }
            ]
          },
          {
            group: '数据标签',
            options: [
              {
                value: '684695a394fe4b2ec73b1e4d',
                label: '数据标签'
              }
            ]
          },
          {
            group: '调度中心',
            options: [
              {
                value: '687df056136fbf8e1a4a1610',
                label: '调度中心'
              }
            ]
          },
          {
            group: '其他',
            options: [
              {
                value: '68ca6ae238cc1480b7e139ab',
                label: '导出中心'
              }
            ]
          },
          {
            group: '指标监控',
            options: [
              {
                value: '6954ca3e4c01e6789e8d6501',
                label: '指标监控'
              }
            ]
          }
        ]
      },
      {
        group: '数据开发',
        children: [
          {
            group: '数据工程',
            options: [
              {
                value: '670f2e0a61fac8d10de2f1c8',
                label: '数据处理'
              },
              {
                value: '670f2e55b4e13e8c64ef5e3b',
                label: '数据架构'
              },
              {
                value: '670f2efdb93af2a38c2171e6',
                label: '数据建模'
              }
            ]
          },
          {
            group: '数据治理',
            options: [
              {
                value: '670f2f2d7f13f5759325432e',
                label: '数据标准'
              },
              {
                value: '670f2f3c61fac8d10de2f1c9',
                label: '数据安全'
              },
              {
                value: '670f2f4cd4a5f6325ae3e7a1',
                label: '数据质量'
              }
            ]
          },
          {
            group: '数据智能',
            options: [
              {
                value: '670f2f65c7a7f792c068f968',
                label: '算法工程'
              },
              {
                value: '670f2f8401c564719fcb3fd2',
                label: 'AI'
              }
            ]
          }
        ]
      },
      {
        group: '其他',
        children: [
          {
            group: '多渠道站点',
            options: [
              {
                value: '668e366a08a5882c2d7a9048',
                label: '多渠道站点'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    group: '数据分析',
    children: [
      {
        group: '经营报告',
        children: [
          {
            group: '营收与利润',
            options: [
              {
                value: '6683792bd465b906fe01a09e',
                label: '营收与利润'
              }
            ]
          },
          {
            group: '订单',
            options: [
              {
                value: '66827e50c6ddb5cfff3e6c77',
                label: '订单'
              }
            ]
          },
          {
            group: '业务分析',
            options: [
              {
                value: '66827f69399039addc5fc93a',
                label: '业务分析'
              }
            ]
          }
        ]
      },
      {
        group: '商家管理',
        children: [
          {
            group: '供应商',
            options: [
              {
                value: '66827f9ca957502f0caa1941',
                label: '供应商'
              }
            ]
          },
          {
            group: '产品',
            options: [
              {
                value: '66827fb8a957502f0caa1942',
                label: '产品'
              }
            ]
          }
        ]
      },
      {
        group: '渠道表现',
        children: [
          {
            group: 'Sales',
            options: [
              {
                value: '66828123c6ddb5cfff3e6c78',
                label: 'Sales'
              }
            ]
          },
          {
            group: 'Forecasting',
            options: [
              {
                value: '66828144a957502f0caa1943',
                label: 'Forecasting'
              }
            ]
          },
          {
            group: '促销活动',
            options: [
              {
                value: '6682815586102e4136eda6a2',
                label: '促销活动'
              }
            ]
          },
          {
            group: '广告',
            options: [
              {
                value: '6682816286102e4136eda6a3',
                label: '广告'
              }
            ]
          }
        ]
      },
      {
        group: '财务',
        children: [
          {
            group: '成本分析',
            options: [
              {
                value: '66828191a957502f0caa1944',
                label: '成本分析'
              }
            ]
          },
          {
            group: '渠道发票',
            options: [
              {
                value: '668281b0d465b906fe01a088',
                label: '渠道发票'
              }
            ]
          },
          {
            group: '供应链费用',
            options: [
              {
                value: '668281c717cbe26cfe50d5b2',
                label: '供应链费用'
              }
            ]
          },
          {
            group: '金融风控',
            options: [
              {
                value: '66837a698e29809b1da51973',
                label: '金融风控'
              }
            ]
          }
        ]
      },
      {
        group: 'RSE分析',
        children: [
          {
            group: '合规&运营',
            options: [
              {
                value: '68fae055747c1738b343aa15',
                label: '合规&运营'
              }
            ]
          },
          {
            group: '渠道&促销',
            options: [
              {
                value: '68fae068bd1bb28c9932de8e',
                label: '渠道&促销'
              }
            ]
          },
          {
            group: 'CRM',
            options: [
              {
                value: '68fae078aca043a2ae53eb81',
                label: 'CRM'
              }
            ]
          }
        ]
      },
      {
        group: 'GDS分析',
        children: [
          {
            group: '仓储',
            options: [
              {
                value: '66827ff1a93d2c24218dbe1b',
                label: '出入库'
              },
              {
                value: '668280111ebcbb8b75cc8ce0',
                label: '库存'
              },
              {
                value: '6682802817cbe26cfe50d5b0',
                label: '库内运作'
              }
            ]
          },
          {
            group: '物流',
            options: [
              {
                value: '668280501ebcbb8b75cc8ce1',
                label: 'SPT物流'
              },
              {
                value: '66828065641b6d8b1e3b015f',
                label: 'VC物流'
              },
              {
                value: '66828079599e426e8912e25e',
                label: '尾程物流'
              }
            ]
          }
        ]
      },
      {
        group: 'PLUT分析',
        children: [
          {
            group: '金融业务',
            options: [
              {
                value: '68fae09776a8978f72cbcf49',
                label: '金融业务'
              }
            ]
          },
          {
            group: '贸易&回款',
            options: [
              {
                value: '68fae0bb583e9a26817d39cc',
                label: '贸易&回款'
              }
            ]
          },
          {
            group: '风控',
            options: [
              {
                value: '68fae0c9747c1738b343aa16',
                label: '风控'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    group: 'DTC',
    children: []
  }
];

/** 根据 value 取展示 label（用于回显） */
export function getBusinessLineLabelByValue(value: string): string {
    for (const top of BUG_BUSINESS_LINE_TOP_LEVEL) {
        for (const sec of top.children) {
            for (const grpItem of sec.children) {
                const item = grpItem.options.find((o) => o.value === value);
                if (item) return item.label;
            }
        }
    }
    return value;
}
