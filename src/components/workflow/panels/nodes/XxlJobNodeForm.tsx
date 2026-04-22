import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { INPUT_STYLE, TEXTAREA_STYLE } from '../shared/constants';
import type { XxlJobConfig } from '../../types';

interface XxlJobNodeFormProps {
  config: XxlJobConfig;
  onChange: (config: XxlJobConfig) => void;
  projectId?: string;
}

export const XxlJobNodeForm: React.FC<XxlJobNodeFormProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<XxlJobConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-0">
      <Section title="任务配置">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel required>执行器处理器</FormLabel>
            <Input
              placeholder="autoCreateReturnFulfill"
              value={config.executor_handler || ''}
              onChange={(e) => updateConfig({ executor_handler: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              执行器 Handler 名称（必需）
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel>执行参数</FormLabel>
            <Textarea
              placeholder='任务执行参数（JSON格式，例如：{"key": "value"}）'
              value={config.executor_param || ''}
              onChange={(e) => updateConfig({ executor_param: e.target.value })}
              className={cn("min-h-[80px]", TEXTAREA_STYLE)}
            />
            <p className="text-xs text-gray-500">
              任务执行参数，JSON 字符串格式（可选）
            </p>
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
            <p className="text-xs text-gray-500">
              站点租户标识（可选，默认: DEFAULT）
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel>机器地址</FormLabel>
            <Textarea
              placeholder="填一个即可，如 192.168.1.1:9999"
              value={config.address_list || ''}
              onChange={(e) => updateConfig({ address_list: e.target.value.trim() || undefined })}
              className={cn("min-h-[80px]", TEXTAREA_STYLE)}
            />
            <p className="text-xs text-gray-500">
              填一个即可，多个用换行或逗号分隔（可选）
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel>输出变量名</FormLabel>
            <Input
              placeholder="job_result"
              value={config.output_variable || ''}
              onChange={(e) => updateConfig({ output_variable: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              执行结果输出到该变量（可选）
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
};
