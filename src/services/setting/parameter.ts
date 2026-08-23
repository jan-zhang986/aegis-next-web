/**
 * 系统设置-系统参数 API（与 AegisOne 路径一致）
 */
import { http } from '@/utils/request';
import type {
  BaseConfig,
  EmailConfig,
  SaveInfoParams,
  TestEmailParams,
  CleanupConfig,
  PageConfig,
  AuthItem,
  AuthListParams,
  AuthListResult,
  AuthParams,
  QrCodeItem,
  LarkInfo,
  PlatformSource,
  ModelConfigItem,
  ModelConfigListParams,
  ModelConfigListResult,
} from '@/types/setting/parameter';

const PREFIX = '/system/parameter';

export const systemParameterService = {
  /** 获取基础信息 */
  getBaseInfo: (): Promise<BaseConfig> => {
    return http.get(`${PREFIX}/get/base-info`).then((res: any) => res?.data ?? res ?? {});
  },

  /** 保存基础信息 */
  saveBaseInfo: (data: SaveInfoParams): Promise<void> => {
    return http.post(`${PREFIX}/save/base-info`, data);
  },

  /** 获取邮件配置 */
  getEmailInfo: (): Promise<EmailConfig> => {
    return http.get(`${PREFIX}/get/email-info`).then((res: any) => res?.data ?? res ?? {});
  },

  /** 保存邮件配置 */
  saveEmailInfo: (data: SaveInfoParams): Promise<void> => {
    return http.post(`${PREFIX}/edit/email-info`, data);
  },

  /** 测试邮件连接 */
  testEmail: (data: TestEmailParams): Promise<void> => {
    return http.post(`${PREFIX}/test/email`, data);
  },

  /** 保存上传配置（如文件大小限制） */
  saveUploadConfig: (data: SaveInfoParams): Promise<void> => {
    return http.post(`${PREFIX}/edit/upload-config`, data);
  },

  /** 获取内存清理配置 */
  getCleanupConfig: (): Promise<CleanupConfig> => {
    return http.get(`${PREFIX}/get/clean-config`).then((res: any) => res?.data ?? res ?? {});
  },

  /** 保存内存清理配置 */
  saveCleanupConfig: (data: SaveInfoParams): Promise<void> => {
    return http.post(`${PREFIX}/edit/clean-config`, data);
  },

  /** 获取页面配置 */
  getPageConfig: (): Promise<PageConfig> => {
    return http.get('/display/info').then((res: any) => res?.data ?? res ?? {});
  },

  /** 保存页面配置 */
  savePageConfig: (data: FormData): Promise<void> => {
    return http.post('/display/save', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** 获取认证配置列表 */
  getAuthList: (params: AuthListParams): Promise<AuthListResult> => {
    return http.post('/system/authsource/list', params).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
    }));
  },

  /** 获取认证配置详情 */
  getAuthDetail: (id: string): Promise<AuthItem> => {
    return http.get(`/system/authsource/get/${id}`).then((res: any) => res?.data ?? res ?? {});
  },

  /** 添加认证配置 */
  addAuth: (data: AuthParams): Promise<void> => {
    return http.post('/system/authsource/add', data);
  },

  /** 更新认证配置 */
  updateAuth: (data: AuthParams): Promise<void> => {
    return http.post('/system/authsource/update', data);
  },

  /** 更新认证配置状态 */
  updateAuthStatus: (id: string, enable: boolean): Promise<void> => {
    return http.post('/system/authsource/update/status', { id, enable });
  },

  /** 删除认证配置 */
  deleteAuth: (id: string): Promise<void> => {
    return http.get(`/system/authsource/delete/${id}`);
  },

  /** 获取二维码配置列表（与 aegis-next-server 一致：从平台接口拉取并合并本地平台列表） */
  getQrCodeList: (): Promise<QrCodeItem[]> => {
    return http.get('/setting/get/platform/info').then((res: any) => {
      const raw = res?.data ?? res;
      const data = Array.isArray(raw) ? raw : Array.isArray(raw?.list) ? raw.list : [];
      const sources: PlatformSource[] = data;
      const filterList: QrCodeItem[] = [
        { key: 'LARK', title: '飞书', description: '先进企业合作与管理平台', logo: 'lark', enable: false, hasConfig: false, valid: false, edit: false },
      ];
      filterList.forEach((item) => {
        const found = sources.find((s) => s.platform?.toUpperCase() === item.key);
        if (found) {
          item.enable = found.enable;
          item.valid = found.valid;
          item.hasConfig = found.hasConfig;
          item.edit = true;
        }
      });
      return filterList;
    }).catch(() => [
      { key: 'LARK', title: '飞书', description: '先进企业合作与管理平台', logo: 'lark', enable: false, hasConfig: false, valid: false, edit: true },
    ]);
  },

  /** 获取飞书配置（与 aegis-next-server getLarkInfo 一致） */
  getLarkInfo: (): Promise<LarkInfo> => {
    return http.get('/lark/info/with_detail').then((res: any) => {
      const d = res?.data ?? res ?? {};
      return {
        agentId: d.agentId ?? '',
        appSecret: d.appSecret ?? '',
        callBack: d.callBack ?? '',
        enable: !!d.enable,
        valid: !!d.valid,
      };
    });
  },

  /** 保存飞书配置 */
  saveLarkConfig: (data: LarkInfo): Promise<void> => {
    return http.post('/lark/save', data);
  },

  /** 校验飞书外链（测试链接） */
  validateLarkConfig: (data: LarkInfo): Promise<void> => {
    return http.post('/lark/validate', data);
  },

  /** 开启/关闭飞书登录 */
  enableLark: (data: { enable: boolean }): Promise<void> => {
    return http.post('/lark/enable', data);
  },

  /** 关闭飞书校验状态（校验失败时调用） */
  closeValidateLark: (): Promise<void> => {
    return http.post('/lark/change/validate');
  },

  /** 保存二维码配置（兼容旧调用，仅飞书时转 saveLarkConfig） */
  saveQrCodeConfig: (data: any): Promise<void> => {
    if (data?.key === 'LARK' || data?.key === 'lark') {
      return http.post('/lark/save', {
        agentId: data.agentId ?? data.appId ?? '',
        appSecret: data.appSecret ?? '',
        callBack: data.callBack ?? data.redirectUrl ?? '',
        enable: !!data.enable,
      });
    }
    return http.post(`${PREFIX}/edit/qr-config`, data);
  },

  /** 获取模型配置列表 */
  getModelConfigList: (params: ModelConfigListParams): Promise<ModelConfigListResult> => {
    return http.post('/ai/config/source/list', params).then((res: any) => ({
      total: res?.total ?? 0,
      list: res?.data ?? res?.list ?? [],
    }));
  },

  /** 获取模型配置详情 */
  getModelConfigDetail: (id: string): Promise<ModelConfigItem> => {
    return http.get(`/ai/config/get/${id}`).then((res: any) => res?.data ?? res ?? {});
  },

  /** 保存模型配置 */
  saveModelConfig: (data: ModelConfigItem): Promise<void> => {
    return http.post('/ai/config/edit-source', data);
  },

  /** 删除模型配置 */
  deleteModelConfig: (id: string): Promise<void> => {
    return http.get(`/ai/config/delete/${id}`);
  },
};
