import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';
import { Section } from '../shared/Section';
import { FormLabel } from '../shared/FormLabel';
import { TEXTAREA_STYLE } from '../shared/constants';
import type { ConditionConfig } from '../../types';

interface ConditionNodeFormProps {
  config: ConditionConfig;
  onChange: (config: ConditionConfig) => void;
}

export const ConditionNodeForm: React.FC<ConditionNodeFormProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<ConditionConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-0">
      <Section title="条件表达式">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel required>条件表达式</FormLabel>
            <Textarea
              placeholder="response.status == 200 && response.body.success == true"
              value={config.expression || ''}
              onChange={(e) => updateConfig({ expression: e.target.value })}
              className={cn("min-h-[100px]", TEXTAREA_STYLE)}
            />
          </div>
          <div className="text-xs text-gray-500 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="font-medium mb-2">表达式说明：</div>
            <div className="space-y-1">
              <div>• 使用 <span className="text-blue-600 font-mono">==</span> 比较相等</div>
              <div>• 使用 <span className="text-blue-600 font-mono">&&</span> 和 <span className="text-blue-600 font-mono">||</span> 连接条件</div>
              <div>• 使用 <span className="text-blue-600 font-mono">!</span> 取反</div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

