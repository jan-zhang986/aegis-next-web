/**
 * Message Management Module
 * 消息管理模块 - 使用代码分割优化加载性能
 */

import { lazy } from 'react';

// 使用动态 import 延迟加载组件
export const MessageManagementPage = lazy(() => 
  import('./MessageManagementPage').then(module => ({ 
    default: module.MessageManagementPage 
  }))
);

export const MessageConfigList = lazy(() => 
  import('./MessageConfigList').then(module => ({ 
    default: module.MessageConfigList 
  }))
);

export const RobotList = lazy(() => 
  import('./RobotList').then(module => ({ 
    default: module.RobotList 
  }))
);

export const RobotFormDialog = lazy(() => 
  import('./RobotFormDialog').then(module => ({ 
    default: module.RobotFormDialog 
  }))
);

// 导出类型
export type { MessageManagementPageProps } from './MessageManagementPage';
