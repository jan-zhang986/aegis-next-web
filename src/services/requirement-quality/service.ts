/**
 * 需求质量视图 - API 服务（对接后端 /metrics/requirement-quality）
 */

import { http } from '@/utils/request';
import { REQUIREMENT_QUALITY_URLS } from './urls';
import type {
  RequirementQualityListRequest,
  RequirementQualityListItemDTO,
  RequirementQualityOverviewDTO,
  RequirementQualityDetailDTO,
  RequirementQualityFilterOptionsDTO,
  Pager,
} from './types';

export const requirementQualityService = {
  /** 需求质量列表（分页） */
  list: async (
    request: RequirementQualityListRequest
  ): Promise<Pager<RequirementQualityListItemDTO[]>> => {
    const res = await http.post<Pager<RequirementQualityListItemDTO[]>>(
      REQUIREMENT_QUALITY_URLS.LIST,
      request
    );
    return res as Pager<RequirementQualityListItemDTO[]>;
  },

  /** 概览卡（本期需求数、平均工时偏差等） */
  overview: async (
    request: Omit<RequirementQualityListRequest, 'current' | 'pageSize'> & {
      current?: number;
      pageSize?: number;
    }
  ): Promise<RequirementQualityOverviewDTO> => {
    const res = await http.post<RequirementQualityOverviewDTO>(
      REQUIREMENT_QUALITY_URLS.OVERVIEW,
      { ...request, current: 1, pageSize: 1 }
    );
    return res as RequirementQualityOverviewDTO;
  },

  /** 需求质量详情（当前为概览块） */
  detail: async (storyId: string): Promise<RequirementQualityDetailDTO> => {
    const res = await http.get<RequirementQualityDetailDTO>(
      REQUIREMENT_QUALITY_URLS.DETAIL(storyId)
    );
    return res as RequirementQualityDetailDTO;
  },

  /** 筛选项：项目列表、需求列表、状态（供下拉接入） */
  filterOptions: async (): Promise<RequirementQualityFilterOptionsDTO> => {
    const res = await http.get<RequirementQualityFilterOptionsDTO>(
      REQUIREMENT_QUALITY_URLS.FILTER_OPTIONS
    );
    return res as RequirementQualityFilterOptionsDTO;
  },

  /** 需求库关键词搜索：从完整需求库按 story_id / story_name 模糊匹配；支持 creator 用于展示创建人 */
  storySearch: async (keyword: string): Promise<{ id: string; name: string; creator?: string }[]> => {
    if (!keyword?.trim()) return [];
    const res = await http.get<{ id: string; name: string; creator?: string }[]>(
      REQUIREMENT_QUALITY_URLS.STORY_SEARCH,
      { params: { keyword: keyword.trim() } }
    );
    return Array.isArray(res) ? res : [];
  },

  /** 根据需求 ID 列表批量查需求名称（供缺陷列表需求列展示） */
  getStoryNamesByIds: async (storyIds: string[]): Promise<Record<string, string>> => {
    if (!storyIds?.length) return {};
    const ids = [...new Set(storyIds.filter(Boolean))];
    const res = await http.post<{ id: string; name: string }[]>(REQUIREMENT_QUALITY_URLS.STORY_NAMES, ids);
    const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
    return list.reduce<Record<string, string>>((acc, o) => {
      if (o?.id != null) acc[o.id] = o.name ?? o.id;
      return acc;
    }, {});
  },

  /** 默认需求列表：不输入时展示（取需求质量列表第一页，供关联需求下拉默认选项） */
  getDefaultStoryOptions: async (): Promise<{ id: string; name: string; creator?: string }[]> => {
    try {
      const res = await http.post<Pager<RequirementQualityListItemDTO[]>>(
        REQUIREMENT_QUALITY_URLS.LIST,
        { current: 1, pageSize: 30 }
      );
      const list = res?.list;
      if (!Array.isArray(list)) return [];
      return list.map((item) => ({
        id: item.storyId,
        name: item.storyName ?? '',
        creator: item.owner ?? undefined,
      }));
    } catch {
      return [];
    }
  },
};
