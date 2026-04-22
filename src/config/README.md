# 路由和 API 配置说明

## 配置文件位置

统一配置文件：`src/config/routes.ts`

## 配置内容

### 1. MeterSphere 后端配置（用例模块 API）

```typescript
METERSPHERE_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8080',  // 本地开发环境
  },
  production: {
    baseUrl: 'http://aegis.tst.spotter.ink',  // 生产环境
  },
}
```

### 2. SnapTest 后端配置（Snap API）

```typescript
SNAPTEST_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8100',  // 本地开发环境
  },
  production: {
    baseUrl: 'http://snaptest.tst.spotter.ink',  // 生产环境
  },
}
```

### 3. 前端路由配置

所有前端路由路径都在 `FRONTEND_ROUTES` 对象中定义。

## 环境变量配置

### 开发环境（.env.development）

```bash
# MeterSphere 后端地址（用例模块 API）
VITE_METERSPHERE_BACKEND_URL=http://localhost:8080

# SnapTest 后端地址（Snap API）
VITE_SNAPTEST_BACKEND_URL=http://localhost:8100
```

### 生产环境（.env.production）

```bash
# MeterSphere 后端地址（用例模块 API）
VITE_METERSPHERE_BACKEND_URL=http://aegis.tst.spotter.ink

# SnapTest 后端地址（Snap API）
VITE_SNAPTEST_BACKEND_URL=http://snaptest.tst.spotter.ink
```

## 使用方法

### 在代码中使用配置

```typescript
import { 
  METERSPHERE_API_BASE_URL, 
  SNAPTEST_API_BASE_URL,
  FRONTEND_ROUTES,
  METERSPHERE_API_PATHS,
  SNAPTEST_API_PATHS
} from '@/config/routes';

// 使用 MeterSphere API
const response = await fetch(`${METERSPHERE_API_BASE_URL}/metrics/dashboard/project-overview`);

// 使用 SnapTest API
const response = await fetch(`${SNAPTEST_API_BASE_URL}/statistics/snaptest/overview`);

// 使用前端路由
navigate(FRONTEND_ROUTES.CASE_MANAGEMENT);
```

## 代理配置

### Vite 开发代理（vite.config.ts）

- MeterSphere API：自动代理到 `VITE_METERSPHERE_BACKEND_URL`
- SnapTest API：自动代理到 `VITE_SNAPTEST_BACKEND_URL`

### Nginx 生产代理（nginx.conf）

- MeterSphere API：代理到 `http://aegis.tst.spotter.ink`
- SnapTest API：代理到 `http://snaptest.tst.spotter.ink`

## 修改配置

1. **修改默认地址**：编辑 `src/config/routes.ts` 中的配置对象
2. **使用环境变量**：在 `.env.development` 或 `.env.production` 中设置 `VITE_*` 变量
3. **修改 Nginx 代理**：编辑 `nginx.conf` 中的 `proxy_pass` 地址

