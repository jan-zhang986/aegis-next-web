#!/bin/bash

# 迁移冲突检测脚本
# 检测迁移过程中可能出现的冲突

set -e

SOURCE_DIR="/Users/jan/IdeaProjects/spotter-metersphere/frontend/src"
TARGET_DIR="src"

echo "=========================================="
echo "迁移冲突检测"
echo "=========================================="
echo ""

CONFLICTS=0

# 1. 检查 API 模块冲突
echo "1. 检查 API 模块冲突..."
echo "----------------------------------------"

SOURCE_API_MODULES=$(find "$SOURCE_DIR/api/modules" -maxdepth 1 -type d 2>/dev/null | tail -n +2 | xargs -n1 basename || echo "")
TARGET_SERVICES=$(ls "$TARGET_DIR/services"/*.ts 2>/dev/null | xargs -n1 basename | sed 's/\.ts$//' || echo "")

for module in $SOURCE_API_MODULES; do
    # 跳过 api-test（明确不迁移）
    if [ "$module" = "api-test" ]; then
        echo "  ✅ $module - 已排除（不迁移）"
        continue
    fi
    
    # 检查是否存在
    if echo "$TARGET_SERVICES" | grep -q "^${module}$"; then
        echo "  ⚠️  $module - 冲突！目标已存在"
        CONFLICTS=$((CONFLICTS + 1))
    else
        # 特殊处理：user -> auth
        if [ "$module" = "user" ] && echo "$TARGET_SERVICES" | grep -q "^auth$"; then
            echo "  ⚠️  $module -> auth - 需要合并"
            CONFLICTS=$((CONFLICTS + 1))
        else
            echo "  ✅ $module - 可以迁移"
        fi
    fi
done

echo ""

# 2. 检查工具函数冲突
echo "2. 检查工具函数冲突..."
echo "----------------------------------------"

SOURCE_UTILS=$(find "$SOURCE_DIR/utils" -name "*.ts" -type f 2>/dev/null | xargs -n1 basename | sort || echo "")
TARGET_UTILS=$(find "$TARGET_DIR/utils" -name "*.ts" -type f 2>/dev/null | xargs -n1 basename | sort || echo "")

for util in $SOURCE_UTILS; do
    if echo "$TARGET_UTILS" | grep -q "^${util}$"; then
        echo "  ⚠️  $util - 冲突！需要合并"
        CONFLICTS=$((CONFLICTS + 1))
    else
        echo "  ✅ $util - 可以迁移"
    fi
done

echo ""

# 3. 检查类型定义冲突
echo "3. 检查类型定义冲突..."
echo "----------------------------------------"

SOURCE_TYPES=$(find "$SOURCE_DIR/models" -name "*.ts" -type f 2>/dev/null | xargs -n1 basename | sort || echo "")
TARGET_TYPES=$(find "$TARGET_DIR/types" -name "*.ts" -type f 2>/dev/null | xargs -n1 basename | sort || echo "")

for type in $SOURCE_TYPES; do
    if echo "$TARGET_TYPES" | grep -q "^${type}$"; then
        echo "  ⚠️  $type - 冲突！需要合并"
        CONFLICTS=$((CONFLICTS + 1))
    else
        echo "  ✅ $type - 可以迁移"
    fi
done

echo ""

# 4. 总结
echo "=========================================="
if [ $CONFLICTS -eq 0 ]; then
    echo "✅ 未发现冲突，可以开始迁移"
else
    echo "⚠️  发现 $CONFLICTS 个潜在冲突"
    echo ""
    echo "建议:"
    echo "1. 使用合并脚本处理冲突: ./scripts/merge-services.sh <module-name>"
    echo "2. 手动对比并合并功能，避免覆盖现有代码"
    echo "3. 保留现有实现，只添加缺失功能"
fi
echo "=========================================="
