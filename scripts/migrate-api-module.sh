#!/bin/bash

# MeterSphere API 模块迁移脚本
# 用法: ./scripts/migrate-api-module.sh <module-name>
# 示例: ./scripts/migrate-api-module.sh case-management

set -e

SOURCE_DIR="/Users/jan/IdeaProjects/spotter-metersphere/frontend/src/api/modules"
TARGET_DIR="src/services"

if [ -z "$1" ]; then
    echo "错误: 请指定要迁移的模块名称"
    echo "用法: $0 <module-name>"
    echo "可用模块:"
    ls -1 "$SOURCE_DIR" 2>/dev/null | grep -v "^$" || echo "  (无法读取源目录)"
    exit 1
fi

MODULE_NAME=$1
SOURCE_PATH="$SOURCE_DIR/$MODULE_NAME"
TARGET_PATH="$TARGET_DIR/$MODULE_NAME"

if [ ! -d "$SOURCE_PATH" ]; then
    echo "错误: 源目录不存在: $SOURCE_PATH"
    exit 1
fi

# 检查是否排除的模块
if [ "$MODULE_NAME" = "api-test" ]; then
    echo "错误: api-test 模块已明确排除，不进行迁移"
    echo "原因: 当前项目已有接口测试功能，保留现有实现"
    exit 1
fi

echo "开始迁移模块: $MODULE_NAME"
echo "源路径: $SOURCE_PATH"
echo "目标路径: $TARGET_PATH"
echo ""

# 检查目标是否存在（冲突检测）
if [ -d "$TARGET_PATH" ] || [ -f "$TARGET_PATH.ts" ]; then
    echo "⚠️  警告: 目标模块已存在！"
    echo ""
    echo "为避免覆盖现有功能，请使用合并脚本:"
    echo "  ./scripts/merge-services.sh $MODULE_NAME"
    echo ""
    echo "或者手动对比并合并功能"
    exit 1
fi

# 创建目标目录
mkdir -p "$TARGET_PATH"

# 复制文件
echo "复制文件..."
cp -r "$SOURCE_PATH"/* "$TARGET_PATH/" 2>/dev/null || {
    echo "警告: 复制文件时出现问题，可能部分文件已存在"
}

# 统计文件数量
FILE_COUNT=$(find "$TARGET_PATH" -name "*.ts" -type f | wc -l | tr -d ' ')
echo "已复制 $FILE_COUNT 个 TypeScript 文件"

echo ""
echo "迁移完成！"
echo ""
echo "下一步:"
echo "1. 检查 $TARGET_PATH 目录下的文件"
echo "2. 将 Vue 的 API 调用转换为 React 格式:"
echo "   Vue: export const getList = () => request.get('/api/list')"
echo "   React: export const getList = () => http.get('/api/list')"
echo "3. 更新导入路径:"
echo "   Vue: import { getList } from '@/api/modules/$MODULE_NAME'"
echo "   React: import { getList } from '@/services/$MODULE_NAME'"
echo "4. 创建统一导出文件: $TARGET_PATH/index.ts"
