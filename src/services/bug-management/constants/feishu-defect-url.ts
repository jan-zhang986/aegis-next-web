/**
 * 飞书项目缺陷相关 URL
 * - 缺陷详情：使用落库的缺陷 ID 拼接
 * - 创建缺陷：跳转飞书缺陷首页
 */
const FEISHU_DEFECT_DETAIL_BASE = 'https://project.feishu.cn/spotter-tech/bug/detail';
const FEISHU_DEFECT_DETAIL_QUERY = 'parentUrl=%2Fspotter-tech%2Fbug%2Fhomepage&openScene=4';

/** 飞书缺陷首页（创建 Bug / 无关联需求时跳转） */
export const FEISHU_BUG_HOMEPAGE_URL = 'https://project.feishu.cn/spotter-tech/bug/homepage';

/** 飞书需求详情页 query 与 hash（测试计划有关联需求时跳转，id 为飞书需求 id） */
const FEISHU_STORY_DETAIL_BASE = 'https://project.feishu.cn/spotter-tech/story/detail';
const FEISHU_STORY_DETAIL_QUERY = 'parentUrl=%2Fspotter-tech%2Fbug%2Fhomepage&openScene=2&tabKey=issue_management_new#issue_management_new';
/** 测试计划页「关联飞书需求」跳转用：仅 parentUrl + openScene=2 */
const FEISHU_STORY_DETAIL_QUERY_PLAN = 'parentUrl=%2Fspotter-tech%2Fbug%2Fhomepage&openScene=2';

/**
 * 根据飞书需求 ID 生成飞书需求详情页链接
 */
export function getFeishuStoryDetailUrl(storyId: string): string {
  if (!storyId) return '';
  return `${FEISHU_STORY_DETAIL_BASE}/${encodeURIComponent(storyId)}?${FEISHU_STORY_DETAIL_QUERY}`;
}

/**
 * 测试计划详情页「关联飞书需求」跳转链接（需求 ID 为飞书需求 id）
 */
export function getFeishuStoryDetailUrlForPlan(storyId: string): string {
  if (!storyId) return '';
  return `${FEISHU_STORY_DETAIL_BASE}/${encodeURIComponent(storyId)}?${FEISHU_STORY_DETAIL_QUERY_PLAN}`;
}

/**
 * 根据缺陷 ID（飞书 work_item id 或平台缺陷 id）生成飞书缺陷详情页链接
 */
export function getFeishuDefectDetailUrl(defectId: string): string {
  if (!defectId) return '';
  return `${FEISHU_DEFECT_DETAIL_BASE}/${encodeURIComponent(defectId)}?${FEISHU_DEFECT_DETAIL_QUERY}`;
}
