# 第一阶段：构建阶段
FROM registry.cn-hangzhou.aliyuncs.com/spotter/node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 定义构建参数（用于环境变量）
ARG VITE_API_BASE_URL
ARG VITE_API_PREFIX

# 设置环境变量（用于 Vite 构建时注入）
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_PREFIX=$VITE_API_PREFIX

# 复制 package.json 和 package-lock.json（如果存在）
COPY package.json package-lock.json* ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# 复制项目文件
COPY . .

# 构建项目（根据安装指南：npm run build = tsc && vite build）
# 构建时会将环境变量注入到前端代码中
RUN npm run build

# 第二阶段：运行阶段
FROM registry.cn-hangzhou.aliyuncs.com/spotter/nginx:1.25

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html/

# 复制 nginx 配置文件
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

