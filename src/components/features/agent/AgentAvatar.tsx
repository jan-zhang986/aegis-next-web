/**
 * 智能体头像
 * 从 aegis-rag-frontend AgentAvatar.vue 迁移
 */

import { useMemo } from 'react';
import { cn } from '@/utils/cn';

const GRADIENTS = [
  { from: '#667eea', to: '#764ba2' },
  { from: '#4facfe', to: '#00f2fe' },
  { from: '#43e97b', to: '#38f9d7' },
  { from: '#11998e', to: '#38ef7d' },
  { from: '#5ee7df', to: '#b490ca' },
  { from: '#48c6ef', to: '#6f86d6' },
  { from: '#a8edea', to: '#fed6e3' },
  { from: '#667db6', to: '#0082c8' },
  { from: '#36d1dc', to: '#5b86e5' },
  { from: '#56ab2f', to: '#a8e063' },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

interface AgentAvatarProps {
  name: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function AgentAvatar({ name, size = 'medium', className }: AgentAvatarProps) {
  const letter = useMemo(() => {
    const n = name?.trim() || '';
    if (!n) return '?';
    const first = n.charAt(0);
    return /[a-zA-Z]/.test(first) ? first.toUpperCase() : first;
  }, [name]);

  const gradient = useMemo(() => {
    const hash = hashCode(name || '');
    return GRADIENTS[hash % GRADIENTS.length];
  }, [name]);

  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0 overflow-hidden',
        size === 'small' && 'w-[22px] h-[22px] rounded-[5px]',
        size === 'medium' && 'w-8 h-8 rounded-lg shadow-sm',
        size === 'large' && 'w-12 h-12 rounded-xl shadow-sm',
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      }}
    >
      <span
        className={cn(
          'relative z-10 text-white font-semibold',
          size === 'small' && 'text-[11px]',
          size === 'medium' && 'text-sm',
          size === 'large' && 'text-xl'
        )}
      >
        {letter}
      </span>
    </div>
  );
}
