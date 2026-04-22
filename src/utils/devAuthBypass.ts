/**
 * 开发环境是否跳过登录校验。
 * - 默认：npm run dev 时直接进入主应用，无需登录。
 * - 若需在本地调试完整登录流程：在项目根目录 .env.local 中设置 VITE_REQUIRE_LOGIN_IN_DEV=true
 * - 仍可通过 ?bypass=true 或 localStorage「bypass-auth」= true 在「强制登录」模式下临时绕过。
 */
export function isDevAuthBypass(): boolean {
  if (!import.meta.env.DEV) {
    return false;
  }
  if (import.meta.env.VITE_REQUIRE_LOGIN_IN_DEV === 'true') {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('bypass') === 'true') {
        return true;
      }
    } catch {
      /* ignore */
    }
    return localStorage.getItem('bypass-auth') === 'true';
  }
  return true;
}
