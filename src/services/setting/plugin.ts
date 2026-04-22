/**
 * 系统设置-插件管理 API（与 MeterSphere 路径一致）
 */
import { http } from '@/utils/request';
import type { PluginItem, UpdatePluginParams, PluginOptionsParams } from '@/types/setting/plugin';

const BASE = '/plugin';

export const pluginService = {
  /** 获取插件列表 */
  getPluginList: (): Promise<PluginItem[]> => {
    return http.get(`${BASE}/list`).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },

  /** 上传插件（文件上传） */
  uploadPlugin: (formData: FormData): Promise<PluginItem> => {
    return http.post(`${BASE}/add`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** 更新插件 */
  updatePlugin: (data: UpdatePluginParams): Promise<PluginItem> => {
    return http.post(`${BASE}/update`, data);
  },

  /** 删除插件 */
  deletePlugin: (id: string): Promise<void> => {
    return http.get(`${BASE}/delete/${id}`);
  },

  /** 获取插件脚本详情 */
  getScriptDetail: (pluginId: string, scriptId: string): Promise<any> => {
    return http.get(`${BASE}/script/get/${pluginId}/${scriptId}`);
  },

  /** 获取插件下拉选项 */
  getPluginOptions: (data: PluginOptionsParams): Promise<{ text: string; value: string }[]> => {
    return http.post(`${BASE}/options`, data).then((res: any) => {
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    });
  },
};
