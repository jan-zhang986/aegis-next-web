import type { PrdDocumentView, QualityAnalysis, QualityWorkItem } from '@/services/quality-workspace';
import type { WorkspaceReferenceBundle } from './workspace-trace-utils';

export interface WorkspaceDocumentMockBundle {
  analysis: QualityAnalysis;
  cases: Array<QualityWorkItem & { taskType?: string }>;
  referenceBundle: WorkspaceReferenceBundle;
  prdView: PrdDocumentView;
}

const MOCK_WORK_ITEM_IDS = {
  loginSuccess: 'mock-wi-login-001',
  loginFail: 'mock-wi-login-002',
  captcha: 'mock-wi-login-003',
  orderList: 'mock-wi-reg-001',
  paymentNotify: 'mock-wi-joint-001',
} as const;

export function buildWorkspaceDocumentMock(workspaceId: string, projectId: string): WorkspaceDocumentMockBundle {
  const analysisId = 'mock-analysis-001';

  const analysis: QualityAnalysis = {
    analysisId,
    workspaceId,
    projectId,
    title: '【演示】用户登录改造 · 测试分析',
    status: 'DRAFT',
    reviewStatus: 'NOT_SUBMITTED',
    summary: '演示数据：展示需求资料、测分章节、测试点与用例的板块联动效果。',
    inputs: [
      {
        inputId: 'mock-input-prd',
        inputType: 'PRD',
        title: '用户登录改造 PRD v2.3',
        refUrl: 'https://example.feishu.cn/docx/mock-login-prd',
      },
      {
        inputId: 'mock-input-design',
        inputType: 'TECH_DESIGN',
        title: '登录服务技术方案',
        refUrl: 'https://example.feishu.cn/docx/mock-login-design',
      },
    ],
    sections: [
      {
        sectionId: 'mock-sec-overview',
        sectionKey: 'OVERVIEW',
        title: '概述',
        sort: 1,
        content:
          '本次改造涉及账号密码登录、验证码登录两条主链路。\n背景：旧版登录缺少设备指纹校验，需在 Q2 版本补齐。\n相关方：产品 @张三，研发 @李四，测试 @王五。',
      },
      {
        sectionId: 'mock-sec-req',
        sectionKey: 'REQUIREMENT_ANALYSIS',
        title: '需求分析',
        sort: 2,
        content:
          '主链路：输入账号 → 校验格式 → 调用 auth 服务 → 下发 token。\n分支：密码错误 5 次锁定、验证码过期、多端互踢。\n疑问：锁定策略是否按账号还是按设备？需评审确认。',
      },
      {
        sectionId: 'mock-sec-func',
        sectionKey: 'FUNCTIONAL_TEST',
        title: '功能测试',
        sort: 3,
        content:
          '覆盖正常登录、错误密码、验证码错误/过期、账号锁定、remember-me、退出登录。\n重点关注 token 刷新与多端登录策略。',
      },
      {
        sectionId: 'mock-sec-nf',
        sectionKey: 'NON_FUNCTIONAL',
        title: '非功能',
        sort: 4,
        enabled: true,
        content: '登录接口需支持 200 QPS；验证码发送需幂等，60s 内同手机号不重复发送。',
      },
      {
        sectionId: 'mock-sec-reg',
        sectionKey: 'REGRESSION',
        title: '回归',
        sort: 5,
        content: '回归个人中心展示、订单列表鉴权、支付回调 token 校验三条历史主流程。',
      },
      {
        sectionId: 'mock-sec-joint',
        sectionKey: 'JOINT_CASE',
        title: '联调',
        sort: 6,
        content: '与消息中心联调验证码下发；与订单服务联调登录态切换后的列表刷新。',
      },
    ],
    items: [
      {
        itemId: 'mock-item-1',
        sectionKey: 'OVERVIEW',
        itemType: 'QUESTION',
        title: '锁定策略按账号还是设备',
        description: 'PRD 未明确，评审时需与产品确认',
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-2',
        sectionKey: 'REQUIREMENT_ANALYSIS',
        itemType: 'RISK',
        title: '多端互踢时旧 token 失效窗口',
        description: '可能存在 30s 内双端同时有效',
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-3',
        sectionKey: 'FUNCTIONAL_TEST',
        itemType: 'FUNCTIONAL_POINT',
        title: '密码正确时登录成功并返回 token',
        workItemId: MOCK_WORK_ITEM_IDS.loginSuccess,
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-4',
        sectionKey: 'FUNCTIONAL_TEST',
        itemType: 'FUNCTIONAL_POINT',
        title: '连续 5 次密码错误触发锁定',
        workItemId: MOCK_WORK_ITEM_IDS.loginFail,
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-5',
        sectionKey: 'FUNCTIONAL_TEST',
        itemType: 'FUNCTIONAL_POINT',
        title: '验证码错误/过期提示与重试',
        workItemId: MOCK_WORK_ITEM_IDS.captcha,
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-6',
        sectionKey: 'FUNCTIONAL_TEST',
        itemType: 'FUNCTIONAL_POINT',
        title: 'remember-me 7 天内免登录',
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-7',
        sectionKey: 'REGRESSION',
        itemType: 'REGRESSION',
        title: '订单列表需携带有效 token',
        workItemId: MOCK_WORK_ITEM_IDS.orderList,
        status: 'OPEN',
        selected: true,
      },
      {
        itemId: 'mock-item-8',
        sectionKey: 'JOINT_CASE',
        itemType: 'JOINT_CASE',
        title: '验证码下发后 60s 内不可重复发送',
        workItemId: MOCK_WORK_ITEM_IDS.paymentNotify,
        status: 'OPEN',
        selected: true,
      },
    ],
  };

  const cases: Array<QualityWorkItem & { taskType?: string }> = [
    {
      workItemId: MOCK_WORK_ITEM_IDS.loginSuccess,
      workspaceId,
      taskId: 'mock-task-func',
      title: 'TC-LOGIN-001 正确账号密码登录成功',
      status: 'TODO',
      result: 'PASS',
      taskType: 'FUNCTIONAL',
    },
    {
      workItemId: MOCK_WORK_ITEM_IDS.loginFail,
      workspaceId,
      taskId: 'mock-task-func',
      title: 'TC-LOGIN-002 连续错误密码触发锁定',
      status: 'TODO',
      result: 'TODO',
      taskType: 'FUNCTIONAL',
    },
    {
      workItemId: MOCK_WORK_ITEM_IDS.captcha,
      workspaceId,
      taskId: 'mock-task-func',
      title: 'TC-LOGIN-003 验证码错误与过期分支',
      status: 'TODO',
      result: 'TODO',
      taskType: 'FUNCTIONAL',
    },
    {
      workItemId: MOCK_WORK_ITEM_IDS.orderList,
      workspaceId,
      taskId: 'mock-task-reg',
      title: 'TC-REG-001 订单列表鉴权回归',
      status: 'TODO',
      result: 'PASS',
      taskType: 'REGRESSION',
    },
    {
      workItemId: MOCK_WORK_ITEM_IDS.paymentNotify,
      workspaceId,
      taskId: 'mock-task-joint',
      title: 'TC-JOINT-001 验证码发送幂等联调',
      status: 'TODO',
      result: 'BLOCKED',
      taskType: 'JOINT',
    },
  ];

  const referenceBundle: WorkspaceReferenceBundle = {
    prdUrl: 'https://example.feishu.cn/docx/mock-login-prd',
    designUrl: 'https://example.feishu.cn/docx/mock-login-design',
    apiDocUrl: 'https://example.apifox.cn/mock-auth-api',
    targetName: '用户登录改造',
  };

  const prdView: PrdDocumentView = {
    documentId: 'mock-prd-doc-001',
    workspaceId,
    projectId,
    title: '用户登录改造 PRD v2.3',
    contentHash: 'mock-hash',
    lineCount: 48,
    sourceType: 'MARKDOWN',
    sourceRef: referenceBundle.prdUrl,
    nodes: [
      {
        nodeId: 'mock-node-1',
        parentId: '',
        level: 1,
        sort: 0,
        title: '用户登录改造 PRD',
        body: '# 用户登录改造 PRD\n\n本次改造涉及账号密码登录、验证码登录两条主链路。',
        analysisContent: '本次改造涉及账号密码登录、验证码登录两条主链路。\n背景：旧版登录缺少设备指纹校验。',
        itemCount: 1,
        caseCount: 0,
        lineNum: 1,
      },
      {
        nodeId: 'mock-node-2',
        parentId: 'mock-node-1',
        level: 2,
        sort: 0,
        title: '1. 需求背景',
        body: '## 1. 需求背景\n\n主链路：输入账号 → 校验格式 → 调用 auth 服务 → 下发 token。',
        analysisContent: '主链路：输入账号 → 校验格式 → 调用 auth 服务 → 下发 token。\n疑问：锁定策略是否按账号还是按设备？',
        itemCount: 1,
        caseCount: 0,
        lineNum: 3,
      },
      {
        nodeId: 'mock-node-3',
        parentId: 'mock-node-1',
        level: 2,
        sort: 1,
        title: '2. 功能范围',
        body: '## 2. 功能范围\n\n覆盖正常登录、错误密码、验证码错误/过期、账号锁定。',
        analysisContent: '覆盖正常登录、错误密码、验证码错误/过期、账号锁定、remember-me、退出登录。',
        itemCount: 2,
        caseCount: 2,
        lineNum: 8,
      },
      {
        nodeId: 'mock-node-4',
        parentId: 'mock-node-1',
        level: 2,
        sort: 2,
        title: '3. 非功能需求',
        body: '## 3. 非功能需求\n\n登录接口需支持 200 QPS。',
        analysisContent: '登录接口需支持 200 QPS；验证码发送需幂等。',
        itemCount: 0,
        caseCount: 0,
        lineNum: 14,
      },
    ],
  };

  return { analysis, cases, referenceBundle, prdView };
}

/** demo=1 强制开启；demo=0 强制关闭；开发环境默认开启便于预览 */
export function resolveWorkspaceDocumentDemoEnabled(search: string, devAuto = true) {
  const params = new URLSearchParams(search);
  const explicit = params.get('demo');
  if (explicit === '0') return false;
  if (explicit === '1' || params.get('mock') === '1') return true;
  return devAuto && import.meta.env.DEV;
}

export function isWorkspaceDocumentDemoEnabled(search: string) {
  return resolveWorkspaceDocumentDemoEnabled(search, false);
}
