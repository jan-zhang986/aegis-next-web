/**
 * RAG 后端认证服务（aegis-rag-backend）
 * 认证方式：X-API-Key + X-User-ID（无需登录，按用户隔离会话）
 */

/** RAG API Key（从环境变量或硬编码获取） */
const RAG_API_KEY =
  import.meta.env.VITE_RAG_API_KEY ||
  'sk-hAooNSD3gyycL9P1OfYPkTE-4ODFB2GESKl20lnj0VVboR3A';

/**
 * 获取 RAG API Key
 */
export function getRagApiKey(): string {
  return RAG_API_KEY;
}

/**
 * 获取当前登录用户 ID（从 AegisOne 登录态中提取）
 * 用作 X-User-ID header，实现按用户隔离 RAG 会话
 */
export function getCurrentUserId(): string {
  return (
    localStorage.getItem('currentUserId') ||
    localStorage.getItem('userId') ||
    'anonymous'
  );
}
