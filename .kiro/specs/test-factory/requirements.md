# 测试工厂需求文档

## 简介

测试工厂是一个综合性的测试数据生成和 Mock 服务平台，旨在为开发和测试团队提供快速、灵活的测试数据生成能力和 API Mock 服务。该平台包含两个核心模块：Mock 工厂和数据工厂，支持前后端联调、接口测试和自动化测试场景。

## 需求

### 需求 1：Mock 工厂 - 接口 Mock 服务

**用户故事：** 作为一名前端开发人员，我希望能够快速创建和管理 Mock 接口，以便在后端接口未完成时进行前端开发和联调。

#### 验收标准

1. WHEN 用户创建新的 Mock 接口 THEN 系统 SHALL 允许配置接口的 HTTP 方法（GET/POST/PUT/DELETE/PATCH）、路径、状态码和响应延迟
2. WHEN 用户配置 Mock 接口路径 THEN 系统 SHALL 支持路径参数（如 /api/users/:id）和通配符（如 /api/files/*）
3. WHEN 用户设置响应数据 THEN 系统 SHALL 支持自定义响应头和 JSON 格式的响应体
4. WHEN 用户在响应数据中使用动态变量（如 {{$randomUUID}}、{{$timestamp}}） THEN 系统 SHALL 在每次请求时生成对应的随机值
5. WHEN 用户启动 Mock Server THEN 系统 SHALL 在指定端口启动 HTTP 服务器并激活所有已启用的 Mock 接口
6. WHEN Mock Server 运行中 THEN 系统 SHALL 记录所有接收到的请求日志，包括请求方法、路径、来源 IP、响应状态和响应时间
7. WHEN 用户禁用某个 Mock 接口 THEN 系统 SHALL 停止该接口的响应服务但保留配置
8. WHEN 用户删除 Mock 接口 THEN 系统 SHALL 从配置中移除该接口并停止其服务

### 需求 2：Mock 工厂 - 响应模板管理

**用户故事：** 作为一名测试工程师，我希望能够使用预设模板快速创建常见的响应格式，以便提高 Mock 接口的创建效率。

#### 验收标准

1. WHEN 用户选择"成功响应"模板 THEN 系统 SHALL 自动填充标准成功响应结构（code: 0, message: 'success', data: {}）
2. WHEN 用户选择"错误响应"模板 THEN 系统 SHALL 自动填充标准错误响应结构（code: 400, message: 'Bad Request', errors: []）
3. WHEN 用户选择"列表数据"模板 THEN 系统 SHALL 自动填充分页列表结构（list, total, page, pageSize）
4. WHEN 用户选择"用户信息"模板 THEN 系统 SHALL 自动填充用户数据结构并包含动态变量
5. WHEN 用户应用模板 THEN 系统 SHALL 保留当前的响应头配置

### 需求 3：Mock 工厂 - 高级匹配规则

**用户故事：** 作为一名后端开发人员，我希望能够根据请求的不同条件返回不同的响应，以便模拟复杂的业务逻辑。

#### 验收标准

1. WHEN 用户配置请求头匹配规则 THEN 系统 SHALL 仅在请求头满足条件时返回该 Mock 响应
2. WHEN 用户配置 Query 参数匹配规则 THEN 系统 SHALL 仅在 URL 参数满足条件时返回该 Mock 响应
3. WHEN 用户配置 Body 内容匹配规则（JSON Path） THEN 系统 SHALL 仅在请求体满足条件时返回该 Mock 响应
4. WHEN 用户配置正则表达式匹配 THEN 系统 SHALL 支持对路径、参数和请求体进行正则匹配
5. IF 多个 Mock 接口匹配同一请求 THEN 系统 SHALL 按照优先级规则返回最匹配的响应

### 需求 4：Mock 工厂 - 配置管理

**用户故事：** 作为一名团队负责人，我希望能够导入导出 Mock 配置，以便在团队成员之间共享和复用 Mock 接口配置。

#### 验收标准

1. WHEN 用户点击"导出配置" THEN 系统 SHALL 将当前所有 Mock 接口配置导出为 JSON 文件
2. WHEN 用户点击"导入配置" THEN 系统 SHALL 允许上传 JSON 配置文件并解析导入
3. WHEN 导入配置与现有配置冲突 THEN 系统 SHALL 提示用户选择覆盖或跳过
4. WHEN 用户保存 Mock 配置 THEN 系统 SHALL 将配置持久化到后端数据库
5. WHEN 用户复制接口 URL THEN 系统 SHALL 将完整的 Mock 接口地址复制到剪贴板

### 需求 5：数据工厂 - 模板化数据生成

**用户故事：** 作为一名测试工程师，我希望能够通过配置字段规则快速生成大量测试数据，以便进行性能测试和数据填充。

#### 验收标准

1. WHEN 用户添加数据字段 THEN 系统 SHALL 允许配置字段名、数据类型（自增ID、UUID、姓名、邮箱、手机号、地址、公司名、日期时间、随机数字、随机字符串、布尔值、枚举值、自定义规则）
2. WHEN 用户配置自增ID类型 THEN 系统 SHALL 支持设置起始值和步长（如 start:1, step:1）
3. WHEN 用户配置随机数字类型 THEN 系统 SHALL 支持设置最小值、最大值和小数位数（如 min:1, max:100, decimal:2）
4. WHEN 用户配置枚举类型 THEN 系统 SHALL 支持设置枚举值列表（如 active,inactive,pending）
5. WHEN 用户配置日期时间类型 THEN 系统 SHALL 支持自定义日期格式（如 format:YYYY-MM-DD HH:mm:ss）
6. WHEN 用户配置随机字符串类型 THEN 系统 SHALL 支持设置长度和字符集（如 length:10, charset:alphanumeric）
7. WHEN 用户设置生成数量 THEN 系统 SHALL 根据配置生成指定数量的数据记录
8. WHEN 用户禁用某个字段 THEN 系统 SHALL 在生成数据时跳过该字段

### 需求 6：数据工厂 - 预设模板

**用户故事：** 作为一名开发人员，我希望能够使用预设的数据模板快速生成常见类型的测试数据，以便节省配置时间。

#### 验收标准

1. WHEN 用户选择"用户数据"模板 THEN 系统 SHALL 自动配置用户相关字段（id、username、email、phone、age、status）
2. WHEN 用户选择"订单数据"模板 THEN 系统 SHALL 自动配置订单相关字段（order_id、user_id、amount、status、created_at）
3. WHEN 用户选择"产品数据"模板 THEN 系统 SHALL 自动配置产品相关字段（product_id、name、category、price、stock、sales）
4. WHEN 用户选择"日志数据"模板 THEN 系统 SHALL 自动配置日志相关字段（log_id、level、message、timestamp）
5. WHEN 用户应用模板后 THEN 系统 SHALL 允许用户修改和扩展字段配置

### 需求 7：数据工厂 - Python 脚本生成

**用户故事：** 作为一名高级测试工程师，我希望能够使用 Python 脚本编写自定义数据生成逻辑，以便实现复杂的数据生成需求。

#### 验收标准

1. WHEN 用户选择"自定义脚本"模式 THEN 系统 SHALL 提供 Python 代码编辑器
2. WHEN 用户编写 Python 脚本 THEN 系统 SHALL 要求函数名为 generate_data 并接收 count 参数
3. WHEN 用户编写 Python 脚本 THEN 系统 SHALL 要求返回值为 list 类型，每个元素为 dict 对象
4. WHEN 用户执行脚本 THEN 系统 SHALL 在后端安全沙箱环境中运行 Python 代码
5. WHEN 用户执行脚本 THEN 系统 SHALL 支持使用 random、datetime、uuid、string 等标准库
6. WHEN 用户选择脚本模板 THEN 系统 SHALL 提供"订单数据生成"、"用户行为日志"、"商品库存数据"等预设脚本
7. WHEN 用户点击"语法检查" THEN 系统 SHALL 验证 Python 脚本的语法正确性
8. IF Python 脚本执行出错 THEN 系统 SHALL 显示详细的错误信息和堆栈跟踪

### 需求 8：数据工厂 - 数据导出

**用户故事：** 作为一名数据分析师，我希望能够将生成的测试数据导出为多种格式，以便在不同的工具和场景中使用。

#### 验收标准

1. WHEN 用户选择 JSON 格式导出 THEN 系统 SHALL 将数据导出为格式化的 JSON 文件
2. WHEN 用户选择 CSV 格式导出 THEN 系统 SHALL 将数据导出为 CSV 文件，第一行为字段名
3. WHEN 用户选择 SQL Insert 格式导出 THEN 系统 SHALL 生成可直接执行的 SQL INSERT 语句
4. WHEN 用户选择 XML 格式导出 THEN 系统 SHALL 将数据导出为结构化的 XML 文件
5. WHEN 用户导出数据 THEN 系统 SHALL 自动下载文件到本地
6. WHEN 用户复制数据 THEN 系统 SHALL 将生成的数据复制到剪贴板

### 需求 9：数据工厂 - 数据预览

**用户故事：** 作为一名测试工程师，我希望能够在导出前预览生成的数据，以便验证数据的正确性。

#### 验收标准

1. WHEN 用户点击"生成数据" THEN 系统 SHALL 在"数据预览"标签页显示生成的数据表格
2. WHEN 数据预览显示 THEN 系统 SHALL 展示生成数量、生成状态和生成时间
3. WHEN 数据量较大 THEN 系统 SHALL 支持分页显示数据
4. WHEN 用户查看数据预览 THEN 系统 SHALL 支持按字段排序和筛选
5. WHEN 用户对预览数据满意 THEN 系统 SHALL 允许直接导出当前预览的数据

### 需求 10：数据工厂 - 代码生成

**用户故事：** 作为一名开发人员，我希望能够生成调用数据工厂的代码示例，以便在自动化测试脚本中集成数据生成功能。

#### 验收标准

1. WHEN 用户切换到"代码生成"标签 THEN 系统 SHALL 显示多种编程语言的代码示例
2. WHEN 用户选择 JavaScript 语言 THEN 系统 SHALL 生成使用 fetch/axios 调用数据工厂 API 的代码
3. WHEN 用户选择 Python 语言 THEN 系统 SHALL 生成使用 requests 库调用数据工厂 API 的代码
4. WHEN 用户选择 Java 语言 THEN 系统 SHALL 生成使用 HttpClient 调用数据工厂 API 的代码
5. WHEN 用户选择 cURL 命令 THEN 系统 SHALL 生成可直接在终端执行的 cURL 命令
6. WHEN 用户点击"复制代码" THEN 系统 SHALL 将代码复制到剪贴板

### 需求 11：配置持久化和共享

**用户故事：** 作为一名团队成员，我希望能够保存和共享数据工厂配置，以便团队其他成员可以复用相同的数据生成配置。

#### 验收标准

1. WHEN 用户点击"保存配置" THEN 系统 SHALL 将当前字段配置或 Python 脚本保存到后端
2. WHEN 用户保存配置 THEN 系统 SHALL 要求输入配置名称和描述
3. WHEN 用户导出配置 THEN 系统 SHALL 将配置导出为 JSON 文件
4. WHEN 用户导入配置 THEN 系统 SHALL 解析 JSON 文件并恢复字段配置或脚本
5. WHEN 用户查看配置列表 THEN 系统 SHALL 显示所有已保存的配置及其创建时间和创建人
6. WHEN 用户加载已保存的配置 THEN 系统 SHALL 恢复所有字段设置和生成参数

### 需求 12：系统集成和 API

**用户故事：** 作为一名自动化测试工程师，我希望能够通过 API 调用测试工厂的功能，以便在 CI/CD 流程中自动生成测试数据和启动 Mock 服务。

#### 验收标准

1. WHEN 外部系统调用 Mock 工厂 API THEN 系统 SHALL 提供 RESTful API 用于创建、更新、删除和查询 Mock 接口
2. WHEN 外部系统调用数据工厂 API THEN 系统 SHALL 提供 RESTful API 用于执行数据生成任务
3. WHEN API 调用需要认证 THEN 系统 SHALL 支持 Token 认证机制
4. WHEN API 调用失败 THEN 系统 SHALL 返回标准的错误响应格式（code、message、details）
5. WHEN 外部系统启动 Mock Server THEN 系统 SHALL 提供 API 控制 Mock Server 的启动和停止
6. WHEN 外部系统查询 Mock 日志 THEN 系统 SHALL 提供 API 返回请求日志列表

### 需求 13：性能和可靠性

**用户故事：** 作为一名系统管理员，我希望测试工厂能够稳定高效地运行，以便支持大规模的测试数据生成和高并发的 Mock 请求。

#### 验收标准

1. WHEN 用户生成大量数据（>10000条） THEN 系统 SHALL 在 30 秒内完成数据生成
2. WHEN Mock Server 接收高并发请求（>100 QPS） THEN 系统 SHALL 保持响应时间在 100ms 以内
3. WHEN Python 脚本执行时间超过 60 秒 THEN 系统 SHALL 自动终止脚本执行并返回超时错误
4. WHEN 系统资源不足 THEN 系统 SHALL 限制并发数据生成任务数量并提示用户
5. WHEN Mock Server 异常崩溃 THEN 系统 SHALL 自动重启服务并记录错误日志
6. WHEN 用户配置错误 THEN 系统 SHALL 在执行前进行验证并提供明确的错误提示

### 需求 14：用户体验和界面

**用户故事：** 作为一名普通用户，我希望测试工厂的界面简洁易用，以便快速上手并高效完成工作。

#### 验收标准

1. WHEN 用户首次使用 THEN 系统 SHALL 提供引导提示和示例配置
2. WHEN 用户操作出错 THEN 系统 SHALL 显示友好的错误提示和解决建议
3. WHEN 用户配置复杂规则 THEN 系统 SHALL 提供实时的语法提示和自动补全
4. WHEN 用户查看动态变量 THEN 系统 SHALL 提供变量列表和说明文档
5. WHEN 用户编辑 Python 脚本 THEN 系统 SHALL 提供代码高亮和基础的代码补全
6. WHEN 用户切换标签页 THEN 系统 SHALL 保留当前的编辑状态
7. WHEN 用户执行长时间任务 THEN 系统 SHALL 显示进度条和预计完成时间
