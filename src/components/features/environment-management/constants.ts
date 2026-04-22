import type { EnvCode } from '@/services/environment';

export const FIXED_VARIABLE_KEYS = [
  'url', 'data_host', 'data_port', 'data_user', 'data_password',
  'mq_url', 'dubbo_url', 'xxjob_url', 'xxljobuser', 'xxljobpassword',
];

export function getEnvCodeColor(code: EnvCode): string {
  switch (code) {
    case 'DEV': return 'bg-blue-100 text-blue-800';
    case 'TST': return 'bg-yellow-100 text-yellow-800';
    case 'PRE': return 'bg-orange-100 text-orange-800';
    case 'PRD': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
