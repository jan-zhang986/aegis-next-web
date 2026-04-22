# Message Management Module

消息管理模块 - 用于管理项目消息通知配置和机器人

## 目录结构

```
message-management/
├── MessageManagementPage.tsx          # 主页面容器
├── MessageConfigList.tsx              # 消息配置列表
├── RobotList.tsx                      # 机器人列表
├── RobotCard.tsx                      # 机器人卡片
├── MessageTemplateEditor.tsx          # 消息模板编辑器
├── TemplateVariableSelector.tsx       # 变量选择器
└── RobotFormDialog.tsx                # 机器人表单对话框
```

## 功能特性

### 1. 消息配置管理
- 展示不同功能模块的消息通知配置
- 支持按机器人筛选消息配置
- 配置接收人（支持多选）
- 为每个消息事件配置不同的机器人通知
- 支持启用/禁用特定消息配置

### 2. 机器人管理
- 支持多种平台机器人：企业微信、钉钉、飞书、自定义机器人
- 机器人列表展示（卡片形式）
- 创建/编辑/删除机器人
- 机器人启用/禁用状态管理

### 3. 消息模板编辑
- 消息变量管理和插入
- 支持按变量类型筛选
- 消息标题和内容编辑
- 实时预览消息效果

## 技术栈

- React 18
- TypeScript
- shadcn/ui
- React Hook Form
- Zod (表单验证)

## 开发指南

组件将在后续任务中逐步实现。
