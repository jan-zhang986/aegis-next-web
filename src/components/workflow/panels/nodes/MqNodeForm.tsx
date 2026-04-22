import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import { workflowService } from '@/services/workflow';
import type { MqConfig } from '../../types';

interface MqNodeFormProps {
  config: MqConfig;
  onChange: (config: MqConfig) => void;
  projectId?: string;
}

export const MqNodeForm: React.FC<MqNodeFormProps> = ({ config, onChange, projectId }) => {
  // 使用 useRef 保存最新的 onChange 引用
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 初始化 mq_url 字段值（首次创建时设置变量占位符）
  useEffect(() => {
    // 如果 mq_url 为空，则设置为变量占位符
    if (!config.mq_url) {
      onChangeRef.current({ ...config, mq_url: '${mq_url}' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateConfig = (updates: Partial<MqConfig>) => {
    onChange({ ...config, ...updates });
  };


  return (
    <div className="space-y-0">
      <Section title="MQ 配置">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel required>MQ地址</FormLabel>
            <Input
              placeholder="rocketmq://mq.example.com:9876"
              value={config.mq_url || ''}
              onChange={(e) => updateConfig({ mq_url: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              直接填写地址，如需使用变量请填写 $mq_url 或 ${'{mq_url}'} 格式
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel required>Topic</FormLabel>
            <Input
              placeholder="TOPIC_NAME"
              value={config.topic || ''}
              onChange={(e) => updateConfig({ topic: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel required>消息体</FormLabel>
            <Textarea
              placeholder='{"key": "value"}'
              value={config.message_body || ''}
              onChange={(e) => updateConfig({ message_body: e.target.value })}
              className={cn("min-h-[120px]", TEXTAREA_STYLE)}
            />
          </div>

          <div className="space-y-2">
            <FormLabel>站点租户</FormLabel>
            <Input
              placeholder="DEFAULT"
              value={config.site_tenant || ''}
              onChange={(e) => updateConfig({ site_tenant: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>
        </div>
      </Section>

      <Section title="消息标签和键" defaultOpen={false}>
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Tag</FormLabel>
            <Input
              placeholder="*"
              value={config.tag || ''}
              onChange={(e) => updateConfig({ tag: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Key</FormLabel>
            <Input
              placeholder="*"
              value={config.key || ''}
              onChange={(e) => updateConfig({ key: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>
        </div>
      </Section>
    </div>
  );
};

