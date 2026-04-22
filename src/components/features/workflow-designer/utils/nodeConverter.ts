/**
 * Node Converter 工具函数
 * 节点转换相关的工具函数
 * 从 WorkflowDesignPageV2.tsx 提取
 */

import { toast } from 'sonner';
import type { MetadataDefinition } from '@/services/metadata';
import type { WorkflowNodeData } from '@/components/workflow';
import { NodeType, type HttpConfig, type SqlConfig, type DubboConfig, type MqConfig } from '@/components/workflow';

// 生成唯一ID
export const generateId = () =>
  `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * 转换 HTTP 配置为请求配置格式
 * 用于调试节点时发送到后端
 */
export function convertHttpConfigToRequestConfig(config: HttpConfig): any {
  // 先构建一个基础配置，确保调试时不会丢失与请求无关的关键字段（断言、提取、鉴权等）
  const baseConfig: any = {
    method: config.method || 'GET',
    url: config.url || '',
    path: config.path || '',
    headers: config.headers || {},
    params: config.params || {},
    path_params: config.path_params || {},
    timeout: config.timeout,
    verify: config.verify,
    verify_ssl: config.verify_ssl,
    allow_redirects: config.allow_redirects,
    follow_redirects: config.follow_redirects,
    credential_id: config.credential_id || config.credential,
    auth: config.auth || config.auth_config,
    assertion: config.assertion,
    extractions: config.extractions,
    cookies: config.cookies,
  };

  // 统一确定 bodyType / paramType
  const bodyType = config.bodyType || (config as any).paramType || 'json';
  const requestConfig: any = {
    ...baseConfig,
    bodyType,
    // 后端部分逻辑依赖 paramType，保持与 bodyType 一致
    paramType: (config as any).paramType || bodyType,
  };

  // 按 bodyType 映射到执行机期望的字段
  if (bodyType === 'json') {
    if (config.json !== undefined && config.json !== null && config.json !== '') {
      requestConfig.json = config.json;
    } else if (config.body !== undefined && config.body !== null && config.body !== '') {
      requestConfig.json = config.body;
    }
  } else if (
    bodyType === 'data' ||
    bodyType === 'form-data' ||
    bodyType === 'x-www-form-urlencoded'
  ) {
    if (config.data !== undefined && config.data !== null && config.data !== '') {
      requestConfig.data = config.data;
    } else if (config.body !== undefined && config.body !== null && config.body !== '') {
      requestConfig.data = config.body;
    }
    // 归一化为 data，执行机那边根据 data 作为表单字段
    requestConfig.bodyType = 'data';
  } else if (bodyType === 'params') {
    if (config.params !== undefined && config.params !== null) {
      requestConfig.params = config.params;
    }
  } else if (bodyType === 'upload') {
    // ⭐ 关键：upload 调试时必须显式下发 upload/files + data，不能只塞到 body 里
    const upload = config.upload ?? (config as any).files;
    if (upload) {
      requestConfig.upload = upload;
      requestConfig.files = upload;
    }
    if (config.data !== undefined && config.data !== null && config.data !== '') {
      // data 作为 multipart 的文本字段，例如 name/filename/variationType
      requestConfig.data = config.data;
    }
    // 不再使用 body 承载 fileId，交给执行机的 files 字段处理
    delete requestConfig.body;
  } else {
    // 兜底：保持原有字段，尽量不破坏历史行为
    if (config.json !== undefined) {
      requestConfig.json = config.json;
    }
    if (config.data !== undefined) {
      requestConfig.data = config.data;
    }
    const upload = config.upload ?? (config as any).files;
    if (upload) {
      requestConfig.upload = upload;
      requestConfig.files = upload;
    }
  }

  return requestConfig;
}

/**
 * 将元数据定义转换为工作流节点
 * 返回新创建的节点数据（不包含状态更新）
 */
export function convertDefinitionToNode(
  definition: MetadataDefinition,
  existingNodes: WorkflowNodeData[] = []
): WorkflowNodeData | null {
  try {
    const maxY =
      existingNodes.length > 0
        ? Math.max(...existingNodes.map((n) => n.y)) + 200
        : 100;

    let nodeType: NodeType;
    let nodeConfig: any;
    const nodeName: string = definition.name || '未命名节点';

    // 解析requestConfig（可能是字符串或对象）
    let requestConfig: any = {};
    if (definition.requestConfig) {
      try {
        requestConfig =
          typeof definition.requestConfig === 'string'
            ? JSON.parse(definition.requestConfig)
            : definition.requestConfig;
      } catch (error) {
        console.error(
          '[convertDefinitionToNode] 解析requestConfig失败:',
          error,
          definition.requestConfig
        );
        requestConfig = {};
      }
    }

    // 根据protocol类型转换为对应的节点类型和配置
    switch (definition.protocol) {
      case 'HTTP': {
        nodeType = NodeType.HTTP_REQUEST;

        // 根据bodyType将body转换为对应的json/data/params/upload字段
        const bodyType = requestConfig.bodyType || 'json';
        const body = requestConfig.body;

        let json: any = undefined;
        let data: any = undefined;
        let upload: any = undefined;
        let params: any = undefined;

        if (body !== undefined && body !== null) {
          if (bodyType === 'json' || bodyType === 'application/json') {
            json = body;
          } else if (
            bodyType === 'data' ||
            bodyType === 'form-data' ||
            bodyType === 'x-www-form-urlencoded'
          ) {
            data = body;
          } else if (
            bodyType === 'upload' ||
            bodyType === 'multipart/form-data'
          ) {
            upload = body;
          } else if (bodyType === 'params') {
            params = body;
          } else {
            json = body;
          }
        } else {
          if (requestConfig.json !== undefined) {
            json = requestConfig.json;
          } else if (requestConfig.data !== undefined) {
            data = requestConfig.data;
          } else if (
            requestConfig.upload !== undefined ||
            requestConfig.files !== undefined
          ) {
            upload = requestConfig.upload || requestConfig.files;
          } else if (requestConfig.params !== undefined) {
            params = requestConfig.params;
          }
        }

        const defaultHeaders = {
          'x-app': 'sevc',
          'Content-Type': 'application/json',
          'x-site-tenant': 'US_AMZ',
          'Authentication-Token':
            '${get_token($email,$password,$url,$header_type)}',
        };

        const headers =
          requestConfig.headers && Object.keys(requestConfig.headers).length > 0
            ? { ...defaultHeaders, ...requestConfig.headers }
            : defaultHeaders;

        nodeConfig = {
          method: requestConfig.method || 'GET',
          url: requestConfig.url || '',
          path: requestConfig.path || '',
          headers: headers,
          queryParams: requestConfig.queryParams || {},
          ...(json !== undefined && { json }),
          ...(data !== undefined && { data }),
          ...(upload !== undefined && { upload, files: upload }),
          ...(params !== undefined && { params }),
          bodyType:
            bodyType === 'application/json'
              ? 'json'
              : bodyType === 'form-data' ||
                  bodyType === 'x-www-form-urlencoded'
                ? 'data'
                : bodyType === 'multipart/form-data'
                  ? 'upload'
                  : bodyType,
          timeout: requestConfig.timeout || 120,
          verify: requestConfig.verify !== false,
          allow_redirects: requestConfig.allow_redirects !== false,
        } as HttpConfig;
        break;
      }
      case 'SQL': {
        nodeType = NodeType.MYSQL;
        const sqlContent = definition.scriptContent || '';

        let operation: 'select' | 'insert' | 'update' | 'delete' | 'execute' =
          'select';
        if (sqlContent) {
          const sqlUpper = sqlContent.trim().toUpperCase();
          if (sqlUpper.startsWith('INSERT')) {
            operation = 'insert';
          } else if (sqlUpper.startsWith('UPDATE')) {
            operation = 'update';
          } else if (sqlUpper.startsWith('DELETE')) {
            operation = 'delete';
          } else if (
            sqlUpper.startsWith('CREATE') ||
            sqlUpper.startsWith('ALTER') ||
            sqlUpper.startsWith('DROP')
          ) {
            operation = 'execute';
          }
        }

        nodeConfig = {
          operation:
            requestConfig.operation || requestConfig.operationType || operation,
          sql: sqlContent || requestConfig.sql || '',
          params: requestConfig.params || [],
          connection: requestConfig.connection || {
            host: 'localhost',
            port: 3306,
            charset: 'utf8mb4',
            connect_timeout: 10,
            read_timeout: 30,
            write_timeout: 30,
          },
        } as SqlConfig;
        break;
      }
      case 'DUBBO': {
        nodeType = NodeType.DUBBO;
        const interfaceName =
          requestConfig.interfaceName || requestConfig.interface_name || '';
        const methodName =
          requestConfig.methodName || requestConfig.method_name || '';
        const siteTenant =
          requestConfig.siteTenant || requestConfig.site_tenant || '';
        const applicationName =
          requestConfig.applicationName || requestConfig.application_name || '';
        const dubboTag =
          requestConfig.dubboTag || requestConfig.dubbo_tag || '';

        let paramTypes: any[] = [];
        if (
          requestConfig.parameterTypes &&
          Array.isArray(requestConfig.parameterTypes)
        ) {
          paramTypes = requestConfig.parameterTypes;
        } else if (
          requestConfig.body &&
          typeof requestConfig.body === 'object' &&
          !Array.isArray(requestConfig.body)
        ) {
          paramTypes = Object.values(requestConfig.body).map((value: any) => {
            if (value && typeof value === 'object' && 'type' in value) {
              return value.type || 'java.lang.Object';
            } else if (typeof value === 'string') {
              return value;
            }
            return 'java.lang.Object';
          });
        }

        const params: any[] = Array.isArray(requestConfig.params)
          ? requestConfig.params
          : [];

        nodeConfig = {
          url:
            requestConfig.url ||
            requestConfig.dubboUrl ||
            requestConfig.dubbo_url ||
            '',
          interface_name: interfaceName,
          method_name: methodName,
          site_tenant: siteTenant,
          application_name: applicationName,
          dubbo_tag: dubboTag || undefined,
          params: params,
          param_types: paramTypes.length > 0 ? paramTypes : undefined,
          group: requestConfig.group || '',
          version: requestConfig.version || '',
          timeout: requestConfig.timeout,
        } as DubboConfig;
        break;
      }
      case 'ROCKETMQ': {
        nodeType = NodeType.ROCKETMQ;
        const topic = requestConfig.topic || '';
        const tag = requestConfig.tag || '';
        const key = requestConfig.key || '';
        const siteTenant =
          requestConfig.siteTenant || requestConfig.site_tenant || '';

        let messageBody = '';
        if (requestConfig.body) {
          if (typeof requestConfig.body === 'string') {
            messageBody = requestConfig.body;
          } else {
            messageBody = JSON.stringify(requestConfig.body, null, 2);
          }
        }

        nodeConfig = {
          topic: topic,
          tag: tag,
          key: key,
          message_body: messageBody,
          site_tenant: siteTenant,
          mq_url: requestConfig.mq_url || requestConfig.mqUrl || '',
        } as MqConfig;
        break;
      }
      default:
        nodeType = NodeType.HTTP_REQUEST;
        nodeConfig = {
          method: 'GET',
          url: '',
          headers: {},
          params: {},
        } as HttpConfig;
    }

    const newNode: WorkflowNodeData = {
      id: generateId(),
      type: nodeType,
      name: nodeName,
      description: definition.description || '',
      config: nodeConfig,
      x: 100 + Math.random() * 200,
      y: maxY,
      refMode: 'REF_METADATA',
      refMetadataId: definition.id,
    };

    return newNode;
  } catch (error: any) {
    console.error(
      '[convertDefinitionToNode] 转换节点失败:',
      error,
      definition
    );
    toast.error(`转换节点失败: ${error.message || '未知错误'}`);
    return null;
  }
}
