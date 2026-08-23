/**
 * 组织模板 API（与 AegisOne 路径一致）
 */
import { http } from '@/utils/request';
import type {
  SceneType,
  OrganizeTemplateItem,
  ActionTemplateManage,
  DefinedFieldItem,
  AddOrUpdateFieldParams,
  WorkFlowStatusItem,
  OrdWorkStatusParams,
  SetStateTypeParams,
  UpdateWorkFlowSettingParams,
} from '@/types/setting/template';

const BASE = '';

/** 组织模板列表 */
export function getOrganizeTemplateList(organizationId: string, scene: SceneType): Promise<OrganizeTemplateItem[]> {
  return http.get(`${BASE}/organization/template/list/${organizationId}/${scene}`).then((res: any) => res?.data ?? res ?? []);
}

/** 组织模板详情 */
export function getOrganizeTemplateInfo(id: string): Promise<any> {
  return http.get(`${BASE}/organization/template/get/${id}`).then((res: any) => res?.data ?? res);
}

/** 创建组织模板 */
export function createOrganizeTemplate(data: ActionTemplateManage): Promise<any> {
  return http.post(`${BASE}/organization/template/add`, data);
}

/** 更新组织模板 */
export function updateOrganizeTemplate(data: ActionTemplateManage): Promise<any> {
  return http.post(`${BASE}/organization/template/update`, data);
}

/** 删除组织模板 */
export function deleteOrganizeTemplate(id: string): Promise<void> {
  return http.get(`${BASE}/organization/template/delete/${id}`);
}

/** 组织模板启用配置（各 scene 是否启用） */
export function getOrdTemplateState(organizationId: string): Promise<Record<string, boolean>> {
  return http.get(`${BASE}/organization/template/enable/config/${organizationId}`).then((res: any) => res?.data ?? res ?? {});
}

/** 关闭/开启组织模板 */
export function enableOrOffTemplate(organizationId: string, scene: SceneType): Promise<void> {
  return http.get(`${BASE}/organization/template/disable/${organizationId}/${scene}`);
}

// ---------- 自定义字段（组织） ----------

/** 获取自定义字段列表 */
export function getOrgFieldList(scopeId: string, scene: SceneType): Promise<DefinedFieldItem[]> {
  return http.get(`${BASE}/organization/custom/field/list/${scopeId}/${scene}`).then((res: any) => res?.data ?? res ?? []);
}

/** 新增或更新自定义字段 */
export function addOrUpdateOrgField(data: AddOrUpdateFieldParams): Promise<any> {
  if (data.id) {
    return http.post(`${BASE}/organization/custom/field/update`, data);
  }
  return http.post(`${BASE}/organization/custom/field/add`, data);
}

/** 删除自定义字段 */
export function deleteOrgField(id: string): Promise<void> {
  return http.get(`${BASE}/organization/custom/field/delete`, { params: { id } });
}

/** 获取自定义字段详情 */
export function getOrgFieldDetail(id: string): Promise<DefinedFieldItem> {
  return http.get(`${BASE}/organization/custom/field/get/${id}`).then((res: any) => res?.data ?? res);
}

// ---------- 工作流（组织） ----------

/** 获取工作流状态列表 */
export function getOrgWorkFlowList(scopeId: string, scene: SceneType): Promise<WorkFlowStatusItem[]> {
  return http.get(`${BASE}/organization/status/flow/setting/get/${scopeId}/${scene}`).then((res: any) => res?.data ?? res ?? []);
}

/** 创建工作流状态 */
export function createOrgWorkFlowStatus(data: OrdWorkStatusParams): Promise<WorkFlowStatusItem[]> {
  return http.post(`${BASE}/organization/status/flow/setting/status/add`, data).then((res: any) => res?.data ?? res ?? []);
}

/** 更新工作流状态 */
export function updateOrgWorkFlowStatus(data: OrdWorkStatusParams): Promise<WorkFlowStatusItem[]> {
  return http.post(`${BASE}/organization/status/flow/setting/status/update`, data).then((res: any) => res?.data ?? res ?? []);
}

/** 删除工作流状态 */
export function deleteOrgWorkFlowStatus(id: string): Promise<void> {
  return http.get(`${BASE}/organization/status/flow/setting/status/delete`, { params: { id } });
}

/** 设置工作流状态为初始/结束 */
export function setOrgWorkFlowState(data: SetStateTypeParams): Promise<void> {
  return http.post(`${BASE}/organization/status/flow/setting/status/definition/update`, data);
}

/** 工作流状态排序 */
export function setOrgWorkFlowStateSort(scopeId: string, scene: SceneType, ids: string[]): Promise<void> {
  return http.post(`${BASE}/organization/status/flow/setting/status/sort/${scopeId}/${scene}`, ids);
}

/** 更新状态流转 */
export function updateOrgWorkFlowStateFlow(data: UpdateWorkFlowSettingParams): Promise<void> {
  return http.post(`${BASE}/organization/status/flow/setting/status/flow/update`, data);
}

// ---------- 项目模板（与 AegisOne /project/template 对齐） ----------

/** 项目模板列表 */
export function getProjectTemplateList(projectId: string, scene: SceneType): Promise<OrganizeTemplateItem[]> {
  return http.get(`${BASE}/project/template/list/${projectId}/${scene}`).then((res: any) => res?.data ?? res ?? []);
}

/** 项目模板详情 */
export function getProjectTemplateInfo(id: string): Promise<any> {
  return http.get(`${BASE}/project/template/get/${id}`).then((res: any) => res?.data ?? res);
}

/** 创建项目模板 */
export function createProjectTemplate(data: ActionTemplateManage): Promise<any> {
  return http.post(`${BASE}/project/template/add`, data);
}

/** 更新项目模板 */
export function updateProjectTemplate(data: ActionTemplateManage): Promise<any> {
  return http.post(`${BASE}/project/template/update`, data);
}

/** 删除项目模板 */
export function deleteProjectTemplate(id: string): Promise<void> {
  return http.get(`${BASE}/project/template/delete/${id}`);
}

/** 项目模板启用配置 */
export function getProjectTemplateState(projectId: string): Promise<Record<string, boolean>> {
  return http.get(`${BASE}/project/template/enable/config/${projectId}`).then((res: any) => res?.data ?? res ?? {});
}

// ---------- 自定义字段（项目） ----------

/** 获取项目自定义字段列表 */
export function getProjectFieldList(scopeId: string, scene: SceneType): Promise<DefinedFieldItem[]> {
  return http.get(`${BASE}/project/custom/field/list/${scopeId}/${scene}`).then((res: any) => res?.data ?? res ?? []);
}

/** 新增或更新项目自定义字段 */
export function addOrUpdateProjectField(data: AddOrUpdateFieldParams): Promise<any> {
  if (data.id) {
    return http.post(`${BASE}/project/custom/field/update`, data);
  }
  return http.post(`${BASE}/project/custom/field/add`, data);
}

/** 删除项目自定义字段 */
export function deleteProjectField(id: string): Promise<void> {
  return http.get(`${BASE}/project/custom/field/delete`, { params: { id } });
}

/** 获取项目自定义字段详情 */
export function getProjectFieldDetail(id: string): Promise<DefinedFieldItem> {
  return http.get(`${BASE}/project/custom/field/get/${id}`).then((res: any) => res?.data ?? res);
}

// ---------- 工作流（项目） ----------

/** 获取项目工作流状态列表 */
export function getProjectWorkFlowList(scopeId: string, scene: SceneType): Promise<WorkFlowStatusItem[]> {
  return http.get(`${BASE}/project/status/flow/setting/get/${scopeId}/${scene}`).then((res: any) => res?.data ?? res ?? []);
}

/** 创建项目工作流状态 */
export function createProjectWorkFlowStatus(data: OrdWorkStatusParams): Promise<WorkFlowStatusItem[]> {
  return http.post(`${BASE}/project/status/flow/setting/status/add`, data).then((res: any) => res?.data ?? res ?? []);
}

/** 更新项目工作流状态 */
export function updateProjectWorkFlowStatus(data: OrdWorkStatusParams): Promise<WorkFlowStatusItem[]> {
  return http.post(`${BASE}/project/status/flow/setting/status/update`, data).then((res: any) => res?.data ?? res ?? []);
}

/** 删除项目工作流状态 */
export function deleteProjectWorkFlowStatus(id: string): Promise<void> {
  return http.get(`${BASE}/project/status/flow/setting/status/delete`, { params: { id } });
}

/** 设置项目工作流状态为初始/结束 */
export function setProjectWorkFlowState(data: SetStateTypeParams): Promise<void> {
  return http.post(`${BASE}/project/status/flow/setting/status/definition/update`, data);
}

/** 项目工作流状态排序 */
export function setProjectWorkFlowStateSort(scopeId: string, scene: SceneType, ids: string[]): Promise<void> {
  return http.post(`${BASE}/project/status/flow/setting/status/sort/${scopeId}/${scene}`, ids);
}

/** 更新项目状态流转 */
export function updateProjectWorkFlowStateFlow(data: UpdateWorkFlowSettingParams): Promise<void> {
  return http.post(`${BASE}/project/status/flow/setting/status/flow/update`, data);
}
