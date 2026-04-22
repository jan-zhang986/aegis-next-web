# AegisOne Web - spotter 测试平台

> **One** 代表一站式解决方案（All-in-One Solution）

基于 React + TypeScript + Vite + Tailwind CSS 构建的现代化API测试平台。AegisOne Web 提供完整的API测试、数据工厂、Mock服务、工作流自动化等一站式测试解决方案。

## 📖 关于项目名称

**AegisOne** 中的 **"One"** 代表 **一站式解决方案**（All-in-One Solution）。

- 🎯 **One Platform** - 一个平台，覆盖所有测试需求
- 🔄 **One Workflow** - 统一的工作流程，完整测试闭环
- ⚡ **One Solution** - 一站式解决方案，简化团队协作

详见 [项目概述文档](./PROJECT_OVERVIEW.md)

### 📚 知识库（快速了解功能）

新成员或需要快速了解「有哪些功能、怎么导航、代码在哪」时，可查看 **[知识库文档](./docs/知识库.md)**，包含：

- 一级/二级菜单与 URL 对应关系
- 各功能模块说明（工作台、项目管理、测试计划、测试用例、测试工厂、精准测试、缺陷管理、AI 助理）
- 后端配置与目录结构
- 常用查找表

---

## 📋 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 1.22.0

## 🚀 快速开始

### 方式1：使用已有项目（推荐）

如果您已经有项目文件，直接安装依赖即可：

```bash
# 1. 进入项目目录
cd keeper-one-web

# 2. 安装所有依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 方式2：从零创建新项目

如果您需要创建全新的项目环境：

```bash
# 1. 创建新的Vite + React项目
npm create vite@latest keeper-one-web -- --template react-ts

# 2. 进入项目目录
cd keeper-one-web

# 3. 安装基础依赖
npm install

# 4. 安装项目所需的核心包
npm install lucide-react
npm install @radix-ui/react-slot @radix-ui/react-label
npm install @radix-ui/react-tabs @radix-ui/react-select
npm install @radix-ui/react-radio-group @radix-ui/react-scroll-area
npm install @radix-ui/react-switch
npm install class-variance-authority clsx tailwind-merge

# 5. 安装Tailwind CSS及相关工具
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 6. 复制项目文件
# - 复制 components/ 目录
# - 复制 App.tsx
# - 复制 main.tsx
# - 复制 index.html
# - 复制 globals.css
# - 复制 tailwind.config.js
# - 复制 postcss.config.js
# - 复制 vite.config.ts
# - 复制 tsconfig.json

# 7. 运行项目
npm run dev
```

## 📦 完整依赖列表

### 生产依赖 (dependencies)

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@radix-ui/react-slot": "^1.1.2",
  "@radix-ui/react-label": "^2.1.2",
  "@radix-ui/react-select": "^2.1.6",
  "@radix-ui/react-tabs": "^1.1.3",
  "@radix-ui/react-radio-group": "^1.2.3",
  "@radix-ui/react-scroll-area": "^1.2.3",
  "@radix-ui/react-switch": "^1.1.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.2",
  "lucide-react": "^0.454.0"
}
```

### 开发依赖 (devDependencies)

```json
{
  "@types/react": "^18.3.5",
  "@types/react-dom": "^18.3.0",
  "@typescript-eslint/eslint-plugin": "^7.18.0",
  "@typescript-eslint/parser": "^7.18.0",
  "@vitejs/plugin-react": "^4.3.1",
  "autoprefixer": "^10.4.20",
  "eslint": "^8.57.0",
  "eslint-plugin-react-hooks": "^4.6.2",
  "eslint-plugin-react-refresh": "^0.4.11",
  "postcss": "^8.4.47",
  "tailwindcss": "^3.4.13",
  "typescript": "^5.5.4",
  "vite": "^5.4.3"
}
```

## 📝 一键安装命令

如果您想一次性安装所有依赖，可以使用以下命令：

```bash
npm install react react-dom \
  @radix-ui/react-slot@^1.1.2 \
  @radix-ui/react-label@^2.1.2 \
  @radix-ui/react-select@^2.1.6 \
  @radix-ui/react-tabs@^1.1.3 \
  @radix-ui/react-radio-group@^1.2.3 \
  @radix-ui/react-scroll-area@^1.2.3 \
  @radix-ui/react-switch@^1.1.3 \
  class-variance-authority@^0.7.1 \
  clsx@^2.1.1 \
  tailwind-merge@^2.5.2 \
  lucide-react@^0.454.0 && \
npm install -D tailwindcss@^3.4.13 postcss@^8.4.47 autoprefixer@^10.4.20 \
  @types/react@^18.3.5 @types/react-dom@^18.3.0 \
  typescript@^5.5.4 vite@^5.4.3 @vitejs/plugin-react@^4.3.1
```

## 📂 MeterSphere 前端参考（metersphere-frontend）

项目内 `metersphere-frontend/` 目录为从 [spotter-metersphere](https://github.com/your-org/spotter-metersphere) 复制过来的 **Vue 3** 前端代码，用于参考或迁移。与主项目（React）技术栈不同，需单独安装依赖和启动：

```bash
cd metersphere-frontend
pnpm install   # 或 npm install
pnpm run dev   # 或 npm run dev
```

- **技术栈**：Vue 3、Pinia、Vue Router、Arco Design Vue、Element Plus、Vite
- **说明**：未复制 `node_modules`，首次使用需在 `metersphere-frontend` 下执行 `pnpm install`

## 🛠️ 项目结构

```
keeper-one-web/
├── metersphere-frontend/ # MeterSphere Vue 前端（参考用，独立运行）
├── src/                  # 主应用 React 源码
├── components/          # React组件
│   ├── ui/            # UI基础组件库
│   ├── ApiTestLayout.tsx
│   ├── TopNavigation.tsx
│   ├── LeftSidebar.tsx
│   ├── MainContent.tsx
│   └── ...
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口
├── index.html         # HTML模板
├── globals.css        # 全局样式
├── tailwind.config.js # Tailwind配置
├── postcss.config.js  # PostCSS配置
├── vite.config.ts     # Vite配置
└── tsconfig.json      # TypeScript配置
```

## 🎯 可用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 🌐 访问地址

开发服务器启动后，在浏览器中访问：

- **本地地址**: http://localhost:5173

## ⚠️ 常见问题

### 1. CSS错误：`@layer base` is used but no matching `@tailwind base` directive is present

**解决方案**: 确保 `globals.css` 文件开头包含以下指令：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. 组件导入错误：Cannot find module

**解决方案**: 
- 确保所有依赖都已正确安装：`npm install`
- 检查 `components/ui/` 目录下的所有组件文件是否存在

### 3. Tailwind CSS样式不生效

**解决方案**:
- 检查 `tailwind.config.js` 中的 `content` 配置是否包含所有源文件路径
- 确保 `globals.css` 已正确导入到 `main.tsx`

### 4. TypeScript编译错误

**解决方案**:
- 检查 `tsconfig.json` 配置是否正确
- 确保 `vite.config.ts` 已从 TypeScript 编译中排除（使用 `tsconfig.node.json`）

## 📚 技术栈

- **框架**: React 18.3
- **语言**: TypeScript 5.5
- **构建工具**: Vite 5.4
- **样式**: Tailwind CSS 3.4
- **UI组件**: Radix UI
- **图标**: Lucide React

## 📄 许可证

MIT

---

## 云效 Codeup 使用指南

### 3 分钟了解如何进入开发

欢迎使用云效代码管理 Codeup，通过阅读以下内容，你可以快速熟悉 Codeup ，并立即开始今天的工作。

### 提交**文件**

Codeup 支持两种方式进行代码提交：网页端提交，以及本地 Git 客户端提交。

* 如需体验本地命令行操作，请先安装 Git 工具，安装方法参见[安装Git](https://help.aliyun.com/document_detail/153800.html)。

* 如需体验 SSH 方式克隆和提交代码，请先在平台账号内配置 SSH 公钥，配置方法参见[配置 SSH 密钥](https://help.aliyun.com/document_detail/153709.html)。

* 如需体验 HTTP 方式克隆和提交代码，请先在平台账号内配置克隆账密，配置方法参见[配置 HTTPS 克隆账号密码](https://help.aliyun.com/document_detail/153710.html)。

现在，你可以在 Codeup 中提交代码文件了，跟着文档「[__提交第一行代码__](https://help.aliyun.com/document_detail/153707.html?spm=a2c4g.153710.0.0.3c213774PFSMIV#6a5dbb1063ai5)」一起操作试试看吧。

### 进行代码检测

开发过程中，为了更好的维护你的代码质量，你可以开启 Codeup 内置开箱即用的「[代码检测服务](https://help.aliyun.com/document_detail/434321.html)」，开启后提交或合并请求的变更将自动触发检测，识别代码编写规范和安全漏洞问题，并及时提供结果报表和修复建议。

### 开展代码评审

功能开发完毕后，通常你需要发起「[代码评审并执行合并](https://help.aliyun.com/document_detail/153872.html)」，Codeup 支持多人协作的代码评审服务，你可以通过「[保护分支设置合并规则](https://help.aliyun.com/document_detail/153873.html?spm=a2c4g.203108.0.0.430765d1l9tTRR#p-4on-aep-l5q)」策略及「[__合并请求设置__](https://help.aliyun.com/document_detail/153874.html?spm=a2c4g.153871.0.0.3d38686cJpcdJI)」对合并过程进行流程化管控，同时提供在线代码评审及冲突解决能力，让评审过程更加流畅。

### 成员协作

是时候邀请成员一起编写卓越的代码工程了，请点击左下角「成员」邀请你的小伙伴开始协作吧！

### 更多

Git 使用教学、高级功能指引等更多说明，参见[Codeup帮助文档](https://help.aliyun.com/document_detail/153402.html)。
