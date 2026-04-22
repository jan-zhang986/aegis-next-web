#!/bin/bash

# 对比两个项目的 HTTP 请求工具
# 帮助识别需要整合的功能

SOURCE_FILE="/Users/jan/IdeaProjects/spotter-metersphere/frontend/src/api/http/Axios.ts"
TARGET_FILE="src/utils/request.ts"

echo "=========================================="
echo "HTTP 工具对比"
echo "=========================================="
echo ""
echo "源文件 (Vue): $SOURCE_FILE"
echo "目标文件 (React): $TARGET_FILE"
echo ""

if [ ! -f "$SOURCE_FILE" ]; then
    echo "错误: 源文件不存在: $SOURCE_FILE"
    exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "错误: 目标文件不存在: $TARGET_FILE"
    exit 1
fi

echo "文件大小对比:"
echo "  源文件: $(wc -l < "$SOURCE_FILE") 行"
echo "  目标文件: $(wc -l < "$TARGET_FILE") 行"
echo ""

echo "源文件中的关键功能:"
echo "----------------------------------------"
grep -E "^(export|function|const|class|interface|type)" "$SOURCE_FILE" | head -20 || echo "  (无法读取)"
echo ""

echo "目标文件中的关键功能:"
echo "----------------------------------------"
grep -E "^(export|function|const|class|interface|type)" "$TARGET_FILE" | head -20 || echo "  (无法读取)"
echo ""

echo "建议:"
echo "1. 手动对比两个文件的功能差异"
echo "2. 将 MeterSphere 中的有用功能合并到当前项目"
echo "3. 确保 API 调用方式统一"
echo ""
echo "可以使用以下命令查看详细内容:"
echo "  diff -u $TARGET_FILE $SOURCE_FILE | less"
echo "  或"
echo "  code --diff $TARGET_FILE $SOURCE_FILE"
