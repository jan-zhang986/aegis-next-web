/**
 * 工作流类型定义
 * 严格按照节点标准格式定义
 * 前端格式 = 数据库格式 = 执行机格式（完全一致）
 */

// ========== 基础类型定义 ==========

/**
 * 变量提取规则
 * 对应节点定义中的 ExtractionRule
 */
export interface ExtractionRule {
  /** 变量名 */
  var_name: string;
  /** 源路径 */
  source_path: string;
  /** 提取类型: jsonpath, xpath, regex, jmespath */
  type?: 'jsonpath' | 'xpath' | 'regex' | 'jmespath';
  /** 默认值 */
  default?: any;
}

/**
 * 断言规则
 * 对应节点定义中的 AssertionRule
 */
export interface AssertionRule {
  /** 数据源字段 */
  source: string;
  /** 操作符: equals, not_equal, greater_than, less_than, greater_or_equals, less_or_equals, string_equals, length_equal, is_boolean */
  operator: 'equals' | 'not_equal' | 'greater_than' | 'less_than' | 'greater_or_equals' | 'less_or_equals' | 'string_equals' | 'length_equal' | 'is_boolean' | string;
  /** 目标值 */
  target?: any;
  /** 错误消息 */
  message?: string;
  /** 字段名（source的别名，兼容用） */
  field?: string;
}

/**
 * 断言配置
 * 对应节点定义中的 AssertionConfig
 */
export interface AssertionConfig {
  rules: AssertionRule[];
}

/**
 * 数据库连接配置
 * 对应节点定义中的 DatabaseConnectionConfig
 * 
 * 注意：environmentId 是前端UI专用字段，用于选择数据库环境
 * 执行时会根据 environmentId 从 workflow_engine_profile 获取实际的连接配置
 */
export interface DatabaseConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  charset?: string;
  connect_timeout?: number;
  read_timeout?: number;
  write_timeout?: number;
  /** 前端UI专用：数据库环境ID（从 workflow_engine_profile 选择） */
  environmentId?: string;
}

/**
 * 连接池配置
 * 对应节点定义中的 ConnectionPoolConfig
 */
export interface ConnectionPoolConfig {
  min_connections?: number;
  max_connections?: number;
}

/**
 * 浏览器视口配置
 * 对应节点定义中的 Viewport
 */
export interface Viewport {
  width?: number;
  height?: number;
}

// ========== 节点类型枚举（使用标准格式） ==========

export enum NodeType {
  // 开始/结束节点（前端UI用，不发送给执行机）
  START = 'start',
  END = 'end',
  
  // API 请求节点（标准格式）
  HTTP_REQUEST = 'http_request',
  DUBBO = 'dubbo',
  
  // 数据库节点（标准格式）
  MYSQL = 'mysql',
  
  // 逻辑节点
  CONDITION = 'condition',
  LOOP = 'loop',
  SLEEP = 'sleep',
  
  // 脚本节点
  SCRIPT = 'script',
  
  // 其他节点类型（标准格式）
  LOG_MESSAGE = 'log_message',
  ASSERTION = 'assertion',
  VARIABLE_EXTRACTOR = 'variable_extractor',
  ROCKETMQ = 'rocketmq',
  SUB_WORKFLOW = 'sub_workflow',
  REDIS = 'redis',
  MONGODB = 'mongodb',
  OSS = 'oss',
  XXLJOB = 'xxljob',
  
  // UI 节点类型（标准格式）
  UI_BROWSER = 'ui_browser',
  UI_ELEMENT = 'ui_element',
  UI_NAVIGATION = 'ui_navigation',
  UI_SCREENSHOT = 'ui_screenshot',
  UI_WAIT = 'ui_wait',
  UI_VALIDATION = 'ui_validation',
  UI_ACTION = 'ui_action',
  UI_RECORDING = 'ui_recording',
  UI_ADVANCED = 'ui_advanced',
  
  // 注释节点（前端UI用，不发送给执行机）
  COMMENT = 'comment',
}

// ========== 节点配置类型定义  ==========

/**
 * HTTP请求配置
 * 对应节点定义中的 HttpConfig
 */
export interface HttpConfig {
  // 基础字段
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url?: string;
  domain?: string; // 域名（直接存储值，用户写什么传什么）
  environmentId?: string; // 环境ID
  path?: string; // 请求路径（不包含baseUrl）
  
  // URL 参数
  params?: Record<string, any>;  // URL 查询参数
  path_params?: Record<string, any>;  // 路径参数
  
  // 请求头和 Cookie
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  
  // Body 数据（按优先级）
  json?: Record<string, any> | any[] | string;  // JSON 数据
  data?: Record<string, any> | string;  // 表单数据
  body?: any;  // 原始 body 数据
  bodyType?: 'json' | 'data' | 'upload' | 'params';  // 请求体类型（用于保存用户选择的参数类型）
  paramType?: 'json' | 'data' | 'upload' | 'params';  // 与 bodyType 一致，后端按 paramType 恢复请求体字段
  files?: Record<string, string>;  // 文件上传
  upload?: Record<string, any>;  // 文件上传（upload 是 files 的别名）
  
  // 请求配置
  timeout?: number;
  verify?: boolean;  // SSL 证书验证
  verify_ssl?: boolean;  // SSL 证书验证（别名）
  allow_redirects?: boolean;  // 是否允许重定向
  follow_redirects?: boolean;  // 是否允许重定向（别名）
  
  // 鉴权相关字段
  credential_id?: string;  // 凭证中心的凭证ID
  credential?: string;  // credential_id的别名
  auth?: Record<string, any>;  // 节点级鉴权配置
  auth_config?: Record<string, any>;  // auth 的别名
  
  // 断言和提取
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
  
  // 环境变量
  environmentVariables?: Record<string, string>; // 环境变量映射（key: 变量名, value: 变量值），保存原始的环境配置值
}

/**
 * SQL配置
 * 对应节点定义中的 SqlConfig
 */
export interface SqlConfig {
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'execute';
  sql?: string;
  sql_list?: string[]; // 批量 SQL 执行列表
  query_type?: 'fetchall' | 'fetchone' | 'fetchmany'; // 查询类型
  params?: any[] | Record<string, any>;
  connection?: DatabaseConnectionConfig;
  pool?: ConnectionPoolConfig;
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
  environmentVariables?: Record<string, string>; // 环境变量映射（key: 变量名, value: 变量值），保存原始的环境配置值
}

/**
 * 脚本配置
 * 对应节点定义中的 ScriptConfig
 */
export interface ScriptConfig {
  script?: string;
  type?: 'python' | 'expression' | 'function';
  function_name?: string;
  function_args?: any; // 支持字典、列表、单个值或null
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
}

/**
 * 日志配置
 * 对应节点定义中的 LogConfig
 */
export interface LogConfig {
  message?: string;
  level?: string;
}

/**
 * 条件配置
 * 对应节点定义中的 ConditionConfig
 */
export interface ConditionConfig {
  expression?: string;
}

/**
 * 循环配置
 * 对应节点定义中的 LoopConfig
 */
export interface LoopConfig {
  loop_type?: 'count_loop' | 'while_loop' | 'foreach_loop';
  count?: number | string;  // 次数循环的执行次数
  condition?: string;  // While 循环的条件表达式
  max_iterations?: number | string;  // While 循环的最大迭代次数
  items?: any[] | string;  // ForEach 循环的遍历集合
  item_variable?: string;  // ForEach 循环中当前项目的变量名
  index_variable?: string;  // ForEach 循环中当前索引的变量名
  sub_nodes?: any[];  // 循环内执行的子节点列表（类型为 WorkflowNodeData[]，使用 any[] 避免循环引用）
  delay?: number | string;  // 每次循环之间的延迟时间（秒）
  output_variable?: string;  // 保存循环结果的变量名
}

/**
 * Dubbo配置
 * 对应节点定义中的 DubboConfig
 */
export interface DubboConfig {
  url: string;
  application_name?: string;
  interface_name?: string;
  method_name?: string;
  params?: any[];
  site_tenant?: string;
  dubbo_tag?: string;
  param_types?: any[];
  group?: string;
  version?: string;
  timeout?: number;
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
  environmentId?: string; // 环境配置ID，从 workflow_engine_profile 表选择
  environmentVariables?: Record<string, string>; // 环境变量映射（key: 变量名, value: 变量值），保存原始的环境配置值
}

/**
 * OSS配置
 * 对应节点定义中的 OssConfig
 */
export interface OssConfig {
  operation?: 'upload' | 'upload_stream' | 'download' | 'delete';
  access_key_id?: string;
  access_key_secret?: string;
  endpoint?: string;
  bucket?: string;
  oss_path?: string;
  local_path?: string;
  content?: string | any;  // 文件流内容
  output_variable?: string;
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
}

/**
 * XXL-Job配置
 * 对应节点定义中的 XxlJobConfig
 */
export interface XxlJobConfig {
  executor_handler: string; // 执行器 Handler（必需）
  executor_param?: string; // 执行参数（JSON 字符串）
  site_tenant?: string; // 站点租户（默认: DEFAULT）
  address_list?: string; // 机器地址列表（多行或逗号分隔）
  output_variable?: string; // 输出变量名
  environmentId?: string; // 环境配置ID，从 workflow_engine_profile 表选择
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
  environmentVariables?: Record<string, string>; // 环境变量映射（key: 变量名, value: 变量值），保存原始的环境配置值
}

/**
 * 消息队列配置
 * 对应节点定义中的 MqConfig
 */
export interface MqConfig {
  topic?: string;
  message_body?: string;
  mq_url?: string;
  site_tenant?: string;
  tag?: string;
  key?: string;
  environmentId?: string; // 环境配置ID，从 workflow_engine_profile 表选择
  environmentVariables?: Record<string, string>; // 环境变量映射（key: 变量名, value: 变量值），保存原始的环境配置值
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
}

/**
 * 子工作流配置
 * 对应节点定义中的 SubWorkflowConfig
 * workflow_id：选中的引用工作流 ID（仅当前项目），保存时同步到节点 refWorkflowId
 * workflow_name：历史数据可能残留；新保存不再写入，展示名称由列表/后端解析 workflow_id 得到
 */
export interface SubWorkflowConfig {
  workflow_id?: string;
  workflow_file?: string;
  workflow_data?: Record<string, any>;
  /** @deprecated 不再写入配置，仅从旧数据读出作展示兜底 */
  workflow_name?: string;
  input_mapping?: Record<string, string>;
  output_mapping?: Record<string, string>;
  timeout?: number;
  error_handling?: string;
  parallel?: boolean;
}

/**
 * Redis配置
 * 对应节点定义中的 RedisConfig
 */
export interface RedisConfig {
  operation?: string;
  host?: string;
  port?: number | string;
  db?: number | string;
  password?: string;
  timeout?: number | string;
  key?: string;
  field?: string;
  value?: any;
  values?: any[];
  members?: Record<string, any> | any[];
  member?: string;
  new_key?: string;
  target_db?: number | string;
  pattern?: string;
  seconds?: number | string;
  start?: number | string;
  end?: number | string;
  index?: number | string;
  withscores?: boolean;
  keys?: string[];
  output_variable?: string;
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
}

/**
 * MongoDB配置
 * 对应节点定义中的 MongoDBConfig
 */
export interface MongoDBConfig {
  operation?: string;
  database?: string;
  connection_string?: string;
  host?: string;
  port?: number | string;
  username?: string;
  password?: string;
  timeout?: number | string;
  collection?: string;
  document?: Record<string, any>;
  documents?: Record<string, any>[];
  filter?: Record<string, any>;
  update?: Record<string, any>;
  replacement?: Record<string, any>;
  projection?: Record<string, any>;
  sort?: any[];
  limit?: number | string;
  skip?: number | string;
  upsert?: boolean;
  index?: any[] | string;
  options?: Record<string, any>;
  pipeline?: Record<string, any>[];
  field?: string;
  output_variable?: string;
  assertion?: AssertionConfig;
  extractions?: ExtractionRule[];
}

/**
 * UI配置
 * 对应节点定义中的 UIConfig
 */
export interface UIConfig {
  operation?: string;
  selector?: string;
  selector_type?: string;
  timeout?: number;
  browser_type?: string;
  headless?: boolean;
  viewport?: Viewport;
  args?: string[];
  // Midscene AI 自动化相关字段
  action_type?: string;
  natural_language_command?: string;
  data_structure?: Record<string, any>;
  url?: string;
}

/**
 * 变量提取配置
 * 对应节点定义中的 VariableExtractorConfig
 */
export interface VariableExtractorConfig {
  extractions?: ExtractionRule[];
}

/**
 * 休眠节点配置
 * 对应节点定义中的 SleepConfig
 */
export interface SleepConfig {
  duration?: number | string;  // 休眠时间（必填，支持数字或字符串变量）
  reason?: string;  // 休眠原因（可选，字符串）
  unit?: 'seconds' | 'milliseconds';  // 时间单位（可选，默认seconds）
  mode?: 'blocking' | 'non_blocking' | 'async';  // 休眠模式（可选，默认blocking）
  max_duration?: number;  // 最大休眠时间限制（可选，默认3600秒）
}

/**
 * 注释节点配置（前端UI用）
 */
export interface CommentConfig {
  text?: string;
}

// ========== 节点配置联合类型 ==========

export type NodeConfig = 
  | HttpConfig
  | SqlConfig
  | ScriptConfig
  | LogConfig
  | ConditionConfig
  | LoopConfig
  | SleepConfig
  | DubboConfig
  | OssConfig
  | XxlJobConfig
  | MqConfig
  | SubWorkflowConfig
  | RedisConfig
  | MongoDBConfig
  | UIConfig
  | VariableExtractorConfig
  | AssertionConfig
  | CommentConfig
  | Record<string, unknown>;

// ========== 节点数据结构 ==========

/**
 * 节点数据
 * 注意：config 字段存储的就是标准格式，直接对应 step_config
 */
export interface WorkflowNodeData {
  id: string;
  type: NodeType;
  name: string;  // 对应 label
  description?: string;
  config: NodeConfig;  // 标准格式，直接存储到 step_config
  // 位置信息（前端UI用，不存储到 step_config）
  x: number;
  y: number;
  // 引用模式相关字段
  refMode?: 'NONE' | 'COPY' | 'REF_METADATA' | 'REF_WORKFLOW';  // 引用模式，默认 'NONE'
  refMetadataId?: string;  // 关联的元数据ID（当 refMode 为 'REF_METADATA' 时使用）
  refWorkflowId?: string;  // 关联的子工作流ID（当 refMode 为 'REF_WORKFLOW' / 节点类型为 SUB_WORKFLOW 时使用）
  // 可选字段（前端UI用）
  extract?: Array<{ source: string; target: string }>;  // 顶层 extract（简化格式，可选）
  validate?: Array<{ check: string; comparator: string; expect: any }>;  // 顶层 validate（简化格式，可选）
  next?: string[];  // 下一个节点ID列表（由连线决定，不存储到 step_config）
}

// ========== 连接线数据 ==========

export interface ConnectionData {
  id: string;
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
  label?: string;
  color?: string;
}

// ========== 工作流数据 ==========

export interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNodeData[];
  connections: ConnectionData[];
  globalVars?: Record<string, unknown>;
}

// ========== 节点元数据 ==========

export interface NodeMeta {
  type: NodeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'basic' | 'api' | 'data' | 'logic' | 'script' | 'comment' | 'ui' | 'other';
  disableSideSheet?: boolean;
  defaultConfig?: NodeConfig;
}

// ========== 节点注册表 ==========

export interface NodeRegistry {
  meta: NodeMeta;
  render: React.ComponentType<NodeRenderProps>;
  form: React.ComponentType<NodeFormProps>;
  validate?: (config: NodeConfig) => string | undefined;
  transformOnInit?: (data: unknown) => NodeConfig;
  transformOnSubmit?: (config: NodeConfig) => unknown;
}

export interface NodeRenderProps {
  node: WorkflowNodeData;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

export interface NodeFormProps {
  node: WorkflowNodeData;
  onChange: (config: NodeConfig) => void;
  onClose?: () => void;
}

// ========== 节点元数据注册表 ==========

export const NODE_META_REGISTRY: Record<NodeType, NodeMeta> = {
  [NodeType.START]: {
    type: NodeType.START,
    name: '开始',
    description: '工作流开始节点',
    icon: 'Play',
    color: '#10B981',
    category: 'basic',
    disableSideSheet: true,
  },
  [NodeType.END]: {
    type: NodeType.END,
    name: '结束',
    description: '工作流结束节点',
    icon: 'Square',
    color: '#EF4444',
    category: 'basic',
    disableSideSheet: true,
  },
  [NodeType.HTTP_REQUEST]: {
    type: NodeType.HTTP_REQUEST,
    name: 'HTTP 请求',
    description: 'HTTP API 调用',
    icon: 'Globe',
    color: '#3B82F6',
    category: 'api',
    defaultConfig: {
      method: 'GET',
      url: '',
      headers: {
        'x-app': 'sevc',
        'Content-Type': 'application/json',
        'x-site-tenant': 'US_AMZ',
        'Authentication-Token': '${get_token($email,$password,$url,$header_type)}',
      },
      params: {},
      timeout: 120,
      verify: true,
      allow_redirects: true,
    } as HttpConfig,
  },
  [NodeType.MYSQL]: {
    type: NodeType.MYSQL,
    name: 'SQL 查询',
    description: '数据库操作',
    icon: 'Database',
    color: '#8B5CF6',
    category: 'data',
    defaultConfig: {
      operation: 'select',
      sql: '',
      query_type: 'fetchmany',
      connection: {
        charset: 'utf8mb4',
        connect_timeout: 10,
        read_timeout: 30,
        write_timeout: 30,
      },
    } as SqlConfig,
  },
  [NodeType.DUBBO]: {
    type: NodeType.DUBBO,
    name: 'Dubbo 调用',
    description: 'Dubbo RPC 调用',
    icon: 'Zap',
    color: '#F59E0B',
    category: 'api',
    defaultConfig: {
      url: '',
      interface_name: '',
      method_name: '',
      site_tenant: '',
    } as DubboConfig,
  },
  [NodeType.CONDITION]: {
    type: NodeType.CONDITION,
    name: '条件判断',
    description: '条件分支节点',
    icon: 'GitBranch',
    color: '#F59E0B',
    category: 'logic',
    defaultConfig: {
      expression: '',
    } as ConditionConfig,
  },
  [NodeType.LOOP]: {
    type: NodeType.LOOP,
    name: '循环',
    description: '循环执行节点',
    icon: 'Repeat',
    color: '#EC4899',
    category: 'logic',
    defaultConfig: {
      loop_type: 'count_loop',
      count: 10,
      item_variable: 'item',
      index_variable: 'index',
      output_variable: 'loop_result',
    } as LoopConfig,
  },
  [NodeType.SLEEP]: {
    type: NodeType.SLEEP,
    name: '休眠',
    description: '暂停指定时间',
    icon: 'Clock',
    color: '#6366F1',
    category: 'logic',
    defaultConfig: {
      duration: 1,
      unit: 'seconds',
      mode: 'blocking',
      reason: '流程暂停',
    } as SleepConfig,
  },
  [NodeType.SCRIPT]: {
    type: NodeType.SCRIPT,
    name: '脚本执行',
    description: '执行自定义脚本',
    icon: 'Code',
    color: '#10B981',
    category: 'script',
    defaultConfig: {
      script: '',
      type: 'python',
    } as ScriptConfig,
  },
  [NodeType.LOG_MESSAGE]: {
    type: NodeType.LOG_MESSAGE,
    name: '日志消息',
    description: '输出日志消息',
    icon: 'FileText',
    color: '#6366F1',
    category: 'other',
    defaultConfig: {
      message: '',
      level: 'INFO',
    } as LogConfig,
  },
  [NodeType.ASSERTION]: {
    type: NodeType.ASSERTION,
    name: '断言',
    description: '断言验证',
    icon: 'CheckCircle',
    color: '#10B981',
    category: 'logic',
    defaultConfig: {
      rules: [],
    } as AssertionConfig,
  },
  [NodeType.VARIABLE_EXTRACTOR]: {
    type: NodeType.VARIABLE_EXTRACTOR,
    name: '变量提取',
    description: '提取变量',
    icon: 'Variable',
    color: '#6366F1',
    category: 'logic',
    defaultConfig: {
      extractions: [],
    } as VariableExtractorConfig,
  },
  [NodeType.COMMENT]: {
    type: NodeType.COMMENT,
    name: '注释',
    description: '添加注释说明',
    icon: 'MessageSquare',
    color: '#FCD34D',
    category: 'comment',
    defaultConfig: {
      text: '',
    } as CommentConfig,
  },
  // 其他节点类型的默认配置可以后续添加
  [NodeType.ROCKETMQ]: {
    type: NodeType.ROCKETMQ,
    name: 'RocketMQ',
    description: '消息队列',
    icon: 'MessageSquare',
    color: '#8B5CF6',
    category: 'other',
    defaultConfig: {} as MqConfig,
  },
  [NodeType.SUB_WORKFLOW]: {
    type: NodeType.SUB_WORKFLOW,
    name: '子工作流',
    description: '调用子工作流',
    icon: 'Workflow',
    color: '#10B981',
    category: 'logic',
    defaultConfig: {} as SubWorkflowConfig,
  },
  [NodeType.REDIS]: {
    type: NodeType.REDIS,
    name: 'Redis',
    description: 'Redis 操作',
    icon: 'Database',
    color: '#DC2626',
    category: 'data',
    defaultConfig: {} as RedisConfig,
  },
  [NodeType.MONGODB]: {
    type: NodeType.MONGODB,
    name: 'MongoDB',
    description: 'MongoDB 操作',
    icon: 'Database',
    color: '#10B981',
    category: 'data',
    defaultConfig: {} as MongoDBConfig,
  },
  [NodeType.OSS]: {
    type: NodeType.OSS,
    name: 'OSS',
    description: '对象存储',
    icon: 'Cloud',
    color: '#3B82F6',
    category: 'other',
    defaultConfig: {} as OssConfig,
  },
  [NodeType.XXLJOB]: {
    type: NodeType.XXLJOB,
    name: 'XXL-Job',
    description: '任务调度',
    icon: 'Clock',
    color: '#F59E0B',
    category: 'other',
    defaultConfig: {
      executor_handler: '',
      site_tenant: 'DEFAULT',
    } as XxlJobConfig,
  },
  [NodeType.UI_BROWSER]: {
    type: NodeType.UI_BROWSER,
    name: 'UI 浏览器',
    description: '浏览器操作',
    icon: 'Monitor',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_ELEMENT]: {
    type: NodeType.UI_ELEMENT,
    name: 'UI 元素',
    description: '元素操作',
    icon: 'MousePointer',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_NAVIGATION]: {
    type: NodeType.UI_NAVIGATION,
    name: 'UI 导航',
    description: '页面导航',
    icon: 'Navigation',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_SCREENSHOT]: {
    type: NodeType.UI_SCREENSHOT,
    name: 'UI 截图',
    description: '页面截图',
    icon: 'Camera',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_WAIT]: {
    type: NodeType.UI_WAIT,
    name: 'UI 等待',
    description: '等待操作',
    icon: 'Clock',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_VALIDATION]: {
    type: NodeType.UI_VALIDATION,
    name: 'UI 验证',
    description: 'UI 验证',
    icon: 'CheckCircle',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_ACTION]: {
    type: NodeType.UI_ACTION,
    name: 'UI 动作',
    description: 'UI 动作',
    icon: 'Zap',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_RECORDING]: {
    type: NodeType.UI_RECORDING,
    name: 'UI 录制',
    description: 'UI 录制',
    icon: 'Video',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
  [NodeType.UI_ADVANCED]: {
    type: NodeType.UI_ADVANCED,
    name: 'UI 高级',
    description: 'UI 高级功能',
    icon: 'Settings',
    color: '#3B82F6',
    category: 'ui',
    defaultConfig: {} as UIConfig,
  },
};
