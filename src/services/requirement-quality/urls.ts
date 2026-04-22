/**
 * 需求质量视图 API 路径（后端 /metrics/requirement-quality）
 */

const BASE = '/metrics/requirement-quality';

export const REQUIREMENT_QUALITY_URLS = {
  LIST: `${BASE}/list`,
  OVERVIEW: `${BASE}/overview`,
  DETAIL: (storyId: string) => `${BASE}/detail/${storyId}`,
  FILTER_OPTIONS: `${BASE}/filter-options`,
  /** 需求库关键词搜索（完整需求库，供门禁补全弹窗） */
  STORY_SEARCH: `${BASE}/story-search`,
  /** 根据需求 ID 列表批量查需求名称（供缺陷列表等展示） */
  STORY_NAMES: `${BASE}/story-names`,
};
