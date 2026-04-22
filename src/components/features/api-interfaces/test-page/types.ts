/**
 * TestPage 相关类型定义
 */

export interface HeaderParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface BodyParam {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

/** 用于 executeSend 的表单快照，避免闭包陈旧 */
export interface TestPageFormSnapshot {
  method: string;
  url: string;
  noDomain: boolean;
  headers: HeaderParam[];
  queryParams: QueryParam[];
  bodyParams: BodyParam[];
  rawBody: string;
  jsonBody: string;
  bodyType: string;
}
