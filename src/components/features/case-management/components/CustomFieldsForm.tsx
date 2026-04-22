/**
 * 用例自定义字段表单
 * 根据 getCaseDefaultFields API 动态渲染
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseLevelOption } from './CaseLevelBadge';
import { CASE_LEVEL_MAP } from '../constants';
import type { CaseCustomField } from '../types';

interface CustomFieldsFormProps {
  fields: CaseCustomField[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
}

export function CustomFieldsForm({
  fields,
  values,
  onChange,
  disabled = false,
}: CustomFieldsFormProps) {
  if (!fields?.length) return null;

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = values[field.fieldId] ?? field.defaultValue ?? '';
        const isRequired = field.required;
        const options = field.options || [];

        if (field.fieldId === 'functional_priority') {
          return (
            <div key={field.fieldId} className="space-y-2">
              <Label>
                {field.fieldName}
                {isRequired && <span className="ml-1 text-red-500">*</span>}
              </Label>
              <Select
                value={String(value)}
                onValueChange={(v) => onChange(field.fieldId, v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CASE_LEVEL_MAP).map(([k]) => (
                    <SelectItem key={k} value={k}>
                      <CaseLevelOption value={k} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        switch (field.type) {
          case 'INPUT':
          case 'MULTIPLE_INPUT':
            return (
              <div key={field.fieldId} className="space-y-2">
                <Label>
                  {field.fieldName}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Input
                  value={Array.isArray(value) ? value.join(', ') : value}
                  onChange={(e) =>
                    onChange(field.fieldId, field.type === 'MULTIPLE_INPUT' ? e.target.value.split(/[,，]/) : e.target.value)
                  }
                  placeholder={`请输入${field.fieldName}`}
                  disabled={disabled}
                />
              </div>
            );
          case 'TEXTAREA':
            return (
              <div key={field.fieldId} className="space-y-2">
                <Label>
                  {field.fieldName}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Textarea
                  value={value}
                  onChange={(e) => onChange(field.fieldId, e.target.value)}
                  placeholder={`请输入${field.fieldName}`}
                  rows={3}
                  disabled={disabled}
                />
              </div>
            );
          case 'SELECT':
          case 'RADIO':
            return (
              <div key={field.fieldId} className="space-y-2">
                <Label>
                  {field.fieldName}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Select
                  value={String(value)}
                  onValueChange={(v) => onChange(field.fieldId, v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          case 'MULTIPLE_SELECT':
          case 'CHECKBOX':
            return (
              <div key={field.fieldId} className="space-y-2">
                <Label>
                  {field.fieldName}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const arr = Array.isArray(value) ? value : value ? [value] : [];
                    const checked = arr.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            const next = c
                              ? [...arr, opt.value]
                              : arr.filter((v) => v !== opt.value);
                            onChange(field.fieldId, next);
                          }}
                          disabled={disabled}
                        />
                        <span className="text-sm">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          case 'INT':
          case 'FLOAT':
            return (
              <div key={field.fieldId} className="space-y-2">
                <Label>
                  {field.fieldName}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    onChange(
                      field.fieldId,
                      field.type === 'INT' ? parseInt(e.target.value, 10) : parseFloat(e.target.value)
                    )
                  }
                  disabled={disabled}
                />
              </div>
            );
          default:
            return (
              <div key={field.fieldId} className="space-y-2">
                <Label>
                  {field.fieldName}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Input
                  value={value}
                  onChange={(e) => onChange(field.fieldId, e.target.value)}
                  disabled={disabled}
                />
              </div>
            );
        }
      })}
    </div>
  );
}
