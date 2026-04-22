#!/bin/bash

# 智能合并服务模块脚本
# 用法: ./scripts/merge-services.sh <module-name>
# 功能: 对比现有服务和MeterSphere服务，提供合并建议

set -e

SOURCE_DIR="/Users/jan/IdeaProjects/spotter-metersphere/frontend/src/api/modules"
TARGET_DIR="src/services"

if [ -z "$1" ]; then
    echo "错误: 请指定要合并的模块名称"
    echo "用法: $0 <module-name>"
    echo ""
    echo "可用模块:"
    ls -1 "$SOURCE_DIR" 2>/dev/null | grep -v "^$" || echo "  (无法读取源目录)"
    echo ""
    echo "注意: 如果目标模块已存在，将进行对比合并而非覆盖"
    exit 1
fi

MODULE_NAME=$1
SOURCE_PATH="$SOURCE_DIR/$MODULE_NAME"
TARGET_PATH="$TARGET_DIR/$MODULE_NAME.ts"

# 特殊处理：如果模块名是 user，对应目标为 auth
if [ "$MODULE_NAME" = "user" ]; then
    TARGET_PATH="$TARGET_DIR/auth.ts"
    echo "注意: user 模块将合并到 auth.ts"
fi

if [ ! -d "$SOURCE_PATH" ]; then
    echo "错误: 源目录不存在: $SOURCE_PATH"
    exit 1
fi

echo "=========================================="
echo "服务模块合并分析: $MODULE_NAME"
echo "=========================================="
echo ""
echo "源路径: $SOURCE_PATH"
echo "目标路径: $TARGET_PATH"
echo ""

# 检查目标文件是否存在
if [ -f "$TARGET_PATH" ] || [ -d "$TARGET_PATH" ]; then
    echo "⚠️  警告: 目标模块已存在！"
    echo ""
    echo "合并策略:"
    echo "1. 不会覆盖现有文件"
    echo "2. 请手动对比并合并功能"
    echo "3. 保留现有实现，只添加缺失功能"
    echo ""
    
    # 统计文件
    if [ -d "$TARGET_PATH" ]; then
        TARGET_COUNT=$(find "$TARGET_PATH" -name "*.ts" -type f | wc -l | tr -d ' ')
        echo "现有文件数: $TARGET_COUNT"
    else
        echo "现有文件: $TARGET_PATH"
        echo "文件行数: $(wc -l < "$TARGET_PATH")"
    fi
    
    SOURCE_COUNT=$(find "$SOURCE_PATH" -name "*.ts" -type f | wc -l | tr -d ' ')
    echo "源文件数: $SOURCE_COUNT"
    echo ""
    
    echo "建议操作:"
    echo "1. 对比两个模块的功能差异"
    echo "2. 识别MeterSphere中的新功能"
    echo "3. 手动合并到现有文件，避免覆盖"
    echo ""
    echo "对比命令:"
    if [ -d "$TARGET_PATH" ]; then
        echo "  diff -r $TARGET_PATH $SOURCE_PATH | less"
    else
        echo "  code --diff $TARGET_PATH $SOURCE_PATH/..."
    fi
    echo ""
    
    read -p "是否继续查看源文件列表? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "源文件列表:"
        find "$SOURCE_PATH" -name "*.ts" -type f | sed "s|$SOURCE_PATH/||" | sort
    fi
else
    echo "✅ 目标模块不存在，可以安全迁移"
    echo ""
    echo "将执行以下操作:"
    echo "1. 复制源文件到目标目录"
    echo "2. 转换 Vue API 调用为 React 格式"
    echo "3. 更新导入路径"
    echo ""
    
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 如果是目录，创建目录并复制
        if [ -d "$SOURCE_PATH" ]; then
            mkdir -p "$(dirname "$TARGET_PATH")"
            cp -r "$SOURCE_PATH" "$TARGET_PATH"
            FILE_COUNT=$(find "$TARGET_PATH" -name "*.ts" -type f | wc -l | tr -d ' ')
            echo ""
            echo "✅ 已复制 $FILE_COUNT 个文件到 $TARGET_PATH"
        else
            echo "错误: 源路径不是目录"
            exit 1
        fi
        
        echo ""
        echo "下一步:"
        echo "1. 检查 $TARGET_PATH 目录下的文件"
        echo "2. 转换 Vue API 调用为 React 格式"
        echo "3. 更新导入路径"
    else
        echo "操作已取消"
    fi
fi
