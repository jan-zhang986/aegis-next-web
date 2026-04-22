/**
 * Bug 管理服务统一导出
 * 从 MeterSphere 迁移并转换为 React 格式
 */

export * from './service';
export * from './constants/urls';
export * from './constants/feishu-defect-url';

// 统一导出为 service 对象（可选，保持向后兼容）
import * as bugService from './service';

export const bugManagementService = bugService;
