import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { INPUT_STYLE } from '../shared/constants';
import type { SleepConfig } from '../../types';

interface SleepNodeFormProps {
  config: SleepConfig;
  onChange: (config: SleepConfig) => void;
}

export const SleepNodeForm: React.FC<SleepNodeFormProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<SleepConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-0">
      <Section title="休眠配置">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel required>休眠时间</FormLabel>
            <Input
              type="text"
              placeholder={'1 或 ${waitTime}'}
              value={config.duration !== undefined ? String(config.duration) : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  updateConfig({ duration: undefined });
                } else {
                  // 如果输入的是纯数字，转换为数字；否则保持字符串（支持变量）
                  const numValue = Number(value);
                  if (!isNaN(numValue) && value.trim() === String(numValue)) {
                    updateConfig({ duration: numValue });
                  } else {
                    updateConfig({ duration: value });
                  }
                }
              }}
              className={cn("w-full", INPUT_STYLE)}
            />
            <p className="text-xs text-gray-500">
              支持数字（如：1）或变量表达式（如：{`\${waitTime}`}），单位由下方选择器决定
            </p>
          </div>

          <div className="space-y-2">
            <FormLabel>时间单位</FormLabel>
            <Select
              value={config.unit || 'seconds'}
              onValueChange={(value) => updateConfig({ unit: value as 'seconds' | 'milliseconds' })}
            >
              <SelectTrigger className={cn("w-full", INPUT_STYLE)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">秒 (seconds)</SelectItem>
                <SelectItem value="milliseconds">毫秒 (milliseconds)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">默认：秒</p>
          </div>

          <div className="space-y-2">
            <FormLabel>休眠模式</FormLabel>
            <Select
              value={config.mode || 'blocking'}
              onValueChange={(value) => updateConfig({ mode: value as 'blocking' | 'non_blocking' | 'async' })}
            >
              <SelectTrigger className={cn("w-full", INPUT_STYLE)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocking">阻塞式 (blocking)</SelectItem>
                <SelectItem value="non_blocking">非阻塞式 (non_blocking)</SelectItem>
                <SelectItem value="async">异步式 (async)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">默认：阻塞式</p>
          </div>

          <div className="space-y-2">
            <FormLabel>休眠原因</FormLabel>
            <Input
              type="text"
              placeholder="流程暂停"
              value={config.reason || ''}
              onChange={(e) => updateConfig({ reason: e.target.value || undefined })}
              className={cn("w-full", INPUT_STYLE)}
            />
            <p className="text-xs text-gray-500">可选，用于记录休眠的原因</p>
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="font-medium mb-2">休眠模式说明：</div>
            <div className="space-y-1">
              <div>• <span className="text-blue-600 font-mono">阻塞式</span>：阻塞当前线程，适用于单线程场景</div>
              <div>• <span className="text-blue-600 font-mono">非阻塞式</span>：使用线程，不阻塞主线程</div>
              <div>• <span className="text-blue-600 font-mono">异步式</span>：使用异步方式，适合异步执行环境</div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};
