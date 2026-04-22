import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormLabel } from './FormLabel';
import { INPUT_STYLE } from './constants';
import type { AssertionRule } from '../../types';

interface InlineAssertionRulesProps {
  rules: AssertionRule[];
  onChange: (rules: AssertionRule[] | null) => void;
}

export const InlineAssertionRules: React.FC<InlineAssertionRulesProps> = ({ rules = [], onChange }) => {
  const currentRules = rules || [];
  const addRule = () => {
    const newRule: AssertionRule = {
      source: '',
      operator: 'equals',
      target: '',
      message: '',
    };
    const currentRules = rules || [];
    onChange([...currentRules, newRule]);
  };

  const updateRule = (index: number, updates: Partial<AssertionRule>) => {
    const newRules = [...currentRules];
    newRules[index] = { ...newRules[index], ...updates };
    onChange(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = currentRules.filter((_, i) => i !== index);
    // 如果删除后 rules 为空数组，传递 null 以清空 assertion 对象
    onChange(newRules.length === 0 ? null : newRules);
  };

  const operatorOptions = [
    { value: 'equals', label: '等于 (equals)' },
    { value: 'not_equal', label: '不等于 (not_equal)' },
    { value: 'greater_than', label: '大于 (greater_than)' },
    { value: 'less_than', label: '小于 (less_than)' },
    { value: 'greater_or_equals', label: '大于等于 (greater_or_equals)' },
    { value: 'less_or_equals', label: '小于等于 (less_or_equals)' },
    { value: 'string_equals', label: '字符串等于 (string_equals)' },
    { value: 'length_equal', label: '长度等于 (length_equal)' },
    { value: 'is_boolean', label: '为布尔类型 (is_boolean)' },
  ];

  return (
    <div className="space-y-4">
      {currentRules.map((rule, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">规则 {index + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeRule(index);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <FormLabel required>数据源字段</FormLabel>
            <Input
              placeholder="response.status 或 $.data.id"
              value={rule.source || ''}
              onChange={(e) => updateRule(index, { source: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel required>操作符</FormLabel>
            <Select
              value={rule.operator || 'equals'}
              onValueChange={(value) => updateRule(index, { operator: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <FormLabel>目标值</FormLabel>
            <Input
              placeholder={rule.operator === 'is_boolean' ? 'true 或 false' : '期望值'}
              value={rule.target !== undefined ? String(rule.target) : ''}
              onChange={(e) => updateRule(index, { target: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>错误消息</FormLabel>
            <Input
              placeholder="断言失败时的提示信息（可选）"
              value={rule.message || ''}
              onChange={(e) => updateRule(index, { message: e.target.value })}
              className={INPUT_STYLE}
              autoComplete="off"
            />
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addRule}
      >
        <Plus className="w-3 h-3 mr-1" />
        添加断言规则
      </Button>
    </div>
  );
};

