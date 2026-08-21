// 菜单常量
export const MENU_ITEMS = [
  { id: 'workspace', label: '工作台' },
  { id: 'project-management', label: '项目管理' },
  { id: 'quality-workspace', label: '质量工作台' },
  { id: 'test-case', label: '测试资产' },
  { id: 'api-test', label: '接口测试' },
  { id: 'bug-management', label: '缺陷管理' },
] as const;

// API 类型常量
export const API_TYPES = [
  { id: 'http', name: 'HTTP接口', icon: '🔌' },
  { id: 'sql', name: 'SQL查询', icon: '📊' },
  { id: 'dubbo', name: 'DUBBO服务', icon: '🔄' },
  { id: 'rocketmq', name: 'RocketMQ消息', icon: '🚀' },
  { id: 'tcp', name: 'TCP连接', icon: '📡' },
  { id: 'websocket', name: 'WebSocket', icon: '💬' },
] as const;

// HTTP 方法常量
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

// 测试状态常量
export const TEST_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PENDING: 'pending',
} as const;

// 测试报告预定义标签枚举
export const TEST_REPORT_TAGS = [
  '冒烟测试',
  '一轮测试',
  '回归测试',
  '二轮测试',
  '流水线测试',
] as const;

// 从统一配置导入（已废弃，请使用 @/config/routes 中的配置）
// 保留此导出以保持向后兼容
export { SNAPTEST_API_BASE_URL } from '@/config/routes';
