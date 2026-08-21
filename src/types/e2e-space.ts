/**
 * 用例实现空间相关类型定义
 * 从 CaseRealizationSpaceDetailPage 提取；保留 E2E 命名兼容别名
 */

/**
 * 测试模块
 */
export interface TestModule {
  id: string;
  name: string;
  testCaseCount: number;
  parentId?: string;
  children?: TestModule[];
}

/**
 * 测试用例
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount: number;
  duration?: number;
  status: 'success' | 'failed' | 'not-run';
  lastRun?: string;
  creator: string;
  /** 创建时间（毫秒时间戳），用于排序 */
  createTime?: number;
}

/**
 * 用户信息（用例实现空间）
 */
export interface CaseRealizationUserInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * 用例实现空间详情页 Props
 */
export interface CaseRealizationSpaceDetailPageProps {
  space: any; // E2ESpace 类型从服务导入
  onBack: () => void;
}

/** @deprecated compatibility alias; prefer CaseRealizationUserInfo */
export type E2EUserInfo = CaseRealizationUserInfo;

/** @deprecated compatibility alias; prefer CaseRealizationSpaceDetailPageProps */
export type E2ESpaceDetailPageProps = CaseRealizationSpaceDetailPageProps;
