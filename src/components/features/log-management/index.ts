/**
 * Log Management Module
 * 日志管理模块 - 使用代码分割优化加载性能
 */

import { lazy } from 'react';

// 使用动态 import 延迟加载组件
export const LogManagementPage = lazy(() => 
  import('./LogManagementPage').then(module => ({ 
    default: module.LogManagementPage 
  }))
);

export const LogFilterPanel = lazy(() => 
  import('./LogFilterPanel').then(module => ({ 
    default: module.LogFilterPanel 
  }))
);

export const LogTable = lazy(() => 
  import('./LogTable').then(module => ({ 
    default: module.LogTable 
  }))
);

export const VirtualizedLogTable = lazy(() => 
  import('./VirtualizedLogTable').then(module => ({ 
    default: module.VirtualizedLogTable 
  }))
);

// 导出类型
export type { LogManagementPageProps } from './LogManagementPage';
