/**
 * 环境选择组件
 * 统一的环境选择下拉框
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserProfile } from '@/services/metadata';

interface EnvSelectProps {
  environments: UserProfile[];
  value: string;
  onChange: (envId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EnvSelect({
  environments,
  value,
  onChange,
  placeholder = '请选择环境',
  className = 'w-40',
  disabled = false,
}: EnvSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {environments.map((env) => (
          <SelectItem key={env.id} value={env.id}>
            {env.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

