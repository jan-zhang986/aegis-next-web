/**
 * 云效流水线链接：从 other_info 解析 BUILD_NUMBER，生成 /pipelines/{id}/builds/{buildNumber}
 */

/** 从 other_info JSON 中解析 BUILD_NUMBER */
function getBuildNumberFromOtherInfo(otherInfo: string | null | undefined): string | null {
  if (!otherInfo?.trim()) return null;
  try {
    const obj = JSON.parse(otherInfo) as Record<string, unknown>;
    const v = obj?.BUILD_NUMBER;
    if (v == null) return null;
    return String(v);
  } catch {
    return null;
  }
}

/**
 * 云效流水线详情链接：
 * - 有 BUILD_NUMBER 时：https://flow.aliyun.com/pipelines/{id}/builds/{buildNumber}
 * - 否则：https://flow.aliyun.com/pipelines/{id}/current
 */
export function getPipelineFlowUrl(
  pipelineId: string,
  otherInfo: string | null | undefined
): string {
  const base = `https://flow.aliyun.com/pipelines/${pipelineId}`;
  const buildNumber = getBuildNumberFromOtherInfo(otherInfo);
  return buildNumber ? `${base}/builds/${buildNumber}` : `${base}/current`;
}
