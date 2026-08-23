# AegisOne Web (AegisOne 自动化测试平台前端)

> **One** 代表一站式测试解决方案（All-in-One Testing Platform）

基于 React 18 + TypeScript + Vite + Tailwind CSS + Radix UI 构建的现代化 API 与工作流测试平台前端。AegisOne Web 提供完整的用例管理、测试计划、测试工厂、脑图评审、WebSocket 实时打屏与数据可视化等一站式测试解决方案。

与服务端 [`aegis-next-server`](https://github.com/jan-zhang986/vanguard-testops) 及执行引擎 [`aegis-runner`](https://github.com/jan-zhang986/aegis-runner) 完全打通。

---

## 📖 项目亮点

- 🎯 **One Platform** - 一个平台，覆盖接口测试、UI 自动化、工作流编排与报告全生命周期
- 🔄 **Real-Time Streaming** - 基于 WebSocket 实现节点级别的执行日志与步骤状态实时高亮打屏
- ⚡ **High Performance** - 采用 React 18 虚拟列表、Vite 极速热重载与现代化单页路由

---

## 📋 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

---

## 🚀 快速开始

```bash
# 1. 克隆或进入项目目录
cd aegis-next-web

# 2. 安装所有依赖
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 即可体验。

---

## 🛠️ 项目目录结构

```
aegis-next-web/
├── src/
│   ├── assets/              # 静态资源 (图片、图标)
│   ├── components/          # React 组件
│   │   ├── features/        # 功能业务组件 (Workflow, Case, Plan, Bug, Setting)
│   │   ├── layouts/         # 页面布局组件 (TopNavigation, LeftSidebar)
│   │   └── ui/              # Radix UI + Tailwind 基础原子组件
│   ├── config/              # 路由与全局配置
│   ├── hooks/               # 自定义 React Hooks (useWebSocket, useCaseList 等)
│   ├── pages/               # 页面级入口组件
│   ├── services/            # API 请求服务 (Axios / Fetch)
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数 (auth, request, tracking)
├── index.html               # 页面入口
├── vite.config.ts           # Vite 构建配置
└── tailwind.config.js       # Tailwind CSS 样式配置
```

---

## 🎯 可用命令

```bash
# 启动本地开发服务器
npm run dev

# 执行 TypeScript 类型检查与代码构建
npm run build

# 本地预览构建产物
npm run preview
```
