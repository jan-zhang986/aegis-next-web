/**
 * E2E 空间相关类型定义
 * 从 E2ESpaceDetailPage.tsx 提取
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
 * 用户信息（E2E 空间）
 */
export interface E2EUserInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * E2E 空间详情页 Props
 */
export interface E2ESpaceDetailPageProps {
  space: any; // E2ESpace 类型从服务导入
  onBack: () => void;
}
