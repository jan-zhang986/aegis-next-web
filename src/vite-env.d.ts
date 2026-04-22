/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_PREFIX: string
  /** 设为 true 时本地 dev 仍走登录页；默认不设置则 dev 免登录 */
  readonly VITE_REQUIRE_LOGIN_IN_DEV?: string
  // 更多环境变量类型定义...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

