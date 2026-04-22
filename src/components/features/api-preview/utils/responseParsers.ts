/**
 * 响应与对象结构解析
 */

export interface ParamItem {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  schema?: string;
}

/** 递归解析对象结构，提取字段信息 */
export function parseObjectStructure(
  obj: unknown,
  prefix = '',
  depth = 0
): ParamItem[] {
  const params: ParamItem[] = [];

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return params;
  }

  const o = obj as Record<string, unknown>;

  // JSON Schema 格式
  if (o.type === 'object' && o.properties) {
    const properties = o.properties as Record<string, unknown>;
    const requiredFields = (o.required as string[]) || [];
    Object.entries(properties).forEach(([key, value]: [string, unknown]) => {
      const fullName = prefix ? `${prefix}.${key}` : key;
      const isRequired = requiredFields.includes(key);
      const v = value as Record<string, unknown>;

      if (v.type === 'object' && v.properties) {
        params.push({
          name: fullName,
          type: 'object',
          required: isRequired,
          description: v.description as string | undefined,
        });
        if (depth < 3) {
          params.push(...parseObjectStructure(value, fullName, depth + 1));
        }
      } else if (v.type === 'array') {
        const itemType = (v.items as Record<string, unknown>)?.type || 'string';
        params.push({
          name: fullName,
          type: `array[${itemType}]`,
          required: isRequired,
          description: v.description as string | undefined,
        });
        const items = v.items as Record<string, unknown> | undefined;
        if (items?.type === 'object' && items?.properties && depth < 2) {
          params.push(...parseObjectStructure(items, `${fullName}[]`, depth + 1));
        }
      } else {
        params.push({
          name: fullName,
          type: (v.type as string) || 'string',
          required: isRequired,
          description: v.description as string | undefined,
        });
      }
    });
  } else {
    // 普通对象
    Object.entries(o).forEach(([key, value]) => {
      const fullName = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        const firstItem = value[0];
        if (firstItem && typeof firstItem === 'object' && firstItem !== null) {
          params.push({ name: fullName, type: 'array[object]', required: true });
          if (depth < 2) {
            params.push(...parseObjectStructure(firstItem, `${fullName}[]`, depth + 1));
          }
        } else {
          params.push({
            name: fullName,
            type: `array[${typeof firstItem || 'string'}]`,
            required: true,
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        params.push({ name: fullName, type: 'object', required: true });
        if (depth < 3) {
          params.push(...parseObjectStructure(value, fullName, depth + 1));
        }
      } else {
        params.push({
          name: fullName,
          type:
            typeof value === 'number'
              ? 'number'
              : typeof value === 'boolean'
                ? 'boolean'
                : 'string',
          required: true,
        });
      }
    });
  }

  return params;
}

export interface ParsedResponse {
  statusCode: number;
  contentType: string;
  isSuccess: boolean;
  body: unknown;
  params: ParamItem[];
  description?: string;
}

/** 解析单个响应定义 */
export function parseSingleResponse(
  responseDef: unknown,
  statusCode: number | string
): ParsedResponse {
  const def = (responseDef || {}) as Record<string, unknown>;
  const contentType =
    (def.contentType as string) ||
    (def.type as string) ||
    (def['content-type'] as string) ||
    'application/json';

  let responseBody: unknown = def.example ?? def.body ?? def.data;
  const schema = def.schema ?? (def.content as Record<string, unknown>)?.['application/json']?.schema;

  if (schema) {
    const s = schema as Record<string, unknown>;
    if (s.example !== undefined) {
      responseBody = s.example;
    } else if (s.type === 'object' && s.properties) {
      const props = s.properties as Record<string, unknown>;
      if (!responseBody) {
        const generated: Record<string, unknown> = {};
        Object.keys(props).forEach((key) => {
          const prop = props[key] as Record<string, unknown>;
          if (prop.example !== undefined) generated[key] = prop.example;
          else if (prop.type === 'string') generated[key] = '';
          else if (prop.type === 'number') generated[key] = 0;
          else if (prop.type === 'boolean') generated[key] = false;
          else if (prop.type === 'array') generated[key] = [];
          else if (prop.type === 'object') generated[key] = {};
        });
        responseBody = generated;
      }
    } else if (typeof schema === 'object' && !(schema as Record<string, unknown>).type) {
      responseBody = schema;
    }
  }

  if (!responseBody) responseBody = {};

  let actualStatusCode = typeof statusCode === 'string' ? parseInt(statusCode, 10) || 200 : statusCode;
  let actualResponseBody: unknown = responseBody;
  let dataForParsing: unknown = responseBody;

  const rb = responseBody as Record<string, unknown> | null;
  if (
    typeof responseBody === 'object' &&
    responseBody !== null &&
    !Array.isArray(responseBody) &&
    rb &&
    'code' in rb &&
    'data' in rb
  ) {
    const rc = rb.code;
    if (typeof rc === 'number') actualStatusCode = rc;
    else if (typeof rc === 'string') actualStatusCode = parseInt(rc, 10) || actualStatusCode;
    actualResponseBody = responseBody;
    if (rb.data != null) dataForParsing = rb.data;
  }

  const isSuccess = actualStatusCode >= 200 && actualStatusCode < 300;

  let responseParams: ParamItem[] = [];
  const sch = schema as Record<string, unknown> | undefined;

  if (sch?.type === 'object' && sch.properties) {
    responseParams = parseObjectStructure(schema);
  } else if (typeof dataForParsing === 'object' && dataForParsing !== null) {
    const isStandard =
      rb &&
      typeof responseBody === 'object' &&
      !Array.isArray(responseBody) &&
      'code' in rb &&
      'data' in rb;

    if (isStandard && rb) {
      const dataParams = parseObjectStructure(dataForParsing);
      const topLevelParams: ParamItem[] = [];
      Object.keys(rb).forEach((key) => {
        if (key === 'data') {
          topLevelParams.push({ name: 'data', type: 'object', required: true });
        } else if (key === 'code') {
          topLevelParams.push({ name: 'code', type: 'number', required: true });
        } else if (key === 'msg') {
          const v = rb[key];
          topLevelParams.push({
            name: 'msg',
            type: typeof v === 'object' && v !== null ? 'object' : 'string',
            required: false,
          });
        } else if (key === 'tracerId') {
          topLevelParams.push({ name: 'tracerId', type: 'string', required: false });
        } else {
          const v = rb[key];
          let t = 'string';
          if (typeof v === 'number') t = 'number';
          else if (typeof v === 'boolean') t = 'boolean';
          else if (Array.isArray(v)) t = 'array';
          else if (typeof v === 'object' && v !== null) t = 'object';
          topLevelParams.push({ name: key, type: t, required: false });
        }
      });
      responseParams = [
        ...topLevelParams,
        ...dataParams.map((p) => ({ ...p, name: `data.${p.name}` })),
      ];
    } else {
      responseParams = parseObjectStructure(responseBody);
    }
  }

  return {
    statusCode: actualStatusCode,
    contentType,
    isSuccess,
    body: actualResponseBody,
    params: responseParams,
    description: def.description as string | undefined,
  };
}

/** 解析 DUBBO responseConfig.body 结构 */
export function parseDubboResponseBody(
  body: unknown
): Array<{ name: string; type: string; required: boolean; schema?: string }> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.entries(body as Record<string, unknown>).map(([key, value]: [string, unknown]) => {
    const v = value as Record<string, unknown> | undefined;
    if (v && typeof v === 'object' && 'type' in v) {
      return {
        name: key,
        type: (v.type as string) || 'java.lang.Object',
        required: true,
        schema: v.schema as string | undefined,
      };
    }
    return {
      name: key,
      type: typeof value === 'string' ? value : 'java.lang.Object',
      required: true,
    };
  });
}

/** 生成 DUBBO 响应示例 */
export function generateDubboResponseExample(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const example: Record<string, unknown> = {};
  Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
    const v = value as Record<string, unknown> | undefined;
    if (v && typeof v === 'object' && 'type' in v) {
      const t = (v.type as string) || 'java.lang.Object';
      if (t === 'java.lang.String') example[key] = '';
      else if (t === 'java.lang.Integer' || t === 'java.lang.Long') example[key] = 0;
      else if (t === 'java.lang.Boolean') example[key] = false;
      else if (t.startsWith('java.util.List')) example[key] = [];
      else if (t.startsWith('java.util.Map')) example[key] = {};
      else example[key] = null;
    } else {
      example[key] = null;
    }
  });
  return example;
}
