#!/bin/bash

# 生成迁移检查清单
# 扫描源项目目录，生成详细的迁移任务列表

SOURCE_DIR="/Users/jan/IdeaProjects/spotter-metersphere/frontend/src"
OUTPUT_FILE="MIGRATION_CHECKLIST.md"

echo "生成迁移检查清单..."

cat > "$OUTPUT_FILE" << 'EOF'
# 迁移检查清单

本文档由脚本自动生成，列出了需要迁移的所有文件和模块。

生成时间: $(date)

EOF

# 扫描目录结构
echo "## 📁 目录结构扫描" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ -d "$SOURCE_DIR/api/modules" ]; then
    echo "### API 模块" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    find "$SOURCE_DIR/api/modules" -type f -name "*.ts" | sed "s|$SOURCE_DIR/api/modules/||" | sort >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

if [ -d "$SOURCE_DIR/views" ]; then
    echo "### 页面组件 (Views)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    find "$SOURCE_DIR/views" -type f -name "*.vue" | sed "s|$SOURCE_DIR/views/||" | sort >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

if [ -d "$SOURCE_DIR/components" ]; then
    echo "### 通用组件" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    find "$SOURCE_DIR/components" -type f -name "*.vue" | sed "s|$SOURCE_DIR/components/||" | sort >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

if [ -d "$SOURCE_DIR/utils" ]; then
    echo "### 工具函数" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    find "$SOURCE_DIR/utils" -type f -name "*.ts" | sed "s|$SOURCE_DIR/utils/||" | sort >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

if [ -d "$SOURCE_DIR/models" ]; then
    echo "### 类型定义" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    find "$SOURCE_DIR/models" -type f -name "*.ts" | sed "s|$SOURCE_DIR/models/||" | sort >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# 添加任务清单
cat >> "$OUTPUT_FILE" << 'EOF'

## ✅ 迁移任务清单

### 阶段 1: 基础设施

- [ ] 对比并整合 HTTP 请求工具
- [ ] 迁移 API 模块
  - [ ] api-test
  - [ ] case-management
  - [ ] project-management
  - [ ] bug-management
  - [ ] test-plan
- [ ] 迁移工具函数
- [ ] 迁移类型定义
- [ ] 迁移枚举定义

### 阶段 2: 组件迁移

- [ ] API 测试模块组件
- [ ] 用例管理模块组件
- [ ] 项目管理模块组件
- [ ] Bug 管理模块组件
- [ ] 测试计划模块组件

### 阶段 3: UI 替换

- [ ] 替换 Arco Design 组件
- [ ] 迁移自定义组件
- [ ] 适配样式系统

EOF

echo "检查清单已生成: $OUTPUT_FILE"
echo "请查看并更新任务清单"
