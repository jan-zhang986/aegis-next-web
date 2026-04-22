/**
 * 系统设置-资源池 API（与 MeterSphere 路径一致）
 */
import { http } from '@/utils/request';
import type {
  ResourcePoolListParams,
  ResourcePoolListResult,
  ResourcePoolItem,
  AddResourcePoolParams,
  UpdateResourcePoolParams,
} from '@/types/setting/resource-pool';

const BASE = '/test/resource/pool';

function normalizeListResult(res: any, params: ResourcePoolListParams): ResourcePoolListResult {
  const data = res?.data ?? res?.list ?? res;
  const list = Array.isArray(data) ? data : [];
  return {
    total: res?.total ?? list.length,
    list,
    current: res?.current ?? params?.current ?? 1,
    pageSize: res?.pageSize ?? params?.pageSize ?? 10,
  };
}

export const resourcePoolService = {
  /** 获取资源池列表 */
  getPoolList: (params: ResourcePoolListParams): Promise<ResourcePoolListResult> => {
    return http.post(`${BASE}/page`, params).then((res) => normalizeListResult(res, params));
  },

  /** 获取资源池详情 */
  getPoolDetail: (poolId: string): Promise<ResourcePoolItem> => {
    return http.get(`${BASE}/detail`, { params: { id: poolId } }).then((res: any) => res?.data ?? res ?? {});
  },

  /** 创建资源池 */
  addPool: (data: AddResourcePoolParams): Promise<void> => {
    return http.post(`${BASE}/add`, data);
  },

  /** 更新资源池 */
  updatePool: (data: UpdateResourcePoolParams): Promise<void> => {
    return http.post(`${BASE}/update`, data);
  },

  /** 删除资源池 */
  deletePool: (poolId: string): Promise<void> => {
    return http.get(`${BASE}/delete/${poolId}`);
  },

  /** 启用/禁用资源池 */
  togglePoolStatus: (poolId: string): Promise<void> => {
    return http.post(`${BASE}/set/enable/${poolId}`);
  },
};
