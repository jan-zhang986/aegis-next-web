export const TYPE_CONFIG: Record<string, { name: string; icon: string; id: string; category: string }> = {
  'API': { name: 'HTTP接口', icon: '🔌', id: 'metadata-http', category: 'http' },
  'SQL': { name: 'SQL操作', icon: '📊', id: 'metadata-sql', category: 'sql' },
  'DUBBO': { name: 'DUBBO服务', icon: '🔄', id: 'metadata-dubbo', category: 'dubbo' },
  'ROCKETMQ': { name: 'RocketMQ消息', icon: '🚀', id: 'metadata-mq', category: 'rocketmq' },
  'FILE': { name: '文件上传', icon: '📁', id: 'metadata-file', category: 'file' },
  'SCRIPT': { name: '造数工厂', icon: '🏭', id: 'metadata-script', category: 'script' },
};

